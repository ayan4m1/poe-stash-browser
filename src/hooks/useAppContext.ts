import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { League, StashTab } from '../types';

export interface IAppContext {
  selectedLeague?: League;
  selectedStash?: StashTab;
  setSelectedLeague: Dispatch<SetStateAction<League>>;
  setSelectedStash: Dispatch<SetStateAction<StashTab>>;
}

export const AppContext = createContext<IAppContext>({
  selectedLeague: null,
  setSelectedLeague: null,
  selectedStash: null,
  setSelectedStash: null
});

export default function useAppContext() {
  return useContext<IAppContext>(AppContext);
}
