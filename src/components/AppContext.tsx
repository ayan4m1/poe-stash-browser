import { ReactNode, useEffect, useState } from 'react';

import { League } from '../types';
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

  useEffect(() => {
    localStorage.setItem('app.savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  return (
    <AppContext.Provider
      value={{
        savedItems,
        setSavedItems,
        selectedLeague,
        setSelectedLeague
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
