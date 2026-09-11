import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemProperty,
  ItemRarity,
  ItemSocket,
  NinjaCurrencyType,
  NinjaExchangeType,
  NinjaItemType,
  NinjaSource,
  SocketColor
} from '../types';
import {
  buildNinjaIndex,
  getExchangeDivineRate,
  getItemLookupKeys,
  toItemValue,
  valueFromIndex
} from './ninjaValue';
import { makeItem } from './testItems';

const league = 'Allflame';

const unique = (overrides: Partial<Item> = {}): Item =>
  makeItem({
    rarity: ItemRarity.Unique,
    frameTypeId: ItemFrameType.Unique,
    ...overrides
  });

const currency = (baseType: string, stackSize?: number): Item =>
  makeItem({
    baseType,
    typeLine: baseType,
    stackSize,
    frameTypeId: ItemFrameType.Currency
  });

const property = (name: string, value: string): ItemProperty => ({
  name,
  values: [[value, 0]]
});

const linkedSockets = (count: number): ItemSocket[] =>
  Array.from({ length: count }, () => ({
    group: 0,
    attr: 'S' as const,
    sColour: SocketColor.Red
  }));

const itemSource = (type: NinjaItemType): NinjaSource => ({
  endpoint: 'item',
  type
});

const currencySource: NinjaSource = {
  endpoint: 'currency',
  type: NinjaCurrencyType.Currency
};

const exchangeSource = (type: NinjaExchangeType): NinjaSource => ({
  endpoint: 'exchange',
  type
});

describe('item overview index', () => {
  const weaponSource = itemSource(NinjaItemType.UniqueWeapon);
  const weapons = {
    lines: [
      {
        name: 'Kingmaker',
        baseType: 'Despot Axe',
        links: 6,
        chaosValue: 34145,
        listingCount: 10
      },
      {
        name: 'Kingmaker',
        baseType: 'Despot Axe',
        links: 5,
        chaosValue: 900,
        listingCount: 40
      },
      {
        name: 'Kingmaker',
        baseType: 'Despot Axe',
        chaosValue: 120,
        listingCount: 200
      }
    ]
  };

  const kingmaker = (links: number) =>
    unique({
      name: 'Kingmaker',
      baseType: 'Despot Axe',
      sockets: linkedSockets(links)
    });

  it('prices a six-link off the six-link line', () => {
    const index = buildNinjaIndex(weaponSource, league, weapons);

    assert.equal(valueFromIndex(kingmaker(6), index)?.chaosValue, 34145);
  });

  it('prices a five-link off the five-link line', () => {
    const index = buildNinjaIndex(weaponSource, league, weapons);

    assert.equal(valueFromIndex(kingmaker(5), index)?.chaosValue, 900);
  });

  // poe.ninja does not distinguish anything below five links.
  it('prices a four-link off the unlinked line', () => {
    const index = buildNinjaIndex(weaponSource, league, weapons);

    assert.equal(valueFromIndex(kingmaker(4), index)?.chaosValue, 120);
    assert.equal(valueFromIndex(kingmaker(0), index)?.chaosValue, 120);
  });

  // 371 of 641 UniqueWeapon lines carry no links field at all.
  it('matches a line with no links via the name fallback', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueAccessory),
      league,
      {
        lines: [{ name: 'Andvarius', baseType: 'Gold Ring', chaosValue: 5 }]
      }
    );

    assert.equal(
      valueFromIndex(
        unique({ name: 'Andvarius', baseType: 'Gold Ring' }),
        index
      )?.chaosValue,
      5
    );
  });

  // Impresence and friends differ only by a variant a stash item cannot express,
  // so the liquid row wins rather than whichever happened to be listed first.
  it('resolves a key collision by listing count', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueAccessory),
      league,
      {
        lines: [
          {
            name: 'Impresence',
            baseType: 'Onyx Amulet',
            chaosValue: 40,
            listingCount: 3
          },
          {
            name: 'Impresence',
            baseType: 'Onyx Amulet',
            chaosValue: 90,
            listingCount: 25
          }
        ]
      }
    );

    assert.equal(
      valueFromIndex(
        unique({ name: 'Impresence', baseType: 'Onyx Amulet' }),
        index
      )?.chaosValue,
      90
    );
  });

  // Both rows are equally listed, so the sample count is the only thing left
  // to break the tie with.
  it('falls back to sample count when listing counts match', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueAccessory),
      league,
      {
        lines: [
          {
            name: 'Impresence',
            baseType: 'Onyx Amulet',
            chaosValue: 40,
            listingCount: 8,
            count: 2
          },
          {
            name: 'Impresence',
            baseType: 'Onyx Amulet',
            chaosValue: 90,
            listingCount: 8,
            count: 11
          }
        ]
      }
    );

    assert.equal(
      valueFromIndex(
        unique({ name: 'Impresence', baseType: 'Onyx Amulet' }),
        index
      )?.chaosValue,
      90
    );
  });

  // Neither field is published, so both sides read as zero and the first line
  // to claim the key keeps it.
  it('keeps the first claim when neither line reports liquidity', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueAccessory),
      league,
      {
        lines: [
          { name: 'Impresence', baseType: 'Onyx Amulet', chaosValue: 40 },
          { name: 'Impresence', baseType: 'Onyx Amulet', chaosValue: 90 }
        ]
      }
    );

    assert.equal(
      valueFromIndex(
        unique({ name: 'Impresence', baseType: 'Onyx Amulet' }),
        index
      )?.chaosValue,
      40
    );
  });

  // A unique's level requirement in the stash is always the one poe.ninja
  // publishes, so gating on it could only ever cost a match.
  it('ignores levelRequired on a unique line', () => {
    const index = buildNinjaIndex(weaponSource, league, {
      lines: [
        {
          name: 'Starforge',
          baseType: 'Infernal Sword',
          levelRequired: 67,
          chaosValue: 15
        }
      ]
    });

    assert.equal(
      valueFromIndex(
        unique({
          name: 'Starforge',
          baseType: 'Infernal Sword',
          requirements: [property('Level', '44')]
        }),
        index
      )?.chaosValue,
      15
    );
  });

  it('leaves an unidentified unique unpriced', () => {
    const index = buildNinjaIndex(weaponSource, league, weapons);

    assert.equal(
      valueFromIndex(unique({ name: '', baseType: 'Despot Axe' }), index),
      undefined
    );
  });
});

