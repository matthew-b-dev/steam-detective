import { useState, useCallback, useEffect } from 'react';
import { MAX_CLUES } from '../components/SteamDetective/utils';
import {
  getUtcDateString,
  loadSteamDetectiveState,
  saveSteamDetectiveState,
  clearPuzzleState,
  type SteamDetectiveState as SteamDetectiveStateType,
} from '../utils';

export interface SteamDetectiveState extends SteamDetectiveStateType {
  puzzleDate: string;
}

export const useSteamDetectiveState = (
  gameName?: string,
  caseFileNumber: number = 1, // Now 1-4
) => {
  const puzzleDate = getUtcDateString();

  // Load or initialize state
  const loadState = useCallback((): SteamDetectiveState => {
    const savedState = loadSteamDetectiveState(puzzleDate, caseFileNumber);
    // Migration: if game is complete but missing revealedTitle, clear and reload
    if (savedState && savedState.isComplete && !savedState?.revealedTitle) {
      clearPuzzleState(puzzleDate);
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
  }, [puzzleDate, gameName, caseFileNumber]);

  const [state, setState] = useState<SteamDetectiveState>(loadState);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const { puzzleDate: _, revealedTitle, ...stateWithoutDate } = state;
    // Only include revealedTitle if game is complete
    const stateToSave =
      state.isComplete && revealedTitle
        ? { ...stateWithoutDate, revealedTitle }
        : stateWithoutDate;
    saveSteamDetectiveState(state.puzzleDate, stateToSave, caseFileNumber);
  }, [state, caseFileNumber]);

  return { state, setState };
};
