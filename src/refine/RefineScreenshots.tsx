import type { SteamGame } from '../types';

interface RefineScreenshotsProps {
  game: SteamGame;
  isComplete: boolean;
  onUpdate: (patch: Partial<SteamGame>) => void;
}

export const RefineScreenshots: React.FC<RefineScreenshotsProps> = ({
  game,
  isComplete,
  onUpdate,
}) => {
  const renderScreenshot = (url: string, label: string) => (
    <div
      className='relative overflow-hidden rounded-lg select-none'
      style={{ aspectRatio: '16/9' }}
    >
      <img
        src={url}
        alt={label}
        className='w-full h-full object-cover block'
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Blur overlay */}
      {game.blurScreenshotQuarter && !isComplete && (
        <div
          className='border-[6px] border-dashed border-white p-4 absolute inset-x-0 pointer-events-none flex items-center justify-center'
          style={{
            [game.blurScreenshotQuarter === 'top' ? 'top' : 'bottom']: 0,
            height: '25%',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            className='text-white font-bold text-xl sm:text-4xl tracking-widest'
            style={{
              textShadow:
                '0 0 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            REDACTED LOGO
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className='px-4 py-3 space-y-3'>
      {/* Secondary screenshot (displayed first / above) */}
      {game.secondaryScreenshot && (
        <>
          <div className='text-gray-400 text-xs uppercase'>
            Secondary Screenshot:
          </div>
          {renderScreenshot(game.secondaryScreenshot, 'Secondary screenshot')}
          <input
            type='text'
            value={game.secondaryScreenshot}
            onChange={(e) => onUpdate({ secondaryScreenshot: e.target.value })}
            className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
          />
        </>
      )}

      {/* Primary screenshot */}
      <div className='text-gray-400 text-xs uppercase'>Primary Screenshot:</div>
      {renderScreenshot(game.primaryScreenshot, 'Primary screenshot')}
      <input
        type='text'
        value={game.primaryScreenshot}
        onChange={(e) => onUpdate({ primaryScreenshot: e.target.value })}
        className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
      />

      {/* Blur screenshot quarter dropdown */}
      <div className='flex items-center gap-2 pt-1'>
        <span className='text-xs text-gray-400'>Blur screenshot quarter:</span>
        <select
          value={game.blurScreenshotQuarter ?? ''}
          onChange={(e) => {
            const val = e.target.value as 'top' | 'bottom' | '';
            onUpdate({ blurScreenshotQuarter: val || undefined });
          }}
          className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm'
        >
          <option value=''>None</option>
          <option value='top'>Top</option>
          <option value='bottom'>Bottom</option>
        </select>
      </div>
    </div>
  );
};
