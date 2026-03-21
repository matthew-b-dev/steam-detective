import { useMemo } from 'react';
import type { SteamGame } from '../types';
import {
  renderCensoredDescription,
  renderUncensoredDescription,
  decodeHtmlEntities,
} from '../components/SteamDetective/utils';

interface RefineDescriptionProps {
  game: SteamGame;
  isComplete: boolean;
  onUpdate: (patch: Partial<SteamGame>) => void;
}

export const RefineDescription: React.FC<RefineDescriptionProps> = ({
  game,
  isComplete,
  onUpdate,
}) => {
  const censoredDescription = useMemo(
    () => renderCensoredDescription(decodeHtmlEntities(game.shortDescription)),
    [game.shortDescription],
  );

  return (
    <div className='px-4 py-3'>
      <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px] mb-1'>
        Description:
      </div>
      <div className='text-sm text-gray-200 leading-relaxed max-w-[600px] mb-3'>
        {isComplete
          ? renderUncensoredDescription(
              decodeHtmlEntities(game.shortDescription),
            )
          : censoredDescription}
      </div>
      <p className='text-xs text-zinc-400 mb-1'>
        Tip: text wrapped in{' '}
        <code className='text-zinc-300'>[square brackets]</code> will be
        rendered in gray in the game.
      </p>
      <textarea
        value={game.shortDescription}
        onChange={(e) => onUpdate({ shortDescription: e.target.value })}
        rows={5}
        className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-400 resize-y'
      />
    </div>
  );
};
