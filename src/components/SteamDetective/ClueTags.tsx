import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { clueVariants } from './utils';

interface ClueTagsProps {
  tags: string[];
  blurredTags?: string[];
  show: boolean;
  isComplete?: boolean;
}

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

export const ClueTags: React.FC<ClueTagsProps> = ({
  tags,
  blurredTags = [],
  show,
  isComplete = false,
}) => {
  // Memoize censored tags so they don't re-scramble on every render
  const censoredTagsMap = useMemo(() => {
    const map = new Map<string, string>();
    tags.forEach((tag) => {
      if (blurredTags.includes(tag)) {
        map.set(tag, censorText(tag));
      }
    });
    return map;
  }, [tags, blurredTags]);

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='px-4 py-3 max-w-[450px]'>
        <div className='text-gray-400 text-sm mb-2'>
          Popular user-defined tags for this product:
        </div>
        <div className='flex flex-wrap gap-[2px]'>
          {tags.slice(0, 10).map((tag, index) => {
            const isBlurred = !isComplete && blurredTags.includes(tag);
            const displayText = isBlurred
              ? censoredTagsMap.get(tag) || tag
              : tag;
            return (
              <span
                key={index}
                className='bg-[rgba(103,193,245,0.2)] text-[#67c1f5] px-2 py-[2px] text-xs rounded-sm'
              >
                <span
                  style={isBlurred ? { filter: 'blur(4px)' } : undefined}
                  className={isBlurred ? 'select-none' : undefined}
                >
                  {displayText}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
