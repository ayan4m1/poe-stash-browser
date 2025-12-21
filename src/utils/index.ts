import Bottleneck from 'bottleneck';
import { titleCase } from 'title-case';
import { TAuthConfig } from 'react-oauth2-code-pkce';

export const baseAuthUrl = 'https://www.pathofexile.com/';
export const baseApiUrl = 'https://api.pathofexile.com/';

export const authConfig: TAuthConfig = {
  clientId: 'stashr',
  authorizationEndpoint: `${baseAuthUrl}oauth/authorize`,
  tokenEndpoint: `${baseAuthUrl}oauth/token`,
  redirectUri: 'http://localhost:3000/main_window/index.html',
  scope: 'account:profile account:leagues account:stashes',
  autoLogin: false,
  decodeToken: false
};

export const rateLimiters: Bottleneck[] = [];

export const parseRateLimitRule = (rule: string) => {
  const parts = rule.split(':');

  if (parts.length !== 3) {
    return null;
  }

  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
};

export const setupRateLimiters = (headers: Headers) => {
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

  if (!rateLimiters.length) {
    rateLimiters.push(new Bottleneck({ maxConcurrent: 1, minTime: 250 }));
  }

  const rules = headers.get(header).split(',');
  const states = headers.get(stateHeader).split(',');

  for (let i = 0; i < rules.length; i++) {
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

    newLimiter.chain(rateLimiters[rateLimiters.length - 1]);
    rateLimiters.push(newLimiter);
  }
};
