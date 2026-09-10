import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemProperty,
  ItemRarity,
  ItemType,
  NinjaExchangeType,
  NinjaItemType
} from '../types';
import { getItemClass } from './itemClass';
import { getNinjaExchangeType, getNinjaItemType } from './ninja';

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

const classProperty = (name: string): ItemProperty => ({
  name,
  values: [],
  displayMode: 0
});

const mapTier = (tier: number): ItemProperty => ({
  name: 'Map Tier',
  values: [[String(tier), 0]]
});

const unique = (overrides: Partial<Item> = {}): Item =>
  makeItem({
    rarity: ItemRarity.Unique,
    frameTypeId: ItemFrameType.Unique,
    ...overrides
  });

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

  it('classifies maps by their Map Tier property', () => {
    const item = makeItem({
      baseType: 'Toxic Sewer Map',
      properties: [mapTier(9)]
    });

    assert.equal(getItemClass(item), ItemType.Map);
  });

  it('returns undefined for items with no class signal', () => {
    assert.equal(getItemClass(currency('Chaos Orb')), undefined);
  });
});

describe('getNinjaItemType', () => {
  it('groups unique rings and amulets under UniqueAccessory', () => {
    assert.equal(
      getNinjaItemType(unique({ name: 'Andvarius', baseType: 'Gold Ring' })),
      NinjaItemType.UniqueAccessory
    );
    assert.equal(
      getNinjaItemType(
        unique({ name: 'Carnage Heart', baseType: 'Onyx Amulet' })
      ),
      NinjaItemType.UniqueAccessory
    );
  });

  it('groups unique quivers under UniqueAccessory, not UniqueWeapon', () => {
    const item = unique({ name: 'Rearguard', baseType: 'Blunt Arrow Quiver' });

    assert.equal(getNinjaItemType(item), NinjaItemType.UniqueAccessory);
  });

  it('classifies unique weapons and armour by class property', () => {
    assert.equal(
      getNinjaItemType(
        unique({ baseType: 'Imperial Bow', properties: [classProperty('Bow')] })
      ),
      NinjaItemType.UniqueWeapon
    );
    assert.equal(
      getNinjaItemType(
        unique({
          baseType: 'Astral Plate',
          properties: [classProperty('Body Armour')]
        })
      ),
      NinjaItemType.UniqueArmour
    );
  });

  it('treats foil uniques as uniques', () => {
    const item = makeItem({
      rarity: ItemRarity.Unique,
      frameTypeId: ItemFrameType.Foil,
      baseType: 'Gold Ring'
    });

    assert.equal(getNinjaItemType(item), NinjaItemType.UniqueAccessory);
  });

  it('prefers ForbiddenJewel over UniqueJewel', () => {
    const item = unique({
      name: 'Forbidden Flame',
      baseType: 'Forbidden Flame'
    });

    assert.equal(getNinjaItemType(item), NinjaItemType.ForbiddenJewel);
  });

  it('prefers ClusterJewel over UniqueJewel', () => {
    const item = unique({ baseType: 'Large Cluster Jewel' });

    assert.equal(getNinjaItemType(item), NinjaItemType.ClusterJewel);
  });

  it('classifies plain unique jewels', () => {
    const item = unique({ name: "Watcher's Eye", baseType: 'Prismatic Jewel' });

    assert.equal(getNinjaItemType(item), NinjaItemType.UniqueJewel);
  });

  it('prefers UniqueMap over Map', () => {
    const item = unique({
      baseType: 'Maelström of Chaos',
      properties: [mapTier(16)]
    });

    assert.equal(getNinjaItemType(item), NinjaItemType.UniqueMap);
  });

  it('distinguishes blighted from blight-ravaged maps', () => {
    assert.equal(
      getNinjaItemType(
        makeItem({
          baseType: 'Blighted Toxic Sewer Map',
          properties: [mapTier(9)]
        })
      ),
      NinjaItemType.BlightedMap
    );
    assert.equal(
      getNinjaItemType(
        makeItem({
          baseType: 'Blight-ravaged Toxic Sewer Map',
          properties: [mapTier(9)]
        })
      ),
      NinjaItemType.BlightRavagedMap
    );
  });

  it('classifies plain maps', () => {
    const item = makeItem({
      baseType: 'Toxic Sewer Map',
      properties: [mapTier(9)]
    });

    assert.equal(getNinjaItemType(item), NinjaItemType.Map);
  });

  it('prefers UniqueTincture over UniqueFlask', () => {
    const item = unique({ baseType: 'Ashbark Tincture' });

    assert.equal(getNinjaItemType(item), NinjaItemType.UniqueTincture);
  });

  it('separates unique and non-unique flasks', () => {
    assert.equal(
      getNinjaItemType(unique({ baseType: 'Granite Flask' })),
      NinjaItemType.UniqueFlask
    );
    assert.equal(
      getNinjaItemType(makeItem({ baseType: 'Granite Flask' })),
      NinjaItemType.Flask
    );
  });

  it('classifies non-unique equipment as BaseType regardless of influence', () => {
    const item = makeItem({
      rarity: ItemRarity.Rare,
      frameTypeId: ItemFrameType.Rare,
      baseType: 'Vaal Regalia',
      properties: [classProperty('Body Armour')]
    });

    assert.equal(getNinjaItemType(item), NinjaItemType.BaseType);
  });

  it('matches flag- and frame-driven categories', () => {
    assert.equal(
      getNinjaItemType(makeItem({ frameTypeId: ItemFrameType.Necropolis })),
      NinjaItemType.Corpse
    );
    assert.equal(
      getNinjaItemType(makeItem({ frameTypeId: ItemFrameType.Gem })),
      NinjaItemType.SkillGem
    );
    assert.equal(
      getNinjaItemType(makeItem({ baseType: 'Memory', memoryItem: true })),
      NinjaItemType.Memory
    );
    assert.equal(
      getNinjaItemType(unique({ baseType: 'Ancient Relic', isRelic: true })),
      NinjaItemType.UniqueRelic
    );
  });

  it('matches base type patterns', () => {
    assert.equal(
      getNinjaItemType(makeItem({ baseType: 'Chronicle of Atzoatl' })),
      NinjaItemType.IncursionTemple
    );
    assert.equal(
      getNinjaItemType(makeItem({ baseType: "The Maven's Invitation" })),
      NinjaItemType.Invitation
    );
    assert.equal(
      getNinjaItemType(makeItem({ baseType: 'Fine Incubator' })),
      NinjaItemType.Incubator
    );
    assert.equal(
      getNinjaItemType(makeItem({ baseType: 'Vial of Dominance' })),
      NinjaItemType.Vial
    );
  });

  it('returns undefined for items in no priced category', () => {
    assert.equal(getNinjaItemType(currency('Chaos Orb')), undefined);
  });
});

