import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowsPointingOutIcon,
  LightBulbIcon as LightBulbOutline,
} from '@heroicons/react/24/outline';
import {
  LightBulbIcon as LightBulbSolid,
  LockClosedIcon,
} from '@heroicons/react/24/solid';
import FsLightbox from 'fslightbox-react';
import {
  screenshotVariants,
  getScreenshotFocusStyle,
  DEFAULT_SCREENSHOT_ZOOM,
} from './utils';

interface ClueScreenshotProps {
  screenshot: string;
  secondaryScreenshot?: string;
  primaryScreenshotUrl: string;
  show: boolean;
  showSecondary?: boolean;
  onSwapScreenshots?: () => void;
  blurScreenshotQuarter?: 'top' | 'bottom';
  screenshotLetterbox?: boolean;
  transformScreenshotScale?: number;
  screenshotFocusPoint?: [number, number, number?];
  isComplete?: boolean;
}

export const ClueScreenshot: React.FC<ClueScreenshotProps> = ({
  screenshot,
  secondaryScreenshot,
  primaryScreenshotUrl,
  show,
  showSecondary = false,
  onSwapScreenshots,
  blurScreenshotQuarter,
  screenshotLetterbox,
  transformScreenshotScale,
  screenshotFocusPoint,
  isComplete = false,
}) => {
  const bothShown = showSecondary && secondaryScreenshot;

  // The large slot shows: secondaryScreenshot when bothShown, otherwise screenshot
  const largeSrc = bothShown ? secondaryScreenshot : screenshot;
  // The thumbnail slot (only visible when bothShown) always shows: screenshot
  const thumbSrc = screenshot;

  // Zoom follows the PRIMARY screenshot image regardless of which slot it occupies.
  // Un-apply zoom once the game is complete so the full unzoomed image is shown.
  const primaryZoomStyle =
    !isComplete && screenshotFocusPoint
      ? getScreenshotFocusStyle(screenshotFocusPoint)
      : !isComplete && transformScreenshotScale
        ? { transform: `scale(${transformScreenshotScale})` }
        : undefined;

  const largeZoomStyle =
    largeSrc === primaryScreenshotUrl ? primaryZoomStyle : undefined;
  const thumbZoomStyle =
    thumbSrc === primaryScreenshotUrl ? primaryZoomStyle : undefined;
  const [lightboxToggler, setLightboxToggler] = useState(false);
  const [isBrightened, setIsBrightened] = useState(false);

  // Always include both screenshots if secondary exists to prevent hook order changes
  const lightboxSrcList = secondaryScreenshot
    ? [screenshot, secondaryScreenshot]
    : [screenshot];
  const isMobileViewport = window.innerWidth < 640;
  // Handle click on large screenshot - only on mobile
  const handleLargeScreenshotClick = () => {
    // Check if viewport is mobile (width < 642)
    // Don't open lightbox if screenshot is redacted or zoomed
    if (isMobileViewport && !blurScreenshotQuarter && !primaryZoomStyle) {
      setLightboxToggler(!lightboxToggler);
    }
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={screenshotVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='relative overflow-hidden'
    >
      <div className='px-4 py-4'>
        <div className='flex flex-col gap-3'>
          {/* Main Screenshot - shows primary initially, then secondary when clue 5 appears */}
          <div
            className={`overflow-hidden rounded-lg relative select-none ${isMobileViewport && !blurScreenshotQuarter && !primaryZoomStyle ? 'cursor-pointer' : 'cursor-default'}`}
            style={{
              aspectRatio: '16/9',
              backgroundColor: screenshotLetterbox ? 'black' : undefined,
            }}
            onClick={handleLargeScreenshotClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <AnimatePresence mode='wait'>
              <motion.div
                key={bothShown ? secondaryScreenshot : screenshot}
                className='w-full h-full relative'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img
                  src={bothShown ? secondaryScreenshot : screenshot}
                  alt='Game screenshot'
                  className={`w-full h-full block ${screenshotLetterbox ? 'object-contain' : 'object-cover'}`}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ WebkitTouchCallout: 'none', ...largeZoomStyle }}
                  initial={{ filter: 'blur(10px)' }}
                  animate={{
                    filter: isMobileViewport
                      ? `blur(0px) brightness(${isBrightened ? 1.62 : 1.25})`
                      : `blur(0px) brightness(${isBrightened ? 1.45 : 1})`,
                  }}
                  exit={{ filter: 'blur(10px)' }}
                  transition={{ duration: 0.2 }}
                />
                {/* Blur overlay for top or bottom quarter */}
                {blurScreenshotQuarter && !isComplete && (
                  <div
                    className='border-[6px] border-dashed border-white p-4 absolute inset-x-0 pointer-events-none flex items-center justify-center'
                    style={{
                      [blurScreenshotQuarter === 'top' ? 'top' : 'bottom']: 0,
                      height: '25%',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      backgroundColor: isMobileViewport
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'transparent',
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
              </motion.div>
            </AnimatePresence>
            {/* Transparent overlay to block mobile long-press image-save when screenshot is protected */}
            {(blurScreenshotQuarter || primaryZoomStyle) && !isComplete && (
              <div className='absolute inset-0' />
            )}
            {isMobileViewport &&
              !blurScreenshotQuarter &&
              !primaryZoomStyle && (
                <div className='absolute top-2 right-2 bg-black/50 rounded-md p-2 pointer-events-none'>
                  <ArrowsPointingOutIcon className='w-8 h-8 text-white drop-shadow-lg' />
                </div>
              )}
            {/* Dashed border overlay when zoomed primary is showing large */}
            {largeSrc === primaryScreenshotUrl &&
              screenshotFocusPoint &&
              !isComplete && (
                <div
                  className='absolute inset-0 pointer-events-none rounded-lg'
                  style={{ border: '3px dashed rgba(255,255,255,0.50)' }}
                />
              )}
            {/* Zoom indicator — only on large slot when primary is showing with a focus point, hidden once complete */}
            {largeSrc === primaryScreenshotUrl &&
              screenshotFocusPoint &&
              !isComplete && (
                <div className='absolute bottom-2 left-2 pointer-events-auto group'>
                  <div
                    className='px-1 sm:px-4 py-0.5 sm:py-1.5 rounded text-sm sm:text-2xl font-semibold text-white tracking-wide transition-opacity duration-150 group-hover:opacity-0'
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {screenshotFocusPoint[2] ?? DEFAULT_SCREENSHOT_ZOOM}% Zoom{' '}
                    <LockClosedIcon className='h-5 sm:h-6 w-5 sm:w-6 inline relative -top-[2px] sm:-top-1' />
                  </div>
                </div>
              )}
          </div>

          {/* Row for thumbnail and brightness toggle */}
          <div className='flex items-start'>
            {/* Thumbnail Screenshot - appears below main screenshot when clue 5 is shown */}
            {bothShown && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: 0 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.3 }}
                className='flex-shrink-0'
                style={{ width: isMobileViewport ? '30%' : '20%' }}
              >
                <div
                  className='overflow-hidden rounded-lg relative cursor-pointer group select-none'
                  style={{ aspectRatio: '16/9' }}
                  onClick={onSwapScreenshots}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <motion.img
                    key={screenshot}
                    src={screenshot}
                    alt='Game screenshot'
                    className='w-full h-full object-cover block brightness-75 group-hover:brightness-90'
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ WebkitTouchCallout: 'none', ...thumbZoomStyle }}
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={{ filter: 'blur(0px)', opacity: 1 }}
                    exit={{ filter: 'blur(10px)', opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Blur overlay for thumbnail */}
                  {blurScreenshotQuarter && !isComplete && (
                    <div
                      className='absolute inset-x-0 pointer-events-none'
                      style={{
                        [blurScreenshotQuarter === 'top' ? 'top' : 'bottom']: 0,
                        height: '25%',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                    />
                  )}
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <div className='bg-black/80 rounded-full p-2'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={2}
                        stroke='currentColor'
                        className='w-6 h-6 text-white'
                        style={{ transform: 'rotate(90deg)' }}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M4 7h16M4 7l4-4m-4 4l4 4M20 17H4m16 0l-4 4m4-4l-4-4'
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Brightness Toggle */}
            <div
              className='ml-auto flex items-center gap-2 cursor-pointer'
              onClick={() => setIsBrightened(!isBrightened)}
              role='switch'
              aria-checked={isBrightened}
              aria-label='Brighten screenshot'
            >
              <LightBulbOutline className='w-5 h-5 text-gray-400' />
              <div
                className={`relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  isBrightened ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                style={{ width: 43, height: 24, padding: 2 }}
              >
                <span
                  className='pointer-events-none block rounded-full bg-white shadow transition-transform duration-200 ease-in-out'
                  style={{
                    width: 20,
                    height: 20,
                    transform: isBrightened
                      ? 'translateX(19px)'
                      : 'translateX(0px)',
                  }}
                />
              </div>
              <LightBulbSolid className='w-5 h-5 text-white' />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for mobile only */}
      {showSecondary && (
        <FsLightbox toggler={lightboxToggler} sources={lightboxSrcList} />
      )}

      {!showSecondary && (
        <FsLightbox toggler={lightboxToggler} sources={[screenshot]} />
      )}
    </motion.div>
  );
};
