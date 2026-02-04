import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSubtitle } from '../utils';

const Subtitle = () => {
  const [isMobile, setIsMobile] = useState(false);
  const subtitle = getSubtitle();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint is 640px
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Remove emojis in mobile view
  const processContent = (content: React.ReactNode): React.ReactNode => {
    if (!isMobile) return content;

    if (typeof content === 'string') {
      return content.replace(/\p{Emoji}/gu, '');
    }

    // Handle React elements (like fragments)
    if (typeof content === 'object' && content !== null && 'props' in content) {
      const element = content as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      if (element.props?.children) {
        const children = element.props.children;
        if (typeof children === 'string') {
          return children.replace(/\p{Emoji}/gu, '');
        }
      }
    }

    return content;
  };

  const processedContent = processContent(subtitle.content);
  const shouldAnimate = subtitle.animated && !isMobile;

  if (shouldAnimate) {
    return (
      <motion.p
        className='text-gray-400 text-xs py-0 sm:text-sm sm:mt-1'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: [0, -8, 8, -8, 8, -5, 5, 0],
        }}
        transition={{
          duration: 1,
          ease: 'easeOut',
          x: {
            duration: 0.5,
            ease: 'easeInOut',
            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
          },
        }}
      >
        {processedContent}
      </motion.p>
    );
  }

  return (
    <p className='text-gray-400 text-xs py-0 sm:text-sm sm:mt-1'>
      {processedContent}
    </p>
  );
};

export default Subtitle;
