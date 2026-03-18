import { motion } from 'framer-motion';
import { CensoredSteamGameTitle } from './CensoredSteamGameTitle';
import { clueVariants } from './utils';
import type { ReactElement } from 'react';

interface ClueTitleProps {
  title: string;
  show: boolean;
  isComplete: boolean;
  blurTitleAndAsAmpersand?: boolean;
  overrideCensoredTitle?: string;
}

export const ClueTitle: React.FC<ClueTitleProps> = ({
  title,
  show,
  isComplete,
  blurTitleAndAsAmpersand,
  overrideCensoredTitle,
}) => {
  // Helper to render normal text with extra margin on spaces
  const renderNormalText = (text: string): ReactElement => {
    const chars: ReactElement[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        // Spaces with extra margins to make them visually distinct
        chars.push(
          <span key={`char-${i}`} className='mx-1'>
            {' '}
          </span>,
        );
      } else {
        // Regular characters
        chars.push(<span key={`char-${i}`}>{char}</span>);
      }
    }
    return <span>{chars}</span>;
  };

  // Helper to render redacted text as spaced underscores
  const renderRedactedText = (text: string): ReactElement => {
    const chars: ReactElement[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        // Keep spaces with extra margins to make them visually distinct
        chars.push(
          <span key={`char-${i}`} className='mx-1'>
            {' '}
          </span>,
        );
      } else if (char === ':') {
        chars.push(
          <span key={`char-${i}`} className='mx-1'>
            {':'}
          </span>,
        );
      } else {
        // Replace non-whitespace with spaced underscore
        chars.push(
          <span key={`char-${i}`} className='mx-0.5'>
            _
          </span>,
        );
      }
    }
    return <span>{chars}</span>;
  };

  // Helper to render text with censored parts (||text||)
  const renderCensoredText = (text: string): ReactElement[] => {
    const parts: ReactElement[] = [];
    const pattern = /\|\|(.+?)\|\|/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Add text before the censored part
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {renderNormalText(text.slice(lastIndex, match.index))}
          </span>,
        );
      }

      // Add censored text as spaced underscores
      parts.push(
        <span key={`censored-${match.index}`}>
          {renderRedactedText(match[1])}
        </span>,
      );

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text after last censored part
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {renderNormalText(text.slice(lastIndex))}
        </span>,
      );
    }

    return parts;
  };

  // Replace 'and' with '&' if requested
  const displayTitle = blurTitleAndAsAmpersand
    ? title.replace(/\band\b/gi, '&')
    : title;

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='px-4 pt-3 pb-1'>
        {isComplete ? (
          <div className='text-lg sm:text-xl'>{displayTitle}</div>
        ) : overrideCensoredTitle ? (
          <div className='text-lg sm:text-xl'>
            {renderCensoredText(overrideCensoredTitle)}
          </div>
        ) : (
          <CensoredSteamGameTitle
            title={title}
            blurTitleAndAsAmpersand={blurTitleAndAsAmpersand}
          />
        )}
      </div>
    </motion.div>
  );
};
