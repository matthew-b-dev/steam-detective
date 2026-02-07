import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPercentileMessage,
  getRankEmoji,
  getUtcDateString,
} from '../../utils';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

interface AnimatedTotalScoreDisplayProps {
  totalScore: number;
  todayScores: number[];
  userPercentile: number | null;
  scoresLoading: boolean;
}

const AnimatedTotalScoreDisplay: React.FC<AnimatedTotalScoreDisplayProps> = ({
  totalScore,
  todayScores,
  userPercentile,
  scoresLoading,
}) => {
  const animationInProgress = useRef(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showBigScore, setShowBigScore] = useState(false);
  const [showBigRank, setShowBigRank] = useState(false);
  const [showSmallScore, setShowSmallScore] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);

  // Calculate user's rank
  const sortedScores = [...todayScores].sort((a, b) => b - a);

  const minScore = Math.min(...todayScores);
  const isWorstScore = totalScore === minScore;
  const countAtBottom = todayScores.filter((s) => s === minScore).length;
  const isTiedForWorst = isWorstScore && countAtBottom > 1;

  const totalPlayers = todayScores.length;

  let userRank;
  if (isTiedForWorst) {
    userRank = totalPlayers;
  } else {
    userRank = sortedScores.findIndex((s) => s === totalScore) + 1;
  }

  const rankEmoji = getRankEmoji(userRank, totalPlayers);

  // Stack dots vertically when scores are the same
  // Cap stacking at MAX_STACK_HEIGHT to prevent chart from getting too tall
  const MAX_STACK_HEIGHT = 4;

  // Build dot plot data: separate user's score from others
  const { otherScoresData, userScoreData, scoreOverflows } = useMemo(() => {
    const scoreCounts: Record<number, number> = {};
    const finalCounts: Record<number, number> = {}; // Track total count per score
    const others: { x: number; y: number }[] = [];
    let userPlaced = false;

    // Place user's dot at the bottom (y=0)
    const user = [{ x: totalScore, y: 0 }];

    // Initialize count for user's score since they occupy y=0
    scoreCounts[totalScore] = 1;

    // Sort scores so we process them in order
    const sorted = [...todayScores].sort((a, b) => a - b);

    for (const score of sorted) {
      if (!scoreCounts[score]) scoreCounts[score] = 0;
      if (!finalCounts[score]) finalCounts[score] = 0;

      finalCounts[score]++; // Track total count

      if (score === totalScore && !userPlaced) {
        // Skip user's score on first occurrence since it's already placed at y=0
        userPlaced = true;
        continue;
      }

      // Only add dots up to MAX_STACK_HEIGHT
      if (scoreCounts[score] < MAX_STACK_HEIGHT) {
        others.push({ x: score, y: scoreCounts[score] });
        scoreCounts[score]++;
      }
    }

    // Identify scores with overflow (more players than visible dots)
    const overflows: Record<number, number> = {};
    Object.keys(finalCounts).forEach((scoreStr) => {
      const score = parseInt(scoreStr);
      const total = finalCounts[score];
      if (total > MAX_STACK_HEIGHT) {
        overflows[score] = total;
      }
    });

    return {
      otherScoresData: others,
      userScoreData: user,
      scoreOverflows: overflows,
    };
  }, [todayScores, totalScore]);

  // Calculate max Y for axis range (capped at 4)
  const maxY = useMemo(() => {
    const all = [...otherScoresData, ...userScoreData];
    return Math.min(Math.max(...all.map((d) => d.y), 0), 4);
  }, [otherScoresData, userScoreData]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'scatter' as const,
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        selection: { enabled: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 600,
          animateGradually: {
            enabled: true,
            delay: 60,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400,
          },
        },
        events: {},
      },
      colors: ['#3b82f6', '#22c55e'], // blue for others, green for user
      markers: {
        size: [7, 11],
        strokeWidth: [0, 2],
        strokeColors: ['transparent', '#ffffff'],
        hover: { size: undefined, sizeOffset: 0 },
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } },
      },
      grid: {
        show: false,
        padding: { left: 10, right: 10, top: 18, bottom: -5 },
      },
      xaxis: {
        min: 0,
        max: 400,
        tickAmount: 4,
        labels: {
          style: { colors: '#9ca3af', fontSize: '11px' },
          formatter: (val: string) => `${parseInt(val)}`,
        },
        axisBorder: { show: true, color: '#4b5563' },
        axisTicks: { show: true, color: '#4b5563' },
        crosshairs: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        show: false,
        min: -0.5,
        max: maxY + 1,
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: { show: false },
        y: {
          title: {
            formatter: (seriesName: string) =>
              seriesName === 'You' ? '⭐ You:' : 'Score:',
          },
          formatter: (
            _val: number,
            opts: {
              w: { config: { series: { data: { x: number }[] }[] } };
              seriesIndex: number;
              dataPointIndex: number;
            },
          ) => {
            const dataPoint =
              opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex];
            return `${dataPoint.x} pts`;
          },
        },
        marker: { show: true },
      },
      legend: { show: false },
      annotations: {
        points: [
          // Overflow count labels
          ...Object.entries(scoreOverflows).map(([score, totalCount]) => ({
            x: Number(score),
            y: MAX_STACK_HEIGHT,
            marker: {
              size: 0,
            },
            label: {
              text: `(+${totalCount - MAX_STACK_HEIGHT})`,
              borderColor: 'transparent',
              offsetY: -5,
              style: {
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: 600,
                padding: {
                  left: 2,
                  right: 2,
                  top: 0,
                  bottom: 0,
                },
              },
            },
          })),
          // "You" label for user's point
          {
            x: userScoreData[0].x,
            y: userScoreData[0].y,
            marker: {
              size: 0,
            },
            label: {
              text: 'You',
              borderColor: 'transparent',
              offsetY: 28,
              style: {
                background: 'transparent',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                padding: {
                  left: 2,
                  right: 2,
                  top: 0,
                  bottom: 0,
                },
              },
            },
          },
        ],
      },
    }),
    [maxY, scoreOverflows, userScoreData],
  );

  const chartSeries = useMemo(
    () => [
      {
        name: 'Others',
        data: otherScoresData,
      },
      {
        name: 'You',
        data: userScoreData,
      },
    ],
    [otherScoresData, userScoreData],
  );

  // Animate score counting and sequence
  useEffect(() => {
    if (scoresLoading || animationInProgress.current) {
      return;
    }

    queueMicrotask(() => {
      setAnimatedScore(0);
      setShowBigScore(true);
      setShowBigRank(false);
      setShowSmallScore(false);
      setShowRank(false);
      setShowHistogram(false);

      animationInProgress.current = true;

      // Start counting animation to total score
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();

      const animateToTotal = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.floor(easeOutCubic * totalScore);

        setAnimatedScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animateToTotal);
        } else {
          // Score counting complete, show rank
          setTimeout(() => {
            setShowBigRank(true);
            // Hold score and rank, then transition to final layout
            setTimeout(() => {
              setShowBigScore(false);
              setShowBigRank(false);
              setTimeout(() => {
                setShowSmallScore(true);
                setTimeout(() => {
                  setShowRank(true);
                  setTimeout(() => {
                    setShowHistogram(true);
                    animationInProgress.current = false;
                  }, 300);
                }, 200);
              }, 300);
            }, 2000);
          }, 500);
        }
      };

      requestAnimationFrame(animateToTotal);
    });
  }, [scoresLoading, totalScore, totalPlayers, userRank]);

  if (scoresLoading) {
    return (
      <div className='mb-6 p-4 bg-zinc-800 rounded-lg min-h-[277px]'>
        <div className='flex flex-col items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
          <p className='text-sm text-gray-400 mt-2'>Loading scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mb-6 p-4 bg-zinc-800 rounded-lg min-h-[277px]'>
      {/* Large animated score */}
      <AnimatePresence>
        {showBigScore && (
          <motion.div
            className='flex justify-center pt-2 h-[220px]'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className=''>
              <div className='flex-col items-center flex'>
                <div className='text-gray-400 text-lg mb-2'>Total Score</div>
                <div className='text-green-400 text-6xl font-bold'>
                  {animatedScore}
                </div>
              </div>
              {/* Rank display that appears below the score */}
              <AnimatePresence>
                {showBigRank && todayScores.length > 1 && (
                  <motion.div
                    className='text-white text-2xl font-semibold mt-3'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {rankEmoji}{' '}
                    {userRank === 0
                      ? 'Unknown Rank'
                      : isTiedForWorst
                        ? `Rank ${totalPlayers}/${totalPlayers}`
                        : `Rank #${userRank} out of ${totalPlayers}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small score label */}
      <AnimatePresence>
        {showSmallScore && (
          <motion.div
            className='text-center mb-1'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className='text-sm font-semibold'>
              Your Score: {totalScore}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rank message */}
      <AnimatePresence>
        {showRank && userPercentile !== null && (
          <motion.p
            className='text-center text-sm text-green-400 mb-3'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
          >
            {getPercentileMessage(
              userPercentile,
              totalScore,
              todayScores,
              getUtcDateString(),
            )}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Dot Plot */}
      <AnimatePresence>
        {showHistogram && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Chart
              options={chartOptions}
              series={chartSeries}
              type='scatter'
              height={95 + maxY * 18}
            />
            <div className='flex justify-between text-[14px] text-gray-500 mt-[-4px]'>
              <span>Worst</span>
              <span>Best</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedTotalScoreDisplay;
