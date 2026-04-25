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

export enum ItemFrameType {
  Normal = 0,
  Magic,
  Rare,
  Unique,
  Gem,
  Currency,
  DivinationCard,
  Quest,
  Prophecy,
  Foil,
  SupporterFoil,
  Necropolis,
  Gold,
  Breach
}

export const ItemFrameTypeNames = {
  [ItemFrameType.Normal]: 'Normal',
  [ItemFrameType.Magic]: 'Magic',
  [ItemFrameType.Rare]: 'Rare',
  [ItemFrameType.Unique]: 'Unique',
  [ItemFrameType.Gem]: 'Gem',
  [ItemFrameType.Currency]: 'Currency',
  [ItemFrameType.DivinationCard]: 'Div Card',
  [ItemFrameType.Quest]: 'Quest',
  [ItemFrameType.Prophecy]: 'Prophecy',
  [ItemFrameType.Foil]: 'Foil',
  [ItemFrameType.SupporterFoil]: 'Supporter Foil',
  [ItemFrameType.Necropolis]: 'Necropolis',
  [ItemFrameType.Gold]: 'Gold',
  [ItemFrameType.Breach]: 'Breach'
};

export enum ItemType {
  TwoHandedAxe = 'Two Handed Axe',
  OneHandedAxe = 'One Handed Axe',
  TwoHandedSword = 'Two Handed Sword',
  OneHandedSword = 'One Handed Sword',
  Staff = 'Staff',
  Mace = 'Mace',
  Dagger = 'Dagger',
  Wand = 'Wand',
  Shield = 'Shield',
  Belt = 'Belt',
  Boots = 'Boots',
  Gloves = 'Gloves',
  Armor = 'Armour',
  Amulet = 'Amulet',
  Ring = 'Ring'
}

export enum ItemColor {
  Red = 'S',
  Green = 'D',
  Blue = 'I',
  White = 'G'
}

export type ItemProperty = {
  name: string;
  values: [string, number][];
  displayMode?: number;
  progress?: number;
  type?: number;
  suffix?: string;
  icon?: string;
};

export type Item = {
  stashTab?: string;
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
  influences: object;
  elder?: true;
  shaper?: true;
  searing?: true;
  tangled?: true;
  memoryItem?: true;
  mutated?: true;
  abyssJewel?: true;
  delve?: true;
  fractured?: true;
  synthesised?: true;
  socketedItems: Item[];
  name: string;
  typeLine: string;
  baseType: string;
  rarity?: ItemRarity;
  identified: boolean;
  itemLevel?: number;
  ilvl: number;
  note?: string;
  forum_note?: string;
  lockedToCharacter?: true;
  lockedToAccount?: true;
  duplicated?: true;
  split?: true;
  corrupted?: true;
  unmodifiable?: true;
  unmodifiableExceptChaos?: true;
  properties?: ItemProperty[];
  notableProperties?: ItemProperty[];
  requirements?: ItemProperty[];
  additionalProperties?: ItemProperty[];
  nextLevelRequirements?: ItemProperty[];
  talismanTier?: number;
  rewards: {
    label: string;
    rewards: Record<string, number>;
  }[];
  secDescrText?: string;
  utilityMods?: string[];
  logbookMods?: {
    name: string;
    faction: {
      id: string;
      name: string;
    };
    mods: string[];
  }[];
  enchantMods?: string[];
  scourgeMods?: string[];
  implicitMods?: string[];
  ultimatumMods?: {
    type: string;
    tier: number;
  }[];
  explicitMods?: string[];
  craftedMods?: string[];
  fracturedMods?: string[];
  mutatedMods?: string[];
  crucibleMods?: string[];
  cosmeticMods?: string[];
  veiledMods?: string[];
  veiled?: true;
  descrText?: string;
  flavourText?: string[];
  flavourTextNote?: string;
  prophecyText?: string;
  isRelic?: true;
  foilVariation?: number;
  replica?: true;
  forseeing?: true;
  incubatedItem?: {
    name: string;
    level: number;
    progress: number;
    total: number;
  };
  scourged?: {
    tier: number;
    level?: number;
    progress?: number;
    total?: number;
  };
  crucible?: {
    layout: string;
    // TODO: nodes
  };
  ruthless?: true;
  frameType: ItemFrameType;
  artFilename: string;
  hybrid?: {
    isVaalGem?: boolean;
    baseTypeName: string;
    explicitMods?: string[];
    secDescrText?: string;
  };
  x?: number;
  y?: number;
  inventoryId?: string;
  socket?: number;
  colour?: ItemColor;
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

export type BooleanMode = 'and' | 'or' | 'not';

export type FilterQuery = {
  id: string;
  value: string;
  mode?: BooleanMode;
};

export type FilterForm = {
  rarity?: ItemRarity;
  itemType?: ItemType;
  frameType?: ItemFrameType;
  queries: FilterQuery[];
};
