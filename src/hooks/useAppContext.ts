import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { League } from '../types';

export interface IAppContext {
  selectedLeague?: League;
  setSelectedLeague: Dispatch<SetStateAction<League>>;
}

export const AppContext = createContext<IAppContext>({
  selectedLeague: null,
  setSelectedLeague: null
});

export default function useAppContext() {
  return useContext<IAppContext>(AppContext);
}
