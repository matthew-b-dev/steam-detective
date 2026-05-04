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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const STYLED_MARKER_RE_G = /(?:\.\.\. )?\(edited for length\)|^\(.+\)$/g;
const editedForLengthStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: '#8a909a',
};

/** Renders a line with styled markers applied via exec loop. */
const renderLineWithEditedMarker = (
  line: string,
  lineKey: string | number,
): ReactElement[] => {
  line = line.replace(/&nbsp;/g, '\u00A0');
  const result: ReactElement[] = [];
  let lastIndex = 0;
  let key = 0;
  STYLED_MARKER_RE_G.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STYLED_MARKER_RE_G.exec(line)) !== null) {
    if (m.index > lastIndex) {
      result.push(
        <span key={`${lineKey}-t${key++}`}>
          {line.substring(lastIndex, m.index)}
        </span>,
      );
    }
    result.push(
      <span key={`${lineKey}-m${key++}`} style={editedForLengthStyle}>
        {m[0]}
      </span>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) {
    result.push(
      <span key={`${lineKey}-t${key++}`}>{line.substring(lastIndex)}</span>,
    );
  }
  return result.length > 0 ? result : [<span key={lineKey}>{line}</span>];
};

const getUncensoredReview = (text: string): ReactElement[] => {
  const uncensored = text
    .replace(/\[\[(.+?)\]\]/g, (_, inner) =>
      inner.replace(/\(\((.+?)\)\)/g, '$1'),
    )
    .replace(/\|\|(.+?)\|\|/g, '$1');
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
        className='flex items-center gap-3 border-b bg-[#101923]'
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
      <div className='pt-2 px-2 text-[11px] text-[#a0a08b] bg-[#101923]'>
        Posted:{' '}
        <span className='text-[#a0a08b] font-bold'>
          {formatTimestamp(review.timestamp)}
        </span>
        {review.writtenDuringEarlyAccess && (
          <div className='mt-2'>
            <span
              className='self-start text-[11px] font-bold uppercase tracking-wider px-1.5 py-[0px] mb-0.5 border'
              style={{
                color: '#9ac7f3',
                borderColor: '#779abc',
                backgroundColor: '#4d6c8b',
              }}
            >
              Early Access Review
            </span>
          </div>
        )}
      </div>

      {/* Review text */}
      <div
        key={isComplete ? 'uncensored' : 'censored'}
        className={`py-2 px-2 text-sm text-gray-200 leading-relaxed bg-[#101923] ${review.reviewer ? 'border-b' : ''}`}
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {renderedText}
      </div>

      {/* Reviewer row */}
      {review.reviewer && (
        <div
          className='flex items-center gap-3 px-2 py-2 bg-[#101923]'
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <img
            src={review.reviewer.avatarUrl}
            alt={review.reviewer.name}
            className='flex-shrink-0 object-cover'
            style={{ width: 32, height: 32 }}
          />
          <div className='flex flex-col'>
            <span className='text-[12px] text-gray-300 leading-tight'>
              {review.reviewer.name}
            </span>
            {review.reviewer.followers != null && (
              <span className='text-[10px] text-gray-500 leading-tight'>
                {review.reviewer.followers.toLocaleString()} followers
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: helpful count */}
      {(review.votesUp >= 0 || (review.votedFunny ?? 0) > 0) && (
        <div
          className='py-2 text-[11px] text-gray-400 border-t flex flex-col gap-0.5'
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {review.votesUp === 0 ? (
            <span>No one found this review helpful</span>
          ) : (
            <span>
              {review.votesUp.toLocaleString()}{' '}
              {review.votesUp === 1 ? 'person' : 'people'} found this review
              helpful
            </span>
          )}
          {(review.votedFunny ?? 0) > 0 && (
            <span>
              {review.votedFunny!.toLocaleString()}{' '}
              {review.votedFunny === 1 ? 'person' : 'people'} found this review
              funny
            </span>
          )}
        </div>
      )}
    </div>
  );
};
