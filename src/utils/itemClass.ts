import {
  Item,
  ItemFrameType,
  ItemMatcher,
  ItemRarity,
  ItemType
} from '../types';

const itemTypeValues = new Set<string>(Object.values(ItemType));

// Belt bases whose name does not end in "Belt".
const beltBaseTypes = new Set(['Rustic Sash', 'Stygian Vise']);

export const forbiddenJewelBaseTypes = new Set([
  'Forbidden Flesh',
  'Forbidden Flame'
]);

// Checked in order, so more specific suffixes must come first.
const baseTypeSuffixes: [string, ItemType][] = [
  ['Jewel', ItemType.Jewel],
  ['Ring', ItemType.Ring],
  ['Amulet', ItemType.Amulet],
  ['Talisman', ItemType.Amulet],
  ['Belt', ItemType.Belt],
  ['Quiver', ItemType.Quiver],
  ['Flask', ItemType.Flask],
  ['Tincture', ItemType.Tincture]
];

const weaponClasses = new Set<ItemType>([
  ItemType.TwoHandedAxe,
  ItemType.OneHandedAxe,
  ItemType.TwoHandedSword,
  ItemType.OneHandedSword,
  ItemType.ThrustingOneHandedSword,
  ItemType.TwoHandedMace,
  ItemType.OneHandedMace,
  ItemType.Staff,
  ItemType.Warstaff,
  ItemType.Mace,
  ItemType.Dagger,
  ItemType.RuneDagger,
  ItemType.Claw,
  ItemType.Bow,
  ItemType.Wand,
  ItemType.Sceptre,
  ItemType.FishingRod
]);

const armourClasses = new Set<ItemType>([
  ItemType.BodyArmour,
  ItemType.Armor,
  ItemType.Helmet,
  ItemType.Shield,
  ItemType.Boots,
  ItemType.Gloves
]);

// poe.ninja files quivers under Unique Accessories rather than Unique Weapons.
const accessoryClasses = new Set<ItemType>([
  ItemType.Belt,
  ItemType.Quiver,
  ItemType.Amulet,
  ItemType.Ring,
  ItemType.Trinket
]);

const jewelClasses = new Set<ItemType>([ItemType.Jewel, ItemType.AbyssJewel]);

// Foils are uniques and would otherwise fall out of every Unique* category.
const uniqueFrameTypes = new Set<ItemFrameType>([
  ItemFrameType.Unique,
  ItemFrameType.Foil,
  ItemFrameType.SupporterFoil
]);

const hasMapTier = (item: Item) =>
  item.properties?.some((property) => property.name === 'Map Tier') === true;

/**
 * Best-effort item class. The API emits the class as a valueless first
 * property, but only for weapons and some armour - accessories, jewels,
 * flasks and maps need the base type or a flag instead. Uniques are covered
 * because `baseType` still holds the real base ("Coral Ring", not "Andvarius").
 */
export const getItemClass = (item: Item): ItemType | undefined => {
  const classProperty = item.properties?.[0];

  if (
    classProperty &&
    !classProperty.values.length &&
    itemTypeValues.has(classProperty.name)
  ) {
    return classProperty.name as ItemType;
  }

  if (hasMapTier(item)) {
    return ItemType.Map;
  }

  if (item.abyssJewel) {
    return ItemType.AbyssJewel;
  }

  if (forbiddenJewelBaseTypes.has(item.baseType)) {
    return ItemType.Jewel;
  }

  if (item.talismanTier !== undefined) {
    return ItemType.Amulet;
  }

  if (beltBaseTypes.has(item.baseType)) {
    return ItemType.Belt;
  }

  for (const [suffix, itemType] of baseTypeSuffixes) {
    if (item.baseType.endsWith(suffix)) {
      return itemType;
    }
  }

  return undefined;
};

const isClassIn = (classes: Set<ItemType>): ItemMatcher => {
  return (item) => {
    const itemClass = getItemClass(item);

    return itemClass !== undefined && classes.has(itemClass);
  };
};

export const isUnique: ItemMatcher = (item) =>
  item.rarity === ItemRarity.Unique || uniqueFrameTypes.has(item.frameTypeId);

export const isWeapon = isClassIn(weaponClasses);

export const isArmour = isClassIn(armourClasses);

export const isAccessory = isClassIn(accessoryClasses);

export const isJewel = isClassIn(jewelClasses);

export const isFlask: ItemMatcher = (item) =>
  getItemClass(item) === ItemType.Flask;

export const isTincture: ItemMatcher = (item) =>
  getItemClass(item) === ItemType.Tincture;

export const isMap: ItemMatcher = (item) => getItemClass(item) === ItemType.Map;

/** Weapons, armour and accessories - the classes poe.ninja prices as bases. */
export const isEquipment: ItemMatcher = (item) =>
  isWeapon(item) || isArmour(item) || isAccessory(item);
