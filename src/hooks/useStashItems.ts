import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import useAuthContext from './useAuthContext';
import { StashResponse, StashTab } from '../types';
import { baseApiUrl, setupRateLimiters, rateLimiters } from '../utils';

export default function useStashItems(league: string, stashes: StashTab[]) {
  const [initialized, setInitialized] = useState(false);
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

    if (!rateLimiters.length && league && stashes?.length && token) {
      fetchInitialStash();
    }
  }, [league, stashes, token]);

  return useQueries<StashResponse[]>({
    queries:
      stashes?.map((stash) => ({
        queryKey: ['account', league, 'stash', stash.id],
        enabled: () => initialized,
        queryFn: () =>
          rateLimiters[rateLimiters.length - 1].schedule(() =>
            fetch(`${baseApiUrl}stash/${league}/${stash.id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }).then((data) => data.json())
          )
      })) ?? []
  });
}
