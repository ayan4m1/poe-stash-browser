import { useQuery } from '@tanstack/react-query';

import { NinjaLeague, NinjaOverviewOptions } from '../types';
import { fetchNinjaLeagues, ninjaGcTime, ninjaStaleTime } from '../utils';

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
    refetchOnWindowFocus: false,
    queryFn: ({ signal }) => fetchNinjaLeagues(signal)
  });
}
