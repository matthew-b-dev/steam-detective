import { useState } from 'react';

interface RefineNavbarProps {
  gameName: string;
  currentIndex: number;
  totalGames: number;
  mode: 'refine' | 'choose';
  onModeToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSearch: (name: string) => void;
  onExport: () => void;
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
      <div className='flex-1 text-center text-xs text-gray-400 truncate min-w-0'>
        <span className='text-gray-500'>
          [{currentIndex + 1}/{totalGames}]
        </span>{' '}
        <span className='text-gray-300'>{gameName}</span>
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
