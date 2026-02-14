import { useState, useMemo } from 'react';
import Select from 'react-select';
import type { SteamGame } from '../types';
import type { SteamGameMap } from '../steam_game_detail';
import { dummyGames } from '../dummy_games';
import { RefineTitle } from './RefineTitle.tsx';
import { RefineScreenshots } from './RefineScreenshots.tsx';
import { RefineDescription } from './RefineDescription.tsx';
import { RefineDetails } from './RefineDetails.tsx';
import { RefineTags } from './RefineTags.tsx';

interface RefineGameViewProps {
  game: SteamGame;
  allGames: SteamGameMap;
  mode: 'refine' | 'choose';
  closeGuessSeries: string[];
  onCloseGuessSeriesChange: (series: string[]) => void;
  onUpdate: (patch: Partial<SteamGame>) => void;
}

type ClueType = 'desc' | 'details' | 'tags';

const CLUE_LABELS: Record<ClueType, string> = {
  desc: 'Description',
  details: 'Details',
  tags: 'Tags',
};

const DEFAULT_CLUE_ORDER: ClueType[] = ['desc', 'tags', 'details'];

export const RefineGameView: React.FC<RefineGameViewProps> = ({
  game,
  allGames,
  mode,
  closeGuessSeries,
  onCloseGuessSeriesChange,
  onUpdate,
}) => {
  const [revealAll, setRevealAll] = useState(false);
  const [seriesJson, setSeriesJson] = useState(() =>
    JSON.stringify(closeGuessSeries),
  );
  const [searchInput, setSearchInput] = useState('');
  const [searchTermsJson, setSearchTermsJson] = useState(() =>
    game.searchTerms && game.searchTerms.length > 0
      ? JSON.stringify(game.searchTerms)
      : '',
  );

  const clueOrder: ClueType[] = game.clueOrder ?? DEFAULT_CLUE_ORDER;

  // Build game options for react-select (same logic as GameInput)
  const gameOptions = useMemo(() => {
    const allGameNames = new Set<string>();
    const gameMap = new Map<string, string[]>();

    Object.values(allGames).forEach((g) => {
      allGameNames.add(g.name);
      gameMap.set(g.name, g.searchTerms || []);
    });

    dummyGames.forEach((name) => {
      if (!allGameNames.has(name)) {
        allGameNames.add(name);
        gameMap.set(name, []);
      }
    });

    return Array.from(allGameNames)
      .map((name) => ({
        value: name,
        label: name,
        searchTerms: gameMap.get(name) || [],
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allGames]);

  const effectiveSearchLength = useMemo(() => {
    let length = searchInput.length;
    if (searchInput.startsWith(': ')) length -= 2;
    return length;
  }, [searchInput]);

  const filteredOptions = useMemo(() => {
    if (!searchInput || effectiveSearchLength < 3) return [];
    const lower = searchInput.toLowerCase();
    return gameOptions.filter((opt) => {
      const matchesLabel = opt.label.toLowerCase().includes(lower);
      const matchesSearch = opt.searchTerms.some((t) =>
        t.toLowerCase().includes(lower),
      );
      return matchesLabel || matchesSearch;
    });
  }, [searchInput, effectiveSearchLength, gameOptions]);

  const handleSeriesJsonBlur = () => {
    try {
      const parsed = JSON.parse(seriesJson);
      if (
        Array.isArray(parsed) &&
        parsed.every((s: unknown) => typeof s === 'string')
      ) {
        onCloseGuessSeriesChange(parsed);
      }
    } catch {
      // ignore invalid json
    }
  };

  const handleSearchTermsBlur = () => {
    const trimmed = searchTermsJson.trim();
    if (!trimmed) {
      onUpdate({ searchTerms: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (
        Array.isArray(parsed) &&
        parsed.every((s: unknown) => typeof s === 'string')
      ) {
        onUpdate({ searchTerms: parsed.length > 0 ? parsed : undefined });
      }
    } catch {
      // ignore invalid json
    }
  };

  const handleCheckbox = (
    field: 'debugDelete' | 'debugProcessed' | 'debugRefined',
    checked: boolean,
  ) => {
    onUpdate({ [field]: checked ? true : undefined } as Partial<SteamGame>);
  };

  const handleClueOrderChange = (index: number, value: ClueType) => {
    const newOrder = [...clueOrder];
    newOrder[index] = value;
    onUpdate({ clueOrder: newOrder });
  };

  // Check if refined is checked but difficulty is not set
  const needsDifficulty = !!game.debugRefined && !game.difficulty;

  // Check if clue order has duplicates
  const hasDuplicateClues = new Set(clueOrder).size !== clueOrder.length;

  // Calculate difficulty stats across all games
  const difficultyStats = useMemo(() => {
    const stats = { Easy: 0, Medium: 0, Hard: 0, NotSet: 0 };
    Object.values(allGames).forEach((g) => {
      if (g.difficulty === 'Easy') stats.Easy++;
      else if (g.difficulty === 'Medium') stats.Medium++;
      else if (g.difficulty === 'Hard') stats.Hard++;
      else stats.NotSet++;
    });
    return stats;
  }, [allGames]);

  return (
    <div className='space-y-6'>
      {mode === 'refine' && (
        <>
          {/* Difficulty Stats */}
          <div className='bg-[#171a21] rounded-lg px-4 py-2'>
            <span className='text-xs text-gray-400'>
              Difficulty Stats — Easy: {difficultyStats.Easy} | Medium:{' '}
              {difficultyStats.Medium} | Hard: {difficultyStats.Hard} | Not Set:{' '}
              {difficultyStats.NotSet}
            </span>
          </div>

          {/* Checkboxes row */}
          <div
            className={`flex items-center gap-6 rounded-lg px-4 py-3 ${
              needsDifficulty ? 'bg-red-900/40' : 'bg-[#171a21]'
            }`}
          >
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={!!game.debugDelete}
                onChange={(e) =>
                  handleCheckbox('debugDelete', e.target.checked)
                }
                className='w-4 h-4 accent-red-500'
              />
              <span className='text-red-400 text-sm font-semibold'>Delete</span>
            </label>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={!!game.debugProcessed}
                onChange={(e) =>
                  handleCheckbox('debugProcessed', e.target.checked)
                }
                className='w-4 h-4 accent-yellow-500'
              />
              <span className='text-yellow-400 text-sm font-semibold'>
                Processed
              </span>
            </label>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={!!game.debugRefined}
                onChange={(e) =>
                  handleCheckbox('debugRefined', e.target.checked)
                }
                className='w-4 h-4 accent-green-500'
              />
              <span className='text-green-400 text-sm font-semibold'>
                Refined
              </span>
            </label>
            <div className='flex items-center gap-2 ml-auto'>
              <span className='text-xs text-gray-400'>Difficulty</span>
              <select
                value={game.difficulty ?? ''}
                onChange={(e) =>
                  onUpdate({ difficulty: e.target.value || undefined })
                }
                className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm'
              >
                <option value=''>—</option>
                <option value='Easy'>Easy</option>
                <option value='Medium'>Medium</option>
                <option value='Hard'>Hard</option>
              </select>
            </div>
          </div>

          {/* Clue order dropdowns */}
          <div
            className={`flex items-center gap-4 rounded-lg px-4 py-3 ${
              hasDuplicateClues ? 'bg-red-900/40' : 'bg-[#171a21]'
            }`}
          >
            {[0, 1, 2].map((idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <span className='text-xs text-gray-400'>Clue #{idx + 1}</span>
                <select
                  value={clueOrder[idx]}
                  onChange={(e) =>
                    handleClueOrderChange(idx, e.target.value as ClueType)
                  }
                  className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm'
                >
                  {(['desc', 'details', 'tags'] as ClueType[]).map((opt) => (
                    <option key={opt} value={opt}>
                      {CLUE_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Close Guess Series */}
          <div className='bg-[#171a21] rounded-lg px-4 py-3'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-xs text-gray-400'>Close Guess Series</span>
            </div>
            <input
              type='text'
              value={seriesJson}
              onChange={(e) => setSeriesJson(e.target.value)}
              onBlur={handleSeriesJsonBlur}
              className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
            />
          </div>

          {/* Game search preview */}
          <div className='bg-[#171a21] rounded-lg px-4 py-3'>
            <div className='text-xs text-gray-400 mb-1'>Search Preview</div>
            <Select
              options={filteredOptions}
              value={null}
              onChange={() => {}}
              placeholder='Guess the game...'
              isClearable
              inputValue={searchInput}
              onInputChange={setSearchInput}
              menuIsOpen={effectiveSearchLength >= 3}
              filterOption={() => true}
              components={{
                IndicatorSeparator: () => null,
                DropdownIndicator: () => null,
              }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: provided.backgroundColor,
                }),
                option: (provided, state) => ({
                  ...provided,
                  color: 'black',
                  backgroundColor: state.isFocused ? '#e6e6e6' : 'white',
                  textAlign: 'left',
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: 'black',
                  textAlign: 'left',
                }),
                input: (provided) => ({
                  ...provided,
                  color: 'black',
                  textAlign: 'left',
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: 'white',
                }),
                placeholder: (provided) => ({
                  ...provided,
                  textAlign: 'left',
                }),
                valueContainer: (provided) => ({
                  ...provided,
                  textAlign: 'left',
                }),
              }}
            />
          </div>

          {/* Search Terms */}
          <div className='bg-[#171a21] rounded-lg px-4 py-3'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-xs text-gray-400'>Search Terms</span>
              <span className='text-xs text-gray-600'>
                e.g. ["dota II", "dota2"]
              </span>
            </div>
            <input
              type='text'
              value={searchTermsJson}
              onChange={(e) => setSearchTermsJson(e.target.value)}
              onBlur={handleSearchTermsBlur}
              placeholder='["alias1", "alias2"]'
              className='w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-400'
            />
          </div>
        </>
      )}

      {/* Difficulty display (choose mode only) */}
      {mode === 'choose' && (
        <>
          <div className='bg-[#171a21] rounded-lg px-4 py-3'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-400'>Difficulty:</span>
              <span
                className={`text-sm font-semibold ${
                  game.difficulty === 'Easy'
                    ? 'text-green-400'
                    : game.difficulty === 'Medium'
                      ? 'text-yellow-400'
                      : game.difficulty === 'Hard'
                        ? 'text-red-400'
                        : 'text-gray-500'
                }`}
              >
                {game.difficulty ?? 'Not Set'}
              </span>
            </div>
          </div>

          <div className='bg-[#171a21] rounded-lg px-4 py-3'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-400'>Clue Order:</span>
              <span className='text-sm text-gray-300'>
                {clueOrder.map((clue, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' → '}
                    <span className='font-semibold'>{CLUE_LABELS[clue]}</span>
                  </span>
                ))}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Reveal toggle */}
      <div className='flex items-center gap-3'>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={revealAll}
            onChange={(e) => setRevealAll(e.target.checked)}
            className='w-4 h-4 accent-blue-500'
          />
          <span className='text-sm text-gray-300'>
            Reveal all (show uncensored)
          </span>
        </label>
      </div>

      {/* Case file preview */}
      <div className='bg-[#17222f] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,1)] overflow-hidden'>
        {/* Title */}
        <RefineTitle game={game} isComplete={revealAll} onUpdate={onUpdate} />

        {/* Screenshots */}
        <RefineScreenshots
          game={game}
          isComplete={revealAll}
          onUpdate={onUpdate}
        />

        {/* Description */}
        <RefineDescription
          game={game}
          isComplete={revealAll}
          onUpdate={onUpdate}
        />

        {/* Details */}
        <RefineDetails
          game={game}
          isComplete={revealAll}
          mode={mode}
          onUpdate={onUpdate}
        />

        {/* User Tags */}
        <RefineTags game={game} isComplete={revealAll} onUpdate={onUpdate} />
      </div>
    </div>
  );
};
