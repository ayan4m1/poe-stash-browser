import {
  Item,
  ItemValue,
  NinjaCurrencyOverviewResponse,
  NinjaExchangeOverviewResponse,
  NinjaItemLine,
  NinjaItemOverviewResponse,
  NinjaItemType,
  NinjaOverviewIndex,
  NinjaPriceEntry,
  NinjaSource
} from '../types';
import { isUnique } from './itemClass';
import {
  getGemLevel,
  getGemQuality,
  getItemLevel,
  getLevelRequirement,
  getMapTier,
  getMaxLinkCount
} from './itemProperties';

const keySeparator = '|';

const buildKey = (...parts: (string | number)[]) => parts.join(keySeparator);

/**
 * poe.ninja only distinguishes five- and six-links; everything below that is
 * priced as an unlinked item.
 */
const normalizeLinks = (links?: number) => ((links ?? 0) >= 5 ? links : 0);

/**
 * Map lines carry their tier inside a name string - the documented mapTier
 * field is never emitted. Ordinary maps put it in `name` ("Map (Tier 14)"),
 * unique maps in `baseType` ("Map (Tier 16)") with `name` holding the unique.
 */
const mapNamePattern = /^(.*?)\s*\(Tier (\d+)\)$/;

const splitMapName = (name: string): [string, number | undefined] => {
  const match = mapNamePattern.exec(name);

  return match ? [match[1], parseInt(match[2], 10)] : [name, undefined];
};

/**
 * Both stash and exchange overviews are denominated in chaos, so the Chaos Orb
 * itself has no line - it is the denominator. Seeded at its definitional value
 * so a stack of chaos is not the one thing in the tab that cannot be priced.
 */
const chaosOrbName = 'Chaos Orb';

const gemItemTypes = new Set<NinjaItemType>([
  NinjaItemType.SkillGem,
  NinjaItemType.ImbuedGem
]);

const mapItemTypes = new Set<NinjaItemType>([
  NinjaItemType.Map,
  NinjaItemType.BlightedMap,
  NinjaItemType.BlightRavagedMap,
  NinjaItemType.UniqueMap,
  NinjaItemType.ValdoMap
]);

/**
 * poe.ninja does not price ordinary maps by base. Every base of a given tier
 * shares one line named for the category and the tier - "Map (Tier 14)",
 * "Blighted Map (Tier 16)" - alongside a handful of named specials like Vaal
 * Temple Map. These labels are the last rung of the map key ladder.
 *
 * Blight-ravaged is inferred from the blighted naming; the others are measured.
 */
const genericMapLabels: Partial<Record<NinjaItemType, string>> = {
  [NinjaItemType.Map]: 'Map',
  [NinjaItemType.BlightedMap]: 'Blighted Map',
  [NinjaItemType.BlightRavagedMap]: 'Blight-ravaged Map'
};

/**
 * poe.ninja publishes `levelRequired` with two different meanings. The
 * non-unique flask overview lists one row per item level of the base - four
 * Iron Flask rows at 82, 83, 84 and 85 - so there it is the item level, and it
 * is identity: a flask below the lowest published level has no row at all.
 */
const itemLevelTypes = new Set<NinjaItemType>([NinjaItemType.Flask]);

/**
 * Gem lines instead carry the character level the gem requires, which follows
 * from a gem level already in the key. It is kept as a tie-breaker only - see
 * lineLevelParts - so a gem whose stash item has no requirement to read prices
 * exactly as it did before.
 */
const levelRequirementTypes = new Set<NinjaItemType>([
  NinjaItemType.SkillGem,
  NinjaItemType.ImbuedGem
]);

/** Empty for a type poe.ninja does not publish a usable level for. */
const getNinjaLevel = (item: Item, type: NinjaItemType): number | undefined => {
  if (itemLevelTypes.has(type)) {
    return getItemLevel(item);
  }

  return levelRequirementTypes.has(type)
    ? getLevelRequirement(item)
    : undefined;
};

