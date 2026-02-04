import type { ReactElement } from 'react';
import { useMemo } from 'react';

// Characters that should not be encrypted
const UNENCRYPTED_CHARS = [':', ',', '-'];

// Helper to check if a word is a Roman numeral
const isRomanNumeral = (word: string): boolean => {
  return /^(M{0,4})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(
    word,
  );
};

// Helper to generate random uppercase letter
const randomUppercase = (): string => {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
};

// Helper to process a single word
const processTitleWord = (
  word: string,
  getRandomLetter: () => string,
): ReactElement => {
  // If word is just special characters, return as-is
  if (UNENCRYPTED_CHARS.includes(word)) {
    return (
      <span key={`special-${word}`} className='mx-5'>
        {word}
      </span>
    );
  }

  // If word is single character/number, censor it entirely
  if (word.length === 1) {
    const isNumber = /^\d$/.test(word);
    return (
      <span key={`word-${word}`} className={isNumber ? 'mx-3' : 'mx-1'}>
        <span style={{ filter: 'blur(7px)' }} className='select-none font-mono'>
          {getRandomLetter()}
        </span>
      </span>
    );
  }

  // If word is purely numeric, add extra margins
  const isNumericWord = /^\d+$/.test(word);

  // Check if word is a Roman numeral (strip trailing punctuation first)
  const alphanumericPart = word.replace(/[^a-zA-Z0-9]+$/, '');
  const isRoman = isRomanNumeral(alphanumericPart);

  // Process multi-character word
  const chars: ReactElement[] = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];

    // First character stays as-is (unless it's a numeric word or Roman numeral)
    if (i === 0 && !isNumericWord && !isRoman) {
      chars.push(<span key={`char-${i}`}>{char}</span>);
    } else if (UNENCRYPTED_CHARS.includes(char)) {
      // Special characters stay as-is with extra margins
      chars.push(
        <span key={`char-${i}`} className='mx-2'>
          {char}
        </span>,
      );
    } else if (char === ' ') {
      // Space stays as space
      chars.push(<span key={`char-${i}`}> </span>);
    } else if (!/[a-zA-Z0-9]/.test(char)) {
      // Non-alphanumeric characters (not in UNENCRYPTED_CHARS) get extra margins
      chars.push(
        <span key={`char-${i}`} className='mx-2'>
          {char}
        </span>,
      );
    } else {
      // Other characters get randomized and blurred
      chars.push(
        <span
          key={`char-${i}`}
          style={{ filter: 'blur(7px)' }}
          className='select-none font-mono'
        >
          {getRandomLetter()}
        </span>,
      );
    }
  }

  return (
    <span key={`word-${word}`} className={isNumericWord ? 'mx-5' : 'mx-1'}>
      {chars}
    </span>
  );
};

interface CensoredSteamGameTitleProps {
  title: string;
  blurTitleAndAsAmpersand?: boolean;
}

export const CensoredSteamGameTitle: React.FC<CensoredSteamGameTitleProps> = ({
  title,
  blurTitleAndAsAmpersand,
}) => {
  // Replace 'and' with '&' if requested
  const processedTitle = blurTitleAndAsAmpersand
    ? title.replace(/\band\b/gi, '&')
    : title;

  // Generate random letters for blurred characters once per title
  const randomLetters = useMemo(() => {
    const letters: string[] = [];
    const words = processedTitle.split(' ');

    for (const word of words) {
      if (UNENCRYPTED_CHARS.includes(word) || word.length === 1) {
        if (word.length === 1) {
          letters.push(randomUppercase());
        }
        continue;
      }

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const alphanumericPart = word.replace(/[^a-zA-Z0-9]+$/, '');
        if (
          i === 0 &&
          !/^\d+$/.test(word) &&
          !isRomanNumeral(alphanumericPart)
        ) {
          // First character stays as-is
          continue;
        } else if (
          UNENCRYPTED_CHARS.includes(char) ||
          char === ' ' ||
          !/[a-zA-Z0-9]/.test(char)
        ) {
          // These characters don't get randomized
          continue;
        } else {
          // Generate random letter for this position
          letters.push(randomUppercase());
        }
      }
    }

    return letters;
  }, [processedTitle]);

  // Split title by spaces to get words
  const words = processedTitle.split(' ');

  // Helper to get random letter for a position
  let currentLetterIndex = 0;
  const getRandomLetter = () => {
    const letter = randomLetters[currentLetterIndex];
    currentLetterIndex++;
    return letter;
  };

  return (
    <div className='text-lg sm:text-xl flex flex-wrap items-center '>
      {words.map((word, index) =>
        processTitleWord(
          word + (index < words.length - 1 ? '' : ''),
          getRandomLetter,
        ),
      )}
    </div>
  );
};
