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
  Very Hard:
    Going Medieval

XCOM 2
Mount and Blade II: Bannerlord
The Witcher 3: Wild Hunt
Elite Dangerous
DARK SOULS II
Frostpunk
The Long Dark
Life is Strange - Episode 1
Far Cry 4
STAR WARS: The Old Republic


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



    '2026-02-05': {
    easy: "No Man's Sky",
    expert: 'Cuphead',
  },
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
// Format: 'YYYY-MM-DD': { caseFile1: 'Game', caseFile2: 'Game', caseFile3: 'Game', caseFile4: 'Game' }
// You can specify 1-4 case files. Unspecified case files will use the normal random selection.
export const STEAM_DETECTIVE_DEMO_DAYS: {
  [date: string]: {
    caseFile1?: string;
    caseFile2?: string;
    caseFile3?: string;
    caseFile4?: string;
  };
} = {
  '2026-02-04': {
    caseFile1: 'Bastion',
    caseFile2: 'The Walking Dead',
    caseFile3: 'Rust',
    caseFile4: 'Magicka',
  },
  '2026-02-05': {
    caseFile1: 'Persona 3 Reload',
    caseFile2: 'Prey',
    caseFile3: 'Rocket League',
    caseFile4: 'BioShock Infinite',
  },
  '2026-02-06': {
    caseFile1: 'Wolfenstein: The New Order',
    caseFile2: 'South Park: The Stick of Truth',
    caseFile3: 'Papers, Please',
    caseFile4: 'Crusader Kings II',
  },
  '2026-02-07': {
    caseFile1: 'Warframe',
    caseFile2: 'Castle Crashers',
    caseFile3: 'The Lord of the Rings Online',
    caseFile4: 'Prototype 2',
  },
  '2026-02-08': {
    caseFile1: 'DARK SOULS II',
    caseFile2: 'Company of Heroes 2',
    caseFile3: 'Mad Max',
    caseFile4: 'PAYDAY The Heist',
  },
  '2026-02-09': {
    caseFile3: 'Call of Duty: Black Ops II',
    caseFile1: 'Timberborn',
    caseFile2: 'Dyson Sphere Program',
    caseFile4: 'FINAL FANTASY XIV Online',
  },
  '2026-02-10': {
    caseFile1: 'War Thunder',
    caseFile2: 'Torchlight II',
    caseFile3: "Tom Clancy's Splinter Cell Blacklist",
    caseFile4: 'Remnant: From the Ashes',
  },
};
