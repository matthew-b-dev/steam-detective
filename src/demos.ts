export const DATE_OVERRIDE: string | null = null; // '2026-02-04' to test specific dates

/*


BioShock Infinite
Hitman: Absolution
Rust
The Forest
Space Engineers
XCOM 2
The Witcher 3: Wild Hunt
Elite Dangerous
DARK SOULS II
Frostpunk
The Long Dark
Life is Strange - Episode 1
STAR WARS: The Old Republic


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
    caseFile3: 'DELTARUNE',
    caseFile4: 'Remnant: From the Ashes',
  },
  '2026-02-11': {
    caseFile1: 'Balatro',
    caseFile2: 'Plague Inc: Evolved',
    caseFile3: 'Sea of Stars',
    caseFile4: 'The Talos Principle',
  },
  '2026-02-12': {
    caseFile1: 'Watch_Dogs 2',
    caseFile2: 'Crusader Kings II',
    caseFile3: 'Max Payne 3',
    caseFile4: 'Untitled Goose Game',
  },
  '2026-02-13': {
    caseFile1: 'DOOM: The Dark Ages',
    caseFile2: 'Two Point Hospital',
    caseFile3: 'Resident Evil 7 Biohazard',
    caseFile4: 'DREDGE',
  },
  '2026-02-14': {
    caseFile1: 'Teardown',
    caseFile2: 'Gunfire Reborn',
    caseFile3: 'LIMBO',
    caseFile4: 'Stray',
  },
  '2026-02-15': {
    caseFile1: 'RAGE',
    caseFile2: 'DC Universe Online',
    caseFile3: 'Mafia II',
    caseFile4: 'Terraria',
  },
  '2026-02-16': {
    caseFile1: 'R.E.P.O.',
    caseFile2: 'Subnautica: Below Zero',
    caseFile3: 'Slime Rancher',
    caseFile4: 'XCOM 2',
  },
  '2026-02-17': {
    caseFile1: 'DAVE THE DIVER',
    caseFile2: 'Days Gone',
    caseFile3: 'Papers, Please',
    caseFile4: 'Noita',
  },
  '2026-02-18': {
    caseFile1: 'Grounded',
    caseFile2: 'Far Cry 3',
    caseFile3: 'Deep Rock Galactic',
    caseFile4: 'Dead Cells',
  },
  '2026-02-19': {
    caseFile1: "Baldur's Gate 3",
    caseFile2: 'Geometry Dash',
    caseFile3: 'Dwarf Fortress',
    caseFile4: 'Valheim',
  },
  '2026-02-20': {
    caseFile1: 'Euro Truck Simulator 2',
    caseFile2: 'Palworld',
    caseFile4: 'Ori and the Will of the Wisps',
    caseFile3: 'Getting Over It with Bennett Foddy',
  },
  '2026-02-21': {
    caseFile1: "Sid Meier's Civilization VI",
    caseFile2: 'Risk of Rain 2',
    caseFile3: 'RimWorld',
    caseFile4: 'PAYDAY 2',
  },
  '2026-02-22': {
    caseFile1: 'Raft',
    caseFile2: 'Half-Life: Alyx',
    caseFile3: 'Disco Elysium',
    caseFile4: 'Among Us',
  },
  '2026-02-23': {
    caseFile1: 'Factorio',
    caseFile2: 'The Sims 4',
    caseFile3: 'Lies of P',
    caseFile4: 'Undertale',
  },
  '2026-02-24': {
    caseFile1: 'Borderlands 2',
    caseFile2: 'Darkest Dungeon',
    caseFile3: 'Kerbal Space Program',
    caseFile4: 'Middle-earth: Shadow of Mordor',
  },
  '2026-02-25': {
    caseFile1: 'Outer Wilds',
    caseFile2: 'Cities: Skylines',
    caseFile3: 'Warhammer 40,000: Space Marine',
    caseFile4: 'Hades',
  },
  '2026-02-26': {
    caseFile1: 'Elite Dangerous',
    caseFile2: 'Kingdom Come: Deliverance',
    caseFile3: 'Sniper Elite 4',
    caseFile4: 'Saints Row: The Third',
  },
  '2026-02-27': {
    caseFile1: 'Beat Saber',
    caseFile2: 'SILENT HILL 2',
    caseFile3: "Tom Clancy's Rainbow Six Siege",
    caseFile4: 'Slay the Spire',
  },
  '2026-02-28': {
    caseFile1: 'Dota 2',
    caseFile2: 'Age of Empires II',
    caseFile3: 'Shadow of the Tomb Raider',
    caseFile4: 'DEATH STRANDING',
  },
  '2026-03-01': {
    caseFile1: 'Forza Horizon 5',
    caseFile2: 'Resident Evil 2',
    caseFile3: 'Overcooked! 2',
    caseFile4: 'Mount & Blade II: Bannerlord',
  },
  '2026-03-02': {
    caseFile1: "Marvel's Spider-Man: Miles Morales",
    caseFile2: 'Project Zomboid',
    caseFile3: 'Little Nightmares II',
    caseFile4: 'The Binding of Isaac: Rebirth',
  },
  '2026-03-03': {
    caseFile1: 'Vampire Survivors',
    caseFile2: 'Wartales',
    caseFile3: 'Dead Space',
    caseFile4: 'Stellaris',
  },
  '2026-03-04': {
    caseFile1: 'Clair Obscur: Expedition 33',
    caseFile2: 'Oxygen Not Included',
    caseFile3: 'V Rising',
    caseFile4: 'Schedule I',
  },
  '2026-03-05': {
    caseFile1: 'The Witcher 3: Wild Hunt',
    caseFile2: 'NieR:Automata',
    caseFile3: 'Totally Accurate Battle Simulator',
    caseFile4: 'Sea of Thieves',
  },
  '2026-03-06': {
    caseFile1: 'Devil May Cry 5',
    caseFile2: 'Inscryption',
    caseFile3: 'Cyberpunk 2077',
    caseFile4: "Assassin's Creed Odyssey",
  },
  '2026-03-07': {
    caseFile1: 'Dishonored',
    caseFile2: 'Grim Dawn',
    caseFile3: 'House Flipper',
    caseFile4: 'It Takes Two',
  },
};
// April 1st: Skyrim: thumbs down review "the game doesnt work the horse flies"
// Prison Architect
// TEKKEN 7 ?
// Need for Speed Most Wanted
// HARD: Don't Starve
