import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import {
  clueVariants,
  decodeHtmlEntities,
  renderUncensoredDescription,
} from './utils';

interface ClueDescriptionProps {
  shortDescription: string;
  censoredDescription: ReactElement[];
  isComplete: boolean;
  show: boolean;
}

export const ClueDescription: React.FC<ClueDescriptionProps> = ({
  shortDescription,
  censoredDescription,
  isComplete,
  show,
}) => {
  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={clueVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='overflow-hidden'
    >
      <div className='text-sm text-gray-200 leading-relaxed px-4 py-3 max-w-[600px]'>
        <div className='text-gray-400 text-xs uppercase min-w-[120px] pt-[3px]'>
          Description:
        </div>
        <div>
          {isComplete
            ? renderUncensoredDescription(decodeHtmlEntities(shortDescription))
            : censoredDescription}
        </div>
      </div>
    </motion.div>
  );
};
