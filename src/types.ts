export interface Review {
  review: string;
  votedUp: boolean;
  votesUp: number;
  weightedScore: number | string;
  authorPlaytimeHours: number;
  timestamp: number;
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
  developer: string;
  publisher: string;
  tags: string[];
  userTags: string[];
  blurredUserTags?: string[]; // User tags that should be blurred/redacted
  blurScreenshotQuarter?: 'top' | 'bottom'; // If specified, blurs the top or bottom quarter of screenshots (applies to both)
  transformScreenshotScale?: number; // If specified, applies transform: scale(#) to the big screenshot
  blurTitleAndAsAmpersand?: boolean; // If true, replace 'and' with '&' in the title
  overrideCensoredTitle?: string; // Manually define censored title with || markers for custom censoring
  clueOrder?: ('desc' | 'details' | 'tags')[]; // Custom order for first 3 clues. Last 3 are always: screenshot1, screenshot2, title. Default: ['tags', 'details', 'desc']
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
