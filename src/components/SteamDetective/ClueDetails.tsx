import { motion } from 'framer-motion';
import {
  getReviewColorClass,
  clueVariants,
  hashSeededCensorText,
} from './utils';
import type { ReviewSummary } from '../../types';
import type { ReactElement } from 'react';

interface ClueDetailsProps {
  allReviewSummary: ReviewSummary;
  releaseDate: string;
  earlyAccessDate?: string;
  originalReleaseDate?: string;
  developer: string;
  publisher: string;
  show: boolean;
  isComplete?: boolean;
}

export const ClueDetails: React.FC<ClueDetailsProps> = ({
  allReviewSummary,
  releaseDate,
  earlyAccessDate,
  originalReleaseDate,
  developer,
  publisher,
  show,
  isComplete = false,
}) => {
  // Helper to render text with censored parts (||text||)
  const renderCensoredText = (text: string): ReactElement[] => {
    const parts: ReactElement[] = [];
    const pattern = /\|\|(.+?)\|\|/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Add text before the censored part
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      // Add censored text with blur
      const censoredText = hashSeededCensorText(match[1]);
      parts.push(
        <span
          key={`censored-${match.index}`}
          style={{ filter: 'blur(6px)' }}
          className='select-none'
        >
          {censoredText}
        </span>,
      );

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text after last censored part
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>,
      );
    }

    return parts;
  };

  // Remove censorship markers (||text||) when showing uncensored version
  const getUncensoredText = (text: string) => {
    return text.replace(/\|\|(.+?)\|\|/g, '$1');
  };

  // Wrap parenthetical suffixes like " (South Korea)" in a subtler italic style.
  // Operates on the already-processed display value (string or ReactElement[]).
  const withStyledParens = (
    display: string | ReactElement[],
  ): string | ReactElement[] => {
    const applyToString = (s: string): ReactElement[] => {
      const match = s.match(/^(.*?)(\s*\([^)]+\)\s*)$/);
      if (!match) return [<span key='full'>{s}</span>];
      return [
        <span key='main'>{match[1]}</span>,
        <span key='paren' className='text-[#8a9ba8] italic'>
          {match[2]}
        </span>,
      ];
    };

    if (typeof display === 'string') {
      return applyToString(display);
    }
    // For ReactElement arrays (censored mode): check if the last element is a
    // plain text span whose content ends with a parenthetical and style it.
    if (display.length === 0) return display;
    const last = display[display.length - 1];
    const lastProps = last.props as { children?: unknown };
    if (last.type !== 'span' || typeof lastProps.children !== 'string') {
      return display;
    }
    const lastText: string = lastProps.children;
    const match = lastText.match(/^(.*?)(\s*\([^)]+\)\s*)$/);
    if (!match) return display;
    const styled = [
      ...display.slice(0, -1),
      <span key={last.key}>{match[1]}</span>,
      <span key={`${last.key}-paren`} className='text-[#8a9ba8] italic'>
        {match[2]}
      </span>,
    ];
    return styled;
  };

  // Determine what to display for release date, developer and publisher
  const displayReleaseDate = withStyledParens(
    isComplete
      ? getUncensoredText(releaseDate)
      : renderCensoredText(releaseDate),
  );
  const displayEarlyAccessDate = earlyAccessDate
    ? withStyledParens(
        isComplete
          ? getUncensoredText(earlyAccessDate)
          : renderCensoredText(earlyAccessDate),
      )
    : null;
  const displayOriginalReleaseDate = originalReleaseDate
    ? withStyledParens(
        isComplete
          ? getUncensoredText(originalReleaseDate)
          : renderCensoredText(originalReleaseDate),
      )
    : null;
  const displayDeveloper = isComplete
    ? getUncensoredText(developer)
    : renderCensoredText(developer);
  const displayPublisher = isComplete
    ? getUncensoredText(publisher)
    : renderCensoredText(publisher);

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='px-4 py-3 max-w-[450px]'>
        {/* All Reviews */}
        <div className='flex items-start gap-2'>
          <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-1'>
            All Reviews:
          </div>
          <div className='flex-1 flex gap-1'>
            <div
              className={`text-sm ${getReviewColorClass(allReviewSummary.rating)}`}
            >
              {allReviewSummary.rating}{' '}
              <span className='text-[#bcc6ce] text-sm'>
                ({allReviewSummary.count.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Original Release Date */}
        {displayOriginalReleaseDate && (
          <div className='flex items-start gap-2 mt-4'>
            <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
              Original Release:
            </div>
            <div className='text-[#c7d5e0] text-sm'>
              {displayOriginalReleaseDate}
            </div>
          </div>
        )}

        {/* Early Access Date */}
        {displayEarlyAccessDate && (
          <div
            className={`flex items-start gap-2 ${originalReleaseDate ? 'mt-2' : 'mt-4'}`}
          >
            <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
              Early Access:
            </div>
            <div className='text-[#c7d5e0] text-sm'>
              {displayEarlyAccessDate}
            </div>
          </div>
        )}

        {/* Release Date */}
        <div
          className={`flex items-start gap-2 ${earlyAccessDate || originalReleaseDate ? 'mt-2' : 'mt-4'}`}
        >
          <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
            {originalReleaseDate ? 'Steam Release:' : 'Release Date:'}
          </div>
          <div
            className={`text-sm ${
              getUncensoredText(releaseDate) === '(Not yet released)'
                ? 'text-[#a4adb3] italic'
                : 'text-[#c7d5e0]'
            }`}
          >
            {displayReleaseDate}
          </div>
        </div>

        {/* Developer */}
        <div className='flex items-start gap-2 mt-5'>
          <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
            Developer:
          </div>
          <div className='text-sm'>
            <span className='text-[#66c0f4]'>{displayDeveloper}</span>
          </div>
        </div>

        {/* Publisher */}
        <div className='flex items-start gap-2'>
          <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
            Publisher:
          </div>
          <div className='text-sm'>
            <span className='text-[#66c0f4]'>{displayPublisher}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
