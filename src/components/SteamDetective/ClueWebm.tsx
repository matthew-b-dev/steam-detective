import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { screenshotVariants } from './utils';

interface ClueWebmProps {
  webms: string[];
  show: boolean;
  isComplete?: boolean;
  keepPlayingOnComplete?: boolean;
}

export const ClueWebm: React.FC<ClueWebmProps> = ({
  webms,
  show,
  isComplete = false,
  keepPlayingOnComplete = false,
}) => {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>(() =>
    webms.map(() => true),
  );

  // Reset loading states whenever the clue is re-revealed.
  // Don't override a video that is already playing (e.g. instant cache hit).
  useEffect(() => {
    if (show) {
      setLoadingStates(
        webms.map((_, i) => {
          const v = videoRefs.current[i];
          return !(v && !v.paused && v.readyState >= 2);
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, webms.length]);

  useEffect(() => {
    if (isComplete && !keepPlayingOnComplete) {
      videoRefs.current.forEach((v) => v?.pause());
    }
  }, [isComplete, keepPlayingOnComplete]);

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
          <div key={index} className='relative flex justify-center'>
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
              onPlaying={() =>
                setLoadingStates((prev) => {
                  const next = [...prev];
                  next[index] = false;
                  return next;
                })
              }
              onWaiting={() =>
                setLoadingStates((prev) => {
                  const next = [...prev];
                  next[index] = true;
                  return next;
                })
              }
            />
            {loadingStates[index] && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin' />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
