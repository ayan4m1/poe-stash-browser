import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemProperty,
  ItemRarity,
  NinjaCurrencyType,
  NinjaExchangeType,
  NinjaItemType
} from '../types';
import {
  getNinjaCurrencyType,
  getNinjaExchangeType,
  getNinjaItemType,
  resolveNinjaSource
} from './ninja';

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

  // poe.ninja's BaseType overview is not modelled - its lines carry no base
  // type, variant or influence, so a stash rare has nothing to match on.
  it('leaves non-unique equipment unclassified', () => {
    const item = makeItem({
      rarity: ItemRarity.Rare,
      frameTypeId: ItemFrameType.Rare,
      baseType: 'Vaal Regalia',
      properties: [classProperty('Body Armour')]
    });

    assert.equal(getNinjaItemType(item), undefined);
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

describe('getNinjaCurrencyType', () => {
  it('falls back to Currency for plain currency', () => {
    assert.equal(
      getNinjaCurrencyType(currency('Chaos Orb')),
      NinjaCurrencyType.Currency
    );
    assert.equal(
      getNinjaCurrencyType(currency('Sacred Orb')),
      NinjaCurrencyType.Currency
    );
  });

  it('classifies fragments', () => {
    assert.equal(
      getNinjaCurrencyType(currency('Mortal Hope')),
      NinjaCurrencyType.Fragment
    );
    assert.equal(
      getNinjaCurrencyType(currency('Divine Vessel')),
      NinjaCurrencyType.Fragment
    );
  });

  // Everything the currency overview excludes is priced by the exchange one.
  it('returns undefined for the specific exchange categories', () => {
    assert.equal(
      getNinjaCurrencyType(currency('Deafening Essence of Hatred')),
      undefined
    );
    assert.equal(
      getNinjaCurrencyType(currency('Winged Sulphite Scarab')),
      undefined
    );
  });
});

describe('resolveNinjaSource', () => {
  // These carry a currency frame and are in none of the specific exchange
  // categories, so isNinjaCurrency would swallow them if item did not go first.
  it('prefers the item overview for currency-framed item categories', () => {
    assert.deepEqual(resolveNinjaSource(currency('Fine Incubator')), {
      endpoint: 'item',
      type: NinjaItemType.Incubator
    });
    assert.deepEqual(resolveNinjaSource(currency("Maven's Invitation")), {
      endpoint: 'item',
      type: NinjaItemType.Invitation
    });
    assert.deepEqual(resolveNinjaSource(currency('Vial of Dominance')), {
      endpoint: 'item',
      type: NinjaItemType.Vial
    });
  });

  // Currency and Fragment match both families; the currency overview wins.
  it('prefers the currency overview over the exchange overview', () => {
    assert.deepEqual(resolveNinjaSource(currency('Chaos Orb')), {
      endpoint: 'currency',
      type: NinjaCurrencyType.Currency
    });
    assert.deepEqual(resolveNinjaSource(currency('Mortal Hope')), {
      endpoint: 'currency',
      type: NinjaCurrencyType.Fragment
    });
  });

  it('falls through to the exchange overview', () => {
    assert.deepEqual(resolveNinjaSource(currency('Winged Sulphite Scarab')), {
      endpoint: 'exchange',
      type: NinjaExchangeType.Scarab
    });
    assert.deepEqual(
      resolveNinjaSource(
        makeItem({
          baseType: 'The Doctor',
          frameTypeId: ItemFrameType.DivinationCard
        })
      ),
      { endpoint: 'exchange', type: NinjaExchangeType.DivinationCard }
    );
  });

  it('resolves uniques by class', () => {
    assert.deepEqual(
      resolveNinjaSource(
        unique({
          name: 'Kingmaker',
          baseType: 'Despot Axe',
          properties: [classProperty('Two Handed Axe')]
        })
      ),
      { endpoint: 'item', type: NinjaItemType.UniqueWeapon }
    );
  });

  it('returns undefined for items poe.ninja does not price for us', () => {
    const rare = makeItem({
      rarity: ItemRarity.Rare,
      frameTypeId: ItemFrameType.Rare,
      baseType: 'Vaal Regalia',
      properties: [classProperty('Body Armour')]
    });

    assert.equal(resolveNinjaSource(rare), undefined);
  });
});
