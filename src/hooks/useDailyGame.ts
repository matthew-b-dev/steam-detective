import { useMemo } from 'react';
import { steamGameDetails } from '../steam_game_detail';
import { getUtcDateString } from '../utils';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../demos';

export const useDailyGame = (caseFile: 'easy' | 'expert' = 'easy') => {
  const utcDate = getUtcDateString();

  const dailyGame = useMemo(() => {
    // Check if this is a demo day with a hardcoded game
    if (STEAM_DETECTIVE_DEMO_DAYS[utcDate]) {
      const demoConfig = STEAM_DETECTIVE_DEMO_DAYS[utcDate];
      let demoGameName: string;

      // Handle both string (easy only) and object (easy + expert) formats
      if (typeof demoConfig === 'string') {
        demoGameName = demoConfig;
      } else {
        demoGameName = demoConfig[caseFile];
      }

      // Find the game by name in steamGameDetails
      const gameEntry = Object.values(steamGameDetails).find(
        (game) => game.name === demoGameName,
      );
      if (gameEntry) {
        return gameEntry;
      }
      // If demo game not found, fall through to normal logic
      console.warn(`Demo game "${demoGameName}" not found in steamGameDetails`);
    }

    // Filter games with less than 50k reviews
    const eligibleGames = Object.entries(steamGameDetails).filter(
      ([, game]) => game.allReviewSummary.count < 30000,
    );
    const gameIds = eligibleGames.map(([id]) => id);

    // Simple hash function - include caseFile to get different games for easy vs expert
    const hashInput = `${utcDate}-${caseFile}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = (hash * 31 + hashInput.charCodeAt(i)) % 100000;
    }

    // Use hash to select a game
    const selectedIndex = hash % gameIds.length;
    const selectedId = gameIds[selectedIndex];
    return steamGameDetails[selectedId];
  }, [utcDate, caseFile]);

  return dailyGame;
};
