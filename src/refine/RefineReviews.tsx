import { useState, useEffect } from 'react';
import type { Review, SteamGame } from '../types';
import ThumbsUpIcon from '../assets/thumbsup.svg?react';
import ThumbsDownIcon from '../assets/thumbsdown.svg?react';

interface ReviewsJson {
  [appId: string]: {
    mostHelpfulReviews?: Review[];
  };
}

interface RefineReviewsProps {
  game: SteamGame;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

/** Render review text with newlines. Strips any ||markers|| for the raw preview. */
const renderRawReview = (text: string) => {
  const stripped = text.replace(/\|\|(.+?)\|\|/g, '$1');
  return stripped.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
};

/** Helper to find review in current selection */
const isReviewSelected = (
  review: Review,
  selectedReviews: Review[],
): boolean => {
  return selectedReviews.some(
    (r) => r.timestamp === review.timestamp && r.votedUp === review.votedUp,
  );
};

/** A single Steam-styled review card */
const SteamReviewCard: React.FC<{
  review: Review;
  isSelected: boolean;
  selectionIndex?: number; // Position in selected reviews (1-indexed)
  editableText?: string;
  editableHrs?: number;
  editableTimestamp?: number;
  editableVotesUp?: number;
  onSelect: () => void;
  // eslint-disable-next-line no-unused-vars
  onMoveUp?: () => void;
  // eslint-disable-next-line no-unused-vars
  onMoveDown?: () => void;
  // eslint-disable-next-line no-unused-vars
  onTextChange?: (text: string) => void;
  // eslint-disable-next-line no-unused-vars
  onHrsChange?: (hrs: number) => void;
  // eslint-disable-next-line no-unused-vars
  onTimestampChange?: (timestamp: number) => void;
  // eslint-disable-next-line no-unused-vars
  onVotesUpChange?: (votes: number) => void;
}> = ({
  review,
  isSelected,
  selectionIndex,
  editableText,
  editableHrs,
  editableTimestamp,
  editableVotesUp,
  onSelect,
  onMoveUp,
  onMoveDown,
  onTextChange,
  onHrsChange,
  onTimestampChange,
  onVotesUpChange,
}) => {
  const isRecommended = review.votedUp;

  return (
    <div
      className={`rounded-md border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-[#1a2a3a]'
          : 'border-[rgba(255,255,255,0.08)] bg-[#c6d4df0d] hover:border-[rgba(255,255,255,0.2)]'
      }`}
    >
      {/* Header */}
      <div className='flex items-start gap-3 px-3 pt-3 pb-2 border-b border-[rgba(255,255,255,0.08)]'>
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
        <div className='flex flex-col min-w-0 flex-1'>
          <span
            className={`text-sm font-bold ${
              isRecommended ? 'text-[#66c0f4]' : 'text-[#c94f4f]'
            }`}
          >
            {isRecommended ? 'Recommended' : 'Not Recommended'}
            {isSelected && selectionIndex !== undefined && (
              <span className='text-xs ml-2 text-gray-400'>
                (Position {selectionIndex})
              </span>
            )}
          </span>
          {isSelected && onHrsChange ? (
            <input
              type='number'
              min='0'
              value={editableHrs ?? review.authorPlaytimeHours}
              onChange={(e) =>
                onHrsChange(Math.max(0, parseInt(e.target.value) || 0))
              }
              className='text-[11px] bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-gray-300 focus:outline-none focus:border-blue-500 w-fit'
            />
          ) : (
            <span className='text-[11px] text-gray-400'>
              {(editableHrs ?? review.authorPlaytimeHours).toLocaleString()} hrs
              on record
            </span>
          )}
        </div>
        <div className='flex-shrink-0 flex gap-1'>
          {isSelected && (selectionIndex ?? 0) > 1 && onMoveUp && (
            <button
              onClick={onMoveUp}
              className='text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white'
              title='Move up'
            >
              ↑
            </button>
          )}
          {isSelected && onMoveDown && (
            <button
              onClick={onMoveDown}
              className='text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white'
              title='Move down'
            >
              ↓
            </button>
          )}
          {/* Select / Deselect button */}
          <button
            onClick={onSelect}
            className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${
              isSelected
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            {isSelected ? 'Remove' : 'Use as Clue'}
          </button>
        </div>
      </div>

      {/* Date */}
      <div className='px-3 pt-1.5 text-[11px] text-gray-500'>
        {isSelected && onTimestampChange ? (
          <div className='space-y-1'>
            <label className='block text-gray-600'>Posted Date:</label>
            <input
              type='date'
              value={
                new Date((editableTimestamp ?? review.timestamp) * 1000)
                  .toISOString()
                  .split('T')[0]
              }
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onTimestampChange(Math.floor(newDate.getTime() / 1000));
              }}
              className='bg-zinc-800 border border-zinc-600 rounded px-1.5 py-1 text-gray-300 text-xs focus:outline-none focus:border-blue-500'
            />
          </div>
        ) : (
          <span>
            Posted: {formatTimestamp(editableTimestamp ?? review.timestamp)}
          </span>
        )}
      </div>

      {/* Review text — editable when selected, read-only otherwise */}
      <div className='px-3 py-2'>
        {isSelected && onTextChange ? (
          <div>
            <div className='text-[10px] text-gray-500 mb-1'>
              Edit review text — use{' '}
              <code className='text-blue-400'>||text||</code> to censor/blur
              portions. use "... (edited for length)" to cut off:
            </div>
            <textarea
              value={editableText ?? review.review}
              onChange={(e) => onTextChange(e.target.value)}
              rows={6}
              className='w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500 resize-y'
            />
          </div>
        ) : (
          <div className='text-sm text-gray-300 leading-relaxed'>
            {renderRawReview(review.review)}
          </div>
        )}
      </div>

      {/* Helpful count + link */}
      <div className='px-3 pb-2 text-[11px] text-gray-500 flex flex-col gap-0.5'>
        {(editableVotesUp ?? review.votesUp) > 0 || isSelected ? (
          isSelected && onVotesUpChange ? (
            <div className='space-y-1'>
              <label className='block text-gray-600'>Found Helpful:</label>
              <input
                type='number'
                min='0'
                value={editableVotesUp ?? review.votesUp}
                onChange={(e) =>
                  onVotesUpChange(Math.max(0, parseInt(e.target.value) || 0))
                }
                className='bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-gray-300 text-xs focus:outline-none focus:border-blue-500 w-fit'
              />
            </div>
          ) : (
            <span>
              {editableVotesUp ?? review.votesUp}{' '}
              {(editableVotesUp ?? review.votesUp) === 1 ? 'person' : 'people'}{' '}
              found this review helpful
            </span>
          )
        ) : null}
        {review.reviewUrl && (
          <a
            href={review.reviewUrl}
            target='_blank'
            rel='noreferrer'
            className='text-blue-400 hover:text-blue-300 underline self-start'
          >
            View on Steam
          </a>
        )}
      </div>
    </div>
  );
};

