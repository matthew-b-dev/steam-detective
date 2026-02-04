import { useCallback } from 'react';
import toast from 'react-hot-toast';
import type { SteamDetectiveState } from './useSteamDetectiveState';
import { MAX_CLUES } from '../components/SteamDetective/utils';
import { isCloseGuess } from '../utils';

export interface GameOption {
  value: string;
  label: string;
}

interface UseGameActionsProps {
  state: SteamDetectiveState;
  setState: React.Dispatch<React.SetStateAction<SteamDetectiveState>>;
  gameName: string;
}

export const useGameActions = ({
  state,
  setState,
  gameName,
}: UseGameActionsProps) => {
  const handleSkip = useCallback(() => {
    if (state.isComplete) return;

    setState((prev) => {
      const newClue = prev.currentClue + 1;
      const newGuessesRemaining = prev.guessesRemaining - 1;
      const newTotalGuesses = prev.totalGuesses + 1;

      if (newClue > MAX_CLUES) {
        return {
          ...prev,
          isComplete: true,
          isCorrect: false,
          totalGuesses: 7, // DNF counts as 7
        };
      }

      return {
        ...prev,
        currentClue: newClue,
        guessesRemaining: newGuessesRemaining,
        totalGuesses: newTotalGuesses,
      };
    });
  }, [state.isComplete, setState]);

  const handleGuess = useCallback(
    (selected: GameOption | null) => {
      if (!selected || state.isComplete) return;

      const isCorrect = selected.value === gameName;
      const isClose = !isCorrect && isCloseGuess(selected.value, gameName);

      setState((prev) => {
        const newGuesses = [...prev.guesses, { name: selected.value, isClose }];
        const newGuessesRemaining = prev.guessesRemaining - 1;
        const newTotalGuesses = prev.totalGuesses + 1;

        if (isCorrect) {
          // When correct, show all clues by setting currentClue to MAX_CLUES
          return {
            ...prev,
            currentClue: MAX_CLUES,
            guesses: newGuesses,
            guessesRemaining: newGuessesRemaining,
            isComplete: true,
            isCorrect: true,
            totalGuesses: newTotalGuesses,
          };
        } else {
          const newClue = prev.currentClue + 1;

          // Only show toast if this is not the final guess (all clues not yet revealed)  
          if (newClue <= MAX_CLUES) {
            if (isClose) {
              toast.error('Close guess! Try something similar.', {
                duration: 5000,
                icon: '',
              });
            } else {
              toast.error('Incorrect guess!');
            }
          }

          if (newClue > MAX_CLUES) {
            return {
              ...prev,
              guesses: newGuesses,
              isComplete: true,
              isCorrect: false,
              totalGuesses: 7, // DNF counts as 7
            };
          }

          return {
            ...prev,
            currentClue: newClue,
            guesses: newGuesses,
            guessesRemaining: newGuessesRemaining,
            totalGuesses: newTotalGuesses,
          };
        }
      });
    },
    [state.isComplete, gameName, setState],
  );

  return { handleSkip, handleGuess };
};
