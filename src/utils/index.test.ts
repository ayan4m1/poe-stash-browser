import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FilterForm,
  FilterQuery,
  Item,
  ItemFrameType,
  ItemProperty,
  ItemRarity,
  ItemSocket,
  ItemType,
  SocketColor
} from '../types';
import {
  buildItemText,
  cannotSaveTypes,
  interpolateProperties,
  itemFrameTypeNames,
  itemMatchesFilter,
  parseRateLimitRule,
  rarityColors,
  shouldUseSlimDisplay,
  socketColorStyles
} from './index';
import { makeItem } from './testItems';

const property = (name: string, ...values: string[]): ItemProperty => ({
  name,
  values: values.map((value) => [value, 0])
});

const socket = (sColour: SocketColor, group = 0): ItemSocket => ({
  group,
  attr: 'S' as const,
  sColour
});

const query = (
  value: string,
  rest: Partial<FilterQuery> = {}
): FilterQuery => ({
  id: value,
  value,
  ...rest
});

const filter = (overrides: Partial<FilterForm> = {}): FilterForm => ({
  influences: [],
  queries: [],
  ...overrides
});

const matches = (item: Item, overrides: Partial<FilterForm> = {}) =>
  itemMatchesFilter(item, filter(overrides));

describe('parseRateLimitRule', () => {
  // GGG publishes these as hits:period:restriction triples.
  it('parses a well formed rule', () => {
    assert.deepEqual(parseRateLimitRule('5:10:60'), [5, 10, 60]);
  });

  it('falls back for a rule with the wrong number of parts', () => {
    assert.deepEqual(parseRateLimitRule('5:10'), [1, 10, 0]);
    assert.deepEqual(parseRateLimitRule('5:10:60:0'), [1, 10, 0]);
    assert.deepEqual(parseRateLimitRule(''), [1, 10, 0]);
  });

  it('falls back for a rule with a non-numeric part', () => {
    assert.deepEqual(parseRateLimitRule('5:ten:60'), [1, 10, 0]);
  });
});

describe('interpolateProperties', () => {
  it('substitutes a positional token', () => {
    assert.equal(
      interpolateProperties(property('Quality', '+20%')),
      'Quality: +20%'
    );
  });

  it('substitutes every token in order', () => {
    assert.equal(
      interpolateProperties(property('Elemental Damage: {0} to {1}', '5', '9')),
      'Elemental Damage: 5 to 9'
    );
  });

  // Most properties are a name plus a value rather than a template, so the
  // first missing token ends the loop with a plain "Name: value".
  it('appends the first value when there is no token', () => {
    assert.equal(
      interpolateProperties(property('Map Tier', '16')),
      'Map Tier: 16'
    );
  });

  it('prefixes a requirement', () => {
    assert.equal(
      interpolateProperties(property('Level', '68'), true),
      'Requires Level: 68'
    );
  });

  it('returns the bare name for a property with no values', () => {
    assert.equal(interpolateProperties(property('Corrupted')), 'Corrupted');
  });
});

describe('buildItemText', () => {
  it('opens with the name and type line', () => {
    const text = buildItemText(
      makeItem({ name: 'Kingmaker', typeLine: 'Despot Axe' })
    );

    assert.equal(text.split('\n')[0], 'Kingmaker Despot Axe');
  });

  it('includes every property bucket and the requirements', () => {
    const text = buildItemText(
      makeItem({
        properties: [property('Quality', '+20%')],
        notableProperties: [property('Notable', 'yes')],
        additionalProperties: [property('Experience', '1/100')],
        requirements: [property('Level', '68')]
      })
    );

    assert.ok(text.includes('Quality: +20%'));
    assert.ok(text.includes('Notable: yes'));
    assert.ok(text.includes('Experience: 1/100'));
    assert.ok(text.includes('Requires Level: 68'));
  });

  it('joins implicit and explicit mods', () => {
    const text = buildItemText(
      makeItem({
        implicitMods: [{ description: 'Has 1 Abyssal Socket' }],
        explicitMods: [
          { description: '+40 to Strength' },
          { description: '+12% to Fire Resistance' }
        ]
      })
    );

    assert.ok(text.includes('Has 1 Abyssal Socket'));
    assert.ok(text.includes('+40 to Strength'));
    assert.ok(text.includes('+12% to Fire Resistance'));
  });

  it('survives an item with no properties or mods', () => {
    assert.equal(typeof buildItemText(makeItem()), 'string');
  });
});