/** Lines omit the field rather than sending 0, but both mean "unpublished". */
const normalizeLevel = (level?: number) =>
  typeof level === 'number' && Number.isInteger(level) && level > 0
    ? level
    : undefined;

/**
 * Level suffixes a line answers to, most specific first. A flask row answers
 * only to its own level, the way a tiered map row answers only to its tier -
 * that is what leaves an off-level flask unpriced instead of borrowing another
 * row. A gem row also keeps the level-less key it claims today, so the level
 * can break a tie without ever costing a match.
 */
const lineLevelParts = (
  line: NinjaItemLine,
  type: NinjaItemType
): number[][] => {
  const level = normalizeLevel(line.levelRequired);

  if (level === undefined) {
    return [[]];
  }

  if (itemLevelTypes.has(type)) {
    return [[level]];
  }

  return levelRequirementTypes.has(type) ? [[level], []] : [[]];
};

/**
 * Level suffixes the item being priced answers to, most specific first. The
 * trailing bare suffix is what still finds lines poe.ninja published without a
 * `levelRequired` at all.
 */
const itemLevelParts = (item: Item, type: NinjaItemType): number[][] => {
  const level = getNinjaLevel(item, type);

  return level === undefined ? [[]] : [[level], []];
};

/** Expands one rung of a key ladder across its level suffixes. */
const levelledKeys = (parts: (string | number)[], levels: number[][]) =>
  levels.map((level) => buildKey(...parts, ...level));

/**
 * Two lines can collide on a key when they differ only by a variant a stash
 * item cannot express - Impresence's element, a cluster jewel's passive count.
 * Prefer whichever is trading more, since that is the one a user is likelier to
 * be holding, and fall back to the sample count so the result stays stable.
 */
const isMoreLiquid = (candidate: NinjaPriceEntry, current: NinjaPriceEntry) => {
  const candidateListings = candidate.listingCount ?? 0;
  const currentListings = current.listingCount ?? 0;

  if (candidateListings !== currentListings) {
    return candidateListings > currentListings;
  }

  return (candidate.count ?? 0) > (current.count ?? 0);
};

type Claim = {
  entry: NinjaPriceEntry;
  /** Index in the key ladder that produced this claim; 0 is most specific. */
  level: number;
};

/**
 * Registers a line under every key it answers to, most specific first. A
 * broader key never displaces a narrower one, so "Kingmaker" alone can act as a
 * fallback without stealing the slot from "Kingmaker|Despot Axe|6".
 */
const claimKeys = (
  claims: Record<string, Claim>,
  keys: string[],
  entry: NinjaPriceEntry
) => {
  for (let level = 0; level < keys.length; level++) {
    const key = keys[level];
    const current = claims[key];

    if (!current || level < current.level) {
      claims[key] = { entry, level };
    } else if (level === current.level && isMoreLiquid(entry, current.entry)) {
      claims[key] = { entry, level };
    }
  }
};

const toEntries = (
  claims: Record<string, Claim>
): Record<string, NinjaPriceEntry> => {
  const entries: Record<string, NinjaPriceEntry> = {};

  for (const [key, claim] of Object.entries(claims)) {
    entries[key] = claim.entry;
  }

  return entries;
};

const toPriceEntry = (line: NinjaItemLine): NinjaPriceEntry => ({
  chaosValue: line.chaosValue,
  count: line.count,
  listingCount: line.listingCount
});

