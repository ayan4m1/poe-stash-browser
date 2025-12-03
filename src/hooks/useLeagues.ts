import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';

import { baseApiUrl } from '../utils';
import { LeagueResponse } from '../types';

export default function useLeagues() {
  const { token } = useContext<IAuthContext>(AuthContext);

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
