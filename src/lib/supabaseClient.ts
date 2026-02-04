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
