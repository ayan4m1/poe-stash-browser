import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemMatcher,
  ItemProperty,
  ItemRarity,
  ItemType
} from '../types';
import {
  forbiddenJewelBaseTypes,
  getItemClass,
  isAccessory,
  isArmour,
  isEquipment,
  isFlask,
  isJewel,
  isMap,
  isTincture,
  isUnique,
  isWeapon
} from './itemClass';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  verified: true,
  w: 1,
  h: 1,
  icon: '',
  id: 'test',
  influences: {},
  socketedItems: [],
  name: '',
  typeLine: '',
  baseType: '',
  identified: true,
  ilvl: 84,
  rewards: [],
  frameTypeId: ItemFrameType.Normal,
  artFilename: '',
  ...overrides
});

// The API carries the class as a valueless first property.
const classProperty = (name: string): ItemProperty => ({
  name,
  values: [],
  displayMode: 0
});

const property = (name: string, value: string): ItemProperty => ({
  name,
  values: [[value, 0]]
});

const mapTier = (tier: number): ItemProperty =>
  property('Map Tier', String(tier));

const ofClass = (type: ItemType): Item =>
  makeItem({ properties: [classProperty(type)] });

const currency = (baseType: string): Item =>
  makeItem({
    baseType,
    typeLine: baseType,
    frameTypeId: ItemFrameType.Currency
  });

describe('getItemClass', () => {
  it('reads the class property when the API provides one', () => {
    const item = makeItem({
      baseType: 'Vaal Axe',
      properties: [classProperty('Two Handed Axe')]
    });

    assert.equal(getItemClass(item), ItemType.TwoHandedAxe);
  });

  // The regression the old properties[0].name check could not handle:
  // accessories carry no class property at all.
  it('classifies accessories that have no properties array', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Coral Ring' })),
      ItemType.Ring
    );
    assert.equal(
      getItemClass(makeItem({ baseType: 'Turquoise Amulet' })),
      ItemType.Amulet
    );
    assert.equal(
      getItemClass(makeItem({ baseType: 'Leather Belt' })),
      ItemType.Belt
    );
  });

  it('classifies belt bases that do not end in Belt', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Rustic Sash' })),
      ItemType.Belt
    );
    assert.equal(
      getItemClass(makeItem({ baseType: 'Stygian Vise' })),
      ItemType.Belt
    );
  });

  it('classifies talismans as amulets', () => {
    const item = makeItem({ baseType: 'Clutching Talisman', talismanTier: 2 });

    assert.equal(getItemClass(item), ItemType.Amulet);
  });

  // Tier 0 is falsy but present, so the check has to be against undefined.
  it('classifies a tier zero talisman as an amulet', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Bone Ring', talismanTier: 0 })),
      ItemType.Amulet
    );
  });

  it('classifies a talisman base carrying no tier as an amulet', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Clutching Talisman' })),
      ItemType.Amulet
    );
  });

  it('classifies quivers, flasks and tinctures by suffix', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Penetrating Arrow Quiver' })),
      ItemType.Quiver
    );
    assert.equal(
      getItemClass(makeItem({ baseType: 'Divine Life Flask' })),
      ItemType.Flask
    );
    assert.equal(
      getItemClass(makeItem({ baseType: 'Ashbark Tincture' })),
      ItemType.Tincture
    );
  });

  it('classifies maps by their Map Tier property', () => {
    const item = makeItem({
      baseType: 'Toxic Sewer Map',
      properties: [mapTier(9)]
    });

    assert.equal(getItemClass(item), ItemType.Map);
  });

  it('classifies abyss jewels by their flag rather than their suffix', () => {
    const item = makeItem({
      baseType: 'Murderous Eye Jewel',
      abyssJewel: true
    });

    assert.equal(getItemClass(item), ItemType.AbyssJewel);
  });

  // Neither forbidden jewel base ends in "Jewel".
  it('classifies forbidden jewels', () => {
    for (const baseType of forbiddenJewelBaseTypes) {
      assert.equal(getItemClass(makeItem({ baseType })), ItemType.Jewel);
    }
  });

  it('ignores a first property that carries a value', () => {
    const item = makeItem({
      baseType: 'Coral Ring',
      properties: [property('Bow', 'x')]
    });

    assert.equal(getItemClass(item), ItemType.Ring);
  });

  // Only the first property can be a class - a class name appearing later is
  // some other property that happens to share the name.
  it('does not look past the first property', () => {
    const item = makeItem({
      properties: [property('Quality', '+20%'), classProperty('Bow')]
    });

    assert.equal(getItemClass(item), undefined);
  });

  it('does not match a suffix mid-word', () => {
    assert.equal(
      getItemClass(makeItem({ baseType: 'Jewelled Foil' })),
      undefined
    );
  });

  it('returns undefined for items with no class signal', () => {
    assert.equal(getItemClass(currency('Chaos Orb')), undefined);
  });
});