describe('skill gem index', () => {
  const source = itemSource(NinjaItemType.SkillGem);
  // baseType is absent from 6930 of 7040 live SkillGem lines.
  const gems = {
    lines: [
      {
        name: 'Close Combat Support',
        gemLevel: 21,
        gemQuality: 23,
        corrupted: true,
        chaosValue: 403680
      },
      {
        name: 'Close Combat Support',
        gemLevel: 20,
        gemQuality: 20,
        chaosValue: 12
      }
    ]
  };

  const gem = (overrides: Partial<Item> = {}, level = 20, quality = 20) =>
    makeItem({
      baseType: 'Close Combat Support',
      typeLine: 'Close Combat Support',
      frameTypeId: ItemFrameType.Gem,
      properties: [
        property('Level', String(level)),
        property('Quality', `+${quality}%`)
      ],
      ...overrides
    });

  it('matches a corrupted 21/23 gem', () => {
    const index = buildNinjaIndex(source, league, gems);

    assert.equal(
      valueFromIndex(gem({ corrupted: true }, 21, 23), index)?.chaosValue,
      403680
    );
  });

  // corrupted is omitted rather than false on uncorrupted lines.
  it('matches an uncorrupted 20/20 gem', () => {
    const index = buildNinjaIndex(source, league, gems);

    assert.equal(valueFromIndex(gem(), index)?.chaosValue, 12);
  });

  // An unqualitied gem reads as quality zero on both sides, so a line that
  // omits gemQuality still has to meet it.
  it('matches a zero quality gem against a line with no gemQuality', () => {
    const index = buildNinjaIndex(source, league, {
      lines: [{ name: 'Portal', gemLevel: 20, chaosValue: 3 }]
    });

    assert.equal(
      valueFromIndex(
        makeItem({
          baseType: 'Portal',
          frameTypeId: ItemFrameType.Gem,
          properties: [property('Level', '20')]
        }),
        index
      )?.chaosValue,
      3
    );
  });

  // A line with no gemLevel cannot be priced against - every item key carries a
  // level - so it must not answer for a levelled gem either.
  it('never matches a line published without a gemLevel', () => {
    const index = buildNinjaIndex(source, league, {
      lines: [{ name: 'Portal', gemQuality: 20, chaosValue: 3 }]
    });

    assert.equal(
      valueFromIndex(
        makeItem({
          baseType: 'Portal',
          frameTypeId: ItemFrameType.Gem,
          properties: [property('Level', '20'), property('Quality', '+20%')]
        }),
        index
      ),
      undefined
    );
  });

  it('does not fall back to a nearby level or quality', () => {
    const index = buildNinjaIndex(source, league, gems);

    assert.equal(valueFromIndex(gem({}, 19, 12), index), undefined);
    assert.equal(
      valueFromIndex(gem({ corrupted: true }, 20, 20), index),
      undefined
    );
  });

  // Two live lines can land on the same gem key; before levelRequired joined it
  // the more liquid one took the slot for both.
  const angling = {
    lines: [
      {
        name: 'Chain Hook of Angling',
        gemLevel: 20,
        gemQuality: 20,
        levelRequired: 70,
        chaosValue: 75,
        listingCount: 1
      },
      {
        name: 'Chain Hook of Angling',
        gemLevel: 20,
        gemQuality: 20,
        levelRequired: 68,
        chaosValue: 23,
        listingCount: 63
      }
    ]
  };

  const angler = (overrides: Partial<Item> = {}) =>
    makeItem({
      baseType: 'Chain Hook of Angling',
      typeLine: 'Chain Hook of Angling',
      frameTypeId: ItemFrameType.Gem,
      properties: [property('Level', '20'), property('Quality', '+20%')],
      ...overrides
    });

  it('breaks a gem key collision on the level requirement', () => {
    const index = buildNinjaIndex(source, league, angling);

    assert.equal(
      valueFromIndex(angler({ requirements: [property('Level', '70')] }), index)
        ?.chaosValue,
      75
    );
  });

  // The requirement follows from a gem level already in the key, so it is only
  // ever a tie-breaker - a gem with nothing to read prices as it did before.
  it('prices a gem with no level requirement as before', () => {
    const index = buildNinjaIndex(source, league, angling);

    assert.equal(valueFromIndex(angler(), index)?.chaosValue, 23);
    assert.equal(
      valueFromIndex(angler({ requirements: [property('Level', '12')] }), index)
        ?.chaosValue,
      23
    );
  });
});

