import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSteamDetectiveGame } from '../../contexts/SteamDetectiveGameContext';
import { ClueTitle } from './ClueTitle';
import { ClueScreenshot } from './ClueScreenshot';
import { ClueDescription } from './ClueDescription';
import { ClueDetails } from './ClueDetails';
import { ClueTags } from './ClueTags';
import { ClueReview } from './ClueReview';
import { ClueMoreFromDeveloper } from './ClueMoreFromDeveloper';
import { ClueWebm } from './ClueWebm';

interface ClueContainerProps {
  caseFile: 'easy' | 'expert' | `casefile-${number}`;
}

export const ClueContainer: React.FC<ClueContainerProps> = ({ caseFile }) => {
  const {
    dailyGame,
    censoredDescription,
    censoredDeveloperDescription,
    isComplete,
    showClues,
  } = useSteamDetectiveGame();

  const [
    showClue1,
    showClue2,
    showClue3,
    showClue4,
    showClue5,
    showClue6,
    showClue7 = false,
    showClue8 = false,
  ] = showClues;
  const [primaryIsMain, setPrimaryIsMain] = useState(true);

  // When reviewClues/reviewClue is configured, it takes the secondary screenshot slot.
  const hasReviewClue =
    !!(dailyGame.reviewClues && dailyGame.reviewClues.length > 0) ||
    !!dailyGame.reviewClue;
  const reviewsForClue =
    dailyGame.reviewClues ||
    (dailyGame.reviewClue ? [dailyGame.reviewClue] : []);

  // When webms are provided, they replace the secondary screenshot clue.
  const hasWebms = !!(dailyGame.webms && dailyGame.webms.length > 0);

  // When swapped, flip both slots together so secondaryScreenshot prop never
  // changes between defined and undefined - FsLightbox uses hook counts that
  // depend on the sources array length, so keeping it stable prevents crashes.
  // showClue7 is the dedicated secondary-screenshot slot used when the
  // details+tags+review combo is active (hasReviewClue is true but secondary
  // ss should still be shown independently).
  // When webms are present, they take the secondary screenshot slot instead.
  const secondaryIsRevealed =
    !hasWebms && (showClue7 || (showClue5 && !hasReviewClue));
  const webmsRevealed =
    hasWebms && (showClue7 || (showClue5 && !hasReviewClue));
  const mainScreenshot =
    secondaryIsRevealed && !primaryIsMain && dailyGame.secondaryScreenshot
      ? dailyGame.secondaryScreenshot
      : dailyGame.primaryScreenshot;
  const thumbnailScreenshot =
    secondaryIsRevealed && dailyGame.secondaryScreenshot
      ? primaryIsMain
        ? dailyGame.secondaryScreenshot
        : dailyGame.primaryScreenshot
      : undefined;

  const handleSwapScreenshots = () => {
    if (secondaryIsRevealed && dailyGame.secondaryScreenshot) {
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
        {/* Webm clue(s) - canonical between title and primary screenshot */}
        {hasWebms && (
          <ClueWebm
            webms={dailyGame.webms!}
            show={webmsRevealed}
            isComplete={isComplete}
            keepPlayingOnComplete={dailyGame.webmKeepPlayingOnComplete}
          />
        )}
        {/* Screenshots - Clue 4 (primary) and Clue 5 (secondary) */}
        <ClueScreenshot
          screenshot={mainScreenshot}
          secondaryScreenshot={thumbnailScreenshot}
          primaryScreenshotUrl={dailyGame.primaryScreenshot}
          show={showClue4}
          showSecondary={
            secondaryIsRevealed && dailyGame.secondaryScreenshot !== undefined
          }
          blurScreenshotQuarter={dailyGame.blurScreenshotQuarter}
          screenshotLetterbox={dailyGame.screenshotLetterbox}
          transformScreenshotScale={dailyGame.transformScreenshotScale}
          screenshotFocusPoint={dailyGame.screenshotFocusPoint}
          zoomLabelPosition={dailyGame.zoomLabelPosition}
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
        {/* More from this Developer clue - canonical between tags and review */}
        {dailyGame.moreFromThisDeveloper &&
          dailyGame.moreFromThisDeveloper.length > 0 && (
            <ClueMoreFromDeveloper
              games={dailyGame.moreFromThisDeveloper}
              censoredDeveloperDescription={
                censoredDeveloperDescription.length > 0
                  ? censoredDeveloperDescription
                  : undefined
              }
              developerDescription={dailyGame.developerDescription}
              show={showClue8}
              isComplete={isComplete}
            />
          )}
        {/* Review clue(s) - canonical last position, replaces secondary screenshot */}
        {hasReviewClue && (
          <ClueReview
            reviews={reviewsForClue}
            isComplete={isComplete}
            show={showClue5}
          />
        )}
      </motion.div>
    </div>
  );
};