describe('itemMatchesFilter query modes', () => {
  const starforge = makeItem({
    name: 'Starforge',
    typeLine: 'Infernal Sword',
    baseType: 'Infernal Sword',
    explicitMods: [{ description: '+40 to Strength' }]
  });

  it('matches with no queries at all', () => {
    assert.equal(matches(starforge), true);
  });

  it('requires every bare query to match', () => {
    assert.equal(
      matches(starforge, { queries: [query('Starforge'), query('Strength')] }),
      true
    );
    assert.equal(
      matches(starforge, { queries: [query('Starforge'), query('Dexterity')] }),
      false
    );
  });

  it('requires every and query to match', () => {
    assert.equal(
      matches(starforge, {
        queries: [query('Starforge'), query('Strength', { mode: 'and' })]
      }),
      true
    );
    assert.equal(
      matches(starforge, {
        queries: [query('Starforge'), query('Dexterity', { mode: 'and' })]
      }),
      false
    );
  });

  it('rejects when a not query matches', () => {
    assert.equal(
      matches(starforge, { queries: [query('Strength', { mode: 'not' })] }),
      false
    );
    assert.equal(
      matches(starforge, { queries: [query('Dexterity', { mode: 'not' })] }),
      true
    );
  });

  // The or group is an alternative to the whole base group, so it can rescue an
  // item the base group rejected.
  it('lets an or query rescue a failing base group', () => {
    assert.equal(
      matches(starforge, {
        queries: [query('Dexterity'), query('Starforge', { mode: 'or' })]
      }),
      true
    );
  });

  it('rejects when neither the base group nor any or query matches', () => {
    assert.equal(
      matches(starforge, {
        queries: [query('Dexterity'), query('Intelligence', { mode: 'or' })]
      }),
      false
    );
  });

  it('ignores a blank query', () => {
    assert.equal(matches(starforge, { queries: [query('   ')] }), true);
  });

  // Users type regex directly, so a half-finished one must not throw.
  it('never matches on an invalid text regex', () => {
    assert.equal(matches(starforge, { queries: [query('Star(')] }), false);
  });

  it('never matches on an invalid range regex', () => {
    assert.equal(
      matches(starforge, {
        queries: [
          query('Strength(', { type: 'range', operator: '>', numberValue: 1 })
        ]
      }),
      false
    );
  });

  // An invalid range regex typed before an operator or threshold was picked
  // still has to compile to something inert.
  it('never matches on an invalid range regex with no operator', () => {
    assert.equal(
      matches(starforge, { queries: [query('Strength(', { type: 'range' })] }),
      false
    );
  });
});

describe('itemMatchesFilter range queries', () => {
  const item = makeItem({
    name: 'Starforge',
    explicitMods: [{ description: '+40 to Strength' }]
  });

  const range = (
    operator: FilterQuery['operator'],
    numberValue: number
  ): Partial<FilterForm> => ({
    queries: [query('Strength', { type: 'range', operator, numberValue })]
  });

  it('compares with every operator', () => {
    assert.equal(matches(item, range('>', 30)), true);
    assert.equal(matches(item, range('>', 40)), false);
    assert.equal(matches(item, range('>=', 40)), true);
    assert.equal(matches(item, range('<', 50)), true);
    assert.equal(matches(item, range('<', 40)), false);
    assert.equal(matches(item, range('<=', 40)), true);
    assert.equal(matches(item, range('=', 40)), true);
    assert.equal(matches(item, range('=', 41)), false);
  });

  it('defaults to equality against a zero threshold', () => {
    assert.equal(
      matches(item, { queries: [query('Strength', { type: 'range' })] }),
      false
    );
  });

  // A mod can match the pattern and still carry nothing to compare against.
  it('rejects when the matching line has no numbers in it', () => {
    const frozen = makeItem({
      name: 'Kaom Roots',
      explicitMods: [{ description: 'Cannot be Frozen' }]
    });

    assert.equal(
      matches(frozen, {
        queries: [
          query('Frozen', { type: 'range', operator: '>', numberValue: 0 })
        ]
      }),
      false
    );
  });

  it('rejects when no line matches the property pattern', () => {
    assert.equal(
      matches(item, {
        queries: [
          query('Dexterity', { type: 'range', operator: '>', numberValue: 1 })
        ]
      }),
      false
    );
  });
});

