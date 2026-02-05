import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSteamDetectiveGame } from '../../contexts/SteamDetectiveGameContext';
import { ClueTitle } from './ClueTitle';
import { ClueScreenshot } from './ClueScreenshot';
import { ClueDescription } from './ClueDescription';
import { ClueDetails } from './ClueDetails';
import { ClueTags } from './ClueTags';

interface ClueContainerProps {
  caseFile: 'easy' | 'expert';
}

export const ClueContainer: React.FC<ClueContainerProps> = ({ caseFile }) => {
  const { dailyGame, censoredDescription, isComplete, showClues } =
    useSteamDetectiveGame();

  const [showClue1, showClue2, showClue3, showClue4, showClue5, showClue6] =
    showClues;
  const [primaryIsMain, setPrimaryIsMain] = useState(true);

  const mainScreenshot = primaryIsMain
    ? dailyGame.primaryScreenshot
    : dailyGame.secondaryScreenshot || dailyGame.primaryScreenshot;
  const thumbnailScreenshot = primaryIsMain
    ? dailyGame.secondaryScreenshot
    : dailyGame.primaryScreenshot;

  const handleSwapScreenshots = () => {
    if (showClue5 && dailyGame.secondaryScreenshot) {
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
        className='bg-[#17222f] rounded shadow-[0_20px_50px_rgba(0,0,0,1)] overflow-hidden'
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
          show={showClue4}
          showSecondary={
            showClue5 && dailyGame.secondaryScreenshot !== undefined
          }
          blurScreenshotQuarter={dailyGame.blurScreenshotQuarter}
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
      </motion.div>
    </div>
  );
};
