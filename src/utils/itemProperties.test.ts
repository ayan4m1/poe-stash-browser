import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemProperty,
  ItemSocket,
  SocketColor
} from '../types';
import {
  getDisplayName,
  getGemLevel,
  getGemQuality,
  getItemLevel,
  getLevelRequirement,
  getMapTier,
  getMaxLinkCount
} from './itemProperties';

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

const property = (name: string, value: string): ItemProperty => ({
  name,
  values: [[value, 0]]
});

const sockets = (groups: number[]): ItemSocket[] =>
  groups.map((group) => ({ group, attr: 'S', sColour: SocketColor.Red }));

describe('getGemLevel', () => {
  it('reads a plain level', () => {
    assert.equal(
      getGemLevel(makeItem({ properties: [property('Level', '20')] })),
      20
    );
  });

  // Max-level gems annotate the value rather than emitting a bare number.
  it('reads a maxed level', () => {
    assert.equal(
      getGemLevel(makeItem({ properties: [property('Level', '21 (Max)')] })),
      21
    );
  });

  it('returns undefined without a Level property', () => {
    assert.equal(getGemLevel(makeItem()), undefined);
  });

  it('returns undefined when the property has no values', () => {
    assert.equal(
      getGemLevel(makeItem({ properties: [{ name: 'Level', values: [] }] })),
      undefined
    );
  });
});

describe('getGemQuality', () => {
  it('strips the sign and percent', () => {
    assert.equal(
      getGemQuality(makeItem({ properties: [property('Quality', '+20%')] })),
      20
    );
  });

  it('reads zero quality', () => {
    assert.equal(
      getGemQuality(makeItem({ properties: [property('Quality', '+0%')] })),
      0
    );
  });

  // poe.ninja prices a gem with no Quality property as 0%.
  it('defaults to zero when absent', () => {
    assert.equal(getGemQuality(makeItem()), 0);
  });
});

describe('getMapTier', () => {
  it('reads the tier property', () => {
    assert.equal(
      getMapTier(makeItem({ properties: [property('Map Tier', '14')] })),
      14
    );
  });

  it('returns undefined for a non-map', () => {
    assert.equal(getMapTier(makeItem()), undefined);
  });
});

describe('getLevelRequirement', () => {
  it('reads the Level requirement', () => {
    assert.equal(
      getLevelRequirement(
        makeItem({ requirements: [property('Level', '68')] })
      ),
      68
    );
  });

  // The level requirement lives in requirements, not properties - a gem's
  // Level property is its gem level and means something else entirely.
  it('does not read the Level property', () => {
    assert.equal(
      getLevelRequirement(makeItem({ properties: [property('Level', '20')] })),
      undefined
    );
  });

  // poe.ninja omits levelRequired for exactly these - Tabula Rasa and friends.
  it('returns undefined for an item with no requirement', () => {
    assert.equal(getLevelRequirement(makeItem()), undefined);
    assert.equal(
      getLevelRequirement(makeItem({ requirements: [property('Str', '99')] })),
      undefined
    );
  });

  it('returns undefined for an unparseable value', () => {
    assert.equal(
      getLevelRequirement(
        makeItem({ requirements: [property('Level', 'none')] })
      ),
      undefined
    );
  });
});

describe('getItemLevel', () => {
  it('reads ilvl', () => {
    assert.equal(getItemLevel(makeItem({ ilvl: 84 })), 84);
  });

  it('falls back to itemLevel', () => {
    assert.equal(
      getItemLevel(makeItem({ ilvl: undefined, itemLevel: 71 })),
      71
    );
  });

  // Currency and other levelless items report zero rather than omitting it.
  it('returns undefined without a level', () => {
    assert.equal(getItemLevel(makeItem({ ilvl: 0 })), undefined);
    assert.equal(getItemLevel(makeItem({ ilvl: undefined })), undefined);
  });
});

describe('getMaxLinkCount', () => {
  it('counts a six-link', () => {
    assert.equal(
      getMaxLinkCount(makeItem({ sockets: sockets([0, 0, 0, 0, 0, 0]) })),
      6
    );
  });

  it('takes the largest group rather than the total', () => {
    assert.equal(
      getMaxLinkCount(makeItem({ sockets: sockets([0, 0, 0, 1, 1, 1]) })),
      3
    );
    assert.equal(
      getMaxLinkCount(makeItem({ sockets: sockets([0, 0, 1, 1, 2, 2]) })),
      2
    );
  });

  // Groups do not have to start at zero, and the first socket is still a group.
  it('handles a non-zero starting group', () => {
    assert.equal(
      getMaxLinkCount(makeItem({ sockets: sockets([1, 1, 1, 1, 1, 1]) })),
      6
    );
    assert.equal(getMaxLinkCount(makeItem({ sockets: sockets([0]) })), 1);
  });

  it('returns zero without sockets', () => {
    assert.equal(getMaxLinkCount(makeItem()), 0);
  });
});

describe('getDisplayName', () => {
  it('prefers the unique name', () => {
    assert.equal(
      getDisplayName(makeItem({ name: 'Kingmaker', baseType: 'Despot Axe' })),
      'Kingmaker'
    );
  });

  it('falls back to the base type', () => {
    assert.equal(
      getDisplayName(makeItem({ baseType: 'Chaos Orb' })),
      'Chaos Orb'
    );
  });
});
