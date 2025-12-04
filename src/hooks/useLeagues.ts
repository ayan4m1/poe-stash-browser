import { useQuery } from '@tanstack/react-query';

import { baseApiUrl } from '../utils';
import { LeagueResponse } from '../types';
import useAuthContext from './useAuthContext';

export default function useLeagues() {
  const { token } = useAuthContext();

  return useQuery<LeagueResponse>({
    queryKey: ['account', 'leagues'],
    enabled: () => Boolean(token),
    queryFn: () =>
      fetch(`${baseApiUrl}account/leagues`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((data) => data.json())
  });
}
