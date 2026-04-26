import { createClient } from '@supabase/supabase-js';
import { getUtcDateString } from '../utils';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

export const sendFeedback = async (
  feedbackType: string,
  customText?: string,
): Promise<void> => {
  const { error } = await supabase.from('feedback').insert({
    created_at: getUtcDateString(),
    feedback_type: feedbackType,
    feedback_text: feedbackType === 'custom' ? customText : null,
  });

  if (error) {
    console.error('Error sending feedback:', error);
  }
};

// function for sending scores to the scores table
export const sendNewSteamScore = async (
  playerScore: number,
  caseGuesses?: number[],
  puzzleDate?: string,
  gamesPlayed?: number,
): Promise<void> => {
  console.log('sending score: ', playerScore, caseGuesses);
  const { error } = await supabase.from('scores').insert({
    created_at: puzzleDate ?? getUtcDateString(),
    score: playerScore,
    gametype: 'steam',
    ...(caseGuesses
      ? {
          case1_guesses: caseGuesses[0] ?? null,
          case2_guesses: caseGuesses[1] ?? null,
          case3_guesses: caseGuesses[2] ?? null,
          case4_guesses: caseGuesses[3] ?? null,
        }
      : {}),
    ...(gamesPlayed != null ? { games_played: gamesPlayed } : {}),
  });

  if (error) {
    console.error('Error sending score:', error);
  }
};

// function for fetching scores from the scores table
export const fetchNewSteamScores = async (
  puzzleDate?: string,
): Promise<number[]> => {
  const today = puzzleDate ?? getUtcDateString();

  const { data, error } = await supabase
    .from('scores')
    .select('score')
    .eq('created_at', today)
    .eq('gametype', 'steam');

  if (error) {
    console.error('Error fetching steam scores:', error);
    throw error;
  }

  return data?.map((row) => row.score) ?? [];
};

export const fetchFeedbackCounts = async (
  date: string,
): Promise<{ perfect: number; too_easy: number; too_hard: number } | null> => {
  const counts = { perfect: 0, too_easy: 0, too_hard: 0 };

  const { data, error } = await supabase
    .from('feedback')
    .select('feedback_type')
    .eq('created_at', date)
    .in('feedback_type', ['perfect', 'too_easy', 'too_hard']);

  if (error) {
    console.error('Error fetching feedback counts:', error);
    return null;
  }

  for (const row of data ?? []) {
    const type = row.feedback_type as keyof typeof counts;
    if (type in counts) counts[type]++;
  }

  return counts;
};

// Daily dashboard queries
export interface DailyScoreRow {
  score: number;
  created_at_ts: string;
  case1_guesses: number | null;
  case2_guesses: number | null;
  case3_guesses: number | null;
  case4_guesses: number | null;
}

export const fetchDailyScoreData = async (
  date: string,
): Promise<DailyScoreRow[]> => {
  const { data, error } = await supabase
    .from('scores')
    .select(
      'score, created_at_ts, case1_guesses, case2_guesses, case3_guesses, case4_guesses',
    )
    .eq('created_at', date)
    .eq('gametype', 'steam')
    .order('created_at_ts', { ascending: true });

  if (error) {
    console.error('Error fetching daily score data:', error);
    throw error;
  }

  return data ?? [];
};

export const fetchPageViewCount = async (date: string): Promise<number> => {
  const start = `${date}T00:00:00Z`;
  // Exclusive upper bound: start of next day
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const end = nextDay.toISOString();

  const { count, error } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .eq('app_name', 'steam')
    .gte('created_at', start)
    .lt('created_at', end);

  if (error) {
    console.error('Error fetching page view count:', error);
    throw error;
  }

  return count ?? 0;
};

export const fetchPerfectFeedbackCount = async (
  date: string,
): Promise<number> => {
  const { count, error } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('created_at', date)
    .eq('feedback_type', 'perfect');

  if (error) {
    console.error('Error fetching perfect feedback count:', error);
    throw error;
  }

  return count ?? 0;
};

export const fetchSteamDetectiveScores = async (
  caseFile: 'easy' | 'expert' = 'easy',
): Promise<number[]> => {
  const today = getUtcDateString();

  const { data, error } = await supabase
    .from('steam_scores')
    .select('guesses')
    .eq('created_at', today)
    .eq('case_file', caseFile);

  if (error) {
    console.error('Error fetching steam detective scores:', error);
    throw error;
  }

  return data?.map((row) => row.guesses) ?? [];
};
