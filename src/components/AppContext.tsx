import { ReactNode, useState } from 'react';

import { League, StashTab } from '../types';
import { AppContext } from '../hooks/useAppContext';

interface IProps {
  children: ReactNode;
}

export default function AppContextProvider({ children }: IProps) {
  const [selectedLeague, setSelectedLeague] = useState<League>();
  const [selectedStash, setSelectedStash] = useState<StashTab>();

  return (
    <AppContext.Provider
      value={{
        selectedLeague,
        setSelectedLeague,
        selectedStash,
        setSelectedStash
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
