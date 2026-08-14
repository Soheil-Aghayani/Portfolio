const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(repo, 'icon.md');
const iconsRoot = path.join(repo, 'assets', 'icons');
const spritePath = path.join(iconsRoot, 'sprite.svg');
const manifestPath = path.join(iconsRoot, 'manifest.json');

// Keep the runtime sprite small: only icons reachable from the site are emitted.
// Every source still comes from icon.md, so the build has no network dependency.
const iconSources = [
    ['brand/favicon', 'leaf'],
    ['brand/linkedin-circle', 'logos-linkedin'],
    ['brand/telegram', 'selfhst-telegram'],

    ['ui/send', 'send'],
    ['ui/link', 'link-circle-linear'],
    ['ui/share', 'share-linear'],
    ['ui/palette-broken', 'palette-2-linear'],
    ['ui/music-off-round', 'volume-mute-fill'],
    ['ui/terminal', 'command-linear'],
    ['ui/gamepad', 'gamepad-old-outline'],
    ['ui/notes-outline', 'notes'],
    ['ui/note-add', 'clipboard-add-linear'],
    ['ui/note-edit', 'pen-2-linear'],
    ['ui/note-remove', 'clipboard-remove-linear'],
    ['ui/close-rounded', 'close-circle-linear'],
    ['ui/arrow-prev', 'alt-arrow-left-line-duotone'],
    ['ui/arrow-next', 'alt-arrow-right-line-duotone'],
    ['ui/arrow-down', 'alt-arrow-down-linear'],
    ['ui/arrow-up', 'alt-arrow-up-line-duotone'],
    ['ui/expand-more', 'alt-arrow-down-linear'],
    ['ui/expand-less', 'alt-arrow-up-line-duotone'],
    ['ui/filter', 'filter'],
    ['ui/contrast-round', 'sunglasses'],
    ['ui/globe', 'globe-linear'],
    ['ui/mail', 'letter-linear'],
    ['ui/journal', 'book-2-linear'],
    ['ui/language', 'languages'],
    ['ui/lang-en-us', 'lang-en-us'],
    ['ui/de', 'lang-de'],
    ['ui/leaf', 'leaf'],
    ['ui/leaf-variant', 'pixelarticons-leaf'],
    ['ui/ecology-science-erlenmeyer-flask-experiment-lab-flask-science-chemistry-solution', 'fizzing-flask'],
    ['ui/recycle', 'recycle'],
    ['ui/qr-code', 'qr-code-linear'],
    ['ui/bar-chart-rounded', 'chart-2-bold'],
    ['ui/python', 'devicon-plain-python'],
    ['ui/chemistry-light', 'fizzing-flask'],
    ['ui/oil-barrel-outline-rounded', 'heart-drop'],
    ['ui/school', 'square-academic-cap-2-linear'],
    ['ui/schedule', 'clock-circle-linear'],
    ['ui/search', 'magnifier-linear'],
    ['ui/eye', 'eye-linear'],
    ['ui/smartphone', 'gameboy-outline'],
    ['ui/tablet', 'tablet-linear'],
    ['ui/sound-volume-2', 'music-library-2-bold'],
    ['ui/sound-volume-1', 'music-library-2-linear'],
    ['ui/sound-off-2', 'muted-linear'],
    ['ui/sound-minus', 'volume-cross-line-duotone'],
    ['ui/time', 'alarm-linear'],
    ['ui/info-svgrepo-com', 'info-circle-outline'],
    ['ui/question-circle', 'question-circle-outline'],
    ['ui/check', 'check-read-line-duotone'],
    ['ui/outline-pan-tool', 'hand'],

    ['states/x', 'x-logo'],
    ['states/check-circle', 'check-circle-linear'],
    ['states/compass', 'point-on-map-linear'],
    ['states/conference', 'presentation-graph-linear'],
    ['states/external-link-rounded', 'external-link'],
    ['states/flowchart-outline-sharp', 'presentation-graph-linear'],
    ['states/go-back', 'alt-arrow-left-line-duotone'],
    ['states/hacker', 'programming-linear'],
    ['states/heart-bold', 'heart-bold'],
    ['states/security-check', 'shield-check-outline'],
    ['states/verified', 'verified-check-linear'],
    ['states/verified-user', 'shield-user-linear'],
    ['states/volunteer-activism-outline', 'hand-heart-linear'],
    ['states/vpn', 'shield-network-linear'],
    ['states/warning', 'siren-rounded-linear'],

    ['games/blackjack/gift-linear', 'gift-linear'],
    ['games/blackjack/reward-12-regular', 'medal-ribbon-bold'],
    ['games/blackjack/suitcase', 'suitcase-linear'],
    ['games/blackjack/hearts', 'poker-hearts-fill'],
    ['games/blackjack/diamonds', 'poker-diamonds-fill'],
    ['games/blackjack/spades', 'poker-spades-fill'],
    ['games/blackjack/clubs', 'poker-clubs-fill'],

    ['games/minesweeper/bomb-bold', 'bomb-bold'],
    ['games/minesweeper/click-tap', 'pointer'],
    ['games/minesweeper/endless-sky', 'infinity-linear'],
    ['games/minesweeper/flag-filled', 'flag-linear'],
    ['games/minesweeper/pickaxe', 'pickaxe'],
    ['games/minesweeper/pixel-invader', 'pixelarticons-alien'],
    ['games/minesweeper/pixel-star', 'star-bold'],
    ['games/minesweeper/radar-light', 'radar-linear'],
    ['games/minesweeper/smiley-happy', 'smile-circle-linear'],
    ['games/minesweeper/smiley-lose', 'frown'],
    ['games/minesweeper/smiley-win', 'cup-hot-bold'],
    ['games/minesweeper/sport-soccer-16-filled', 'football-bold'],
    ['games/minesweeper/zazen-fill', 'planet-3-linear'],
    ['games/minesweeper/zoom-in-broken', 'magnifier-zoom-in-linear'],
    ['games/minesweeper/zoom-out-broken', 'magnifier-zoom-out-linear'],

    ['games/shared/arrow-down', 'alt-arrow-down-linear'],
    ['games/shared/arrow-up', 'alt-arrow-up-line-duotone'],
    ['games/shared/pause', 'pause-linear'],
    ['games/shared/play', 'play-linear'],
    ['games/shared/reset', 'rotate-cw'],
    ['games/shared/rotate', 'rotate-cw'],

    ['screensavers/starfield', 'arcticons-starfield'],
    ['screensavers/matrix', 'code-file-bold'],
    ['screensavers/dvd', 'planet-3-linear'],
    ['screensavers/sunrise', 'sunglasses'],
    ['screensavers/ai-line', 'atom-linear']
];

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/\.svg$/i, '')
        .replace(/[^a-z0-9_:/-]/gi, '-')
        .replace(/[/:]+/g, '-')
        .toLowerCase();
}

