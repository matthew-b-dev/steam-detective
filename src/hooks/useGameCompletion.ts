import { useEffect, useRef } from 'react';

interface UseGameCompletionProps {
  stateLoaded: boolean;
  gameOver: boolean;
  showGameComplete: boolean;
  onGameComplete: () => void;
}

export const useGameCompletion = ({
  stateLoaded,
  gameOver,
  showGameComplete,
  onGameComplete,
}: UseGameCompletionProps): void => {
  const prevGameOver = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip until state has been loaded
    if (!stateLoaded) return;

    // On first run after state loads, just record current state without opening modal
    if (!hasInitialized.current) {
      prevGameOver.current = gameOver;
      hasInitialized.current = true;
      return;
    }

    const wasNotOver = !prevGameOver.current;
    const isNowOver = gameOver;

    // Only auto-open modal if game JUST became complete (transition from not-over to over)
    if (wasNotOver && isNowOver && !showGameComplete) {
      onGameComplete();
    }

    prevGameOver.current = gameOver;
  }, [stateLoaded, gameOver, showGameComplete, onGameComplete]);
};
