import { useEffect, useRef } from 'react';

interface UseClueAutoScrollParams {
  showClues: boolean[];
  caseFileNumber: number;
  clueOrder: string[];
  hasSsInOrder: boolean;
  hasReviewInOrder: boolean;
  hasExtrasInOrder: boolean;
  hasDetailsTags: boolean;
  hasWebms: boolean;
  shortDescriptionLength: number;
  isComplete: boolean;
}

export function useClueAutoScroll({
  showClues,
  caseFileNumber,
  clueOrder,
  hasSsInOrder,
  hasReviewInOrder,
  hasExtrasInOrder,
  hasDetailsTags,
  hasWebms,
  shortDescriptionLength,
  isComplete,
}: UseClueAutoScrollParams): void {
  const prevShowCluesRef = useRef<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  // Auto-scroll down when a new clue becomes the lowest displayed clue
  useEffect(() => {
    if (isComplete) {
      return;
    }

    const canonicalPositions = {
      title: 0,
      webm: 0.5, // between title and screenshot1
      screenshot1: 1,
      screenshot2: 2,
      desc: 3,
      details: 4,
      tags: 5,
      moreFromDev: 6, // between tags and extras/review
      extras: 7, // extras is second-to-last, below moreFromDev
      review: 8, // review is canonical-last, below extras
    };

    // clueNames maps result array index (0-8) to canonical position key.
    // result[4] is showClue5 - it's used for the review/extras clue when in order,
    // or for the secondary screenshot otherwise.
    const clueNames: (keyof typeof canonicalPositions)[] = [
      'tags',
      'details',
      'desc',
      'screenshot1',
      hasReviewInOrder && !hasDetailsTags
        ? 'review'
        : hasExtrasInOrder && !hasDetailsTags
          ? 'extras'
          : hasWebms
            ? 'webm'
            : 'screenshot2',
      'title',
      hasWebms ? 'webm' : 'screenshot2', // slot[6]: secondary ss or webm
      'moreFromDev', // slot[7]: more from this developer
      'extras', // slot[8]: extras clue
    ];
    // When details+tags+review is active, review is already covered by slot[4]
    // above (mapped as webm/screenshot2 since secondary ss is now separate), and
    // slot[6] holds the separately-revealed secondary screenshot or webm.
    if (hasDetailsTags && hasReviewInOrder) {
      clueNames[4] = 'review';
    }
    // When details+tags+extras is active without review, extras uses slot[8] canonically
    // so slot[4] gets mapped normally above. No override needed.

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
    // When webms are present, layout DOES grow (videos appear near top), so don't suppress.
    const secondaryScreenshotJustAutoRevealed =
      !hasWebms &&
      ((!hasReviewInOrder &&
        !hasExtrasInOrder &&
        !hasDetailsTags &&
        !prevShowCluesRef.current[4] &&
        showClues[4]) ||
        (hasDetailsTags &&
          !hasReviewInOrder &&
          !prevShowCluesRef.current[4] &&
          showClues[4]) ||
        (hasDetailsTags &&
          hasReviewInOrder &&
          !prevShowCluesRef.current[6] &&
          showClues[6]));

    // When review (slot[4]) was already shown before ss is revealed, the screenshot
    // appears ABOVE review/tags/details in the layout (canonical pos 1 vs 8/5/4).
    // Scrolling down would move the user away from the new screenshot content.
    const ssRevealedWhileReviewAlreadyShown =
      hasSsInOrder &&
      hasReviewInOrder &&
      !hasDetailsTags &&
      screenshotNowVisible &&
      !screenshotWasVisible &&
      prevShowCluesRef.current[4]; // review slot was already visible

    const ssJustRevealedNonFirst =
      !isFirstClue &&
      hasSsInOrder &&
      screenshotNowVisible &&
      !screenshotWasVisible &&
      !ssRevealedWhileReviewAlreadyShown;

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

    // When MFD is bundled with Details (slot[7] = slot[1]), its canonical position (6)
    // is already higher than Tags (5). So when Tags (slot[0]) is newly revealed,
    // currentLowestPosition stays at 6 (MFD) and no scroll fires. Detect this explicitly.
    const tagsJustRevealedWithMFD =
      !prevShowCluesRef.current[0] && showClues[0] && showClues[7];

    // When Tags (slot[0]) was already shown and Details+MFD (slot[1]+slot[7]) are
    // newly revealed together, the scroll fires (moreFromDev pos 6 > tags pos 5) but
    // uses the large 380 amount because moreFromDevIsShown=true. Use the short variant
    // instead since the viewport is already near the bottom of the Tags clue.
    const detailsAndMFDJustRevealedWhileTagsShown =
      prevShowCluesRef.current[0] &&
      !prevShowCluesRef.current[1] &&
      showClues[1] &&
      showClues[7];

    // For the exact order ['review', 'desc', 'tags', 'details'], review (canonical pos 8)
    // is revealed first and permanently anchors currentLowestPosition at 8. When tags
    // (pos 5) is revealed after desc (pos 3), it appears below desc and does grow the
    // container downward, but the canonical-lowest check never fires. Detect explicitly.
    const isReviewDescTagsDetailsOrder =
      clueOrder.length === 4 &&
      clueOrder[0] === 'review' &&
      clueOrder[1] === 'desc' &&
      clueOrder[2] === 'tags' &&
      clueOrder[3] === 'details';
    const tagsRevealedInReviewDescTagsDetailsOrder =
      isReviewDescTagsDetailsOrder &&
      !prevShowCluesRef.current[0] &&
      showClues[0]; // tags (slot[0]) just revealed

    if (
      !titleJustRevealed &&
      clueContainerBottomNearViewportBottom() &&
      !isFirstClue &&
      (currentLowestPosition > prevLowestPosition ||
        ssJustRevealedNonFirst ||
        ssVisibleAndNewClueRevealed ||
        tagsJustRevealedWithMFD ||
        detailsAndMFDJustRevealedWhileTagsShown ||
        tagsRevealedInReviewDescTagsDetailsOrder)
    ) {
      // If MFD carousel or extras clue is currently shown, add extra scroll to account for its height
      const moreFromDevIsShown = showClues[7];
      const extrasIsShown = showClues[8];
      let scrollAmount =
        (moreFromDevIsShown || extrasIsShown) && !tagsJustRevealedWithMFD
          ? 380
          : 220;
      if (detailsAndMFDJustRevealedWhileTagsShown) scrollAmount = 320;
      // If the review clue is being revealed while a long description is already shown,
      // add extra scroll to account for the description's additional height.
      const reviewJustRevealed = !prevShowCluesRef.current[4] && showClues[4];
      const descAlreadyShown = prevShowCluesRef.current[2];
      if (
        reviewJustRevealed &&
        descAlreadyShown &&
        shortDescriptionLength > 300
      ) {
        console.log('this ran');
        scrollAmount += 200;
      }

      setTimeout(() => {
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth',
        });
      }, 100);
    }

    prevShowCluesRef.current = showClues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClues, isComplete]);
}
