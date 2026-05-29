import { useState, useEffect } from 'react';
import {
  QuestionMarkCircleIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';
import HelpModal from './components/HelpModal';
import StatsModal from './components/StatsModal';
import PuzzleDatePicker from './components/PuzzleDatePicker';
import SteamDetectiveFooter from './components/SteamDetectiveFooter';
import { eventFiredThisSession, isLocalhost } from './utils';
import {
  sendFeedback,
  fetchFeedbackCounts,
  supabase,
} from './lib/supabaseClient';

const IS_PROD = !isLocalhost();

// Toggle to preview the landing page as if all challenges are completed
const DEBUG_ALL_COMPLETE = false;

// Force random date selection to always return this date (null = disabled)
const DEBUG_RANDOM_DATE: string | null = null;

// The 120th puzzle date (Feb 4 + 119 days = June 3, 2026)
const PUZZLE_END_DATE = new Date('2026-06-03T00:00:00Z');

// Farewell banner - shown until June 10 UTC
const BANNER_END_DATE = new Date('2026-06-10T00:00:00Z');
const WAVE_DATE = '2026-06-05';
const WAVE_STORAGE_KEY = 'steam-detective-farewell-wave';

const DiscordIcon = () => (
  <svg
    viewBox='0 0 24 24'
    className='h-4 w-4 fill-current shrink-0'
    aria-hidden='true'
  >
    <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.102.127 18.117a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
  </svg>
);

const buildDatePool = (): string[] => {
  const start = new Date('2026-02-04T00:00:00Z');
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const maxDate = todayUTC < PUZZLE_END_DATE ? todayUTC : PUZZLE_END_DATE;
  const all: string[] = [];
  const d = new Date(start);
  while (d <= maxDate) {
    all.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return all;
};

const computeAllComplete = (): boolean => {
  return buildDatePool().every((dateStr) => {
    const raw = localStorage.getItem(`steam-detective-state-${dateStr}`);
    if (!raw) return false;
    try {
      return JSON.parse(raw).allCasesComplete === true;
    } catch {
      return false;
    }
  });
};

const getRandomDate = (forceAll: boolean): { date: string; clear: boolean } => {
  if (DEBUG_RANDOM_DATE) return { date: DEBUG_RANDOM_DATE, clear: true };
  const all = buildDatePool();
  if (forceAll)
    return { date: all[Math.floor(Math.random() * all.length)], clear: true };

  const notStarted: string[] = [];
  const startedIncomplete: string[] = [];

  for (const dateStr of all) {
    const raw = localStorage.getItem(`steam-detective-state-${dateStr}`);
    if (!raw) {
      notStarted.push(dateStr);
    } else {
      try {
        if (JSON.parse(raw).allCasesComplete !== true)
          startedIncomplete.push(dateStr);
      } catch {
        notStarted.push(dateStr);
      }
    }
  }

  // Prefer never-started dates; only fall back to started-but-unfinished if none remain
  // The puzzles were not at a very high standard before this date :~)
  const PREFER_AFTER = '2026-03-03';
  if (notStarted.length > 0) {
    const recent = notStarted.filter((d) => d > PREFER_AFTER);
    const pool = recent.length > 0 ? recent : notStarted;
    return {
      date: pool[Math.floor(Math.random() * pool.length)],
      clear: false,
    };
  }
  if (startedIncomplete.length > 0) {
    const recent = startedIncomplete.filter((d) => d > PREFER_AFTER);
    const pool = recent.length > 0 ? recent : startedIncomplete;
    return { date: pool[Math.floor(Math.random() * pool.length)], clear: true };
  }
  return { date: all[Math.floor(Math.random() * all.length)], clear: true };
};

export const LandingPage = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allComplete] = useState(
    () => DEBUG_ALL_COMPLETE || computeAllComplete(),
  );
  const [randomMode, setRandomMode] = useState<'unplayed' | 'all'>(() => {
    const stored = localStorage.getItem('steam-detective-random-mode');
    if (stored === 'unplayed' || stored === 'all') return stored;
    return allComplete ? 'all' : 'unplayed';
  });
  const [showRandomMenu, setShowRandomMenu] = useState(false);
  const [waveCount, setWaveCount] = useState<number | null>(null);
  const [hasWaved, setHasWaved] = useState(
    () => !!localStorage.getItem(WAVE_STORAGE_KEY),
  );

  useEffect(() => {
    if (new Date() < BANNER_END_DATE) {
      fetchFeedbackCounts(WAVE_DATE).then((counts) => {
        if (counts) setWaveCount(counts.perfect);
      });
    }
  }, []);

  const handleWave = () => {
    if (hasWaved) return;
    localStorage.setItem(WAVE_STORAGE_KEY, '1');
    setHasWaved(true);
    setWaveCount((c) => (c === null ? 1 : c + 1));
    supabase
      .from('feedback')
      .insert({
        created_at: WAVE_DATE,
        feedback_type: 'perfect',
        feedback_text: null,
      })
      .then();
  };

  const handleDateSelect = (dateStr: string) => {
    window.location.href = `/d/${dateStr}`;
  };

  return (
    <div
      className='min-h-screen flex flex-col'
      style={{ background: '#101211' }}
    >
      <main className='flex-1 flex flex-col items-center justify-center px-5 py-14 sm:py-24 text-center overflow-x-hidden'>
        {/* there goes my hero */}
        <div className='mb-5'>
          <h1
            className='font-black leading-[0.9]'
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '-0.04em',
              fontSize: 'clamp(1.25rem, 8vw, 5.09rem)',
            }}
          >
            <span className='text-gray-200'>Steam</span>
            <span className='text-white'>Detective</span>
            <span
              style={{ fontFamily: 'serif', letterSpacing: '-0.03em' }}
              className='text-gray-500'
            >
              .<span className='italic text-yellow-400'>wtf</span>
            </span>
          </h1>
        </div>

        <p className='text-gray-400 text-sm sm:text-base max-w-sm sm:max-w-md mb-4 leading-relaxed'>
          A collection of{' '}
          <span className='text-gray-100 font-semibold'>
            120 PC Game trivia challenges
          </span>{' '}
          which were released daily from February through June 2026.
        </p>

        {/* Farewell banner */}
        {new Date() < BANNER_END_DATE && (
          <div className='w-full max-w-2xl text-left text-xs sm:text-sm rounded border border-blue-500/60 mb-6 bg-blue-900/20 px-3 py-3 text-blue-100'>
            <p className='leading-relaxed'>
              This daily trivia run has come to an end after 120 consecutive
              days. The site will remain up (it's hosted for free). Thank you so
              much for playing along and sharing awesome feedback along the way!
              <br />
              You're welcome to drop me a line:{' '}
              <span className='block mt-1 ml-1 relative -top-[2px]'>
                <span className='mr-1 inline-flex items-center gap-1.5 relative top-[4px]'>
                  <span className='relative top-[1px]'>
                    <DiscordIcon />
                  </span>
                  <code className='font-mono bg-black/20 rounded px-1 py-0.5 text-blue-200'>
                    toup_
                  </code>
                </span>{' '}
                <span className='text-gray-400'>|</span>{' '}
                <a
                  href='mailto:hello@steamdetective.wtf'
                  className='ml-1 underline text-blue-300 hover:text-white transition-colors'
                >
                  hello@steamdetective.wtf
                </a>{' '}
              </span>
            </p>
            <div className='mt-2.5'>
              <button
                onClick={handleWave}
                disabled={hasWaved}
                className={`inline-flex items-center gap-1.5 px-2.5 pb-1 pt-[1px] text-sm transition-colors ${
                  hasWaved
                    ? 'bg-blue-500/20 border border-blue-400 text-blue-100 cursor-default'
                    : 'bg-[#1B253C] border border-transparent hover:bg-[#304167] text-zinc-300'
                }`}
                style={{ borderRadius: '10px' }}
              >
                <span className='text-xl leading-none'>👋</span>
                <span className='text-md pt-1 pr-1 font-medium'>
                  {waveCount === null ? '…' : waveCount}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className='flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none'>
          {/* How to Play - mobile: 1st, desktop: 2nd */}
          <button
            className='order-2 sm:order-2 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto px-6 py-3 bg-transparent border border-zinc-700 hover:border-zinc-500 text-gray-300 hover:text-gray-100 font-semibold text-sm rounded-xl sm:border-0 sm:p-1 sm:-mt-1 sm:text-zinc-400 sm:hover:text-zinc-200 sm:font-normal sm:underline'
            onClick={() => {
              setShowHelp(true);
              if (
                IS_PROD &&
                !eventFiredThisSession('[Help] Opened how to Play')
              )
                sendFeedback('custom', '`[Help]` Opened How To Play');
            }}
          >
            <QuestionMarkCircleIcon className='h-5 w-5' />
            How to Play
          </button>

          {/* Main CTA - Random Challenge */}
          <div className='order-1 sm:order-1 relative flex items-stretch w-full sm:w-auto'>
            <button
              className={`flex items-center justify-center gap-2.5 flex-1 sm:flex-initial px-7 py-4 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-base transition-colors border border-blue-500${allComplete ? '' : ' border-r-0'}`}
              style={{
                borderRadius: allComplete ? '0.75rem' : '0.75rem 0 0 0.75rem',
                boxShadow: 'inset -10px 0 10px -5px rgba(0, 0, 0, 0.13)',
              }}
              onClick={() => {
                const forceAll = randomMode === 'all';
                const { date, clear } = getRandomDate(forceAll);
                if (clear) {
                  localStorage.removeItem(`steam-detective-state-${date}`);
                }
                window.location.href = `/d/${date}`;
              }}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                viewBox='0,0,256,256'
              >
                <g fill='currentColor' fillRule='nonzero'>
                  <g transform='scale(5.33333,5.33333)'>
                    <path d='M40.018,11.05l-11.686,-6.017c-0.001,0 -0.002,-0.001 -0.003,-0.001c-2.711,-1.39 -5.948,-1.388 -8.661,0.001l-11.686,6.017c-1.839,0.947 -2.982,2.82 -2.982,4.889v16.121c0,2.069 1.143,3.943 2.982,4.89l11.688,6.018c1.354,0.694 2.842,1.041 4.328,1.041c1.488,0 2.976,-0.347 4.333,-1.042l11.686,-6.017c1.84,-0.947 2.982,-2.82 2.982,-4.89v-16.121c0.001,-2.069 -1.142,-3.942 -2.981,-4.889zM24,11c1.381,0 2.5,0.672 2.5,1.5c0,0.828 -1.119,1.5 -2.5,1.5c-1.381,0 -2.5,-0.672 -2.5,-1.5c0,-0.828 1.119,-1.5 2.5,-1.5zM9.5,25c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM13.5,31c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM17.5,37c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM31.5,35c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM36.5,26c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM39.138,16.857l-10.832,5.089c-0.884,0.46 -1.834,0.753 -2.806,0.908v16.632c0,0.829 -0.672,1.5 -1.5,1.5c-0.828,0 -1.5,-0.671 -1.5,-1.5v-16.637c-0.984,-0.159 -1.952,-0.458 -2.859,-0.93l-10.779,-5.062c-0.75,-0.352 -1.072,-1.246 -0.72,-1.995c0.352,-0.751 1.246,-1.073 1.995,-0.72l10.832,5.089c1.918,0.995 4.144,0.993 6.007,0.026l10.886,-5.115c0.749,-0.353 1.643,-0.03 1.995,0.72c0.353,0.75 0.031,1.643 -0.719,1.995z' />
                  </g>
                </g>
              </svg>
              Random Challenge
            </button>
            {!allComplete && (
              <div className='relative flex'>
                <button
                  className='flex items-center justify-center px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border border-blue-500 transition-colors text-white'
                  style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
                  onClick={() => setShowRandomMenu((m) => !m)}
                  aria-label='Random mode settings'
                >
                  <Cog6ToothIcon className='h-5 w-5' />
                </button>
                {showRandomMenu && (
                  <>
                    <div
                      className='fixed inset-0 z-10'
                      onClick={() => setShowRandomMenu(false)}
                    />
                    <div className='absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 py-1'>
                      <p className='px-4 pt-2 pb-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider'>
                        Random mode
                      </p>
                      {(['unplayed', 'all'] as const).map((mode) => (
                        <button
                          key={mode}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                            randomMode === mode
                              ? 'text-white'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                          onClick={() => {
                            setRandomMode(mode);
                            localStorage.setItem(
                              'steam-detective-random-mode',
                              mode,
                            );
                            setShowRandomMenu(false);
                          }}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              randomMode === mode
                                ? 'border-blue-500'
                                : 'border-zinc-600'
                            }`}
                          >
                            {randomMode === mode && (
                              <span className='w-2 h-2 rounded-full bg-blue-500' />
                            )}
                          </span>
                          {mode === 'unplayed'
                            ? 'Unplayed challenges only'
                            : 'All challenges'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Browse | Pick Date | My Stats*/}
          <div className='order-3 sm:order-3 flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-0 sm:mt-5'>
            {/* Pick a Challenge Date - mobile: 1st, desktop: 2nd */}
            <button
              className='sm:order-2 flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-zinc-700 hover:border-zinc-500 text-gray-300 hover:text-gray-100 font-semibold text-sm rounded-xl transition-colors w-full sm:w-auto'
              onClick={() => setShowDatePicker(true)}
            >
              <CalendarDaysIcon className='h-5 w-5' />
              Pick a Challenge Date
            </button>
            {/* Browse Challenges - mobile: 2nd, desktop: 1st */}
            <a
              href='/archives'
              className='sm:order-1 flex items-center justify-center gap-2 px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-gray-300 hover:text-gray-100 font-semibold text-sm rounded-xl transition-colors w-full sm:w-[12.375rem]'
            >
              <ArchiveBoxIcon className='h-5 w-5' />
              Browse Challenges
            </a>
            <button
              className='sm:order-3 flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-zinc-700 hover:border-zinc-500 text-gray-300 hover:text-gray-100 font-semibold text-sm rounded-xl transition-colors w-full sm:w-[12.375rem]'
              onClick={() => {
                setShowStats(true);
                if (
                  IS_PROD &&
                  !eventFiredThisSession('[Event] Opened My Stats Modal')
                )
                  sendFeedback('custom', '`[Event]` Opened My Stats Modal');
              }}
            >
              <ChartBarIcon className='h-5 w-5' />
              My Stats
            </button>
          </div>
        </div>
      </main>

      <div className='px-5 [&>footer]:pb-8 [&>footer]:text-center'>
        <SteamDetectiveFooter />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <PuzzleDatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
};
