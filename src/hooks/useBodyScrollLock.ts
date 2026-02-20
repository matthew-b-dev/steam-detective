import { useEffect } from 'react';

/**
 * Locks document body scroll while `isLocked` is true.
 * Restores the previous overflow value on cleanup.
 */
const useBodyScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (!isLocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isLocked]);
};

export default useBodyScrollLock;
