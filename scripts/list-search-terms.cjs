const fs = require('fs');
const content = fs.readFileSync(
  __dirname + '/../src/steam_game_detail.ts',
  'utf-8',
);
const results = [];
const gameBlocks = content.matchAll(/'(\d+)':\s*\{([\s\S]+?)^  \},/gm);
for (const match of gameBlocks) {
  const block = match[2];
  const nameMatch =
    block.match(/name:\s*'([^']+)'/) || block.match(/name:\s*"([^"]+)"/);
  const termsMatch = block.match(/searchTerms:\s*(\[[^\]]+\])/);
  if (nameMatch && termsMatch) {
    try {
      const terms = eval(termsMatch[1]);
      results.push({ name: nameMatch[1], searchTerms: terms });
    } catch (e) {}
  }
}
process.stdout.write(JSON.stringify(results, null, 2) + '\n');
process.stderr.write('Total games with searchTerms: ' + results.length + '\n');
