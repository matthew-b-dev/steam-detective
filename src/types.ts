export interface Review {
  review: string;
  votedUp: boolean;
  votesUp: number;
  votedFunny?: number;
  weightedScore?: number | string;
  authorPlaytimeHours: number;
  authorPlaytimeHoursAtRelease?: number;
  timestamp: number;
  reviewUrl?: string;
  authorPlaytimeAtReview?: number;
}

export interface ReviewSummary {
  count: number;
  rating: string;
}

// Note: if updates are made to this interface, they MUST be supported by the Export function of the Refine tool `handleExport` (RefinePage.tsx)
// i.e. Exporting games should properly export new properties in this interface.
export interface SteamGame {
  name: string;
  appId: number;
  primaryScreenshot: string;
  secondaryScreenshot?: string;
  shortDescription: string;
  releaseDate: string;
  earlyAccessDate?: string;
  originalReleaseDate?: string;
  developer: string;
  publisher: string;
  tags: string[];
  userTags: string[];
  blurredUserTags?: string[]; // User tags that should be blurred/redacted
  blurScreenshotQuarter?: 'top' | 'bottom'; // If specified, blurs the top or bottom quarter of screenshots (applies to both)
  screenshotLetterbox?: boolean; // If true, adds vertical black bars (contain) instead of cropping for non-16:9 screenshots
  transformScreenshotScale?: number; // If specified, applies transform: scale(#) to the big screenshot
  screenshotFocusPoint?: [number, number, number?]; // [widthPercent, heightPercent, zoom%] - zooms the primary screenshot. heightPercent: 100=top, 0=bottom. zoom: 1–175, default 75. e.g. [50,50,75]=center at 75%
  zoomLabelPosition?: 'bl' | 'br' | 'tl' | 'tr'; // Position of the zoom indicator when screenshotFocusPoint is active. 'bl'=bottom-left (default), 'br'=bottom-right, 'tl'=top-left, 'tr'=top-right
  blurTitleAndAsAmpersand?: boolean; // If true, replace 'and' with '&' in the title
  overrideCensoredTitle?: string; // Manually define censored title with || markers for custom censoring
  moreFromThisDeveloper?: { id: number; name: string; blurred?: boolean }[]; // Other games from the same developer shown as a clue. blurred=true games show a REDACTED overlay until the case file is complete.
  developerDescription?: string; // Optional "About the Developer" blurb shown alongside the MFD clue. Supports ||censored|| markers.
  clueOrder?: (
    | 'desc'
    | 'details'
    | 'tags'
    | 'ss'
    | 'review'
    | 'details+tags'
  )[]; // Custom order for first 3-4 clues. 'ss' inserts the primary screenshot into the order. 'review' inserts the review clues (replaces secondary screenshot). 'details+tags' bundles the Details and Tags clues into a single reveal step. The "More from this Developer" clue (if present) is always revealed together with the Details clue, keeping its canonical position between Tags and Reviews. Last fixed clues are always: (ss if not in order), (secondary screenshot or review), title. Default: ['tags', 'details', 'desc']
  reviewClue?: Review; // DEPRECATED: A specific review chosen as a clue (replaces secondary screenshot). Use reviewClues instead.
  reviewClues?: Review[]; // Array of reviews chosen as clues (replaces secondary screenshot). All reviews shown together. The review text may contain ||censored|| markers.
  searchTerms?: string[]; // Additional search terms/aliases for the dropdown
  excludeOptions?: string[]; // Game names to exclude from the search dropdown only for this puzzle
  features: string[];
  allReviewSummary: ReviewSummary;
  suggestedBy?: string;
  gameCompleteYoutubeEmbed?: {
    url: string; // YouTube watch URL, e.g. https://www.youtube.com/watch?v=...
    textReveal?: string; // If set, show this text instead of the embed; clicking it reveals the embed
  };
  debugProcessed?: true;
  debugRefined?: true;
  debugDelete?: true;
  difficulty?: string;
  debugNotes?: string;
}

export interface SteamGamePageProps {
  game: SteamGame;
}

export interface DailyGame extends SteamGame {
  puzzleDate: string;
}
