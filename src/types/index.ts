export type LeagueRule = {
  id: string;
  name: string;
  description?: string;
};

export type League = {
  id: string;
  realm?: string;
  name?: string;
  description?: string;
  category?: {
    id: string;
    current?: boolean;
  };
  rules?: LeagueRule[];
  registerAt: string;
  event?: boolean;
  goal?: string;
  url?: string;
  startAt?: string;
  endAt?: string;
  timedEvent?: boolean;
  scoreEvent?: boolean;
  delveEvent?: boolean;
  ancestorEvent?: boolean;
  leagueEvent?: boolean;
};

export type LeagueResponse = {
  leagues: League[];
};

export enum ItemRarity {
  Normal = 'Normal',
  Magic = 'Magic',
  Rare = 'Rare',
  Unique = 'Unique'
}

export type Item = {
  verified: boolean;
  w: number;
  h: number;
  icon: string;
  support?: boolean;
  stackSize?: number;
  maxStackSize?: number;
  stackSizeText?: string;
  iconTierText?: string;
  league?: string;
  id: string;
  name: string;
  typeLine: string;
  baseType: string;
  rarity?: ItemRarity;
  identified: boolean;
  itemLevel?: number;
};

export type StashTab = {
  id: string;
  parent?: string;
  folder?: string;
  name: string;
  type: string;
  index?: number;
  metadata: {
    public?: boolean;
    folder?: boolean;
    colour?: string;
    map?: object;
  };
  children?: StashTab[];
  items?: Item[];
};

export type StashesResponse = {
  stashes: StashTab[];
};

export type StashResponse = {
  stash: StashTab;
};
