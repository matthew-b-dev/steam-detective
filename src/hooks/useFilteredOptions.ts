import { useMemo } from 'react';
import type { SteamGame } from '../types';
import type { MissedGuess } from '../utils';

// Helper function to normalize strings by removing accents
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

interface GameOption {
  value: string;
  label: string;
  searchTerms: string[];
}

interface UseFilteredOptionsProps {
  steamGames: SteamGame[];
  inputValue: string;
  missedGuesses: MissedGuess[];
}

export const useFilteredOptions = ({
  steamGames,
  inputValue,
  missedGuesses,
}: UseFilteredOptionsProps): {
  filteredOptions: GameOption[];
  nonSpecialCharCount: number;
} => {
  const gameOptions = useMemo(
    () =>
      steamGames
        .map((g) => ({
          value: g.name,
          label: g.name,
          searchTerms: g.searchTerms || [],
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [steamGames],
  );

  const guessedNames = useMemo(
    () => new Set(missedGuesses.map((g) => g.name)),
    [missedGuesses],
  );

  const nonSpecialCharCount = inputValue.replace(/[:-]/g, '').length;

  const filteredOptions = useMemo(() => {
    if (nonSpecialCharCount < 3) return [];

    const normalizedInput = normalizeString(inputValue);

    return gameOptions.filter((opt) => {
      const normalizedLabel = normalizeString(opt.label);
      const matchesLabel = normalizedLabel.includes(normalizedInput);
      const matchesSearchTerms = opt.searchTerms?.some((term: string) =>
        normalizeString(term).includes(normalizedInput),
      );
      return (
        (matchesLabel || matchesSearchTerms) && !guessedNames.has(opt.value)
      );
    });
  }, [gameOptions, inputValue, nonSpecialCharCount, guessedNames]);

  return { filteredOptions, nonSpecialCharCount };
};
