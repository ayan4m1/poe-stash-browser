import { useQuery } from '@tanstack/react-query';

import { baseApiUrl } from '../utils';
import { StashesResponse } from '../types';
import useAuthContext from './useAuthContext';

export default function useStashes(league?: string) {
  const { token } = useAuthContext();

  return useQuery<StashesResponse>({
    queryKey: ['account', 'stashes', league],
    enabled: () => Boolean(token && league),
    queryFn: () =>
      fetch(`${baseApiUrl}stash/${league}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((data) => data.json())
  });
}