// The Flask overview publishes one row per item level of the base - a single
// Iron Flask spans 82, 83, 84 and 85 in live data.
describe('flask index', () => {
  const source = itemSource(NinjaItemType.Flask);
  const flasks = {
    lines: [
      {
        name: 'Iron Flask',
        levelRequired: 85,
        chaosValue: 677.4,
        listingCount: 3
      },
      {
        name: 'Iron Flask',
        levelRequired: 84,
        chaosValue: 239.5,
        listingCount: 90
      },
      {
        name: 'Iron Flask',
        levelRequired: 82,
        chaosValue: 163.7,
        listingCount: 12
      }
    ]
  };

  const flask = (ilvl: number) =>
    makeItem({ baseType: 'Iron Flask', typeLine: 'Iron Flask', ilvl });

  it('prices a flask off the row for its own item level', () => {
    const index = buildNinjaIndex(source, league, flasks);

    assert.equal(valueFromIndex(flask(85), index)?.chaosValue, 677.4);
    assert.equal(valueFromIndex(flask(84), index)?.chaosValue, 239.5);
    assert.equal(valueFromIndex(flask(82), index)?.chaosValue, 163.7);
  });

  // The ilvl 84 row is the most liquid of the three, so without the level in
  // the key every Iron Flask in the tab was priced at 239.5.
  it('leaves a flask off the published levels unpriced', () => {
    const index = buildNinjaIndex(source, league, flasks);

    assert.equal(valueFromIndex(flask(40), index), undefined);
    assert.equal(valueFromIndex(flask(83), index), undefined);
  });

  it('still matches a line published without a level', () => {
    const index = buildNinjaIndex(source, league, {
      lines: [{ name: 'Bismuth Flask', chaosValue: 4 }]
    });

    assert.equal(
      valueFromIndex(
        makeItem({ baseType: 'Bismuth Flask', typeLine: 'Bismuth Flask' }),
        index
      )?.chaosValue,
      4
    );
  });
});

