import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/16/solid';
import { DocumentDuplicateIcon } from '@heroicons/react/24/solid';
import type { UnifiedGameState } from '../utils';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LAUNCH_DATE = '2026-02-04';
const STORAGE_KEY_PREFIX = 'steam-detective-state-';

function getAllPuzzleDates(): string[] {
  const start = new Date(LAUNCH_DATE + 'T00:00:00Z');
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dates: string[] = [];
  for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function getStateForDate(dateStr: string): UnifiedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + dateStr);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface ComputedStats {
  totalPossibleDays: number;
  daysAttempted: number;
  daysFullyCompleted: number;
  totalGamesPlayed: number;
  totalGamesSolved: number;
  averageScore: number | null;
  currentStreak: number;
  bestStreak: number;
}

function computeStats(): ComputedStats {
  const allDates = getAllPuzzleDates();
  const totalPossibleDays = allDates.length;

  let daysAttempted = 0;
  let daysFullyCompleted = 0;
  let totalGamesPlayed = 0;
  let totalGamesSolved = 0;
  const allScores: number[] = [];

  // For streak: a day is streak-eligible only if fully completed AND played on
  // its release date. undefined (legacy data) is treated generously as true.
  const dailyStreakEligible: boolean[] = [];

  for (const dateStr of allDates) {
    const state = getStateForDate(dateStr);
    if (!state) {
      dailyStreakEligible.push(false);
      continue;
    }

    let dayAttempted = false;
    for (let cf = 1; cf <= 4; cf++) {
      const cfKey = `caseFile${cf}` as keyof UnifiedGameState;
      const cfState = state[cfKey] as
        | { isComplete?: boolean; isCorrect?: boolean }
        | undefined;

      // A case file counts as played if it explicitly has isComplete:true,
      // OR if the day is marked allCasesComplete (handles corrupted case file
      // states where isComplete may be missing but the day was finished).
      const wasPlayed =
        (cfState && cfState.isComplete === true) ||
        (state.allCasesComplete && cfState !== undefined);

      if (wasPlayed) {
        dayAttempted = true;
        totalGamesPlayed++;
        if (cfState?.isCorrect === true) totalGamesSolved++;
      }
    }

    if (dayAttempted) daysAttempted++;

    if (state.allCasesComplete && state.caseFileScores) {
      daysFullyCompleted++;
      const dayTotal = state.caseFileScores.reduce(
        (a, b) => (typeof b === 'number' ? a + b : a),
        0,
      );
      allScores.push(dayTotal);
    }

    // Streak eligibility: fully complete + played on release day
    // playedOnReleaseDate === undefined → legacy → treat as true (generous)
    const playedOnTime = state.playedOnReleaseDate !== false;
    dailyStreakEligible.push(state.allCasesComplete === true && playedOnTime);
  }

  const averageScore =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
        ) / 10
      : null;

  // Current streak: consecutive streak-eligible days ending at today
  let currentStreak = 0;
  for (let i = dailyStreakEligible.length - 1; i >= 0; i--) {
    if (dailyStreakEligible[i]) currentStreak++;
    else break;
  }

  // Best streak
  let bestStreak = 0;
  let runningStreak = 0;
  for (const eligible of dailyStreakEligible) {
    if (eligible) {
      runningStreak++;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return {
    totalPossibleDays,
    daysAttempted,
    daysFullyCompleted,
    totalGamesPlayed,
    totalGamesSolved,
    averageScore,
    currentStreak,
    bestStreak,
  };
}

function getAllSteamDetectiveStorage(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      data[key] = localStorage.getItem(key)!;
    }
  }
  return data;
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
const StatTile: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className='flex flex-col items-center bg-zinc-800 rounded-lg px-3 py-3 min-w-0'>
    <span className='text-2xl font-black text-white'>{value}</span>
    <span className='text-[11px] text-zinc-400 text-center leading-tight mt-1'>
      {label}
    </span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const stats = isOpen ? computeStats() : null;
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  const handleClose = () => {
    setShowImportArea(false);
    setImportText('');
    setImportError('');
    onClose();
  };

  const handleCopyStats = () => {
    if (!stats) return;
    const solveRatePct =
      stats.totalGamesPlayed > 0
        ? Math.round((stats.totalGamesSolved / stats.totalGamesPlayed) * 100)
        : null;
    const streakStr =
      stats.currentStreak > 0
        ? `🔥 ${stats.currentStreak} Day Streak (Best: ${stats.bestStreak})`
        : `🔥 0 Day Streak (Best: ${stats.bestStreak})`;
    const avgStr =
      stats.averageScore !== null
        ? `🏆 ${stats.averageScore} Avg Score per Day`
        : null;
    const shareText = [
      '🕵️ https://SteamDetective.wtf - My Stats',
      `📅 ${stats.daysFullyCompleted} ${stats.daysFullyCompleted === 1 ? 'Day' : 'Days'} Completed  •  ${streakStr}`,
      [
        `🎯 ${solveRatePct !== null ? `${solveRatePct}% Case Solve Rate` : 'No cases played'}`,
        avgStr,
      ]
        .filter(Boolean)
        .join('  •  '),
    ].join('\n');
    navigator.clipboard.writeText(shareText).catch(() => {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    toast.success('Stats copied to clipboard!');
  };

  const handleExport = async () => {
    const data = getAllSteamDetectiveStorage();
    const json = JSON.stringify(data);
    try {
      await navigator.clipboard.writeText(json);
      toast.success('Save Data copied to clipboard!');
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = json;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success('Save Data copied to clipboard!');
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    }
  };

  const handleImportConfirm = () => {
    setImportError('');
    try {
      const parsed: Record<string, string> = JSON.parse(importText.trim());
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setImportError('Invalid data format. Please paste a valid export.');
        return;
      }
      // Validate keys and import
      for (const [key, value] of Object.entries(parsed)) {
        if (!key.startsWith(STORAGE_KEY_PREFIX)) {
          setImportError(
            `Unexpected key "${key}". Data may be corrupt or invalid.`,
          );
          return;
        }
        if (typeof value !== 'string') {
          setImportError('Invalid data format. Please paste a valid export.');
          return;
        }
        // Each value must itself be valid JSON (they are stringified game state objects)
        try {
          const inner = JSON.parse(value);
          if (
            typeof inner !== 'object' ||
            Array.isArray(inner) ||
            inner === null
          ) {
            setImportError(`Data for "${key}" is corrupt or invalid.`);
            return;
          }
          // Validate that any caseFileN entries are well-formed game states
          for (const cfKey of [
            'caseFile1',
            'caseFile2',
            'caseFile3',
            'caseFile4',
          ]) {
            const cf = inner[cfKey];
            if (cf === undefined) continue; // missing is fine
            if (
              typeof cf !== 'object' ||
              cf === null ||
              typeof cf.isComplete !== 'boolean' ||
              typeof cf.isCorrect !== 'boolean' ||
              typeof cf.currentClue !== 'number' ||
              !Array.isArray(cf.guesses)
            ) {
              setImportError(
                `Data for "${key}" is corrupt or invalid (bad ${cfKey}).`,
              );
              return;
            }
          }
        } catch {
          setImportError(`Data for "${key}" is corrupt or invalid.`);
          return;
        }
      }
      for (const [key, value] of Object.entries(parsed)) {
        localStorage.setItem(key, value);
      }
      setIsImporting(true);
      sessionStorage.setItem('steam-detective-import-success', '1');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      setImportError('Could not parse data. Please paste a valid export.');
    }
  };

  if (!isOpen) return null;

  const solveRate =
    stats && stats.totalGamesPlayed > 0
      ? Math.round((stats.totalGamesSolved / stats.totalGamesPlayed) * 100)
      : null;

  return (
    <>
      <motion.div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80'
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className='bg-zinc-900 rounded-lg pl-2 pr-3 py-6 sm:px-8 sm:py-8 max-w-md min-h-[495px] w-full ml-1 mr-2 sm:ml-4 sm:mr-4 relative'
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isImporting ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white'></div>
              <p className='mt-4 text-gray-300'>Importing save data...</p>
            </div>
          ) : (
            <>
              {/* Close button */}
              <button
                className='absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent p-1'
                onClick={handleClose}
                aria-label='Close'
              >
                <XMarkIcon className='h-5 w-5' />
              </button>

              <h2 className='text-2xl font-bold text-center mb-6'>
                Statistics
              </h2>

              {stats === null ? (
                <p className='text-center text-zinc-400 py-4'>Loading…</p>
              ) : (
                <>
                  {/* Stat grid */}
                  <div className='grid grid-cols-2 gap-2 mb-4'>
                    <StatTile
                      label='Days Played'
                      value={`${stats.daysAttempted}/${stats.totalPossibleDays}`}
                    />
                    <StatTile
                      label='Days Fully Completed'
                      value={stats.daysFullyCompleted}
                    />
                  </div>
                  <div className='grid grid-cols-3 gap-2 mb-4'>
                    <StatTile
                      label='Cases Correctly Solved'
                      value={stats.totalGamesSolved}
                    />
                    <StatTile
                      label='Cases Attempted'
                      value={stats.totalGamesPlayed}
                    />
                    <StatTile
                      label='Case Solve Rate'
                      value={solveRate !== null ? `${solveRate}%` : '-'}
                    />
                  </div>
                  <div className='grid grid-cols-3 gap-2 mb-6'>
                    <StatTile
                      label='Avg Score / Game'
                      value={
                        stats.averageScore !== null ? stats.averageScore : '-'
                      }
                    />
                    <StatTile
                      label='Current Streak'
                      value={
                        stats.currentStreak > 0
                          ? `${stats.currentStreak} 🔥`
                          : stats.currentStreak
                      }
                    />
                    <StatTile label='Best Streak' value={stats.bestStreak} />
                  </div>

                  {/* Import area */}
                  <AnimatePresence>
                    {showImportArea && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className='overflow-hidden mb-4'
                      >
                        <p className='text-xs text-zinc-400 mb-2'>
                          Paste your exported save data below, then click{' '}
                          <strong>Import</strong> to confirm.
                        </p>
                        <textarea
                          className='w-full bg-zinc-800 text-white text-xs rounded p-2 resize-none border border-zinc-700 focus:outline-none focus:border-zinc-500'
                          rows={3}
                          placeholder='Paste save data here…'
                          value={importText}
                          onChange={(e) => {
                            setImportText(e.target.value);
                            setImportError('');
                          }}
                        />
                        {importError && (
                          <p className='text-red-400 text-xs mt-1'>
                            {importError}
                          </p>
                        )}
                        <div className='flex gap-2 mt-2'>
                          <button
                            className='flex-1 px-3 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                            onClick={handleImportConfirm}
                            disabled={!importText.trim()}
                          >
                            Import
                          </button>
                          <button
                            className='flex-1 px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold transition-colors'
                            onClick={() => {
                              setShowImportArea(false);
                              setImportText('');
                              setImportError('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Export / Import buttons */}
                  {!showImportArea && (
                    <>
                      <button
                        className='w-full px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 mb-2 transition-colors'
                        onClick={handleCopyStats}
                      >
                        <DocumentDuplicateIcon className='w-5 h-5' />
                        Copy Stats to Share
                      </button>
                      <div className='flex gap-2'>
                        <button
                          className='flex-1 px-3 py-2 rounded border border-blue-600 text-blue-400 hover:bg-blue-700 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 bg-transparent'
                          onClick={handleExport}
                        >
                          <ArrowDownTrayIcon className='h-4 w-4 shrink-0' />
                          {exportCopied ? 'Copied! ✓' : 'Export Save Data'}
                        </button>
                        <button
                          className='flex-1 px-3 py-2 rounded border border-green-600 text-green-400 hover:bg-green-700 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 bg-transparent'
                          onClick={() => setShowImportArea(true)}
                        >
                          <ArrowUpTrayIcon className='h-4 w-4 shrink-0' />
                          Import Save Data
                        </button>
                      </div>
                    </>
                  )}
                  <p className='text-center text-xs text-zinc-500 mt-3'>
                    Problem?{' '}
                    <a
                      href='https://github.com/matthew-b-dev/steam-detective/issues'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-zinc-500 underline hover:text-zinc-300'
                    >
                      Create an issue ticket on GitHub
                    </a>
                    .
                  </p>
                </>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default StatsModal;
