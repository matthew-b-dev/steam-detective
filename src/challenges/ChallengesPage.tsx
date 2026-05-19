import { useState, useMemo, useEffect } from 'react';
import { HomeIcon } from '@heroicons/react/24/solid';
import { sendFeedback } from '../lib/supabaseClient';
import { isLocalhost, eventFiredThisSession } from '../utils';
import challengesData from '../challenges_data.generated.json';

type TabKey = 'most_difficult' | 'least_difficult' | 'most_played';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'most_difficult', label: 'Most Difficult' },
  { key: 'least_difficult', label: 'Least Difficult' },
  { key: 'most_played', label: 'Most Played' },
];

const PAGE_SIZE = 10;

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCompletedDates = (): Set<string> => {
  const completed = new Set<string>();
  const prefix = 'steam-detective-state-';
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dateStr = key.slice(prefix.length);
        const state = JSON.parse(localStorage.getItem(key) ?? '{}');
        if (state.allCasesComplete === true) {
          completed.add(dateStr);
        }
      }
    }
  } catch {
    // localStorage unavailable
  }
  return completed;
};

export const ChallengesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('most_difficult');
  const [pages, setPages] = useState<Record<TabKey, number>>({
    most_difficult: 1,
    least_difficult: 1,
    most_played: 1,
  });

  const [hidePlayedDates, setHidePlayedDates] = useState(false);

  const IS_PROD = !isLocalhost();

  useEffect(() => {
    if (IS_PROD && !eventFiredThisSession('[Event] Visited Archives Page')) {
      sendFeedback('custom', '`[Event]` Visited Archives Page');
    }
  }, [IS_PROD]);

  const completedDates = useMemo(() => getCompletedDates(), []);

  const allDates: string[] = challengesData[activeTab] ?? [];
  const dates = hidePlayedDates
    ? allDates.filter((d) => !completedDates.has(d))
    : allDates;
  const currentPage = pages[activeTab];
  const totalPages = Math.max(1, Math.ceil(dates.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const visibleDates = dates.slice(startIdx, startIdx + PAGE_SIZE);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const handlePageChange = (delta: number) => {
    setPages((prev) => ({
      ...prev,
      [activeTab]: Math.min(totalPages, Math.max(1, prev[activeTab] + delta)),
    }));
  };

  const handleHidePlayedToggle = () => {
    setHidePlayedDates((prev) => !prev);
    setPages({ most_difficult: 1, least_difficult: 1, most_played: 1 });
  };

  const noData = allDates.length === 0;
  const allPlayed =
    hidePlayedDates && dates.length === 0 && allDates.length > 0;

  const playCounts: Record<string, number> =
    (challengesData as { play_counts?: Record<string, number> }).play_counts ??
    {};

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100'>
      <div className='mx-auto max-w-2xl'>
        {/* Header — matches App.tsx logo style */}
        <div className='border-b border-zinc-800 px-4 py-3 sm:px-6'>
          <div className='relative flex items-start justify-between gap-2'>
            <div className='flex flex-col items-start'>
              <h1
                className='text-lg sm:text-3xl font-black mb-[-3px]'
                style={{
                  fontFamily: 'Playfair Display, serif',
                  letterSpacing: '-0.04em',
                }}
              >
                <span className='text-gray-300'>Steam</span>
                Detective
                <span
                  style={{ fontFamily: 'serif', letterSpacing: '-0.03em' }}
                  className='text-gray-400'
                >
                  <span>.</span>
                  <span className='italic text-yellow-500'>wtf</span>
                </span>
              </h1>
              <p
                className='text-gray-400 text-sm block pl-[2px] relative top-[-3px]'
                style={{ letterSpacing: '-0.04em' }}
              >
                <span className='underline decoration-2 decoration-zinc-700'>
                  Case File Archives
                </span>
              </p>
            </div>
            <div className='flex items-center mt-2'>
              <a
                href='/'
                className='text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 rounded border border-zinc-700 px-3 py-1'
              >
                <HomeIcon className='h-6 w-6 sm:h-4 sm:w-4' />
                <span className='text-sm font-semibold relative top-[-1px]'>
                  Home
                </span>
              </a>
            </div>
          </div>
          {challengesData.generated_at && (
            <p className='mt-1 text-xs text-zinc-600'>
              Updated{' '}
              {new Date(challengesData.generated_at).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                },
              )}
            </p>
          )}
        </div>

        {/* Hide Played toggle */}
        <div className='border-b border-zinc-800 px-4 py-2.5 sm:px-6'>
          <label className='inline-flex cursor-pointer items-center gap-2.5 select-none'>
            <div className='relative'>
              <input
                type='checkbox'
                className='sr-only'
                checked={hidePlayedDates}
                onChange={handleHidePlayedToggle}
              />
              <div
                className={[
                  'h-5 w-9 rounded-full transition-colors',
                  hidePlayedDates ? 'bg-blue-600' : 'bg-zinc-700',
                ].join(' ')}
              />
              <div
                className={[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  hidePlayedDates ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </div>
            <span className='text-sm text-zinc-300'>Hide Played Dates</span>
          </label>
        </div>

        {/* Tab bar */}
        <div className='flex border-b border-zinc-800'>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={[
                'flex-1 rounded-none px-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-zinc-400 hover:text-zinc-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className='px-2 py-4 sm:px-4'>
          {noData ? (
            <div className='py-16 text-center text-zinc-500'>
              <p className='text-sm'>No data available yet.</p>
              <p className='mt-1 text-xs'>
                Run{' '}
                <code className='rounded bg-zinc-800 px-1 py-0.5 text-zinc-300'>
                  npm run generate-challenges
                </code>{' '}
                to generate rankings.
              </p>
            </div>
          ) : allPlayed ? (
            <div className='py-16 text-center'>
              <p className='text-lg font-semibold text-green-400'>
                🎉 You've played every daily challenge!
              </p>
              <p className='mt-2 text-sm text-zinc-400'>
                Turn off the filter to browse all dates.
              </p>
              <div className='mt-6 flex justify-center'>
                <label className='inline-flex cursor-pointer items-center gap-2.5 select-none'>
                  <div className='relative'>
                    <input
                      type='checkbox'
                      className='sr-only'
                      checked={hidePlayedDates}
                      onChange={handleHidePlayedToggle}
                    />
                    <div className='h-5 w-9 rounded-full bg-blue-600 transition-colors' />
                    <div className='absolute top-0.5 h-4 w-4 translate-x-4 rounded-full bg-white shadow transition-transform' />
                  </div>
                  <span className='text-sm text-zinc-300'>
                    Hide Played Dates
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <>
              <table className='w-full border-collapse text-sm'>
                <thead>
                  <tr className='border-b border-zinc-800'>
                    <th className='pb-2 pl-2 text-left font-semibold text-zinc-400 sm:pl-3'>
                      #
                    </th>
                    <th className='pb-2 pl-2 text-left font-semibold text-zinc-400 sm:pl-3'>
                      Date
                    </th>
                    {activeTab === 'most_played' && (
                      <th className='pb-2 pl-2 text-left font-semibold text-zinc-400 sm:pl-3'>
                        Plays
                      </th>
                    )}
                    <th className='pb-2 pr-2 text-center font-semibold text-zinc-400 sm:pr-3'>
                      Played
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDates.map((date, idx) => {
                    const rank = startIdx + idx + 1;
                    const played = completedDates.has(date);
                    return (
                      <tr
                        key={date}
                        className={[
                          'border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/40',
                          idx % 2 === 0 ? 'bg-zinc-900/30' : '',
                        ].join(' ')}
                      >
                        <td className='w-10 py-1.5 pl-2 text-xs text-zinc-600 sm:pl-3'>
                          {rank}
                        </td>
                        <td className='py-1.5 pl-2 sm:pl-3'>
                          <a
                            href={`/d/${date}`}
                            className='underline decoration-dashed decoration-1 text-blue-400 hover:text-blue-300'
                          >
                            {formatDate(date)}
                          </a>
                        </td>
                        {activeTab === 'most_played' && (
                          <td className='py-1.5 pl-2 tabular-nums text-zinc-300 sm:pl-3'>
                            {playCounts[date] ?? '—'}
                          </td>
                        )}
                        <td className='py-1.5 pr-2 text-center sm:pr-3'>
                          {played ? (
                            <span
                              className='inline-flex items-center justify-center text-green-400'
                              aria-label='Played'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                aria-hidden='true'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className='inline-flex items-center justify-center text-zinc-700'
                              aria-label='Not played'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                aria-hidden='true'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M10 18a8 8 0 100-16 8 8 0 000 16z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {Array.from({
                    length: Math.max(0, PAGE_SIZE - visibleDates.length),
                  }).map((_, i) => (
                    <tr key={`pad-${i}`} aria-hidden='true'>
                      <td className='py-1.5 pl-2 sm:pl-3'>
                        <span className='invisible inline-block h-5 w-px' />
                      </td>
                      <td className='py-1.5 pl-2 sm:pl-3' />
                      {activeTab === 'most_played' && (
                        <td className='py-1.5 pl-2 sm:pl-3' />
                      )}
                      <td className='py-1.5 pr-2 sm:pr-3' />
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between px-1'>
                  <button
                    onClick={() => handlePageChange(-1)}
                    disabled={currentPage <= 1}
                    className='rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'
                  >
                    ← Prev
                  </button>
                  <span className='text-sm text-zinc-400'>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage >= totalPages}
                    className='rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
