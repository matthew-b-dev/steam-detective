import { useMemo } from 'react';
import { GamesPage } from './GamesPage.tsx';
import { loadGamesData } from './useGamesData.ts';

export const GamesIndex: React.FC = () => {
  const games = useMemo(() => loadGamesData(), []);

  return <GamesPage games={games} />;
};
