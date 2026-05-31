import { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { computeAllComplete, getRandomDate } from '../utils';

interface RandomChallengeButtonProps {
  size?: 'hero' | 'compact';
}

const DiceIcon = ({ className }: { className: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className={className}
    viewBox='0,0,256,256'
  >
    <g fill='currentColor' fillRule='nonzero'>
      <g transform='scale(5.33333,5.33333)'>
        <path d='M40.018,11.05l-11.686,-6.017c-0.001,0 -0.002,-0.001 -0.003,-0.001c-2.711,-1.39 -5.948,-1.388 -8.661,0.001l-11.686,6.017c-1.839,0.947 -2.982,2.82 -2.982,4.889v16.121c0,2.069 1.143,3.943 2.982,4.89l11.688,6.018c1.354,0.694 2.842,1.041 4.328,1.041c1.488,0 2.976,-0.347 4.333,-1.042l11.686,-6.017c1.84,-0.947 2.982,-2.82 2.982,-4.89v-16.121c0.001,-2.069 -1.142,-3.942 -2.981,-4.889zM24,11c1.381,0 2.5,0.672 2.5,1.5c0,0.828 -1.119,1.5 -2.5,1.5c-1.381,0 -2.5,-0.672 -2.5,-1.5c0,-0.828 1.119,-1.5 2.5,-1.5zM9.5,25c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM13.5,31c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM17.5,37c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM31.5,35c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM36.5,26c-0.828,0 -1.5,-1.119 -1.5,-2.5c0,-1.381 0.672,-2.5 1.5,-2.5c0.828,0 1.5,1.119 1.5,2.5c0,1.381 -0.672,2.5 -1.5,2.5zM39.138,16.857l-10.832,5.089c-0.884,0.46 -1.834,0.753 -2.806,0.908v16.632c0,0.829 -0.672,1.5 -1.5,1.5c-0.828,0 -1.5,-0.671 -1.5,-1.5v-16.637c-0.984,-0.159 -1.952,-0.458 -2.859,-0.93l-10.779,-5.062c-0.75,-0.352 -1.072,-1.246 -0.72,-1.995c0.352,-0.751 1.246,-1.073 1.995,-0.72l10.832,5.089c1.918,0.995 4.144,0.993 6.007,0.026l10.886,-5.115c0.749,-0.353 1.643,-0.03 1.995,0.72c0.353,0.75 0.031,1.643 -0.719,1.995z' />
      </g>
    </g>
  </svg>
);

export const RandomChallengeButton = ({
  size = 'hero',
}: RandomChallengeButtonProps) => {
  const [allComplete] = useState(() => computeAllComplete());
  const [randomMode, setRandomMode] = useState<'unplayed' | 'all'>(() => {
    const stored = localStorage.getItem('steam-detective-random-mode');
    if (stored === 'unplayed' || stored === 'all') return stored;
    return allComplete ? 'all' : 'unplayed';
  });
  const [showRandomMenu, setShowRandomMenu] = useState(false);

  const isHero = size === 'hero';
  const radius = isHero ? '0.75rem' : '0.5rem';

  const handleClick = () => {
    const { date, clear } = getRandomDate(randomMode === 'all');
    if (clear) localStorage.removeItem(`steam-detective-state-${date}`);
    window.location.href = `/d/${date}`;
  };

  return (
    <div className='relative flex items-stretch'>
      <button
        className={`flex items-center justify-center bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white transition-colors border border-blue-500 border-r-0 ${
          isHero
            ? 'gap-2.5 flex-1 sm:flex-initial px-7 py-4 font-bold text-base'
            : 'gap-1.5 px-4 py-2 font-semibold text-sm'
        }`}
        style={{
          borderRadius: `${radius} 0 0 ${radius}`,
          boxShadow: isHero
            ? 'inset -10px 0 10px -5px rgba(0, 0, 0, 0.13)'
            : 'inset -5px 0 5px -3px rgba(0, 0, 0, 0.13)',
        }}
        onClick={handleClick}
      >
        <DiceIcon className={isHero ? 'h-6 w-6' : 'h-4 w-4'} />
        Random Challenge
      </button>
      <div className='relative flex'>
        <button
          className={`flex items-center justify-center bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border border-blue-500 transition-colors text-white ${isHero ? 'px-3' : 'px-2'}`}
          style={{ borderRadius: `0 ${radius} ${radius} 0` }}
          onClick={() => setShowRandomMenu((m) => !m)}
          aria-label='Random mode settings'
        >
          <Cog6ToothIcon className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
        {showRandomMenu && (
          <>
            <div
              className='fixed inset-0 z-10'
              onClick={() => setShowRandomMenu(false)}
            />
            <div
              className={`absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 shadow-2xl z-20 py-1 ${isHero ? 'w-56 rounded-xl' : 'w-48 rounded-lg'}`}
            >
              <p
                className={`pt-2 pb-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider ${isHero ? 'px-4' : 'px-3'}`}
              >
                Random mode
              </p>
              {(['unplayed', 'all'] as const).map((mode) => {
                const isDisabled = allComplete && mode === 'unplayed';
                const isSelected = allComplete
                  ? mode === 'all'
                  : randomMode === mode;
                return (
                  <div key={mode}>
                    <button
                      disabled={isDisabled}
                      className={`w-full flex items-center transition-colors whitespace-nowrap ${
                        isHero
                          ? 'text-sm py-2.5 px-4 gap-3'
                          : 'text-xs py-2 px-3 gap-2'
                      } ${
                        isDisabled
                          ? 'text-zinc-600 cursor-not-allowed'
                          : isSelected
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      onClick={() => {
                        if (isDisabled) return;
                        setRandomMode(mode);
                        localStorage.setItem(
                          'steam-detective-random-mode',
                          mode,
                        );
                        setShowRandomMenu(false);
                      }}
                    >
                      <span
                        className={`rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isHero ? 'w-4 h-4' : 'w-3 h-3'
                        } ${
                          isSelected ? 'border-blue-500' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className={`rounded-full bg-blue-500 ${isHero ? 'w-2 h-2' : 'w-1.5 h-1.5'}`}
                          />
                        )}
                      </span>
                      {mode === 'unplayed'
                        ? 'Unplayed challenges only'
                        : 'All challenges'}
                    </button>
                    {isDisabled && (
                      <p
                        className={`text-center text-zinc-400 italic ${isHero ? 'text-xs py-1.5' : 'text-xs py-1'}`}
                      >
                        (You've played all of them!)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
