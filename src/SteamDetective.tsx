import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
import { getCaseFileCount } from './demos';
import { useDailyGame } from './hooks/useDailyGame';
import { useCensoredDescription } from './hooks/useCensoredDescription';
import { useSteamDetectiveState } from './hooks/useSteamDetectiveState';
import { useGameActions } from './hooks/useGameActions';
import { useClueAutoScroll } from './hooks/useClueAutoScroll';
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
import blueGamesFolderIcon from './assets/games-folder-48.png';
import greenGamesFolderIcon from './assets/green-games-folder-48.png';
import purpleGamesFolderIcon from './assets/purple-games-folder-48.png';
import redGamesFolderIcon from './assets/red-games-folder-48.png';
import analyzeIcon from './assets/analyze-48.png';

// Map case file numbers to their folder icons
// The last case file always uses the red icon, regardless of total count.
const getCaseFileIcon = (
  caseFileNumber: number,
  totalCaseFiles: number,
): string => {
  if (caseFileNumber === totalCaseFiles) return redGamesFolderIcon;
  const iconMap: Record<number, string> = {
    1: blueGamesFolderIcon,
    2: greenGamesFolderIcon,
    3: purpleGamesFolderIcon,
  };
  return iconMap[caseFileNumber] || blueGamesFolderIcon;
};

// Preload all folder icons
const usePreloadFolderIcons = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const icons = [
      blueGamesFolderIcon,
      greenGamesFolderIcon,
      purpleGamesFolderIcon,
      redGamesFolderIcon,
    ];

    let loadedCount = 0;
    icons.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === icons.length) {
          setLoaded(true);
        }
      };
      img.src = src;
    });
  }, []);

  return loaded;
};

interface SteamDetectiveGameProps {
  caseFileNumber: number; // 1-4
  totalCaseFiles: number;
  onContinueToNextCase?: () => void;
  previousTotalScore?: number;
  isCurrentCaseFile?: boolean;
}

