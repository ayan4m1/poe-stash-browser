import {
  Item,
  ItemFrameType,
  ItemMatcher,
  NinjaCurrencyType,
  NinjaExchangeType,
  NinjaItemType
} from '../types';
import {
  forbiddenJewelBaseTypes,
  isAccessory,
  isArmour,
  isEquipment,
  isFlask,
  isJewel,
  isMap,
  isTincture,
  isUnique,
  isWeapon
} from './itemClass';

/**
 * Categories whose base type naming could not be confirmed against live
 * poe.ninja data. Left unmatched rather than guessed, since a wrong pattern
 * would silently price items against the wrong overview.
 */
const unconfirmed: ItemMatcher = () => false;

const isCurrencyFrame: ItemMatcher = (item) =>
  item.frameTypeId === ItemFrameType.Currency;

const currencyEndingIn =
  (suffix: string): ItemMatcher =>
  (item) =>
    isCurrencyFrame(item) && item.baseType.endsWith(suffix);

const currencyContaining =
  (fragment: string): ItemMatcher =>
  (item) =>
    isCurrencyFrame(item) && item.baseType.includes(fragment);

export const ninjaItemTypeMatchers: Record<NinjaItemType, ItemMatcher> = {
  [NinjaItemType.Wombgift]: (item) => item.baseType.endsWith('Wombgift'),
  [NinjaItemType.Corpse]: (item) =>
    item.frameTypeId === ItemFrameType.Necropolis,
  [NinjaItemType.Incubator]: (item) => item.baseType.endsWith('Incubator'),
  [NinjaItemType.UniqueWeapon]: (item) => isUnique(item) && isWeapon(item),
  [NinjaItemType.UniqueArmour]: (item) => isUnique(item) && isArmour(item),
  [NinjaItemType.UniqueAccessory]: (item) =>
    isUnique(item) && isAccessory(item),
  [NinjaItemType.UniqueFlask]: (item) => isUnique(item) && isFlask(item),
  [NinjaItemType.UniqueJewel]: (item) => isUnique(item) && isJewel(item),
  [NinjaItemType.ForbiddenJewel]: (item) =>
    isUnique(item) && forbiddenJewelBaseTypes.has(item.baseType),
  [NinjaItemType.ShrineBelt]: unconfirmed,
  [NinjaItemType.UniqueTincture]: (item) => isUnique(item) && isTincture(item),
  [NinjaItemType.UniqueRelic]: (item) => item.isRelic === true,
  [NinjaItemType.SkillGem]: (item) => item.frameTypeId === ItemFrameType.Gem,
  [NinjaItemType.ImbuedGem]: unconfirmed,
  [NinjaItemType.ClusterJewel]: (item) =>
    item.baseType.endsWith('Cluster Jewel'),
  [NinjaItemType.Map]: isMap,
  [NinjaItemType.BlightedMap]: (item) =>
    isMap(item) && item.baseType.startsWith('Blighted '),
  [NinjaItemType.BlightRavagedMap]: (item) =>
    isMap(item) && item.baseType.startsWith('Blight-ravaged '),
  [NinjaItemType.UniqueMap]: (item) => isMap(item) && isUnique(item),
  [NinjaItemType.ValdoMap]: unconfirmed,
  [NinjaItemType.Invitation]: (item) => item.baseType.includes('Invitation'),
  [NinjaItemType.Memory]: (item) => item.memoryItem === true,
  [NinjaItemType.IncursionTemple]: (item) =>
    item.baseType === 'Chronicle of Atzoatl',
  [NinjaItemType.ScryingOrb]: unconfirmed,
  // Not gated on influence - poe.ninja prices plain bases by item level too.
  [NinjaItemType.BaseType]: (item) => !isUnique(item) && isEquipment(item),
  [NinjaItemType.Flask]: (item) => !isUnique(item) && isFlask(item),
  [NinjaItemType.Beast]: unconfirmed,
  [NinjaItemType.Vial]: (item) => item.baseType.startsWith('Vial of ')
};

