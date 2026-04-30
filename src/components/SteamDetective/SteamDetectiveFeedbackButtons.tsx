import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { sendFeedback, fetchFeedbackCounts } from '../../lib/supabaseClient';
import { getFeedbackVote, saveFeedbackVote } from '../../utils';

interface SteamDetectiveFeedbackButtonsProps {
  isOpen: boolean;
  puzzleDate: string;
  hasZoomedClue?: boolean;
}

type RatedFeedbackType = 'perfect' | 'too_easy' | 'too_hard';

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
> = ({ isOpen, puzzleDate /* temp disabled hasZoomedClue */ }) => {
  const [feedback, setFeedback] = useState<
    'steam_more' | 'steam_less' | 'perfect' | 'too_easy' | 'too_hard' | null
  >(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [displayVote, setDisplayVote] = useState<RatedFeedbackType | null>(
    null,
  );
  const [counts, setCounts] = useState<{
    perfect: number;
    too_easy: number;
    too_hard: number;
  } | null>(null);
  // Tracks whether a real API vote has been sent this session (or was previously stored)
  const hasRealVoteSent = useRef(false);

  // Load prior vote from localStorage and fetch counts on mount
  useEffect(() => {
    const stored = getFeedbackVote(puzzleDate);
    if (stored) {
      hasRealVoteSent.current = true;
      setDisplayVote(stored);
    }
    fetchFeedbackCounts(puzzleDate).then((fetched) => {
      if (!fetched) return; // leave counts as null (hides numbers) on fetch failure
      // If the stored vote has 0 in the DB (player switched votes last session),
      // show at least 1 to reflect their fake vote.
      if (stored && fetched[stored] === 0) {
        setCounts({ ...fetched, [stored]: 1 });
      } else {
        setCounts(fetched);
      }
    });
  }, [puzzleDate]);

  // Reset custom input state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFeedback(null);
        setShowCustomInput(false);
        setCustomFeedback('');
      }, 0);
    }
  }, [isOpen]);

  const handleRatedFeedback = (type: RatedFeedbackType) => {
    if (displayVote === type) {
      // Clicking the active button: visually "unvote" — no API call
      setDisplayVote(null);
      setCounts((prev) => (prev ? { ...prev, [type]: prev[type] - 1 } : prev));
    } else {
      const previous = displayVote;
      setDisplayVote(type);
      setCounts((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, [type]: prev[type] + 1 };
        if (previous) updated[previous] = updated[previous] - 1;
        return updated;
      });
      // Always persist the current display vote so refresh shows the right button
      saveFeedbackVote(puzzleDate, type);
      // Only ever fire one real API call — the very first vote
      if (!hasRealVoteSent.current) {
        hasRealVoteSent.current = true;
        sendFeedback(type);
      }
    }
  };

  /* temp disabled
  const handleZoomedFeedback = async (good: boolean) => {
    const label = good ? 'Zoomed Clue Good' : 'Zoomed Clue Bad';
    await sendFeedback('custom', `\`[Feature]\` ${label}`);
    setFeedback('perfect'); // reuse existing state to show success message
    toast.success('Feedback sent.', { duration: 2000 });
  };
*/
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
      setFeedback('perfect'); // triggers the thanks message
      toast.success('Feedback sent.', { duration: 2000 });
    } catch {
      toast.error('Failed to send feedback.', { duration: 2000 });
    } finally {
      setIsSending(false);
    }
  };

  const ratedButtons: {
    type: RatedFeedbackType;
    label: string;
    emoji: string;
  }[] = [
    { type: 'perfect', label: 'Great', emoji: '⭐️' },
    { type: 'too_easy', label: 'Too easy', emoji: '😴' },
    { type: 'too_hard', label: 'Too hard', emoji: '😵‍💫' },
  ];

  return (
    <div className='border-t border-gray-700 pt-3'>
      <p className='text-center text-xs text-gray-400'>
        Provide <b>anonymous</b> feedback on today's challenge.
      </p>
      <AnimatePresence mode='wait'>
        {feedback === null && !showCustomInput ? (
          <motion.div
            key='buttons'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className='flex flex-col gap-1 sm:gap-2 mt-2 pt-[4px]'
          >
            {/* temporarily disabling this hasZoomedClue && (
              <div className='flex flex-wrap gap-1 sm:gap-2 justify-center'>
                <button
                  className='px-1 sm:px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
                  onClick={() => handleZoomedFeedback(true)}
                >
                  "Zoomed" Clue (New) 👍
                </button>
                <button
                  className='px-1 sm:px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
                  onClick={() => handleZoomedFeedback(false)}
                >
                  "Zoomed" Clue (New) 👎
                </button>
              </div>
            )*/}
            <div className='flex flex-wrap gap-1 sm:gap-2 justify-center'>
              {ratedButtons.map(({ type, label, emoji }) => {
                const isVoted = displayVote === type;
                const count = counts?.[type];
                return (
                  <button
                    key={type}
                    className={`px-1 sm:px-3 py-1.5 rounded text-xs font-semibold transition-colors min-h-[32px] text-white ${
                      isVoted
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => handleRatedFeedback(type)}
                  >
                    {emoji} {label}
                    {count != null && (
                      <span className='ml-1.5 font-mono font-normal bg-black/30 px-1 py-0.5 rounded text-gray-300'>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                className='px-1 sm:px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white'
                onClick={handleCustomFeedback}
              >
                💬 Other
              </button>
            </div>
          </motion.div>
        ) : showCustomInput && feedback === null ? (
          <motion.div
            key='input'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
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
              className='flex-1 min-w-0 px-3 py-[0px] text-sm bg-white border border-gray-600 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              maxLength={100}
              autoFocus
            />
            <div className='flex gap-2'>
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
            </div>
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
