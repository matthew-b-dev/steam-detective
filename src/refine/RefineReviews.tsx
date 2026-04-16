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

/** Parse a Steam review page HTML string into a Review object. */
const parseSteamReviewHtml = (
  html: string,
  sourceUrl: string,
): Review | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const reviewTextEl = doc.querySelector('#ReviewText');
  if (!reviewTextEl) return null;
  // Replace <br> elements with newline characters before extracting text.
  reviewTextEl.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  const reviewText = reviewTextEl.textContent?.trim() ?? '';
  if (!reviewText) return null;

  const ratingSummaryEl = doc.querySelector('.ratingSummary');
  const votedUp = ratingSummaryEl?.textContent?.trim() === 'Recommended';

  // Hours: prefer "at review time", fall back to "on record"
  const playTimeText = doc.querySelector('.playTime')?.textContent ?? '';
  let authorPlaytimeHours = 0;
  let authorPlaytimeAtReview: number | undefined;
  const reviewTimeMatch = playTimeText.match(
    /([\d,]+\.?\d*)\s*hrs?\s+at\s+review\s+time/i,
  );
  if (reviewTimeMatch) {
    authorPlaytimeAtReview = parseFloat(reviewTimeMatch[1].replace(/,/g, ''));
    authorPlaytimeHours = authorPlaytimeAtReview;
  }
  const totalHrsMatch = playTimeText.match(
    /([\d,]+\.?\d*)\s*hrs?\s+on\s+record/i,
  );
  if (totalHrsMatch) {
    authorPlaytimeHours = parseFloat(totalHrsMatch[1].replace(/,/g, ''));
  }

  // Timestamp from "Posted: Nov 24, 2023 @ 12:04am"
  let timestamp = Math.floor(Date.now() / 1000);
  const dateText =
    doc.querySelector('.recommendation_date')?.textContent?.trim() ?? '';
  const dateMatch = dateText.match(/Posted:\s*(.+?)(?:\s*@|$)/);
  if (dateMatch) {
    const parsed = new Date(dateMatch[1].trim());
    if (!isNaN(parsed.getTime()))
      timestamp = Math.floor(parsed.getTime() / 1000);
  }

  // Helpful / funny counts from the ratingBar text content
  const ratingBarText = doc.querySelector('.ratingBar')?.textContent ?? '';
  let votesUp = 0;
  let votedFunny: number | undefined;
  const helpfulMatch = ratingBarText.match(
    /([\d,]+)\s+people?\s+found\s+this\s+review\s+helpful/i,
  );
  if (helpfulMatch) votesUp = parseInt(helpfulMatch[1].replace(/,/g, ''), 10);
  const funnyMatch = ratingBarText.match(
    /([\d,]+)\s+people?\s+found\s+this\s+review\s+funny/i,
  );
  if (funnyMatch) votedFunny = parseInt(funnyMatch[1].replace(/,/g, ''), 10);

  return {
    review: reviewText,
    votedUp,
    votesUp,
    votedFunny: votedFunny && votedFunny > 0 ? votedFunny : undefined,
    authorPlaytimeHours,
    authorPlaytimeAtReview,
    timestamp,
    reviewUrl: sourceUrl,
  };
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
  selectionIndex?: number; // Position in selected reviews (1-indexed)
  editableText?: string;
  editableHrs?: number;
  editableTimestamp?: number;
  editableVotesUp?: number;
  editableVotedFunny?: number;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  // eslint-disable-next-line no-unused-vars
  onTextChange?: (text: string) => void;
  // eslint-disable-next-line no-unused-vars
  onHrsChange?: (hrs: number) => void;
  // eslint-disable-next-line no-unused-vars
  onTimestampChange?: (timestamp: number) => void;
  // eslint-disable-next-line no-unused-vars
  onVotesUpChange?: (votes: number) => void;
  // eslint-disable-next-line no-unused-vars
  onVotedFunnyChange?: (funny: number) => void;
}> = ({
  review,
  isSelected,
  selectionIndex,
  editableText,
  editableHrs,
  editableTimestamp,
  editableVotesUp,
  editableVotedFunny,
  onSelect,
  onMoveUp,
  onMoveDown,
  onTextChange,
  onHrsChange,
  onTimestampChange,
  onVotesUpChange,
  onVotedFunnyChange,
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
              step='0.1'
              value={editableHrs ?? review.authorPlaytimeHours}
              onChange={(e) =>
                onHrsChange(Math.max(0, parseFloat(e.target.value) || 0))
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

      {/* Review text - editable when selected, read-only otherwise */}
      <div className='px-3 py-2'>
        {isSelected && onTextChange ? (
          <div>
            <div className='text-[10px] text-gray-500 mb-1'>
              Edit review text - use{' '}
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

      {/* Helpful / Funny counts + link */}
      <div className='px-3 pb-2 text-[11px] text-gray-500 flex flex-col gap-0.5'>
        {(editableVotesUp ?? review.votesUp) >= 0 || isSelected ? (
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
              {(editableVotesUp ?? review.votesUp) === 0
                ? 'No one found this review helpful'
                : `${(editableVotesUp ?? review.votesUp).toLocaleString()} ${(editableVotesUp ?? review.votesUp) === 1 ? 'person' : 'people'} found this review helpful`}
            </span>
          )
        ) : null}
        {isSelected && onVotedFunnyChange ? (
          <div className='space-y-1'>
            <label className='block text-gray-600'>Found Funny:</label>
            <input
              type='number'
              min='0'
              value={editableVotedFunny ?? review.votedFunny ?? 0}
              onChange={(e) =>
                onVotedFunnyChange(Math.max(0, parseInt(e.target.value) || 0))
              }
              className='bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-gray-300 text-xs focus:outline-none focus:border-blue-500 w-fit'
            />
          </div>
        ) : (editableVotedFunny ?? review.votedFunny ?? 0) > 0 ? (
          <span>
            {(editableVotedFunny ?? review.votedFunny!).toLocaleString()}{' '}
            {(editableVotedFunny ?? review.votedFunny) === 1
              ? 'person'
              : 'people'}{' '}
            found this review funny
          </span>
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
  // Stable identity map: availableReviews index -> selectedReviews index.
  // Using this instead of timestamp-based matching so editing the timestamp
  // field doesn't break the selection state.
  const [avToSel, setAvToSel] = useState<Map<number, number>>(new Map());

  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportUrl = async () => {
    setImportError(null);
    const url = importUrl.trim();
    if (!url) return;

    let proxyPath: string;
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('steamcommunity.com')) {
        setImportError('URL must be a steamcommunity.com review URL.');
        return;
      }
      // Validate the appId in the URL matches this game.
      const appIdMatch = parsed.pathname.match(/\/recommended\/(\d+)/);
      if (appIdMatch && appIdMatch[1] !== String(game.appId)) {
        setImportError(
          `This review is for app ${appIdMatch[1]}, but the current game is ${game.appId}.`,
        );
        return;
      }
      proxyPath = '/steam-review-proxy' + parsed.pathname + parsed.search;
    } catch {
      setImportError('Invalid URL.');
      return;
    }

    setImportLoading(true);
    try {
      const res = await fetch(proxyPath);
      if (!res.ok) {
        setImportError(`Fetch failed: HTTP ${res.status}`);
        return;
      }
      const html = await res.text();
      const importedReview = parseSteamReviewHtml(html, url);
      if (!importedReview) {
        setImportError(
          'Could not parse review from page. Make sure the URL points to a single Steam review.',
        );
        return;
      }
      // Add as an orphan-style custom review (not backed by reviews.json).
      const newSelIdx = selectedReviews.length;
      const orphanKey = -(newSelIdx + 1);
      const newMap = new Map(avToSel);
      newMap.set(orphanKey, newSelIdx);
      setAvToSel(newMap);
      const currentOrder = game.clueOrder ?? ['tags', 'details', 'desc'];
      const patch: Partial<SteamGame> = {
        reviewClues: [...selectedReviews, importedReview],
        reviewClue: undefined,
      };
      if (!currentOrder.includes('review')) {
        patch.clueOrder = [...currentOrder, 'review'];
      }
      onUpdate(patch);
      setImportUrl('');
    } catch (e) {
      setImportError(`Error fetching review: ${String(e)}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Dynamically import reviews.json via a virtual Vite module.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - resolved by the Vite virtual module plugin; tsc never sees this file
        const mod = (await import('../reviews.json')) as {
          default: ReviewsJson;
        };
        if (cancelled) return;
        const entry = mod.default[String(game.appId)];
        const reviews = entry?.mostHelpfulReviews ?? [];
        setAvailableReviews(reviews);
        // Build the initial avToSel map by matching the already-selected reviews
        // against the freshly-loaded available list (only needs timestamp-match once).
        const currentSelected =
          game.reviewClues || (game.reviewClue ? [game.reviewClue] : []);
        const map = new Map<number, number>();
        currentSelected.forEach((selReview, selIdx) => {
          const avIdx = reviews.findIndex(
            (r) =>
              r.timestamp === selReview.timestamp &&
              r.votedUp === selReview.votedUp,
          );
          if (avIdx >= 0) map.set(avIdx, selIdx);
        });
        // Any selected review that didn't match an available review gets an
        // orphan virtual key (negative). This happens when the timestamp was
        // edited - the saved data no longer matches reviews.json.
        const matchedSelIdxs = new Set(map.values());
        currentSelected.forEach((_, selIdx) => {
          if (!matchedSelIdxs.has(selIdx)) {
            map.set(-(selIdx + 1), selIdx);
          }
        });
        setAvToSel(map);
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

  const handleSelect = (avIdx: number, review: Review) => {
    const isCurrentlySelected = avToSel.has(avIdx);

    if (isCurrentlySelected) {
      const selIdx = avToSel.get(avIdx)!;
      const updated = selectedReviews.filter((_, i) => i !== selIdx);
      // Rebuild map: remove this entry and decrement indices above selIdx.
      // Orphan virtual keys are -(selIdx+1); keep them in sync with new selIdx.
      const newMap = new Map<number, number>();
      avToSel.forEach((sIdx, aIdx) => {
        if (aIdx === avIdx) return;
        const newSIdx = sIdx > selIdx ? sIdx - 1 : sIdx;
        const newAIdx = aIdx < 0 ? -(newSIdx + 1) : aIdx;
        newMap.set(newAIdx, newSIdx);
      });
      setAvToSel(newMap);
      const newClueOrder =
        updated.length === 0
          ? game.clueOrder?.filter((c) => c !== 'review')
          : game.clueOrder;
      onUpdate({
        reviewClues: updated.length > 0 ? updated : undefined,
        reviewClue: undefined,
        clueOrder: newClueOrder,
      });
    } else {
      const newSelIdx = selectedReviews.length;
      const newMap = new Map(avToSel);
      newMap.set(avIdx, newSelIdx);
      setAvToSel(newMap);
      const updated = [...selectedReviews, { ...review }];
      const currentOrder = game.clueOrder ?? ['tags', 'details', 'desc'];
      const hasReviewInOrder = currentOrder.includes('review');
      const patch: Partial<SteamGame> = {
        reviewClues: updated,
        reviewClue: undefined,
      };
      if (!hasReviewInOrder) {
        patch.clueOrder = [...currentOrder, 'review'];
      }
      onUpdate(patch);
    }
  };

  const handleMoveUp = (avIdx: number) => {
    const selIdx = avToSel.get(avIdx);
    if (selIdx === undefined || selIdx <= 0) return;
    const updated = [...selectedReviews];
    [updated[selIdx - 1], updated[selIdx]] = [
      updated[selIdx],
      updated[selIdx - 1],
    ];
    onUpdate({ reviewClues: updated });
    // Swap entries; keep orphan virtual keys in sync with their new selIdx.
    const newMap = new Map(avToSel);
    let otherAvIdx: number | undefined;
    avToSel.forEach((sIdx, aIdx) => {
      if (sIdx === selIdx - 1) otherAvIdx = aIdx;
    });
    if (otherAvIdx !== undefined) {
      const newOtherKey = otherAvIdx < 0 ? -(selIdx + 1) : otherAvIdx;
      const newThisKey = avIdx < 0 ? -(selIdx - 1 + 1) : avIdx;
      newMap.delete(avIdx);
      newMap.delete(otherAvIdx);
      newMap.set(newOtherKey, selIdx);
      newMap.set(newThisKey, selIdx - 1);
    }
    setAvToSel(newMap);
  };

  const handleMoveDown = (avIdx: number) => {
    const selIdx = avToSel.get(avIdx);
    if (selIdx === undefined || selIdx >= selectedReviews.length - 1) return;
    const updated = [...selectedReviews];
    [updated[selIdx], updated[selIdx + 1]] = [
      updated[selIdx + 1],
      updated[selIdx],
    ];
    onUpdate({ reviewClues: updated });
    const newMap = new Map(avToSel);
    let otherAvIdx: number | undefined;
    avToSel.forEach((sIdx, aIdx) => {
      if (sIdx === selIdx + 1) otherAvIdx = aIdx;
    });
    if (otherAvIdx !== undefined) {
      const newOtherKey = otherAvIdx < 0 ? -(selIdx + 1) : otherAvIdx;
      const newThisKey = avIdx < 0 ? -(selIdx + 1 + 1) : avIdx;
      newMap.delete(avIdx);
      newMap.delete(otherAvIdx);
      newMap.set(newOtherKey, selIdx);
      newMap.set(newThisKey, selIdx + 1);
    }
    setAvToSel(newMap);
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

  const handleVotedFunnyChange = (index: number, funny: number) => {
    const updated = [...selectedReviews];
    updated[index] = {
      ...updated[index],
      votedFunny: funny > 0 ? funny : undefined,
    };
    onUpdate({ reviewClues: updated });
  };

  if (loadError) {
    return (
      <div className='text-xs text-gray-500 italic px-1'>
        reviews.json not found - place it at <code>src/reviews.json</code> to
        enable review clue selection.
      </div>
    );
  }

  if (availableReviews === null) {
    return <div className='text-xs text-gray-500 italic'>Loading reviews…</div>;
  }

  const importFromUrlSection = (
    <div className='border border-dashed border-gray-600 rounded p-3 space-y-2'>
      <div className='text-xs text-gray-400 font-semibold'>
        Import Review from Steam URL
      </div>
      <div className='flex gap-2'>
        <input
          type='text'
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
          placeholder='https://steamcommunity.com/id/.../recommended/...'
          className='flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500'
        />
        <button
          onClick={handleImportUrl}
          disabled={importLoading || !importUrl.trim()}
          className='text-xs px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50 whitespace-nowrap'
        >
          {importLoading ? 'Fetching…' : 'Import'}
        </button>
      </div>
      {importError && <div className='text-xs text-red-400'>{importError}</div>}
    </div>
  );

  if (availableReviews.length === 0) {
    return (
      <div className='space-y-3'>
        {importFromUrlSection}
        {Array.from(avToSel.entries())
          .filter(([avIdx]) => avIdx < 0)
          .sort((a, b) => a[1] - b[1])
          .map(([avIdx, selIdx]) => {
            const orphan = selectedReviews[selIdx];
            if (!orphan) return null;
            return (
              <div key={avIdx}>
                <div className='text-[10px] text-yellow-500 mb-1 px-1'>
                  ⚠ Imported/edited review (not in reviews.json)
                </div>
                <SteamReviewCard
                  review={orphan}
                  isSelected={true}
                  selectionIndex={selIdx + 1}
                  editableText={orphan.review}
                  editableHrs={orphan.authorPlaytimeHours}
                  editableTimestamp={orphan.timestamp}
                  editableVotesUp={orphan.votesUp}
                  editableVotedFunny={orphan.votedFunny}
                  onSelect={() => handleSelect(avIdx, orphan)}
                  onMoveUp={selIdx > 0 ? () => handleMoveUp(avIdx) : undefined}
                  onMoveDown={
                    selIdx < selectedReviews.length - 1
                      ? () => handleMoveDown(avIdx)
                      : undefined
                  }
                  onTextChange={(t) => handleTextChange(selIdx, t)}
                  onHrsChange={(h) => handleHrsChange(selIdx, h)}
                  onTimestampChange={(ts) => handleTimestampChange(selIdx, ts)}
                  onVotesUpChange={(v) => handleVotesUpChange(selIdx, v)}
                  onVotedFunnyChange={(f) => handleVotedFunnyChange(selIdx, f)}
                />
              </div>
            );
          })}
        <div className='text-xs text-gray-500 italic'>
          No reviews found for this game in reviews.json.
        </div>
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
      {importFromUrlSection}
      {/* Orphaned reviews: selected but no longer matching any available review
           (e.g. timestamp was edited, or imported from URL). Rendered above the list. */}
      {Array.from(avToSel.entries())
        .filter(([avIdx]) => avIdx < 0)
        .sort((a, b) => a[1] - b[1])
        .map(([avIdx, selIdx]) => {
          const orphan = selectedReviews[selIdx];
          if (!orphan) return null;
          return (
            <div key={avIdx}>
              <div className='text-[10px] text-yellow-500 mb-1 px-1'>
                ⚠ Imported/edited review (not in reviews.json)
              </div>
              <SteamReviewCard
                review={orphan}
                isSelected={true}
                selectionIndex={selIdx + 1}
                editableText={orphan.review}
                editableHrs={orphan.authorPlaytimeHours}
                editableTimestamp={orphan.timestamp}
                editableVotesUp={orphan.votesUp}
                editableVotedFunny={orphan.votedFunny}
                onSelect={() => handleSelect(avIdx, orphan)}
                onMoveUp={selIdx > 0 ? () => handleMoveUp(avIdx) : undefined}
                onMoveDown={
                  selIdx < selectedReviews.length - 1
                    ? () => handleMoveDown(avIdx)
                    : undefined
                }
                onTextChange={(t) => handleTextChange(selIdx, t)}
                onHrsChange={(h) => handleHrsChange(selIdx, h)}
                onTimestampChange={(ts) => handleTimestampChange(selIdx, ts)}
                onVotesUpChange={(v) => handleVotesUpChange(selIdx, v)}
                onVotedFunnyChange={(f) => handleVotedFunnyChange(selIdx, f)}
              />
            </div>
          );
        })}
      {availableReviews.map((review, idx) => {
        const selectionIndex = avToSel.get(idx) ?? -1;
        const isSelected = selectionIndex >= 0;

        // Get the actual editable values from the selected reviews array
        const selectedReview = isSelected
          ? selectedReviews[selectionIndex]
          : undefined;
        const editableText = selectedReview?.review;
        const editableHrs = selectedReview?.authorPlaytimeHours;
        const editableTimestamp = selectedReview?.timestamp;
        const editableVotesUp = selectedReview?.votesUp;
        const editableVotedFunny = selectedReview?.votedFunny;

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
            editableVotedFunny={editableVotedFunny}
            onSelect={() => handleSelect(idx, review)}
            onMoveUp={isSelected ? () => handleMoveUp(idx) : undefined}
            onMoveDown={isSelected ? () => handleMoveDown(idx) : undefined}
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
            onVotedFunnyChange={
              isSelected
                ? (f) => handleVotedFunnyChange(selectionIndex, f)
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
