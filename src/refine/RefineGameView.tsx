import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import MiniSearch from 'minisearch';
import type { SteamGame } from '../types';
import type { SteamGameMap } from '../steam_game_detail';
import { dummyGames } from '../dummy_games';
import { RefineTitle } from './RefineTitle.tsx';
import { SEARCH_DEBOUNCE_MS } from '../components/SteamDetective/utils';
import {
  queryMeaningfulLength,
  SEARCH_FUZZY,
} from '../components/SteamDetective/utils';
import { arabicNumerals, digitNumerals } from '../utils';
import { RefineScreenshots } from './RefineScreenshots.tsx';
import { RefineDescription } from './RefineDescription.tsx';
import { RefineDetails } from './RefineDetails.tsx';
import { RefineTags } from './RefineTags.tsx';
import { RefineReviews } from './RefineReviews.tsx';
import { RefineMoreFromDeveloper } from './RefineMoreFromDeveloper.tsx';
import ThumbsUpIcon from '../assets/thumbsup.svg?react';
import ThumbsDownIcon from '../assets/thumbsdown.svg?react';
import { renderCensoredReview } from '../components/SteamDetective/utils';

interface RefineGameViewProps {
  game: SteamGame;
  allGames: SteamGameMap;
  mode: 'refine' | 'choose';
  closeGuessSeries: string[];
  // eslint-disable-next-line no-unused-vars
  onCloseGuessSeriesChange: (series: string[]) => void;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (patch: Partial<SteamGame>) => void;
}

type ClueType = 'desc' | 'details' | 'tags' | 'ss' | 'review' | 'details+tags';

const CLUE_LABELS: Record<ClueType, string> = {
  desc: 'Description',
  details: 'Details',
  tags: 'Tags',
  ss: 'Screenshot',
  review: 'Review',
  'details+tags': 'Details+Tags',
};

const DEFAULT_CLUE_ORDER: ClueType[] = ['tags', 'details', 'desc'];

