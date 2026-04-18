import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { screenshotVariants } from './utils';

interface ClueWebmProps {
  webms: string[];
  show: boolean;
  isComplete?: boolean;
}

export const ClueWebm: React.FC<ClueWebmProps> = ({
  webms,
  show,
  isComplete = false,
}) => {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (isComplete) {
      videoRefs.current.forEach((v) => v?.pause());
    }
  }, [isComplete]);

  useEffect(() => {
    if (show && !isComplete) {
      videoRefs.current.forEach((v) => {
        if (v) {
          v.play().catch(() => {
            // Autoplay may be blocked; ignore and rely on browser autoplay policy
          });
        }
      });
    }
  }, [show, isComplete]);

  return (
    <motion.div
      layout
      initial={false}
      animate={show ? 'visible' : 'hidden'}
      variants={screenshotVariants}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='relative overflow-hidden'
    >
      <div className='px-4 py-4 flex flex-col gap-3'>
        {webms.map((url, index) => (
          <div key={index} className='flex justify-center'>
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={url}
              autoPlay
              loop
              muted
              playsInline
              className='max-w-full h-auto rounded-lg'
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};
