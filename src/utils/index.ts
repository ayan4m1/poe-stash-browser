import { TAuthConfig } from 'react-oauth2-code-pkce';

import {
  Item,
  ItemProperty,
  FilterForm,
  FilterQuery,
  RangeOperator,
  CompiledQuery,
  ItemFrameType
} from '../types';

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

const extractNumbers = (s: string): number[] => {
  const matches = s.match(/[+-]?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
};

const compareRange = (
  value: number,
  op: RangeOperator,
  threshold: number
): boolean => {
  switch (op) {
    case '<':
      return value < threshold;
    case '<=':
      return value <= threshold;
    case '>':
      return value > threshold;
    case '>=':
      return value >= threshold;
    case '=':
      return value === threshold;
  }
};

const compileQueries = (queries: FilterQuery[]): CompiledQuery[] =>
  queries
    .filter((q) => {
      if (q.type === 'range') {
        return q.value.trim() !== '';
      }
      return q.value.trim() !== '';
    })
    .map((q) => {
      if (q.type === 'range') {
        try {
          return {
            kind: 'range' as const,
            propertyRegex: new RegExp(q.value, 'i'),
            operator: q.operator ?? '=',
            threshold: q.numberValue ?? 0,
            mode: q.mode
          };
        } catch {
          return {
            kind: 'range' as const,
            propertyRegex: null,
            operator: q.operator ?? '=',
            threshold: q.numberValue ?? 0,
            mode: q.mode
          };
        }
      }
      try {
        return {
          kind: 'text' as const,
          regex: new RegExp(q.value, 'i'),
          mode: q.mode
        };
      } catch {
        return { kind: 'text' as const, regex: null, mode: q.mode };
      }
    });

const queryMatches = (
  compiled: CompiledQuery,
  slug: string,
  lines?: string[]
): boolean => {
  if (compiled.kind === 'text') {
    return compiled.regex?.test(slug) ?? false;
  }
  if (!compiled.propertyRegex || !lines) return false;
  return lines.some((line) => {
    if (!compiled.propertyRegex?.test(line)) return false;
    return extractNumbers(line).some((num) =>
      compareRange(num, compiled.operator, compiled.threshold)
    );
  });
};

const getLinkCount = (item: Item) => {
  let links = 0;

  let groupIndex = 0;
  for (const socket of item.sockets ?? []) {
    if (socket.group === groupIndex) {
      links++;
    }
    groupIndex = socket.group;
  }

  return links;
};

export const itemMatchesFilter = (item: Item, filter: FilterForm): boolean => {
  const compiled = compileQueries(filter.queries);
  const slug = buildItemText(item);
  const hasRangeQueries = compiled.some((q) => q.kind === 'range');
  const lines = hasRangeQueries ? slug.split('\n') : undefined;

  const baseQueries = compiled.filter((q) => q.mode === undefined);
  const andQueries = compiled.filter((q) => q.mode === 'and');
  const orQueries = compiled.filter((q) => q.mode === 'or');
  const notQueries = compiled.filter((q) => q.mode === 'not');

  // Base + AND + NOT group
  let baseResult = true;
  if (baseQueries.length > 0) {
    baseResult = baseQueries.every((q) => queryMatches(q, slug, lines));
  }
  if (baseResult && andQueries.length > 0) {
    baseResult = andQueries.every((q) => queryMatches(q, slug, lines));
  }
  if (baseResult && notQueries.length > 0) {
    baseResult = notQueries.every((q) => !queryMatches(q, slug, lines));
  }

  // OR group is an independent alternative path
  const orResult =
    orQueries.length > 0
      ? orQueries.some((q) => queryMatches(q, slug, lines))
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

  if (
    filter.baseType &&
    !item.baseType.toLowerCase().includes(filter.baseType.toLowerCase())
  ) {
    result = false;
  }

  if (filter.minSockets) {
    const colorCounts: Record<string, number> = {};
    for (const socket of item.sockets ?? []) {
      colorCounts[socket.sColour] = (colorCounts[socket.sColour] ?? 0) + 1;
    }
    if (
      Object.entries(filter.minSockets).some(
        ([colour, min]) => min && (colorCounts[colour] ?? 0) < min
      )
    ) {
      result = false;
    }
  }
  if (filter.minLinks) {
    const links = getLinkCount(item);
    if (links < filter.minLinks) {
      result = false;
    }
  }

  return result;
};

export const shouldUseSlimDisplay = (item: Item) =>
  [
    ItemFrameType.Currency,
    ItemFrameType.DivinationCard,
    ItemFrameType.Gem
  ].includes(item.frameType);
