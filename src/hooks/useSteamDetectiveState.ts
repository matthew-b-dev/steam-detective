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
    if (savedState && !savedState?.revealedTitle) {
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
        revealedTitle: gameName,
      };
    }
    if (savedState) {
      return {
        puzzleDate,
        ...savedState,
        revealedTitle: gameName, // Always update with current game's name
      };
    }

    // Return default state
    return {
      puzzleDate,
      currentClue: 1,
      guessesRemaining: MAX_CLUES,
      isComplete: false,
      isCorrect: false,
      guesses: [],
      totalGuesses: 0,
      scoreSent: false,
      revealedTitle: gameName,
    };
  }, [puzzleDate, gameName, caseFile]);

  const [state, setState] = useState<SteamDetectiveState>(loadState);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const { puzzleDate: _, ...stateWithoutDate } = state;
    saveSteamDetectiveState(state.puzzleDate, stateWithoutDate, caseFile);
  }, [state, caseFile]);

  return { state, setState };
};
