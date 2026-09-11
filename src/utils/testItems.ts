import { Item, ItemFrameType } from '../types';

/**
 * A minimal stash item, for tests to spread their own fields over. Only the
 * fields the API always sends are filled in - anything a test cares about it
 * passes itself, so a factory call reads as the thing under test.
 *
 * This lives outside the *.test.ts files on purpose: node:test runs one process
 * per test file, and importing one test file from another re-registers its
 * suites in the importer's process.
 */
export const makeItem = (overrides: Partial<Item> = {}): Item => ({
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