export const RefineReviews: React.FC<RefineReviewsProps> = ({
  game,
  onUpdate,
}) => {
  const [availableReviews, setAvailableReviews] = useState<Review[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState(false);

  // Dynamically import reviews.json via a virtual Vite module.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — resolved by the Vite virtual module plugin; tsc never sees this file
        const mod = (await import('../reviews.json')) as {
          default: ReviewsJson;
        };
        if (cancelled) return;
        const entry = mod.default[String(game.appId)];
        setAvailableReviews(entry?.mostHelpfulReviews ?? []);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [game.appId]);

  // Get selected reviews - support both new reviewClues and old reviewClue for backward compat
  const selectedReviews =
    game.reviewClues || (game.reviewClue ? [game.reviewClue] : []);

  const handleSelect = (review: Review) => {
    const isCurrentlySelected = isReviewSelected(review, selectedReviews);

    if (isCurrentlySelected) {
      // Remove this review from the list
      const updated = selectedReviews.filter(
        (r) =>
          !(r.timestamp === review.timestamp && r.votedUp === review.votedUp),
      );
      const newClueOrder =
        updated.length === 0
          ? game.clueOrder?.filter((c) => c !== 'review')
          : game.clueOrder;
      onUpdate({
        reviewClues: updated.length > 0 ? updated : undefined,
        reviewClue: undefined, // clear old format
        clueOrder: newClueOrder,
      });
    } else {
      // Add this review to the list
      const updated = [...selectedReviews, { ...review }];
      const currentOrder = game.clueOrder ?? ['tags', 'details', 'desc'];
      const hasReviewInOrder = currentOrder.includes('review');
      const patch: Partial<SteamGame> = {
        reviewClues: updated,
        reviewClue: undefined, // clear old format
      };
      if (!hasReviewInOrder) {
        patch.clueOrder = [...currentOrder, 'review'];
      }
      onUpdate(patch);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...selectedReviews];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onUpdate({ reviewClues: updated });
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedReviews.length - 1) return;
    const updated = [...selectedReviews];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onUpdate({ reviewClues: updated });
  };

  const handleTextChange = (index: number, text: string) => {
    const updated = [...selectedReviews];
    updated[index] = { ...updated[index], review: text };
    onUpdate({ reviewClues: updated });
  };

  const handleHrsChange = (index: number, hrs: number) => {
    const updated = [...selectedReviews];
    updated[index] = { ...updated[index], authorPlaytimeHours: hrs };
    onUpdate({ reviewClues: updated });
  };

  const handleTimestampChange = (index: number, timestamp: number) => {
    const updated = [...selectedReviews];
    updated[index] = { ...updated[index], timestamp };
    onUpdate({ reviewClues: updated });
  };

  const handleVotesUpChange = (index: number, votes: number) => {
    const updated = [...selectedReviews];
    updated[index] = { ...updated[index], votesUp: votes };
    onUpdate({ reviewClues: updated });
  };

  if (loadError) {
    return (
      <div className='text-xs text-gray-500 italic px-1'>
        reviews.json not found — place it at <code>src/reviews.json</code> to
        enable review clue selection.
      </div>
    );
  }

  if (availableReviews === null) {
    return <div className='text-xs text-gray-500 italic'>Loading reviews…</div>;
  }

  if (availableReviews.length === 0) {
    return (
      <div className='text-xs text-gray-500 italic'>
        No reviews found for this game in reviews.json.
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='text-xs text-gray-400 uppercase tracking-wide'>
        Available Reviews ({availableReviews.length})
      </div>
      {selectedReviews.length > 0 && (
        <div className='bg-blue-950 border border-blue-800 rounded p-2 text-xs text-blue-200'>
          <div className='font-semibold mb-1'>
            Selected Reviews: {selectedReviews.length}
          </div>
          <div className='space-y-1'>
            {selectedReviews.map((r, idx) => (
              <div key={idx} className='text-blue-300'>
                {idx + 1}. {r.votedUp ? '✓' : '✗'} {r.authorPlaytimeHours} hrs |{' '}
                {r.review.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      )}
      {availableReviews.map((review, idx) => {
        const isSelected = isReviewSelected(review, selectedReviews);
        const selectionIndex = selectedReviews.findIndex(
          (r) =>
            r.timestamp === review.timestamp && r.votedUp === review.votedUp,
        );

        // Get the actual editable values from selected reviews array
        const selectedReview = selectedReviews[selectionIndex];
        const editableText = selectedReview?.review;
        const editableHrs = selectedReview?.authorPlaytimeHours;
        const editableTimestamp = selectedReview?.timestamp;
        const editableVotesUp = selectedReview?.votesUp;

        return (
          <SteamReviewCard
            key={idx}
            review={review}
            isSelected={isSelected}
            selectionIndex={isSelected ? selectionIndex + 1 : undefined}
            editableText={editableText}
            editableHrs={editableHrs}
            editableTimestamp={editableTimestamp}
            editableVotesUp={editableVotesUp}
            onSelect={() => handleSelect(review)}
            onMoveUp={
              isSelected ? () => handleMoveUp(selectionIndex) : undefined
            }
            onMoveDown={
              isSelected ? () => handleMoveDown(selectionIndex) : undefined
            }
            onTextChange={
              isSelected
                ? (t) => handleTextChange(selectionIndex, t)
                : undefined
            }
            onHrsChange={
              isSelected ? (h) => handleHrsChange(selectionIndex, h) : undefined
            }
            onTimestampChange={
              isSelected
                ? (ts) => handleTimestampChange(selectionIndex, ts)
                : undefined
            }
            onVotesUpChange={
              isSelected
                ? (v) => handleVotesUpChange(selectionIndex, v)
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
