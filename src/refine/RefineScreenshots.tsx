import { useState } from 'react';
import type { SteamGame } from '../types';
import {
  getScreenshotFocusStyle,
  getFocusScale,
  DEFAULT_SCREENSHOT_ZOOM,
} from '../components/SteamDetective/utils';

interface RefineScreenshotsProps {
  game: SteamGame;
  isComplete: boolean;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

export const RefineScreenshots: React.FC<RefineScreenshotsProps> = ({
  game,
  isComplete,
  onUpdate,
}) => {
  // Local state for focus point inputs so we can edit without committing on every keystroke
  const [focusX, setFocusX] = useState<string>(
    game.screenshotFocusPoint != null
      ? String(game.screenshotFocusPoint[0])
      : '',
  );
  const [focusY, setFocusY] = useState<string>(
    game.screenshotFocusPoint != null
      ? String(game.screenshotFocusPoint[1])
      : '',
  );
  const [focusZoom, setFocusZoom] = useState<string>(
    game.screenshotFocusPoint != null
      ? String(game.screenshotFocusPoint[2] ?? DEFAULT_SCREENSHOT_ZOOM)
      : String(DEFAULT_SCREENSHOT_ZOOM),
  );

  const commitFocusPoint = (xStr: string, yStr: string, zoomStr: string) => {
    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    const z = parseFloat(zoomStr);
    if (!isNaN(x) && !isNaN(y)) {
      onUpdate({
        screenshotFocusPoint: [x, y, isNaN(z) ? DEFAULT_SCREENSHOT_ZOOM : z],
      });
    }
  };

  const clearFocusPoint = () => {
    setFocusX('');
    setFocusY('');
    setFocusZoom(String(DEFAULT_SCREENSHOT_ZOOM));
    onUpdate({ screenshotFocusPoint: undefined });
  };

  // Derived live preview — updates on every keystroke before blur/commit
  const previewX = parseFloat(focusX);
  const previewY = parseFloat(focusY);
  const previewZoom = parseFloat(focusZoom);
  const previewFocusPoint: [number, number, number?] | undefined =
    !isNaN(previewX) && !isNaN(previewY)
      ? [previewX, previewY, isNaN(previewZoom) ? undefined : previewZoom]
      : undefined;

  const renderScreenshot = (
    url: string,
    label: string,
    isPrimary: boolean,
    liveFocusPoint?: [number, number, number?],
  ) => {
    const activeFocusPoint = isPrimary ? liveFocusPoint : undefined;
    const zoomStyle = activeFocusPoint
      ? getScreenshotFocusStyle(activeFocusPoint)
      : undefined;
    const activeScale = activeFocusPoint
      ? getFocusScale(activeFocusPoint[2])
      : 1;
    return (
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
          style={zoomStyle}
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
        {/* Focus point crosshair overlay — only on primary */}
        {isPrimary && activeFocusPoint && (
          <div
            className='absolute pointer-events-none'
            style={{
              // The crosshair position in the original (unzoomed) coordinate space:
              // cssX = widthPercent, cssY = 100 - heightPercent
              left: `${activeFocusPoint[0]}%`,
              top: `${100 - activeFocusPoint[1]}%`,
              transform: `translate(-50%, -50%) scale(${1 / activeScale})`,
              transformOrigin: 'center',
            }}
          >
            <div className='w-5 h-5 rounded-full border-2 border-yellow-400 bg-yellow-400/30' />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='px-4 py-3 space-y-3'>
      {/* Secondary screenshot (displayed first / above) */}
      {game.secondaryScreenshot && (
        <>
          <div className='text-gray-400 text-xs uppercase'>
            Secondary Screenshot:
          </div>
          {renderScreenshot(
            game.secondaryScreenshot,
            'Secondary screenshot',
            false,
          )}
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
      {renderScreenshot(
        game.primaryScreenshot,
        'Primary screenshot',
        true,
        previewFocusPoint,
      )}
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

      {/* Screenshot focus point */}
      <div className='flex flex-wrap items-center gap-2 pt-1'>
        <span className='text-xs text-gray-400 shrink-0'>
          Focus zoom [x%, y%, zoom%]:
        </span>
        <input
          type='number'
          min={0}
          max={100}
          step={1}
          value={focusX}
          onChange={(e) => setFocusX(e.target.value)}
          onBlur={() => commitFocusPoint(focusX, focusY, focusZoom)}
          placeholder='x'
          className='w-16 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
        />
        <input
          type='number'
          min={0}
          max={100}
          step={1}
          value={focusY}
          onChange={(e) => setFocusY(e.target.value)}
          onBlur={() => commitFocusPoint(focusX, focusY, focusZoom)}
          placeholder='y'
          className='w-16 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
        />
        <input
          type='number'
          min={1}
          max={200}
          step={1}
          value={focusZoom}
          onChange={(e) => setFocusZoom(e.target.value)}
          onBlur={() => commitFocusPoint(focusX, focusY, focusZoom)}
          placeholder='zoom'
          className='w-16 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
        />
        <span className='text-xs text-gray-500'>
          (0,0)=bottom-left · (50,50)=center · (50,100)=top-center · zoom 1–175,
          default 75
        </span>
        {game.screenshotFocusPoint && (
          <button
            onClick={clearFocusPoint}
            className='px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs'
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
