import type { ReactNode } from 'react';
import {
  DATE_OVERRIDE,
  STEAM_DETECTIVE_DEMO_DAYS,
  getDateFromRoute,
} from './demos';

// Subtitle configuration
export interface SubtitleConfig {
  content: ReactNode;
  animated: boolean;
}

export const getSubtitle = (): SubtitleConfig => {
  return {
    content: <>❤️ Ad-free and Open-Source! 🛠️</>,
    animated: false,
  };
};

// Missed guess with close detection
export interface MissedGuess {
  name: string;
  isClose: boolean;
}

// Steam Detective state interface (without puzzleDate - stored at root level)
export interface SteamDetectiveState {
  currentClue: number;
  guessesRemaining: number;
  isComplete: boolean;
  isCorrect: boolean;
  guesses: MissedGuess[];
  totalGuesses: number; // Total number of guesses made (including skips)
  scoreSent: boolean; // Track if the score has been sent to the database
  revealedTitle?: string; // The game title for this puzzle
}

// Unified storage structure (per date)
export interface UnifiedGameState {
  caseFile1?: SteamDetectiveState;
  caseFile2?: SteamDetectiveState;
  caseFile3?: SteamDetectiveState;
  caseFile4?: SteamDetectiveState;
  caseFileScores?: number[]; // Scores for each completed case file [score1, score2, score3, score4]
  currentCaseFile?: number; // Track which case file user is on (1-4)
  allCasesComplete?: boolean; // Track if all 4 cases are complete
  totalScoreSent?: boolean; // Track if the total score has been sent to the database
  caseFileAnimationsPlayed?: boolean[]; // Track which case files have played their score animation [cf1, cf2, cf3, cf4]
}

/**
 * Get the storage key for a specific puzzle date
 */
const getStorageKey = (puzzleDate: string): string => {
  return `steam-detective-state-${puzzleDate}`;
};

/**
 * Load Steam Detective state from localStorage
 */
export const loadSteamDetectiveState = (
  currentPuzzleDate: string,
  caseFile: number = 1, // Now 1-4
): SteamDetectiveState | null => {
  try {
    const storageKey = getStorageKey(currentPuzzleDate);
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const unifiedState: UnifiedGameState = JSON.parse(saved);

    // Select the appropriate state based on case file
    const caseFileKey = `caseFile${caseFile}` as keyof UnifiedGameState;
    const stateToLoad = unifiedState[caseFileKey] as
      | SteamDetectiveState
      | undefined;

    // Migrate old guesses format (string[]) to new format (MissedGuess[])
    if (stateToLoad && stateToLoad.guesses) {
      if (
        stateToLoad.guesses.length > 0 &&
        typeof stateToLoad.guesses[0] === 'string'
      ) {
        stateToLoad.guesses = (stateToLoad.guesses as unknown as string[]).map(
          (name: string) => ({
            name,
            isClose: false,
          }),
        );
      }
    }

    return stateToLoad || null;
  } catch (error) {
    console.error('Failed to load Steam Detective state:', error);
    return null;
  }
};

/**
 * Save Steam Detective state to localStorage
 */
export const saveSteamDetectiveState = (
  puzzleDate: string,
  state: SteamDetectiveState,
  caseFile: number = 1, // Now 1-4
): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    // Update appropriate case file state
    const caseFileKey = `caseFile${caseFile}` as
      | 'caseFile1'
      | 'caseFile2'
      | 'caseFile3'
      | 'caseFile4';
    unifiedState[caseFileKey] = state;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save Steam Detective state:', error);
  }
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const len1 = s1.length;
  const len2 = s2.length;

  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[len1][len2];
};

// Special series/franchises where guesses containing the series name are considered "close"
export const CLOSE_GUESS_SERIES = [
  'super mario',
  'the lord of the rings',
  'final fantasy',
  'payday',
  'call of duty',
  'the legend of zelda',
  'age of empires',
  'bioshock',
  'persona',
  'south park',
  'dark souls',
  'prototype',
  'torchlight',
  'splinter cell',
];

