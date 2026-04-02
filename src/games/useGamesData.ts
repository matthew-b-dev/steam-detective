import { steamGameDetails } from '../steam_game_detail.ts';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../demos.ts';

export interface GameData {
  appId: string;
  name: string;
  count: number;
  used: boolean;
}

export function loadGamesData(): GameData[] {
  // Build set of demo game names
  const demoGameNames = new Set<string>();
  for (const day of Object.values(STEAM_DETECTIVE_DEMO_DAYS)) {
    for (const caseFile of Object.values(day)) {
      if (caseFile) {
        demoGameNames.add(caseFile);
      }
    }
  }

  // Extract games with review counts
  const games: GameData[] = [];

  for (const [appId, game] of Object.entries(steamGameDetails)) {
    if (game && game.name && game.allReviewSummary?.count) {
      games.push({
        appId,
        name: game.name,
        count: game.allReviewSummary.count,
        used: demoGameNames.has(game.name),
      });
    }
  }

  // Sort by count descending
  games.sort((a, b) => b.count - a.count);

  return games;
}
