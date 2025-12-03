import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';

import { baseApiUrl } from '../utils';
import { StashResponse } from '../types';

export default function useStashes(league: string) {
  const { token } = useContext<IAuthContext>(AuthContext);

  return useQuery<StashResponse>({
    queryKey: ['account', 'stash', league],
    enabled: () => Boolean(token),
    queryFn: () =>
      fetch(`${baseApiUrl}stash/${league}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((data) => data.json())
  });
}
