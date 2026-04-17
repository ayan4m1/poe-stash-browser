import { TAuthConfig } from 'react-oauth2-code-pkce';

import { Item, ItemProperty } from '../types';

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

export const buildItemText = (item: Item) => {
  const lines = [`${item.name} ${item.typeLine}`];

  for (const property of [
    ...(item.properties?.length ? (item.properties as ItemProperty[]) : []),
    ...(item.notableProperties?.length
      ? (item.notableProperties as ItemProperty[])
      : []),
    ...(item.additionalProperties?.length
      ? (item.additionalProperties as ItemProperty[])
      : [])
  ]) {
    lines.push(interpolateProperties(property));
  }
  for (const requirement of item.requirements?.length
    ? (item.requirements as ItemProperty[])
    : []) {
    lines.push(interpolateProperties(requirement, true));
  }
  lines.push(item.implicitMods?.join('\n') ?? '');
  lines.push(item.explicitMods?.join('\n') ?? '');
  lines.push(item.craftedMods?.join('\n') ?? '');

  return lines.join('\n');
};

export const interpolateProperties = (
  property: ItemProperty,
  isRequirement = false
) => {
  let result = `${isRequirement ? 'Requires ' : ''}${property.name}`;

  for (let i = 0; i < property.values.length; i++) {
    const [value] = property.values[i];
    const token = `{${i}}`;

    if (!result.includes(token)) {
      return `${result}: ${property.values[0][0]}`;
    }

    result = result.replace(token, value);
  }

  return result;
};
