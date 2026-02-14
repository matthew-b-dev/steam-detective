import { useState, useMemo, useCallback } from 'react';
import type { SteamGame } from '../types';
import type { SteamGameMap } from '../steam_game_detail';
import { steamGameDetails, CLOSE_GUESS_SERIES } from '../steam_game_detail';
import { RefineNavbar } from './RefineNavbar.tsx';
import { RefineGameView } from './RefineGameView.tsx';

/**
 * Deep clone a SteamGameMap so mutations don't touch the original import.
 */
const cloneGameMap = (map: SteamGameMap): SteamGameMap => {
  const clone: SteamGameMap = {};
  for (const [id, game] of Object.entries(map)) {
    clone[id] = {
      ...game,
      tags: [...game.tags],
      userTags: [...game.userTags],
      features: [...game.features],
      allReviewSummary: { ...game.allReviewSummary },
      blurredUserTags: game.blurredUserTags
        ? [...game.blurredUserTags]
        : undefined,
      clueOrder: game.clueOrder ? [...game.clueOrder] : undefined,
      searchTerms: game.searchTerms ? [...game.searchTerms] : undefined,
    };
  }
  return clone;
};

export const RefinePage: React.FC = () => {
  const [mode, setMode] = useState<'refine' | 'choose'>('refine');
  const [games, setGames] = useState<SteamGameMap>(() =>
    cloneGameMap(steamGameDetails),
  );
  const [closeGuessSeries, setCloseGuessSeries] = useState<string[]>(() => [
    ...CLOSE_GUESS_SERIES,
  ]);

  // Filter appIds based on mode
  const appIds = useMemo(() => {
    const allIds = Object.keys(games);
    if (mode === 'choose') {
      return allIds.filter((id) => games[id].debugRefined === true);
    }
    return allIds;
  }, [games, mode]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at the first game that is NOT debugRefined (refine mode)
    const idx = Object.values(games).findIndex((g) => !g.debugRefined);
    return idx >= 0 ? idx : 0;
  });

  const currentAppId = appIds[currentIndex];
  const currentGame = games[currentAppId];

  // Navigate
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, appIds.length - 1));
  }, [appIds.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToGameByName = useCallback(
    (name: string) => {
      const idx = Object.values(games).findIndex(
        (g) => g.name.toLowerCase() === name.toLowerCase(),
      );
      if (idx >= 0) setCurrentIndex(idx);
    },
    [games],
  );

  // Update a single game property
  const updateGame = useCallback((appId: string, patch: Partial<SteamGame>) => {
    setGames((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], ...patch },
    }));
  }, []);

  // Export
  const handleExport = useCallback(() => {
    // Build output excluding games marked as debugDelete
    const lines: string[] = [];
    lines.push("import type { SteamGame } from './types';");
    lines.push('');
    lines.push('export type SteamGameMap = {');
    lines.push('  [appId: string]: SteamGame;');
    lines.push('};');
    lines.push('');
    lines.push('export const steamGameDetails: SteamGameMap = {');

    for (const [appId, game] of Object.entries(games)) {
      if (game.debugDelete) continue; // skip deleted games

      lines.push(`  '${appId}': {`);
      lines.push(`    name: ${JSON.stringify(game.name)},`);
      lines.push(`    appId: ${game.appId},`);
      lines.push(`    primaryScreenshot:`);
      lines.push(`      ${JSON.stringify(game.primaryScreenshot)},`);
      if (game.secondaryScreenshot) {
        lines.push(`    secondaryScreenshot:`);
        lines.push(`      ${JSON.stringify(game.secondaryScreenshot)},`);
      }
      lines.push(`    shortDescription:`);
      lines.push(`      ${JSON.stringify(game.shortDescription)},`);
      lines.push(`    releaseDate: ${JSON.stringify(game.releaseDate)},`);
      lines.push(`    developer: ${JSON.stringify(game.developer)},`);
      lines.push(`    publisher: ${JSON.stringify(game.publisher)},`);
      lines.push(`    tags: ${JSON.stringify(game.tags)},`);
      lines.push(`    features: ${JSON.stringify(game.features)},`);
      lines.push(`    allReviewSummary: {`);
      lines.push(`      count: ${game.allReviewSummary.count},`);
      lines.push(
        `      rating: ${JSON.stringify(game.allReviewSummary.rating)},`,
      );
      lines.push(`    },`);
      lines.push(`    userTags: [`);
      for (const tag of game.userTags) {
        lines.push(`      ${JSON.stringify(tag)},`);
      }
      lines.push(`    ],`);

      // Optional properties
      if (game.blurredUserTags && game.blurredUserTags.length > 0) {
        lines.push(`    blurredUserTags: [`);
        for (const tag of game.blurredUserTags) {
          lines.push(`      ${JSON.stringify(tag)},`);
        }
        lines.push(`    ],`);
      }
      if (game.blurScreenshotQuarter) {
        lines.push(
          `    blurScreenshotQuarter: ${JSON.stringify(game.blurScreenshotQuarter)},`,
        );
      }
      if (game.transformScreenshotScale) {
        lines.push(
          `    transformScreenshotScale: ${game.transformScreenshotScale},`,
        );
      }
      if (game.blurTitleAndAsAmpersand) {
        lines.push(`    blurTitleAndAsAmpersand: true,`);
      }
      if (game.overrideCensoredTitle) {
        lines.push(
          `    overrideCensoredTitle: ${JSON.stringify(game.overrideCensoredTitle)},`,
        );
      }
      if (game.clueOrder) {
        lines.push(`    clueOrder: ${JSON.stringify(game.clueOrder)},`);
      }
      if (game.searchTerms && game.searchTerms.length > 0) {
        lines.push(`    searchTerms: ${JSON.stringify(game.searchTerms)},`);
      }
      if (game.debugProcessed) {
        lines.push(`    debugProcessed: true,`);
      }
      if (game.debugRefined) {
        lines.push(`    debugRefined: true,`);
      }
      if (game.difficulty) {
        lines.push(`    difficulty: ${JSON.stringify(game.difficulty)},`);
      }
      if (game.debugNotes) {
        lines.push(`    debugNotes: ${JSON.stringify(game.debugNotes)},`);
      }

      lines.push(`  },`);
    }

    lines.push('};');
    lines.push('');

    // Export CLOSE_GUESS_SERIES
    lines.push(
      '// Special series/franchises where guesses containing the series name are considered "close"',
    );
    lines.push(
      `export const CLOSE_GUESS_SERIES: string[] = ${JSON.stringify(closeGuessSeries, null, 2).replace(/"/g, "'")};`,
    );
    lines.push('');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'steam_game_detail.ts';
    a.click();
    URL.revokeObjectURL(url);
  }, [games, closeGuessSeries]);

  return (
    <div className='min-h-screen bg-[#1b2838] text-white'>
      <RefineNavbar
        gameName={currentGame?.name ?? ''}
        currentIndex={currentIndex}
        totalGames={appIds.length}
        mode={mode}
        onModeToggle={() => {
          setMode((m) => (m === 'refine' ? 'choose' : 'refine'));
          setCurrentIndex(0);
        }}
        onNext={goNext}
        onPrev={goPrev}
        onSearch={goToGameByName}
        onExport={handleExport}
      />
      <div className='max-w-[800px] mx-auto px-4 pt-4 pb-16'>
        {currentGame && (
          <RefineGameView
            key={currentAppId}
            game={currentGame}
            allGames={games}
            mode={mode}
            closeGuessSeries={closeGuessSeries}
            onCloseGuessSeriesChange={setCloseGuessSeries}
            onUpdate={(patch: Partial<SteamGame>) =>
              updateGame(currentAppId, patch)
            }
          />
        )}
      </div>
    </div>
  );
};