describe('isUnique', () => {
  it('matches on rarity', () => {
    assert.equal(isUnique(makeItem({ rarity: ItemRarity.Unique })), true);
  });

  // Foils report a unique frame type but not a unique rarity, so the frame
  // type alone has to be enough.
  it('matches every unique frame type without a rarity', () => {
    for (const frameTypeId of [
      ItemFrameType.Unique,
      ItemFrameType.Foil,
      ItemFrameType.SupporterFoil
    ]) {
      assert.equal(isUnique(makeItem({ frameTypeId })), true);
    }
  });

  it('rejects non-uniques', () => {
    assert.equal(
      isUnique(
        makeItem({ rarity: ItemRarity.Rare, frameTypeId: ItemFrameType.Rare })
      ),
      false
    );
    assert.equal(isUnique(currency('Chaos Orb')), false);
  });
});

type ItemCategory =
  'weapon' | 'armour' | 'accessory' | 'jewel' | 'flask' | 'tincture' | 'map';

/**
 * The category each class belongs to. Typed as a total Record so that adding an
 * ItemType without categorizing it here fails to compile - an uncategorized
 * class silently drops out of every poe.ninja pricing bucket.
 */
const classCategories: Record<ItemType, ItemCategory> = {
  [ItemType.TwoHandedAxe]: 'weapon',
  [ItemType.OneHandedAxe]: 'weapon',
  [ItemType.TwoHandedSword]: 'weapon',
  [ItemType.OneHandedSword]: 'weapon',
  [ItemType.ThrustingOneHandedSword]: 'weapon',
  [ItemType.TwoHandedMace]: 'weapon',
  [ItemType.OneHandedMace]: 'weapon',
  [ItemType.Staff]: 'weapon',
  [ItemType.Warstaff]: 'weapon',
  [ItemType.Mace]: 'weapon',
  [ItemType.Dagger]: 'weapon',
  [ItemType.RuneDagger]: 'weapon',
  [ItemType.Claw]: 'weapon',
  [ItemType.Bow]: 'weapon',
  [ItemType.Wand]: 'weapon',
  [ItemType.Sceptre]: 'weapon',
  [ItemType.FishingRod]: 'weapon',
  [ItemType.BodyArmour]: 'armour',
  [ItemType.Armor]: 'armour',
  [ItemType.Helmet]: 'armour',
  [ItemType.Shield]: 'armour',
  [ItemType.Boots]: 'armour',
  [ItemType.Gloves]: 'armour',
  [ItemType.Belt]: 'accessory',
  [ItemType.Quiver]: 'accessory',
  [ItemType.Amulet]: 'accessory',
  [ItemType.Ring]: 'accessory',
  [ItemType.Trinket]: 'accessory',
  [ItemType.Jewel]: 'jewel',
  [ItemType.AbyssJewel]: 'jewel',
  [ItemType.Flask]: 'flask',
  [ItemType.Tincture]: 'tincture',
  [ItemType.Map]: 'map'
};

const matchers: [string, ItemMatcher][] = [
  ['isWeapon', isWeapon],
  ['isArmour', isArmour],
  ['isAccessory', isAccessory],
  ['isJewel', isJewel],
  ['isFlask', isFlask],
  ['isTincture', isTincture],
  ['isMap', isMap],
  ['isEquipment', isEquipment]
];

// isEquipment is the union of the three gear categories.
const expectedMatchers: Record<ItemCategory, string[]> = {
  weapon: ['isWeapon', 'isEquipment'],
  armour: ['isArmour', 'isEquipment'],
  accessory: ['isAccessory', 'isEquipment'],
  jewel: ['isJewel'],
  flask: ['isFlask'],
  tincture: ['isTincture'],
  map: ['isMap']
};

describe('class matchers', () => {
  // tsx strips the Record type without checking it, so assert coverage here.
  it('categorizes every ItemType', () => {
    assert.deepEqual(
      Object.values(ItemType).filter((type) => !(type in classCategories)),
      []
    );
  });

  const entries = Object.entries(classCategories) as [ItemType, ItemCategory][];

  for (const [type, category] of entries) {
    it(`matches ${type} as ${category} and nothing else`, () => {
      const item = ofClass(type);
      const expected = expectedMatchers[category];

      for (const [name, matcher] of matchers) {
        assert.equal(matcher(item), expected.includes(name), `${name} ${type}`);
      }
    });
  }

  // poe.ninja files quivers under Unique Accessories, not Unique Weapons.
  it('treats a quiver as an accessory rather than a weapon', () => {
    const item = makeItem({ baseType: 'Penetrating Arrow Quiver' });

    assert.equal(isAccessory(item), true);
    assert.equal(isWeapon(item), false);
  });

  it('treats an abyss jewel identified by its flag as a jewel', () => {
    const item = makeItem({
      baseType: 'Murderous Eye Jewel',
      abyssJewel: true
    });

    assert.equal(isJewel(item), true);
    assert.equal(isEquipment(item), false);
  });

  it('rejects an item with no class', () => {
    const item = currency('Chaos Orb');

    for (const [name, matcher] of matchers) {
      assert.equal(matcher(item), false, name);
    }
  });
});
