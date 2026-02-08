import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowsPointingOutIcon,
  LightBulbIcon as LightBulbOutline,
} from '@heroicons/react/24/outline';
import { LightBulbIcon as LightBulbSolid } from '@heroicons/react/24/solid';
import FsLightbox from 'fslightbox-react';
import { screenshotVariants } from './utils';

interface ClueScreenshotProps {
  screenshot: string;
  secondaryScreenshot?: string;
  show: boolean;
  showSecondary?: boolean;
  onSwapScreenshots?: () => void;
  blurScreenshotQuarter?: 'top' | 'bottom';
  isComplete?: boolean;
}

export const ClueScreenshot: React.FC<ClueScreenshotProps> = ({
  screenshot,
  secondaryScreenshot,
  show,
  showSecondary = false,
  onSwapScreenshots,
  blurScreenshotQuarter,
  isComplete = false,
}) => {
  const bothShown = showSecondary && secondaryScreenshot;
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
    // Don't open lightbox if screenshot is redacted
    if (isMobileViewport && !blurScreenshotQuarter) {
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
            className={`overflow-hidden rounded-lg relative select-none ${isMobileViewport && !blurScreenshotQuarter ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ aspectRatio: '16/9' }}
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
                  className='w-full h-full object-cover block'
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
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
            {isMobileViewport && !blurScreenshotQuarter && (
              <div className='absolute top-2 right-2 bg-black/50 rounded-md p-2 pointer-events-none'>
                <ArrowsPointingOutIcon className='w-8 h-8 text-white drop-shadow-lg' />
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
            <div className='ml-auto flex items-center gap-2'>
              <LightBulbOutline className='w-5 h-5 text-white' />
              <button
                onClick={() => setIsBrightened(!isBrightened)}
                className={`relative inline-flex items-center flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                  isBrightened ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                style={{ width: 43, height: 24, padding: 2 }}
                role='switch'
                aria-checked={isBrightened}
                aria-label='Brighten screenshot'
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
              </button>
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
