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
  // Helper to randomize a character while preserving type
  const randomizeChar = (char: string): string => {
    if (/[A-Z]/.test(char)) {
      return String.fromCharCode(65 + Math.floor(Math.random() * 26));
    } else if (/[a-z]/.test(char)) {
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    } else if (/[0-9]/.test(char)) {
      return Math.floor(Math.random() * 10).toString();
    }
    return char;
  };

  // Helper to censor text by randomizing alphanumeric characters
  const censorText = (text: string): string => {
    return text
      .split('')
      .map((char) => randomizeChar(char))
      .join('');
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
            {text.slice(lastIndex, match.index)}
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
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>,
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
