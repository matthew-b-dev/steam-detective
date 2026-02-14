import type { SteamGame } from '../types';
import { CensoredSteamGameTitle } from '../components/SteamDetective/CensoredSteamGameTitle';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid';
import { useState } from 'react';
import type { ReactElement } from 'react';

interface RefineTitleProps {
  game: SteamGame;
  isComplete: boolean;
  onUpdate: (patch: Partial<SteamGame>) => void;
}

// Duplicated from ClueTitle to avoid modifying existing components
const renderCensoredText = (text: string): ReactElement[] => {
  const randomizeChar = (char: string): string => {
    if (/[A-Z]/.test(char))
      return String.fromCharCode(65 + Math.floor(Math.random() * 26));
    if (/[a-z]/.test(char))
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    if (/[0-9]/.test(char)) return Math.floor(Math.random() * 10).toString();
    return char;
  };

  const censorText = (t: string): string =>
    t
      .split('')
      .map((c) => randomizeChar(c))
      .join('');

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
        style={{ filter: 'blur(7px)' }}
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

export const RefineTitle: React.FC<RefineTitleProps> = ({
  game,
  isComplete,
  onUpdate,
}) => {
  const [overrideTitleInput, setOverrideTitleInput] = useState(
    game.overrideCensoredTitle ?? '',
  );

  const displayTitle = game.blurTitleAndAsAmpersand
    ? game.name.replace(/\band\b/gi, '&')
    : game.name;

  const handleOverrideTitleBlur = () => {
    const trimmed = overrideTitleInput.trim();
    onUpdate({ overrideCensoredTitle: trimmed || undefined });
  };

  return (
    <div className='px-4 pt-3 pb-1'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex-1 min-w-0'>
          {isComplete ? (
            <div className='text-lg sm:text-xl'>{displayTitle}</div>
          ) : game.overrideCensoredTitle ? (
            <div className='text-lg sm:text-xl'>
              {renderCensoredText(game.overrideCensoredTitle)}
            </div>
          ) : (
            <CensoredSteamGameTitle
              title={game.name}
              blurTitleAndAsAmpersand={game.blurTitleAndAsAmpersand}
            />
          )}
        </div>
        <a
          href={`https://store.steampowered.com/app/${game.appId}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 text-xs text-[#66c0f4] hover:text-white transition-colors shrink-0 ml-3'
        >
          Steam
          <ArrowTopRightOnSquareIcon className='w-3.5 h-3.5' />
        </a>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-xs text-gray-400 shrink-0'>
          Override Censored Title:
        </span>
        <input
          type='text'
          value={overrideTitleInput}
          onChange={(e) => setOverrideTitleInput(e.target.value)}
          onBlur={handleOverrideTitleBlur}
          placeholder='e.g., ||Game|| Title'
          className='flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
        />
      </div>
    </div>
  );
};
