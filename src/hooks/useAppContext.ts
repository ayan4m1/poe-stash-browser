import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { League, StashTab } from '../types';

export interface IAppContext {
  selectedLeague?: League;
  selectedStash?: StashTab;
  setSelectedLeague: Dispatch<SetStateAction<League | undefined>>;
  setSelectedStash: Dispatch<SetStateAction<StashTab | undefined>>;
}

export const AppContext = createContext<IAppContext>({
  setSelectedLeague: () => {},
  setSelectedStash: () => {}
});

export default function useAppContext() {
  return useContext<IAppContext>(AppContext);
}
