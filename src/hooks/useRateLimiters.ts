import Bottleneck from 'bottleneck';
import { titleCase } from 'title-case';
import { useCallback, useState } from 'react';

import { parseRateLimitRule } from '../utils';

export default function useRateLimiters() {
  const [limiter, setLimiter] = useState<Bottleneck>();
  const [minTime, setMinTime] = useState(0);
  const [remainingRequests, setRemainingRequests] = useState(0);
  const [maxRequests, setMaxRequests] = useState(0);
  const setupRateLimiters = useCallback((headers: Headers) => {
    const ruleNames = headers.get('X-Rate-Limit-Rules');

    if (!ruleNames) {
      throw new Error('Missing X-Rate-Limit-Rules in response!');
    }

    const [ruleName] = ruleNames.split(',');
    const header = `X-Rate-Limit-${titleCase(ruleName)}`;
    const stateHeader = `${header}-State`;

    if (!headers.has(header)) {
      throw new Error(`Missing header ${header} in response`);
    }

    if (!headers.has(stateHeader)) {
      throw new Error(`Missing header ${stateHeader} in response`);
    }

    const rules = headers.get(header)?.split(',');
    const states = headers.get(stateHeader)?.split(',');

    if (!rules || !states) {
      throw new Error(`Invalid headers in response`);
    }

    let minTime = 250;
    let ruleInterval = 0;
    let remainingRequests = 0;
    let maxRequests = 0;

    for (let i = 0; i < rules.length; i++) {
      const parsedRule = parseRateLimitRule(rules[i]);
      const parsedState = parseRateLimitRule(states[i]);
      const ruleRate = Math.ceil((parsedRule[1] * 1e3) / parsedRule[0]);
      const interval = Math.ceil(parsedRule[1] * 1e3);

      console.log(
        `Rule ${i}: ${parsedRule[0]}/${parsedRule[1]}s = ${(parsedRule[0] / parsedRule[1]).toFixed(1)} req/sec (minTime: ${ruleRate}ms)`
      );

      if (ruleRate > minTime) {
        minTime = ruleRate;
        ruleInterval = interval;
        remainingRequests = parsedRule[0] - parsedState[0];
        maxRequests = parsedRule[0];
      }
    }

    console.log(
      `Setting limiter to ${(1000 / minTime).toFixed(1)} req/sec (${minTime}ms)`
    );
    console.log(`${remainingRequests} requests remaining`);

    setLimiter(
      new Bottleneck({
        maxConcurrent: 1,
        minTime,
        reservoir: remainingRequests,
        reservoirRefreshAmount: maxRequests,
        reservoirRefreshInterval: ruleInterval
      })
    );
    setRemainingRequests(remainingRequests);
    setMaxRequests(maxRequests);
    setMinTime(minTime);
  }, []);
  const getTimeEstimate = useCallback(
    (queryCount: number) => {
      const pauses = Math.ceil(
        Math.max(0, queryCount - remainingRequests) / maxRequests
      );
      const pauseTime = pauses * 3e2;
      const fetchTime = queryCount * (minTime / 1e3);

      return pauseTime + fetchTime;
    },
    [maxRequests, remainingRequests, minTime]
  );

  return {
    limiter,
    setupRateLimiters,
    getTimeEstimate
  };
}
