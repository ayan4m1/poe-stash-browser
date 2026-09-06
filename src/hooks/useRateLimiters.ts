import Bottleneck from 'bottleneck';
import { titleCase } from 'title-case';
import { useCallback, useEffect, useRef, useState } from 'react';

import { parseRateLimitRule } from '../utils';

// bounded so that a limiter spends its reservoir at ~the moment a request is sent
const maxConcurrent = 1;
// small stagger on the innermost limiter so a burst does not open every socket at once
const baseMinTime = 100;
// headroom for clock skew and for the gap between spending a token and being counted
const safetyTime = 1e3;

type RateLimitRule = {
  hits: number;
  period: number;
  used: number;
  restricted: number;
};

type RuleLimiter = {
  rule: RateLimitRule;
  limiter: Bottleneck;
  pendingReturns: number;
};

export const parseRateLimitHeaders = (headers: Headers): RateLimitRule[] => {
  const ruleNames = headers.get('X-Rate-Limit-Rules');

  if (!ruleNames) {
    throw new Error('Missing X-Rate-Limit-Rules in response!');
  }

  const parsed: RateLimitRule[] = [];

  for (const ruleName of ruleNames.split(',')) {
    const header = `X-Rate-Limit-${titleCase(ruleName.trim())}`;
    const stateHeader = `${header}-State`;
    const rules = headers.get(header)?.split(',');
    const states = headers.get(stateHeader)?.split(',');

    if (!rules) {
      throw new Error(`Missing header ${header} in response`);
    }

    if (!states) {
      throw new Error(`Missing header ${stateHeader} in response`);
    }

    if (rules.length !== states.length) {
      throw new Error(`Mismatched ${header} and ${stateHeader} in response`);
    }

    for (let i = 0; i < rules.length; i++) {
      const [hits, period] = parseRateLimitRule(rules[i]);
      const [used, , restricted] = parseRateLimitRule(states[i]);

      parsed.push({ hits, period, used, restricted });
    }
  }

  return parsed;
};

export default function useRateLimiters() {
  const [limiter, setLimiter] = useState<Bottleneck>();
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const blocker = useRef<Bottleneck | undefined>(undefined);
  const ruleLimiters = useRef<RuleLimiter[]>([]);
  const allLimiters = useRef<Bottleneck[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Hand a spent token back exactly one period after it was spent. This is what
  // makes the reservoir a sliding window - a heartbeat-driven reservoirIncrease
  // refills on a clock unrelated to when requests went out, which lets a full
  // budget go out at the end of one interval and again at the start of the next.
  const scheduleReturn = useCallback((entry: RuleLimiter) => {
    entry.pendingReturns++;
    timers.current.push(
      setTimeout(
        () => {
          entry.pendingReturns--;
          entry.limiter.incrementReservoir(1);
        },
        entry.rule.period * 1e3 + safetyTime
      )
    );
  }, []);

  const teardown = useCallback(() => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }

    for (const oldLimiter of allLimiters.current) {
      oldLimiter.disconnect();
    }

    timers.current = [];
    ruleLimiters.current = [];
    allLimiters.current = [];
    blocker.current = undefined;
  }, []);

  useEffect(() => teardown, [teardown]);

  const setupRateLimiters = useCallback(
    (headers: Headers) => {
      teardown();

      const parsed = parseRateLimitHeaders(headers);
      // innermost link - runs the actual request
      const base = new Bottleneck({ maxConcurrent, minTime: baseMinTime });
      const created: RuleLimiter[] = [];

      let chained = base;

      for (const rule of parsed) {
        const ruleLimiter = new Bottleneck({
          // without this the reservoir empties into the downstream queue at once
          // and stops describing when requests are actually sent
          maxConcurrent,
          reservoir: Math.max(0, rule.hits - rule.used)
        });
        const entry: RuleLimiter = {
          rule,
          limiter: ruleLimiter,
          pendingReturns: 0
        };

        // fires as the reservoir is decremented, unlike executing which fires
        // once the job has waited out minTime
        ruleLimiter.on('scheduled', () => scheduleReturn(entry));

        // The hits the server has already counted age out too, but we cannot know
        // when they happened, so give them back a full period from now.
        for (let i = 0; i < rule.used; i++) {
          scheduleReturn(entry);
        }

        console.log(
          `Rule: ${rule.hits} per ${rule.period}s, ${Math.max(0, rule.hits - rule.used)} available now`
        );

        created.push(entry);
        chained = ruleLimiter.chain(chained);
      }

      // outermost link - parks every request while we are restricted
      const blockLimiter = new Bottleneck({ maxConcurrent });

      chained = blockLimiter.chain(chained);

      blocker.current = blockLimiter;
      ruleLimiters.current = created;
      allLimiters.current = [
        base,
        ...created.map(({ limiter: ruleLimiter }) => ruleLimiter),
        blockLimiter
      ];

      setRules(parsed);
      setLimiter(chained);
    },
    [teardown, scheduleReturn]
  );

  const blockRequests = useCallback((seconds: number) => {
    if (!blocker.current || seconds <= 0) {
      return;
    }

    console.warn(`Rate limited, holding requests for ${seconds}s`);

    blocker.current.updateSettings({ reservoir: 0 });
    timers.current.push(
      setTimeout(
        () => blocker.current?.updateSettings({ reservoir: null }),
        seconds * 1e3 + safetyTime
      )
    );
  }, []);

  // Every response restates the server's view of each window. Anything it counted
  // that we did not send came from another client on this account or IP, so spend
  // the difference and queue its return the same way we do our own.
  const syncFromHeaders = useCallback(
    (headers: Headers) => {
      if (!ruleLimiters.current.length || !headers.has('X-Rate-Limit-Rules')) {
        return;
      }

      let parsed: RateLimitRule[];

      try {
        parsed = parseRateLimitHeaders(headers);
      } catch {
        return;
      }

      if (parsed.length !== ruleLimiters.current.length) {
        console.warn('Rate limit rules changed, ignoring state update');
        return;
      }

      for (let i = 0; i < parsed.length; i++) {
        const { used, restricted } = parsed[i];
        const entry = ruleLimiters.current[i];

        if (restricted > 0) {
          blockRequests(restricted);
          continue;
        }

        const drift = used - entry.pendingReturns;

        if (drift > 0) {
          entry.limiter.incrementReservoir(-drift);

          for (let j = 0; j < drift; j++) {
            scheduleReturn(entry);
          }
        }
      }
    },
    [blockRequests, scheduleReturn]
  );

  const getTimeEstimate = useCallback(
    (queryCount: number) => {
      if (!rules.length || queryCount <= 0) {
        return 0;
      }

      return Math.max(
        (queryCount * baseMinTime) / (maxConcurrent * 1e3),
        ...rules.map(({ hits, period, used }) => {
          const available = Math.max(0, hits - used);

          return queryCount <= available
            ? 0
            : Math.ceil((queryCount - available) / hits) * period;
        })
      );
    },
    [rules]
  );

  return {
    limiter,
    setupRateLimiters,
    syncFromHeaders,
    blockRequests,
    getTimeEstimate
  };
}
