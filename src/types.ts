export interface Review {
  review: string;
  votedUp: boolean;
  votesUp: number;
  weightedScore?: number | string;
  authorPlaytimeHours: number;
  timestamp: number;
  reviewUrl?: string;
  authorPlaytimeAtReview?: number;
}

export interface ReviewSummary {
  count: number;
  rating: string;
}

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
  transformScreenshotScale?: number; // If specified, applies transform: scale(#) to the big screenshot
  screenshotFocusPoint?: [number, number, number?]; // [widthPercent, heightPercent, zoom%] — zooms the primary screenshot. heightPercent: 100=top, 0=bottom. zoom: 1–175, default 75. e.g. [50,50,75]=center at 75%
  blurTitleAndAsAmpersand?: boolean; // If true, replace 'and' with '&' in the title
  overrideCensoredTitle?: string; // Manually define censored title with || markers for custom censoring
  clueOrder?: ('desc' | 'details' | 'tags' | 'ss' | 'review')[]; // Custom order for first 3-4 clues. 'ss' inserts the primary screenshot into the order. 'review' inserts the review clue (replaces secondary screenshot). Last fixed clues are always: (ss if not in order), (secondary screenshot or review), title. Default: ['tags', 'details', 'desc']
  reviewClue?: Review; // A specific review chosen as a clue (replaces secondary screenshot). The review text may contain ||censored|| markers.
  searchTerms?: string[]; // Additional search terms/aliases for the dropdown
  features: string[];
  allReviewSummary: ReviewSummary;
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
