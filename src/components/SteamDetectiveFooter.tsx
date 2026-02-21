import React from 'react';
import toast from 'react-hot-toast';

const SteamDetectiveFooter: React.FC = () => {
  const copyEmail = () => {
    navigator.clipboard.writeText('hello@steamdetective.wtf');
    toast.success('Contact Email copied to clipboard!', {
      position: 'bottom-center',
    });
  };

  return (
    <footer className='mt-8 text-xs text-gray-400 text-right space-y-1 pb-52'>
      <div>Not affiliated with Valve Corporation or Steam</div>
      <div>This is a hobby project without ads or monetization</div>
      <div>
        Icon by{' '}
        <a
          className='text-yellow-500 hover:text-yellow-400 underline'
          href='https://icons8.com/icons'
          target='_blank'
          rel='noopener'
        >
          Icons8
        </a>
      </div>
      <div>
        Created by{' '}
        <a
          href='https://github.com/matthew-b-dev'
          target='_blank'
          rel='noopener noreferrer'
          className='text-yellow-500 hover:text-yellow-400 underline'
        >
          @matthew-b-dev
        </a>
      </div>
      <div>
        Contact{' '}
        <button
          onClick={copyEmail}
          className='text-yellow-500 hover:text-yellow-400 underline bg-transparent border-0 p-0 cursor-pointer outline-none'
        >
          hello@steamdetective.wtf
        </button>
      </div>
    </footer>
  );
};

export default SteamDetectiveFooter;
