import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSteamDetectiveGame } from '../../contexts/SteamDetectiveGameContext';
import { ClueTitle } from './ClueTitle';
import { ClueScreenshot } from './ClueScreenshot';
import { ClueDescription } from './ClueDescription';
import { ClueDetails } from './ClueDetails';
import { ClueTags } from './ClueTags';
import { ClueReview } from './ClueReview';

interface ClueContainerProps {
  caseFile: 'easy' | 'expert' | `casefile-${number}`;
}

export const ClueContainer: React.FC<ClueContainerProps> = ({ caseFile }) => {
  const { dailyGame, censoredDescription, isComplete, showClues } =
    useSteamDetectiveGame();

  const [showClue1, showClue2, showClue3, showClue4, showClue5, showClue6] =
    showClues;
  const [primaryIsMain, setPrimaryIsMain] = useState(true);

  // When a reviewClue is configured, it takes the secondary screenshot slot.
  const hasReviewClue = !!dailyGame.reviewClue;

  // When swapped, flip both slots together so secondaryScreenshot prop never
  // changes between defined and undefined — FsLightbox uses hook counts that
  // depend on the sources array length, so keeping it stable prevents crashes.
  const mainScreenshot =
    !hasReviewClue && !primaryIsMain && dailyGame.secondaryScreenshot
      ? dailyGame.secondaryScreenshot
      : dailyGame.primaryScreenshot;
  const thumbnailScreenshot =
    !hasReviewClue && dailyGame.secondaryScreenshot
      ? primaryIsMain
        ? dailyGame.secondaryScreenshot
        : dailyGame.primaryScreenshot
      : undefined;

  const handleSwapScreenshots = () => {
    if (showClue5 && !hasReviewClue && dailyGame.secondaryScreenshot) {
      setPrimaryIsMain(!primaryIsMain);
    }
  };

  return (
    <div
      id={`clue-container-${caseFile}`}
      data-clue-container={caseFile}
      className='mx-auto pb-12'
    >
      <motion.div
        layout
        className='bg-[#17222f] rounded-b-xl shadow-[0_20px_50px_rgba(0,0,0,1)] overflow-hidden'
      >
        <ClueTitle
          title={dailyGame.name}
          show={showClue6}
          isComplete={isComplete}
          blurTitleAndAsAmpersand={dailyGame.blurTitleAndAsAmpersand}
          overrideCensoredTitle={dailyGame.overrideCensoredTitle}
        />
        {/* Screenshots - Clue 4 (primary) and Clue 5 (secondary) */}
        <ClueScreenshot
          screenshot={mainScreenshot}
          secondaryScreenshot={thumbnailScreenshot}
          primaryScreenshotUrl={dailyGame.primaryScreenshot}
          show={showClue4}
          showSecondary={
            showClue5 &&
            !hasReviewClue &&
            dailyGame.secondaryScreenshot !== undefined
          }
          blurScreenshotQuarter={dailyGame.blurScreenshotQuarter}
          screenshotLetterbox={dailyGame.screenshotLetterbox}
          transformScreenshotScale={dailyGame.transformScreenshotScale}
          screenshotFocusPoint={dailyGame.screenshotFocusPoint}
          onSwapScreenshots={handleSwapScreenshots}
          isComplete={isComplete}
        />
        <ClueDescription
          shortDescription={dailyGame.shortDescription}
          censoredDescription={censoredDescription}
          isComplete={isComplete}
          show={showClue3}
        />
        <ClueDetails
          allReviewSummary={dailyGame.allReviewSummary}
          releaseDate={dailyGame.releaseDate}
          earlyAccessDate={dailyGame.earlyAccessDate}
          originalReleaseDate={dailyGame.originalReleaseDate}
          developer={dailyGame.developer}
          publisher={dailyGame.publisher}
          show={showClue2}
          isComplete={isComplete}
        />
        <ClueTags
          tags={dailyGame.userTags}
          blurredTags={dailyGame.blurredUserTags}
          show={showClue1}
          isComplete={isComplete}
        />
        {/* Review clue — canonical last position, replaces secondary screenshot */}
        {hasReviewClue && (
          <ClueReview
            review={dailyGame.reviewClue!}
            isComplete={isComplete}
            show={showClue5}
          />
        )}
      </motion.div>
    </div>
  );
};
