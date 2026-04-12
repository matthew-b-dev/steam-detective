import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import MiniSearch from 'minisearch';
import { allGameNames, gameSearchTerms } from '../../all_game_names.generated';
import { arabicNumerals, digitNumerals, type MissedGuess } from '../../utils';
import {
  SEARCH_DEBOUNCE_MS,
  queryMeaningfulLength,
  SEARCH_FUZZY,
} from './utils';

// Split on common separators, then strip remaining non-alphanumeric chars from each token.
// "Assassin's" -> "assassins", "Half-Life" -> ["half","life"], "NieR:Automata" -> ["nier","automata"]
const tokenize = (text: string): string[] =>
  text
    .split(/[\s\-:._&|()]+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((t) => t.length > 0);

// Compact form of a name: strips joining punctuation without splitting on it.
// "Hi-Fi Rush" -> "HiFi Rush", "Watch_Dogs" -> "WatchDogs", "NieR:Automata" -> "NierAutomata"
// This lets players type "hifi rush" or "watchdogs" and still find the game.
const compactName = (name: string): string => name.replace(/[-:._'&]+/g, '');

// Hardcoded query -> pinned-result exceptions.
// When the trimmed, lowercased query exactly matches a key, that game is forced to the top.
const RESULT_OVERRIDES: Record<string, string> = {
  'outer worlds': 'The Outer Worlds',
  'lord of the': 'The Lord of the Rings Online',
  'lord of the rings': 'The Lord of the Rings Online',
  'the lord of': 'The Lord of the Rings Online',
  'the lord of the': 'The Lord of the Rings Online',
  'the lord of the rings': 'The Lord of the Rings Online',
};

// Build index once at module load - all games, keyed by name, indexing both the name and
// any explicit searchTerms aliases (e.g. "assassins creed", "hades 2", "osrs").
const gameSearch = new MiniSearch({
  fields: [
    'name',
    'nameCompact',
    'nameNumerals',
    'nameWordNumerals',
    'searchTerms',
  ],
  idField: 'id',
  tokenize,
  processTerm: (term: string) => term.toLowerCase(),
});

gameSearch.addAll(
  allGameNames.map((name) => ({
    id: name,
    name,
    nameCompact: compactName(name),
    nameNumerals: arabicNumerals(name),
    nameWordNumerals: digitNumerals(name),
    searchTerms: (gameSearchTerms[name] ?? []).join(' '),
  })),
);

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

export interface GameOption {
  value: string;
  label: string;
  searchTerms?: string[];
}

interface GameInputProps {
  // eslint-disable-next-line no-unused-vars
  onGuess: (selected: GameOption | null) => void;
  disabled?: boolean;
  previousGuesses?: MissedGuess[];
  excludeOptions?: string[];
}

export const GameInput: React.FC<GameInputProps> = ({
  onGuess,
  disabled,
  previousGuesses = [],
  excludeOptions,
}) => {
  const [guess, setGuess] = useState<GameOption | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedInput(inputValue),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Track previously guessed games to exclude from results
  const guessedNames = useMemo(
    () => new Set(previousGuesses.map((g) => g.name)),
    [previousGuesses],
  );

  // Meaningful char count of the live input - controls menu open/close instantly.
  // Uses queryMeaningfulLength so padding tricks ("mi ", "m-i", ":mi") can't
  // bypass the 3-char minimum with fewer than 3 real alphanumeric characters.
  const effectiveLength = useMemo(
    () => queryMeaningfulLength(inputValue),
    [inputValue],
  );

  // Same check on the debounced value - gates the actual MiniSearch call.
  const debouncedEffectiveLength = useMemo(
    () => queryMeaningfulLength(debouncedInput),
    [debouncedInput],
  );

  const filteredOptions = useMemo(() => {
    if (!debouncedInput || debouncedEffectiveLength < 3) return [];

    let results = gameSearch.search(debouncedInput, {
      prefix: true,
      fuzzy: SEARCH_FUZZY,
      combineWith: 'AND',
      boost: { name: 2 },
    });

    results = results.filter((r) => !guessedNames.has(r.id as string));

    if (excludeOptions && excludeOptions.length > 0) {
      const excludeSet = new Set(excludeOptions);
      results = results.filter((r) => !excludeSet.has(r.id as string));
    }

    // Post-sort: prefer titles that start with the query over fuzzy/substring matches.
    // Tier 0: title starts with the full query string ("border" -> "Borderlands")
    // Tier 1: title starts with the first query token (handles multi-word queries)
    // Tier 2: any word inside the title starts with the first query token
    // Tier 3: everything else (fuzzy matches like "New Order" matching "border")
    // Within each tier, MiniSearch BM25 score (result array order) is the tiebreaker.
    const queryLower = debouncedInput.toLowerCase();
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

    const pinnedName = RESULT_OVERRIDES[queryLower.trim()];

    return results
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        // Pinned override always goes first
        if (pinnedName) {
          if (a.r.id === pinnedName) return -1;
          if (b.r.id === pinnedName) return 1;
        }
        const ta = tier(a.r.id as string);
        const tb = tier(b.r.id as string);
        if (ta !== tb) return ta - tb;
        return a.i - b.i;
      })
      .map(({ r }) => ({
        value: r.id as string,
        label: r.id as string,
        searchTerms: gameSearchTerms[r.id as string] ?? [],
      }))
      .slice(0, 100);
  }, [debouncedInput, debouncedEffectiveLength, guessedNames, excludeOptions]);

  // Show spinner while the user is typing but the debounce hasn't settled yet.
  const isSearchPending = effectiveLength >= 3 && inputValue !== debouncedInput;

  const handleChange = (selected: GameOption | null) => {
    onGuess(selected);
    setGuess(null);
    setInputValue('');
    setDebouncedInput('');
  };

  return (
    <div className='mb-3'>
      <Select
        options={isSearchPending ? [] : filteredOptions}
        value={guess}
        onChange={handleChange}
        placeholder='Guess the game...'
        isClearable
        inputValue={inputValue}
        onInputChange={setInputValue}
        menuIsOpen={effectiveLength >= 3}
        isLoading={isSearchPending}
        filterOption={() => true}
        isDisabled={disabled}
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
  );
};
