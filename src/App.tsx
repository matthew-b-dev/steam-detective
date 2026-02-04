import { useEffect, useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/16/solid';
import './App.css';
import SteamDetective from './SteamDetective';
import Subtitle from './components/Subtitle';
import HelpModal from './components/HelpModal';
import { getPuzzleDate } from './utils';
import calendarIcon from './assets/calendar-48.png';

// Preload images hook
const useImagePreloader = (src: string) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [src]);

  return loaded;
};

function App() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const puzzleDate = getPuzzleDate();
  const calendarIconLoaded = useImagePreloader(calendarIcon);

  const handleResetPuzzle = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    localStorage.removeItem('steam-detective-state');
    window.location.reload();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className='min-h-screen w-full flex flex-col diagonal-pattern-bg overflow-x-hidden'>
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
                  <span className='text-gray-300'>Steam</span>Detective
                </h1>
                <p
                  className='text-gray-400 text-sm hidden sm:block relative top-[-8px] left-[-4px]'
                  style={{
                    letterSpacing: '-0.04em',
                  }}
                >
                  <span className='underline decoration-2 decoration-zinc-700'>
                    A daily <i>Steam game</i> guessing puzzle
                  </span>
                </p>
                <Subtitle />
              </div>
              <div className='flex items-center gap-2 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2'>
                <div
                  className={`flex items-center sm:hidden ${calendarIconLoaded ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img
                    src={calendarIcon}
                    className='w-5 h-5 mr-1.5'
                    alt='Calendar'
                  />
                  <span className='text-sm font-semibold'>{puzzleDate}</span>
                </div>
                <button
                  className='text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 px-2 bg-none sm:border-1 sm:border-gray-700 sm:px-3 sm:py-1'
                  onClick={() => setShowHelp(true)}
                >
                  <QuestionMarkCircleIcon className='h-6 w-6 sm:h-4 sm:w-4' />
                  <span className='text-sm font-semibold hidden sm:inline relative top-[-1px]'>
                    How to play
                  </span>
                </button>
              </div>
            </div>
            <div className='hidden sm:flex justify-center items-center mt-4'>
              <img src={calendarIcon} className='w-6 h-6 mr-2' alt='Calendar' />
              <span className='text-lg font-semibold'>{puzzleDate}</span>
            </div>
          </div>
          <SteamDetective onResetPuzzle={handleResetPuzzle} />
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-zinc-800 p-6 rounded-lg shadow-xl max-w-md'>
            <h2 className='text-xl font-bold mb-4'>Reset Today's Puzzle?</h2>
            <p className='mb-6 text-gray-300'>
              This will clear your progress for today's puzzle. Are you sure?
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
    </div>
  );
}

export default App;
