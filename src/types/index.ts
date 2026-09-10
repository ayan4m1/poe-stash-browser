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
  Normal = 'Normal',
  Magic = 'Magic',
  Rare = 'Rare',
  Unique = 'Unique',
  Gem = 'Gem',
  Currency = 'Currency',
  DivinationCard = 'DivinationCard',
  Quest = 'Quest',
  Prophecy = 'Prophecy',
  Foil = 'Foil',
  SupporterFoil = 'SupporterFoil',
  Necropolis = 'Necropolis',
  Gold = 'Gold',
  Breach = 'Breach'
}

export enum ItemType {
  TwoHandedAxe = 'Two Handed Axe',
  OneHandedAxe = 'One Handed Axe',
  TwoHandedSword = 'Two Handed Sword',
  OneHandedSword = 'One Handed Sword',
  ThrustingOneHandedSword = 'Thrusting One Handed Sword',
  TwoHandedMace = 'Two Handed Mace',
  OneHandedMace = 'One Handed Mace',
  Staff = 'Staff',
  Warstaff = 'Warstaff',
  Mace = 'Mace',
  Dagger = 'Dagger',
  RuneDagger = 'Rune Dagger',
  Claw = 'Claw',
  Bow = 'Bow',
  Wand = 'Wand',
  Sceptre = 'Sceptre',
  FishingRod = 'Fishing Rod',
  BodyArmour = 'Body Armour',
  Helmet = 'Helmet',
  Shield = 'Shield',
  Belt = 'Belt',
  Boots = 'Boots',
  Gloves = 'Gloves',
  Armor = 'Armour',
  Quiver = 'Quiver',
  Amulet = 'Amulet',
  Ring = 'Ring',
  Trinket = 'Trinket',
  Jewel = 'Jewel',
  AbyssJewel = 'Abyss Jewel',
  Flask = 'Flask',
  Tincture = 'Tincture',
  Map = 'Map'
}

export enum ItemColor {
  Red = 'S',
  Green = 'D',
  Blue = 'I',
  White = 'G'
}

export enum SocketColor {
  Red = 'R',
  Green = 'G',
  Blue = 'B',
  White = 'W',
  Abyss = 'A',
  Any = '*'
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

export type ItemSocket = {
  group: number;
  attr: 'S' | 'I' | 'D';
  sColour: SocketColor;
};

export type ItemMod = {
  description: string;
  flags?: {
    fractured?: true;
    mutated?: true;
    crafted?: true;
    desecrated?: true;
    vestigial?: true;
  };
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
  sockets?: ItemSocket[];
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
  implicitMods?: ItemMod[];
  ultimatumMods?: {
    type: string;
    tier: number;
  }[];
  explicitMods?: ItemMod[];
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
  frameTypeId: ItemFrameType;
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

/** Predicate deciding whether an item belongs to some category. */
export type ItemMatcher = (item: Item) => boolean;

/** `type` values for the poe.ninja PoE 1 stash item overview endpoint. */
export enum NinjaItemType {
  Wombgift = 'Wombgift',
  Corpse = 'Corpse',
  Incubator = 'Incubator',
  UniqueWeapon = 'UniqueWeapon',
  UniqueArmour = 'UniqueArmour',
  UniqueAccessory = 'UniqueAccessory',
  UniqueFlask = 'UniqueFlask',
  UniqueJewel = 'UniqueJewel',
  ForbiddenJewel = 'ForbiddenJewel',
  ShrineBelt = 'ShrineBelt',
  UniqueTincture = 'UniqueTincture',
  UniqueRelic = 'UniqueRelic',
  SkillGem = 'SkillGem',
  ImbuedGem = 'ImbuedGem',
  ClusterJewel = 'ClusterJewel',
  Map = 'Map',
  BlightedMap = 'BlightedMap',
  BlightRavagedMap = 'BlightRavagedMap',
  UniqueMap = 'UniqueMap',
  ValdoMap = 'ValdoMap',
  Invitation = 'Invitation',
  Memory = 'Memory',
  IncursionTemple = 'IncursionTemple',
  ScryingOrb = 'ScryingOrb',
  BaseType = 'BaseType',
  Flask = 'Flask',
  Beast = 'Beast',
  Vial = 'Vial'
}

/** `type` values for the poe.ninja PoE 1 currency exchange overview endpoint. */
export enum NinjaExchangeType {
  Currency = 'Currency',
  Fragment = 'Fragment',
  Runegraft = 'Runegraft',
  AllflameEmber = 'AllflameEmber',
  Tattoo = 'Tattoo',
  Omen = 'Omen',
  DjinnCoin = 'DjinnCoin',
  Ducat = 'Ducat',
  EnshroudingCrystal = 'EnshroudingCrystal',
  DivinationCard = 'DivinationCard',
  Artifact = 'Artifact',
  Oil = 'Oil',
  DeliriumOrb = 'DeliriumOrb',
  Scarab = 'Scarab',
  Astrolabe = 'Astrolabe',
  Fossil = 'Fossil',
  Resonator = 'Resonator',
  Essence = 'Essence'
}

/** `type` values for the poe.ninja PoE 1 stash currency overview endpoint. */
export enum NinjaCurrencyType {
  Currency = 'Currency',
  Fragment = 'Fragment'
}

export type BooleanMode = 'and' | 'or' | 'not';

export type FilterQueryType = 'text' | 'range';

export type RangeOperator = '<' | '<=' | '>' | '>=' | '=';

export type FilterQuery = {
  id: string;
  value: string;
  mode?: BooleanMode;
  type?: FilterQueryType;
  operator?: RangeOperator;
  numberValue?: number;
};

export type MinSocketColors = {
  [SocketColor.Red]?: number;
  [SocketColor.Green]?: number;
  [SocketColor.Blue]?: number;
  [SocketColor.White]?: number;
  [SocketColor.Abyss]?: number;
  [SocketColor.Any]?: number;
};

type CompiledTextQuery = {
  kind: 'text';
  regex: RegExp | null;
  mode: FilterQuery['mode'];
};

type CompiledRangeQuery = {
  kind: 'range';
  propertyRegex: RegExp | null;
  operator: RangeOperator;
  threshold: number;
  mode: FilterQuery['mode'];
};

export type CompiledQuery = CompiledTextQuery | CompiledRangeQuery;

export type FilterForm = {
  rarity?: ItemRarity;
  itemType?: ItemType;
  frameTypeId?: ItemFrameType;
  baseType?: string;
  minSockets?: MinSocketColors;
  minLinks?: number;
  minRequiredLevel?: number;
  maxRequiredLevel?: number;
  minItemLevel?: number;
  maxItemLevel?: number;
  minStackSize?: number;
  maxStackSize?: number;
  corrupted?: boolean;
  identified?: boolean;
  veiled?: boolean;
  synthesised?: boolean;
  fractured?: boolean;
  replica?: boolean;
  mirrored?: boolean;
  influences: string[];
  queries: FilterQuery[];
};

export enum DisplayMode {
  Grid = 'grid',
  List = 'list'
}

export type SortKey = 'none' | 'name' | 'ilvl' | 'stashTab' | 'stackSize';

export type SettingsForm = {
  cacheHours: number;
};
