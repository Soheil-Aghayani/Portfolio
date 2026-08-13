const fs = require('fs');
const path = require('path');

const spritePath = path.join(__dirname, '..', 'assets', 'icons', 'sprite.svg');
const sprite = fs.readFileSync(spritePath, 'utf8');
const symbolCount = (sprite.match(/<symbol /g) || []).length;
console.log('sprite.svg size:', (sprite.length / 1024).toFixed(2), 'KB');
console.log('Total embedded symbols:', symbolCount);

const keyChecks = [
  'ui-theme-palette', 'ui-terminal', 'ui-gamepad', 'ui-notes', 'ui-share', 'ui-sound-on', 'ui-sound-off',
  'sections-hero-send', 'sections-education', 'sections-account-balance', 'sections-research', 'sections-publication-book',
  'flowchart-filter', 'flowchart-zoom-in', 'flowchart-reset',
  'skills-eco', 'skills-bar-chart', 'skills-code', 'skills-recycling',
  'projects-desktop', 'projects-tablet', 'projects-smartphone',
  'games-minesweeper-pickaxe', 'games-minesweeper-smiley-happy', 'games-minesweeper-bomb-bold',
  'emojis-hearts', 'emojis-diamonds', 'emojis-spades', 'emojis-clubs'
];

let allGood = true;
for (const k of keyChecks) {
  if (!sprite.includes(`id="${k}"`)) {
    console.log('Missing symbol ID:', k);
    allGood = false;
  }
}
if (allGood) console.log('✅ All 100% required website symbols are verified present in sprite.svg!');