const SearchingMessage = () => (
  <div className='flex items-center justify-start gap-2 py-4 px-3 text-sm text-gray-500'>
    <svg
      className='animate-spin h-4 w-4 flex-shrink-0'
      viewBox='0 0 24 24'
      fill='none'
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='3'
        opacity='0.3'
      />
      <path
        d='M12 2a10 10 0 0 1 10 10'
        stroke='currentColor'
        strokeWidth='3'
        strokeLinecap='round'
      />
    </svg>
    <span>Loading...</span>
  </div>
);

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
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearchInput(searchInput),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [searchTermsJson, setSearchTermsJson] = useState(() =>
    game.searchTerms && game.searchTerms.length > 0
      ? JSON.stringify(game.searchTerms)
      : '',
  );

  const clueOrder: ClueType[] = (game.clueOrder ??
    DEFAULT_CLUE_ORDER) as ClueType[];
  const hasSsInOrder = clueOrder.includes('ss');
  const hasReviewInOrder = clueOrder.includes('review');
  // MFD is no longer part of clueOrder — it's always bundled with Details
  const hasMFD = (game.moreFromThisDeveloper?.length ?? 0) > 0;

  // Base order excludes 'review'
  const baseClueOrder = clueOrder.filter((c) => c !== 'review') as ClueType[];
  // 1-indexed position of 'review' within the full clueOrder, or null
  const reviewOrderPosition: number | null = hasReviewInOrder
    ? clueOrder.indexOf('review') + 1
    : null;

  /** Rebuild clueOrder by inserting 'review' back at its position into baseOrder. */
  const rebuildClueOrder = (
    newBase: ClueType[],
    newReviewPos: number | null,
  ): ClueType[] => {
    if (newReviewPos === null) return newBase;
    const result = [...newBase] as ClueType[];
    result.splice(newReviewPos - 1, 0, 'review');
    return result;
  };

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

  // Tokenizer: split on separators, strip remaining non-alphanumeric from each token.
  // Mirrors GameInput's tokenizer so search preview behaves identically to the real game.
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch({
      fields: [
        'name',
        'nameCompact',
        'nameNumerals',
        'nameWordNumerals',
        'searchTerms',
      ],
      idField: 'id',
      tokenize: (text: string) =>
        text
          .split(/[\s\-:._&|()]+/)
          .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
          .filter((t) => t.length > 0),
      processTerm: (term: string) => term.toLowerCase(),
    });
    ms.addAll(
      gameOptions.map((o) => ({
        id: o.value,
        name: o.value,
        nameCompact: o.value.replace(/[-:._'&]+/g, ''),
        nameNumerals: arabicNumerals(o.value),
        nameWordNumerals: digitNumerals(o.value),
        searchTerms: o.searchTerms.join(' '),
      })),
    );
    return ms;
  }, [gameOptions]);

  // Live meaningful length - controls menu open/close immediately.
  const effectiveSearchLength = useMemo(
    () => queryMeaningfulLength(searchInput),
    [searchInput],
  );

  // Debounced meaningful length - gates the actual MiniSearch call.
  const debouncedSearchEffectiveLength = useMemo(
    () => queryMeaningfulLength(debouncedSearchInput),
    [debouncedSearchInput],
  );

  const filteredOptions = useMemo(() => {
    if (!debouncedSearchInput || debouncedSearchEffectiveLength < 3) return [];

    const results = miniSearch.search(debouncedSearchInput, {
      prefix: true,
      fuzzy: SEARCH_FUZZY,
      combineWith: 'AND',
      boost: { name: 2 },
    });

    const queryLower = debouncedSearchInput.toLowerCase();
    const firstToken = queryLower.split(/\s+/)[0];
    const tier = (name: string): number => {
      const nameLower = name.toLowerCase();
      if (nameLower.startsWith(queryLower)) return 0;
      if (nameLower.startsWith(firstToken)) return 1;
      if (
        nameLower.split(/[\s\-:._&|()]+/).some((w) => w.startsWith(firstToken))
      )
        return 2;
      return 3;
    };

    const scoreMap = new Map(results.map((r, i) => [r.id as string, i]));
    return gameOptions
      .filter((o) => scoreMap.has(o.value))
      .sort((a, b) => {
        const ta = tier(a.value);
        const tb = tier(b.value);
        if (ta !== tb) return ta - tb;
        return (scoreMap.get(a.value) ?? 999) - (scoreMap.get(b.value) ?? 999);
      })
      .slice(0, 100);
  }, [
    debouncedSearchInput,
    debouncedSearchEffectiveLength,
    miniSearch,
    gameOptions,
  ]);

  const isSearchPending =
    effectiveSearchLength >= 3 && searchInput !== debouncedSearchInput;

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
    const newBase = [...baseClueOrder] as ClueType[];
    newBase[index] = value;
    onUpdate({
      clueOrder: rebuildClueOrder(newBase, reviewOrderPosition),
    });
  };

  const handleReviewPositionChange = (newPos: number) => {
    onUpdate({
      clueOrder: rebuildClueOrder(baseClueOrder, newPos),
    });
  };

  const hasDetailsTags = clueOrder.includes('details+tags');

  const handleBundleDetailsTagsToggle = (checked: boolean) => {
    if (checked) {
      // Replace the first 'tags' or 'details' entry in baseClueOrder with 'details+tags'
      // and remove the other one.
      const firstIdx = baseClueOrder.findIndex(
        (c) => c === 'tags' || c === 'details',
      );
      const newBase = baseClueOrder.filter(
        (c) => c !== 'tags' && c !== 'details',
      ) as ClueType[];
      newBase.splice(firstIdx >= 0 ? firstIdx : 0, 0, 'details+tags');
      onUpdate({
        clueOrder: rebuildClueOrder(newBase, reviewOrderPosition),
      });
    } else {
      // Replace 'details+tags' with 'tags' then 'details' at its position
      const idx = baseClueOrder.indexOf('details+tags');
      const newBase = [...baseClueOrder] as ClueType[];
      newBase.splice(idx, 1, 'tags', 'details');
      onUpdate({
        clueOrder: rebuildClueOrder(newBase, reviewOrderPosition),
      });
    }
  };

  const handleReviewClueToggle = (checked: boolean) => {
    if (checked) {
      // Enable: insert review at position 4 (or end of baseClueOrder if shorter)
      const defaultPos = Math.min(4, baseClueOrder.length + 1);
      onUpdate({
        clueOrder: rebuildClueOrder(baseClueOrder, defaultPos),
      });
    } else {
      // Disable: remove 'review' from clueOrder and clear both reviewClue and reviewClues
      onUpdate({
        clueOrder: rebuildClueOrder(baseClueOrder, null),
        reviewClue: undefined,
        reviewClues: undefined,
      });
    }
  };

  const handleMFDToggle = (checked: boolean) => {
    if (!checked) {
      onUpdate({ moreFromThisDeveloper: undefined });
    }
    // When checked, data is added via the Fetch button in the MFD panel below
  };

  // Check if refined is checked but difficulty is not set
  const needsDifficulty = !!game.debugRefined && !game.difficulty;

  // Check if clue order has duplicates
  const hasDuplicateClues = new Set(clueOrder).size !== clueOrder.length;

  // Check if 'details+tags' is mixed with standalone 'details' or 'tags'
  const hasInvalidDetailsTags =
    clueOrder.includes('details+tags') &&
    (clueOrder.includes('details') || clueOrder.includes('tags'));

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
              Difficulty Stats - Easy: {difficultyStats.Easy} | Medium:{' '}
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
                <option value=''>-</option>
                <option value='Easy'>Easy</option>
                <option value='Medium'>Medium</option>
                <option value='Hard'>Hard</option>
              </select>
            </div>
          </div>

          {/* Clue order dropdowns */}
          <div
            className={`flex flex-wrap items-center gap-4 rounded-lg px-4 py-3 ${
              hasDuplicateClues || hasInvalidDetailsTags
                ? 'bg-red-900/40'
                : 'bg-[#171a21]'
            }`}
          >
            {Array.from({ length: baseClueOrder.length }, (_, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <span className='text-xs text-gray-400'>Clue #{idx + 1}</span>
                <select
                  value={baseClueOrder[idx] ?? ''}
                  onChange={(e) =>
                    handleClueOrderChange(idx, e.target.value as ClueType)
                  }
                  className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm'
                >
                  {(hasSsInOrder
                    ? ([
                        'desc',
                        'details',
                        'tags',
                        'ss',
                        'details+tags',
                      ] as ClueType[])
                    : ([
                        'desc',
                        'details',
                        'tags',
                        'details+tags',
                      ] as ClueType[])
                  ).map((opt) => (
                    <option key={opt} value={opt}>
                      {CLUE_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {/* Include screenshot checkbox */}
            <label className='flex items-center gap-2 cursor-pointer ml-2'>
              <input
                type='checkbox'
                checked={hasSsInOrder}
                onChange={(e) => {
                  if (e.target.checked) {
                    const withoutSs = baseClueOrder.filter((c) => c !== 'ss');
                    const newBase: ClueType[] = [
                      ...(withoutSs.slice(0, 3) as ClueType[]),
                      'ss' as ClueType,
                    ];
                    onUpdate({
                      clueOrder: rebuildClueOrder(newBase, reviewOrderPosition),
                    });
                  } else {
                    const withoutSs = baseClueOrder
                      .filter((c) => c !== 'ss')
                      .slice(0, 3) as ClueType[];
                    onUpdate({
                      clueOrder: rebuildClueOrder(
                        withoutSs.length === 3 ? withoutSs : DEFAULT_CLUE_ORDER,
                        reviewOrderPosition,
                      ),
                    });
                  }
                }}
                className='w-4 h-4 accent-blue-500'
              />
              <span className='text-xs text-gray-400'>Include screenshot</span>
            </label>
            {/* Bundle Details+Tags checkbox */}
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={hasDetailsTags}
                onChange={(e) =>
                  handleBundleDetailsTagsToggle(e.target.checked)
                }
                className='w-4 h-4 accent-orange-500'
              />
              <span className='text-xs text-orange-300'>
                Bundle Details+Tags
              </span>
            </label>
            {/* Use Review clue checkbox */}
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={hasReviewInOrder}
                onChange={(e) => handleReviewClueToggle(e.target.checked)}
                className='w-4 h-4 accent-purple-500'
              />
              <span className='text-xs text-purple-300'>Use Review clue</span>
            </label>
            {/* Review position dropdown */}
            {hasReviewInOrder && (
              <div className='flex items-center gap-2'>
                <span className='text-xs text-gray-400'>Review @ Clue #</span>
                <select
                  value={reviewOrderPosition ?? 4}
                  onChange={(e) =>
                    handleReviewPositionChange(Number(e.target.value))
                  }
                  className='bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm'
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            )}
            {/* Include More from this Developer checkbox */}
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={hasMFD}
                onChange={(e) => handleMFDToggle(e.target.checked)}
                className='w-4 h-4 accent-teal-500'
              />
              <span className='text-xs text-teal-300'>More from Developer</span>
            </label>
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
              options={isSearchPending ? [] : filteredOptions}
              value={null}
              onChange={() => {}}
              placeholder='Guess the game...'
              isClearable
              inputValue={searchInput}
              onInputChange={setSearchInput}
              menuIsOpen={effectiveSearchLength >= 3}
              isLoading={isSearchPending}
              filterOption={() => true}
              components={{
                IndicatorSeparator: () => null,
                DropdownIndicator: () => null,
                LoadingIndicator: () => null,
                LoadingMessage: SearchingMessage,
                NoOptionsMessage: () => (
                  <div className='py-4 px-3 text-sm text-black text-center'>
                    No results
                  </div>
                ),
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
        {/* More from this Developer section - canonical between tags and review */}
        <div className='bg-[#171a21] rounded-lg px-4 py-4'>
          <div className='text-xs text-gray-400 uppercase tracking-wide mb-3'>
            More from this Developer
          </div>
          <RefineMoreFromDeveloper game={game} onUpdate={onUpdate} />
        </div>
        {/* Reviews section - always shown so you can browse & select */}
        <div className='bg-[#171a21] rounded-lg px-4 py-4'>
          <RefineReviews game={game} onUpdate={onUpdate} />
        </div>
        {/* Review clue preview - canonical last, below all other clues */}
        {(game.reviewClues && game.reviewClues.length > 0) ||
        game.reviewClue ? (
          <div className='px-4 py-3 border-t border-[rgba(255,255,255,0.06)]'>
            <div className='text-gray-400 text-xs uppercase mb-2'>
              Review Clue
              {(game.reviewClues?.length ?? 0) + (game.reviewClue ? 1 : 0) > 1
                ? 's'
                : ''}{' '}
              (position
              {(game.reviewClues?.length ?? 0) + (game.reviewClue ? 1 : 0) > 1
                ? 's'
                : ''}{' '}
              {reviewOrderPosition ?? '?'} in reveal order):
            </div>
            <div className='space-y-2'>
              {(
                game.reviewClues || (game.reviewClue ? [game.reviewClue] : [])
              ).map((review, idx) => (
                <div
                  key={idx}
                  className='rounded-md border border-purple-700/50 bg-purple-900/10 overflow-hidden'
                >
                  {/* Header */}
                  <div className='flex items-start gap-3 px-3 pt-3 pb-2 border-b border-[rgba(255,255,255,0.08)]'>
                    <div
                      className='flex-shrink-0 flex items-center justify-center'
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: review.votedUp ? '#174766' : '#602f35',
                      }}
                    >
                      {review.votedUp ? (
                        <ThumbsUpIcon width={40} height={40} />
                      ) : (
                        <ThumbsDownIcon width={40} height={40} />
                      )}
                    </div>
                    <div className='flex flex-col'>
                      <span
                        className={`text-sm font-bold ${
                          review.votedUp ? 'text-[#66c0f4]' : 'text-[#c94f4f]'
                        }`}
                      >
                        {review.votedUp ? 'Recommended' : 'Not Recommended'}
                        {(game.reviewClues?.length ?? 0) > 1 && (
                          <span className='text-xs ml-2 text-gray-400'>
                            (#{idx + 1})
                          </span>
                        )}
                      </span>
                      <span className='text-[11px] text-gray-400'>
                        {review.authorPlaytimeHours.toLocaleString()} hrs on
                        record
                      </span>
                    </div>
                  </div>
                  <div className='px-3 py-2 text-sm text-gray-300 leading-relaxed'>
                    {revealAll
                      ? review.review
                          .replace(/\|\|(.+?)\|\|/g, '$1')
                          .split('\n')
                          .map((line, i, arr) => (
                            <span key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </span>
                          ))
                      : renderCensoredReview(review.review)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
