import { TAuthConfig } from 'react-oauth2-code-pkce';

import { Item, ItemProperty, FilterForm, FilterQuery } from '../types';

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

type CompiledQuery = {
  regex: RegExp | null;
  mode: FilterQuery['mode'];
};

const compileQueries = (queries: FilterQuery[]): CompiledQuery[] =>
  queries
    .filter((q) => q.value.trim() !== '')
    .map((q) => {
      try {
        return { regex: new RegExp(q.value, 'i'), mode: q.mode };
      } catch {
        return { regex: null, mode: q.mode };
      }
    });

export const itemMatchesFilter = (item: Item, filter: FilterForm): boolean => {
  const compiled = compileQueries(filter.queries);
  const slug = buildItemText(item);

  const baseQueries = compiled.filter((q) => q.mode === undefined);
  const andQueries = compiled.filter((q) => q.mode === 'and');
  const orQueries = compiled.filter((q) => q.mode === 'or');
  const notQueries = compiled.filter((q) => q.mode === 'not');

  // Base + AND + NOT group
  let baseResult = true;
  if (baseQueries.length > 0) {
    baseResult = baseQueries.every((q) => q.regex?.test(slug) ?? false);
  }
  if (baseResult && andQueries.length > 0) {
    baseResult = andQueries.every((q) => q.regex?.test(slug) ?? false);
  }
  if (baseResult && notQueries.length > 0) {
    baseResult = notQueries.every((q) => !(q.regex?.test(slug) ?? false));
  }

  // OR group is an independent alternative path
  const orResult =
    orQueries.length > 0
      ? orQueries.some((q) => q.regex?.test(slug) ?? false)
      : false;

  // Final: passes if (base group passes) OR (any OR query matches)
  const hasOr = orQueries.length > 0;
  let result = hasOr ? baseResult || orResult : baseResult;

  if (filter.rarity) {
    result = result && item.rarity === filter.rarity;
  }

  if (filter.itemType) {
    if (!item.properties?.length) {
      result = false;
    } else {
      result = result && item.properties[0].name === filter.itemType;
    }
  }

  if (filter.frameType && filter.frameType != item.frameType) {
    result = false;
  }

  return result;
};
