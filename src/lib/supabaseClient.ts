import { createClient } from '@supabase/supabase-js';
import { getUtcDateString } from '../utils';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

export const sendScore = async (playerScore: number): Promise<void> => {
  console.log('sending score: ', playerScore);
  const { error } = await supabase.from('scores').insert({
    created_at: getUtcDateString(),
    score: playerScore,
  });

  if (error) {
    console.error('Error sending score:', error);
  }
};

export const fetchTodayScores = async (): Promise<number[]> => {
  const today = getUtcDateString();

  const { data, error } = await supabase
    .from('scores')
    .select('score')
    .eq('created_at', today);

  const mockScores = [400, 650, 610, 550];

  // Couldn't retrieve scores so use mocked ones
  if (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }

  const scores = data?.map((row) => row.score) ?? [];

  // If we successfully fetched but have 0 scores, seed the database
  if (scores.length === 0) {
    // Send each mock score to Supabase
    for (const mockScore of mockScores) {
      await sendScore(mockScore);
    }

    return mockScores;
  }

  return scores;
};

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

export const sendShuffleScore = async (
  round1Guesses: number,
  round2Guesses: number,
  round3Guesses: number,
): Promise<void> => {
  console.log(
    'sending shuffle score: ',
    round1Guesses,
    round2Guesses,
    round3Guesses,
  );
  const { error } = await supabase.from('shuffle_scores').insert({
    created_at: getUtcDateString(),
    round_1_guesses: round1Guesses,
    round_2_guesses: round2Guesses,
    round_3_guesses: round3Guesses,
  });

  if (error) {
    console.error('Error sending shuffle score:', error);
  }
};

export const fetchShuffleScores = async (): Promise<
  Array<{
    round_1_guesses: number;
    round_2_guesses: number;
    round_3_guesses: number;
  }>
> => {
  const today = getUtcDateString();

  const { data, error } = await supabase
    .from('shuffle_scores')
    .select('round_1_guesses, round_2_guesses, round_3_guesses')
    .eq('created_at', today);

  if (error) {
    console.error('Error fetching shuffle scores:', error);
    throw error;
  }

  return data ?? [];
};

export const fetchShuffleAverages = async (playerScores?: {
  round1: number;
  round2: number;
  round3: number;
}): Promise<{
  round1Avg: number;
  round2Avg: number;
  round3Avg: number;
}> => {
  const today = getUtcDateString();

  const { data, error } = await supabase
    .from('shuffle_scores')
    .select('round_1_guesses, round_2_guesses, round_3_guesses')
    .eq('created_at', today);

  if (error) {
    console.error('Error fetching shuffle averages:', error);
    throw error;
  }

  // Calculate averages
  if (!data || data.length === 0) {
    return { round1Avg: 0, round2Avg: 0, round3Avg: 0 };
  }

  // If there's more than 1 score and player scores are provided, exclude the player's score
  let dataToAverage = data;
  if (data.length > 1 && playerScores) {
    dataToAverage = data.filter(
      (row) =>
        row.round_1_guesses !== playerScores.round1 ||
        row.round_2_guesses !== playerScores.round2 ||
        row.round_3_guesses !== playerScores.round3,
    );
  }

  // If after filtering we have no data, fall back to all data
  if (dataToAverage.length === 0) {
    dataToAverage = data;
  }

  const round1Avg =
    dataToAverage.reduce((sum, row) => sum + (row.round_1_guesses || 0), 0) /
    dataToAverage.length;
  const round2Avg =
    dataToAverage.reduce((sum, row) => sum + (row.round_2_guesses || 0), 0) /
    dataToAverage.length;
  const round3Avg =
    dataToAverage.reduce((sum, row) => sum + (row.round_3_guesses || 0), 0) /
    dataToAverage.length;

  return {
    round1Avg: Math.round(round1Avg * 10) / 10, // Round to 1 decimal place
    round2Avg: Math.round(round2Avg * 10) / 10,
    round3Avg: Math.round(round3Avg * 10) / 10,
  };
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
