import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPuzzleDate,
  getTimeUntilNextGame,
  getUtcDateString,
  clearPuzzleState,
  getUnifiedState,
  saveCurrentCaseFile,
  getCurrentCaseFile,
  getTotalScore,
  saveAllCasesComplete,
  type SteamDetectiveState,
} from './utils';
import PuzzleDateTime from './components/PuzzleDateTime';
import ResetPuzzleButton from './components/ResetPuzzleButton';
import SteamDetectiveFooter from './components/SteamDetectiveFooter';
import { useDailyGame } from './hooks/useDailyGame';
import { useCensoredDescription } from './hooks/useCensoredDescription';
import { useSteamDetectiveState } from './hooks/useSteamDetectiveState';
import { useGameActions } from './hooks/useGameActions';
import MissedGuesses from './components/MissedGuesses';
import { SteamDetectiveGameProvider } from './contexts/SteamDetectiveGameContext';
import calendarIcon from './assets/calendar-48.png';
import {
  GameInput,
  SkipButton,
  ClueContainer,
  GameComplete,
  FinalGameComplete,
} from './components/SteamDetective';
import greenGamesFolderIcon from './assets/green-games-folder-48.png';
import analyzeIcon from './assets/analyze-48.png';

// Preload images hook
const useImagePreloader = (src: string) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [src]);

  return loaded;
};

interface SteamDetectiveGameProps {
  caseFileNumber: number; // 1-4
  onContinueToNextCase?: () => void;
  previousTotalScore?: number;
  isCurrentCaseFile?: boolean;
}

