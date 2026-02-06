import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import {
  sendSteamDetectiveScore,
  fetchSteamDetectiveScores,
} from '../../lib/supabaseClient';
import { getPuzzleDate } from '../../utils';
import ShareButton from '../ShareButton';
import SteamDetectiveFeedbackButtons from './SteamDetectiveFeedbackButtons';
import { MAX_CLUES } from './utils';
import blueGamesFolderIcon from '../../assets/games-folder-48.png';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';

interface GameCompleteProps {
  show: boolean;
  gameName: string;
  appId: number;
  totalGuesses: number;
  onCopyToShare: () => void;
  scoreSent: boolean;
  onScoreSent: () => void;
  blurTitleAndAsAmpersand?: boolean;
  caseFile: 'easy' | 'expert';
  onStartExpertCase?: () => void;
  expertCaseStarted?: boolean;
}

const DEBUG_LOADING = false;

export const GameComplete: React.FC<GameCompleteProps> = ({
  show,
  gameName,
  appId,
  totalGuesses,
  onCopyToShare,
  scoreSent,
  onScoreSent,
  blurTitleAndAsAmpersand,
  caseFile,
  onStartExpertCase,
  expertCaseStarted,
}) => {
  const [scoresLoading, setScoresLoading] = useState(true);
  const [todayScores, setTodayScores] = useState<number[]>([]);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);

  const puzzleDate = getPuzzleDate();

  // Replace 'and' with '&' if requested
  const displayName = blurTitleAndAsAmpersand
    ? gameName.replace(/\band\b/gi, '&')
    : gameName;

  // Submit and fetch scores when component shows
  useEffect(() => {
    if (!show) return;

    const submitAndFetchScores = async () => {
      setScoresLoading(true);

      try {
        // Submit score if not already sent
        if (!scoreSent) {
          await sendSteamDetectiveScore(totalGuesses, caseFile);
          onScoreSent();
        }

        // Fetch all scores for today
        const scores = await fetchSteamDetectiveScores(caseFile);
        setTodayScores(scores);

        // Calculate percentile (lower score is better, so count worse scores)
        const worseScores = scores.filter(
          (score) => score > totalGuesses,
        ).length;
        const percentile = Math.round((worseScores / scores.length) * 100);
        setUserPercentile(percentile);
      } catch (error) {
        console.error('Error in score submission/fetching:', error);
      } finally {
        if (!DEBUG_LOADING) {
          setScoresLoading(false);
        }
      }
    };

    submitAndFetchScores();
  }, [show, puzzleDate, totalGuesses, scoreSent, onScoreSent, caseFile]);

  // Calculate distribution for bar chart
  const getDistribution = () => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    todayScores.forEach((score) => {
      if (score >= 1 && score <= 7) {
        dist[score as keyof typeof dist]++;
      }
    });
    return dist;
  };

  const correct = totalGuesses <= MAX_CLUES;
  const preDisplayNameContent = correct ? (
    <div className='block md:inline text-green-500'>
      {`Case File #${caseFile === 'easy' ? '1' : '2'}`} Solved!
    </div>
  ) : (
    <div className='block md:inline text-red-500'>The answer was:</div>
  );

  const distribution = getDistribution();
  const maxCount = Math.max(...Object.values(distribution), 1);

  if (!show) return null;

  return (
    <div className='mx-auto'>
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-zinc-800 overflow-hidden p-4 ${caseFile === 'easy' ? 'min-h-[324px]' : 'min-h-[475px]'}`}
      >
        {/* Perfect Badge */}
        {totalGuesses === 1 && (
          <div className='flex items-center justify-center gap-1 mb-2'>
            <StarIcon className='w-5 h-5 text-yellow-500' />
            <span className='text-white font-semibold'>Perfect</span>
          </div>
        )}
        {/* Game Name */}
        <h2 className={`text-md font-semibold text-center text-white`}>
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
        {caseFile === 'easy' ? (
          <div
            className={`${correct ? 'hidden' : ''} text-center text-gray-400`}
          >
            Try Case File #2!
          </div>
        ) : null}
        <div className='my-4 mx-auto max-w-[450px]'>
          {/* Expert Case File Button - only show for easy mode and if expert hasn't started */}
          {caseFile === 'easy' && onStartExpertCase && !expertCaseStarted && (
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onStartExpertCase();
              }}
              className='w-full px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <span className='block'>
                <PlayIcon className='inline w-5 h-5 mr-1 mt-[-1px]' />
              </span>
              <span className='block '>
                <span className='mr-2 pb-2 whitespace-nowrap'>Continue to</span>{' '}
                <span className='bg-gray-800/20 py-1 px-2 rounded whitespace-nowrap'>
                  <img
                    className='inline w-7 h-7 mr-[2px] relative top-[-1px]'
                    src={blueGamesFolderIcon}
                  />
                  <span className=''>Case File #2</span>
                </span>
              </span>
            </button>
          )}
        </div>
        {/* Loading State */}
        {scoresLoading && (
          <motion.div
            className='flex justify-center items-center py-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
          </motion.div>
        )}

        {/* Scores Display */}
        {!scoresLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className='text-gray-400 text-center pt-1'>
              Global Guess Distribution for Case File{' '}
              {caseFile === 'easy' ? '#1' : '#2'}
            </div>
            {/* Bar Chart */}
            <div className='mb-0 bg-zinc-800 rounded-lg px-2 max-w-[500px] mx-auto overflow-visible'>
              <Chart
                className='pl-2'
                options={{
                  responsive: [
                    {
                      breakpoint: 472, // Breakpoint for smaller screens
                      options: {
                        xaxis: {
                          labels: {
                            rotate: -60, // Increase rotation for smaller screens
                            rotateAlways: true,
                          },
                        },
                      },
                    },
                  ],
                  chart: {
                    type: 'bar',
                    background: 'transparent',
                    toolbar: {
                      show: false,
                    },
                  },
                  plotOptions: {
                    bar: {
                      distributed: true,
                      borderRadius: 4,
                    },
                  },
                  colors: [1, 2, 3, 4, 5, 6, 7].map((guess) =>
                    guess === totalGuesses ? '#22c55e' : '#3b82f6',
                  ),
                  dataLabels: {
                    enabled: false,
                  },
                  legend: {
                    show: false,
                  },
                  xaxis: {
                    categories: [
                      'Clue #1',
                      'Clue #2',
                      'Clue #3',
                      'Clue #4',
                      'Clue #5',
                      'Clue #6',
                      'DNF',
                    ],
                    labels: {
                      rotate: 0,
                      style: {
                        colors: '#9ca3af',
                        fontSize: window.innerWidth < 480 ? '10px' : '11px',
                      },
                    },
                  },
                  yaxis: {
                    max: Math.max(maxCount + 1, 4),
                    tickAmount: Math.max(maxCount + 1, 4),
                    forceNiceScale: maxCount > 10,
                    title: {
                      text: 'Players',
                      rotate: -90,
                      style: {
                        color: '#9ca3af',
                        fontSize: '12px',
                        fontWeight: 'regular',
                      },
                    },
                    labels: {
                      style: {
                        colors: '#9ca3af',
                      },
                      formatter: (val: number) =>
                        val === 0 ? '' : Math.floor(val).toString(),
                    },
                  },
                  grid: {
                    borderColor: '#374151',
                  },
                  tooltip: {
                    theme: 'dark',
                    y: {
                      formatter: (val: number) =>
                        `${val} ${val === 1 ? 'player' : 'players'}`,
                    },
                  },
                }}
                series={[
                  {
                    name: 'Players',
                    data: [
                      distribution[1],
                      distribution[2],
                      distribution[3],
                      distribution[4],
                      distribution[5],
                      distribution[6],
                      distribution[7],
                    ],
                  },
                ]}
                type='bar'
                height={200}
              />
            </div>

            {/* Share Button */}
            <div className='space-y-3 mx-auto max-w-[450px]'>
              {caseFile === 'expert' && (
                <ShareButton
                  userPercentile={userPercentile}
                  onCopyToShare={onCopyToShare}
                  isLoading={scoresLoading}
                  text={'Share both Case Files'}
                />
              )}

              {/* Compact Copy Button (experimental)
              <button
                onClick={onCopyCompact}
                className='mx-auto text-xs px-3 py-1.5 focus:outline-none py-2 px-4 rounded text-sm font-medium transition-colors bg-transparent hover:bg-gray-700 text-gray-300 flex items-center justify-center gap-2'
              >
                <DocumentDuplicateIcon className='h-4 w-4' />
                Copy one-liner without Link Preview
              </button>
              */}

              {/* Steam Detective Frequency Feedback - only show for expert or if no expert button */}
              {caseFile === 'expert' && (
                <SteamDetectiveFeedbackButtons isOpen={show} />
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(GameComplete);
