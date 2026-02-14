import type { SteamGame } from '../types';

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

  return (
    <div className='px-4 py-3 max-w-[450px]'>
      <div className='text-gray-400 text-sm mb-2'>
        Popular user-defined tags for this product:
      </div>
      <div className='text-gray-500 text-xs mb-2'>
        Click a tag to toggle blur
      </div>
      <div className='flex flex-wrap gap-[2px]'>
        {game.userTags.slice(0, 10).map((tag, index) => {
          const isBlurred = !isComplete && blurredTags.includes(tag);
          const isInBlurList = blurredTags.includes(tag);
          return (
            <span
              key={index}
              className={`px-2 py-[2px] text-xs rounded-sm cursor-pointer transition-colors ${
                isInBlurList
                  ? 'bg-[rgba(245,103,103,0.3)] text-[#f56767] ring-1 ring-red-500/50'
                  : 'bg-[rgba(103,193,245,0.2)] text-[#67c1f5]'
              }`}
              onClick={() => toggleBlur(tag)}
              title={
                isInBlurList
                  ? 'Will be blurred — click to unblur'
                  : 'Click to blur this tag'
              }
            >
              <span
                style={isBlurred ? { filter: 'blur(4px)' } : undefined}
                className={isBlurred ? 'select-none' : undefined}
              >
                {tag}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
