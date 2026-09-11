import { useQuery } from '@tanstack/react-query';

import { NinjaOverviewOptions } from '../types';
import {
  fetchDivineRate,
  ninjaGcTime,
  ninjaRetryDelay,
  ninjaStaleTime
} from '../utils';
import useAppContext from './useAppContext';
import useNinjaLeagues from './useNinjaLeagues';

/**
 * Divine orbs per chaos orb. One rate for the whole app, so two items priced
 * from different overviews still convert the same way and their totals add up.
 */
export default function useDivineRate({
  enabled = true
}: NinjaOverviewOptions = {}) {
  const { selectedLeague } = useAppContext();
  const { data: ninjaLeagues } = useNinjaLeagues({ enabled });
  const league = selectedLeague?.id;
  const priced = Boolean(
    league && ninjaLeagues?.some((ninjaLeague) => ninjaLeague.id === league)
  );

  return useQuery<number | undefined>({
    queryKey: ['ninja', 'v1', league, 'divineRate'],
    enabled: enabled && priced,
    staleTime: ninjaStaleTime,
    gcTime: ninjaGcTime,
    retry: 3,
    retryDelay: ninjaRetryDelay,
    refetchOnWindowFocus: false,
    // `priced` cannot be true without a league.
    queryFn: ({ signal }) => fetchDivineRate(league!, signal)
  });
}
