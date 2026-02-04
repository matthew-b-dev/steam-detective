import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { motion } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: 'guessing' | 'shuffle' | 'detective';
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, gameMode }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80'
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className='bg-zinc-900 rounded-lg pl-2 pr-3 py-6 sm:px-8 sm:py-8 max-w-md w-full ml-1 mr-2 sm:ml-4 sm:mr-4'
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className='text-2xl font-bold text-center mb-6'>How to play</h2>
        {gameMode === 'shuffle' ? (
          <ul className='space-y-3 mb-6 text-left list-disc pl-6 text-sm'>
            <li>
              The <b>Weekend Shuffle</b> is a special game mode for{' '}
              <b>Saturdays and Sundays</b>. It's a sorting challenge with{' '}
              <b>3 rounds</b>.
            </li>

            <li>
              Each round gives you <b>5 games</b> to sort by a different
              criterion. Drag and drop the games to reorder them, then submit
              your guess.
            </li>
            <li>
              Your goal is to{' '}
              <b>sort all three lists in as few guesses as possible</b>. Try to
              score better than the global average.
            </li>
            <li>
              You can read more detailed information on the{' '}
              <a
                href='https://github.com/matthew-b-dev/meta-game-daily?tab=readme-ov-file#weekend-shuffle'
                target='_blank'
                rel='noopener noreferrer'
                className='text-yellow-500 underline hover:text-yellow-400'
              >
                GitHub page
              </a>
              .
            </li>
          </ul>
        ) : gameMode === 'detective' ? (
          <ul className='space-y-3 mb-6 text-left list-disc pl-6 text-sm'>
            <li>
              <b>Steam Detective</b> is a game mode where you{' '}
              <b>guess a Steam game</b> based on clues revealed one at a time.
            </li>
            <li>
              You'll receive <b>up to 6 clues</b> about the game, starting with
              "user-defined tags". Each wrong guess or skip reveals the next
              clue.
            </li>
            <li>
              The clues include: <b>User-defined tags</b>, <b>Game Details</b>{' '}
              (reviews, release date, developer, publisher), <b>Description</b>,{' '}
              <b>Screenshot #1</b>, <b>Screenshot #2</b>, and{' '}
              <b>Partially-censored game title</b>.
            </li>
            <li>
              Try to guess the game with <b>as few clues as possible</b> for the
              best score!
            </li>
          </ul>
        ) : (
          <ul className='space-y-3 mb-6 text-left list-disc pl-6 text-sm'>
            <li>
              The goal of this daily puzzle is to{' '}
              <b>guess the name of all 5 games</b>. You are provided with some
              up-front information: Release year and Developer(s).
            </li>
            <li>
              You can submit a guess for any game at any time.{' '}
              <b>You have 10 total guesses</b>.
            </li>
            <li>
              If you need more information about a game, expand it with the{' '}
              <div className='p-1 rounded bg-gray-700 inline h-6 relative bottom-[-2px]'>
                <PlusIcon className='w-5 h-5 inline relative top-[-2px]' />
              </div>{' '}
              button. <b>Revealing information will deduct points</b> from your
              total score.
            </li>
            <li>
              The game is complete when either all games have been revealed or
              all guesses have been exhausted.
            </li>
            <li>
              You can read more detailed information on the{' '}
              <a
                href='https://github.com/matthew-b-dev/meta-game-daily'
                target='_blank'
                rel='noopener noreferrer'
                className='text-yellow-500 underline hover:text-yellow-400'
              >
                GitHub page
              </a>
              .
            </li>
          </ul>
        )}
        <button
          className='w-full px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold'
          onClick={onClose}
        >
          Got it! 👍
        </button>
      </motion.div>
    </motion.div>
  );
};

export default HelpModal;