function basenameKey(value) {
    const normalized = normalizeKey(value);
    const providers = new Set([
        'solar', 'ri', 'mage', 'at-icons', 'fontisto', 'selfhst', 'logos',
        'simple-icons', 'devicon-plain', 'circle-flags', 'country-flag-icons',
        'pixelarticons', 'game-icons', 'arcticons', 'thesvg-color', 'cib',
        'hugeicons', 'security', 'map', 'time', 'list', 'notes', 'school',
        'gaming-svg', 'country-flag-icons', 'video'
    ]);
    const provider = [...providers].sort((a, b) => b.length - a.length)
        .find(candidate => normalized.startsWith(`${candidate}-`));
    if (provider) return normalized.slice(provider.length + 1);
    return normalized;
}

function parseIconMd() {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const map = new Map();
    const lines = source.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
        const match = lines[i].match(/^\s*([A-Za-z0-9][A-Za-z0-9_:\- ]*)\s*:\s*$/);
        if (!match) continue;
        let svg = '';
        for (let j = i + 1; j < lines.length; j += 1) {
            const svgStart = lines[j].indexOf('<svg');
            if (svgStart >= 0) {
                svg = lines.slice(j).join('\n').slice(svgStart);
                const end = svg.indexOf('</svg>');
                if (end >= 0) svg = svg.slice(0, end + 6);
                break;
            }
            if (/^\s*[A-Za-z0-9][A-Za-z0-9_:\- ]*\s*:\s*$/.test(lines[j])) break;
        }
        if (!svg) continue;

        const title = (svg.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
        const candidates = [match[1], basenameKey(match[1]), title, basenameKey(title)];
        candidates.filter(Boolean).forEach(key => map.set(normalizeKey(key), svg.trim()));
    }
    return map;
}

