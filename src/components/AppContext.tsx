import { ReactNode, useEffect, useState } from 'react';

import { League, StashTab } from '../types';
import { AppContext } from '../hooks/useAppContext';

interface IProps {
  children: ReactNode;
}

export default function AppContextProvider({ children }: IProps) {
  const [savedItems, setSavedItems] = useState<string[]>(
    JSON.parse(
      localStorage.getItem('app.savedItems') ?? '[]'
    ) as unknown as string[]
  );
  const [selectedLeague, setSelectedLeague] = useState<League>();
  const [selectedStash, setSelectedStash] = useState<StashTab>();

  useEffect(() => {
    localStorage.setItem('app.savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  return (
    <AppContext.Provider
      value={{
        savedItems,
        setSavedItems,
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
