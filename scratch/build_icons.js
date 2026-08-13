const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const iconMdPath = path.join(projectDir, 'icon.md');
const assetsIconsDir = path.join(projectDir, 'assets', 'icons');
const spritePath = path.join(assetsIconsDir, 'sprite.svg');

if (!fs.existsSync(assetsIconsDir)) {
    fs.mkdirSync(assetsIconsDir, { recursive: true });
}

let iconMdContent = fs.readFileSync(iconMdPath, 'utf8');

// Parse all SVGs from icon.md
const svgMap = new Map();
const regex = /([a-zA-Z0-9_\-:\s]+):\s*\n\s*(<svg[\s\S]*?<\/svg>)/g;
let match;
while ((match = regex.exec(iconMdContent)) !== null) {
    const rawKey = match[1].trim();
    const svgStr = match[2].trim();
    const titleMatch = svgStr.match(/<title[^>]*>([^<]+)<\/title>/);
    const titleKey = titleMatch ? titleMatch[1].trim() : '';

    const cleanKey = rawKey.replace(/^solar:|^ri:|^mage:|^at-icons:/i, '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const cleanTitle = titleKey.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

    if (cleanKey) svgMap.set(cleanKey, svgStr);
    if (cleanTitle) svgMap.set(cleanTitle, svgStr);
}

console.log(`Parsed ${svgMap.size} unique keys from icon.md`);

// Aliases for website IDs -> icon.md keys
const ALIASES = {
    // Dock & Navigation
    'ui-theme-palette': 'paint-roller-bold',
    'ui-palette': 'paint-roller-bold',
    'ui-terminal': 'code-file-bold',
    'ui-gamepad': 'gamepad-old-bold-duotone',
    'ui-notes': 'cloud-file-bold',
    'ui-description': 'cloud-file-bold',
    'ui-share': 'share-linear',
    'ui-copy-link': 'link-circle-linear',
    'ui-link': 'link-circle-linear',
    'ui-linkedin': 'globe-linear',
    'ui-twitter': 'send',
    'ui-sound-on': 'music-library-2-linear',
    'ui-sound-off': 'volume-mute-fill',
    'ui-music-off': 'volume-mute-fill',
    'ui-arrow-down': 'alt-arrow-down-linear',
    'ui-arrow-up': 'alt-arrow-up-line-duotone',
    'ui-arrow-left': 'alt-arrow-left-line-duotone',
    'ui-arrow-right': 'alt-arrow-right-line-duotone',
    'ui-arrow-prev': 'alt-arrow-left-line-duotone',
    'ui-arrow-next': 'alt-arrow-right-line-duotone',
    'ui-close': 'close-circle-linear',
    'ui-close-rounded': 'close-circle-linear',

    // Sections & Titles
    'sections-hero-send': 'send',
    'sections-send': 'send',
    'sections-education': 'square-academic-cap-2-linear',
    'sections-school': 'square-academic-cap-2-linear',
    'sections-account-balance': 'buildings-2-linear',
    'sections-architecture': 'ruler-linear',
    'sections-experience': 'suitcase-linear',
    'sections-work': 'suitcase-linear',
    'sections-research': 'fizzing-flask',
    'sections-science': 'fizzing-flask',
    'sections-publication-book': 'book-2-linear',
    'sections-menu-book': 'book-2-linear',
    'sections-presentation': 'presentation-graph-bold',
    'sections-co-present': 'presentation-graph-bold',
    'sections-open-in-new': 'export-linear',
    'sections-certifications': 'checklist-linear',
    'sections-verified-user': 'verified-check-linear',
    'sections-verified': 'verified-check-linear',
    'sections-cop29-globe': 'earth-linear',
    'sections-public': 'earth-linear',
    'sections-email': 'letter-linear',
    'sections-mail': 'letter-linear',
    'sections-language': 'globe-linear',
    'sections-translate': 'globe-linear',
    'sections-volunteer': 'hand-heart-linear',
    'sections-volunteer-activism': 'hand-heart-linear',
    'sections-schedule': 'clock-circle-linear',
    'states-check-circle': 'check-read-line-duotone',
    'states-check': 'check-read-line-duotone',
    'states-security-check': 'shield-check-outline',
    'states-go-back': 'alt-arrow-left-line-duotone',

    // Flowchart Tools
    'flowchart-filter': 'filters-linear',
    'flowchart-filter-off': 'filters-linear',
    'flowchart-info': 'info-circle-outline',
    'flowchart-contrast': 'sunglasses',
    'flowchart-zoom-in': 'magnifier-zoom-in-linear',
    'flowchart-zoom-out': 'magnifier-zoom-out-linear',
    'flowchart-reset': 'rotate-cw',
    'flowchart-lock': 'shield-keyhole-linear',

    // Skills & Training
    'skills-eco': 'leaf',
    'skills-bar-chart': 'chart-2-bold',
    'skills-code': 'code-file-bold',
    'skills-recycling': 'rotate-cw',
    'skills-sports-soccer': 'football-bold',
    'skills-diversity': 'presentation-graph-bold',
    'skills-oil-barrel': 'heart-drop',
    'skills-qr-code': 'qr-code-linear',
    'skills-touch-app': 'hand-heart-linear',

    // Projects Preview & Media
    'projects-search': 'magnifier-bug-linear',
    'projects-visibility': 'eye-linear',
    'projects-desktop': 'monitor-linear',
    'projects-tablet': 'tablet-linear',
    'projects-smartphone': 'laptop-linear',
    'projects-sound-minus': 'volume-mute-fill',
    'projects-sound-off-2': 'music-library-2-linear',
    'projects-sound-volume-1': 'music-library-2-linear',
    'projects-sound-volume-2': 'music-library-2-bold',

    // Mini Games & Controls
    'games-minesweeper-pickaxe': 'pickaxe',
    'games-minesweeper-smiley-happy': 'smile-circle-linear',
    'games-minesweeper-smiley-win': 'cup-hot-bold',
    'games-minesweeper-smiley-lose': 'close-circle-linear',
    'games-minesweeper-flag-filled': 'flag-linear',
    'games-minesweeper-bomb-bold': 'bomb-bold',
    'games-minesweeper-zazen-fill': 'planet-3-linear',
    'games-minesweeper-endless-sky': 'infinity-linear',
    'games-minesweeper-radar-light': 'radar-linear',
    'games-minesweeper-zoom-in-broken': 'magnifier-zoom-in-linear',
    'games-minesweeper-zoom-out-broken': 'magnifier-zoom-out-linear',
    'games-shared-reset': 'rotate-cw',
    'games-blackjack-gift-linear': 'cup-hot-bold',
    'games-pause': 'pause-linear',
    'games-play': 'play-linear',
    'games-tetris-rotate': 'rotate-cw',
    'games-tetris-drop': 'alt-arrow-down-linear',

    // Playing Cards / Emojis
    'emojis-hearts': 'poker-hearts-fill',
    'emojis-diamonds': 'poker-diamonds-fill',
    'emojis-spades': 'poker-spades-fill',
    'emojis-clubs': 'poker-clubs-fill',
    'emojis-trophy': 'cup-hot-bold',
    'emojis-star': 'star-bold',
    'emojis-rocket': 'rocket-2-bold-duotone',
    'emojis-fire': 'star-linear',

    // Screensavers
    'screensavers-starfield': 'star-linear',
    'screensavers-matrix': 'code-file-bold',
    'screensavers-dvd': 'planet-3-linear',
    'screensavers-synthwave': 'sunglasses',
    'screensavers-quantum': 'atom-linear',
    'konami-icon': 'cup-hot-bold'
};

// Build sprite.svg
const symbols = [];
const seenIds = new Set();

function addSymbol(id, targetKey) {
    if (seenIds.has(id)) return;
    const rawSvg = svgMap.get(targetKey) || svgMap.get(id);
    if (!rawSvg) {
        console.warn(`Missing SVG for: ${id} (target: ${targetKey})`);
        return;
    }
    const vbMatch = rawSvg.match(/viewBox="([^"]+)"/);
    const viewBox = vbMatch ? vbMatch[1] : '0 0 24 24';
    const innerContent = rawSvg.replace(/<svg[^>]*>|<\/svg>/gi, '').replace(/<title[^>]*>.*?<\/title>/gi, '').trim();

    symbols.push(`  <symbol id="${id}" viewBox="${viewBox}">\n    ${innerContent}\n  </symbol>`);
    seenIds.add(id);
}

for (const [alias, targetKey] of Object.entries(ALIASES)) {
    addSymbol(alias, targetKey);
    addSymbol(alias.replace(/-/g, '/'), targetKey);
}

for (const [key, rawSvg] of svgMap.entries()) {
    addSymbol(key, key);
}

const spriteSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n${symbols.join('\n')}\n</svg>\n`;
fs.writeFileSync(spritePath, spriteSvg, 'utf8');
console.log(`Generated sprite.svg with ${symbols.length} symbols at: ${spritePath}`);
