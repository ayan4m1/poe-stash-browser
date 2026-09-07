import { Item, SortKey } from '../types';

export type ActiveSortKey = Exclude<SortKey, 'none'>;

/**
 * A compact projection of the fields the comparator needs. Sorting runs in a
 * worker, so shipping these instead of whole items keeps the structured clone
 * cheap - items carry large nested mod/property graphs.
 */
export interface SortRow {
  index: number;
  name: string;
  ilvl: number;
  stashTab: string;
  stackSize: number;
}

export interface SortRequest {
  id: number;
  rows: SortRow[];
  sortKey: ActiveSortKey;
}

export interface SortResponse {
  id: number;
  order: Uint32Array;
}

// One collator for every comparison, rather than the one per call that
// String.prototype.localeCompare creates.
const collator = new Intl.Collator();

export const buildSortRows = (items: Item[]): SortRow[] =>
  items.map((item, index) => ({
    index,
    name: item.name || item.typeLine,
    ilvl: item.ilvl,
    stashTab: item.stashTab ?? '',
    stackSize: item.stackSize ?? 0
  }));

export const sortRows = (
  rows: SortRow[],
  sortKey: ActiveSortKey
): Uint32Array => {
  const sorted = [...rows].sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return collator.compare(a.name, b.name);
      case 'ilvl':
        return b.ilvl - a.ilvl;
      case 'stashTab':
        return collator.compare(a.stashTab, b.stashTab);
      case 'stackSize':
        return b.stackSize - a.stackSize;
      default:
        return 0;
    }
  });

  const order = new Uint32Array(sorted.length);

  for (let i = 0; i < sorted.length; i++) {
    order[i] = sorted[i].index;
  }

  return order;
};

export const applyOrder = (items: Item[], order: Uint32Array): Item[] =>
  Array.from(order, (index) => items[index]);

/**
 * Synchronous sort on the main thread. Used as a fallback when the worker
 * cannot be started.
 */
export const sortItems = (items: Item[] | null, sortKey: SortKey): Item[] => {
  if (!items) {
    return [];
  }

  if (sortKey === 'none') {
    return items;
  }

  return applyOrder(items, sortRows(buildSortRows(items), sortKey));
};
