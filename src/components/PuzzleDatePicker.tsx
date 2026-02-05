import React, { useState } from 'react';
import { CalendarDate } from '@internationalized/date';
import { motion } from 'framer-motion';

interface PuzzleDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleDate: string; // YYYY-MM-DD format
  // eslint-disable-next-line no-unused-vars
  onDateSelect: (dateString: string) => void;
}

const PuzzleDatePicker: React.FC<PuzzleDatePickerProps> = ({
  isOpen,
  onClose,
  currentPuzzleDate,
  onDateSelect,
}) => {
  // Get current UTC date
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
  const utcDay = now.getUTCDate();
  const realUtcDate = new CalendarDate(utcYear, utcMonth, utcDay);

  // Minimum selectable date: Feb 2, 2026 UTC
  const minDate = new CalendarDate(2026, 2, 2);

  // Parse the current puzzle date
  const [puzzleYear, puzzleMonth, puzzleDay] = currentPuzzleDate
    .split('-')
    .map(Number);

  const [currentMonth, setCurrentMonth] = useState(realUtcDate.month);
  const [currentYear, setCurrentYear] = useState(realUtcDate.year);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Generate calendar days for current month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days: (number | null)[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setIsLoading(true);
    onDateSelect(dateStr);
  };

  const goToPreviousMonth = () => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Don't allow navigating before the minimum date month
    if (
      prevYear < minDate.year ||
      (prevYear === minDate.year && prevMonth < minDate.month)
    ) {
      return;
    }

    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Don't allow navigating past the max date month
    if (
      nextYear > realUtcDate.year ||
      (nextYear === realUtcDate.year && nextMonth > realUtcDate.month)
    ) {
      return;
    }

    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const isCurrentPuzzle = (day: number): boolean => {
    return (
      currentYear === puzzleYear &&
      currentMonth === puzzleMonth &&
      day === puzzleDay
    );
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new CalendarDate(currentYear, currentMonth, day);
    // Disable if date is before minimum date, after today (future dates), OR if it's the current puzzle date
    return (
      date.compare(minDate) < 0 ||
      date.compare(realUtcDate) > 0 ||
      isCurrentPuzzle(day)
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const canGoNext =
    currentYear < realUtcDate.year ||
    (currentYear === realUtcDate.year && currentMonth < realUtcDate.month);

  const canGoPrevious =
    currentYear > minDate.year ||
    (currentYear === minDate.year && currentMonth > minDate.month);

  return (
    <motion.div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-start pt-14 justify-center z-50'
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className='bg-zinc-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4'
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white'></div>
            <p className='mt-4 text-gray-300'>Loading puzzle...</p>
          </div>
        ) : (
          <>
            <div className='mb-4'>
              <h2 className='text-xl font-bold text-gray-100'>
                Select Puzzle Date
              </h2>
              <p className='text-sm text-gray-400 mt-1'>
                Choose a different puzzle date
              </p>
            </div>

            <div className='mb-4'>
              <div className='flex items-center justify-between mb-4'>
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoPrevious}
                  className='px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  ◀
                </button>
                <div className='text-lg font-semibold'>
                  {monthNames[currentMonth - 1]} {currentYear}
                </div>
                <button
                  onClick={goToNextMonth}
                  disabled={!canGoNext}
                  className='px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  ▶
                </button>
              </div>

              <div className='grid grid-cols-7 gap-1'>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div
                    key={day}
                    className='text-center text-xs text-gray-400 font-semibold p-2'
                  >
                    {day}
                  </div>
                ))}
                {days.map((day, index) => (
                  <div key={index} className='aspect-square'>
                    {day !== null ? (
                      <button
                        onClick={() => handleDayClick(day)}
                        disabled={isDateDisabled(day)}
                        className={`w-full h-full rounded hover:bg-zinc-700 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors ${
                          isCurrentPuzzle(day)
                            ? 'border-2 border-blue-500 text-blue-400 font-bold'
                            : isDateDisabled(day)
                              ? 'text-gray-600'
                              : ''
                        }`}
                      >
                        {day}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-4 flex justify-end'>
              <button
                onClick={() => {
                  const todayStr = `${realUtcDate.year}-${String(realUtcDate.month).padStart(2, '0')}-${String(realUtcDate.day).padStart(2, '0')}`;
                  setIsLoading(true);
                  onDateSelect(todayStr);
                }}
                disabled={
                  realUtcDate.year === puzzleYear &&
                  realUtcDate.month === puzzleMonth &&
                  realUtcDate.day === puzzleDay
                }
                className='px-4 py-2 mr-2 bg-green-700 hover:bg-green-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Today
              </button>
              <button
                onClick={onClose}
                className='px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition'
              >
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PuzzleDatePicker;