/** Key ladder for a line of the item overview, most specific first. */
const itemLineKeys = (line: NinjaItemLine, type: NinjaItemType): string[] => {
  const levels = lineLevelParts(line, type);

  if (gemItemTypes.has(type)) {
    return levelledKeys(
      [
        line.name,
        line.gemLevel ?? '',
        line.gemQuality ?? 0,
        line.corrupted ? 1 : 0
      ],
      levels
    );
  }

  if (mapItemTypes.has(type)) {
    const [name, nameTier] = splitMapName(line.name);
    const [, baseTier] = splitMapName(line.baseType ?? '');
    const tier = nameTier ?? baseTier;

    // Tier is identity for a map, so a tiered line must not also answer to its
    // bare name - that would price a tier 9 map off the tier 16 row. The bare
    // key exists only for lines poe.ninja publishes without a tier, such as
    // Vaal Temple Map.
    return tier === undefined ? [name] : [buildKey(name, tier)];
  }

  const links = normalizeLinks(line.links);
  const keys: string[] = [];

  if (line.baseType) {
    if (links) {
      keys.push(...levelledKeys([line.name, line.baseType, links], levels));
    }
    keys.push(...levelledKeys([line.name, line.baseType], levels));
  }
  keys.push(...levelledKeys([line.name], levels));

  return keys;
};

/** Key ladder for the item being priced; mirrors the line keys above. */
export const getItemLookupKeys = (
  item: Item,
  source: NinjaSource
): string[] => {
  if (source.endpoint === 'currency' || source.endpoint === 'exchange') {
    return item.baseType ? [item.baseType] : [];
  }

  const { type } = source;
  const levels = itemLevelParts(item, type);

  if (gemItemTypes.has(type)) {
    const name = item.name || item.baseType;
    const level = getGemLevel(item);

    // poe.ninja lists only a handful of level and quality combinations. An
    // inexact match would price a 19/12 gem off the 21/23 corrupted row, so a
    // gem outside those combinations is left unpriced on purpose.
    return name && level !== undefined
      ? levelledKeys(
          [name, level, getGemQuality(item), item.corrupted ? 1 : 0],
          levels
        )
      : [];
  }

  if (mapItemTypes.has(type)) {
    // A rare map's name is its random rare name, so the base type is what
    // poe.ninja is keyed on; unique maps go by their unique name instead.
    const names = (
      isUnique(item) ? [item.name, item.baseType] : [item.baseType]
    ).filter(Boolean);
    const tier = getMapTier(item);
    const keys: string[] = [];

    if (tier !== undefined) {
      for (const name of names) {
        keys.push(buildKey(name, tier));
      }
    }

    // Untiered lines are the named specials - Vaal Temple Map, Nightmare Map.
    keys.push(...names);

    const genericLabel = genericMapLabels[type];

    if (genericLabel && tier !== undefined) {
      keys.push(buildKey(genericLabel, tier));
    }

    return keys;
  }

  const name = item.name || item.baseType;

  if (!name) {
    return [];
  }

  const links = normalizeLinks(getMaxLinkCount(item));
  const keys: string[] = [];

  if (item.baseType) {
    if (links) {
      keys.push(...levelledKeys([name, item.baseType, links], levels));
    }
    keys.push(...levelledKeys([name, item.baseType], levels));
  }
  keys.push(...levelledKeys([name], levels));

  return keys;
};

const buildItemOverviewIndex = (
  response: NinjaItemOverviewResponse,
  type: NinjaItemType
): Record<string, NinjaPriceEntry> => {
  const claims: Record<string, Claim> = {};

  for (const line of response?.lines ?? []) {
    if (!line?.name || typeof line.chaosValue !== 'number') {
      continue;
    }

    claimKeys(claims, itemLineKeys(line, type), toPriceEntry(line));
  }

  return toEntries(claims);
};

const buildCurrencyOverviewIndex = (
  response: NinjaCurrencyOverviewResponse
): Record<string, NinjaPriceEntry> => {
  const entries: Record<string, NinjaPriceEntry> = {};

  for (const line of response?.lines ?? []) {
    if (!line?.currencyTypeName || typeof line.chaosEquivalent !== 'number') {
      continue;
    }

    entries[line.currencyTypeName] = { chaosValue: line.chaosEquivalent };
  }

  if (!entries[chaosOrbName]) {
    entries[chaosOrbName] = { chaosValue: 1 };
  }

  return entries;
};

