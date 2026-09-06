import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { League, StashTab } from '../types';

export interface IAppContext {
  savedItems?: string[];
  selectedLeague?: League;
  selectedStash?: StashTab;
  setSavedItems: Dispatch<SetStateAction<string[] | undefined>>;
  setSelectedLeague: Dispatch<SetStateAction<League | undefined>>;
  setSelectedStash: Dispatch<SetStateAction<StashTab | undefined>>;
}

export const AppContext = createContext<IAppContext>({
  setSavedItems: () => {},
  setSelectedLeague: () => {},
  setSelectedStash: () => {}
});

export default function useAppContext() {
  return useContext<IAppContext>(AppContext);
}
