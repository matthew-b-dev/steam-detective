import { useState, useCallback, useEffect } from 'react';
import { MAX_CLUES } from '../components/SteamDetective/utils';
import {
  getUtcDateString,
  loadSteamDetectiveState,
  saveSteamDetectiveState,
  type SteamDetectiveState as SteamDetectiveStateType,
} from '../utils';

export interface SteamDetectiveState extends SteamDetectiveStateType {
  puzzleDate: string;
}

export const useSteamDetectiveState = (
  gameName?: string,
  caseFile: 'easy' | 'expert' = 'easy',
) => {
  const puzzleDate = getUtcDateString();

  // Load or initialize state
  const loadState = useCallback((): SteamDetectiveState => {
    const savedState = loadSteamDetectiveState(puzzleDate, caseFile);
    // Migration: if game is complete but missing revealedTitle, clear and reload
    if (savedState && savedState.isComplete && !savedState?.revealedTitle) {
      localStorage.removeItem('steam-detective-state');
      window?.location?.reload?.();
      return {
        puzzleDate,
        currentClue: 1,
        guessesRemaining: MAX_CLUES,
        isComplete: false,
        isCorrect: false,
        guesses: [],
        totalGuesses: 0,
        scoreSent: false,
      };
    }
    if (savedState) {
      return {
        puzzleDate,
        ...savedState,
        // Only include revealedTitle if game is complete
        ...(savedState.isComplete && { revealedTitle: gameName }),
      };
    }

    // Return default state (no revealedTitle until game is complete)
    return {
      puzzleDate,
      currentClue: 1,
      guessesRemaining: MAX_CLUES,
      isComplete: false,
      isCorrect: false,
      guesses: [],
      totalGuesses: 0,
      scoreSent: false,
    };
  }, [puzzleDate, gameName, caseFile]);

  const [state, setState] = useState<SteamDetectiveState>(loadState);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const { puzzleDate: _, revealedTitle, ...stateWithoutDate } = state;
    // Only include revealedTitle if game is complete
    const stateToSave =
      state.isComplete && revealedTitle
        ? { ...stateWithoutDate, revealedTitle }
        : stateWithoutDate;
    saveSteamDetectiveState(state.puzzleDate, stateToSave, caseFile);
  }, [state, caseFile]);

  return { state, setState };
};
