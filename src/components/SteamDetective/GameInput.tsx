import { useState, useMemo } from 'react';
import Select from 'react-select';
import { steamGameDetails } from '../../steam_game_detail';
import type { MissedGuess } from '../../utils';

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

  // Create game options for react-select
  const gameOptions: GameOption[] = useMemo(() => {
    // Get all steam game names with searchTerms
    const allGames = Object.values(steamGameDetails).map((game) => ({
      name: game.name,
      searchTerms: game.searchTerms || [],
    }));

    // Filter out previously guessed games
    const previousGuessNames = previousGuesses.map((g) => g.name);
    const previousGuessesSet = new Set(previousGuessNames);
    const availableGames = allGames.filter(
      (game) => !previousGuessesSet.has(game.name),
    );

    // Convert to options format and sort alphabetically by name
    return availableGames
      .map((game) => ({
        value: game.name,
        label: game.name,
        searchTerms: game.searchTerms,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [previousGuesses]);

  // Calculate effective length by excluding ": " if the query starts with ":"
  const effectiveLength = useMemo(() => {
    let length = inputValue.length;
    if (inputValue.startsWith(':') && inputValue.startsWith(': ')) {
      length = inputValue.length - 2; // Exclude the ": " prefix
    }
    return length;
  }, [inputValue]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue || effectiveLength < 3) return [];

    const searchLower = inputValue.toLowerCase();
    return gameOptions.filter((option) => {
      const matchesLabel = option.label.toLowerCase().includes(searchLower);
      const matchesSearchTerms = option.searchTerms?.some((term) =>
        term.toLowerCase().includes(searchLower),
      );
      return matchesLabel || matchesSearchTerms;
    });
  }, [inputValue, effectiveLength, gameOptions]);

  const handleChange = (selected: GameOption | null) => {
    onGuess(selected);
    setGuess(null);
    setInputValue('');
  };

  return (
    <div className='mb-3'>
      <Select
        options={filteredOptions}
        value={guess}
        onChange={handleChange}
        placeholder='Guess the game...'
        isClearable
        inputValue={inputValue}
        onInputChange={setInputValue}
        menuIsOpen={effectiveLength >= 3}
        filterOption={() => true}
        isDisabled={disabled}
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
  );
};