describe('itemMatchesFilter attributes', () => {
  const axe = makeItem({
    name: 'Kingmaker',
    baseType: 'Despot Axe',
    rarity: ItemRarity.Unique,
    frameTypeId: ItemFrameType.Unique,
    properties: [property('Two Handed Axe')]
  });

  it('filters on rarity', () => {
    assert.equal(matches(axe, { rarity: ItemRarity.Unique }), true);
    assert.equal(matches(axe, { rarity: ItemRarity.Rare }), false);
  });

  it('filters on item class', () => {
    assert.equal(matches(axe, { itemType: ItemType.TwoHandedAxe }), true);
    assert.equal(matches(axe, { itemType: ItemType.Bow }), false);
  });

  it('filters on frame type', () => {
    assert.equal(matches(axe, { frameTypeId: ItemFrameType.Unique }), true);
    assert.equal(matches(axe, { frameTypeId: ItemFrameType.Rare }), false);
  });

  it('filters on a base type substring, case-insensitively', () => {
    assert.equal(matches(axe, { baseType: 'despot' }), true);
    assert.equal(matches(axe, { baseType: 'Bow' }), false);
  });

  it('filters on item level bounds', () => {
    assert.equal(matches(axe, { minItemLevel: 84 }), true);
    assert.equal(matches(axe, { minItemLevel: 85 }), false);
    assert.equal(matches(axe, { maxItemLevel: 84 }), true);
    assert.equal(matches(axe, { maxItemLevel: 83 }), false);
  });

  it('filters on stack size bounds', () => {
    const stack = makeItem({ baseType: 'Chaos Orb', stackSize: 20 });

    assert.equal(matches(stack, { minStackSize: 20 }), true);
    assert.equal(matches(stack, { minStackSize: 21 }), false);
    assert.equal(matches(stack, { maxStackSize: 20 }), true);
    assert.equal(matches(stack, { maxStackSize: 19 }), false);
  });

  // An item with no stack at all is not a stack of zero, so the bound is
  // skipped rather than failed.
  it('ignores stack bounds for an item with no stack', () => {
    assert.equal(matches(axe, { minStackSize: 5 }), true);
  });

  it('filters on required level bounds', () => {
    const levelled = makeItem({ requirements: [property('Level', '68')] });

    assert.equal(matches(levelled, { minRequiredLevel: 68 }), true);
    assert.equal(matches(levelled, { minRequiredLevel: 69 }), false);
    assert.equal(matches(levelled, { maxRequiredLevel: 68 }), true);
    assert.equal(matches(levelled, { maxRequiredLevel: 67 }), false);
  });

  it('rejects a required level filter when the level cannot be read', () => {
    assert.equal(matches(axe, { minRequiredLevel: 1 }), false);
    assert.equal(
      matches(makeItem({ requirements: [property('Level')] }), {
        maxRequiredLevel: 100
      }),
      false
    );
    assert.equal(
      matches(makeItem({ requirements: [property('Level', 'nine')] }), {
        minRequiredLevel: 1
      }),
      false
    );
  });
});

describe('itemMatchesFilter sockets and links', () => {
  const chest = makeItem({
    baseType: 'Vaal Regalia',
    sockets: [
      socket(SocketColor.Red),
      socket(SocketColor.Red),
      socket(SocketColor.Blue),
      socket(SocketColor.Green, 1)
    ]
  });

  it('filters on a minimum per colour', () => {
    assert.equal(
      matches(chest, { minSockets: { [SocketColor.Red]: 2 } }),
      true
    );
    assert.equal(
      matches(chest, { minSockets: { [SocketColor.Red]: 3 } }),
      false
    );
    assert.equal(
      matches(chest, { minSockets: { [SocketColor.White]: 1 } }),
      false
    );
  });

  // Any is a total across every colour rather than a colour of its own.
  it('filters on a minimum total via Any', () => {
    assert.equal(
      matches(chest, { minSockets: { [SocketColor.Any]: 4 } }),
      true
    );
    assert.equal(
      matches(chest, { minSockets: { [SocketColor.Any]: 5 } }),
      false
    );
  });

  it('counts no sockets for an item that has none', () => {
    assert.equal(
      matches(makeItem(), { minSockets: { [SocketColor.Any]: 1 } }),
      false
    );
  });

  it('filters on a minimum link count', () => {
    assert.equal(matches(chest, { minLinks: 3 }), true);
    assert.equal(matches(chest, { minLinks: 4 }), false);
  });
});

