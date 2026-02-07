import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  sendNewSteamScore,
  fetchNewSteamScores,
} from '../../lib/supabaseClient';
import {
  getUnifiedState,
  getUtcDateString,
  getRealUtcDateString,
  getRankEmoji,
  saveTotalScoreSent,
} from '../../utils';
import ShareButton from '../ShareButton';
import SteamDetectiveFeedbackButtons from './SteamDetectiveFeedbackButtons';
import AnimatedTotalScoreDisplay from './AnimatedTotalScoreDisplay';
import toast from 'react-hot-toast';

interface CaseFileState {
  totalGuesses: number;
  isComplete: boolean;
  revealedTitle?: string;
}

interface FinalGameCompleteProps {
  show: boolean;
  totalScore: number;
  missedCaseFiles: Array<{ caseNumber: number; gameName: string }>;
}

const FinalGameComplete: React.FC<FinalGameCompleteProps> = ({
  show,
  totalScore,
  missedCaseFiles,
}) => {
  const [scoresLoading, setScoresLoading] = useState(true);
  const [todayScores, setTodayScores] = useState<number[]>([]);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number>(0);
  const hasSentScoreThisSession = useRef(false);

  // Send score first, then fetch all scores
  useEffect(() => {
    if (!show) return;

    const sendAndFetchScores = async () => {
      setScoresLoading(true);

      try {
        const currentPuzzleDate = getUtcDateString();
        const state = getUnifiedState(currentPuzzleDate);

        // Send score if not already sent (check both ref and localStorage)
        if (!hasSentScoreThisSession.current && !state?.totalScoreSent) {
          hasSentScoreThisSession.current = true; // Prevent duplicate sends
          try {
            await sendNewSteamScore(totalScore);
            saveTotalScoreSent(currentPuzzleDate);
          } catch (error) {
            console.error('Error sending score:', error);
          }
        }

        // Fetch all scores for today (after send completes)
        const scores = await fetchNewSteamScores();
        setTodayScores(scores);

        // Calculate percentile and rank (higher score is better, so count worse scores)
        const worseScores = scores.filter((score) => score < totalScore).length;
        const percentile = Math.round((worseScores / scores.length) * 100);
        setUserPercentile(percentile);

        // Calculate rank
        const sortedScores = [...scores].sort((a, b) => b - a);
        const minScore = Math.min(...scores);
        const isWorstScore = totalScore === minScore;
        const countAtBottom = scores.filter((s) => s === minScore).length;
        const isTiedForWorst = isWorstScore && countAtBottom > 1;

        let rank;
        if (isTiedForWorst) {
          rank = scores.length;
        } else {
          rank = sortedScores.findIndex((s) => s === totalScore) + 1;
        }
        setUserRank(rank);
      } catch (error) {
        console.error('Error in score sending/fetching:', error);
      } finally {
        setScoresLoading(false);
      }
    };

    sendAndFetchScores();
  }, [show, totalScore]);

  // Generate share text
  const handleCopyToShare = useCallback(() => {
    const generateEmojiText = (totalGuesses: number) => {
      if (totalGuesses === 7) {
        return '🟥🟥🟥🟥🟥🟥';
      }
      const emojis = [];
      for (let i = 1; i <= 6; i++) {
        if (i < totalGuesses) {
          emojis.push('🟥');
        } else if (i === totalGuesses) {
          emojis.push('✅');
        } else {
          emojis.push('⬜');
        }
      }
      return emojis.join('');
    };

    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    if (!state) return;

    const caseFileEmojis = [];

    for (let i = 1; i <= 4; i++) {
      const caseFileKey = `caseFile${i}` as
        | 'caseFile1'
        | 'caseFile2'
        | 'caseFile3'
        | 'caseFile4';
      const caseFileState = state[caseFileKey] as CaseFileState | undefined;
      if (caseFileState) {
        const emoji = generateEmojiText(caseFileState.totalGuesses || 7);
        const caseEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i - 1];
        caseFileEmojis.push(`${caseEmoji}  ${emoji}`);
      }
    }

    const realToday = getRealUtcDateString();
    const rawPuzzleDate = getUtcDateString();
    const baseUrl =
      rawPuzzleDate === realToday
        ? 'https://steamdetective.wtf/'
        : `https://steamdetective.wtf/d/${rawPuzzleDate}`;

    const rankEmoji = getRankEmoji(userRank, todayScores.length);
    const rankText =
      todayScores.length > 1
        ? ` | ${rankEmoji} Rank #${userRank} of ${todayScores.length}`
        : '';

    const shareText = `${baseUrl} 🕵️\n${caseFileEmojis.join('\n')}\n🏆 ${totalScore} points${rankText}`;

    navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
  }, [totalScore, userRank, todayScores.length]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='mx-auto mt-4 px-1 md:px-4'
    >
      <div className='bg-zinc-800/40 rounded-lg p-3 md:p-6 mb-6 min-h-[466px]'>
        {/* Score Animation */}
        <AnimatedTotalScoreDisplay
          totalScore={totalScore}
          todayScores={todayScores}
          userPercentile={userPercentile}
          scoresLoading={scoresLoading}
        />

        <div className='space-y-3'>
          {/* Missed Case Files */}
          {missedCaseFiles.length > 0 && (
            <div className='mb-1 flex flex-wrap gap-2 items-center overflow-auto'>
              <span className='text-red-400 font-semibold text-sm'>
                Missed:
              </span>
              {missedCaseFiles.map((caseFile, i) => (
                <span
                  key={caseFile.caseNumber + i}
                  className='flex items-center rounded px-2 py-1 text-xs text-red-500 bg-red-900/30'
                >
                  <span className='mr-1 font-bold'>❌</span> {caseFile.gameName}
                </span>
              ))}
            </div>
          )}

          {/* Share Button */}
          <ShareButton
            userPercentile={userPercentile}
            onCopyToShare={handleCopyToShare}
            isLoading={scoresLoading}
          />

          {/* Feedback Buttons */}
          <SteamDetectiveFeedbackButtons isOpen={show} />
        </div>
      </div>
    </motion.div>
  );
};

export default FinalGameComplete;
