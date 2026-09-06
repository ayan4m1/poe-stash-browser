import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';

import useRateLimiters from './useRateLimiters';
import useAuthContext from './useAuthContext';
import { StashResponse, StashTab } from '../types';
import { baseApiUrl } from '../utils';

const annotateStash = (result: StashResponse) => {
  result.stash.items = result.stash.items?.map((item) => ({
    ...item,
    stashTab: `Tab #${(result.stash.index ?? 0) + 1} - ${result.stash.name}`
  }));

  return result;
};

export default function useStashItems(league?: string, stashes?: StashTab[]) {
  const [initialized, setInitialized] = useState(false);
  const {
    limiter,
    setupRateLimiters,
    syncFromHeaders,
    blockRequests,
    getTimeEstimate
  } = useRateLimiters();
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function fetchInitialStash() {
      if (!stashes) {
        return;
      }

      const [stash] = stashes;
      const result = await fetch(`${baseApiUrl}stash/${league}/${stash.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setupRateLimiters(result.headers);

      if (result.status === 429) {
        blockRequests(Number(result.headers.get('Retry-After')) || 60);
      } else if (result.ok) {
        // this request already spent part of the budget, so keep the body rather
        // than letting the query below ask for the same tab a second time
        queryClient.setQueryData(
          ['account', league, 'stash', stash.id],
          annotateStash((await result.json()) as StashResponse)
        );
      }

      setInitialized(true);
    }

    if (!limiter && league && stashes?.length && token) {
      fetchInitialStash();
    }
  }, [
    league,
    stashes,
    token,
    limiter,
    setupRateLimiters,
    blockRequests,
    queryClient
  ]);

  const queries = useQueries({
    queries:
      stashes?.map((stash) => ({
        queryKey: ['account', league, 'stash', stash.id],
        enabled: Boolean(initialized && limiter),
        queryFn: () =>
          limiter?.schedule(async () => {
            const response = await fetch(
              `${baseApiUrl}stash/${league}/${stash.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            syncFromHeaders(response.headers);

            if (response.status === 429) {
              blockRequests(Number(response.headers.get('Retry-After')) || 60);
              throw new Error(`Rate limited fetching stash ${stash.id}`);
            }

            if (!response.ok) {
              throw new Error(
                `Failed to fetch stash ${stash.id} (${response.status})`
              );
            }

            return annotateStash((await response.json()) as StashResponse);
          })
      })) ?? []
  });

  const pendingCount = queries.filter((q) => !q.isFetched || q.isStale).length;
  const timeEstimate = useMemo(
    () => getTimeEstimate(pendingCount),
    [pendingCount, getTimeEstimate]
  );

  return {
    queries,
    timeEstimate
  };
}
