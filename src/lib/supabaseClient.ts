import { createClient } from '@supabase/supabase-js';
import { getUtcDateString } from '../utils';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

export const sendFeedback = async (
  feedbackType:
    | 'perfect'
    | 'too_easy'
    | 'too_hard'
    | 'steam_more'
    | 'steam_less',
): Promise<void> => {
  const { error } = await supabase.from('feedback').insert({
    created_at: getUtcDateString(),
    feedback: feedbackType,
  });

  if (error) {
    console.error('Error sending feedback:', error);
  }
};

// New function for sending scores to the scores table
export const sendNewSteamScore = async (playerScore: number): Promise<void> => {
  console.log('sending score: ', playerScore);
  const { error } = await supabase.from('scores').insert({
    created_at: getUtcDateString(),
    score: playerScore,
    gametype: 'steam',
  });

  if (error) {
    console.error('Error sending score:', error);
  }
};

// New function for fetching scores from the scores table
export const fetchNewSteamScores = async (): Promise<number[]> => {
  const today = getUtcDateString();

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

// Legacy functions - kept for backwards compatibility but no longer used
export const sendSteamDetectiveScore = async (
  guesses: number,
  caseFile: 'easy' | 'expert' = 'easy',
): Promise<void> => {
  console.log('sending steam detective score: ', guesses, caseFile);
  const { error } = await supabase.from('steam_scores').insert({
    created_at: getUtcDateString(),
    guesses: guesses,
    case_file: caseFile,
  });

  if (error) {
    console.error('Error sending steam detective score:', error);
  }
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
