import { useState, useEffect, useMemo } from 'react';
import { fetchAdminScoreData } from '../lib/supabaseClient';
import type { AdminScoreRow } from '../lib/supabaseClient';
import { getRealUtcDateString } from '../utils';

// ─── Stats helpers ─────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function avgNonNull(values: (number | null)[]): number | null {
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  return mean(filtered);
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}
function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex flex-col gap-1'>
      <span className='text-xs text-zinc-400 uppercase tracking-wider'>
        {label}
      </span>
      <span className='text-2xl font-bold text-white'>{value}</span>
      {sub && <span className='text-xs text-zinc-500'>{sub}</span>}
    </div>
  );
}

interface ScoreHistogramProps {
  scores: number[];
}
function ScoreHistogram({ scores }: ScoreHistogramProps) {
  if (scores.length === 0) return null;

  // 8 fixed buckets: 0–49, 50–99, …, 350–400 (400 is the known max possible score).
  const SCORE_MAX = 400;
  const bucketSize = 50;
  const numBuckets = SCORE_MAX / bucketSize; // 8
  const buckets = Array.from({ length: numBuckets }, (_, i) => {
    const lo = i * bucketSize;
    const hi = i === numBuckets - 1 ? SCORE_MAX : lo + bucketSize - 1;
    const count = scores.filter((s) => s >= lo && s <= hi).length;
    return { lo, hi, count };
  });
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4'>
      <h3 className='text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider'>
        Score Distribution
      </h3>
      <div className='flex flex-col gap-1'>
        {buckets.map((b) => (
          <div key={b.lo} className='flex items-center gap-2 text-xs'>
            <span className='text-zinc-400 w-20 shrink-0 text-right'>
              {b.lo}–{b.hi}
            </span>
            <div className='flex-1 bg-zinc-700 rounded-sm overflow-hidden h-5'>
              <div
                className='bg-yellow-500 h-5 rounded-sm transition-all duration-500'
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
            <span className='text-zinc-400 w-8 shrink-0'>{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CaseFileRankingProps {
  rows: AdminScoreRow[];
}
function CaseFileRanking({ rows }: CaseFileRankingProps) {
  const cases = [
    { label: 'Case File 1', key: 'case1_guesses' as const },
    { label: 'Case File 2', key: 'case2_guesses' as const },
    { label: 'Case File 3', key: 'case3_guesses' as const },
    { label: 'Case File 4', key: 'case4_guesses' as const },
  ];

  const ranked = cases
    .map(({ label, key }) => {
      const values = rows.map((r) => r[key]);
      const avg = avgNonNull(values);
      return { label, avg };
    })
    .filter((c) => c.avg !== null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)); // highest avg = hardest

  if (ranked.length === 0)
    return (
      <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-zinc-500 text-sm'>
        No case file data yet.
      </div>
    );

  const maxAvg = Math.max(...ranked.map((c) => c.avg ?? 0), 1);

  return (
    <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4'>
      <h3 className='text-sm font-semibold text-zinc-300 mb-1 uppercase tracking-wider'>
        Case File Difficulty Ranking
      </h3>
      <p className='text-xs text-zinc-500 mb-3'>Ranked by average guesses</p>
      <div className='flex flex-col gap-3'>
        {ranked.map((c) => (
          <div key={c.label} className='flex flex-col gap-1'>
            <div className='flex justify-between text-xs'>
              <span className='text-zinc-300 font-medium'>{c.label}</span>
              <span className='text-zinc-400'>
                avg {(c.avg ?? 0).toFixed(2)} guesses
              </span>
            </div>
            <div className='bg-zinc-700 rounded-sm overflow-hidden h-4'>
              <div
                className='bg-orange-500 h-4 rounded-sm transition-all duration-500'
                style={{ width: `${((c.avg ?? 0) / maxAvg) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PlayerTimelineProps {
  rows: AdminScoreRow[];
}
function PlayerTimeline({ rows }: PlayerTimelineProps) {
  if (rows.length === 0) return null;

  // Group by hour (UTC)
  const byHour: Record<number, number> = {};
  rows.forEach((r) => {
    const h = new Date(r.created_at_ts).getUTCHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  });

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: byHour[i] ?? 0,
  }));
  const maxCount = Math.max(...hours.map((h) => h.count), 1);

  return (
    <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-80'>
      <h3 className='text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider'>
        Submissions by Hour (UTC)
      </h3>
      {/* Bar area - fixed height, no labels inside */}
      <div className='flex items-end gap-[2px] h-20 w-full'>
        {hours.map(({ hour, count }) => (
          <div
            key={hour}
            className='flex-1 h-full flex flex-col justify-end'
            title={`${String(hour).padStart(2, '0')}:00 UTC - ${count} player${count !== 1 ? 's' : ''}`}
          >
            <div
              className='w-full bg-blue-500 rounded-t-sm transition-all duration-500'
              style={{
                height: count > 0 ? `${(count / maxCount) * 100}%` : '2px',
                opacity: count > 0 ? 1 : 0.2,
              }}
            />
          </div>
        ))}
      </div>
      {/* Axis labels - separate row so they never affect bar heights */}
      <div className='flex gap-[2px] w-full mt-1'>
        {hours.map(({ hour }) => (
          <div key={hour} className='flex-1 text-center'>
            {hour % 6 === 0 && (
              <span className='text-[9px] text-zinc-500 leading-none'>
                {String(hour).padStart(2, '0')}h
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ScorePercentileTableProps {
  scores: number[];
}
function ScorePercentileTable({ scores }: ScorePercentileTableProps) {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);

  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
  };

  const rows = [
    { label: 'Min (0th)', value: sorted[0] },
    { label: '10th', value: percentile(10) },
    { label: '25th', value: percentile(25) },
    { label: '50th (Median)', value: percentile(50) },
    { label: '75th', value: percentile(75) },
    { label: '90th', value: percentile(90) },
    { label: 'Max (100th)', value: sorted[sorted.length - 1] },
  ];

  return (
    <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-4'>
      <h3 className='text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider'>
        Score Percentiles
      </h3>
      <table className='w-full text-sm'>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} className='border-b border-zinc-700 last:border-0'>
              <td className='py-1 text-zinc-400'>{label}</td>
              <td className='py-1 text-right font-mono text-white'>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main AdminDashboard ────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const today = getRealUtcDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [rows, setRows] = useState<AdminScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const loadData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminScoreData(date);
      setRows(data);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const scores = useMemo(() => rows.map((r) => r.score), [rows]);
  const completeRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.case1_guesses !== null &&
          r.case2_guesses !== null &&
          r.case3_guesses !== null &&
          r.case4_guesses !== null,
      ),
    [rows],
  );

  const scoreMean = mean(scores);
  const scoreStddev = stddev(scores);
  const scoreMedian = median(scores);
  const allCasesRate =
    rows.length > 0
      ? ((completeRows.length / rows.length) * 100).toFixed(1)
      : '-';

  return (
    <div className='min-h-screen bg-zinc-900 text-white'>
      {/* Header */}
      <div className='border-b border-zinc-700 px-6 py-4 flex items-center gap-4'>
        <div className='flex flex-col leading-none'>
          <h1
            className='text-xl font-black'
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '-0.04em',
            }}
          >
            <span className='text-gray-300'>Steam</span>
            Detective
            <span
              style={{ fontFamily: 'serif', letterSpacing: '-0.03em' }}
              className='text-gray-400'
            >
              <span>.</span>
              <span className='italic text-yellow-500'>wtf</span>
            </span>
          </h1>
          <span className='text-xs text-zinc-500 tracking-wide mt-0.5'>
            Admin Dashboard
          </span>
        </div>
        <span className='ml-auto text-xs text-zinc-500'>
          {lastFetched ? `Last fetched: ${lastFetched}` : ''}
        </span>
      </div>

      <div className='px-6 py-6 max-w-5xl mx-auto flex flex-col gap-6'>
        {/* Date picker + refresh */}
        <div className='flex items-center gap-3 flex-wrap'>
          <label className='text-sm text-zinc-400 font-medium'>Date:</label>
          <input
            type='date'
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className='bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500'
          />
          <button
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            className='px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-sm transition-colors'
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className='px-3 py-1.5 border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-400/10 text-sm transition-colors'
            >
              Jump to today <span className='hidden sm:inline'>({today})</span>
            </button>
          )}
        </div>

        {error && (
          <div className='bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm'>
            Error: {error}
          </div>
        )}

        {loading && (
          <div className='text-zinc-400 text-sm animate-pulse'>
            Loading data for {selectedDate}…
          </div>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className='bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-zinc-500 text-center'>
            No scores found for {selectedDate}.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            {/* Top-line stats */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              <StatCard label='Players' value={rows.length} />
              <StatCard
                label='Mean Score'
                value={scoreMean.toFixed(2)}
                sub={`σ = ${scoreStddev.toFixed(2)}`}
              />
              <StatCard label='Median Score' value={scoreMedian} />
              <StatCard
                label='All 4 Cases Finished'
                value={`${completeRows.length}`}
                sub={`${allCasesRate}% of players`}
              />
            </div>

            {/* Difficulty ranking */}
            <CaseFileRanking rows={rows} />

            {/* Histogram + percentiles */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <ScoreHistogram scores={scores} />
              <ScorePercentileTable scores={scores} />
            </div>

            {/* Submission timeline */}
            <PlayerTimeline rows={rows} />
          </>
        )}
      </div>
    </div>
  );
};
