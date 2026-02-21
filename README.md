# SteamDetective.wtf

**Live site:** https://steamdetective.wtf

**Contact:** `hello@steamdetective.wtf`

## What is this thing?

SteamDetective.wtf is a daily web-based trivia game challenging players' knowledge of PC (Steam) games. Each day, players work through four mystery games, themed as "Case Files". Clues for each "Case File" are revealed one at a time, and the fewer guesses it takes to identify the game, the higher the score.

At least for the moment, plenty of people are playing this game! As of 2026-02-20, about 1000 people visit the site every day, and about 200 of them post a score (complete the 4 case files).

---

## Gameplay

Each case file presents clues in a fixed reveal order: user-defined tags (basically a list of genres), a description (with the game title and related terms cleverly redacted), two screenshots of the game, and finally the partially-redacted title of the game. Players can _either_ type a guess into an autocomplete input after each clue _or_ they can simply skip to the next clue if they have no idea. Making an incorrect guess automatically triggers the next clue. Correctly guessing the title immediately displays all clues and un-redacts all the information. A link to the game's real Steam page is included after the title is displayed.

Points are awarded per case file based on how many guesses were used:

| Guesses | Points |
| ------- | ------ |
| 1       | 100    |
| 2       | 85     |
| 3       | 75     |
| 4       | 60     |
| 5       | 45     |
| 6       | 35     |
| DNF     | 0      |

The maximum score per day is 400 (four case files, each solved on the first guess).

After all four case files are completed, the player's total score is submitted anonymously to Supabase and compared against all other scores for that date. A scatter plot renders every submission along the 0–400 axis, with the player's own position highlighted.

The share output copied to clipboard looks like:

```
https://SteamDetective.wtf/ 🕵️
1️⃣  🟥🟥✅⬜⬜⬜
2️⃣  ✅⬜⬜⬜⬜⬜
3️⃣  🟥🟥🟥✅⬜⬜
4️⃣  🟥🟥🟥🟥🟥✅
🏆 295 points  🥈 Rank #4 of 61
```

| Clue #2 (for this game, the "user tags") | Clue #5 (for a different game) |
|-----|---------|
| <img width="395" height="725" alt="firefox_YpAZnmuBym" src="https://github.com/user-attachments/assets/2945ad64-074f-4bf6-a867-7cdabd1dcef1" /> | <img width="395" height="725" alt="1msa8YqiJm" src="https://github.com/user-attachments/assets/5809a32d-6237-4b22-a926-6695fbfa8257" /> |


| Game Complete Screen |
|-----|
| <img width="395" height="725" alt="qgMzmriuhU" src="https://github.com/user-attachments/assets/925b57d8-b5a0-480f-8c5a-3fdca62966a5" /> |

---

## Puzzle Date Picker

Players can navigate to any past puzzle using a date picker near the header. Each date cell in the picker displays one of two states: Complete and Incomplete. This is derived entirely from localStorage with no account or login required. Read more about how Exporting/Importing that state works in the Statistics Panel section.

Navigating to a past date loads that day's puzzle state from localStorage if it exists, or starts fresh. Past-date scores are submitted to the same global leaderboard for that date, allowing late players to still compare results. If playing a past date, the "Share results" button will append that puzzle's date to the URL. So if a player shares a past date, others will land on the same puzzle that they played.

<img width="395" height="725" alt="Q2yEZJCr70" src="https://github.com/user-attachments/assets/aed6853d-1e30-4849-8585-86b288996fad" />

---

## Statistics Panel

A modal statistics panel tracks cumulative performance across all dates since launch. Metrics include:

- Days fully completed
- Case solve rate (individual case files correctly solved vs. attempted)
- Average total score per completed day

The panel also provides a "Copy Stats to Share" button that formats these into a plaintext summary for sharing:

```
https://SteamDetective.wtf
🕵️ My overall stats
🗓️ 13 Days Completed
🎯 48% Case Solve Rate
🏆 143.1 Avg Score per Day
```

**Export / Import** - all game state is stored in localStorage under per-date keys. The export function serializes the relevant keys to a JSON string that can be copied and pasted to transfer progress between browsers or devices. Import validates and restores the data on the receiving end.

<img width="395" height="725" alt="SkG86cN9KH" src="https://github.com/user-attachments/assets/a2a92b92-1627-45e1-a636-1a7280593e58" />


---

## Admin Tools - a look under the hood

### Admin Dashboard

A lightweight analytics page for reviewing how a given day's puzzle performed / is performing. Defaults to the current UTC puzzle date with a date picker to view any historical date.

Metrics shown for the selected date:

- **Player count** - total submissions for that date
- **Mean score** with population standard deviation
- **Median score**
- **All 4 cases finished** - count and percentage of players who submitted case-level guess data (i.e., played all four case files through the newer submission path)
- **Per-case average guesses** - how many guesses players needed on average for each of the four case files
- **Case File Difficulty Ranking** - the four case files ranked by average guess count, useful for identifying which games were too obvious or too obscure
- **Score Distribution** - histogram across fixed 50-point buckets from 0 to 400
- **Score Percentiles** - 0th, 10th, 25th, 50th, 75th, 90th, 100th
- **Submissions by Hour (UTC)** - bar chart showing the submission rate throughout the day

I will confess that I have a borderline unhealthy obsession with this screen.

<img width="702" height="745" alt="image" src="https://github.com/user-attachments/assets/a9b222c2-e92a-4e3a-b9b5-9a24b5996365" />


---

### Game Refinement Tool (`localhost` only)

Before a game enters the puzzle rotation, it goes through a review step in the Refinement tool. This is a localhost-only internal interface that presents each game in the pool one at a time, showing all four clue types exactly as they would appear in a live puzzle. This allows me to inspect the "redacted" description, tags, and screenshots, make edits, and mark the game as "refined" - meaning it is cleared for use in a daily puzzle.

The tool supports a separate "choose" mode that shows only refined games for final selection, as well as a direct navigation (via search) by game name.

Honestly, this thing looks ... rough. But it behaves well! And it does exactly what I need it to every day.

<img width="831" height="865" alt="image" src="https://github.com/user-attachments/assets/7943fbdf-6801-4ddd-9d23-3036947e0cc3" />


---

### Discord bot (privately sent notifications)

Any time a score is posted (a row is inserted into the `scores` table) or feedback is given (`feedback` table), an Edge function defined in Supabase triggers a discord bot to post in a private Discord channel. This made A LOT more sense when only 10-15 people were playing the game every day. Only the feedback notifications are valuable now for the most part.

<img width="476" height="155" alt="image" src="https://github.com/user-attachments/assets/b8320022-35a6-4073-8267-8326e694023c" />


## Developer notes

**Technologies :** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, ApexCharts, Supabase (PostgreSQL)

### Running this app locally

If you're the type of person that wanted to run this app locally, I get the feeling you don't need instructions for that but hey.

```bash
npm install
npm run dev
```

Requires a `.env` file with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm run build
```
