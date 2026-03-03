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
  getTimeUntilNextGame,
  type Turn,
} from '../../utils';
import ShareButton from '../ShareButton';
import SteamDetectiveFeedbackButtons from './SteamDetectiveFeedbackButtons';
import AnimatedTotalScoreDisplay from './AnimatedTotalScoreDisplay';
import { useDailyGame } from '../../hooks/useDailyGame';
import { ArrowPathIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';

interface CaseFileState {
  totalGuesses: number;
  isComplete: boolean;
  revealedTitle?: string;
  turns?: Turn[];
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
  const [timeLeft] = useState<{ h: number; m: number }>(() =>
    getTimeUntilNextGame(),
  );
  const localMidnightStr = (() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  })();

  const game1 = useDailyGame(1);
  const game2 = useDailyGame(2);
  const game3 = useDailyGame(3);
  const game4 = useDailyGame(4);
  const hasZoomedClue = [game1, game2, game3, game4].some(
    (game) => game?.screenshotFocusPoint != null,
  );

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
            // Collect per-case-file guess counts from saved state
            const caseGuesses = state
              ? ([
                  state.caseFile1?.totalGuesses ?? 7,
                  state.caseFile2?.totalGuesses ?? 7,
                  state.caseFile3?.totalGuesses ?? 7,
                  state.caseFile4?.totalGuesses ?? 7,
                ] as [number, number, number, number])
              : undefined;
            await sendNewSteamScore(totalScore, caseGuesses);
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
    const generateEmojiText = (totalGuesses: number, turns?: Turn[]) => {
      // Use turn history when available for precise close-guess coloring (🟨)
      if (turns && turns.length > 0) {
        const emojis: string[] = turns.map((turn) => {
          if (turn.type === 'skip') return '🟥';
          if (turn.isCorrect) return '✅';
          return turn.isClose ? '🟨' : '🟥';
        });
        // Pad remaining slots with ⬜ up to 6
        while (emojis.length < 6) emojis.push('⬜');
        return emojis.join('');
      }
      // Legacy fallback: no turn history, treat all misses as 🟥
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
        const emoji = generateEmojiText(
          caseFileState.totalGuesses || 7,
          caseFileState.turns,
        );
        const caseEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i - 1];
        caseFileEmojis.push(`${caseEmoji}  ${emoji}`);
      }
    }

    const realToday = getRealUtcDateString();
    const rawPuzzleDate = getUtcDateString();
    const baseUrl =
      rawPuzzleDate === realToday
        ? 'https://SteamDetective.wtf/'
        : `https://SteamDetective.wtf/d/${rawPuzzleDate}`;

    const rankEmoji = getRankEmoji(userRank, todayScores.length);
    const rankText =
      todayScores.length > 1 && userRank > 0
        ? `  ${rankEmoji} Rank #${userRank} of ${todayScores.length}`
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
          <div className='flex justify-center'>
            {/* Share Button */}
            <ShareButton
              userPercentile={userPercentile}
              onCopyToShare={handleCopyToShare}
              isLoading={scoresLoading}
            />
          </div>

          <div className='flex items-center justify-center gap-1.5 text-gray-400 text-sm'>
            <ArrowPathIcon className='w-4 h-4 shrink-0' />
            New case files in{' '}
            <span className='relative group inline-block'>
              <span
                className='text-white border-b border-dashed border-white cursor-help'
                tabIndex={0}
              >
                {timeLeft.h}h, {timeLeft.m}m.
              </span>
              <span className='pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded border border-white bg-zinc-900 px-2 py-1 text-center text-xs text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 w-max max-w-[230px] shadow-[0_0_12px_rgba(255,255,255,0.25)]'>
                Every day at 00:00 UTC <br /> ({localMidnightStr} your time)
              </span>
            </span>{' '}
            See you then!
          </div>

          {/* Feedback Buttons */}
          <SteamDetectiveFeedbackButtons
            isOpen={show}
            hasZoomedClue={hasZoomedClue}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FinalGameComplete;
