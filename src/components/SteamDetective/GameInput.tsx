import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import MiniSearch from 'minisearch';
import { allGameNames, gameSearchTerms } from '../../all_game_names.generated';
import type { MissedGuess } from '../../utils';
import { SEARCH_DEBOUNCE_MS } from './utils';

// Common words that are valid searches but match hundreds of games — cap for performance
const NOISY_WORDS = new Set(['the']);

// Split on common separators, then strip remaining non-alphanumeric chars from each token.
// "Assassin's" → "assassins", "Half-Life" → ["half","life"], "NieR:Automata" → ["nier","automata"]
const tokenize = (text: string): string[] =>
  text
    .split(/[\s\-:._&|()]+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((t) => t.length > 0);

// Build index once at module load — all games, keyed by name, indexing both the name and
// any explicit searchTerms aliases (e.g. "assassins creed", "hades 2", "osrs").
const gameSearch = new MiniSearch({
  fields: ['name', 'searchTerms'],
  idField: 'id',
  tokenize,
  processTerm: (term: string) => term.toLowerCase(),
});

gameSearch.addAll(
  allGameNames.map((name) => ({
    id: name,
    name,
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
}

export const GameInput: React.FC<GameInputProps> = ({
  onGuess,
  disabled,
  previousGuesses = [],
}) => {
  const [guess, setGuess] = useState<GameOption | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Track previously guessed games to exclude from results
  const guessedNames = useMemo(
    () => new Set(previousGuesses.map((g) => g.name)),
    [previousGuesses],
  );

  // Effective length of the *live* input — controls menu open/close instantly.
  // Excludes a leading ": " so players can't cheaply surface all "Game: The Subtitle"
  // games by typing ": T" (3 chars total, only 1 meaningful char).
  const effectiveLength = useMemo(() => {
    let length = inputValue.length;
    if (inputValue.startsWith(':') && inputValue.startsWith(': ')) {
      length = inputValue.length - 2;
    }
    return length;
  }, [inputValue]);

  // Effective length of the debounced input — controls when search actually runs.
  const debouncedEffectiveLength = useMemo(() => {
    let length = debouncedInput.length;
    if (debouncedInput.startsWith(':') && debouncedInput.startsWith(': ')) {
      length = debouncedInput.length - 2;
    }
    return length;
  }, [debouncedInput]);

  const filteredOptions = useMemo(() => {
    if (!debouncedInput || debouncedEffectiveLength < 3) return [];

    let results = gameSearch.search(debouncedInput, {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
      boost: { name: 2 },
    });

    results = results.filter((r) => !guessedNames.has(r.id as string));

    if (NOISY_WORDS.has(debouncedInput.trim().toLowerCase())) {
      results = results.slice(0, 100);
    }

    // Post-sort: prefer titles that start with the query over fuzzy/substring matches.
    // Tier 0: title starts with the full query string ("border" → "Borderlands")
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

    return results
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const ta = tier(a.r.id as string);
        const tb = tier(b.r.id as string);
        if (ta !== tb) return ta - tb;
        return a.i - b.i; // preserve MiniSearch score order within tier
      })
      .map(({ r }) => ({
        value: r.id as string,
        label: r.id as string,
        searchTerms: gameSearchTerms[r.id as string] ?? [],
      }));
  }, [debouncedInput, debouncedEffectiveLength, guessedNames]);

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
            <div className='py-4 px-3 text-sm text-black text-center'>No results</div>
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