const SteamDetectiveGame: React.FC<SteamDetectiveGameProps> = ({
  caseFileNumber,
  onContinueToNextCase,
  previousTotalScore = 0,
  isCurrentCaseFile = true,
}) => {
  const [flashGuesses, setFlashGuesses] = useState(false);
  const prevShowCluesRef = useRef<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  // Preload folder icon
  const iconLoaded = useImagePreloader(greenGamesFolderIcon);

  const dailyGame = useDailyGame(caseFileNumber);
  const censoredDescription = useCensoredDescription(
    dailyGame.shortDescription,
  );

  const { state, setState } = useSteamDetectiveState(
    dailyGame.name,
    caseFileNumber,
  );
  const { handleSkip, handleGuess } = useGameActions({
    state,
    setState,
    gameName: dailyGame.name,
  });

  // Flash animation when guesses remaining changes
  useEffect(() => {
    if (state.guessesRemaining < 6 && !state.isComplete) {
      setFlashGuesses(true);
      const timer = setTimeout(() => setFlashGuesses(false), 200);
      return () => clearTimeout(timer);
    }
  }, [state.guessesRemaining, state.isComplete]);

  // Scroll to top when game is completed
  useEffect(() => {
    if (state.isComplete) {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 150);
    }
  }, [state.isComplete]);

  // Determine which clues to show based on custom clue order
  const clueOrder = dailyGame.clueOrder || ['tags', 'details', 'desc'];

  const clueMapping: Record<string, number> = {
    tags: 1,
    details: 2,
    desc: 3,
  };

  const getShowClues = (): boolean[] => {
    const result = [false, false, false, false, false, false];

    if (state.isComplete) {
      return [true, true, true, true, true, true];
    }

    for (let i = 0; i < state.currentClue && i < 6; i++) {
      if (i < 3) {
        const clueType = clueOrder[i];
        const clueIndex = clueMapping[clueType] - 1;
        result[clueIndex] = true;
      } else if (i === 3) {
        result[3] = true;
      } else if (i === 4) {
        result[4] = true;
      } else if (i === 5) {
        result[5] = true;
      }
    }

    return result;
  };

  const showClues = getShowClues();

  // Auto-scroll down when a new clue becomes the lowest displayed clue
  useEffect(() => {
    if (state.isComplete) {
      return;
    }

    const canonicalPositions = {
      title: 0,
      screenshot1: 1,
      screenshot2: 2,
      desc: 3,
      details: 4,
      tags: 5,
    };

    const clueNames = [
      'tags',
      'details',
      'desc',
      'screenshot1',
      'screenshot2',
      'title',
    ];

    const getLowestPosition = (clues: boolean[]): number => {
      let lowestPosition = -1;
      clues.forEach((shown, index) => {
        if (shown) {
          const clueName = clueNames[index] as keyof typeof canonicalPositions;
          const position = canonicalPositions[clueName];
          if (position > lowestPosition) {
            lowestPosition = position;
          }
        }
      });
      return lowestPosition;
    };

    const prevLowestPosition = getLowestPosition(prevShowCluesRef.current);
    const currentLowestPosition = getLowestPosition(showClues);

    const isFirstClue = prevShowCluesRef.current.every((clue) => !clue);

    const getClueContainerElement = () => {
      return document.querySelector(
        `[data-clue-container="casefile-${caseFileNumber}"]`,
      ) as HTMLElement;
    };

    const clueContainerBottomNearViewportBottom = () => {
      const container = getClueContainerElement();
      if (!container) return false;

      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerBottom = rect.bottom;

      return (
        containerBottom > viewportHeight ||
        containerBottom > viewportHeight - 150
      );
    };

    if (
      !isFirstClue &&
      currentLowestPosition > prevLowestPosition &&
      currentLowestPosition >= 0 &&
      clueContainerBottomNearViewportBottom()
    ) {
      const scrollAmount = 220;

      setTimeout(() => {
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth',
        });
      }, 100);
    }

    prevShowCluesRef.current = showClues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClues, state.isComplete]);

  const caseFileHeader = useMemo(() => {
    return (
      <h2 className='text-lg text-white sm:text-2xl mb-[-5px] sm:py-0 sm:mb-0 font-bold'>
        <div className='flex items-center'>
          <img
            src={greenGamesFolderIcon}
            className={`transition-opacity duration-200 ${
              iconLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className='pl-1'>
            Case File #{caseFileNumber}{' '}
            <span className='text-gray-500'>of 4</span>
          </div>
        </div>
      </h2>
    );
  }, [iconLoaded, caseFileNumber]);

  return (
    <SteamDetectiveGameProvider
      dailyGame={dailyGame}
      censoredDescription={censoredDescription}
      isComplete={state.isComplete}
      showClues={showClues}
    >
      <div className='relative max-w-[970px] mx-auto px-1 md:px-4'>
        <div className='bg-zinc-800/40 px-4 pt-1 sm:pt-3 rounded-t-3xl'>
          <div
            className={`relative flex justify-center items-center pb-4 sm:pb-6 ${state.isComplete ? 'pb-2 sm:pb-4' : ''}`}
          >
            {caseFileHeader}
          </div>

          {!state.isComplete && (
            <div className='mb-4 pt-2 font-semibold text-sm sm:text-base'>
              <span
                className={`px-2 py-1 mr-1 rounded transition-colors duration-200 text-white ${
                  flashGuesses ? 'bg-orange-300' : 'bg-zinc-800'
                }`}
              >
                {state.guessesRemaining}
              </span>
              <span className='text-white'>
                {`guess${state.guessesRemaining === 1 ? '' : 'es'} remaining`}
              </span>
            </div>
          )}
          {!state.isComplete && (
            <GameInput onGuess={handleGuess} previousGuesses={state.guesses} />
          )}
          {!state.isComplete && (
            <div className='pb-12 sm:pb-6 relative flex justify-center items-end'>
              <div className='flex absolute left-0 font-semibold text-md sm:text-base mb-[-40px] sm:mb-[-18px]'>
                <img src={analyzeIcon} className='w-8 h-8' />
                <div className='pt-1 text-white'>Clue #{state.currentClue}</div>
              </div>
              <SkipButton
                onClick={handleSkip}
                currentClue={state.currentClue}
              />
            </div>
          )}
          {!state.isComplete && state.guesses.length > 0 && (
            <div className='max-w-[600px] pb-3'>
              <MissedGuesses missedGuesses={state.guesses} />
            </div>
          )}
        </div>
        <GameComplete
          show={state.isComplete}
          gameName={dailyGame.name}
          appId={dailyGame.appId}
          totalGuesses={state.totalGuesses}
          blurTitleAndAsAmpersand={dailyGame.blurTitleAndAsAmpersand}
          caseFileNumber={caseFileNumber}
          onContinueToNextCase={onContinueToNextCase}
          previousTotalScore={previousTotalScore}
          isCurrentCaseFile={isCurrentCaseFile}
        />
        <ClueContainer caseFile={`casefile-${caseFileNumber}`} />
      </div>
    </SteamDetectiveGameProvider>
  );
};

interface SteamDetectiveProps {
  onResetPuzzle?: () => void;
  onDatePickerClick?: () => void;
}

const SteamDetective: React.FC<SteamDetectiveProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  onResetPuzzle: _,
  onDatePickerClick,
}) => {
  const puzzleDate = getPuzzleDate();
  const [timeLeft] = useState<{ h: number; m: number }>(() =>
    getTimeUntilNextGame(),
  );

  // Get current case file from state (1-4)
  const [currentCaseFile, setCurrentCaseFile] = useState(() => {
    const currentPuzzleDate = getUtcDateString();
    return getCurrentCaseFile(currentPuzzleDate);
  });

  // Check if all cases are complete
  const [allCasesComplete, setAllCasesComplete] = useState(() => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    return !!state?.allCasesComplete;
  });

  // Track if final game complete has been shown
  // Initialize based on whether all cases are complete
  const [showFinalGameComplete, setShowFinalGameComplete] = useState(() => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    return !!state?.allCasesComplete; // Show immediately if already complete
  });
  const hasScheduledFinalComplete = useRef(false);

  // Poll localStorage to detect when current case file completes
  useEffect(() => {
    const checkCompletion = () => {
      const currentPuzzleDate = getUtcDateString();
      const state = getUnifiedState(currentPuzzleDate);
      if (state) {
        // Check if current case file is complete
        const caseFileKey = `caseFile${currentCaseFile}` as keyof typeof state;
        const caseFileState = state[caseFileKey] as
          | SteamDetectiveState
          | undefined;

        if (caseFileState?.isComplete && currentCaseFile === 4) {
          // Case file 4 is complete - show final game complete immediately
          if (!allCasesComplete) {
            setAllCasesComplete(true);
            saveAllCasesComplete(currentPuzzleDate);
          }

          // Show final game complete immediately (score sending is handled by FinalGameComplete)
          if (!hasScheduledFinalComplete.current && !showFinalGameComplete) {
            hasScheduledFinalComplete.current = true;
            setShowFinalGameComplete(true);
          }
        }
      }
    };

    checkCompletion();
    const interval = setInterval(checkCompletion, 500);
    return () => clearInterval(interval);
  }, [currentCaseFile, allCasesComplete, showFinalGameComplete]);

  const handleContinueToNextCase = useCallback(() => {
    const nextCaseFile = currentCaseFile + 1;
    if (nextCaseFile <= 4) {
      setCurrentCaseFile(nextCaseFile);
      const currentPuzzleDate = getUtcDateString();
      saveCurrentCaseFile(currentPuzzleDate, nextCaseFile);
    }
  }, [currentCaseFile]);

  const handleResetPuzzle = async () => {
    const currentPuzzleDate = getUtcDateString();
    clearPuzzleState(currentPuzzleDate);
    window?.location?.reload?.();
  };

  // Generate share text (no longer needed - handled in FinalGameComplete)
  // const handleCopyToShare = useCallback(() => { ... }, []);

  // Get missed case files
  const getMissedCaseFiles = useCallback(() => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    const missed: Array<{ caseNumber: number; gameName: string }> = [];

    if (!state) return missed;

    for (let i = 1; i <= 4; i++) {
      const caseFileKey = `caseFile${i}` as keyof typeof state;
      const caseFileState = state[caseFileKey] as
        | SteamDetectiveState
        | undefined;
      if (caseFileState && caseFileState.totalGuesses === 7) {
        // This case file was missed (7 guesses = DNF)
        missed.push({
          caseNumber: i,
          gameName: caseFileState.revealedTitle || `Case File #${i}`,
        });
      }
    }

    return missed;
  }, []);

  // Get previous total score for a case file
  const getPreviousTotalScore = useCallback((caseFileNumber: number) => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);

    if (!state || !state.caseFileScores) return 0;

    // Sum scores for all case files before this one
    let total = 0;
    for (let i = 0; i < caseFileNumber - 1; i++) {
      total += state.caseFileScores[i] || 0;
    }

    return total;
  }, []);

  return (
    <div className='text-[#c7d5e0]'>
      <Toaster position='top-center' />
      <hr className='h-[1px] bg-gray-700 border-none mb-3'></hr>

      {/* Date Picker Button */}
      <div className='flex justify-center mb-0'>
        <button
          className='flex items-center mb-2 bg-transparent cursor-pointer border-zinc-700 hover:text-white transition-opacity '
          onClick={onDatePickerClick}
        >
          <img src={calendarIcon} className='w-6 h-6 mr-2' alt='Calendar' />
          <span className='text-sm font-semibold underline decoration-dashed decoration-gray-200'>
            {puzzleDate} <span className='text-gray-300'>(UTC)</span>
          </span>
        </button>
      </div>

      {/* Final Game Complete - shown after case file 4, appears at TOP */}
      <AnimatePresence>
        {showFinalGameComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <FinalGameComplete
              show={showFinalGameComplete}
              totalScore={getTotalScore(getUtcDateString())}
              missedCaseFiles={getMissedCaseFiles()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render case files in reverse order (newest at top) */}
      {Array.from({ length: currentCaseFile }, (_, index) => {
        const caseNumber = currentCaseFile - index;
        const isCurrentCase = caseNumber === currentCaseFile;
        const isNewestCase = index === 0;

        const caseContent = (
          <div key={caseNumber}>
            <SteamDetectiveGame
              caseFileNumber={caseNumber}
              onContinueToNextCase={
                isCurrentCase && caseNumber < 4
                  ? handleContinueToNextCase
                  : undefined
              }
              previousTotalScore={getPreviousTotalScore(caseNumber)}
              isCurrentCaseFile={isCurrentCase}
            />
            {caseNumber > 1 && (
              <hr className='h-[2px] bg-gradient-to-r from-transparent via-gray-500 to-transparent border-none my-8 opacity-50' />
            )}
          </div>
        );

        // Animate the newest case file (when it first appears)
        if (isNewestCase && caseNumber > 1) {
          return (
            <AnimatePresence key={caseNumber}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {caseContent}
              </motion.div>
            </AnimatePresence>
          );
        }

        return caseContent;
      })}

      {/* Show reset button if all cases are complete */}
      {allCasesComplete && (
        <div className='flex justify-center mb-4 mt-4'>
          <ResetPuzzleButton onResetPuzzle={handleResetPuzzle} />
        </div>
      )}

      <PuzzleDateTime puzzleDate={puzzleDate} timeLeft={timeLeft} />

      <SteamDetectiveFooter />
    </div>
  );
};

export default SteamDetective;