describe('itemMatchesFilter flags', () => {
  const flags = [
    ['corrupted', 'corrupted'],
    ['identified', 'identified'],
    ['veiled', 'veiled'],
    ['synthesised', 'synthesised'],
    ['fractured', 'fractured'],
    ['replica', 'replica'],
    // mirrored reads the API duplicated field, which is an easy one to wire up
    // to the wrong property.
    ['mirrored', 'duplicated']
  ] as const;

  for (const [filterKey, itemKey] of flags) {
    it(`filters on ${filterKey}`, () => {
      const on = makeItem({ [itemKey]: true });
      const off = makeItem({ [itemKey]: false });

      assert.equal(matches(on, { [filterKey]: true }), true);
      assert.equal(matches(on, { [filterKey]: false }), false);
      assert.equal(matches(off, { [filterKey]: true }), false);
      assert.equal(matches(off, { [filterKey]: false }), true);
    });
  }

  // An absent flag is false rather than unknown.
  it('treats an absent flag as false', () => {
    assert.equal(matches(makeItem(), { corrupted: false }), true);
    assert.equal(matches(makeItem(), { corrupted: true }), false);
  });
});

describe('itemMatchesFilter influences', () => {
  it('matches the top level influence flags', () => {
    const elder = makeItem({ elder: true });

    assert.equal(matches(elder, { influences: ['elder'] }), true);
    assert.equal(matches(elder, { influences: ['shaper'] }), false);
  });

  // The rest live in the influences map, keyed by name.
  it('matches the mapped influences', () => {
    const crusader = makeItem({ influences: { crusader: true } });

    assert.equal(matches(crusader, { influences: ['crusader'] }), true);
    assert.equal(matches(crusader, { influences: ['hunter'] }), false);
  });

  it('requires every requested influence', () => {
    const both = makeItem({ elder: true, influences: { warlord: true } });

    assert.equal(matches(both, { influences: ['elder', 'warlord'] }), true);
    assert.equal(matches(both, { influences: ['elder', 'hunter'] }), false);
  });
});

describe('display helpers', () => {
  it('uses the slim display for stackable and gem-like frames', () => {
    assert.equal(
      shouldUseSlimDisplay(makeItem({ frameTypeId: ItemFrameType.Currency })),
      true
    );
    assert.equal(
      shouldUseSlimDisplay(
        makeItem({ frameTypeId: ItemFrameType.DivinationCard })
      ),
      true
    );
    assert.equal(
      shouldUseSlimDisplay(makeItem({ frameTypeId: ItemFrameType.Gem })),
      true
    );
    assert.equal(
      shouldUseSlimDisplay(makeItem({ frameTypeId: ItemFrameType.Unique })),
      false
    );
  });

  it('names every frame type', () => {
    assert.equal(itemFrameTypeNames[ItemFrameType.DivinationCard], 'Div Card');
    assert.equal(itemFrameTypeNames[ItemFrameType.Normal], 'Normal');
  });

  it('styles every socket colour', () => {
    for (const colour of Object.values(SocketColor)) {
      assert.ok(socketColorStyles[colour].backgroundColor);
    }
  });

  it('colours every rarity', () => {
    assert.ok(rarityColors[ItemRarity.Unique]);
    assert.ok(rarityColors[ItemRarity.Normal]);
  });

  // Saving a price for a stackable makes no sense, so these are excluded.
  it('excludes stackables from saving', () => {
    assert.ok(cannotSaveTypes.includes(ItemFrameType.Currency));
    assert.equal(cannotSaveTypes.includes(ItemFrameType.Unique), false);
  });
});