/**
 * Check if a guess is close to the target game name
 */
export const isCloseGuess = (guess: string, targetName: string): boolean => {
  const guessLower = guess.toLowerCase();
  const targetLower = targetName.toLowerCase();

  // Special case: if both contain a known series/franchise name, consider them close
  for (const series of CLOSE_GUESS_SERIES) {
    if (guessLower.includes(series) && targetLower.includes(series)) {
      return true;
    }
  }

  // Check if one contains the other (for partial matches)
  if (targetLower.includes(guessLower) || guessLower.includes(targetLower)) {
    return true;
  }

  // Calculate similarity based on Levenshtein distance
  const distance = levenshteinDistance(guess, targetName);
  const maxLength = Math.max(guess.length, targetName.length);
  const similarity = 1 - distance / maxLength;

  // Consider it close if similarity is >= 70%
  if (similarity >= 0.7) {
    return true;
  }

  // Additional check for game series with colons
  if (guess.includes(':') && targetName.includes(':')) {
    const guessParts = guess.split(':').map((p) => p.trim().toLowerCase());
    const targetParts = targetName
      .split(':')
      .map((p) => p.trim().toLowerCase());

    if (guessParts.length >= 1 && targetParts.length >= 1) {
      const beforeColonGuess = guessParts[0];
      const beforeColonTarget = targetParts[0];

      const beforeDistance = levenshteinDistance(
        beforeColonGuess,
        beforeColonTarget,
      );
      const beforeMaxLength = Math.max(
        beforeColonGuess.length,
        beforeColonTarget.length,
      );
      const beforeSimilarity = 1 - beforeDistance / beforeMaxLength;

      if (beforeSimilarity >= 0.7) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Get today's real UTC date string in YYYY-MM-DD format (ignoring route override)
 */
export const getRealUtcDateString = (): string => {
  // Check for hardcoded DATE_OVERRIDE constant
  if (DATE_OVERRIDE) return DATE_OVERRIDE;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string is within the selectable range
 * Min: 2026-02-04, Max: Real UTC date
 */
export const isLocalhost = (): boolean =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const isDateSelectable = (dateStr: string): boolean => {
  const minDate = '2026-02-04';
  const maxDate = getRealUtcDateString();

  // On localhost, allow any date at or after minDate (including future)
  if (isLocalhost()) {
    return dateStr >= minDate;
  }

  return dateStr >= minDate && dateStr <= maxDate;
};

/**
 * Get current UTC date string in YYYY-MM-DD format
 */
export const getUtcDateString = (): string => {
  // Check for route-based date override first (e.g., /d/2026-02-03)
  const routeDate = getDateFromRoute();
  if (routeDate) return routeDate;

  return getRealUtcDateString();
};

/**
 * Get formatted puzzle date for display
 */
export const getPuzzleDate = (showYear: boolean = true): string => {
  const utcDate = getUtcDateString();
  const date = new Date(utcDate + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: showYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
};

/**
 * Calculate time until next UTC day
 */
export const getTimeUntilNextGame = (): { h: number; m: number } => {
  const now = new Date();
  const nextUtcDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  const diff = nextUtcDay.getTime() - now.getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { h, m };
};

/**
 * Get the demo index for a given date
 * Returns the case file number (1-4) if a demo is configured for this date and case file
 */
export const getDemoIndexForSteamDetective = (
  utcDate: string,
  caseFile: number, // 1-4
): number | null => {
  const demoConfig = STEAM_DETECTIVE_DEMO_DAYS[utcDate];

  if (!demoConfig) return null;

  const caseFileKey = `caseFile${caseFile}` as
    | 'caseFile1'
    | 'caseFile2'
    | 'caseFile3'
    | 'caseFile4';

  // Check if this case file has a demo game configured
  if (demoConfig[caseFileKey]) {
    return caseFile - 1; // Return 0-indexed for array access
  }

  return null;
};

/**
 * Get current case file number (1-4)
 */
export const getCurrentCaseFile = (puzzleDate: string): number => {
  const state = getUnifiedState(puzzleDate);
  return state?.currentCaseFile || 1;
};

/**
 * Save current case file to localStorage
 */
export const saveCurrentCaseFile = (
  puzzleDate: string,
  caseFile: number,
): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    unifiedState.currentCaseFile = caseFile;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save current case file:', error);
  }
};

/**
 * Save case file score to localStorage
 */
export const saveCaseFileScore = (
  puzzleDate: string,
  caseFileNumber: number,
  score: number,
): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    if (!unifiedState.caseFileScores) {
      unifiedState.caseFileScores = [];
    }

    // Store score at index (caseFileNumber - 1)
    unifiedState.caseFileScores[caseFileNumber - 1] = score;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save case file score:', error);
  }
};

/**
 * Get total score across all completed case files
 */
export const getTotalScore = (puzzleDate: string): number => {
  const state = getUnifiedState(puzzleDate);
  if (!state?.caseFileScores) return 0;

  return state.caseFileScores.reduce((sum, score) => sum + (score || 0), 0);
};

/**
 * Mark all cases as complete
 */
export const saveAllCasesComplete = (puzzleDate: string): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    unifiedState.allCasesComplete = true;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save all cases complete:', error);
  }
};

