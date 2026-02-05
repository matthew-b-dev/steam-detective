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
  steamDetective?: SteamDetectiveState;
  steamDetectiveExpert?: SteamDetectiveState;
  expertStarted?: boolean; // Track if user has clicked to start expert case
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
  caseFile: 'easy' | 'expert' = 'easy',
): SteamDetectiveState | null => {
  try {
    const storageKey = getStorageKey(currentPuzzleDate);
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const unifiedState: UnifiedGameState = JSON.parse(saved);

    // Select the appropriate state based on case file
    const stateToLoad =
      caseFile === 'easy'
        ? unifiedState.steamDetective
        : unifiedState.steamDetectiveExpert;

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
  caseFile: 'easy' | 'expert' = 'easy',
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

    // Update appropriate Steam Detective state
    if (caseFile === 'easy') {
      unifiedState.steamDetective = state;
    } else {
      unifiedState.steamDetectiveExpert = state;
    }

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

/**
 * Check if a guess is close to the target game name
 */
export const isCloseGuess = (guess: string, targetName: string): boolean => {
  const guessLower = guess.toLowerCase();
  const targetLower = targetName.toLowerCase();

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
 */
export const getDemoIndexForSteamDetective = (
  utcDate: string,
  caseFile: 'easy' | 'expert',
): number | null => {
  const demoConfig = STEAM_DETECTIVE_DEMO_DAYS[utcDate];

  if (!demoConfig) return null;

  // If it's a string, it's easy-only
  if (typeof demoConfig === 'string') {
    return caseFile === 'easy' ? 0 : null;
  }

  // If it's an object, check which case file
  return caseFile === 'easy' ? 0 : 1;
};

/**
 * Check if there's an expert case available
 */
export const hasExpertCase = (utcDate: string): boolean => {
  const demoConfig = STEAM_DETECTIVE_DEMO_DAYS[utcDate];
  return typeof demoConfig === 'object' && 'expert' in demoConfig;
};

/**
 * Load expert started flag from localStorage
 */
export const loadExpertStarted = (currentPuzzleDate: string): boolean => {
  try {
    const storageKey = getStorageKey(currentPuzzleDate);
    const saved = localStorage.getItem(storageKey);
    if (!saved) return false;

    const unifiedState: UnifiedGameState = JSON.parse(saved);

    return unifiedState.expertStarted || false;
  } catch (error) {
    console.error('Failed to load expert started flag:', error);
    return false;
  }
};

/**
 * Save expert started flag to localStorage
 */
export const saveExpertStarted = (puzzleDate: string): void => {
  try {
    const storageKey = getStorageKey(puzzleDate);
    const saved = localStorage.getItem(storageKey);
    let unifiedState: UnifiedGameState;

    if (saved) {
      unifiedState = JSON.parse(saved);
    } else {
      unifiedState = {};
    }

    unifiedState.expertStarted = true;

    localStorage.setItem(storageKey, JSON.stringify(unifiedState));
  } catch (error) {
    console.error('Failed to save expert started flag:', error);
  }
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