describe('map index', () => {
  // Shapes below are trimmed from live payloads. poe.ninja stopped pricing
  // ordinary maps per base - every base of a tier shares one generic line -
  // and the documented mapTier field is never emitted.
  const maps = {
    lines: [
      { name: 'Map (Tier 14)', chaosValue: 2, variant: ', Gen-24' },
      { name: 'Map (Tier 15)', chaosValue: 5, variant: ', Gen-24' },
      {
        name: 'Vaal Temple Map',
        baseType: undefined,
        chaosValue: 80,
        variant: 'Atlas'
      },
      {
        name: 'Drox Vaal Temple Map',
        baseType: 'Vaal Temple Map',
        chaosValue: 127,
        variant: 'Atlas'
      }
    ]
  };

  const map = (baseType: string, tier: number) =>
    makeItem({
      // A rare map's name is random, so only the base type can be matched on.
      name: 'Carrion Precinct',
      baseType,
      rarity: ItemRarity.Rare,
      frameTypeId: ItemFrameType.Rare,
      properties: [property('Map Tier', String(tier))]
    });

  it('prices an ordinary map off the generic line for its tier', () => {
    const index = buildNinjaIndex(itemSource(NinjaItemType.Map), league, maps);

    assert.equal(
      valueFromIndex(map('Toxic Sewer Map', 14), index)?.chaosValue,
      2
    );
    assert.equal(
      valueFromIndex(map('Underground Sea Map', 15), index)?.chaosValue,
      5
    );
  });

  it('prefers a named special over the generic tier line', () => {
    const index = buildNinjaIndex(itemSource(NinjaItemType.Map), league, maps);

    assert.equal(
      valueFromIndex(map('Vaal Temple Map', 15), index)?.chaosValue,
      80
    );
  });

  it('returns undefined for a tier with no generic line', () => {
    const index = buildNinjaIndex(itemSource(NinjaItemType.Map), league, maps);

    assert.equal(valueFromIndex(map('Toxic Sewer Map', 9), index), undefined);
  });

  // Blighted lines are generic too: one line per tier, no base type at all.
  it('prices a blighted map off its tier line', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.BlightedMap),
      league,
      {
        lines: [
          { name: 'Blighted Map (Tier 16)', chaosValue: 60 },
          { name: 'Blighted Map (Tier 3)', chaosValue: 2 }
        ]
      }
    );

    assert.equal(
      valueFromIndex(map('Blighted Cemetery Map', 16), index)?.chaosValue,
      60
    );
    assert.equal(
      valueFromIndex(map('Blighted Cemetery Map', 9), index),
      undefined
    );
  });

  // Unique maps invert it: the unique name is in name, the tier in baseType.
  it('matches a unique map on its name and the tier from baseType', () => {
    const index = buildNinjaIndex(itemSource(NinjaItemType.UniqueMap), league, {
      lines: [
        { name: 'Cortex', baseType: 'Map (Tier 14)', chaosValue: 33 },
        { name: 'Replica Cortex', baseType: 'Map (Tier 14)', chaosValue: 90 }
      ]
    });
    const cortex = (tier: number) =>
      unique({
        name: 'Cortex',
        baseType: 'Vaal Temple Map',
        properties: [property('Map Tier', String(tier))]
      });

    assert.equal(valueFromIndex(cortex(14), index)?.chaosValue, 33);
    assert.equal(valueFromIndex(cortex(16), index), undefined);
  });
});

describe('currency overview index', () => {
  const payload = {
    lines: [
      { currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 },
      { currencyTypeName: 'Divine Orb', chaosEquivalent: 335.9 },
      // pay is absent on 33 of 47 live lines.
      { currencyTypeName: 'Mirror of Kalandra', chaosEquivalent: 391008 }
    ]
  };

  it('indexes lines with no pay side', () => {
    const index = buildNinjaIndex(currencySource, league, payload);

    assert.equal(
      valueFromIndex(currency('Mirror of Kalandra'), index)?.chaosValue,
      391008
    );
  });

  it('multiplies by stack size', () => {
    const index = buildNinjaIndex(currencySource, league, payload);
    const value = valueFromIndex(currency('Chaos Orb', 20), index);

    assert.equal(value?.unitChaosValue, 1);
    assert.equal(value?.chaosValue, 20);
    assert.equal(value?.stackSize, 20);
  });

  it('returns undefined for an unlisted currency', () => {
    const index = buildNinjaIndex(currencySource, league, payload);

    assert.equal(
      valueFromIndex(currency('Albino Rhoa Feather'), index),
      undefined
    );
  });

  // Chaos is the denominator, so poe.ninja publishes no line for it.
  it('prices the Chaos Orb itself even with no line', () => {
    const index = buildNinjaIndex(currencySource, league, {
      lines: [{ currencyTypeName: 'Divine Orb', chaosEquivalent: 335.9 }]
    });
    const value = valueFromIndex(currency('Chaos Orb', 350), index);

    assert.equal(value?.unitChaosValue, 1);
    assert.equal(value?.chaosValue, 350);
  });
});

