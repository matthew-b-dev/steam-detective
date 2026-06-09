import { useState, useEffect, useMemo } from 'react';
import {
  QuestionMarkCircleIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import HelpModal from './components/HelpModal';
import StatsModal from './components/StatsModal';
import PuzzleDatePicker from './components/PuzzleDatePicker';
import SteamDetectiveFooter from './components/SteamDetectiveFooter';
import { RandomChallengeButton } from './components/RandomChallengeButton';
import { eventFiredThisSession, isLocalhost } from './utils';
import {
  sendFeedback,
  fetchFeedbackCounts,
  supabase,
} from './lib/supabaseClient';

const IS_PROD = !isLocalhost();

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

export const LandingPage = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const hasRetired = useMemo(() => {
    return new Date() > BANNER_END_DATE;
  }, []);

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
          which were released daily from February to June 2026.
        </p>

        {/* Farewell banner */}
        {!hasRetired && (
          <div className='w-full max-w-2xl text-left text-xs sm:text-sm rounded border border-blue-500/60 mb-6 bg-blue-900/20 px-3 py-3 text-blue-100'>
            <p className='leading-relaxed'>
              This daily trivia run has come to an end after 120 consecutive
              days. The site will stay up indefinitely (it's hosted for free).
              Thank you so much for playing along and sharing awesome feedback
              along the way!
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
        <div
          className={`flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none ${hasRetired ? 'mt-6' : ''}`}
        >
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
          <div className='order-1 sm:order-1 w-full sm:w-auto'>
            <RandomChallengeButton size='hero' />
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
