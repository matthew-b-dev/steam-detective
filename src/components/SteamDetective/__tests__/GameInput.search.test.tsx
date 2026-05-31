import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { GameInput } from '../GameInput';
import { STEAM_DETECTIVE_DEMO_DAYS } from '../../../demos';

vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>();
  return { ...actual, SEARCH_DEBOUNCE_MS: 0 };
});

// Build the test matrix: one entry per unique game name across all demo days
const uniqueDemoGames: string[] = [
  ...new Set(
    Object.values(STEAM_DETECTIVE_DEMO_DAYS).flatMap((day) =>
      (
        [day.caseFile1, day.caseFile2, day.caseFile3, day.caseFile4] as (
          | string
          | undefined
        )[]
      ).filter((name): name is string => name !== undefined),
    ),
  ),
].sort();

// Games with special characters for special character stripping tests
const gamesWithSpecialCharacters: string[] = uniqueDemoGames.filter(
  (name) => name.includes(':') || name.includes("'") || name.includes('-'),
);

const ROMAN_TO_ARABIC: Record<string, string> = {
  II: '2',
  III: '3',
  IV: '4',
  V: '5',
  VI: '6',
  VII: '7',
  VIII: '8',
  IX: '9',
  X: '10',
  XI: '11',
  XII: '12',
  XIII: '13',
  XIV: '14',
  XV: '15',
  XVI: '16',
  XVII: '17',
  XVIII: '18',
  XIX: '19',
  XX: '20',
};

const ROMAN_PATTERN = new RegExp(
  `\\b(${Object.keys(ROMAN_TO_ARABIC).join('|')})\\b`,
  'g',
);

// find games with roman numerals
const gamesWithRomanNumerals: Array<{
  original: string;
  arabicVersion: string;
}> = uniqueDemoGames
  .map((name) => {
    const match = name.match(ROMAN_PATTERN);
    if (match && match.length > 0) {
      const arabicVersion = name.replace(
        ROMAN_PATTERN,
        (m) => ROMAN_TO_ARABIC[m],
      );
      return { original: name, arabicVersion };
    }
    return null;
  })
  .filter((x): x is { original: string; arabicVersion: string } => x !== null);

// tests
describe('GameInput search - all games should be surfacable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(uniqueDemoGames.map((name) => [name]))(
    'searching "%s" surfaces it in results',
    (gameName) => {
      render(<GameInput onGuess={vi.fn()} />);
      const input = screen.getByRole('combobox');

      act(() => {
        fireEvent.change(input, { target: { value: gameName } });
      });

      expect(screen.queryByRole('option')).toBeNull();

      act(() => {
        vi.runAllTimers();
      });

      const options = screen.getAllByRole('option');

      // At least one result must be present.
      expect(options.length).toBeGreaterThanOrEqual(1);

      // The target game must appear somewhere in the list.
      const labels = options.map((el) => el.textContent?.trim() ?? '');
      expect(labels).toContain(gameName);
    },
  );

  it.each(gamesWithSpecialCharacters.map((name) => [name]))(
    'searching "%s" without special characters still surfaces the result',
    (gameName) => {
      render(<GameInput onGuess={vi.fn()} />);
      const input = screen.getByRole('combobox');

      // Search without special characters: : ' -
      const queryWithoutSpecialChars = gameName
        .replace(/:/g, '')
        .replace(/'/g, '')
        .replace(/-/g, '');

      act(() => {
        fireEvent.change(input, {
          target: { value: queryWithoutSpecialChars },
        });
      });

      expect(screen.queryByRole('option')).toBeNull();

      act(() => {
        vi.runAllTimers();
      });

      const options = screen.getAllByRole('option');

      // At least one result must be present.
      expect(options.length).toBeGreaterThanOrEqual(1);

      // The original game must appear in the results even though we searched without special characters.
      const labels = options.map((el) => el.textContent?.trim() ?? '');
      expect(labels).toContain(gameName);
    },
  );

  it.each(
    gamesWithRomanNumerals.map(({ original, arabicVersion }) => [
      original,
      arabicVersion,
    ]),
  )(
    'searching "%s" with arabic numeral "%s" surfaces the roman numeral version',
    (gameName, arabicVersion) => {
      render(<GameInput onGuess={vi.fn()} />);
      const input = screen.getByRole('combobox');

      act(() => {
        fireEvent.change(input, { target: { value: arabicVersion } });
      });

      expect(screen.queryByRole('option')).toBeNull();

      act(() => {
        vi.runAllTimers();
      });

      const options = screen.getAllByRole('option');

      // At least one result must be present.
      expect(options.length).toBeGreaterThanOrEqual(1);

      // The original game with roman numeral must appear in the results.
      const labels = options.map((el) => el.textContent?.trim() ?? '');
      expect(labels).toContain(gameName);
    },
  );
});
