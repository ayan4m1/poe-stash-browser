import { useQuery } from '@tanstack/react-query';

import {
  NinjaOverviewIndex,
  NinjaOverviewOptions,
  NinjaSource
} from '../types';
import {
  fetchNinjaOverview,
  ninjaGcTime,
  ninjaRetryDelay,
  ninjaStaleTime
} from '../utils';
import useAppContext from './useAppContext';
import useNinjaLeagues from './useNinjaLeagues';

/**
 * One overview per category, shared by every item in it. The query holds the
 * projected index rather than the raw payload, and overrides the app-wide cache
 * settings from QueryProvider - a 24 hour staleness is right for stash tabs and
 * wrong for prices.
 *
 * The v1 segment of the key lets a change to the projection invalidate anything
 * cached under the old shape.
 */
export default function useNinjaOverview(
  source?: NinjaSource,
  { enabled = true }: NinjaOverviewOptions = {}
) {
  const { selectedLeague } = useAppContext();
  const { data: ninjaLeagues } = useNinjaLeagues({ enabled });
  const league = selectedLeague?.id;
  const priced = Boolean(
    league && ninjaLeagues?.some((ninjaLeague) => ninjaLeague.id === league)
  );

  return useQuery<NinjaOverviewIndex>({
    queryKey: [
      'ninja',
      'v1',
      league,
      'overview',
      source?.endpoint,
      source?.type
    ],
    enabled: enabled && Boolean(source && priced),
    staleTime: ninjaStaleTime,
    gcTime: ninjaGcTime,
    retry: 3,
    retryDelay: ninjaRetryDelay,
    refetchOnWindowFocus: false,
    // Both are guaranteed by `enabled` above, which is what gates the query.
    queryFn: ({ signal }) => fetchNinjaOverview(source!, league!, signal)
  });
}
