import { Item, ItemProperty } from '../types';

/**
 * The stash API keeps everything poe.ninja matches on - gem level, quality,
 * map tier - inside the `properties` array rather than on the item itself,
 * so every lookup here is a scan by property name.
 */
export const getItemProperty = (
  item: Item,
  name: string
): ItemProperty | undefined =>
  item.properties?.find((property) => property.name === name);

/**
 * First value of a named entry as a number. `parseInt` handles all three
 * formats the API emits for these - "14", "+20%" and "21 (Max)".
 */
const propertyNumber = (
  properties: ItemProperty[] | undefined,
  name: string
): number | undefined => {
  const value = properties?.find((property) => property.name === name)
    ?.values?.[0]?.[0];

  if (value === undefined) {
    return undefined;
  }

  const parsed = parseInt(value, 10);

  return isNaN(parsed) ? undefined : parsed;
};

export const getPropertyNumber = (
  item: Item,
  name: string
): number | undefined => propertyNumber(item.properties, name);

export const getGemLevel = (item: Item): number | undefined =>
  getPropertyNumber(item, 'Level');

/** Gems without a Quality property are 0%, which is how poe.ninja lists them. */
export const getGemQuality = (item: Item): number =>
  getPropertyNumber(item, 'Quality') ?? 0;

export const getMapTier = (item: Item): number | undefined =>
  getPropertyNumber(item, 'Map Tier');

/**
 * Character level needed to equip the item. Lives in `requirements` rather than
 * `properties`, and is absent entirely on anything with no requirement - which
 * is exactly when poe.ninja omits `levelRequired` too.
 */
export const getLevelRequirement = (item: Item): number | undefined =>
  propertyNumber(item.requirements, 'Level');

/**
 * Item level. The stash API calls it `ilvl`; `itemLevel` is the spelling used
 * elsewhere in the GGG APIs, so fall back to it rather than reporting nothing.
 */
export const getItemLevel = (item: Item): number | undefined => {
  const level = item.ilvl ?? item.itemLevel;

  return typeof level === 'number' && level > 0 ? level : undefined;
};

/** Size of the largest linked socket group, or 0 when the item has no sockets. */
export const getMaxLinkCount = (item: Item): number => {
  const groupSizes = new Map<number, number>();

  for (const socket of item.sockets ?? []) {
    groupSizes.set(socket.group, (groupSizes.get(socket.group) ?? 0) + 1);
  }

  return groupSizes.size ? Math.max(...groupSizes.values()) : 0;
};

/**
 * What poe.ninja calls the item. Uniques carry their unique name; currency,
 * gems and fragments leave `name` empty and put it in `baseType`.
 */
export const getDisplayName = (item: Item): string =>
  item.name || item.baseType;
