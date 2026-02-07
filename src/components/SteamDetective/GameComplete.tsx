import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import {
  getUtcDateString,
  saveCaseFileScore,
  saveCaseFileAnimationPlayed,
  hasCaseFileAnimationPlayed,
} from '../../utils';
import { MAX_CLUES } from './utils';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';

interface GameCompleteProps {
  show: boolean;
  gameName: string;
  appId: number;
  totalGuesses: number;
  blurTitleAndAsAmpersand?: boolean;
  caseFileNumber: number; // 1-4
  onContinueToNextCase?: () => void;
  previousTotalScore?: number; // Total score before this case file
  isCurrentCaseFile?: boolean;
}

// Calculate score based on total guesses
const calculateScore = (totalGuesses: number): number => {
  const scoreMap: Record<number, number> = {
    1: 100,
    2: 85,
    3: 75,
    4: 60,
    5: 45,
    6: 35,
    7: 0, // DNF
  };
  return scoreMap[totalGuesses] || 0;
};

export const GameComplete: React.FC<GameCompleteProps> = ({
  show,
  gameName,
  appId,
  totalGuesses,
  blurTitleAndAsAmpersand,
  caseFileNumber,
  onContinueToNextCase,
  previousTotalScore = 0,
  isCurrentCaseFile = true,
}) => {
  const [animatedScore, setAnimatedScore] = useState(previousTotalScore);
  const [scoreAnimationComplete, setScoreAnimationComplete] = useState(false);

  // Calculate scores
  const currentCaseScore = calculateScore(totalGuesses);
  const newTotalScore = previousTotalScore + currentCaseScore;

  // Replace 'and' with '&' if requested
  const displayName = blurTitleAndAsAmpersand
    ? gameName.replace(/\band\b/gi, '&')
    : gameName;

  // Animate score when component shows
  useEffect(() => {
    if (!show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimatedScore(previousTotalScore);
      setScoreAnimationComplete(false);
      return;
    }

    const puzzleDate = getUtcDateString();

    // Check if animation has already played for this case file
    if (hasCaseFileAnimationPlayed(puzzleDate, caseFileNumber)) {
      // Animation already played, skip it
      setAnimatedScore(newTotalScore);
      setScoreAnimationComplete(true);
      return;
    }

    // Save the case file score
    saveCaseFileScore(puzzleDate, caseFileNumber, currentCaseScore);

    // Mark animation as played
    saveCaseFileAnimationPlayed(puzzleDate, caseFileNumber);

    // For case file #4, skip the counting animation entirely
    // (FinalGameComplete handles the animated score display)
    if (caseFileNumber === 4) {
      setAnimatedScore(newTotalScore);
      setScoreAnimationComplete(true);
      return;
    }

    // If player scored 0 points (didn't solve), skip the animation
    // since the score doesn't change
    if (currentCaseScore === 0) {
      setAnimatedScore(newTotalScore);
      setScoreAnimationComplete(true);
      return;
    }

    // Start animation after a brief delay
    const startDelay = setTimeout(() => {
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();
      const startScore = previousTotalScore;
      const scoreDiff = newTotalScore - previousTotalScore;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startScore + scoreDiff * easeOutCubic);

        setAnimatedScore(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(newTotalScore);
          setScoreAnimationComplete(true);
        }
      };

      requestAnimationFrame(animate);
    }, 300);

    return () => clearTimeout(startDelay);
  }, [
    show,
    previousTotalScore,
    newTotalScore,
    caseFileNumber,
    currentCaseScore,
  ]);

  const correct = totalGuesses <= MAX_CLUES;
  const preDisplayNameContent = correct ? (
    <div className='block md:inline text-green-500'>
      {`Case File #${caseFileNumber}`} Solved!
    </div>
  ) : (
    <div className='block md:inline text-red-500'>The answer was:</div>
  );

  if (!show) return null;

  return (
    <div className='mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className='bg-zinc-800 overflow-hidden p-4 min-h-[252px]'
      >
        {/* Perfect Badge */}
        {totalGuesses === 1 && (
          <div className='flex items-center justify-center gap-1 mb-2'>
            <StarIcon className='w-5 h-5 text-yellow-500' />
            <span className='text-white font-semibold'>Perfect</span>
          </div>
        )}
        {/* Game Name */}
        <h2 className='text-md font-semibold text-center text-white'>
          {preDisplayNameContent}
          <div className='flex justify-center'>
            <a
              href={`https://store.steampowered.com/app/${appId}`}
              target='_blank'
              rel='noopener noreferrer block'
              className='pl-2 text-white-400 hover:text-gray-300 hover:underline inline-flex items-center gap-1 '
            >
              <span>{displayName}</span>

              <ArrowTopRightOnSquareIcon className='w-4 h-4 no-underline text-blue-400' />
            </a>
          </div>
        </h2>

        {/* Score & Guesses Summary */}
        <div className='text-center text-sm mt-1'>
          <span className='text-yellow-500 font-semibold'>
            +{currentCaseScore} pts.
          </span>
          <span className='text-gray-400'>
            {' '}
            (
            {totalGuesses === 7
              ? 'missed'
              : totalGuesses === 1
                ? '1st guess'
                : totalGuesses === 2
                  ? '2nd guess'
                  : totalGuesses === 3
                    ? '3rd guess'
                    : `${totalGuesses}th guess`}
            )
          </span>
        </div>

        {/* Animated Total Score - only show for current case file, not case #4 (handled by FinalGameComplete) */}
        {isCurrentCaseFile && caseFileNumber < 4 && (
          <motion.div
            className='text-center mt-4 mb-4'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className='text-yellow-500 text-6xl font-bold'>
              {animatedScore}
            </div>
            <div className='text-gray-400 text-sm mt-1'>Total Points</div>
          </motion.div>
        )}

        {/* Continue Button - only show for case files 1-3 */}
        {caseFileNumber < 4 && onContinueToNextCase && (
          <div className='my-4 mx-auto max-w-[450px]'>
            <button
              disabled={!scoreAnimationComplete}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onContinueToNextCase();
              }}
              className={`w-full px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity duration-300 ${
                scoreAnimationComplete
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className='block'>
                <PlayIcon className='inline w-5 h-5 mr-1 mt-[-1px]' />
              </span>
              <span className='block'>
                <span className='mr-2 pb-2 whitespace-nowrap'>Continue to</span>{' '}
                <span className='bg-gray-800/20 py-1 px-2 rounded whitespace-nowrap'>
                  Case File #{caseFileNumber + 1}
                </span>
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(GameComplete);
