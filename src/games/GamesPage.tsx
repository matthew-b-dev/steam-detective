import { useState, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface Game {
  appId: string;
  name: string;
  count: number;
  used: boolean;
}

interface GamesPageProps {
  games: Game[];
}

const GAMES_PER_PAGE = 100;

export const GamesPage: React.FC<GamesPageProps> = ({ games }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyUnused, setShowOnlyUnused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter games
  const filteredGames = useMemo(() => {
    if (showOnlyUnused) {
      return games.filter((g) => !g.used);
    }
    return games;
  }, [games, showOnlyUnused]);

  // Paginate
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const startIdx = (currentPage - 1) * GAMES_PER_PAGE;
  const paginatedGames = filteredGames.slice(
    startIdx,
    startIdx + GAMES_PER_PAGE,
  );

  // Calculate stats
  const totalGames = games.length;
  const usedGames = games.filter((g) => g.used).length;
  const percentageUsed =
    totalGames > 0 ? ((usedGames / totalGames) * 100).toFixed(1) : '0';

  // Handle filter toggle
  const handleFilterToggle = () => {
    setShowOnlyUnused(!showOnlyUnused);
    setCurrentPage(1);
  };

  // Handle copy
  const handleCopy = (name: string, appId: string) => {
    navigator.clipboard.writeText(name);
    setCopiedId(appId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-white'>
      <div className='max-w-7xl mx-auto px-4 py-12'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>Steam Games Library</h1>
          <p className='text-gray-400'>
            Sorted by review count · {filteredGames.length} games shown
          </p>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-zinc-900 rounded-lg border border-zinc-800 p-4'>
            <div className='text-gray-400 text-sm mb-1'>Total Games</div>
            <div className='text-2xl font-bold text-white'>{totalGames}</div>
          </div>
          <div className='bg-zinc-900 rounded-lg border border-zinc-800 p-4'>
            <div className='text-gray-400 text-sm mb-1'>Demo Games</div>
            <div className='text-2xl font-bold text-emerald-400'>
              {usedGames}
            </div>
          </div>
          <div className='bg-zinc-900 rounded-lg border border-zinc-800 p-4'>
            <div className='text-gray-400 text-sm mb-1'>% Used as Demo</div>
            <div className='text-2xl font-bold text-blue-400'>
              {percentageUsed}%
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className='flex items-center gap-4 mb-8 p-4 bg-zinc-900 rounded-lg border border-zinc-800'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={showOnlyUnused}
              onChange={handleFilterToggle}
              className='w-4 h-4 rounded border-zinc-700 bg-zinc-800 cursor-pointer'
            />
            <span className='text-sm font-medium'>
              Show only unused games ({filteredGames.length})
            </span>
          </label>
          {showOnlyUnused && (
            <span className='ml-auto text-xs text-gray-500'>
              {games.filter((g) => !g.used).length} / {games.length} games
            </span>
          )}
        </div>

        {/* Games Table */}
        <div className='overflow-x-auto rounded-lg border border-zinc-800'>
          <table className='w-full'>
            <thead>
              <tr className='bg-zinc-900 border-b border-zinc-800'>
                <th className='px-4 py-3 text-left text-sm font-semibold text-gray-300'>
                  Game
                </th>
                <th className='px-4 py-3 text-right text-sm font-semibold text-gray-300 w-32'>
                  Reviews
                </th>
                <th className='px-4 py-3 text-center text-sm font-semibold text-gray-300 w-24'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedGames.map((game) => (
                <tr
                  key={game.appId}
                  className='border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors'
                >
                  {/* Game with Thumbnail */}
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      <a
                        href={`https://store.steampowered.com/app/${game.appId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex-shrink-0 block'
                      >
                        <img
                          src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appId}/header.jpg`}
                          alt={game.name}
                          className='w-24 h-14 object-cover rounded hover:opacity-80 transition-opacity'
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 60%22%3E%3Crect fill=%22%233f3f46%22 width=%22100%22 height=%2260%22/%3E%3C/svg%3E';
                          }}
                        />
                      </a>
                      <div className='flex-1 min-w-0'>
                        <a
                          href={`https://store.steampowered.com/app/${game.appId}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-400 hover:text-blue-300 font-medium truncate block'
                        >
                          {game.name}
                        </a>
                        <div className='text-xs text-gray-500 mt-1'>
                          App ID: {game.appId}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(game.name, game.appId)}
                        className='flex-shrink-0 p-2 hover:bg-zinc-800 rounded transition-colors'
                        title='Copy game name'
                      >
                        <DocumentDuplicateIcon
                          className={`w-4 h-4 transition-colors ${
                            copiedId === game.appId
                              ? 'text-green-400'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        />
                      </button>
                    </div>
                  </td>

                  {/* Review Count */}
                  <td className='px-4 py-3 text-right'>
                    <span className='text-sm font-semibold text-gray-300'>
                      {game.count.toLocaleString()}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className='px-4 py-3 text-center'>
                    {game.used && (
                      <span className='inline-block px-2 py-1 bg-emerald-900 text-emerald-200 text-xs font-medium rounded'>
                        Used
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-gray-400'>
            Page {currentPage} of {totalPages} · Showing {startIdx + 1}-
            {Math.min(startIdx + GAMES_PER_PAGE, filteredGames.length)} of{' '}
            {filteredGames.length}
          </div>
          <div className='flex gap-2'>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className='p-2 rounded border border-zinc-700 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Previous page'
            >
              <ChevronLeftIcon className='w-5 h-5' />
            </button>
            <div className='flex items-center gap-2 px-3'>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded text-sm transition-colors ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-zinc-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className='p-2 rounded border border-zinc-700 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Next page'
            >
              <ChevronRightIcon className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
