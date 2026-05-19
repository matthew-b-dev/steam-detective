/**
 * generate-challenges-data.js
 *
 * Fetches all historical Steam Detective scores from Supabase and generates
 * a static JSON file with puzzles ranked by difficulty and play count.
 *
 * Output: src/challenges_data.generated.json
 *
 * Usage:
 *   node scripts/generate-challenges-data.js
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (auto-loaded).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️  VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — skipping challenges data generation.',
  );
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Derive getCaseFileCount from demos.ts (mirrors demos.ts getCaseFileCount)
// ---------------------------------------------------------------------------
function buildCaseFileCountMap() {
  const demosPath = join(__dirname, '..', 'src', 'demos.ts');
  const content = readFileSync(demosPath, 'utf-8');

  // Strip line comments to avoid false matches
  const stripped = content.replace(/\/\/.*$/gm, '');

  const countMap = {};

  // Find every date key block in STEAM_DETECTIVE_DEMO_DAYS
  // Match entries like: '2026-02-04': { ... }
  const dateBlockRegex = /'(\d{4}-\d{2}-\d{2})':\s*\{([^}]*)\}/g;

  let match;
  while ((match = dateBlockRegex.exec(stripped)) !== null) {
    const date = match[1];
    const block = match[2];
    // Count how many caseFileN properties exist in this block
    const caseFileMatches = block.match(/caseFile\d+\s*:/g);
    const count = caseFileMatches ? caseFileMatches.length : 0;
    if (count > 0) {
      countMap[date] = count;
    }
  }

  return countMap;
}

function getCaseFileCount(date, countMap) {
  return countMap[date] ?? 4;
}

// ---------------------------------------------------------------------------
// Fetch all scores in batches (Supabase default limit is 1000)
// ---------------------------------------------------------------------------
async function fetchAllScores(cutoffDate) {
  const allRows = [];
  const BATCH_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('scores')
      .select('created_at, score')
      .eq('gametype', 'steam')
      .gte('created_at', '2026-02-04')
      .lt('created_at', cutoffDate)
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching scores:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    allRows.push(...data);

    if (data.length < BATCH_SIZE) break; // Last page
    from += BATCH_SIZE;
  }

  return allRows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🎯 Generating challenges data...\n');

  // Cutoff: exclude last 2 days to avoid low-sample-count skew
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 2);
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  console.log(`  Cutoff date (exclusive): ${cutoffDate}`);

  // Parse demos.ts to build case-file-count lookup
  console.log('  Parsing demos.ts for case file counts...');
  const caseFileCountMap = buildCaseFileCountMap();

  // Fetch all historical scores
  console.log('  Fetching scores from Supabase...');
  const rows = await fetchAllScores(cutoffDate);
  console.log(`  Fetched ${rows.length} score rows.`);

  if (rows.length === 0) {
    console.warn('  No score data found — writing empty output.');
    writeOutput({ most_difficult: [], least_difficult: [], most_played: [] });
    return;
  }

  // Aggregate by date
  const byDate = {};
  for (const row of rows) {
    const date = row.created_at;
    if (!byDate[date]) {
      byDate[date] = { total: 0, count: 0 };
    }
    byDate[date].total += row.score;
    byDate[date].count += 1;
  }

  // Build stats array
  const stats = Object.entries(byDate).map(([date, { total, count }]) => {
    const avgScore = total / count;
    const availablePoints = getCaseFileCount(date, caseFileCountMap) * 100;
    const difficultyRatio = avgScore / availablePoints;
    return { date, avgScore, count, availablePoints, difficultyRatio };
  });

  console.log(`  Aggregated ${stats.length} puzzle dates.`);

  // Sort and extract date strings for each ranking
  const most_difficult = [...stats]
    .sort((a, b) => a.difficultyRatio - b.difficultyRatio)
    .map((s) => s.date);

  const least_difficult = [...stats]
    .sort((a, b) => b.difficultyRatio - a.difficultyRatio)
    .map((s) => s.date);

  const most_played = [...stats]
    .sort((a, b) => b.count - a.count)
    .map((s) => s.date);

  const play_counts = Object.fromEntries(stats.map((s) => [s.date, s.count]));

  writeOutput({ most_difficult, least_difficult, most_played, play_counts });
}

function writeOutput({
  most_difficult,
  least_difficult,
  most_played,
  play_counts,
}) {
  const outPath = join(
    __dirname,
    '..',
    'src',
    'challenges_data.generated.json',
  );
  const output = {
    generated_at: new Date().toISOString(),
    most_difficult,
    least_difficult,
    most_played,
    play_counts,
  };
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`\n✅ Written to src/challenges_data.generated.json`);
  console.log(`   Dates ranked: ${most_difficult.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
