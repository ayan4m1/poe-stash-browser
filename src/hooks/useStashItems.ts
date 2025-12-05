import { useQuery } from '@tanstack/react-query';

import { baseApiUrl } from '../utils';
import { StashResponse } from '../types';
import useAuthContext from './useAuthContext';

export default function useStashItems(league: string, stash: string) {
  const { token } = useAuthContext();

  return useQuery<StashResponse>({
    queryKey: ['account', league, 'stash', stash],
    enabled: () => Boolean(league && stash && token),
    queryFn: () =>
      fetch(`${baseApiUrl}stash/${league}/${stash}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((data) => data.json())
  });
}
