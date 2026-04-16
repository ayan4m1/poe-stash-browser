import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import useRateLimiters from './useRateLimiters';
import useAuthContext from './useAuthContext';
import { StashResponse, StashTab } from '../types';
import { baseApiUrl } from '../utils';

export default function useStashItems(league?: string, stashes?: StashTab[]) {
  const [initialized, setInitialized] = useState(false);
  const { limiter, requestTime, setupRateLimiters } = useRateLimiters();
  const { token } = useAuthContext();

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
      setInitialized(true);
    }

    if (!limiter && league && stashes?.length && token) {
      fetchInitialStash();
    }
  }, [league, stashes, token, limiter, setupRateLimiters]);

  return {
    queries: useQueries({
      queries:
        stashes?.map((stash) => ({
          queryKey: ['account', league, 'stash', stash.id],
          enabled: Boolean(initialized && limiter),
          queryFn: () =>
            limiter?.schedule(() =>
              fetch(`${baseApiUrl}stash/${league}/${stash.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }).then(async (data) => {
                const result = (await data.json()) as unknown as StashResponse;

                result.stash.items = result.stash.items?.map((item) => ({
                  ...item,
                  stashTab: `${result.stash.name} (#${result.stash.index})`
                }));

                return result;
              })
            )
        })) ?? []
    }),
    requestTime
  };
}
