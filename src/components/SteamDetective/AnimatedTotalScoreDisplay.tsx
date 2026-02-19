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

  // Cap the number of scores to the last 200 (newest) for chart rendering
  const cappedScores =
    todayScores.length > 200 ? todayScores.slice(-200) : todayScores;

  // Calculate user's rank
  const sortedScores = [...cappedScores].sort((a, b) => b - a);

  const minScore = Math.min(...cappedScores);
  const isWorstScore = totalScore === minScore;
  const countAtBottom = cappedScores.filter((s) => s === minScore).length;
  const isTiedForWorst = isWorstScore && countAtBottom > 1;

  const totalPlayers = todayScores.length;

  let userRank;
  if (isTiedForWorst) {
    userRank = totalPlayers;
  } else {
    userRank = sortedScores.findIndex((s) => s === totalScore) + 1;
  }

  const rankEmoji = getRankEmoji(userRank, totalPlayers);

  // Build dot plot data: alternating stack above/below center
  const {
    otherScoresData,
    clusteredScoresData,
    clustered10PlusScoresData,
    userScoreData,
    maxExtent,
  } = useMemo(() => {
    // Adjust stack step based on dot size - smaller dots need less spacing
    const STACK_STEP =
      cappedScores.length > 85 ? 0.2 : cappedScores.length >= 50 ? 0.4 : 0.5;
    const MAX_STACK_LEVEL = 2; // Max vertical levels before using jitter (allows 5 dots: center + 4 stacked)
    const PROXIMITY = 25; // scores within this range share a stack
    const CLUSTER_THRESHOLD_5 = 5; // scores with 5-9 exact duplicates get merged into larger dot
    const CLUSTER_THRESHOLD_10 = 10; // scores with 10+ exact duplicates get merged into even larger dot
    const others: { x: number; y: number }[] = [];
    const clustered: { x: number; y: number }[] = [];
    const clustered10Plus: { x: number; y: number }[] = [];

    // User dot always centered vertically
    const user = [{ x: totalScore, y: 0 }];

    const sorted = [...cappedScores].sort((a, b) => a - b);

    // Remove first occurrence of user's score
    const userIndex = sorted.indexOf(totalScore);
    const allScores =
      userIndex >= 0
        ? [...sorted.slice(0, userIndex), ...sorted.slice(userIndex + 1)]
        : sorted;

    // Count exact duplicates for each score
    const scoreCounts = new Map<number, number>();
    for (const s of allScores) {
      scoreCounts.set(s, (scoreCounts.get(s) || 0) + 1);
    }

    // Track stacking per cluster of nearby scores
    // Each entry: { anchor: number, count: number } — anchor is the first score in the cluster
    const clusters: { anchor: number; count: number }[] = [];

    const getCluster = (score: number) => {
      for (const c of clusters) {
        if (Math.abs(score - c.anchor) <= PROXIMITY) return c;
      }
      return null;
    };

    // User's score occupies position 0 in its cluster
    clusters.push({ anchor: totalScore, count: 1 });

    // Track which scores have been processed (to avoid duplicates in clustered array)
    const processedClustered = new Set<number>();

    for (const s of allScores) {
      const count = scoreCounts.get(s)!;

      // If this exact score appears 10+ times, add ONE extra large dot (only once per unique score)
      if (count >= CLUSTER_THRESHOLD_10 && !processedClustered.has(s)) {
        clustered10Plus.push({ x: s, y: 0 });
        processedClustered.add(s);
        continue; // Skip adding to normal dots
      }

      // If this exact score appears 5-9 times, add ONE large dot (only once per unique score)
      if (count >= CLUSTER_THRESHOLD_5 && !processedClustered.has(s)) {
        clustered.push({ x: s, y: 0 });
        processedClustered.add(s);
        continue; // Skip adding to normal dots
      }

      // Skip if already added to clustered
      if (processedClustered.has(s)) {
        continue;
      }

      // Normal stacking for scores with < 5 duplicates
      let cluster = getCluster(s);
      if (!cluster) {
        // New cluster; first dot goes at center
        cluster = { anchor: s, count: 0 };
        clusters.push(cluster);
        others.push({ x: s, y: 0 });
      } else {
        // Alternate above and below: count 1,+1, 2,-1, 3,+2, 4,-2, ...
        const n = cluster.count;
        const level = Math.ceil(n / 2);

        // If stack exceeds max level, use deterministic jitter instead
        if (level > MAX_STACK_LEVEL) {
          // Use score and count to create deterministic offset
          const seed = (s * 17 + n * 31) % 100;
          const jitter = (seed / 100 - 0.5) * 0.4; // Deterministic offset +/-0.2
          others.push({ x: s, y: jitter });
        } else {
          const y = n % 2 === 1 ? level * STACK_STEP : -level * STACK_STEP;
          others.push({ x: s, y });
        }
      }
      cluster.count++;
    }

    // Compute max extent for dynamic axis range
    const allY = [...others.map((d) => Math.abs(d.y)), 0];
    const maxExtent = Math.max(...allY);

    return {
      otherScoresData: others,
      clusteredScoresData: clustered,
      clustered10PlusScoresData: clustered10Plus,
      userScoreData: user,
      maxExtent,
    };
  }, [cappedScores, totalScore]);

  // Dynamic y bounds: at least 2, otherwise maxExtent + padding
  const yBound = Math.max(2, maxExtent + 0.8);

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
        events: {
          // Reorder SVG so yaxis annotation fill renders behind data dots
          mounted: (chartCtx: { el: HTMLElement }) => {
            const el = chartCtx.el;
            const yAnnotations = el.querySelector(
              '.apexcharts-yaxis-annotations',
            );
            const grid = el.querySelector('.apexcharts-grid');
            if (yAnnotations && grid && grid.parentNode) {
              grid.parentNode.insertBefore(yAnnotations, grid.nextSibling);
            }
          },
          updated: (chartCtx: { el: HTMLElement }) => {
            const el = chartCtx.el;
            const yAnnotations = el.querySelector(
              '.apexcharts-yaxis-annotations',
            );
            const grid = el.querySelector('.apexcharts-grid');
            if (yAnnotations && grid && grid.parentNode) {
              grid.parentNode.insertBefore(yAnnotations, grid.nextSibling);
            }
          },
        },
      },
      colors: ['#3b82f6', '#3b82f6', '#3b82f6', '#22c55e'], // blue for normal others, blue for 5+ clustered, blue for 10+ clustered, green for user
      markers: {
        // Array: [normal others, 5+ clustered others, 10+ clustered others, user]
        // For 5x area: radius = sqrt(5) * normal_radius ≈ 2.236 * normal_radius
        // For 10+ area: 33% bigger than 5+ dot
        size: [
          // normal dots
          todayScores.length > 85 ? 3 : todayScores.length >= 50 ? 4 : 5,
          // 5+ clustered dots
          todayScores.length > 85 ? 7 : todayScores.length >= 50 ? 10 : 13,
          // 10+ clustered dots (33% bigger than 5+)
          todayScores.length > 85 ? 12 : todayScores.length >= 50 ? 17 : 23,
          // user dot
          8,
        ],
        strokeWidth: [0, 0, 0, 2],
        strokeColors: ['transparent', 'transparent', 'transparent', '#ffffff'],
        fillOpacity: [1, 0.6, 0.6, 1], // 5+ and 10+ dots more transparent
        hover: { size: undefined, sizeOffset: 0 },
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } },
      },
      grid: {
        show: false,
        padding: { left: 10, right: 10, top: -20, bottom: -5 },
      },
      xaxis: {
        min: 0,
        max: 400,
        tickAmount: 4,
        labels: {
          style: { colors: '#9ca3af', fontSize: '11px' },
          formatter: (val: string) => `${parseInt(val)}`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        show: false,
        min: -yBound,
        max: yBound,
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: { show: false },
        y: {
          title: {
            formatter: (seriesName: string) =>
              seriesName === 'You'
                ? '⭐ You:'
                : seriesName === 'Others (10+)'
                  ? '10+ Players:'
                  : seriesName === 'Others (5+)'
                    ? '5+ Players:'
                    : 'Score:',
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
        // Full-height vertical lines at each tick position
        xaxis: [0, 100, 200, 300, 400].map((val) => ({
          x: val,
          borderColor: '#374151',
          strokeDashArray: 0,
          opacity: 0.7,
        })),
        // Horizontal lines at top and bottom bounding the data
        yaxis: [
          {
            y: -yBound + 0.3,
            y2: yBound - 0.3,
            borderColor: '#4b5563',
            strokeDashArray: 2,
            fillColor: '#000000',
            opacity: 0.15,
          },
        ],
        points: [
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
              offsetY: 30,
              style: {
                background: 'transparent',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cssClass: 'z-[9999] [text-shadow:_0_1px_4px_rgba(0,0,0,1)]',
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
    [todayScores.length, userScoreData, yBound],
  );

  const chartSeries = useMemo(
    () => [
      {
        name: 'Others',
        data: otherScoresData,
      },
      {
        name: 'Others (5+)',
        data: clusteredScoresData,
      },
      {
        name: 'Others (10+)',
        data: clustered10PlusScoresData,
      },
      {
        name: 'You',
        data: userScoreData,
      },
    ],
    [
      otherScoresData,
      clusteredScoresData,
      clustered10PlusScoresData,
      userScoreData,
    ],
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
      <div className='mb-6 p-4 bg-zinc-800 rounded-lg min-h-[256px]'>
        <div className='flex flex-col items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
          <p className='text-sm text-gray-400 mt-2'>Loading scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mb-6 p-4 bg-zinc-800 rounded-lg min-h-[256px]'>
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
                    className='text-white text-lg sm:text-2xl font-semibold mt-3'
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
            className='text-center text-sm text-green-400'
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
              height={Math.max(120, 80 + yBound * 18)}
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
