import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPuzzleDate,
  getTimeUntilNextGame,
  getUtcDateString,
  getRealUtcDateString,
  clearPuzzleState,
  getUnifiedState,
  saveExpertStarted,
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
} from './components/SteamDetective';
import blueGamesFolderIcon from './assets/games-folder-48.png';
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
  caseFile: 'easy' | 'expert';
  onStartExpertCase?: () => void;
  puzzleDate: string;
  easyTotalGuesses?: number;
  expertCaseStarted?: boolean;
}

const SteamDetectiveGame: React.FC<SteamDetectiveGameProps> = ({
  caseFile,
  onStartExpertCase,
  puzzleDate,
  easyTotalGuesses,
  expertCaseStarted,
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

  // Preload folder icons
  const blueIconLoaded = useImagePreloader(blueGamesFolderIcon);
  const greenIconLoaded = useImagePreloader(greenGamesFolderIcon);

  const dailyGame = useDailyGame(caseFile);
  const censoredDescription = useCensoredDescription(
    dailyGame.shortDescription,
  );

  const { state, setState } = useSteamDetectiveState(dailyGame.name, caseFile);
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

  // Scroll to top when game is completed (both easy and expert)
  useEffect(() => {
    if (state.isComplete) {
      // Force scroll to top with multiple attempts to ensure it happens
      // First immediate scroll
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });

      // Then smooth scroll after a delay to override any competing scrolls
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 150);
    }
  }, [state.isComplete]);

  // Determine which clues to show based on custom clue order
  // Default order: tags, details, desc (clues 1-3), then screenshot1, screenshot2, title (clues 4-6)
  const clueOrder = dailyGame.clueOrder || ['tags', 'details', 'desc'];

  // Map custom order to showClues array [showClue1=tags, showClue2=details, showClue3=desc, showClue4=screenshot1, showClue5=screenshot2, showClue6=title]
  const clueMapping: Record<string, number> = {
    tags: 1,
    details: 2,
    desc: 3,
  };

  // Create mapping from currentClue to which canonical clues should be shown
  const getShowClues = (): boolean[] => {
    const result = [false, false, false, false, false, false]; // [tags, details, desc, screenshot1, screenshot2, title]

    if (state.isComplete) {
      return [true, true, true, true, true, true];
    }

    // Show clues based on current clue and custom order
    for (let i = 0; i < state.currentClue && i < 6; i++) {
      if (i < 3) {
        // First 3 clues use custom order
        const clueType = clueOrder[i];
        const clueIndex = clueMapping[clueType] - 1; // Convert to 0-indexed
        result[clueIndex] = true;
      } else if (i === 3) {
        // Clue 4: first screenshot
        result[3] = true;
      } else if (i === 4) {
        // Clue 5: second screenshot
        result[4] = true;
      } else if (i === 5) {
        // Clue 6: title
        result[5] = true;
      }
    }

    return result;
  };

  const showClues = getShowClues();

  // Auto-scroll down when a new clue becomes the lowest displayed clue
  useEffect(() => {
    // Don't auto-scroll down when the game is complete (we want to scroll up instead)
    if (state.isComplete) {
      return;
    }

    // Canonical positions (lower number = higher on page, higher number = lower on page)
    const canonicalPositions = {
      title: 0,
      screenshot1: 1,
      screenshot2: 2,
      desc: 3,
      details: 4,
      tags: 5,
    };

    // Map showClues indices to canonical clue names
    const clueNames = [
      'tags',
      'details',
      'desc',
      'screenshot1',
      'screenshot2',
      'title',
    ];

    // Get the canonical position of the lowest currently shown clue
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

    // Check if this is the first clue (all previous clues were false)
    const isFirstClue = prevShowCluesRef.current.every((clue) => !clue);
    // If a new clue has become the lowest (higher canonical position number), scroll down
    // Exception: don't scroll on the first clue
    // Check if the clue container is outside viewport or near the bottom
    const getClueContainerElement = () => {
      // Find the specific clue container for the current case file
      return document.querySelector(
        `[data-clue-container="${caseFile}"]`,
      ) as HTMLElement;
    };

    const clueContainerBottomNearViewportBottom = () => {
      const container = getClueContainerElement();
      if (!container) return false;

      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerBottom = rect.bottom;

      // Check if bottom is outside viewport (below) or within 150px of bottom
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

      // Delay scroll to ensure DOM has updated with new content
      setTimeout(() => {
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth',
        });
      }, 100);
    }

    // Always update ref after comparison, regardless of whether we scrolled
    prevShowCluesRef.current = showClues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClues, state.isComplete]);

  const handleCopyToShare = useCallback(() => {
    // Generate emoji representation of guesses
    const generateEmojiText = (totalGuesses: number) => {
      if (totalGuesses === 7) {
        return '🟥🟥🟥🟥🟥🟥';
      }
      const emojis = [];
      for (let i = 1; i <= 6; i++) {
        if (i < totalGuesses) {
          emojis.push('🟥');
        } else if (i === totalGuesses) {
          emojis.push('✅');
        } else {
          emojis.push('⬜');
        }
      }
      return emojis.join('');
    };

    let emojiText = '';
    if (
      caseFile === 'expert' &&
      easyTotalGuesses !== undefined &&
      easyTotalGuesses > 0
    ) {
      // For expert mode, include both easy and expert scores
      const easyEmoji = generateEmojiText(easyTotalGuesses);
      const expertEmoji = generateEmojiText(state.totalGuesses);
      emojiText = `1️⃣  ${easyEmoji} \n2️⃣  ${expertEmoji}`;
    } else {
      // For easy mode, just show the easy score
      emojiText = `${generateEmojiText(state.totalGuesses)} 📁 #1`;
    }

    // Include /d/{date} in URL if puzzle date is not today
    const realToday = getRealUtcDateString();
    const rawPuzzleDate = getUtcDateString(); // YYYY-MM-DD format
    const baseUrl =
      rawPuzzleDate === realToday
        ? 'https://steamdetective.wtf/'
        : `https://steamdetective.wtf/d/${rawPuzzleDate}`;
    const shareText = `${baseUrl}\n${puzzleDate} 🕵️ #SteamDetective\n${emojiText}`;
    navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
  }, [state.totalGuesses, puzzleDate, caseFile, easyTotalGuesses]);

  const handleScoreSent = useCallback(() => {
    setState({ ...state, scoreSent: true });
  }, [state, setState]);

  const caseFileHeader = useMemo(() => {
    return (
      <h2 className='text-lg text-white sm:text-2xl mb-[-5px] sm:py-0 sm:mb-0 font-bold'>
        <div className='flex items-center'>
          <img
            src={
              caseFile === 'easy' ? greenGamesFolderIcon : blueGamesFolderIcon
            }
            className={`transition-opacity duration-200 ${
              caseFile === 'easy'
                ? blueIconLoaded
                  ? 'opacity-100'
                  : 'opacity-0'
                : greenIconLoaded
                  ? 'opacity-100'
                  : 'opacity-0'
            }`}
          />
          <div className='pl-1'>
            Case File{' '}
            {caseFile === 'easy' ? (
              '#1'
            ) : (
              <>
                <span className='text-md'>#</span>2
              </>
            )}{' '}
            <span className='text-gray-500'>of 2</span>
          </div>
        </div>
      </h2>
    );
  }, [blueIconLoaded, caseFile, greenIconLoaded]);

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
          onCopyToShare={handleCopyToShare}
          scoreSent={state.scoreSent}
          onScoreSent={handleScoreSent}
          blurTitleAndAsAmpersand={dailyGame.blurTitleAndAsAmpersand}
          caseFile={caseFile}
          onStartExpertCase={onStartExpertCase}
          expertCaseStarted={expertCaseStarted}
        />
        <ClueContainer caseFile={caseFile} />
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

  // Check if expert case file has been started by looking for saved state in localStorage
  const [showExpertCase, setShowExpertCase] = useState(() => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    return !!state?.expertStarted;
  });

  // Track if both cases are complete with state (not just a callback)
  const [bothCasesComplete, setBothCasesComplete] = useState(() => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    if (state) {
      const easyComplete = state.steamDetective?.isComplete || false;
      const expertComplete = state.steamDetectiveExpert?.isComplete || false;
      return easyComplete && expertComplete;
    }
    return false;
  });

  // Poll localStorage to detect when both cases are complete
  useEffect(() => {
    const checkCompletion = () => {
      const currentPuzzleDate = getUtcDateString();
      const state = getUnifiedState(currentPuzzleDate);
      if (state) {
        const easyComplete = state.steamDetective?.isComplete || false;
        const expertComplete = state.steamDetectiveExpert?.isComplete || false;
        const areBothComplete = easyComplete && expertComplete;
        if (areBothComplete !== bothCasesComplete) {
          setBothCasesComplete(areBothComplete);
        }
      }
    };

    // Check immediately
    checkCompletion();

    // Poll every 500ms to detect changes
    const interval = setInterval(checkCompletion, 500);
    return () => clearInterval(interval);
  }, [bothCasesComplete]);

  // Get easy game's total guesses directly from localStorage (not from a separate state hook)
  const getEasyTotalGuesses = useCallback((): number => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    return state?.steamDetective?.totalGuesses || 0;
  }, []);

  // Check if expert case has been started
  const hasExpertCaseStarted = useCallback((): boolean => {
    const currentPuzzleDate = getUtcDateString();
    const state = getUnifiedState(currentPuzzleDate);
    return !!state?.expertStarted;
  }, []);

  const handleStartExpertCase = useCallback(() => {
    setShowExpertCase(true);
    const currentPuzzleDate = getUtcDateString();
    saveExpertStarted(currentPuzzleDate);
  }, []);

  const handleResetPuzzle = async () => {
    const currentPuzzleDate = getUtcDateString();
    clearPuzzleState(currentPuzzleDate);
    window?.location?.reload?.();
  };

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

      {/* Expert Case File - Renders ABOVE easy when shown */}
      <AnimatePresence>
        {showExpertCase && (
          <motion.div
            id='expert-case-section'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='mb-8'
          >
            <SteamDetectiveGame
              caseFile='expert'
              puzzleDate={puzzleDate}
              easyTotalGuesses={getEasyTotalGuesses()}
            />
            <hr className='h-[2px] bg-gradient-to-r from-transparent via-gray-500 to-transparent border-none my-8 opacity-50' />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easy Case File */}
      <motion.div
        animate={{ y: showExpertCase ? 0 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <SteamDetectiveGame
          caseFile='easy'
          onStartExpertCase={handleStartExpertCase}
          puzzleDate={puzzleDate}
          expertCaseStarted={hasExpertCaseStarted()}
        />
      </motion.div>

      {/* Show reset button if expert is shown AND both cases are complete */}
      {showExpertCase && bothCasesComplete && (
        <div className='flex justify-center mb-4'>
          <ResetPuzzleButton onResetPuzzle={handleResetPuzzle} />
        </div>
      )}

      <PuzzleDateTime puzzleDate={puzzleDate} timeLeft={timeLeft} />

      <SteamDetectiveFooter />
    </div>
  );
};

export default SteamDetective;
