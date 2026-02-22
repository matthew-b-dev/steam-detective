import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../demos';

// Build a set of all game names that have been used in any demo day
const DEMO_DAY_GAME_NAMES: Set<string> = new Set(
  Object.values(STEAM_DETECTIVE_DEMO_DAYS).flatMap((day) =>
    Object.values(day).filter((name): name is string => Boolean(name)),
  ),
);

interface RefineNavbarProps {
  gameName: string;
  currentIndex: number;
  totalGames: number;
  mode: 'refine' | 'choose';
  onModeToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  // eslint-disable-next-line no-unused-vars
  onSearch: (name: string) => void;
  onExport: () => void;
  onRandom: () => void;
}

export const RefineNavbar: React.FC<RefineNavbarProps> = ({
  gameName,
  currentIndex,
  totalGames,
  mode,
  onModeToggle,
  onNext,
  onPrev,
  onSearch,
  onExport,
  onRandom,
}) => {
  const [searchText, setSearchText] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText.trim());
      setSearchText('');
    }
  };

  return (
    <nav className='sticky top-0 z-50 bg-[#171a21] border-b border-zinc-700 px-4 py-2 flex items-center gap-3 flex-wrap'>
      {/* Prev / Next */}
      <button
        onClick={onPrev}
        className='px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm disabled:opacity-40'
        disabled={currentIndex <= 0}
      >
        ← Prev
      </button>
      <button
        onClick={onNext}
        className='px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm disabled:opacity-40'
        disabled={currentIndex >= totalGames - 1}
      >
        Next →
      </button>

      {/* Mode Toggle */}
      <button
        onClick={onModeToggle}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          mode === 'refine'
            ? 'bg-blue-700 hover:bg-blue-600'
            : 'bg-purple-700 hover:bg-purple-600'
        }`}
      >
        {mode === 'refine' ? 'Refine Mode' : 'Choose Mode'}
      </button>

      {/* Current game name & index */}
      <div className='flex-1 text-center text-xs text-gray-400 min-w-0 flex items-center justify-center gap-1.5'>
        <span className='text-gray-500 shrink-0'>
          [{currentIndex + 1}/{totalGames}]
        </span>{' '}
        <span className='text-gray-300 truncate'>{gameName}</span>
        {DEMO_DAY_GAME_NAMES.has(gameName) && (
          <ExclamationTriangleIcon
            className='w-3.5 h-3.5 text-yellow-400 shrink-0'
            title='Used in a demo day'
          />
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className='flex gap-1'>
        <input
          type='text'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Jump to game…'
          className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-zinc-400'
        />
        <button
          type='submit'
          className='px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm'
        >
          Go
        </button>
      </form>

      {/* Random */}
      <button
        onClick={onRandom}
        className='px-3 py-1 bg-orange-700 hover:bg-orange-600 rounded text-sm font-semibold'
      >
        Random
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className='px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-sm font-semibold'
      >
        Export
      </button>
    </nav>
  );
};
