import { useState, useRef, useEffect } from 'react';
import type { SteamGame } from '../types';
import { hashSeededCensorText } from '../components/SteamDetective/utils';

interface RefineTagsProps {
  game: SteamGame;
  isComplete: boolean;
  onUpdate: (patch: Partial<SteamGame>) => void;
}

export const RefineTags: React.FC<RefineTagsProps> = ({
  game,
  isComplete,
  onUpdate,
}) => {
  const blurredTags = game.blurredUserTags ?? [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingIndex]);

  const toggleBlur = (tag: string) => {
    const current = [...blurredTags];
    const idx = current.indexOf(tag);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(tag);
    }
    onUpdate({ blurredUserTags: current.length > 0 ? current : undefined });
  };

  const startEdit = (index: number, tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingIndex(index);
    setDraftText(tag);
  };

  const commitEdit = (index: number) => {
    const oldTag = game.userTags[index];
    const newTag = draftText.trim();
    if (newTag && newTag !== oldTag) {
      const newUserTags = [...game.userTags];
      newUserTags[index] = newTag;
      // Keep blurredUserTags in sync — replace old tag name if it was blurred
      const newBlurred = blurredTags.map((t) => (t === oldTag ? newTag : t));
      onUpdate({
        userTags: newUserTags,
        blurredUserTags: newBlurred.length > 0 ? newBlurred : undefined,
      });
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') commitEdit(index);
    if (e.key === 'Escape') setEditingIndex(null);
  };

  return (
    <div className='px-4 py-3 max-w-[450px]'>
      <div className='text-gray-400 text-sm mb-2'>
        Popular user-defined tags for this product:
      </div>
      <div className='text-gray-500 text-xs mb-2'>
        Left-click to toggle blur · Right-click to edit text
      </div>
      <div className='flex flex-wrap gap-[2px]'>
        {game.userTags.slice(0, 10).map((tag, index) => {
          const isBlurred = !isComplete && blurredTags.includes(tag);
          const isInBlurList = blurredTags.includes(tag);
          const displayText = isBlurred ? hashSeededCensorText(tag) : tag;

          if (editingIndex === index) {
            return (
              <input
                key={index}
                ref={inputRef}
                type='text'
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onBlur={() => commitEdit(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`px-2 py-[2px] text-xs rounded-sm outline-none min-w-0 w-28 ${
                  isInBlurList
                    ? 'bg-[rgba(245,103,103,0.3)] text-[#f56767] ring-1 ring-red-500/50'
                    : 'bg-[rgba(103,193,245,0.2)] text-[#67c1f5] ring-1 ring-blue-400/50'
                }`}
              />
            );
          }

          return (
            <span
              key={index}
              className={`px-2 py-[2px] text-xs rounded-sm cursor-pointer transition-colors ${
                isInBlurList
                  ? 'bg-[rgba(245,103,103,0.3)] text-[#f56767] ring-1 ring-red-500/50'
                  : 'bg-[rgba(103,193,245,0.2)] text-[#67c1f5]'
              }`}
              onClick={() => toggleBlur(tag)}
              onContextMenu={(e) => startEdit(index, tag, e)}
              title={
                isInBlurList
                  ? 'Will be blurred - click to unblur | right-click to edit'
                  : 'Click to blur this tag | right-click to edit'
              }
            >
              <span
                style={isBlurred ? { filter: 'blur(5px)' } : undefined}
                className={isBlurred ? 'select-none' : undefined}
              >
                {displayText}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
