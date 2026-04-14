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

export const parseRateLimitRule = (rule: string) => {
  const parts = rule.split(':');

  if (parts.length !== 3) {
    return [1, 10];
  }

  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
};