function attribute(markup, name) {
    const match = markup.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return match ? match[1] : '';
}

function toIconDocument(svg) {
    const root = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!root) throw new Error('Invalid SVG source');
    const rootMarkup = root[0].slice(0, root[0].indexOf('>') + 1);
    const viewBox = attribute(rootMarkup, 'viewBox') || '0 0 24 24';
    const inherited = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule']
        .map(name => [name, attribute(rootMarkup, name)])
        .filter(([, value]) => value)
        .map(([name, value]) => `${name}="${value}"`)
        .join(' ');
    const inner = root[2]
        .replace(/<\?xml[\s\S]*?\?>/gi, '')
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
        .trim();
    const content = inherited ? `<g ${inherited}>${inner}</g>` : inner;
    return {
        viewBox,
        content,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`
    };
}

function normalizeMonochrome(svg) {
    return svg
        .replace(/((?:fill|stroke)\s*=\s*["'])\s*(?:black|#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))\s*(["'])/gi, '$1currentColor$2')
        .replace(/(fill\s*:\s*)(?:black|#000(?:000)?)(\s*[;}])/gi, '$1currentColor$2')
        .replace(/(stroke\s*:\s*)(?:black|#000(?:000)?)(\s*[;}])/gi, '$1currentColor$2');
}

function main() {
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing icon source: ${sourcePath}`);
    fs.mkdirSync(iconsRoot, { recursive: true });

    const sourceMap = parseIconMd();
    const symbols = [];
    const manifestRecords = [];
    const seen = new Set();

    for (const [relativePath, sourceKey] of iconSources) {
        const source = sourceMap.get(normalizeKey(sourceKey)) || sourceMap.get(basenameKey(sourceKey));
        if (!source) throw new Error(`Missing icon.md source for ${relativePath}: ${sourceKey}`);
        const icon = toIconDocument(normalizeMonochrome(source));
        const spriteId = relativePath.replace(/\.svg$/i, '').replace(/\//g, '-');
        if (seen.has(spriteId)) throw new Error(`Duplicate sprite id: ${spriteId}`);
        seen.add(spriteId);

        const outputPath = path.join(iconsRoot, `${relativePath}.svg`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, `${icon.svg}\n`, 'utf8');
        symbols.push(`  <symbol id="${spriteId}" viewBox="${icon.viewBox}">${icon.content}</symbol>`);
        manifestRecords.push({
            key: relativePath,
            path: path.relative(repo, outputPath).replace(/\\/g, '/'),
            spriteId,
            sourceCategory: relativePath.split('/').slice(0, -1).join('/'),
            source: 'icon.md',
            sourceIcon: sourceKey,
            duplicateDecision: 'no-existing-canonical-file-overwritten',
            license: 'unverified-icon-md-source',
            externalLicense: 'not recorded in icon.md; verify source-pack license before redistribution'
        });
    }

    const sprite = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
        '  <defs>',
        symbols.join('\n'),
        '  </defs>',
        '</svg>',
        ''
    ].join('\n');
    fs.writeFileSync(spritePath, sprite, 'utf8');

    const manifest = {
        version: 2,
        source: 'icon.md',
        sprite: path.relative(repo, spritePath).replace(/\\/g, '/'),
        runtime: 'local SVG sprite only; no external icon font or runtime icon download',
        records: manifestRecords
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Built ${symbols.length} local SVG symbols from icon.md (${(Buffer.byteLength(sprite) / 1024).toFixed(1)} KB).`);
}

main();
