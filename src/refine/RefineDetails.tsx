import { useState } from 'react';
import type { SteamGame } from '../types';
import { getReviewColorClass } from '../components/SteamDetective/utils';
import type { ReactElement } from 'react';

interface RefineDetailsProps {
  game: SteamGame;
  isComplete: boolean;
  mode: 'refine' | 'choose';
  onUpdate: (patch: Partial<SteamGame>) => void;
}

// Duplicated censoring helpers to avoid modifying existing components
const censorText = (text: string): string =>
  text
    .split('')
    .map(() => 'B')
    .join('');

const renderCensoredDetailText = (text: string): ReactElement[] => {
  const parts: ReactElement[] = [];
  const pattern = /\|\|(.+?)\|\|/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }
    const censored = censorText(match[1]);
    parts.push(
      <span
        key={`censored-${match.index}`}
        style={{ filter: 'blur(4px)' }}
        className='select-none'
      >
        {censored}
      </span>,
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts;
};

const getUncensoredText = (text: string) =>
  text.replace(/\|\|(.+?)\|\|/g, '$1');

export const RefineDetails: React.FC<RefineDetailsProps> = ({
  game,
  isComplete,
  mode,
  onUpdate,
}) => {
  const [editingField, setEditingField] = useState<
    | 'developer'
    | 'publisher'
    | 'earlyAccessDate'
    | 'reviewRating'
    | 'reviewCount'
    | null
  >(null);
  const [editValue, setEditValue] = useState('');
  const [editReviewRating, setEditReviewRating] = useState('');
  const [editReviewCount, setEditReviewCount] = useState('');

  const startEditing = (
    field: 'developer' | 'publisher' | 'earlyAccessDate',
  ) => {
    setEditingField(field);
    setEditValue(game[field] ?? '');
  };

  const startEditingReviews = () => {
    setEditingField('reviewRating');
    setEditReviewRating(game.allReviewSummary.rating);
    setEditReviewCount(game.allReviewSummary.count.toString());
  };

  const finishEditing = () => {
    if (editingField) {
      const val = editValue.trim();
      onUpdate({ [editingField]: val || undefined });
      setEditingField(null);
      setEditValue('');
    }
  };

  const finishEditingReviews = () => {
    const count = parseInt(editReviewCount, 10);
    if (!isNaN(count) && editReviewRating.trim()) {
      onUpdate({
        allReviewSummary: {
          rating: editReviewRating.trim(),
          count: count,
        },
      });
    }
    setEditingField(null);
    setEditReviewRating('');
    setEditReviewCount('');
  };

  const renderField = (field: 'developer' | 'publisher') => {
    const value = game[field];
    const display = isComplete
      ? getUncensoredText(value)
      : renderCensoredDetailText(value);

    if (editingField === field && mode === 'refine') {
      return (
        <div className='flex items-center gap-2'>
          <input
            type='text'
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm flex-1 font-mono focus:outline-none focus:border-zinc-400'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEditing();
            }}
          />
          <button
            onClick={finishEditing}
            className='px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs font-semibold'
          >
            Done
          </button>
        </div>
      );
    }

    return (
      <span
        className={`text-[#66c0f4] ${mode === 'refine' ? 'cursor-pointer hover:underline' : ''}`}
        onClick={() => mode === 'refine' && startEditing(field)}
        title={mode === 'refine' ? 'Click to edit' : undefined}
      >
        {display}
      </span>
    );
  };

  return (
    <div className='px-4 py-3 max-w-[450px]'>
      {/* All Reviews */}
      <div className='flex items-start gap-2'>
        <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-1'>
          All Reviews:
        </div>
        <div className='flex-1'>
          {editingField === 'reviewRating' && mode === 'refine' ? (
            <div className='flex items-center gap-2'>
              <input
                type='text'
                value={editReviewRating}
                onChange={(e) => setEditReviewRating(e.target.value)}
                placeholder='Rating'
                className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-400'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditingReviews();
                }}
              />
              <span className='text-gray-400'>{'('}</span>
              <input
                type='number'
                value={editReviewCount}
                onChange={(e) => setEditReviewCount(e.target.value)}
                placeholder='Count'
                className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-mono w-28 focus:outline-none focus:border-zinc-400'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditingReviews();
                }}
              />
              <span className='text-gray-400'>{')'}</span>
              <button
                onClick={finishEditingReviews}
                className='px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs font-semibold'
              >
                Done
              </button>
            </div>
          ) : (
            <div className='flex gap-1'>
              <div
                className={`text-sm ${
                  mode === 'refine' ? 'cursor-pointer hover:underline' : ''
                } ${getReviewColorClass(game.allReviewSummary.rating)}`}
                onClick={() => mode === 'refine' && startEditingReviews()}
                title={mode === 'refine' ? 'Click to edit' : undefined}
              >
                {game.allReviewSummary.rating}{' '}
                <span className='text-[#bcc6ce] text-sm'>
                  ({game.allReviewSummary.count.toLocaleString()})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Early Access Date */}
      {(game.earlyAccessDate || mode === 'refine') && (
        <div className='flex items-start gap-2 mt-4'>
          <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
            Early Access Date:
          </div>
          <div className='text-[#c7d5e0] text-sm flex-1'>
            {editingField === 'earlyAccessDate' && mode === 'refine' ? (
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder='e.g. Mar 23, 2020'
                  className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm flex-1 font-mono focus:outline-none focus:border-zinc-400'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing();
                    if (e.key === 'Escape') {
                      setEditingField(null);
                      setEditValue('');
                    }
                  }}
                />
                <button
                  onClick={finishEditing}
                  className='px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs font-semibold'
                >
                  Done
                </button>
              </div>
            ) : game.earlyAccessDate ? (
              <span
                className={
                  mode === 'refine' ? 'cursor-pointer hover:underline' : ''
                }
                onClick={() =>
                  mode === 'refine' && startEditing('earlyAccessDate')
                }
                title={mode === 'refine' ? 'Click to edit' : undefined}
              >
                {game.earlyAccessDate}
              </span>
            ) : (
              <button
                onClick={() => startEditing('earlyAccessDate')}
                className='text-xs text-blue-400 hover:text-blue-300 border border-blue-700 hover:border-blue-500 rounded px-2 py-0.5'
              >
                + Add Early Access Date
              </button>
            )}
          </div>
        </div>
      )}

      {/* Release Date */}
      <div
        className={`flex items-start gap-2 ${game.earlyAccessDate ? 'mt-2' : 'mt-4'}`}
      >
        <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
          Release Date:
        </div>
        <div className='text-[#c7d5e0] text-sm'>{game.releaseDate}</div>
      </div>

      {/* Developer */}
      <div className='flex items-start gap-2 mt-5'>
        <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
          Developer:
        </div>
        <div className='text-sm'>{renderField('developer')}</div>
      </div>

      {/* Publisher */}
      <div className='flex items-start gap-2'>
        <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
          Publisher:
        </div>
        <div className='text-sm'>{renderField('publisher')}</div>
      </div>
    </div>
  );
};
