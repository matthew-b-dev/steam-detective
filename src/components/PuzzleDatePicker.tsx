import React, { useState, useEffect } from 'react';
import { CalendarDate } from '@internationalized/date';
import { motion } from 'framer-motion';
import { isLocalhost } from '../utils';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

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

  // Minimum selectable date: Feb 4, 2026 UTC
  const minDate = new CalendarDate(2026, 2, 4);

  // Parse the current puzzle date
  const [puzzleYear, puzzleMonth, puzzleDay] = currentPuzzleDate
    .split('-')
    .map(Number);

  const [currentMonth, setCurrentMonth] = useState(realUtcDate.month);
  const [currentYear, setCurrentYear] = useState(realUtcDate.year);
  const [isLoading, setIsLoading] = useState(false);

  useBodyScrollLock(isOpen);

  // Scan localStorage for completed puzzle dates whenever the modal opens
  const completedDates = React.useMemo(() => {
    if (!isOpen) return new Set<string>();
    const completed = new Set<string>();
    const prefix = 'steam-detective-state-';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dateStr = key.slice(prefix.length);
        try {
          const state = JSON.parse(localStorage.getItem(key) ?? '{}');
          if (state.allCasesComplete === true) {
            completed.add(dateStr);
          }
        } catch {
          // ignore malformed entries
        }
      }
    }
    return completed;
  }, [isOpen]);

  // Reset loading state when page is restored from back-forward cache
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // If the page was restored from bfcache, reset the loading state
      if (event.persisted) {
        setIsLoading(false);
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

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

  const isCompleted = (day: number): boolean => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completedDates.has(dateStr);
  };

  const isCurrentPuzzle = (day: number): boolean => {
    return (
      currentYear === puzzleYear &&
      currentMonth === puzzleMonth &&
      day === puzzleDay
    );
  };

  const isBeforeMinDate = (day: number): boolean => {
    const date = new CalendarDate(currentYear, currentMonth, day);
    return date.compare(minDate) < 0;
  };

  const getDayClassName = (day: number): string => {
    const base = 'w-full h-full rounded transition-colors';
    if (isCurrentPuzzle(day) && isCompleted(day))
      return `${base} bg-green-950 border-2 border-white text-green-100 font-bold`;
    if (isCurrentPuzzle(day))
      return `${base} border-2 border-blue-500 text-blue-400 font-bold hover:bg-zinc-700`;
    if (isCompleted(day))
      return `${base} bg-green-800 hover:bg-green-700 text-green-100 font-semibold`;
    if (isBeforeMinDate(day)) return `${base} text-gray-600 cursor-not-allowed`;
    if (isDateDisabled(day))
      return `${base} text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent`;
    return `${base} hover:bg-zinc-700`;
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new CalendarDate(currentYear, currentMonth, day);
    // Disable if date is before minimum date, after today (future dates), OR if it's the current puzzle date
    // On localhost, allow future dates
    const isFuture = date.compare(realUtcDate) > 0;
    return (
      date.compare(minDate) < 0 ||
      (!isLocalhost() && isFuture) ||
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

  const todayIsSelected =
    realUtcDate.year === puzzleYear &&
    realUtcDate.month === puzzleMonth &&
    realUtcDate.day === puzzleDay;

  return (
    <motion.div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-start pt-14 justify-center z-50'
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className='bg-zinc-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-0 sm:mx-4'
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
                  <div key={index} className='aspect-square relative group'>
                    {day !== null ? (
                      <>
                        <button
                          onClick={() => {
                            if (!isBeforeMinDate(day)) handleDayClick(day);
                          }}
                          disabled={
                            isDateDisabled(day) && !isBeforeMinDate(day)
                          }
                          className={getDayClassName(day)}
                        >
                          {day}
                        </button>
                        {isBeforeMinDate(day) && (
                          <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[11rem] rounded bg-zinc-900 border border-zinc-600 px-2 py-1 text-xs text-gray-300 text-center invisible group-hover:visible group-focus-within:visible z-10'>
                            The first ever puzzle was Feb 4, 2026.
                          </div>
                        )}
                      </>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-4 flex justify-between'>
              <div
                id='calendar-legend'
                className='text-xs text-gray-400 flex flex-col justify-center gap-1'
              >
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 rounded bg-green-800 flex-shrink-0' />
                  <span>Complete</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 rounded bg-[#1a1a1a] flex-shrink-0' />
                  <span>Incomplete</span>
                </div>
              </div>
              <div className='flex'>
                {!todayIsSelected && (
                  <button
                    onClick={() => {
                      const todayStr = `${realUtcDate.year}-${String(realUtcDate.month).padStart(2, '0')}-${String(realUtcDate.day).padStart(2, '0')}`;
                      setIsLoading(true);
                      onDateSelect(todayStr);
                    }}
                    className='px-3 py-1 mr-2 text-sm text-black bg-yellow-500 hover:bg-yellow-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Today
                  </button>
                )}

                <button
                  onClick={onClose}
                  className='px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition'
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PuzzleDatePicker;
