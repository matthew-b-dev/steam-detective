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
          revealedTitle: gameName, // Reveal the answer when game ends
        };
      }

      return {
        ...prev,
        currentClue: newClue,
        guessesRemaining: newGuessesRemaining,
        totalGuesses: newTotalGuesses,
      };
    });
  }, [state.isComplete, setState, gameName]);

  const handleGuess = useCallback(
    (selected: GameOption | null) => {
      if (!selected || state.isComplete) return;

      const isCorrect = selected.value === gameName;
      const isClose = !isCorrect && isCloseGuess(selected.value, gameName);

      // Calculate new clue before setState to determine if we should show toast
      const newClue = state.currentClue + 1;

      // Show toast BEFORE setState to avoid it being called multiple times
      if (!isCorrect && newClue <= MAX_CLUES) {
        if (isClose) {
          toast.error('🤏 Close guess! Try something similar.', {
            duration: 5000,
            icon: '',
          });
        } else {
          toast.error('Incorrect guess!');
        }
      }

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
            revealedTitle: gameName, // Reveal the answer when player wins
          };
        } else {
          const newClue = prev.currentClue + 1;

          if (newClue > MAX_CLUES) {
            return {
              ...prev,
              guesses: newGuesses,
              isComplete: true,
              isCorrect: false,
              totalGuesses: 7, // DNF counts as 7
              revealedTitle: gameName, // Reveal the answer when player loses
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
    [state.isComplete, state.currentClue, gameName, setState],
  );

  return { handleSkip, handleGuess };
};
