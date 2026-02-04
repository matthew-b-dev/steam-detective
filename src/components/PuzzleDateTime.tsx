import React from 'react';
import { CalendarIcon } from '@heroicons/react/20/solid';

interface PuzzleDateTimeProps {
  puzzleDate: string;
  timeLeft: { h: number; m: number };
}

const PuzzleDateTime: React.FC<PuzzleDateTimeProps> = ({
  puzzleDate,
  timeLeft,
}) => {
  return (
    <div className='flex flex-col items-center'>
      <div className='text-gray-200 text-sm flex items-center gap-2'>
        <CalendarIcon className='w-4 h-4' />
        {puzzleDate}
      </div>
      <div className='text-gray-400 text-sm'>
        Next game in {timeLeft.h}h, {timeLeft.m}m
      </div>
    </div>
  );
};

export default PuzzleDateTime;
