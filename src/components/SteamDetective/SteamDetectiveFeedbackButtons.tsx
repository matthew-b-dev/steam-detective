import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { sendFeedback } from '../../lib/supabaseClient';

interface SteamDetectiveFeedbackButtonsProps {
  isOpen: boolean;
}

const SteamDetectiveFeedbackButtons: React.FC<
  SteamDetectiveFeedbackButtonsProps
> = ({ isOpen }) => {
  const [feedback, setFeedback] = useState<
    'steam_more' | 'steam_less' | 'perfect' | 'too_easy' | 'too_hard' | null
  >(null);

  // Reset feedback when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFeedback(null);
      }, 0);
    }
  }, [isOpen]);

  const handleFeedback = async (
    type: 'steam_more' | 'steam_less' | 'perfect' | 'too_easy' | 'too_hard',
  ) => {
    setFeedback(type);
    await sendFeedback(type);
    toast.success('Feedback sent.', { duration: 2000 });
  };

  return (
    <div className='border-t border-gray-700 pt-4'>
      <p className='text-center text-xs text-gray-400'>
        Provide <b>anonymous</b> feedback on today's puzzle.
      </p>
      {feedback === null ? (
        <div className='flex flex-wrap gap-2 justify-center mt-2'>
          <button
            className='px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
            onClick={() => handleFeedback('perfect')}
          >
            ⭐️ Great
          </button>
          <button
            className='px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
            onClick={() => handleFeedback('too_easy')}
          >
            😴 Too easy
          </button>
          <button
            className='px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
            onClick={() => handleFeedback('too_hard')}
          >
            😵‍💫 Too hard
          </button>
        </div>
      ) : (
        <p className='text-center text-sm text-green-400 font-semibold my-3'>
          I really appreciate your feedback!
        </p>
      )}
    </div>
  );
};

export default SteamDetectiveFeedbackButtons;