describe('getNinjaExchangeType', () => {
  it('falls back to Currency for plain currency', () => {
    assert.equal(
      getNinjaExchangeType(currency('Chaos Orb')),
      NinjaExchangeType.Currency
    );
    assert.equal(
      getNinjaExchangeType(currency('Divine Orb')),
      NinjaExchangeType.Currency
    );
  });

  it('prefers specific categories over Currency', () => {
    const cases: [string, NinjaExchangeType][] = [
      ['Winged Sulphite Scarab', NinjaExchangeType.Scarab],
      ['Clear Oil', NinjaExchangeType.Oil],
      ['Pristine Fossil', NinjaExchangeType.Fossil],
      ['Potent Chaotic Resonator', NinjaExchangeType.Resonator],
      ['Fine Delirium Orb', NinjaExchangeType.DeliriumOrb],
      ['Deafening Essence of Hatred', NinjaExchangeType.Essence],
      ['Remnant of Corruption', NinjaExchangeType.Essence],
      ['Omen of Whittling', NinjaExchangeType.Omen],
      ['Rusted Artifact', NinjaExchangeType.Artifact],
      ['Journey Tattoo of the Storm', NinjaExchangeType.Tattoo],
      ['Wildwood Primalist Runegraft', NinjaExchangeType.Runegraft],
      ['Wandering Path Allflame Ember', NinjaExchangeType.AllflameEmber]
    ];

    for (const [baseType, expected] of cases) {
      assert.equal(
        getNinjaExchangeType(currency(baseType)),
        expected,
        baseType
      );
    }
  });

  it('classifies fragments', () => {
    const baseTypes = [
      'Sacrifice at Midnight',
      'Mortal Ignorance',
      'Fragment of the Phoenix',
      'Splinter of Chayula',
      'Timeless Karui Splinter',
      'Timeless Eternal Emblem',
      "Xoph's Breachstone",
      "Drox's Crest",
      "Barran's Crest",
      "Al-Hezmin's Crest",
      "Veritania's Crest",
      'Divine Vessel',
      'Simulacrum'
    ];

    for (const baseType of baseTypes) {
      assert.equal(
        getNinjaExchangeType(currency(baseType)),
        NinjaExchangeType.Fragment,
        baseType
      );
    }
  });

  it('classifies divination cards without a currency frame', () => {
    const item = makeItem({
      baseType: 'The Doctor',
      frameTypeId: ItemFrameType.DivinationCard
    });

    assert.equal(getNinjaExchangeType(item), NinjaExchangeType.DivinationCard);
  });

  it('returns undefined for non-exchangeable items', () => {
    assert.equal(
      getNinjaExchangeType(unique({ baseType: 'Gold Ring' })),
      undefined
    );
  });
});
