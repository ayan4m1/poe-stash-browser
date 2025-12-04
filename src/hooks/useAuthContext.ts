import { useContext } from 'react';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';

export default function useAuthContext() {
  return useContext<IAuthContext>(AuthContext);
}
