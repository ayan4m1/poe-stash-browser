import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Item } from '../types';
import {
  ActiveSortKey,
  applyOrder,
  buildSortRows,
  sortItems,
  sortRows
} from './sorting';
import { makeItem } from './testItems';

const names = (items: Item[]) =>
  items.map((item) => item.name || item.typeLine);

const sortedNames = (items: Item[], sortKey: ActiveSortKey) =>
  names(applyOrder(items, sortRows(buildSortRows(items), sortKey)));

describe('buildSortRows', () => {
  it('carries the index of each item in the original array', () => {
    const rows = buildSortRows([
      makeItem({ name: 'Kingmaker' }),
      makeItem({ name: 'Starforge' })
    ]);

    assert.deepEqual(
      rows.map((row) => row.index),
      [0, 1]
    );
  });

  // Only uniques and rares carry a name; everything else is named by typeLine.
  it('falls back to typeLine for an item with no name', () => {
    const [row] = buildSortRows([makeItem({ typeLine: 'Chaos Orb' })]);

    assert.equal(row.name, 'Chaos Orb');
  });

  it('prefers the name when an item has both', () => {
    const [row] = buildSortRows([
      makeItem({ name: 'Kingmaker', typeLine: 'Despot Axe' })
    ]);

    assert.equal(row.name, 'Kingmaker');
  });

  // The comparator subtracts and compares these directly, so an absent field
  // has to arrive as a number and a string rather than undefined.
  it('defaults an absent stash tab and stack size', () => {
    const [row] = buildSortRows([makeItem()]);

    assert.equal(row.stashTab, '');
    assert.equal(row.stackSize, 0);
  });
});

describe('sortRows', () => {
  it('returns original indices, not sorted positions', () => {
    const items = [
      makeItem({ name: 'Starforge' }),
      makeItem({ name: 'Andvarius' })
    ];
    const order = sortRows(buildSortRows(items), 'name');

    assert.ok(order instanceof Uint32Array);
    assert.deepEqual(Array.from(order), [1, 0]);
  });

  it('sorts by name ascending', () => {
    const items = [
      makeItem({ name: 'Starforge' }),
      makeItem({ name: 'Andvarius' }),
      makeItem({ name: 'Kingmaker' })
    ];

    assert.deepEqual(sortedNames(items, 'name'), [
      'Andvarius',
      'Kingmaker',
      'Starforge'
    ]);
  });

  // A plain < comparison orders every capital ahead of every lowercase, which
  // is the reason this goes through Intl.Collator.
  it('orders names case-insensitively', () => {
    const items = [
      makeItem({ name: 'anger' }),
      makeItem({ name: 'Blight' }),
      makeItem({ name: 'Anger' })
    ];

    assert.deepEqual(sortedNames(items, 'name'), ['anger', 'Anger', 'Blight']);
  });

  it('sorts by stash tab ascending', () => {
    const items = [
      makeItem({ name: 'c', stashTab: 'Uniques' }),
      makeItem({ name: 'a', stashTab: 'Currency' }),
      makeItem({ name: 'b', stashTab: 'Maps' })
    ];

    assert.deepEqual(sortedNames(items, 'stashTab'), ['a', 'b', 'c']);
  });

  // Item level and stack size are "best first", so both run descending.
  it('sorts by item level descending', () => {
    const items = [
      makeItem({ name: 'low', ilvl: 68 }),
      makeItem({ name: 'high', ilvl: 86 }),
      makeItem({ name: 'mid', ilvl: 75 })
    ];

    assert.deepEqual(sortedNames(items, 'ilvl'), ['high', 'mid', 'low']);
  });

  it('sorts by stack size descending, with an absent stack last', () => {
    const items = [
      makeItem({ name: 'small', stackSize: 3 }),
      makeItem({ name: 'none' }),
      makeItem({ name: 'big', stackSize: 400 })
    ];

    assert.deepEqual(sortedNames(items, 'stackSize'), ['big', 'small', 'none']);
  });

  it('returns an empty order for no rows', () => {
    assert.deepEqual(Array.from(sortRows([], 'name')), []);
  });

  // The switch keeps a default arm the ActiveSortKey type rules out; an
  // unrecognised key has to leave the order alone rather than throw.
  it('leaves the order untouched for an unrecognised key', () => {
    const items = [
      makeItem({ name: 'Starforge' }),
      makeItem({ name: 'Andvarius' })
    ];
    const order = sortRows(buildSortRows(items), 'none' as ActiveSortKey);

    assert.deepEqual(Array.from(order), [0, 1]);
  });
});

describe('applyOrder', () => {
  it('reorders items by index', () => {
    const items = [
      makeItem({ name: 'a' }),
      makeItem({ name: 'b' }),
      makeItem({ name: 'c' })
    ];

    assert.deepEqual(names(applyOrder(items, Uint32Array.from([2, 0, 1]))), [
      'c',
      'a',
      'b'
    ]);
  });

  it('returns an empty array for an empty order', () => {
    assert.deepEqual(applyOrder([makeItem()], new Uint32Array(0)), []);
  });
});

describe('sortItems', () => {
  it('returns an empty array for null items', () => {
    assert.deepEqual(sortItems(null, 'name'), []);
  });

  // The unsorted case has to hand back the very same array - SearchResults
  // leans on the reference staying stable to avoid a re-render.
  it('returns the same array reference for the none key', () => {
    const items = [makeItem({ name: 'Starforge' })];

    assert.equal(sortItems(items, 'none'), items);
  });

  it('sorts through the full pipeline', () => {
    const items = [
      makeItem({ name: 'Starforge' }),
      makeItem({ name: 'Andvarius' })
    ];

    assert.deepEqual(names(sortItems(items, 'name')), [
      'Andvarius',
      'Starforge'
    ]);
    // The input is left alone; a new array comes back.
    assert.deepEqual(names(items), ['Starforge', 'Andvarius']);
  });
});
