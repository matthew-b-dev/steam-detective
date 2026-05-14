export const DATE_OVERRIDE: string | null = null; // '2026-02-04' to test specific dates

/**
 * Get the number of case files for a given puzzle date.
 * Determined by how many caseFile slots are defined in the demo config.
 * Defaults to 4 for dates without explicit config.
 */
export const getCaseFileCount = (puzzleDate: string): number => {
  const config = STEAM_DETECTIVE_DEMO_DAYS[puzzleDate];
  if (!config) return 4;
  let count = 0;
  if (config.caseFile1) count++;
  if (config.caseFile2) count++;
  if (config.caseFile3) count++;
  if (config.caseFile4) count++;
  return count || 4;
};

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

// Demo days configuration - games for specific dates
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
    caseFile1: 'Inscryption',
    caseFile2: 'Cyberpunk 2077',
    caseFile3: 'Devil May Cry 5',
    caseFile4: "Assassin's Creed Odyssey",
  },
  '2026-03-07': {
    caseFile1: 'Dishonored',
    caseFile2: 'Grim Dawn',
    caseFile3: 'House Flipper',
    caseFile4: 'It Takes Two',
  },
  '2026-03-08': {
    caseFile1: 'SpongeBob SquarePants: Battle for Bikini Bottom - Rehydrated',
    caseFile2: 'The Stanley Parable',
    caseFile3: 'Alien Swarm',
    caseFile4: 'Pillars of Eternity II: Deadfire',
  },
  '2026-03-09': {
    caseFile1: 'Watch_Dogs',
    caseFile2: 'Deus Ex: Mankind Divided',
    caseFile3: 'Firewatch',
    caseFile4: 'Avatar: Frontiers of Pandora',
  },
  '2026-03-10': {
    caseFile1: 'Dead by Daylight',
    caseFile2: 'Prison Architect',
    caseFile3: 'OneShot',
    caseFile4: "Five Nights at Freddy's",
  },
  '2026-03-11': {
    caseFile1: "Mirror's Edge Catalyst",
    caseFile2: 'Pizza Tower',
    caseFile3: 'HELLDIVERS',
    caseFile4: 'Dead Space 2',
  },
  '2026-03-12': {
    caseFile1: 'Aperture Desk Job',
    caseFile2: 'The First Descendant',
    caseFile3: 'ANIMAL WELL',
    caseFile4: 'LEGO Star Wars: The Skywalker Saga',
  },
  '2026-03-13': {
    caseFile1: 'Fallout: New Vegas',
    caseFile2: "Marvel's Guardians of the Galaxy",
    caseFile3: 'Celeste',
    caseFile4: 'Ratchet & Clank: Rift Apart',
  },
  '2026-03-14': {
    caseFile1: 'SUPERHOT',
    caseFile2: 'Metaphor: ReFantazio',
    caseFile3: 'FEZ',
    caseFile4: 'Fallout Shelter',
  },
  '2026-03-15': {
    caseFile1: 'Sekiro: Shadows Die Twice',
    caseFile2: 'Tropico 6',
    caseFile3: 'Jump King',
    caseFile4: 'Bloons TD 6',
  },
  '2026-03-16': {
    caseFile1: 'BioShock',
    caseFile2: 'Unpacking',
    caseFile3: 'Loop Hero',
    caseFile4: 'Control',
  },
  '2026-03-17': {
    caseFile1: 'Bully',
    caseFile2: 'XCOM: Chimera Squad',
    caseFile3: 'SteamWorld Dig',
    caseFile4: 'Deus Ex: Human Revolution',
  },
  '2026-03-18': {
    caseFile1: 'Overwatch',
    caseFile2: 'Thief',
    caseFile3: 'Chivalry: Medieval Warfare',
    caseFile4: 'Just Cause 3',
  },
  '2026-03-19': {
    caseFile1: 'Hades II',
    caseFile2: 'Black Desert',
    caseFile3: 'Crypt of the NecroDancer',
    caseFile4: 'Microsoft Flight Simulator 2024',
  },
  '2026-03-20': {
    caseFile1: 'Battlefield 4',
    caseFile2: 'THE FINALS',
    caseFile3: 'Donut County',
    caseFile4: "Tom Clancy's The Division",
  },
  '2026-03-21': {
    caseFile1: 'Far Cry 5',
    caseFile2: 'Dead Rising 3',
    caseFile3: 'Keep Talking and Nobody Explodes',
    caseFile4: 'L.A. Noire',
  },
  '2026-03-22': {
    caseFile1: 'Borderlands 3',
    caseFile2: 'Super Auto Pets',
    caseFile3: 'DYSMANTLE',
    caseFile4: 'Jurassic World Evolution',
  },
  '2026-03-23': {
    caseFile1: 'Old School RuneScape',
    caseFile2: 'Ghostwire: Tokyo',
    caseFile3: 'Ryse: Son of Rome',
    caseFile4: 'DEATHLOOP',
  },
  '2026-03-24': {
    caseFile1: 'Left 4 Dead 2',
    caseFile2: 'RoboCop: Rogue City',
    caseFile3: 'Katana ZERO',
    caseFile4: 'STAR WARS: Squadrons',
  },
  '2026-03-25': {
    caseFile1: 'Horizon Zero Dawn',
    caseFile2: 'Moonlighter',
    caseFile3: 'Darkest Dungeon II',
    caseFile4: 'Cookie Clicker',
  },
  '2026-03-26': {
    caseFile1: 'Starfield',
    caseFile2: 'Warhammer: Vermintide 2',
    caseFile3: 'FTL: Faster Than Light',
    caseFile4: 'Divinity: Original Sin 2',
  },
  '2026-03-27': {
    caseFile1: "Tom Clancy's Ghost Recon Wildlands",
    caseFile2: 'The Crew 2',
    caseFile3: 'Spelunky',
    caseFile4: 'Dragon Age: The Veilguard',
  },
  '2026-03-28': {
    caseFile1: 'Plants vs. Zombies',
    caseFile2: 'Terminator: Resistance',
    caseFile3: 'The Callisto Protocol',
    caseFile4: 'Monster Hunter: World',
  },
  '2026-03-29': {
    caseFile1: "Assassin's Creed Origins",
    caseFile2: 'Crab Champions',
    caseFile3: 'Moonbase Alpha',
    caseFile4: 'The Witcher',
  },
  '2026-03-30': {
    caseFile1: 'Stardew Valley',
    caseFile2: 'Batman: Arkham Asylum',
    caseFile3: 'Mini Motorways',
    caseFile4: 'Surgeon Simulator',
  },
  '2026-03-31': {
    caseFile1: 'Ghost of Tsushima',
    caseFile2: 'ULTRAKILL',
    caseFile3: 'Bomb Rush Cyberfunk',
    caseFile4: 'Wolfenstein: The Old Blood',
  },
  '2026-04-01': {
    caseFile1: 'The Elder Scrolls V: Skyrim',
    caseFile2: 'The Elder Scrolls V: Skyrim Special Edition',
    caseFile3: 'The Elder Scrolls V: Skyrim VR',
    caseFile4: 'The Elder Scrolls V: Skyrim Soundtrack',
  },
  '2026-04-02': {
    caseFile1: 'The Outer Worlds',
    caseFile2: 'Hi-Fi RUSH',
    caseFile3: 'Tactical Breach Wizards',
    caseFile4: 'Planet Coaster',
  },
  '2026-04-03': {
    caseFile1: 'God of War Ragnarok',
    caseFile2: 'TUNIC',
    caseFile3: 'SpeedRunners',
    caseFile4: 'Tales from the Borderlands',
  },
  '2026-04-04': {
    caseFile1: 'Half-Life 2: Episode Two',
    caseFile2: 'A Hat in Time',
    caseFile3: 'Sunset Overdrive',
    caseFile4: 'The Sims 3',
  },
  '2026-04-05': {
    caseFile1: 'DayZ',
    caseFile2: 'SIGNALIS',
    caseFile3: 'A Short Hike',
    caseFile4: 'Heavy Rain',
  },
  '2026-04-06': {
    caseFile1: 'A Way Out',
    caseFile2: 'Journey',
    caseFile3: 'Into the Breach',
    caseFile4: 'Enter the Gungeon',
  },
  '2026-04-07': {
    caseFile1: 'LEGO Batman: The Videogame',
    caseFile2: 'Spelunky 2',
    caseFile3: 'Pacific Drive',
    caseFile4: 'Goat Simulator 3',
  },
  '2026-04-08': {
    caseFile1: "Teenage Mutant Ninja Turtles: Shredder's Revenge",
    caseFile2: 'Artifact',
    caseFile3: 'Peglin',
    caseFile4: 'BattleBit Remastered',
  },
  '2026-04-09': {
    caseFile1: 'American Truck Simulator',
    caseFile2: 'Anno 1800',
    caseFile3: 'Dome Keeper',
    caseFile4: 'SPORE',
  },
  '2026-04-10': {
    caseFile1: "Dragon's Dogma 2",
    caseFile2: 'Transistor',
    caseFile3: 'Worms W.M.D',
    caseFile4: 'ASTRONEER',
  },
  '2026-04-11': {
    caseFile1: 'Crysis',
    caseFile2: 'Viewfinder',
    caseFile3: 'RV There Yet?',
    caseFile4: "Tiny Tina's Wonderlands",
  },
  '2026-04-12': {
    caseFile1: 'Cuphead',
    caseFile2: 'Frostpunk',
    caseFile3: 'The Forgotten City',
    caseFile4: 'Far Cry 2',
  },
  '2026-04-13': {
    caseFile1: 'LEGO The Lord of the Rings',
    caseFile2: 'CrossCode',
    caseFile3: 'Starship Troopers: Terran Command',
    caseFile4: 'Gang Beasts',
  },
  '2026-04-14': {
    caseFile1: 'Minecraft Dungeons',
    caseFile2: 'Green Hell',
    caseFile3: 'shapez',
    caseFile4: 'Mass Effect: Andromeda',
  },
  '2026-04-15': {
    caseFile1: 'Ori and the Blind Forest',
    caseFile2: 'Escape the Backrooms',
    caseFile3: 'Temtem',
    caseFile4: 'Watch Dogs: Legion',
  },
  '2026-04-16': {
    caseFile1: 'Far Cry Primal',
    caseFile2: 'Return of the Obra Dinn',
    caseFile3: 'OCTOPATH TRAVELER',
    caseFile4: 'Persona 5 Royal',
  },
  '2026-04-17': {
    caseFile1: 'Yakuza: Like a Dragon',
    caseFile2: 'Little Kitty, Big City',
    caseFile3: 'Caves of Qud',
    caseFile4: 'Titan Quest',
  },
  '2026-04-18': {
    caseFile1: 'Chivalry 2',
    caseFile2: 'Brutal Legend',
    caseFile3: 'The Witness',
  },
  '2026-04-19': {
    caseFile1: 'Satisfactory',
    caseFile2: 'Call of Duty: World at War',
    caseFile3: 'Starbound',
  },
  '2026-04-20': {
    caseFile1: 'Suicide Squad: Kill the Justice League',
    caseFile2: 'Brotato',
    caseFile3: 'CloverPit',
  },
  '2026-04-21': {
    caseFile1: 'The Last of Us Part I',
    caseFile2: 'Dune: Awakening',
    caseFile3: 'Core Keeper',
  },
  '2026-04-22': {
    caseFile1: 'Super Meat Boy',
    caseFile2: 'Sifu',
    caseFile3: 'Rain World',
  },
  '2026-04-23': {
    caseFile1: 'UNO',
    caseFile2: 'LEGO Worlds',
    caseFile3: 'Cairn',
  },
  '2026-04-24': {
    caseFile1: 'Marathon',
    caseFile2: 'Company of Heroes 3',
    caseFile3: 'Judgment',
  },
  '2026-04-25': {
    caseFile1: 'Gears 5',
    caseFile2: 'Tabletop Simulator',
    caseFile3: 'Risk of Rain',
  },
  '2026-04-26': {
    caseFile1: 'Saints Row IV',
    caseFile2: 'ShellShock Live',
    caseFile3: 'Foxhole',
  },
  '2026-04-27': {
    caseFile1: "Death's Door",
    caseFile2: 'Gotham Knights',
    caseFile3: 'AudioSurf',
  },
  '2026-04-28': {
    caseFile1: 'Need for Speed Most Wanted',
    caseFile2: 'Mewgenics',
    caseFile3: 'Cassette Beasts',
  },
  '2026-04-29': {
    caseFile1: 'Sniper Elite 3',
    caseFile2: 'Orcs Must Die! 2',
    caseFile3: 'Neon White',
  },
  '2026-04-30': {
    caseFile1: 'Dead Island 2',
    caseFile2: 'Slime Rancher 2',
    caseFile3: 'Supraland',
  },
  '2026-05-01': {
    caseFile1: 'Bayonetta',
    caseFile2: 'Once Upon a KATAMARI',
    caseFile3: 'Dicey Dungeons',
  },
  '2026-05-02': {
    caseFile1: 'Okami HD',
    caseFile2: 'Chained Together',
    caseFile3: 'The Alters',
  },
  '2026-05-03': {
    caseFile1: 'SMITE',
    caseFile2: 'Cruelty Squad',
    caseFile3: 'Sam & Max Hit the Road',
  },
  '2026-05-04': {
    caseFile1: 'STAR WARS: The Old Republic',
    caseFile2: 'RAGE 2',
    caseFile3: 'System Shock',
  },
  '2026-05-05': {
    caseFile1: 'Resident Evil 5',
    caseFile2: 'Octodad: Dadliest Catch',
    caseFile3: 'Scribblenauts Unlimited',
  },
  '2026-05-06': {
    caseFile1: 'MARVEL SNAP',
    caseFile2: 'Roboquest',
    caseFile3: 'BattleBlock Theater',
  },
  '2026-05-07': {
    caseFile1: 'VRChat',
    caseFile2: 'Monster Train',
    caseFile3: 'Sonic Mania',
  },
  '2026-05-08': {
    caseFile1: 'HELLDIVERS 2',
    caseFile2: 'Kerbal Space Program 2',
    caseFile3: 'Poker Night at the Inventory',
  },
  '2026-05-09': {
    caseFile1: 'UNCHARTED: Legacy of Thieves Collection',
    caseFile2: 'Hello Neighbor',
    caseFile3: 'Barotrauma',
  },
  '2026-05-10': {
    caseFile1: "Sid Meier's Pirates!",
    caseFile2: 'World War Z',
    caseFile3: 'Hardspace: Shipbreaker',
  },
  '2026-05-11': {
    caseFile1: 'FINAL FANTASY XVI',
    caseFile2: 'Far Cry 3: Blood Dragon',
    caseFile3: 'Evil West',
  },
  '2026-05-12': {
    caseFile1: 'Spyro Reignited Trilogy',
    caseFile2: 'Frostpunk 2',
    caseFile3: 'Dorfromantik',
  },
  '2026-05-13': {
    caseFile1: 'Just Cause 2',
    caseFile2: 'A Plague Tale: Innocence',
    caseFile3: 'Streets of Rogue',
  },
  '2026-05-14': {
    caseFile1: 'Mass Effect 2',
    caseFile2: 'Superliminal',
    caseFile3: 'Monster Hunter Stories 2: Wings of Ruin',
  },
  '2026-05-15': {
    caseFile1: 'Forza Horizon 4',
    caseFile2: 'TEKKEN 8',
    caseFile3: 'Command & Conquer Red Alert 3',
  },
  // Saturday: One Finger Death Punch
  '2026-05-16': {
    caseFile1: "Don't Starve",
    caseFile2: 'Fields of Mistria',
    caseFile3: 'Dwarf Fortress',
  },
};

// ****************
// USE A SCREENSHOT CLUE
// ****************

// Easy: Split Fiction
// Easy: Star Wars Battlefront II
// Easy: Remnant II
// Easy: State of Decay 2
// Easy: Any AC Game (last 3/29): Revelations, Unity, (1), (2), Brotherhood, Rogue, Syndicate, Valhalla, Mirage

// Med: Hello Neighbor
// Med: Trackmania
// Med: Another Crab's Treasure
// Med: Luck be a Landlord
// Med: WEBFISHING (60k rev)? needs work
// Med: Tropico 4 (Last Tropico 3/15)
// Med: Clustertruck

// Hard: The Roottrees are Dead
// Hard: Shadow Tactics: Blades of the Shogun
// Hard: Albion Online
// Hard (Fully Refined): Tales of Arise
// Hard: What Remains of Edith Finch (50k rev)
// Hard: Darwin Project
