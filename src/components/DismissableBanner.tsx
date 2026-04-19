import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/16/solid';

interface DismissableBannerProps {
  /** localStorage key used to persist dismissal across sessions */
  storageKey: string;
  /** (e.g. "Apr 18") */
  label: React.ReactNode;
  /** Main banner message content */
  children: React.ReactNode;
  /** Optional extra actions rendered before the Dismiss button */
  actions?: React.ReactNode;
}

/**
 *   <DismissableBanner
 *     storageKey='my-banner-key-v1'
 *     label='Apr 18'
 *     actions={
 *       <a href='...' className='inline-flex items-center gap-0.5 leading-none align-baseline text-blue-300 hover:text-white transition-colors underline decoration-dotted'>
 *         <InformationCircleIcon className='h-3 w-3 shrink-0' />
 *         More Info
 *       </a>
 *     }
 *   >
 *     I'm shutting everything down tomorrow lol
 *   </DismissableBanner>
 */
const DismissableBanner: React.FC<DismissableBannerProps> = ({
  storageKey,
  label,
  children,
  actions,
}) => {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(storageKey),
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <div className='flex items-stretch text-xs sm:text-sm rounded overflow-hidden border border-blue-500/60 mb-3 bg-blue-900/30'>
      <div className='text-xs flex items-center gap-1 sm:gap-1.5 bg-blue-700/50 border-r border-blue-500/60 px-2 py-1.5 whitespace-nowrap text-blue-100'>
        <span className='font-bold'>Update:</span>
        {label}
      </div>
      <div className='px-2 py-1.5 sm:px-3 sm:py-2.5 text-blue-100 flex-1'>
        {children}
        <div className='mt-1'>
          {actions}
          <button
            onClick={dismiss}
            className={`${actions ? 'ml-2' : ''} inline-flex items-center gap-0.5 leading-none align-baseline text-blue-300 hover:text-white bg-transparent border-0 p-0 cursor-pointer transition-colors underline decoration-dotted`}
          >
            <XMarkIcon className='h-3 w-3 shrink-0' />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default DismissableBanner;
