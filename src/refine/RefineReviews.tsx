import { useState, useEffect } from 'react';
import type { Review, SteamGame } from '../types';
import thumbsUp from '../assets/thumbsup.png';
import thumbsDown from '../assets/thumbsdown.png';

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

/** A single Steam-styled review card */
const SteamReviewCard: React.FC<{
  review: Review;
  isSelected: boolean;
  editableText?: string;
  onSelect: () => void;
  // eslint-disable-next-line no-unused-vars
  onTextChange?: (text: string) => void;
}> = ({ review, isSelected, editableText, onSelect, onTextChange }) => {
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
        <div className='flex-shrink-0' style={{ width: 40, height: 40 }}>
          <img
            src={isRecommended ? thumbsUp : thumbsDown}
            alt={isRecommended ? 'Recommended' : 'Not Recommended'}
            width={40}
            height={40}
            style={{ width: 40, height: 40 }}
          />
        </div>
        <div className='flex flex-col min-w-0 flex-1'>
          <span
            className={`text-sm font-bold ${
              isRecommended ? 'text-[#66c0f4]' : 'text-[#c94f4f]'
            }`}
          >
            {isRecommended ? 'Recommended' : 'Not Recommended'}
          </span>
          <span className='text-[11px] text-gray-400'>
            {review.authorPlaytimeHours.toLocaleString()} hrs on record
          </span>
        </div>
        {/* Select / Deselect button */}
        <button
          onClick={onSelect}
          className={`flex-shrink-0 text-xs px-2 py-1 rounded font-semibold transition-colors ${
            isSelected
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-blue-700 hover:bg-blue-600 text-white'
          }`}
        >
          {isSelected ? 'Remove' : 'Use as Clue'}
        </button>
      </div>

      {/* Date */}
      <div className='px-3 pt-1.5 text-[11px] text-gray-500'>
        Posted: {formatTimestamp(review.timestamp)}
      </div>

      {/* Review text — editable when selected, read-only otherwise */}
      <div className='px-3 py-2'>
        {isSelected && onTextChange ? (
          <div>
            <div className='text-[10px] text-gray-500 mb-1'>
              Edit review text — use{' '}
              <code className='text-blue-400'>||text||</code> to censor/blur
              portions:
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

      {/* Helpful count */}
      {review.votesUp > 0 && (
        <div className='px-3 pb-2 text-[11px] text-gray-500'>
          {review.votesUp} {review.votesUp === 1 ? 'person' : 'people'} found
          this review helpful
        </div>
      )}
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

  const selectedReview = game.reviewClue;

  const handleSelect = (review: Review) => {
    if (
      selectedReview &&
      selectedReview.timestamp === review.timestamp &&
      selectedReview.votedUp === review.votedUp
    ) {
      // Deselect: clear reviewClue AND remove 'review' from clueOrder
      const newClueOrder = game.clueOrder?.filter((c) => c !== 'review');
      onUpdate({
        reviewClue: undefined,
        clueOrder: newClueOrder,
      });
    } else {
      // Select this review (copy it so user can edit text).
      // Also ensure 'review' is in clueOrder (at position 4 by default)
      const currentOrder = game.clueOrder ?? ['tags', 'details', 'desc'];
      const hasReviewInOrder = currentOrder.includes('review');
      const patch: Partial<import('../types').SteamGame> = {
        reviewClue: { ...review },
      };
      if (!hasReviewInOrder) {
        patch.clueOrder = [...currentOrder, 'review'];
      }
      onUpdate(patch);
    }
  };

  const handleTextChange = (text: string) => {
    if (!selectedReview) return;
    onUpdate({ reviewClue: { ...selectedReview, review: text } });
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
      {availableReviews.map((review, idx) => {
        const isSelected =
          !!selectedReview &&
          selectedReview.timestamp === review.timestamp &&
          selectedReview.votedUp === review.votedUp;

        // For the editable text: when selected, we use the potentially-edited text
        const editableText = isSelected ? selectedReview!.review : undefined;

        return (
          <SteamReviewCard
            key={idx}
            review={review}
            isSelected={isSelected}
            editableText={editableText}
            onSelect={() => handleSelect(review)}
            onTextChange={isSelected ? handleTextChange : undefined}
          />
        );
      })}
    </div>
  );
};
