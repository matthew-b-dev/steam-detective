import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_DIR = join(__dirname, '..', 'src');
const IS_PRODUCTION = process.argv.includes('--production');

console.log(
  `🎮 Generating optimized game files (${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'} mode)...\n`,
);

// Step 1: Read and parse demos.ts to extract all game names
console.log('📖 Reading demos.ts...');
const demosContent = readFileSync(join(SRC_DIR, 'demos.ts'), 'utf-8');

// Extract game names from STEAM_DETECTIVE_DEMO_DAYS object
const demoGamesSet = new Set();

// Remove comments first to avoid false matches
const contentWithoutComments = demosContent.replace(/\/\/.*$/gm, '');

// Find all caseFile values with their game names
// Match patterns like: caseFile1: 'Game Name' or caseFile1: "Game Name"
// This regex handles quotes within game names (like "Tom Clancy's...")
const singleQuoteMatches = contentWithoutComments.matchAll(
  /caseFile\d+:\s*'([^']+)'/g,
);
const doubleQuoteMatches = contentWithoutComments.matchAll(
  /caseFile\d+:\s*"([^"]+)"/g,
);

for (const match of singleQuoteMatches) {
  demoGamesSet.add(match[1]);
}
for (const match of doubleQuoteMatches) {
  demoGamesSet.add(match[1]);
}

console.log(`✅ Found ${demoGamesSet.size} unique games in demo days`);

// Step 2: Read steam_game_detail.ts
console.log('📖 Reading steam_game_detail.ts...');
const steamGameDetailContent = readFileSync(
  join(SRC_DIR, 'steam_game_detail.ts'),
  'utf-8',
);

// Extract the steamGameDetails object and CLOSE_GUESS_SERIES
const gameDetailsMatch = steamGameDetailContent.match(
  /export const steamGameDetails: SteamGameMap = ({[\s\S]+?^};)/m,
);
const closeGuessMatch = steamGameDetailContent.match(
  /export const CLOSE_GUESS_SERIES: string\[\] = (\[[^\]]+\]);/s,
);

if (!gameDetailsMatch) {
  console.error(
    '❌ Failed to extract steamGameDetails from steam_game_detail.ts',
  );
  process.exit(1);
}

// Step 3: Parse the game details to extract game names and filter
console.log('🔍 Parsing game details...');
const allGameNames = [];
const gameSearchTermsMap = new Map(); // Map of game name -> search terms
const gamesToInclude = {}; // In dev: all games, in prod: only demo games
let unusedGameNames = [];

