import { useEffect, useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/16/solid';
import './App.css';
import SteamDetective from './SteamDetective';
import HelpModal from './components/HelpModal';
import PuzzleDatePicker from './components/PuzzleDatePicker';
import { config } from './config';
import {
  getUtcDateString,
  clearPuzzleState,
  getRealUtcDateString,
  isDateSelectable,
  isLocalhost,
} from './utils';
import { getDateFromRoute } from './demos';
import analyzeIcon from './assets/analyze-48.png';
import blueGamesFolderIcon from './assets/games-folder-48.png';
import greenGamesFolderIcon from './assets/green-games-folder-48.png';
import redGamesFolderIcon from './assets/red-games-folder-48.png';
import purpleGamesFolderIcon from './assets/purple-games-folder-48.png';

// Preload all asset images when app mounts
const usePreloadAllAssets = () => {
  useEffect(() => {
    const imagesToPreload = [
      analyzeIcon,
      blueGamesFolderIcon,
      greenGamesFolderIcon,
      redGamesFolderIcon,
      purpleGamesFolderIcon,
    ];

    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
};

function App() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentPuzzleDateStr = getUtcDateString();

  // Preload all assets when app mounts
  usePreloadAllAssets();

  // Check if URL has /d/{date} matching today, and if so, redirect to /
  // Also redirect if the date is not within the selectable range
  useEffect(() => {
    const routeDate = getDateFromRoute();
    const realToday = getRealUtcDateString();

    if (routeDate) {
      // If route date matches today or is not selectable, redirect to /
      // On localhost, skip the selectable check to allow future dates
      if (
        routeDate === realToday ||
        (!isLocalhost() && !isDateSelectable(routeDate))
      ) {
        // Force a full page reload to properly load today's puzzle state
        window.location.href = '/';
      }
    }
  }, []);

  const handleResetPuzzle = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    const currentPuzzleDate = getUtcDateString();
    clearPuzzleState(currentPuzzleDate);
    window.location.reload();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleDateSelect = (dateStr: string) => {
    // If they clicked Today
    if (dateStr === getRealUtcDateString()) {
      window.location.href = `/`;
    } else {
      // Navigate to the selected date
      window.location.href = `/d/${dateStr}`;
    }
  };

  return (
    <div className='min-h-screen w-full flex flex-col overflow-x-hidden'>
      <div className='flex flex-col items-center w-full px-1 sm:px-4 flex-1'>
        <div className='w-full max-w-[750px] p-2 sm:p-6'>
          <div className='relative mb-2 sm:mb-6'>
            <div className='flex items-start justify-between sm:justify-center gap-2 sm:gap-0'>
              <div className='flex flex-col items-start sm:items-center flex-1 sm:flex-initial'>
                <h1
                  className='text-lg sm:text-4xl mb-[-5px] sm:py-0 sm:mb-0 font-black relative right-[-2px] sm:right-[0px]'
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    letterSpacing: '-0.04em',
                  }}
                >
                  <span className='text-gray-300'>Steam</span>
                  Detective
                  <span
                    style={{
                      fontFamily: 'serif',
                      letterSpacing: '-0.03em',
                    }}
                    className='text-gray-400 sm:text-gray-500'
                  >
                    <span>.</span>
                    <span className='italic text-yellow-500'>wtf</span>
                  </span>
                </h1>
                <p
                  className='text-gray-400 text-sm block pl-[2px] sm:pl-0 relative top-[-4px] sm:top-[-8px]'
                  style={{
                    letterSpacing: '-0.04em',
                  }}
                >
                  <span className='underline decoration-2 decoration-zinc-700'>
                    A daily{' '}
                    <span className='hidden sm:inline'>
                      <i>Steam game</i>
                    </span>{' '}
                    trivia puzzle
                  </span>
                </p>
              </div>
              <div className='flex items-center gap-2 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2'>
                <button
                  className='text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 px-2 bg-transparent sm:border-1 sm:border-zinc-700 sm:px-3 sm:py-1'
                  onClick={() => setShowHelp(true)}
                >
                  <QuestionMarkCircleIcon className='h-6 w-6 sm:h-4 sm:w-4' />
                  <span className='text-sm font-semibold hidden sm:inline relative top-[-1px]'>
                    How to play
                  </span>
                </button>
              </div>
            </div>
          </div>
          {config.showMaintenanceAlert ? (
            <div className='bg-yellow-500 text-black px-4 py-3 rounded-lg font-semibold text-center'>
              The hosting provider is currently having issues. It will be up
              shortly!
            </div>
          ) : (
            <SteamDetective
              onResetPuzzle={handleResetPuzzle}
              onDatePickerClick={() => setShowDatePicker(true)}
            />
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-zinc-800 p-6 rounded-lg shadow-xl max-w-md'>
            <h2 className='text-xl font-bold mb-4'>Reset this Puzzle?</h2>
            <p className='mb-6 text-gray-300'>
              This will clear your progress for this puzzle. Are you sure?
            </p>
            <div className='flex gap-4 justify-end'>
              <button
                onClick={cancelReset}
                className='px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition'
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition'
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <PuzzleDatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        currentPuzzleDate={currentPuzzleDateStr}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}

export default App;
