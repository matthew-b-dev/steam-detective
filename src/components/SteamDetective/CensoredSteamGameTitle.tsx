import type { ReactElement } from 'react';

// Characters that should not be encrypted
const UNENCRYPTED_CHARS = [':', ',', '-'];

// Helper to check if a word is a Roman numeral
const isRomanNumeral = (word: string): boolean => {
  return /^(M{0,4})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(
    word,
  );
};

// Helper to process a single word
const processTitleWord = (word: string): ReactElement => {
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
    // Single characters should be replaced with underscore, but don't
    // add extra word-level margins since character itself has spacing
    return (
      <span key={`word-${word}`}>
        <span className='mx-0.5'>_</span>
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
      // Space with extra margins to make it more visually distinct
      chars.push(
        <span key={`char-${i}`} className='mx-0.5'>
          {' '}
        </span>,
      );
    } else if (!/[a-zA-Z0-9]/.test(char)) {
      // Non-alphanumeric characters (not in UNENCRYPTED_CHARS) get extra margins
      chars.push(
        <span key={`char-${i}`} className='mx-2'>
          {char}
        </span>,
      );
    } else {
      // Other characters get replaced with underscores (spaced)
      chars.push(
        <span key={`char-${i}`} className='mx-0.5'>
          _
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

  // Split title by spaces to get words
  const words = processedTitle.split(' ');

  return (
    <div className='text-lg sm:text-xl flex flex-wrap items-center '>
      {words.map((word, index) => {
        const wordElement = processTitleWord(word);
        // Add space between words
        if (index < words.length - 1) {
          return (
            <span key={`word-group-${index}`}>
              {wordElement}
              <span className='mx-[1px]'> </span>
            </span>
          );
        }
        return wordElement;
      })}
    </div>
  );
};
