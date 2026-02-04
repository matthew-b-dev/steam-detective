import { useState, useEffect, useRef } from 'react';
import { fetchTodayScores, sendScore } from '../lib/supabaseClient';

interface UseSendAndFetchScoresReturn {
  allScores: number[];
  userPercentile: number | null;
  isLoading: boolean;
}

/**
 * Hook to send user score and fetch all scores when the game ends, then calculate user's percentile
 * @param gameOver - Whether the game is over
 * @param allGamesComplete - Whether all games are complete
 * @param bonusCalculated - Whether bonus points have been calculated
 * @param userScore - The user's final score
 * @param scoreSent - Whether the score has already been sent (to avoid duplicate sends)
 * @param onScoreSent - Callback to mark score as sent
 * @returns Object containing all scores list, percentile, and loading state
 */
export const useSendAndFetchScores = (
  gameOver: boolean,
  allGamesComplete: boolean,
  bonusCalculated: boolean,
  userScore: number,
  scoreSent: boolean,
  onScoreSent: () => void,
): UseSendAndFetchScoresReturn => {
  const [allScores, setAllScores] = useState<number[]>([]);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasScoreSent = useRef(false);

  useEffect(() => {
    // Send score only once when game becomes over, all games complete, bonus calculated, and score hasn't been sent
    if (
      gameOver &&
      allGamesComplete &&
      bonusCalculated &&
      !scoreSent &&
      !hasScoreSent.current
    ) {
      hasScoreSent.current = true;

      const send = async () => {
        try {
          await sendScore(userScore);
          onScoreSent();
        } catch (error) {
          console.error('Failed to send score:', error);
        }
      };

      send();
    }
  }, [
    gameOver,
    allGamesComplete,
    bonusCalculated,
    userScore,
    scoreSent,
    onScoreSent,
  ]);

  useEffect(() => {
    // Fetch scores only after score has been sent (waits for scoreSent to become true)
    // This ensures the user's score is in the database before we fetch
    if (gameOver && allGamesComplete && scoreSent) {
      setIsLoading(true);

      const fetchScores = async () => {
        try {
          // Fetch all scores (which will include the user's score after it's been sent)
          const freshScores = await fetchTodayScores();

          // Count how many OTHER players' scores are below the user's score
          const scoresBelowUser = freshScores.filter(
            (s) => s < userScore,
          ).length;

          // Total OTHER players (excluding the user's own score)
          const otherPlayersCount = freshScores.length - 1;

          // Calculate percentile (what percentage of OTHER players the user beat)
          const percentile =
            otherPlayersCount > 0
              ? Math.round((scoresBelowUser / otherPlayersCount) * 100)
              : 0;

          setUserPercentile(percentile);
          setAllScores(freshScores);
        } catch (error) {
          console.error('Failed to fetch scores on game end:', error);
          // On error, just use the user's score
          setAllScores([userScore]);
          setUserPercentile(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchScores();
    }
  }, [gameOver, allGamesComplete, userScore, scoreSent]);

  return {
    allScores,
    userPercentile,
    isLoading,
  };
};
