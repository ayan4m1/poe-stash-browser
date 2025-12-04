import { ReactNode, useState } from 'react';

import { League } from '../types';
import { AppContext } from '../hooks/useAppContext';

interface IProps {
  children: ReactNode;
}

export default function AppContextProvider({ children }: IProps) {
  const [selectedLeague, setSelectedLeague] = useState<League>(null);

  return (
    <AppContext.Provider
      value={{
        selectedLeague,
        setSelectedLeague
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
