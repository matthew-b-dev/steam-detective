import { useState, useEffect } from 'react';

interface UseScoreAnimationProps {
  targetScore: number;
}

export const useScoreAnimation = ({
  targetScore,
}: UseScoreAnimationProps): number => {
  const [displayScore, setDisplayScore] = useState(targetScore);

  useEffect(() => {
    if (displayScore === targetScore) return;

    const duration = 500; // milliseconds
    const startTime = Date.now();
    const startScore = displayScore;
    const change = targetScore - displayScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + change * easeOut);

      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayScore(targetScore);
      }
    };

    requestAnimationFrame(animate);
  }, [targetScore, displayScore]);

  return displayScore;
};
