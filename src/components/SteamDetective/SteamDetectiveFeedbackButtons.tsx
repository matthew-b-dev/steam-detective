import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { sendFeedback } from '../../lib/supabaseClient';

interface SteamDetectiveFeedbackButtonsProps {
  isOpen: boolean;
}

// Sanitize user input to prevent malicious content
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .slice(0, 500) // Limit to 500 characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/[<>]/g, ''); // Remove any remaining < >
};

const SteamDetectiveFeedbackButtons: React.FC<
  SteamDetectiveFeedbackButtonsProps
> = ({ isOpen }) => {
  const [feedback, setFeedback] = useState<
    'steam_more' | 'steam_less' | 'perfect' | 'too_easy' | 'too_hard' | null
  >(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Reset feedback when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFeedback(null);
        setShowCustomInput(false);
        setCustomFeedback('');
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

  const handleCustomFeedback = () => {
    setShowCustomInput(true);
  };

  const handleSendCustomFeedback = async () => {
    const sanitized = sanitizeInput(customFeedback);

    if (!sanitized || sanitized.length === 0) {
      toast.error('Please enter some feedback.', { duration: 2000 });
      return;
    }

    setIsSending(true);
    try {
      await sendFeedback('custom', `\`[Steam]\` ${sanitized}`);
      setFeedback('perfect'); // Use existing feedback state to show success message
      toast.success('Feedback sent.', { duration: 2000 });
    } catch {
      toast.error('Failed to send feedback.', { duration: 2000 });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='border-t border-gray-700 pt-3'>
      <p className='text-center text-xs text-gray-400'>
        Provide <b>anonymous</b> feedback on today's puzzle.
      </p>
      <AnimatePresence mode='wait'>
        {feedback === null && !showCustomInput ? (
          <motion.div
            key='buttons'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='flex flex-wrap gap-2 justify-center mt-2 pt-[4px]'
          >
            <button
              className='px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
              onClick={handleCustomFeedback}
            >
              💬 Other
            </button>
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
          </motion.div>
        ) : showCustomInput && feedback === null ? (
          <motion.div
            key='input'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='mt-3 flex gap-2'
          >
            <input
              type='text'
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSending && customFeedback.trim()) {
                  handleSendCustomFeedback();
                }
              }}
              placeholder='Enter feedback...'
              className='flex-1 px-3 py-[0px] text-sm bg-white border border-gray-600 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              maxLength={100}
              autoFocus
            />
            <button
              className='px-3 leading-[1] py-2 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white whitespace-nowrap'
              onClick={() => {
                setShowCustomInput(false);
                setCustomFeedback('');
              }}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              className='px-3 py-2 leading-[1] rounded text-xs font-semibold transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap'
              onClick={handleSendCustomFeedback}
              disabled={isSending || !customFeedback.trim()}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </motion.div>
        ) : (
          <motion.p
            key='success'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className='text-center text-sm text-green-400 font-semibold my-3'
          >
            I really appreciate your feedback!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SteamDetectiveFeedbackButtons;
