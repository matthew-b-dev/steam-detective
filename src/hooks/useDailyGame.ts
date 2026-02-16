import { useMemo } from 'react';
import { steamGameDetails } from '../steam_game_detail.generated';
import { getUtcDateString } from '../utils';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../demos';

export const useDailyGame = (caseFileNumber: number = 1) => {
  // caseFileNumber is 1-4
  const utcDate = getUtcDateString();

  const dailyGame = useMemo(() => {
    // If there's no demo configured for this date, return null
    if (!STEAM_DETECTIVE_DEMO_DAYS[utcDate]) {
      return null;
    }

    // Check if this is a demo day with a hardcoded game
    if (STEAM_DETECTIVE_DEMO_DAYS[utcDate]) {
      const demoConfig = STEAM_DETECTIVE_DEMO_DAYS[utcDate];
      const caseFileKey = `caseFile${caseFileNumber}` as
        | 'caseFile1'
        | 'caseFile2'
        | 'caseFile3'
        | 'caseFile4';
      const demoGameName = demoConfig[caseFileKey];

      if (demoGameName) {
        // Find the game by name in steamGameDetails
        const gameEntry = Object.values(steamGameDetails).find(
          (game) => game.name === demoGameName,
        );
        if (gameEntry) {
          return gameEntry;
        }
        // If demo game not found, fall through to normal logic
        console.warn(
          `Demo game "${demoGameName}" not found in steamGameDetails`,
        );
      }
      // If no demo game specified for this case file, fall through to normal logic
    }

    // Filter games with less than 50k reviews
    const eligibleGames = Object.entries(steamGameDetails).filter(
      ([, game]) => game.allReviewSummary.count < 30000,
    );
    const gameIds = eligibleGames.map(([id]) => id);

    // Simple hash function - include caseFileNumber to get different games
    const hashInput = `${utcDate}-casefile-${caseFileNumber}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = (hash * 31 + hashInput.charCodeAt(i)) % 100000;
    }

    // Use hash to select a game
    const selectedIndex = hash % gameIds.length;
    const selectedId = gameIds[selectedIndex];
    return steamGameDetails[selectedId];
  }, [utcDate, caseFileNumber]);

  return dailyGame;
};