/**
 * Mark total score as sent to database
 */
export const saveTotalScoreSent = (puzzleDate: string): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    unifiedState.totalScoreSent = true;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save total score sent:', error);
  }
};

/**
 * Mark case file animation as played
 */
export const saveCaseFileAnimationPlayed = (
  puzzleDate: string,
  caseFileNumber: number,
): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    if (!unifiedState.caseFileAnimationsPlayed) {
      unifiedState.caseFileAnimationsPlayed = [];
    }

    unifiedState.caseFileAnimationsPlayed[caseFileNumber - 1] = true;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save case file animation played:', error);
  }
};

/**
 * Check if case file animation has been played
 */
export const hasCaseFileAnimationPlayed = (
  puzzleDate: string,
  caseFileNumber: number,
): boolean => {
  const state = getUnifiedState(puzzleDate);
  return state?.caseFileAnimationsPlayed?.[caseFileNumber - 1] || false;
};

/**
 * Clear state for a specific puzzle date
 */
export const clearPuzzleState = (puzzleDate: string): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear puzzle state:', error);
  }
};

/**
 * Get the full unified state for a puzzle date
 */
export const getUnifiedState = (
  puzzleDate: string,
): UnifiedGameState | null => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to get unified state:', error);
    return null;
  }
};

/**
 * Get rank emoji based on rank and total players
 */
export const getRankEmoji = (rank: number, totalPlayers: number): string => {
  const rankEmojiMap: { [key: number]: string } = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  return rankEmojiMap[rank] || (rank === totalPlayers ? '💀' : '🏅');
};

/**
 * Get percentile message based on user's performance
 */
export const getPercentileMessage = (
  percentile: number,
  score: number,
  todayScores: number[],
  puzzleDate?: string,
): string => {
  // Check if tied for first place
  const highestScore = Math.max(...todayScores);

  // Determine if this is today's puzzle or a past puzzle
  const isToday = !puzzleDate || puzzleDate === getRealUtcDateString();
  const dateText = isToday ? 'today' : `on ${puzzleDate}`;

  if (score === highestScore) {
    const countAtTop = todayScores.filter((s) => s === highestScore).length;

    if (countAtTop > 1) {
      return isToday
        ? "🥇 You're tied for rank #1 today. 🥇"
        : `🥇 Rank #1 for ${puzzleDate}. 🥇`;
    }
    return isToday
      ? "🥇 So far, you're rank #1 today. 🥇"
      : `🥇 Rank #1 for ${puzzleDate}. 🥇`;
  }

  if (percentile === 0) {
    return `That's the worst score ${dateText}. 🤷`;
  } else {
    return `That's better than ${percentile}% of players.`;
  }
};
