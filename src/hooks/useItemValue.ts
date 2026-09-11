import { useCallback, useMemo, useState } from 'react';

import { Item, ItemValue, NinjaOverviewOptions } from '../types';
import { resolveNinjaSource, valueFromIndex } from '../utils';
import useAppContext from './useAppContext';
import useDivineRate from './useDivineRate';
import useNinjaOverview from './useNinjaOverview';

export type ItemValueReason = 'no-league' | 'unsupported' | 'unpriced' | 'idle';

export type ItemValueResult = {
  value?: ItemValue;
  isPending: boolean;
  isError: boolean;
  /** Why there is no value, when there is none. */
  reason?: ItemValueReason;
  /** Opens the gate below. Idempotent - a second call costs nothing. */
  fetch: () => void;
};

/**
 * Estimated value of one item. The overview it reads is cached per category, so
 * pricing a second item of the same category costs no request - which is why
 * the value is derived here rather than fetched per item.
 *
 * Nothing is fetched until `fetch` is called or `enabled` is passed - a stash
 * of a few thousand items would otherwise spend the request budget on prices
 * nobody asked to see. The hook itself always runs; it is the queries beneath
 * it that sit disabled, which is what keeps this compatible with a button
 * without breaking the rules of hooks. `enabled` is the seam for a caller that
 * wants to drive the same gate from its own state.
 *
 * Callers get a reason alongside an absent value so the UI can tell "still
 * fetching" apart from "not asked for yet" and "poe.ninja does not price this".
 */
export default function useItemValue(
  item?: Item,
  { enabled = false }: NinjaOverviewOptions = {}
): ItemValueResult {
  const { selectedLeague } = useAppContext();
  const [requested, setRequested] = useState(false);
  const active = enabled || requested;
  const source = useMemo(
    () => (item ? resolveNinjaSource(item) : undefined),
    [item]
  );
  const overview = useNinjaOverview(source, { enabled: active });
  const divineRate = useDivineRate({ enabled: active });
  const fetch = useCallback(() => setRequested(true), []);

  return useMemo(() => {
    if (!selectedLeague) {
      return {
        isPending: false,
        isError: false,
        reason: 'no-league' as const,
        fetch
      };
    }

    if (!item || !source) {
      return {
        isPending: false,
        isError: false,
        reason: 'unsupported' as const,
        fetch
      };
    }

    if (overview.isError || divineRate.isError) {
      return { isPending: false, isError: true, fetch };
    }

    // A disabled query still reads its cache, and the overview key is per
    // category - so an item whose category a sibling already paid for prices
    // itself for free, without its own button being pressed.
    if (overview.data) {
      const value = valueFromIndex(item, overview.data, divineRate.data);

      return value
        ? { value, isPending: false, isError: false, fetch }
        : {
            isPending: false,
            isError: false,
            reason: 'unpriced' as const,
            fetch
          };
    }

    return active
      ? { isPending: true, isError: false, fetch }
      : { isPending: false, isError: false, reason: 'idle' as const, fetch };
  }, [
    active,
    fetch,
    item,
    source,
    selectedLeague,
    overview.data,
    overview.isError,
    divineRate.data,
    divineRate.isError
  ]);
}