const buildExchangeOverviewIndex = (
  response: NinjaExchangeOverviewResponse
): Record<string, NinjaPriceEntry> => {
  // Prices here are denominated in core.primary. If poe.ninja ever switches it
  // away from chaos, report nothing rather than mislabel the numbers.
  if (response?.core?.primary !== 'chaos') {
    return {};
  }

  const valuesById = new Map<string, number>();

  for (const line of response?.lines ?? []) {
    if (line?.id && typeof line.primaryValue === 'number') {
      valuesById.set(line.id, line.primaryValue);
    }
  }

  const entries: Record<string, NinjaPriceEntry> = {};

  // Lines are keyed by slug, so the display name comes from the sibling items
  // array rather than core.items, which holds only chaos and divine.
  for (const item of response?.items ?? []) {
    const chaosValue = item?.id ? valuesById.get(item.id) : undefined;

    if (item?.name && chaosValue !== undefined) {
      entries[item.name] = { chaosValue };
    }
  }

  if (!entries[chaosOrbName]) {
    entries[chaosOrbName] = { chaosValue: 1 };
  }

  return entries;
};

/**
 * Projects a raw overview down to the name-keyed price table this app needs.
 * Raw payloads run to tens of thousands of lines, so this runs before anything
 * is returned to a caller or handed to react-query.
 */
export const buildNinjaIndex = (
  source: NinjaSource,
  league: string,
  payload: unknown
): NinjaOverviewIndex => {
  let entries: Record<string, NinjaPriceEntry>;

  switch (source.endpoint) {
    case 'item':
      entries = buildItemOverviewIndex(
        payload as NinjaItemOverviewResponse,
        source.type
      );
      break;
    case 'currency':
      entries = buildCurrencyOverviewIndex(
        payload as NinjaCurrencyOverviewResponse
      );
      break;
    case 'exchange':
      entries = buildExchangeOverviewIndex(
        payload as NinjaExchangeOverviewResponse
      );
      break;
  }

  return { league, endpoint: source.endpoint, type: source.type, entries };
};

/** Divine orbs per chaos orb, as published in core.rates.divine. */
export const getExchangeDivineRate = (
  payload: NinjaExchangeOverviewResponse
): number | undefined => {
  const rate = payload?.core?.rates?.divine;

  return typeof rate === 'number' && rate > 0 ? rate : undefined;
};

export const findNinjaEntry = (
  item: Item,
  index: NinjaOverviewIndex
): NinjaPriceEntry | undefined => {
  const source = {
    endpoint: index.endpoint,
    type: index.type
  } as NinjaSource;

  for (const key of getItemLookupKeys(item, source)) {
    const entry = index.entries[key];

    if (entry) {
      return entry;
    }
  }

  return undefined;
};

/**
 * Denominates a unit price. divineRate is divine orbs per chaos orb, so an item
 * worth a whole divine or more is reported in divines and everything below it
 * in chaos.
 */
export const toItemValue = (
  item: Item,
  unitChaosValue: number,
  divineRate?: number
): ItemValue => {
  const stackSize = item.stackSize ?? 1;
  const chaosValue = unitChaosValue * stackSize;
  const divineValue = divineRate ? chaosValue * divineRate : undefined;

  return divineValue !== undefined && divineValue >= 1
    ? {
        value: divineValue,
        currency: 'divine',
        chaosValue,
        unitChaosValue,
        stackSize
      }
    : {
        value: chaosValue,
        currency: 'chaos',
        chaosValue,
        unitChaosValue,
        stackSize
      };
};

export const valueFromIndex = (
  item: Item,
  index: NinjaOverviewIndex,
  divineRate?: number
): ItemValue | undefined => {
  const entry = findNinjaEntry(item, index);

  return entry ? toItemValue(item, entry.chaosValue, divineRate) : undefined;
};
