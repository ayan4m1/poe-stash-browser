import Bottleneck from 'bottleneck';
import { titleCase } from 'title-case';
import { useCallback, useState } from 'react';

import { parseRateLimitRule } from '../utils';

export default function useRateLimiters() {
  const [limiter, setLimiter] = useState<Bottleneck>(null);
  const setupRateLimiters = useCallback((headers: Headers) => {
    if (!headers.has('X-Rate-Limit-Rules')) {
      throw new Error('Missing X-Rate-Limit-Rules in response!');
    }

    const [ruleName] = headers.get('X-Rate-Limit-Rules').split(',');
    const header = `X-Rate-Limit-${titleCase(ruleName)}`;
    const stateHeader = `${header}-State`;

    if (!headers.has(header)) {
      throw new Error(`Missing header ${header} in response`);
    }

    if (!headers.has(stateHeader)) {
      throw new Error(`Missing header ${stateHeader} in response`);
    }

    let finalLimiter = new Bottleneck({ maxConcurrent: 1, minTime: 250 });

    const rules = headers.get(header).split(',');
    const states = headers.get(stateHeader).split(',');

    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i];
      const state = states[i];
      const parsedRule = parseRateLimitRule(rule);
      const parsedState = parseRateLimitRule(state);
      const newLimiter = new Bottleneck({
        reservoir: parsedRule[0],
        reservoirIncreaseAmount: parsedRule[0],
        reservoirIncreaseMaximum: parsedRule[0],
        reservoirIncreaseInterval: parsedRule[1] * 1e3
      });

      console.log(
        `Adding new limiter (${(parsedRule[0] / parsedRule[1]).toFixed(1)} req/sec)`
      );

      if (parsedState[0] > 0) {
        console.log(
          `Setting limiter to ${parsedState[0]}/${parsedRule[0]} requests`
        );
        newLimiter.incrementReservoir(-parsedState[0]);
      }

      finalLimiter = newLimiter.chain(finalLimiter);
    }

    setLimiter(finalLimiter);
  }, []);

  return { limiter, setupRateLimiters };
}
