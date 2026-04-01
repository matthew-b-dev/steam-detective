import type { ReactElement } from 'react';

export const SEARCH_DEBOUNCE_MS = 700;

/**
 * Fuzzy tolerance for MiniSearch queries (fractional, per-token).
 * floor(SEARCH_FUZZY x tokenLength) = max edit distance allowed.
 * 0.2 -> 1 edit for 5–9 char tokens
 * 0.35 -> 2 edits for 6+ char tokens (catches transpositions like "hutner" -> "hunter")
 */
export const SEARCH_FUZZY = 0.35;

/**
 * Returns the number of meaningful alphanumeric characters in a search query.
 * Strips the leading ": " subtitle-cheat prefix, then tokenizes identically to
 * MiniSearch (split on separators, strip remaining non-alphanumeric), and sums
 * the resulting token lengths.
 *
 * This is the correct value to gate against the 3-char minimum - raw string
 * length is exploitable (e.g. "mi " or "m-i" are 3 chars but only 2 meaningful).
 */
export const queryMeaningfulLength = (input: string): number => {
  let s = input;
  if (s.startsWith(': ')) s = s.slice(2);
  return s
    .split(/[\s\-:._&|()]+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .reduce((sum, t) => sum + t.length, 0);
};

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
      return 'text-[#b9A074]';
    case 'Negative':
    case 'Mostly Negative':
      return 'text-[#a94442]';
    case 'Overwhelmingly Negative':
    case 'Very Negative':
      return 'text-[#a94442]';
    default:
      return 'text-[#bcc6ce]';
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

// Uppercase letters available for random substitution (excludes I and L)
const UPPER_POOL = 'ABCDEFGHJKMNOPQRSTUVWXYZ';
// Lowercase letters available for random substitution (excludes i and l)
const LOWER_POOL = 'abcdefghjkmnopqrstuvwxyz';

// djb2-style hash of a string, returns a 32-bit signed integer
const hashString = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
};

// Simple LCG seeded PRNG, returns values in [0, 1)
const makeSeededRng = (seed: number): (() => number) => {
  let s = seed ^ 0x12345678;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
};

/**
 * Censors text with deterministic random characters seeded on the text itself,
 * so the same input always renders identically.
 *
 * Rules:
 * - Uppercase letters -> random uppercase from UPPER_POOL (I and L are preserved as-is)
 * - Lowercase letters -> random lowercase from LOWER_POOL (i and l are preserved as-is)
 * - Digits -> random digit
 * - Everything else (spaces, dashes, apostrophes, symbols…) -> unchanged
 */
export const hashSeededCensorText = (text: string): string => {
  const rng = makeSeededRng(hashString(text));
  return text
    .split('')
    .map((char) => {
      if (/[A-Z]/.test(char)) {
        const idx = Math.floor(rng() * UPPER_POOL.length);
        // I and L are preserved to avoid thin-character ambiguity
        if (char === 'I' || char === 'L') return char;
        return UPPER_POOL[idx];
      } else if (/[a-z]/.test(char)) {
        const idx = Math.floor(rng() * LOWER_POOL.length);
        if (char === 'i' || char === 'l') return char;
        return LOWER_POOL[idx];
      } else if (/[0-9]/.test(char)) {
        return Math.floor(rng() * 10).toString();
      }
      // Spaces, dashes, apostrophes, ™, © etc. are left as-is
      return char;
    })
    .join('');
};

// Helper to render description with censored parts
const bracketNoteStyle: React.CSSProperties = {
  color: '#8a909a',
};

// Matches ||censored|| or [bracket note]
const DESCRIPTION_PATTERN = /\|\|(.+?)\|\||(\[[^\]]*\])/g;