/**
 * Resolution order for {@link getNinjaItemType}, most specific first. Several
 * categories are subsets of others - a unique map is also a map, a Forbidden
 * Flame is also a unique jewel - so this order is load-bearing.
 */
export const ninjaItemTypeOrder: NinjaItemType[] = [
  // Frame- and flag-based categories are unambiguous, so they go first.
  NinjaItemType.Corpse,
  NinjaItemType.Memory,
  NinjaItemType.UniqueRelic,
  NinjaItemType.ImbuedGem,
  NinjaItemType.SkillGem,
  // Named singletons and distinctive base type patterns.
  NinjaItemType.IncursionTemple,
  NinjaItemType.Invitation,
  NinjaItemType.Incubator,
  NinjaItemType.Wombgift,
  NinjaItemType.Vial,
  NinjaItemType.ScryingOrb,
  NinjaItemType.Beast,
  // Maps: the most specific variant wins.
  NinjaItemType.BlightRavagedMap,
  NinjaItemType.BlightedMap,
  NinjaItemType.ValdoMap,
  NinjaItemType.UniqueMap,
  NinjaItemType.Map,
  // Jewels: Forbidden and Cluster are subsets of UniqueJewel.
  NinjaItemType.ForbiddenJewel,
  NinjaItemType.ClusterJewel,
  NinjaItemType.UniqueJewel,
  // Uniques by class; Tincture before Flask, ShrineBelt before Accessory.
  NinjaItemType.UniqueTincture,
  NinjaItemType.ShrineBelt,
  NinjaItemType.UniqueWeapon,
  NinjaItemType.UniqueArmour,
  NinjaItemType.UniqueAccessory,
  NinjaItemType.UniqueFlask,
  // Non-unique catch-alls.
  NinjaItemType.Flask,
  NinjaItemType.BaseType
];

// Maintained by hand - poe.ninja moves items between Fragment and Currency as
// leagues add and retire content, so revisit this at league start.
const fragmentPrefixes = [
  'Sacrifice at ',
  'Mortal ',
  'Fragment of ',
  'Splinter of '
];

const fragmentSuffixes = [
  'Breachstone',
  'Emblem',
  'Splinter',
  'Reliquary Key',
  'Crest'
];

const fragmentBaseTypes = new Set(['Divine Vessel', 'Simulacrum']);

const isFragment: ItemMatcher = (item) =>
  isCurrencyFrame(item) &&
  (fragmentBaseTypes.has(item.baseType) ||
    fragmentPrefixes.some((prefix) => item.baseType.startsWith(prefix)) ||
    fragmentSuffixes.some((suffix) => item.baseType.endsWith(suffix)));

const isDivinationCard: ItemMatcher = (item) =>
  item.frameTypeId === ItemFrameType.DivinationCard;

const isEssence: ItemMatcher = (item) =>
  isCurrencyFrame(item) &&
  (item.baseType.includes(' Essence of ') ||
    item.baseType === 'Remnant of Corruption');

const isRunegraft = currencyContaining('Runegraft');
const isAllflameEmber = currencyContaining('Allflame Ember');
const isTattoo = currencyContaining('Tattoo');
const isOmen: ItemMatcher = (item) =>
  isCurrencyFrame(item) && item.baseType.startsWith('Omen of ');
const isDucat = currencyEndingIn('Ducat');
const isEnshroudingCrystal = currencyEndingIn('Enshrouding Crystal');
const isArtifact = currencyEndingIn('Artifact');
const isOil = currencyEndingIn('Oil');
const isDeliriumOrb = currencyEndingIn('Delirium Orb');
const isScarab = currencyEndingIn('Scarab');
const isAstrolabe = currencyEndingIn('Astrolabe');
const isFossil = currencyEndingIn('Fossil');
const isResonator = currencyEndingIn('Resonator');

