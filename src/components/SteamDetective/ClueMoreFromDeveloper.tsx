import type { ReactElement } from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import {
  clueVariants,
  renderUncensoredDescription,
  decodeHtmlEntities,
} from './utils';

interface ClueMoreFromDeveloperProps {
  games: { id: number; name: string; blurred?: boolean }[];
  developerDescription?: string;
  censoredDeveloperDescription?: ReactElement[];
  show: boolean;
  isComplete?: boolean;
}

export const ClueMoreFromDeveloper: React.FC<ClueMoreFromDeveloperProps> = ({
  games,
  developerDescription,
  censoredDeveloperDescription,
  show,
  isComplete = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isTouchDevice] = useState(
    () => window.matchMedia('(hover: none)').matches,
  );

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowing(overflows);
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = (card ? card.offsetWidth + 8 : 188) * 2; // 8px = gap-2, scroll 2 cards
    el.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  if (!games || games.length === 0) return null;

  return (
    <motion.div
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div
        className={`px-4 py-3 border-t border-[rgba(255,255,255,0.06)] ${
          isComplete ? 'opacity-100' : ''
        }`}
      >
        <div className='text-gray-400 text-sm mb-2'>
          {`${games.length > 1 ? 'Featured games' : 'Another game'} from this Developer (${games.length})`}
        </div>
        <div className='flex items-center gap-1'>
          {/* Left arrow - desktop only, always reserve space when overflowing */}
          {isOverflowing && (
            <button
              onClick={() => scroll('left')}
              aria-label='Scroll left'
              disabled={!canScrollLeft}
              className='hidden md:flex flex-shrink-0 self-stretch items-center justify-center rounded bg-white/10 hover:enabled:bg-white/20 disabled:opacity-20 disabled:cursor-default transition-colors select-none'
              style={{ width: 12 }}
            >
              <svg
                style={{ width: 20, height: 20, flexShrink: 0 }}
                viewBox='0 0 16 16'
                fill='none'
              >
                <path
                  d='M10 3L5 8L10 13'
                  stroke='white'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          )}
          <div
            className={`relative bg-black/50 p-1 min-h-[90px] rounded ${isOverflowing ? 'flex-1' : 'w-fit'}`}
          >
            {/* Left fade — fades in when scrolled right */}
            <div
              className='pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 transition-opacity duration-300'
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,1), transparent)',
                opacity: canScrollLeft ? 1 : 0,
              }}
            />
            {/* Right fade — fades in when more content to the right */}
            <div
              className='pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 transition-opacity duration-300'
              style={{
                background:
                  'linear-gradient(to left, rgba(0,0,0,1), transparent)',
                opacity: canScrollRight ? 1 : 0,
              }}
            />
            <div
              ref={scrollRef}
              className='flex-1 flex gap-2 overflow-x-auto'
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {games.map((game) => (
                <div
                  key={game.id}
                  className='relative flex-shrink-0'
                  style={{
                    scrollSnapAlign: 'start',
                    maxWidth: 180,
                  }}
                >
                  <img
                    src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.id}/header.jpg`}
                    alt=''
                    className='w-full rounded select-none'
                    draggable={false}
                    style={{ display: 'block' }}
                    onContextMenu={(e) => e.preventDefault()}
                    {...((!game.blurred || isComplete) && game.name
                      ? {
                          'data-tooltip-id': 'mfd-tooltip',
                          'data-tooltip-content': game.name,
                        }
                      : game.blurred && !isComplete
                        ? {
                            'data-tooltip-id': 'mfd-tooltip',
                            'data-tooltip-content':
                              'A game that would give away the answer',
                          }
                        : {})}
                  />
                  {/* Blur overlay — hidden once case file is complete */}
                  {game.blurred && !isComplete && (
                    <div
                      className='absolute inset-0 rounded flex flex-col items-center justify-center pointer-events-none'
                      style={{
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        backgroundColor: 'rgba(0,0,0,0.45)',
                      }}
                    >
                      <span className='text-gray-200 text-[9px] font-semibold tracking-widest uppercase select-none'>
                        RELATED TITLE
                      </span>
                      <span className='text-white text-[10px] font-bold tracking-widest uppercase select-none mt-0.5'>
                        REDACTED
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Right arrow - desktop only, always reserve space when overflowing */}
          {isOverflowing && (
            <button
              onClick={() => scroll('right')}
              aria-label='Scroll right'
              disabled={!canScrollRight}
              className='hidden md:flex flex-shrink-0 self-stretch items-center justify-center rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-default transition-colors select-none'
              style={{ width: 12 }}
            >
              <svg
                style={{ width: 20, height: 20, flexShrink: 0 }}
                viewBox='0 0 16 16'
                fill='none'
              >
                <path
                  d='M6 3L11 8L6 13'
                  stroke='white'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          )}
        </div>
        <Tooltip
          id='mfd-tooltip'
          openOnClick={isTouchDevice}
          opacity={1}
          border={'1px solid #52525b'}
          style={{
            backgroundColor: '#18181b',
            boxShadow: '0 0 8px rgba(255,255,255,0.22)',
            fontSize: '1rem',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        />
        {censoredDeveloperDescription &&
          censoredDeveloperDescription.length > 0 && (
            <div className='mt-3 text-sm text-gray-200 leading-relaxed max-w-[600px]'>
              <div className='text-gray-400 text-sm'>About the Developer:</div>
              <div className='italic'>
                "
                {isComplete
                  ? renderUncensoredDescription(
                      decodeHtmlEntities(developerDescription!),
                    )
                  : censoredDeveloperDescription}
                "
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
};
