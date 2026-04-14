import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import useRateLimiters from './useRateLimiters';
import useAuthContext from './useAuthContext';
import { StashResponse, StashTab } from '../types';
import { baseApiUrl } from '../utils';

export default function useStashItems(league?: string, stashes?: StashTab[]) {
  const [initialized, setInitialized] = useState(false);
  const { limiter, setupRateLimiters } = useRateLimiters();
  const { token } = useAuthContext();

  useEffect(() => {
    async function fetchInitialStash() {
      const [stash] = stashes;
      const result = await fetch(`${baseApiUrl}stash/${league}/${stash.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setupRateLimiters(result.headers);
      setInitialized(true);
    }

    if (!limiter && league && stashes?.length && token) {
      fetchInitialStash();
    }
  }, [league, stashes, token, limiter, setupRateLimiters]);

  return useQueries({
    queries:
      stashes?.map((stash) => ({
        queryKey: ['account', league, 'stash', stash.id],
        enabled: () => Boolean(initialized && limiter),
        queryFn: () =>
          limiter.schedule(() =>
            fetch(`${baseApiUrl}stash/${league}/${stash.id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }).then((data) => data.json() as unknown as StashResponse)
          )
      })) ?? []
  });
}
