export const DATE_OVERRIDE: string | null = null; // '2026-02-04' to test specific dates

/*


Background:
Right now, the SteamDetective game has two Case Files (#1 and #2) for the players to "solve", which are in some places referred to as "easy" and "expert". "Easy" (Case File #1) plays first, then once complete, the player chooses "continue", and then Case File #2 starts. Note that the terms "easy" and "expert" were never actually exposed to the user, the user only ever sees #1 and #2. 
Right now, when case file #1 and #2 end, we send a "score" of 1 through 7 to the steam_scores table, then we GET scores from steam_scores table. We don't need to do that anymore because we're changing how scoring works.

You'll read more about the interaction in the notes below, but you should know that all "scores" will now be inserted and selected from a different table called `scores`.
As an example, you will send a score like this:
```
export const sendNewSteamScore = async (playerScore: number): Promise<void> => {
  console.log('sending score: ', playerScore);
  const { error } = await supabase.from('scores').insert({
    created_at: getUtcDateString(), // function already exists, outputs e.g. '2026-02-02'
    score: playerScore,
    gametype: 'steam',
  });

  if (error) {
    console.error('Error sending score:', error);
  }
};
```

In instances where you need to GET the scores, you will get them from that same table, an also use gametype 'steam'. Now for the overhaul.

Overhaul Notes:
1. We are pivoting to 4 case files, which are exposed to the player as Case Files #1 through #4.
1a. The new scoring system you can see in calculateScore, where players get up to 100 points for a case file. We are going to keep track of each case file's new score, and will send the total at the end, then show the total
2. No more charts after case files end.
  - In the "complete" section for a particular case file, here's what we'll show (from top to bottom):
    - (existing) the ("Case File #X Solved!" or "The answer was:") text
    - (existing) the game name (url)
    - (new) a large yellow number that counts UP FROM the "current total score" (before the points earned from this case file), counting up from that number to the "new" total score. Let's say for now that "counting up" animation should take 1.5 seconds.
    - (existing) the "Continue to Case File ##" button. (unless it is the final case file (case file #4))
3. The transitions between case files (after pressing Continue) should remain the same.
4. When the 4th case files completes, send the TOTAL score to the `scores` table (not steam_scores) with (column) `gametype` as 'steam'. You can begin the "counting up" animation for the 4th CASE FILE while you are sending the TOTAL score.
  - AFTER the 1.5 second animation of +pts for the case file, animate a NEW container from the top (below the calendar date picker).
  - This will be the true "game end" content. The good news for you is that the markup and style for this component is already implemented, but in another project: C:\projects\meta-game-daily\src\components\GameCompleteModal.tsx
  - YOU WILL NOT display it in a modal, you'll display it in the container that slides in.
  - You've already send the players total score to the `scores` table, now you will GET all the scores from the `scores` table with `gametype: 'steam'` (case file "scores")
  - Do not display anything until the scores are retrieved.
  - When the scores are retrieved, you will play the same kind of animation as the GameCompleteModal that I showed you, the only difference being this game does not have Bonus points. So there's no Bonus Points animation.
  - When the game over animation(s) of counting up the score are over, just like in the GameComplete modal, you will show:
    - Your score: ##
    - Percentile (e.g. That's better than X% of players or 'So far, that's the best score' or whatever. That comes from that other project's `getPercentileMessage` util function. steal it. )
    - REMEMBER, VERY IMPORTANT: For calculating the players daily Rank/Percentile: when you GET the scores when the game ends, you have ALREADY SENT the player's score. There for their score is already included in that list and you should calclate accordingle.

  - We will show the "distribution" of scores just like we do in that GameCompletModal, i.e. in "buckets". The buckets will be different for this game though because the maxiumum score will be 4 case files * 100 points = 400 maximum.
  - Under the chart, we will also show the "Missed" case files - those case files that the player guessed 7 times on (meaning they ran out of guesses and didn't guess it correctly)
  - Copy for sharing: this should copy 
```
https://steamdetective.wtf/ 🕵️
1️⃣  🟥🟥🟥🟥🟥🟥
2️⃣  🟥🟥🟥✅⬜⬜
3️⃣  🟥🟥✅⬜⬜⬜
4️⃣  ✅⬜⬜⬜⬜⬜
🏆 ### points | 🏅 Rank #7 of 19
```
  - Feedback buttons remain the same from the GameCompleteModal.tsx
  - From the GameCompleteModal.tsx, you shouldn't copy over the 'try steamdetective.wtf' button.
  
  



keep in mind that I may need to "tune" the score values later so make it easy for me to change.
5. 












Easy
BioShock Infinite
Bastion
Hitman: Absolution

Great Easy:
Rust

Medium
Castle Crashers
Papers, Please
The Forest
Space Engineers

Great Medium:
Plague Inc: Evolved

Hard
Crusader Kings II
Slime Rancher 2
Magicka

Great Hard:


"blurredUserTags": ["Warhammer"],
"clueOrder": ["desc", "tags", "details"],

READY:

TRULY DONE
  Very Easy
    No Man's Sky
  
  Medium:
    a
  Harder:
    Magicka
  Very Hard:
    Going Medieval

XCOM 2
Mount and Blade II: Bannerlord
The Witcher 3: Wild Hunt
Elite Dangerous
DARK SOULS II
Frostpunk
The Long Dark
Life is Strange - Episode 1
Far Cry 4
STAR WARS: The Old Republic


Up to bat:
  Easy:
    DARK SOULS II
    Warframe

  Great:
  
  Harder: 
    '2026-02-02': {
      easy: 'Papers, Please',
      expert: 'My Time at Portia',
    },

    Dinkum
    Brawlhalla
    SMITE



    '2026-02-05': {
    easy: "No Man's Sky",
    expert: 'Cuphead',
  },
*/

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
    caseFile1: 'Castle Crashers',
    caseFile2: 'The Lord of the Rings Online',
    caseFile3: 'Prototype 2',
    caseFile4: 'ASTRONEER',
  },
};
