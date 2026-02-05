import React from 'react';
import { motion } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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

        <ul className='space-y-3 mb-6 text-left list-disc pl-6 text-sm'>
          <li>
            <b>SteamDetective</b> is a daily <i>Steam game</i> trivia
            puzzle/challenge where you <b>guess a Steam game</b> based on clues
            revealed one at a time.
          </li>
          <li>
            You'll receive <b>up to 6 clues</b> about the game, the order of
            which will depend on the game. Each wrong guess or skip reveals the
            next clue.
          </li>
          <li>
            The clues include: <b>User-defined tags</b>, <b>Game Details</b>{' '}
            (reviews, release date, developer, publisher), <b>Description</b>,{' '}
            <b>Screenshot #1</b>, <b>Screenshot #2</b>, and{' '}
            <b>Partially-censored game title</b>.
          </li>
          <li>
            Every day there are two "<b>Case Files</b>" (games) to solve. Try to
            guess the game with <b>as few clues as possible</b> for the best
            score!
          </li>
          <li>
            Read more about SteamDetective on the{' '}
            <a
              href='https://github.com/matthew-b-dev/steam-detective?tab=readme-ov-file#steam-detective'
              target='_blank'
              rel='noopener noreferrer'
              className='text-yellow-500 underline hover:text-yellow-400'
            >
              GitHub page
            </a>
          </li>
        </ul>
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
