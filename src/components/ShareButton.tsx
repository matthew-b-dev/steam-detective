import React from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/24/solid';

interface ShareButtonProps {
  userPercentile: number | null;
  onCopyToShare: () => void;
  isLoading?: boolean;
  text?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  onCopyToShare,
  isLoading = false,
  text,
}) => {
  const handleShareClick = () => {
    onCopyToShare();
  };

  return (
    <button
      className='w-full px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
      onClick={handleShareClick}
      disabled={isLoading}
    >
      <DocumentDuplicateIcon className='w-5 h-5' />
      {isLoading ? 'Loading scores...' : (text ?? 'Copy for Sharing')}
    </button>
  );
};

export default ShareButton;
