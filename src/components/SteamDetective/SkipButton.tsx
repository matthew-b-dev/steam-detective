import { useRef } from 'react';
import { ForwardIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { MAX_CLUES } from './utils';

interface SkipButtonProps {
  onClick: () => void;
  currentClue: number;
}

export const SkipButton: React.FC<SkipButtonProps> = ({
  onClick,
  currentClue,
}) => {
  const buttonText = currentClue >= MAX_CLUES ? 'Give Up' : 'Skip to next Clue';
  const isGiveUp = currentClue >= MAX_CLUES;
  const lastClickTime = useRef<number>(0);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 400) {
      return; // Throttle: ignore clicks within 400ms to prevent accidental clics
    }
    lastClickTime.current = now;
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`${
        isGiveUp ? 'bg-red-700 hover:bg-red-600' : 'bg-transparent'
      } text-white px-6 py-2 rounded transition-colors inline-flex items-center gap-2 border-1 border-gray-700`}
    >
      <XMarkIcon
        className={`w-5 h-5 relative top-[1px] ${isGiveUp ? 'text-white' : 'text-red-500'}`}
      />
      {buttonText}
      {!isGiveUp && <ForwardIcon className='w-4 h-4' />}
    </button>
  );
};