const SteamDetectiveGame: React.FC<SteamDetectiveGameProps> = ({
  caseFileNumber,
  totalCaseFiles,
  onContinueToNextCase,
  previousTotalScore = 0,
  isCurrentCaseFile = true,
}) => {
  const [flashGuesses, setFlashGuesses] = useState(false);

  // Preload folder icons
  const iconsLoaded = usePreloadFolderIcons();

  const dailyGame = useDailyGame(caseFileNumber);

  const censoredDescription = useCensoredDescription(
    dailyGame?.shortDescription || '',
  );
  const censoredDeveloperDescription = useCensoredDescription(
    dailyGame?.developerDescription || '',
  );

  const { state, setState } = useSteamDetectiveState(
    dailyGame?.name || '',
    caseFileNumber,
  );
  const { handleSkip, handleGuess } = useGameActions({
    state,
    setState,
    gameName: dailyGame?.name || '',
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
  const clueOrder = dailyGame?.clueOrder || ['tags', 'details', 'desc'];
  const hasSsInOrder = clueOrder.includes('ss');
  const hasReviewInOrder = clueOrder.includes('review');
  const hasExtrasInOrder = clueOrder.includes('extras');
  const hasDetailsTags = clueOrder.includes('details+tags');
  // MFD is bundled with the Details reveal — derived from data, not clueOrder
  const hasMFD = (dailyGame?.moreFromThisDeveloper?.length ?? 0) > 0;
  const hasExtras = !!(
    dailyGame?.extrasClue &&
    (dailyGame.extrasClue.achievements?.length ?? 0) > 0
  );
  const configuredCount = clueOrder.length; // 3, 4, or (rarely) 5 if both ss+review/extras

  const clueMapping: Record<string, number> = {
    tags: 1,
    details: 2,
    desc: 3,
    ss: 4,
    review: 5,
    extras: 9,
  };

  const getShowClues = (): boolean[] => {
    // 9 slots: [tags, details, desc, primary_ss, review_or_secondary_ss, title, secondary_ss_when_details+tags+review, moreFromDev, extras]
    const result = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];

    if (state.isComplete) {
      // Slot[6] is only for the secondary screenshot in the details+tags+review combo.
      // For all other configurations (including plain review without details+tags),
      // the secondary screenshot is never a clue and must not appear on completion.
      // Slot[7] is moreFromDev - show on completion only if game has it configured.
      // Slot[8] is extras - show on completion only if game has it configured.
      // Slot[4] is review-or-secondary-ss. It must only be true when:
      //   - review is in order (ClueReview renders here), OR
      //   - no extras in order (secondary screenshot auto-reveals here), OR
      //   - details+tags combo is active (secondary screenshot also auto-reveals here).
      // When extras IS in clueOrder (and no review/details+tags), secondary screenshot
      // was never shown during gameplay and must not appear on completion.
      return [
        true,
        true,
        true,
        true,
        hasReviewInOrder || !hasExtrasInOrder || hasDetailsTags,
        true,
        hasDetailsTags && hasReviewInOrder,
        hasMFD,
        hasExtras,
      ];
    }

    for (let i = 0; i < state.currentClue && i < 9; i++) {
      if (i < configuredCount && i < clueOrder.length) {
        const clueType = clueOrder[i];
        if (clueType === 'details+tags') {
          result[0] = true; // tags slot
          result[1] = true; // details slot
        } else {
          const clueIndex = clueMapping[clueType] - 1;
          result[clueIndex] = true;
        }
      } else if (!hasSsInOrder && i === configuredCount) {
        // Primary screenshot auto-reveal: fires after all configured clues
        // (only when primary screenshot wasn't placed in the configured order via 'ss')
        result[3] = true;
      } else if (
        ((!hasReviewInOrder && !hasExtrasInOrder) || hasDetailsTags) &&
        i === configuredCount + (!hasSsInOrder ? 1 : 0)
      ) {
        // Secondary screenshot auto-reveal: fires after primary screenshot.
        // When details+tags+review is active, slot[4] is used by the review clue,
        // so secondary screenshot gets its own dedicated slot[6].
        if (hasDetailsTags && hasReviewInOrder) {
          result[6] = true;
        } else {
          result[4] = true;
        }
      } else if (i === 5) {
        result[5] = true;
      }
    }

    // MFD is always revealed together with the Details clue (slot[1])
    if (hasMFD) result[7] = result[1];

    return result;
  };

  const showClues = getShowClues();

  useClueAutoScroll({
    showClues,
    caseFileNumber,
    clueOrder,
    hasSsInOrder,
    hasReviewInOrder,
    hasExtrasInOrder,
    hasDetailsTags,
    hasWebms: !!dailyGame?.webms?.length,
    shortDescriptionLength: dailyGame?.shortDescription?.length ?? 0,
    isComplete: state.isComplete,
  });

  const caseFileHeader = useMemo(() => {
    return (
      <h2 className='text-lg text-white sm:text-2xl mb-[-5px] sm:py-0 sm:mb-0 font-bold'>
        <div className='flex items-center'>
          <img
            src={getCaseFileIcon(caseFileNumber, totalCaseFiles)}
            className={`transition-opacity duration-200 ${
              iconsLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className='pl-1'>
            Case File #{caseFileNumber}{' '}
            <span className='text-gray-500'>of {totalCaseFiles}</span>
          </div>
        </div>
      </h2>
    );
  }, [iconsLoaded, caseFileNumber, totalCaseFiles]);

  // If there's no demo configured for this date, don't render anything
  // The parent component will handle showing the "brb" message
  if (!dailyGame) {
    return null;
  }

  return (
    <SteamDetectiveGameProvider
      dailyGame={dailyGame}
      censoredDescription={censoredDescription}
      censoredDeveloperDescription={censoredDeveloperDescription}
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
            <GameInput
              onGuess={handleGuess}
              previousGuesses={state.guesses}
              excludeOptions={dailyGame.excludeOptions}
            />
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
          totalCaseFiles={totalCaseFiles}
          onContinueToNextCase={onContinueToNextCase}
          previousTotalScore={previousTotalScore}
          isCurrentCaseFile={isCurrentCaseFile}
          suggestedBy={dailyGame.suggestedBy}
          gameCompleteMessage={dailyGame.gameCompleteMessage}
          gameCompleteYoutubeEmbed={dailyGame.gameCompleteYoutubeEmbed}
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
  // Lock the puzzle date at mount so all operations in this session use a consistent date.
  const [sessionPuzzleDate] = useState(() => getUtcDateString());
  const [timeLeft] = useState<{ h: number; m: number }>(() =>
    getTimeUntilNextGame(),
  );

  // Check if this is a demo day or if we should show "brb"
  const dailyGameCheck = useDailyGame(1);

  // Number of case files for today's puzzle (3 or 4)
  const totalCaseFiles = getCaseFileCount(sessionPuzzleDate);

  // Get current case file from state (1-based)
  const [currentCaseFile, setCurrentCaseFile] = useState(() =>
    getCurrentCaseFile(sessionPuzzleDate),
  );

  // Check if all cases are complete
  const [allCasesComplete, setAllCasesComplete] = useState(() => {
    const state = getUnifiedState(sessionPuzzleDate);
    return !!state?.allCasesComplete;
  });

  // Track if final game complete has been shown
  // Initialize based on whether all cases are complete
  const [showFinalGameComplete, setShowFinalGameComplete] = useState(() => {
    const state = getUnifiedState(sessionPuzzleDate);
    return !!state?.allCasesComplete; // Show immediately if already complete
  });
  const hasScheduledFinalComplete = useRef(false);

  // Poll localStorage to detect when current case file completes
  useEffect(() => {
    const checkCompletion = () => {
      const state = getUnifiedState(sessionPuzzleDate);
      if (state) {
        // Check if current case file is complete
        const caseFileKey = `caseFile${currentCaseFile}` as keyof typeof state;
        const caseFileState = state[caseFileKey] as
          | SteamDetectiveState
          | undefined;

        if (caseFileState?.isComplete && currentCaseFile === totalCaseFiles) {
          // Last case file is complete - show final game complete immediately
          if (!allCasesComplete) {
            setAllCasesComplete(true);
            saveAllCasesComplete(sessionPuzzleDate);
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
  }, [
    currentCaseFile,
    totalCaseFiles,
    allCasesComplete,
    showFinalGameComplete,
    sessionPuzzleDate,
  ]);

  const handleContinueToNextCase = useCallback(() => {
    const nextCaseFile = currentCaseFile + 1;
    if (nextCaseFile <= totalCaseFiles) {
      setCurrentCaseFile(nextCaseFile);
      saveCurrentCaseFile(sessionPuzzleDate, nextCaseFile);
    }
  }, [currentCaseFile, totalCaseFiles, sessionPuzzleDate]);

  // Scroll to true top AFTER the new case file has been inserted into the DOM
  const prevCaseFileRef = useRef(currentCaseFile);
  useLayoutEffect(() => {
    if (currentCaseFile !== prevCaseFileRef.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      prevCaseFileRef.current = currentCaseFile;
    }
  }, [currentCaseFile]);

  const handleResetPuzzle = async () => {
    clearPuzzleState(sessionPuzzleDate);
    window?.location?.reload?.();
  };

  // Generate share text (no longer needed - handled in FinalGameComplete)
  // const handleCopyToShare = useCallback(() => { ... }, []);

  // Get missed case files
  const getMissedCaseFiles = useCallback(() => {
    const state = getUnifiedState(sessionPuzzleDate);
    const missed: Array<{ caseNumber: number; gameName: string }> = [];

    if (!state) return missed;

    const count = getCaseFileCount(sessionPuzzleDate);
    for (let i = 1; i <= count; i++) {
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
  }, [sessionPuzzleDate]);

  // Get previous total score for a case file
  const getPreviousTotalScore = useCallback(
    (caseFileNumber: number) => {
      const state = getUnifiedState(sessionPuzzleDate);

      if (!state || !state.caseFileScores) return 0;

      // Sum scores for all case files before this one
      let total = 0;
      for (let i = 0; i < caseFileNumber - 1; i++) {
        total += state.caseFileScores[i] || 0;
      }

      return total;
    },
    [sessionPuzzleDate],
  );

  return (
    <div className='text-[#c7d5e0]'>
      <Toaster position='top-center' />
      <hr className='h-[1px] bg-gray-700 border-none mb-3'></hr>

      {/* If no demo configured for this date, show "brb" post-it note */}
      {!dailyGameCheck && (
        <>
          <div className='mt-12 mb-3'>
            <div className='note yellow min-h-[200px]'>
              <div className='flex'>
                working on it &nbsp;<span className='rotate-90'>:)</span>
              </div>
            </div>
            <div className='text-gray-200 text-xl text-center mt-3 font-bold'>
              <h2 className='text-xl font-bold'>While you wait ...</h2>
              <div className='font-normal text-gray-300'>
                Try case files from the past!
              </div>
            </div>
          </div>
        </>
      )}
      {/* Date Picker Button */}
      <div className='flex justify-center mb-0'>
        <button
          className={`flex items-center mb-2 cursor-pointer hover:text-white transition-opacity ${!dailyGameCheck ? 'bg-green-700 text-white' : 'bg-transparent border-zinc-700'}`}
          onClick={onDatePickerClick}
        >
          <img src={calendarIcon} className='w-6 h-6 mr-2' alt='Calendar' />
          <span className='text-sm font-semibold underline decoration-dashed decoration-1 decoration-gray-200'>
            {puzzleDate} <span className='text-gray-300'>(UTC)</span>
          </span>
        </button>
      </div>

      {/* Only render game content if there's a demo */}
      {dailyGameCheck && (
        <>
          {/* Final Game Complete - shown after last case file, appears at TOP */}
          <AnimatePresence>
            {showFinalGameComplete && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <FinalGameComplete
                  show={showFinalGameComplete}
                  totalScore={getTotalScore(sessionPuzzleDate)}
                  missedCaseFiles={getMissedCaseFiles()}
                  puzzleDate={sessionPuzzleDate}
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
                  totalCaseFiles={totalCaseFiles}
                  onContinueToNextCase={
                    isCurrentCase && caseNumber < totalCaseFiles
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

          {/* Show reset button if all cases are complete (or always on localhost) */}
          {(allCasesComplete ||
            window.location?.hostname === 'localhost' ||
            window.location?.href?.includes('/admin')) && (
            <div className='flex justify-center mb-4 mt-4'>
              <ResetPuzzleButton onResetPuzzle={handleResetPuzzle} />
            </div>
          )}
        </>
      )}
      {dailyGameCheck && (
        <PuzzleDateTime puzzleDate={puzzleDate} timeLeft={timeLeft} />
      )}
      <SteamDetectiveFooter />
    </div>
  );
};

export default SteamDetective;
