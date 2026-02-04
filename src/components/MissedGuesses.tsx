import React from 'react';
import type { MissedGuess } from '../utils';

interface MissedGuessesProps {
  missedGuesses: MissedGuess[];
}

const MissedGuesses: React.FC<MissedGuessesProps> = ({ missedGuesses }) => {
  if (missedGuesses.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="mb-1 text-red-400 font-semibold text-sm">
        Incorrect guesses
      </div>
      <div className="flex flex-wrap gap-2">
        {missedGuesses.map((miss, i) => (
          <span
            key={miss.name + i}
            className={`flex items-center rounded px-2 py-1 text-sm ${
              miss.isClose
                ? 'text-yellow-500 bg-yellow-900/30'
                : 'text-red-500 bg-red-900/30'
            }`}
          >
            <span className="mr-1 font-bold">{miss.isClose ? '🤏' : '❌'}</span>{' '}
            {miss.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MissedGuesses;