/**
 * Every exchange category except Currency itself. Currency is defined as
 * "currency frame, and none of these", so it cannot be a peer entry.
 */
const specificExchangeMatchers: ItemMatcher[] = [
  isFragment,
  isRunegraft,
  isAllflameEmber,
  isTattoo,
  isOmen,
  isDucat,
  isEnshroudingCrystal,
  isDivinationCard,
  isArtifact,
  isOil,
  isDeliriumOrb,
  isScarab,
  isAstrolabe,
  isFossil,
  isResonator,
  isEssence
];

const isNinjaCurrency: ItemMatcher = (item) =>
  isCurrencyFrame(item) &&
  !specificExchangeMatchers.some((matches) => matches(item));

export const ninjaExchangeTypeMatchers: Record<NinjaExchangeType, ItemMatcher> =
  {
    [NinjaExchangeType.Currency]: isNinjaCurrency,
    [NinjaExchangeType.Fragment]: isFragment,
    [NinjaExchangeType.Runegraft]: isRunegraft,
    [NinjaExchangeType.AllflameEmber]: isAllflameEmber,
    [NinjaExchangeType.Tattoo]: isTattoo,
    [NinjaExchangeType.Omen]: isOmen,
    [NinjaExchangeType.DjinnCoin]: unconfirmed,
    [NinjaExchangeType.Ducat]: isDucat,
    [NinjaExchangeType.EnshroudingCrystal]: isEnshroudingCrystal,
    [NinjaExchangeType.DivinationCard]: isDivinationCard,
    [NinjaExchangeType.Artifact]: isArtifact,
    [NinjaExchangeType.Oil]: isOil,
    [NinjaExchangeType.DeliriumOrb]: isDeliriumOrb,
    [NinjaExchangeType.Scarab]: isScarab,
    [NinjaExchangeType.Astrolabe]: isAstrolabe,
    [NinjaExchangeType.Fossil]: isFossil,
    [NinjaExchangeType.Resonator]: isResonator,
    [NinjaExchangeType.Essence]: isEssence
  };

/** Resolution order for {@link getNinjaExchangeType}; Currency is last. */
export const ninjaExchangeTypeOrder: NinjaExchangeType[] = [
  NinjaExchangeType.DivinationCard,
  NinjaExchangeType.DjinnCoin,
  NinjaExchangeType.Runegraft,
  NinjaExchangeType.AllflameEmber,
  NinjaExchangeType.Tattoo,
  NinjaExchangeType.Omen,
  NinjaExchangeType.Ducat,
  NinjaExchangeType.EnshroudingCrystal,
  NinjaExchangeType.Artifact,
  NinjaExchangeType.Oil,
  NinjaExchangeType.DeliriumOrb,
  NinjaExchangeType.Scarab,
  NinjaExchangeType.Astrolabe,
  NinjaExchangeType.Fossil,
  NinjaExchangeType.Resonator,
  NinjaExchangeType.Essence,
  NinjaExchangeType.Fragment,
  NinjaExchangeType.Currency
];

export const ninjaCurrencyTypeMatchers: Record<NinjaCurrencyType, ItemMatcher> =
  {
    [NinjaCurrencyType.Currency]: isNinjaCurrency,
    [NinjaCurrencyType.Fragment]: isFragment
  };

const resolveNinjaType = <T extends string>(
  order: T[],
  matchers: Record<T, ItemMatcher>,
  item: Item
): T | undefined => order.find((type) => matchers[type](item));

export const getNinjaItemType = (item: Item): NinjaItemType | undefined =>
  resolveNinjaType(ninjaItemTypeOrder, ninjaItemTypeMatchers, item);

export const getNinjaExchangeType = (
  item: Item
): NinjaExchangeType | undefined =>
  resolveNinjaType(ninjaExchangeTypeOrder, ninjaExchangeTypeMatchers, item);
