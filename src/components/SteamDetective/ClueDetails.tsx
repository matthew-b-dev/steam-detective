import { motion } from 'framer-motion';
import { getReviewColorClass, clueVariants } from './utils';
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
  // Helper to censor text by displaying 'B' characters that will be blurred
  const censorText = (text: string): string => {
    return text
      .split('')
      .map(() => 'B')
      .join('');
  };

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
      const censoredText = censorText(match[1]);
      parts.push(
        <span
          key={`censored-${match.index}`}
          style={{ filter: 'blur(4px)' }}
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

  // Determine what to display for release date, developer and publisher
  const displayReleaseDate = isComplete
    ? getUncensoredText(releaseDate)
    : renderCensoredText(releaseDate);
  const displayEarlyAccessDate = earlyAccessDate
    ? isComplete
      ? getUncensoredText(earlyAccessDate)
      : renderCensoredText(earlyAccessDate)
    : null;
  const displayOriginalReleaseDate = originalReleaseDate
    ? isComplete
      ? getUncensoredText(originalReleaseDate)
      : renderCensoredText(originalReleaseDate)
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
