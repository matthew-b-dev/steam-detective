import { useMemo } from 'react';
import type { SteamGame } from '../types';
import {
  renderCensoredDescription,
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
  const getUncensoredDescription = (text: string) =>
    text.replace(/\|\|(.+?)\|\|/g, '$1');

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
          ? getUncensoredDescription(decodeHtmlEntities(game.shortDescription))
          : censoredDescription}
      </div>
      <textarea
        value={game.shortDescription}
        onChange={(e) => onUpdate({ shortDescription: e.target.value })}
        rows={5}
        className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-400 resize-y'
      />
    </div>
  );
};
