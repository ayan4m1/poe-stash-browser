import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { League } from '../types';

export interface IAppContext {
  savedItems?: string[];
  selectedLeague?: League;
  setSavedItems: Dispatch<SetStateAction<string[]>>;
  setSelectedLeague: Dispatch<SetStateAction<League | undefined>>;
}

export const AppContext = createContext<IAppContext>({
  setSavedItems: () => {},
  setSelectedLeague: () => {}
});

export default function useAppContext() {
  return useContext<IAppContext>(AppContext);
}
