import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Review } from '../../types';
import { clueVariants, renderCensoredReview } from './utils';
import ThumbsUpIcon from '../../assets/thumbsup.svg?react';
import ThumbsDownIcon from '../../assets/thumbsdown.svg?react';

interface ClueReviewProps {
  reviews: Review | Review[]; // Support both single review (legacy) and array
  isComplete: boolean;
  show: boolean;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const EDITED_FOR_LENGTH_RE = /((?:\.\.\. )?\(edited for length\))/;
const editedForLengthStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: '#8a909a',
};

/** Splits a plain string on EDITED_FOR_LENGTH and renders the marker with special styling. */
const renderLineWithEditedMarker = (
  line: string,
  lineKey: string | number,
): ReactElement[] => {
  const parts = line.split(EDITED_FOR_LENGTH_RE);
  if (parts.length === 1) return [<span key={lineKey}>{line}</span>];
  const result: ReactElement[] = [];
  // split with a capturing group alternates: plain, match, plain, match, ...
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      // captured match - the marker itself (with optional leading '...')
      result.push(
        <span key={`${lineKey}-efl${idx}`} style={editedForLengthStyle}>
          {part}
        </span>,
      );
    } else if (part) {
      result.push(<span key={`${lineKey}-p${idx}`}>{part}</span>);
    }
  });
  return result;
};

const getUncensoredReview = (text: string): ReactElement[] => {
  const uncensored = text.replace(/\|\|(.+?)\|\|/g, '$1');
  return uncensored
    .split('\n')
    .flatMap((line, idx, arr) =>
      idx < arr.length - 1
        ? [...renderLineWithEditedMarker(line, idx), <br key={`br-${idx}`} />]
        : renderLineWithEditedMarker(line, idx),
    );
};

export const ClueReview: React.FC<ClueReviewProps> = ({
  reviews: reviewsInput,
  isComplete,
  show,
}) => {
  // Normalize to array
  const reviews = Array.isArray(reviewsInput) ? reviewsInput : [reviewsInput];

  return (
    <motion.div
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='px-4 py-3'>
        <div className='text-gray-400 text-xs uppercase mb-2'>
          {reviews.length > 1 ? 'Reviews:' : 'Review:'}
        </div>
        {/* Steam-style review cards */}
        <div className='space-y-3'>
          {reviews.map((review, idx) => (
            <ReviewCard key={idx} review={review} isComplete={isComplete} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ReviewCard: React.FC<{ review: Review; isComplete: boolean }> = ({
  review,
  isComplete,
}) => {
  const renderedText: ReactElement[] = useMemo(
    () =>
      isComplete
        ? getUncensoredReview(review.review)
        : renderCensoredReview(review.review),
    [review.review, isComplete],
  );

  const isRecommended = review.votedUp;

  return (
    <div>
      {/* Header: thumb + title + hours */}
      <div
        className='flex items-start gap-3 border-b bg-[#101923]'
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Thumb icon */}
        <div
          className='flex-shrink-0 flex items-center justify-center'
          style={{
            width: 40,
            height: 40,
            backgroundColor: isRecommended ? '#174766' : '#602f35',
            textShadow: '1px 1px 2px #000000aa',
            color: '#fff',
          }}
        >
          {isRecommended ? (
            <ThumbsUpIcon width={40} height={40} />
          ) : (
            <ThumbsDownIcon width={40} height={40} />
          )}
        </div>
        <div className='flex flex-col min-w-0'>
          <span className={`text-sm leading-tight text-white mt-0.5`}>
            {isRecommended ? 'Recommended' : 'Not Recommended'}
          </span>
          <span className='text-[11px] text-gray-300 mt-0.1'>
            {review.authorPlaytimeHours.toLocaleString()} hrs on record
            {review.authorPlaytimeHoursAtRelease != null && (
              <>
                {' '}
                ({review.authorPlaytimeHoursAtRelease.toLocaleString()} hrs at
                review time)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Posted date */}
      <div className='pt-2 px-2 text-[11px] text-gray-400 uppercase bg-[#101923]'>
        Posted:{' '}
        <span className='text-gray-300 font-semibold'>
          {formatTimestamp(review.timestamp)}
        </span>
      </div>

      {/* Review text */}
      <div
        key={isComplete ? 'uncensored' : 'censored'}
        className='py-2 px-2 text-sm text-gray-200 leading-relaxed bg-[#101923]'
      >
        {renderedText}
      </div>

      {/* Footer: helpful count */}
      {(review.votesUp > 0 || (review.votedFunny ?? 0) > 0) && (
        <div
          className='py-2 text-[11px] text-gray-400 border-t flex flex-col gap-0.5'
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {(review.votedFunny ?? 0) > 0 && (
            <span>
              {review.votedFunny!.toLocaleString()}{' '}
              {review.votedFunny === 1 ? 'person' : 'people'} found this review
              funny
            </span>
          )}
          {review.votesUp > 0 && (
            <span>
              {review.votesUp.toLocaleString()}{' '}
              {review.votesUp === 1 ? 'person' : 'people'} found this review
              helpful
            </span>
          )}
        </div>
      )}
    </div>
  );
};