describe('exchange overview index', () => {
  const source = exchangeSource(NinjaExchangeType.Scarab);
  const payload = {
    core: {
      primary: 'chaos',
      secondary: 'divine',
      rates: { divine: 0.002977 }
    },
    lines: [{ id: 'winged-sulphite-scarab', primaryValue: 2.4 }],
    items: [
      { id: 'winged-sulphite-scarab', name: 'Winged Sulphite Scarab' },
      // An items entry with no line must not become a zero-priced entry.
      { id: 'rusted-sulphite-scarab', name: 'Rusted Sulphite Scarab' }
    ]
  };

  it('joins items to lines by id', () => {
    const index = buildNinjaIndex(source, league, payload);

    assert.equal(
      valueFromIndex(currency('Winged Sulphite Scarab'), index)?.chaosValue,
      2.4
    );
  });

  it('skips items with no line', () => {
    const index = buildNinjaIndex(source, league, payload);

    assert.equal(
      valueFromIndex(currency('Rusted Sulphite Scarab'), index),
      undefined
    );
  });

  // primaryValue is denominated in core.primary, so a different primary would
  // mean every number is in the wrong currency.
  it('indexes nothing when the primary currency is not chaos', () => {
    const index = buildNinjaIndex(source, league, {
      ...payload,
      core: { ...payload.core, primary: 'divine' }
    });

    assert.deepEqual(index.entries, {});
  });

  it('prices the Chaos Orb itself even with no line', () => {
    const index = buildNinjaIndex(source, league, payload);

    assert.equal(valueFromIndex(currency('Chaos Orb'), index)?.chaosValue, 1);
  });

  it('reads the divine rate from core', () => {
    assert.equal(getExchangeDivineRate(payload), 0.002977);
    assert.equal(
      getExchangeDivineRate({ core: {}, lines: [], items: [] }),
      undefined
    );
  });
});

describe('toItemValue', () => {
  const rate = 1 / 335.9;
  const item = makeItem();

  it('reports chaos below one divine', () => {
    const value = toItemValue(item, 335.9 * 0.99, rate);

    assert.equal(value.currency, 'chaos');
    assert.equal(value.value, value.chaosValue);
  });

  it('reports divine at exactly one divine', () => {
    const value = toItemValue(item, 335.9, rate);

    assert.equal(value.currency, 'divine');
    assert.equal(Math.round(value.value), 1);
  });

  it('reports divine above one divine', () => {
    assert.equal(toItemValue(item, 34145, rate).currency, 'divine');
  });

  // Without a rate there is nothing to convert with, so chaos is all we can say.
  it('stays in chaos without a rate', () => {
    const value = toItemValue(item, 34145);

    assert.equal(value.currency, 'chaos');
    assert.equal(value.value, 34145);
  });

  it('applies the rate to the stack total, not the unit price', () => {
    const value = toItemValue(makeItem({ stackSize: 400 }), 1, rate);

    assert.equal(value.currency, 'divine');
    assert.equal(value.unitChaosValue, 1);
    assert.equal(value.chaosValue, 400);
  });
});