// Parse the full object to extract game entries
const gameDetailsObj = gameDetailsMatch[1];
const gameEntryMatches = gameDetailsObj.matchAll(
  /'(\d+)':\s*{[\s\S]+?name:\s*(['"])(.+?)\2[\s\S]+?^  },$/gm,
);

for (const match of gameEntryMatches) {
  const appId = match[1];
  const gameName = match[3];
  allGameNames.push(gameName);

  // Try to extract searchTerms for this game
  const gameObjectMatch = gameDetailsObj.match(
    new RegExp(`'${appId}':\\s*({[\\s\\S]+?^  },)$`, 'm'),
  );
  if (gameObjectMatch) {
    const gameObjText = gameObjectMatch[1];
    const searchTermsMatch = gameObjText.match(/searchTerms:\s*(\[[^\]]+\])/);
    if (searchTermsMatch) {
      try {
        const searchTerms = eval(searchTermsMatch[1]);
        gameSearchTermsMap.set(gameName, searchTerms);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  const isUsedInDemo = demoGamesSet.has(gameName);

  // In production: only include demo games
  // In development: include all games
  if (!IS_PRODUCTION || isUsedInDemo) {
    // Extract the full game object
    if (gameObjectMatch) {
      gamesToInclude[appId] = gameObjectMatch[1];
    }
  } else {
    unusedGameNames.push(gameName);
  }
}

// Validation: Check if all demo games exist in steam_game_detail.ts
const allGameNamesSet = new Set(allGameNames);
const missingDemoGames = [];
for (const demoGame of demoGamesSet) {
  if (!allGameNamesSet.has(demoGame)) {
    missingDemoGames.push(demoGame);
  }
}

console.log(`✅ Found ${allGameNames.length} total games`);
console.log(
  `✅ Found ${gameSearchTermsMap.size} games with custom search terms`,
);

if (missingDemoGames.length > 0) {
  console.log(
    '\n\n\n⚠️ **** WARNING: Games listed in demo days but NOT found in steam_game_detail.ts:',
  );
  missingDemoGames.forEach((game) => console.log(`   ❌ "${game}"`));
  console.log('\n\n\n');
}

if (IS_PRODUCTION) {
  console.log(
    `✅ Keeping ${Object.keys(gamesToInclude).length} games used in demos`,
  );
  console.log(
    `✅ Converting ${unusedGameNames.length} unused games to names-only`,
  );
} else {
  console.log(
    `✅ Including all ${Object.keys(gamesToInclude).length} games (development mode)`,
  );
}

// Step 4: Read dummy_games.ts to include those names too
console.log('📖 Reading dummy_games.ts...');
const dummyGamesContent = readFileSync(
  join(SRC_DIR, 'dummy_games.ts'),
  'utf-8',
);

// Extract game names from the array (more robust than eval)
const dummyGamesArray = [];
const dummyGameMatches = dummyGamesContent.matchAll(
  /^\s*(?:"([^"]+)"|'([^']+)')\s*,?\s*$/gm,
);
for (const match of dummyGameMatches) {
  dummyGamesArray.push(match[1] || match[2]);
}

console.log(`✅ Found ${dummyGamesArray.length} dummy games`);

// Step 5: Generate steam_game_detail.generated.ts
console.log('✍️ Generating steam_game_detail.generated.ts...');

const typeImport = `import type { SteamGame } from './types';

export type SteamGameMap = {
  [appId: string]: SteamGame;
};
`;

let generatedGameDetails =
  typeImport + '\n// AUTO-GENERATED FILE - DO NOT EDIT\n';
generatedGameDetails += '// Generated by scripts/generate-optimized-games.js\n';
if (IS_PRODUCTION) {
  generatedGameDetails += `// PRODUCTION: Contains only games used in demo days (${Object.keys(gamesToInclude).length} games)\n`;
} else {
  generatedGameDetails += `// DEVELOPMENT: Contains all games (${Object.keys(gamesToInclude).length} games)\n`;
}
generatedGameDetails += '// Source: steam_game_detail.ts\n\n';
generatedGameDetails += 'export const steamGameDetails: SteamGameMap = {\n';

for (const [appId, gameObj] of Object.entries(gamesToInclude)) {
  generatedGameDetails += `  '${appId}': ${gameObj}\n`;
}

generatedGameDetails += '};\n\n';

// Add CLOSE_GUESS_SERIES
if (closeGuessMatch) {
  generatedGameDetails += `export const CLOSE_GUESS_SERIES: string[] = ${closeGuessMatch[1]};\n`;
}

writeFileSync(
  join(SRC_DIR, 'steam_game_detail.generated.ts'),
  generatedGameDetails,
  'utf-8',
);
console.log('✅ Generated steam_game_detail.generated.ts');

// Step 6: Generate all_game_names.generated.ts
console.log('✍️ Generating all_game_names.generated.ts...');

// Combine all game names: used games + unused games + dummy games
const allNamesForAutocomplete = new Set([...allGameNames, ...dummyGamesArray]);

let generatedAllNames = '// AUTO-GENERATED FILE - DO NOT EDIT\n';
generatedAllNames += '// Generated by scripts/generate-optimized-games.js\n';
generatedAllNames += `// Contains all game names for autocomplete (${allNamesForAutocomplete.size} games)\n`;
generatedAllNames += '// Source: steam_game_detail.ts + dummy_games.ts\n\n';
generatedAllNames += 'export const allGameNames: string[] = [\n';

// Sort alphabetically for easier debugging
const sortedNames = Array.from(allNamesForAutocomplete).sort((a, b) =>
  a.localeCompare(b),
);
for (const name of sortedNames) {
  // Escape single quotes in game names
  const escapedName = name.replace(/'/g, "\\'");
  generatedAllNames += `  '${escapedName}',\n`;
}

generatedAllNames += '];\n\n';

// Also export search terms map
generatedAllNames +=
  '// Map of game names to their search terms (for better autocomplete matching)\n';
generatedAllNames +=
  'export const gameSearchTerms: Record<string, string[]> = {\n';
for (const [gameName, searchTerms] of gameSearchTermsMap.entries()) {
  const escapedName = gameName.replace(/'/g, "\\'");
  const escapedTerms = searchTerms
    .map((term) => `'${term.replace(/'/g, "\\'")}'`)
    .join(', ');
  generatedAllNames += `  '${escapedName}': [${escapedTerms}],\n`;
}
generatedAllNames += '};\n';

writeFileSync(
  join(SRC_DIR, 'all_game_names.generated.ts'),
  generatedAllNames,
  'utf-8',
);
console.log('✅ Generated all_game_names.generated.ts');

console.log('\n🎉 Done! Generated files:');
console.log(
  `   - src/steam_game_detail.generated.ts (${Object.keys(gamesToInclude).length} games with full details)`,
);
console.log(
  `   - src/all_game_names.generated.ts (${allNamesForAutocomplete.size} game names for autocomplete)`,
);
if (IS_PRODUCTION) {
  console.log('\n📦 Production mode: Only demo games included in bundle');
} else {
  console.log('\n🔧 Development mode: All games included for testing');
}
console.log(
  '💡 Tip: These files are auto-generated and should not be edited manually.\n',
);
