import React from 'react';

const SteamDetectiveFooter: React.FC = () => {
  return (
    <footer className='mt-8 text-xs text-gray-400 text-right space-y-1 pb-4'>
      <div>Not affiliated with Valve Corporation or Steam</div>
      <div>
        Created by{' '}
        <a
          href='https://github.com/matthew-b-dev'
          target='_blank'
          rel='noopener noreferrer'
          className='text-yellow-500 hover:text-yellow-400 underline'
        >
          matthew-b-dev
        </a>
      </div>
    </footer>
  );
};

export default SteamDetectiveFooter;