describe('getItemLookupKeys', () => {
  // Currency and exchange are keyed on base type alone, so an item without one
  // has nothing to look up rather than a key that matches everything.
  it('yields no keys for a currency item with no base type', () => {
    assert.deepEqual(getItemLookupKeys(makeItem(), currencySource), []);
    assert.deepEqual(
      getItemLookupKeys(makeItem(), exchangeSource(NinjaExchangeType.Scarab)),
      []
    );
  });

  // poe.ninja publishes only a handful of level and quality combinations, so a
  // gem whose level we cannot read is left unpriced rather than matched loosely.
  it('yields no keys for a gem with no level property', () => {
    assert.deepEqual(
      getItemLookupKeys(
        makeItem({
          baseType: 'Anger',
          frameTypeId: ItemFrameType.Gem,
          properties: [property('Quality', '+20%')]
        }),
        itemSource(NinjaItemType.SkillGem)
      ),
      []
    );
  });

  it('yields no keys for an item with neither a name nor a base type', () => {
    assert.deepEqual(
      getItemLookupKeys(makeItem(), itemSource(NinjaItemType.UniqueWeapon)),
      []
    );
  });
});

// The proxy passes poe.ninja's payloads through untouched, so a partial or
// reshaped response has to drop rows rather than index undefined prices.
describe('malformed overview payloads', () => {
  it('skips item lines with no name or chaos value', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueWeapon),
      league,
      {
        lines: [
          { baseType: 'Infernal Sword', chaosValue: 12 },
          { name: 'Starforge', baseType: 'Infernal Sword', chaosValue: '12' },
          null,
          { name: 'Voltaxic Rift', baseType: 'Spine Bow', chaosValue: 44 }
        ]
      }
    );

    assert.deepEqual(Object.keys(index.entries).length > 0, true);
    assert.equal(
      valueFromIndex(
        unique({ name: 'Starforge', baseType: 'Infernal Sword' }),
        index
      ),
      undefined
    );
    assert.equal(
      valueFromIndex(
        unique({ name: 'Voltaxic Rift', baseType: 'Spine Bow' }),
        index
      )?.chaosValue,
      44
    );
  });

  it('indexes nothing from an item payload with no lines', () => {
    const index = buildNinjaIndex(
      itemSource(NinjaItemType.UniqueWeapon),
      league,
      {}
    );

    assert.deepEqual(index.entries, {});
  });

  it('skips currency lines with no name or chaos equivalent', () => {
    const index = buildNinjaIndex(currencySource, league, {
      lines: [
        { chaosEquivalent: 5 },
        { currencyTypeName: 'Divine Orb', chaosEquivalent: '335.9' },
        null,
        { currencyTypeName: 'Orb of Fusing', chaosEquivalent: 0.5 }
      ]
    });

    assert.equal(valueFromIndex(currency('Divine Orb'), index), undefined);
    assert.equal(
      valueFromIndex(currency('Orb of Fusing'), index)?.chaosValue,
      0.5
    );
  });

  // Chaos is still seeded at one even when there is nothing else to index.
  it('seeds only the Chaos Orb from a currency payload with no lines', () => {
    const index = buildNinjaIndex(currencySource, league, {});

    assert.deepEqual(index.entries, { 'Chaos Orb': { chaosValue: 1 } });
  });

  it('seeds only the Chaos Orb from an exchange payload with no lines', () => {
    const index = buildNinjaIndex(
      exchangeSource(NinjaExchangeType.Scarab),
      league,
      { core: { primary: 'chaos' } }
    );

    assert.deepEqual(index.entries, { 'Chaos Orb': { chaosValue: 1 } });
  });

  // Lines are joined to items by id, so an entry without one cannot be priced.
  it('skips exchange items with no id and lines with no primary value', () => {
    const index = buildNinjaIndex(
      exchangeSource(NinjaExchangeType.Scarab),
      league,
      {
        core: { primary: 'chaos' },
        lines: [
          { id: 'winged-sulphite-scarab', primaryValue: 2.4 },
          { primaryValue: 9 },
          { id: 'rusted-sulphite-scarab', primaryValue: '9' }
        ],
        items: [
          { id: 'winged-sulphite-scarab', name: 'Winged Sulphite Scarab' },
          { name: 'Idless Scarab' },
          { id: 'rusted-sulphite-scarab', name: 'Rusted Sulphite Scarab' }
        ]
      }
    );

    assert.equal(
      valueFromIndex(currency('Winged Sulphite Scarab'), index)?.chaosValue,
      2.4
    );
    assert.equal(valueFromIndex(currency('Idless Scarab'), index), undefined);
    assert.equal(
      valueFromIndex(currency('Rusted Sulphite Scarab'), index),
      undefined
    );
  });
});
