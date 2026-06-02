import React from 'react';
import type { MissedGuess } from '../utils';

interface MissedGuessesProps {
  missedGuesses: MissedGuess[];
}

const MissedGuesses: React.FC<MissedGuessesProps> = ({ missedGuesses }) => {
  if (missedGuesses.length === 0) return null;
  return (
    <div className='mt-4'>
      <div className='mb-1 text-red-400 font-semibold text-sm'>
        Incorrect guesses
      </div>
      <div className='flex flex-wrap gap-2'>
        {missedGuesses.map((miss, i) => (
          <span
            key={miss.name + i}
            className={`flex items-center rounded px-2 py-1 text-sm ${
              miss.isClose
                ? 'text-yellow-500 bg-yellow-900/30'
                : 'text-red-500 bg-red-900/30'
            }`}
          >
            <span className='mr-1 font-bold'>{miss.isClose ? '🤏' : '❌'}</span>{' '}
            {miss.name}
          </span>
        ))}
      </div>
      {/* A little something special for an inevitable mixup between Outer Wilds and Outer Worlds :) */}
      {missedGuesses.some((g) => g.isClose && g.name === 'Outer Wilds') && (
        <div className='mt-1 text-sm'>
          It's the <i>other</i> "Outer W___s" released in 2019. This was bound
          to happen. I'm so sorry. 😅
        </div>
      )}
      {/* Half-Life / Black Mesa mixup */}
      {missedGuesses.some((g) => g.isClose && g.name === 'Half-Life') && (
        <div className='mt-1 text-sm'>
          <span
            key='Half-Life'
            className={`flex items-center rounded px-2 py-1 text-sm text-yellow-500 bg-yellow-900/30`}
          >
            Half-Life is an extremely close guess but this game does not have
            "Half-Life" in its name. Instead, the developers chose a name taken
            from something integral to the game itself.
          </span>
        </div>
      )}
      {missedGuesses.some(
        (g) => g.isClose && g.name === 'Like a Dragon: Infinite Wealth',
      ) && (
        <div className='mt-3 text-sm'>
          💡 Close! Hint: Check the Year on the reviews.
        </div>
      )}
    </div>
  );
};

export default MissedGuesses;
