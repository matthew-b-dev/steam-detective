export const DATE_OVERRIDE: string | null = null; // '2026-02-04' to test specific dates

// Demo days configuration - hardcode specific games for specific dates
// Format: 'YYYY-MM-DD': 'Game Title' (easy only) or { easy: 'Game Title', expert: 'Game Title' }
export const STEAM_DETECTIVE_DEMO_DAYS: {
  [date: string]: string | { easy: string; expert: string };
} = {
  '2026-02-02': {
    easy: 'My Time at Portia',
    expert: 'ASTRONEER',
  },
  '2026-02-03': {
    easy: "No Man's Sky",
    expert: 'Magicka',
  },
};
