import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ResetPuzzleButtonProps {
  onResetPuzzle: () => void;
}

const ResetPuzzleButton: React.FC<ResetPuzzleButtonProps> = ({
  onResetPuzzle,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!showConfirm) {
    return (
      <button
        className={`${isResetting ? 'text-gray-500' : 'text-red-500 hover:text-red-400 underline cursor-pointer'} text-sm focus:outline-none !border-transparent flex items-center gap-1`}
        onClick={isResetting ? () => {} : () => setShowConfirm(true)}
        disabled={isResetting}
      >
        {isResetting ? (
          <span>Resetting ...</span>
        ) : (
          <>
            <ArrowPathIcon className='w-4 h-4 -scale-x-100' />
            Reset today's puzzle
          </>
        )}
      </button>
    );
  }

  return (
    <motion.div
      className='space-y-2'
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className='flex flex-col items-center gap-2'>
        <span className='text-sm text-gray-300'>
          Are you sure you want to reset today's puzzle?
        </span>
        <div className='flex gap-2'>
          <button
            className='px-4 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1'
            onClick={() => {
              setIsResetting(true);
              setShowConfirm(false);
              onResetPuzzle();
            }}
          >
            <ArrowPathIcon className='w-4 h-4 -scale-x-100' />
            Confirm Reset
          </button>
          <button
            className='px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold'
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPuzzleButton;
