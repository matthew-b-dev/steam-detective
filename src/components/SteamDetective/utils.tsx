import type { ReactElement } from 'react';

// Helper function to get review color class based on rating
export const getReviewColorClass = (rating: string): string => {
  switch (rating) {
    case 'Overwhelmingly Positive':
    case 'Very Positive':
      return 'text-[#66c0f4]';
    case 'Positive':
    case 'Mostly Positive':
      return 'text-[#66c0f4]';
    case 'Mixed':
      return 'text-[#a1a1a1]';
    case 'Negative':
    case 'Mostly Negative':
      return 'text-[#a94442]';
    case 'Overwhelmingly Negative':
    case 'Very Negative':
      return 'text-[#a94442]';
    default:
      return 'text-[#8f98a0]';
  }
};

// Helper to decode HTML entities
export const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Helper to randomize a character while preserving type
const randomizeChar = (char: string): string => {
  if (/[A-Z]/.test(char)) {
    // Random uppercase letter
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  } else if (/[a-z]/.test(char)) {
    // Random lowercase letter
    return String.fromCharCode(97 + Math.floor(Math.random() * 26));
  } else if (/[0-9]/.test(char)) {
    // Random digit
    return Math.floor(Math.random() * 10).toString();
  }
  // Keep everything else (spaces, punctuation, ™, ©, etc.)
  return char;
};

// Helper to censor text by randomizing alphanumeric characters
const censorText = (text: string): string => {
  return text
    .split('')
    .map((char) => randomizeChar(char))
    .join('');
};

// Helper to render description with censored parts
export const renderCensoredDescription = (
  description: string,
): ReactElement[] => {
  const parts: ReactElement[] = [];
  const pattern = /\|\|(.+?)\|\|/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(description)) !== null) {
    // Add text before the censored part
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {description.slice(lastIndex, match.index)}
        </span>,
      );
    }

    // Add censored text with blur
    const censoredText = censorText(match[1]);
    parts.push(
      <span
        key={`censored-${match.index}`}
        style={{ filter: 'blur(7px)' }}
        className='select-none'
      >
        {censoredText}
      </span>,
    );

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text after last censored part
  if (lastIndex < description.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{description.slice(lastIndex)}</span>,
    );
  }

  return parts;
};

export const MAX_CLUES = 6;

// Animation variants
export const clueVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    marginBottom: 0,
  },
  visible: {
    height: 'auto',
    opacity: 1,
    marginBottom: 0,
  },
} as const;

export const screenshotVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    marginBottom: 0,
  },
  visible: {
    height: 'auto',
    opacity: 1,
    marginBottom: 0,
  },
} as const;
