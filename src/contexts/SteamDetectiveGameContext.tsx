import { createContext, useContext } from 'react';
import type { ReactNode, ReactElement } from 'react';
import type { SteamGame } from '../types';

interface SteamDetectiveGameContextValue {
  dailyGame: SteamGame;
  censoredDescription: ReactElement[];
  isComplete: boolean;
  showClues: boolean[];
}

const SteamDetectiveGameContext = createContext<
  SteamDetectiveGameContextValue | undefined
>(undefined);

interface SteamDetectiveGameProviderProps {
  children: ReactNode;
  dailyGame: SteamGame;
  censoredDescription: ReactElement[];
  isComplete: boolean;
  showClues: boolean[];
}

export const SteamDetectiveGameProvider: React.FC<
  SteamDetectiveGameProviderProps
> = ({ children, dailyGame, censoredDescription, isComplete, showClues }) => {
  const value = {
    dailyGame,
    censoredDescription,
    isComplete,
    showClues,
  };

  return (
    <SteamDetectiveGameContext.Provider value={value}>
      {children}
    </SteamDetectiveGameContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSteamDetectiveGame = () => {
  const context = useContext(SteamDetectiveGameContext);
  if (!context) {
    throw new Error(
      'useSteamDetectiveGame must be used within SteamDetectiveGameProvider',
    );
  }
  return context;
};
