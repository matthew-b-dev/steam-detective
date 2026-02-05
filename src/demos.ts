export const DATE_OVERRIDE: string | null = null; // '2026-02-04' to test specific dates

/*

Easy
BioShock Infinite
Bastion
Hitman: Absolution

Great Easy:
Rust

Medium
Castle Crashers
Papers, Please
The Forest
Space Engineers

Great Medium:
Plague Inc: Evolved

Hard
Crusader Kings II
Slime Rancher 2
Magicka

Great Hard:


"blurredUserTags": ["Warhammer"],
"clueOrder": ["desc", "tags", "details"],

READY:

TRULY DONE
  Very Easy
    No Man's Sky
  
  Medium:
    a
  Harder:
    Magicka

XCOM 2
Mount and Blade II: Bannerlord
The Witcher 3: Wild Hunt
Elite Dangerous
DARK SOULS II
Frostpunk
The Long Dark
Life is Strange - Episode 1
Far Cry 4


Up to bat:
  Easy:
    DARK SOULS II
    Warframe

  Great:
  
  Harder: 
    '2026-02-02': {
      easy: 'Papers, Please',
      expert: 'My Time at Portia',
    },

    Dinkum
    Brawlhalla
    SMITE

*/

/**
 * Extract date from URL route pattern /d/YYYY-MM-DD
 * Returns null if pattern not found or date is invalid
 * Handles both direct paths and GitHub Pages SPA redirected paths (/?/...)
 */
export const getDateFromRoute = (): string | null => {
  // Check direct pathname first
  let path = window.location.pathname;
  let match = path.match(/\/d\/(\d{4}-\d{2}-\d{2})/);

  // If not found in pathname, check for GitHub Pages SPA redirect pattern (/?/...)
  if (!match) {
    const search = window.location.search;
    const redirectMatch = search.match(/\?\/(.+)/);
    if (redirectMatch) {
      path = '/' + redirectMatch[1].replace(/~and~/g, '&');
      match = path.match(/\/d\/(\d{4}-\d{2}-\d{2})/);
    }
  }

  if (match && match[1]) {
    // Validate date format
    const dateStr = match[1];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateStr)) {
      return dateStr;
    }
  }

  return null;
};

// Demo days configuration - hardcode specific games for specific dates
// Format: 'YYYY-MM-DD': 'Game Title' (easy only) or { easy: 'Game Title', expert: 'Game Title' }
export const STEAM_DETECTIVE_DEMO_DAYS: {
  [date: string]: string | { easy: string; expert: string };
} = {
  '2026-02-05': {
    easy: "No Man's Sky",
    expert: 'Cuphead',
  },
  '2026-02-06': {
    easy: 'ASTRONEER',
    expert: 'Age of Empires II',
  },
  '2026-02-07': {
    easy: 'Bastion',
    expert: 'ASTRONEER',
  },
};