export const renderCensoredDescription = (
  description: string,
  keyPrefix: string = '',
): ReactElement[] => {
  const parts: ReactElement[] = [];
  const pattern = new RegExp(DESCRIPTION_PATTERN.source, 'g');
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(description)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}text-${lastIndex}`}>
          {description.slice(lastIndex, match.index)}
        </span>,
      );
    }

    if (match[1] !== undefined) {
      // ||text|| - censored with blur
      const censoredText = censorText(match[1]);
      parts.push(
        <span
          key={`${keyPrefix}censored-${match.index}`}
          style={{ filter: 'blur(7px)' }}
          className='select-none'
        >
          {censoredText}
        </span>,
      );
    } else {
      // [text] - bracket note, gray italic
      parts.push(
        <span
          key={`${keyPrefix}bracket-${match.index}`}
          style={bracketNoteStyle}
        >
          {match[0]}
        </span>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < description.length) {
    parts.push(
      <span key={`${keyPrefix}text-${lastIndex}`}>
        {description.slice(lastIndex)}
      </span>,
    );
  }

  return parts;
};

// Like renderCensoredDescription but reveals ||censored|| text; still styles [bracket notes]
export const renderUncensoredDescription = (
  description: string,
): ReactElement[] => {
  const parts: ReactElement[] = [];
  const pattern = new RegExp(DESCRIPTION_PATTERN.source, 'g');
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(description)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {description.slice(lastIndex, match.index)}
        </span>,
      );
    }

    if (match[1] !== undefined) {
      // ||text|| - reveal uncensored
      parts.push(<span key={`uncensored-${match.index}`}>{match[1]}</span>);
    } else {
      // [text] - bracket note, gray italic
      parts.push(
        <span key={`bracket-${match.index}`} style={bracketNoteStyle}>
          {match[0]}
        </span>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < description.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{description.slice(lastIndex)}</span>,
    );
  }

  return parts;
};

// Helper to render review text with censored parts and newline support
const EDITED_FOR_LENGTH_RE = /((?:\.\.\. )?\(edited for length\))/;
const editedForLengthStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: '#8a909a',
};

/**
 * Splits a line on EDITED_FOR_LENGTH, censors each surrounding segment,
 * and renders the marker itself with italic/dimmed styling.
 */
const renderCensoredLineWithEditedMarker = (
  line: string,
  lineIdx: number,
): ReactElement[] => {
  const parts = line.split(EDITED_FOR_LENGTH_RE);
  if (parts.length === 1)
    return renderCensoredDescription(line, `l${lineIdx}-`);
  const result: ReactElement[] = [];
  // split with a capturing group alternates: plain, match, plain, match, ...
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      // captured match - the marker itself (with optional leading '...')
      result.push(
        <span key={`${lineIdx}-efl${idx}`} style={editedForLengthStyle}>
          {part}
        </span>,
      );
    } else if (part) {
      result.push(...renderCensoredDescription(part, `l${lineIdx}-s${idx}-`));
    }
  });
  return result;
};

export const renderCensoredReview = (reviewText: string): ReactElement[] => {
  const lines = reviewText.split('\n');
  return lines.flatMap((line, lineIdx) => {
    const censoredLine = renderCensoredLineWithEditedMarker(line, lineIdx);
    if (lineIdx < lines.length - 1) {
      return [...censoredLine, <br key={`br-${lineIdx}`} />];
    }
    return censoredLine;
  });
};

export const MAX_CLUES = 6;

/**
 * Returns CSS style for a zoom focused on the given point.
 * focusPoint: [widthPercent, heightPercent, zoom?]
 *   widthPercent:  0 = left,   100 = right
 *   heightPercent: 0 = bottom, 100 = top  (inverted vs CSS)
 *   zoom:          1–100, default 75  (scale = 1 + zoom/100, so 75 -> scale 1.75)
 * e.g. [50, 50, 75] = center at 75% zoom
 */
export const DEFAULT_SCREENSHOT_ZOOM = 75;
export function getFocusScale(zoom?: number): number {
  return 1 + (zoom ?? DEFAULT_SCREENSHOT_ZOOM) / 100;
}
export function getScreenshotFocusStyle(
  focusPoint: [number, number, number?],
): React.CSSProperties {
  const [widthPercent, heightPercent, zoom] = focusPoint;
  const cssX = widthPercent;
  const cssY = 100 - heightPercent; // CSS: 0%=top, 100%=bottom
  return {
    transform: `scale(${getFocusScale(zoom)})`,
    transformOrigin: `${cssX}% ${cssY}%`,
  };
}

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
