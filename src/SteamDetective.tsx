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
import MissedGuesses from './components/MissedGuesses';
import { SteamDetectiveGameProvider } from './contexts/SteamDetectiveGameContext';
import calendarIcon from './assets/calendar-48.png';
import { XMarkIcon } from '@heroicons/react/16/solid';
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

const BANNER_3CASE_KEY = 'steam-detective-banner-3case-v1';

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

  // Tracks the previous state of which clues were shown
  // Used in order to detect when new clues are revealed and trigger auto-scroll behavior.
  const prevShowCluesRef = useRef<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

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
  const hasDetailsTags = clueOrder.includes('details+tags');
  // MFD is bundled with the Details reveal — derived from data, not clueOrder
  const hasMFD = (dailyGame?.moreFromThisDeveloper?.length ?? 0) > 0;
  const configuredCount = clueOrder.length; // 3, 4, or (rarely) 5 if both ss+review

  const clueMapping: Record<string, number> = {
    tags: 1,
    details: 2,
    desc: 3,
    ss: 4,
    review: 5,
  };

  const getShowClues = (): boolean[] => {
    // 8 slots: [tags, details, desc, primary_ss, review_or_secondary_ss, title, secondary_ss_when_details+tags+review, moreFromDev]
    const result = [false, false, false, false, false, false, false, false];

    if (state.isComplete) {
      // Slot[6] is only for the secondary screenshot in the details+tags+review combo.
      // For all other configurations (including plain review without details+tags),
      // the secondary screenshot is never a clue and must not appear on completion.
      // Slot[7] is moreFromDev - show on completion only if game has it configured.
      return [
        true,
        true,
        true,
        true,
        true,
        true,
        hasDetailsTags && hasReviewInOrder,
        hasMFD,
      ];
    }

    for (let i = 0; i < state.currentClue && i < 8; i++) {
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
        (!hasReviewInOrder || hasDetailsTags) &&
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
      moreFromDev: 6, // between tags and review
      review: 7, // review is canonical-last, below moreFromDev
    };

    // clueNames maps result array index (0-7) to canonical position key.
    // result[4] is showClue5 - it's used for the review clue when hasReviewInOrder,
    // or for the secondary screenshot otherwise.
    const clueNames: (keyof typeof canonicalPositions)[] = [
      'tags',
      'details',
      'desc',
      'screenshot1',
      hasReviewInOrder && !hasDetailsTags ? 'review' : 'screenshot2',
      'title',
      'screenshot2', // slot[6]: secondary ss in details+tags+review combo
      'moreFromDev', // slot[7]: more from this developer
    ];
    // When details+tags+review is active, review is already covered by slot[4]
    // above (mapped as screenshot2 since secondary ss is now separate), and
    // slot[6] holds the separately-revealed secondary screenshot.
    if (hasDetailsTags && hasReviewInOrder) {
      clueNames[4] = 'review';
    }

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

    // Extra scroll trigger: when 'ss' is in clueOrder, the primary screenshot
    // (showClues[3]) has a low canonical position so it can never become the
    // new canonical-lowest once any higher-positioned clue is already shown.
    // We need to scroll in two additional cases:
    //   A) ss was JUST revealed as a non-first clue
    //   B) ss is already visible and a new clue is being revealed before clue 5
    const screenshotNowVisible = showClues[3];
    const screenshotWasVisible = prevShowCluesRef.current[3];
    const aNewClueRevealed =
      showClues.filter(Boolean).length >
      prevShowCluesRef.current.filter(Boolean).length;

    // True when the secondary screenshot just auto-revealed. In that case we
    // suppress scroll since it renders at the top of all clues (inside the
    // same screenshot widget as the primary), so no visible layout growth occurs.
    // Two slots are possible: slot[4] for the simple case, slot[6] when the
    // details+tags+review combo is active and the secondary gets its own slot.
    const secondaryScreenshotJustAutoRevealed =
      (!hasReviewInOrder &&
        !hasDetailsTags &&
        !prevShowCluesRef.current[4] &&
        showClues[4]) ||
      (hasDetailsTags &&
        hasReviewInOrder &&
        !prevShowCluesRef.current[6] &&
        showClues[6]);

    const ssJustRevealedNonFirst =
      !isFirstClue &&
      hasSsInOrder &&
      screenshotNowVisible &&
      !screenshotWasVisible;

    const ssVisibleAndNewClueRevealed =
      !isFirstClue &&
      hasSsInOrder &&
      screenshotNowVisible &&
      screenshotWasVisible &&
      aNewClueRevealed &&
      !secondaryScreenshotJustAutoRevealed;

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

    // Title reveal (slot[5]) should never trigger an auto-scroll.
    const titleJustRevealed = !prevShowCluesRef.current[5] && showClues[5];

    if (
      !titleJustRevealed &&
      clueContainerBottomNearViewportBottom() &&
      !isFirstClue &&
      (currentLowestPosition > prevLowestPosition ||
        ssJustRevealedNonFirst ||
        ssVisibleAndNewClueRevealed)
    ) {
      // If MFD carousel is currently shown, add extra scroll to account for its height
      const moreFromDevIsShown = showClues[7];
      const scrollAmount = moreFromDevIsShown ? 380 : 220;

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

  const [bannerDismissed, setBannerDismissed] = useState(
    () => !!localStorage.getItem(BANNER_3CASE_KEY),
  );

  const dismissBanner = () => {
    localStorage.setItem(BANNER_3CASE_KEY, '1');
    setBannerDismissed(true);
  };

  return (
    <div className='text-[#c7d5e0]'>
      <Toaster position='top-center' />
      <hr className='h-[1px] bg-gray-700 border-none mb-3'></hr>

      {/* 3-case-file update banner */}
      {!bannerDismissed && (
        <div className='flex items-stretch text-xs sm:text-sm rounded overflow-hidden border border-blue-500/60 mb-3 bg-blue-900/30'>
          <div className='text-xs flex items-center gap-1 sm:gap-1.5 bg-blue-700/50 border-r border-blue-500/60 px-2 py-1.5 whitespace-nowrap text-blue-100'>
            <span className='font-bold'>Update:</span>
            Apr 18
          </div>
          <div className='px-2 py-1.5 sm:px-3 sm:py-2.5 text-blue-100 flex-1'>
            Moving forward, each day will have{' '}
            <strong>
              <u>3 Case Files</u>
            </strong>{' '}
            instead of 4. Previous days' case files remain unchanged.{' '}
            <div className='mt-1'>
              <button
                onClick={dismissBanner}
                className='ml-2 inline-flex items-center gap-0.5 leading-none align-baseline text-blue-300 hover:text-white bg-transparent border-0 p-0 cursor-pointer transition-colors underline decoration-dotted'
              >
                <XMarkIcon className='h-3 w-3 shrink-0' />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update banner */}
      {/* 
      <div className='flex items-stretch text-xs rounded overflow-hidden border border-gray-500 mb-3 bg-gray-600/20'>
        <div className='flex items-center gap-1 bg-gray-800/40 border-r border-gray-600 px-2 py-1.5 font-semibold whitespace-nowrap text-white'>
          <div className='flex align-middle'>
            <InformationCircleIcon className='h-4 w-4 shrink-0 mr-1 relative top-[1px]' />
            Update
          </div>
        </div>
        <div className='px-2 py-1.5 text-gray-200'>
          Game searching is now more flexible, potentially displaying search
          results that don&apos;t <em>exactly</em> match the query.
          <div className='mt-1.5'>
            Thank you for your patience on this feature &lt;3
          </div>
        </div>
      </div>
      */}
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
          <span className='text-sm font-semibold underline decoration-dashed decoration-gray-200'>
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
          {(allCasesComplete || window.location.hostname === 'localhost') && (
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
