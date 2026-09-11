import { useQuery } from '@tanstack/react-query';

import { NinjaLeague, NinjaOverviewOptions } from '../types';
import {
  fetchNinjaLeagues,
  ninjaGcTime,
  ninjaRetryDelay,
  ninjaStaleTime
} from '../utils';

/**
 * The leagues poe.ninja actually tracks. Worth its own request: the selected
 * league is GGG's id, and SSF, Ruthless, private and event leagues have no
 * economy data at all, so this is what stops the app spending its request
 * budget on overviews that can only come back empty.
 *
 * Gated like the overviews it guards - it is a poe.ninja request too, and a
 * deferred price must not leak one on mount.
 */
export default function useNinjaLeagues({
  enabled = true
}: NinjaOverviewOptions = {}) {
  return useQuery<NinjaLeague[]>({
    queryKey: ['ninja', 'v1', 'leagues'],
    enabled,
    staleTime: ninjaStaleTime,
    gcTime: ninjaGcTime,
    // Matched to the overviews this gates: react-query's own backoff would
    // ignore the Retry-After the proxy sent, and a leagues request that gives
    // up takes every price on the page down with it.
    retry: 3,
    retryDelay: ninjaRetryDelay,
    refetchOnWindowFocus: false,
    queryFn: ({ signal }) => fetchNinjaLeagues(signal)
  });
}
