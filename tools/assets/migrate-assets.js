const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..', '..');
const providedDir = process.env.PORT_ICON_DIR || 'C:\\Users\\Soheil\\Desktop\\Port icon';
const assetsDir = path.join(repo, 'assets');
const iconsDir = path.join(assetsDir, 'icons');

const iconDirectories = [
    'brand',
    'ui',
    'games/blackjack',
    'games/minesweeper',
    'games/shared',
    'screensavers',
    'states'
];

const mediaDirectories = [
    'images/portfolio',
    'images/games',
    'images/miner',
    'audio',
    'video'
];

const existingIconCategories = {
    'starfield.svg': 'screensavers',
    'matrix.svg': 'screensavers',
    'dvd.svg': 'screensavers',
    'sunrise.svg': 'screensavers',
    'ai-line.svg': 'screensavers',
    'gamepad.svg': 'games/shared',
    'sports-esports.svg': 'games/shared',
    'sports-soccer.svg': 'games/shared',
    'keyboard-arrow-down.svg': 'games/shared',
    'keyboard-arrow-left.svg': 'games/shared',
    'keyboard-arrow-right.svg': 'games/shared',
    'keyboard-arrow-up.svg': 'games/shared',
    'pause.svg': 'games/shared',
    'play.svg': 'games/shared',
    'play-arrow.svg': 'games/shared',
    'reset.svg': 'games/shared',
    'restart-alt.svg': 'games/shared',
    'rotate.svg': 'games/shared',
    'rotate-right.svg': 'games/shared',
    'zoom-in.svg': 'games/shared',
    'zoom-out.svg': 'games/shared',
    'arrow-back.svg': 'games/shared',
    'arrow-down.svg': 'games/shared',
    'arrow-left.svg': 'games/shared',
    'arrow-right.svg': 'games/shared',
    'arrow-up.svg': 'games/shared',
    'check-circle.svg': 'states',
    'heart-bold.svg': 'states',
    'info.svg': 'states',
    'verified.svg': 'states',
    'verified-user.svg': 'states',
    'close.svg': 'ui',
    'add.svg': 'ui',
    'delete.svg': 'ui',
    'edit.svg': 'ui',
    'check.svg': 'ui',
    'account-balance.svg': 'ui',
    'bar-chart.svg': 'ui',
    'book.svg': 'ui',
    'code.svg': 'ui',
    'co-present.svg': 'ui',
    'contrast.svg': 'ui',
    'description.svg': 'ui',
    'desktop.svg': 'ui',
    'desktop-windows.svg': 'ui',
    'diversity-3.svg': 'ui',
    'drop.svg': 'ui',
    'eco.svg': 'ui',
    'expand-less.svg': 'ui',
    'expand-more.svg': 'ui',
    'eye.svg': 'ui',
    'filter-alt-off.svg': 'ui',
    'filter-alt.svg': 'ui',
    'filter.svg': 'ui',
    'language.svg': 'ui',
    'link.svg': 'ui',
    'mail.svg': 'ui',
    'menu-book.svg': 'ui',
    'music-off.svg': 'ui',
    'note-stack.svg': 'ui',
    'notes.svg': 'ui',
    'oil-barrel.svg': 'ui',
    'open-in-new.svg': 'ui',
    'palette.svg': 'ui',
    'presentation.svg': 'ui',
    'public.svg': 'ui',
    'qr-code-2.svg': 'ui',
    'recycling.svg': 'ui',
    'schedule.svg': 'ui',
    'school.svg': 'ui',
    'science.svg': 'ui',
    'search.svg': 'ui',
    'send.svg': 'ui',
    'share.svg': 'ui',
    'smartphone.svg': 'ui',
    'tablet.svg': 'ui',
    'tablet-mac.svg': 'ui',
    'terminal.svg': 'ui',
    'touch-app.svg': 'ui',
    'translate.svg': 'ui',
    'vertical-align-bottom.svg': 'ui',
    'visibility.svg': 'ui',
    'volume-off.svg': 'ui',
    'volume-up.svg': 'ui',
    'volunteer-activism.svg': 'ui',
    'work.svg': 'ui'
};

const rootMediaMoves = {
    'favicon.svg': 'icons/brand/favicon.svg',
    'github.svg': 'icons/brand/github.svg',
    'linkedin-circle.svg': 'icons/brand/linkedin-circle.svg',
    'telegram.svg': 'icons/brand/telegram.svg',
    'flowchart.webp': 'images/portfolio/flowchart.webp',
    'flowchart-phone.webp': 'images/portfolio/flowchart-phone.webp',
    'name.webp': 'images/portfolio/name.webp',
    'welcome.webp': 'images/portfolio/welcome.webp',
    '2048.webp': 'images/games/2048.webp',
    'blackjack.webp': 'images/games/blackjack.webp',
    'breakout.webp': 'images/games/breakout.webp',
    'invaders.webp': 'images/games/invaders.webp',
    'minesweeper.webp': 'images/games/minesweeper.webp',
    'snake.webp': 'images/games/snake.webp',
    'tetris.webp': 'images/games/tetris.webp',
    'preview.mp4': 'video/preview.mp4',
    'daft-punk-veridis-quo.mp3': 'audio/daft-punk-veridis-quo.mp3',
    'kyoto.mp3': 'audio/kyoto.mp3',
    'monday-routine.mp3': 'audio/monday-routine.mp3',
    'warm-cup-of-coffee.mp3': 'audio/warm-cup-of-coffee.mp3'
};

const providedDuplicateNames = new Set([
    'arrow-down-svgrepo-com.svg',
    'arrow-up-svgrepo-com.svg',
    'check.svg',
    'desktop-svgrepo-com.svg',
    'desktop.svg',
    'dvd (1).svg',
    'filter.svg',
    'gamepad.svg',
    'language.svg',
    'link.svg',
    'linkedin.svg',
    'linkedin-with-circle.svg',
    'mail (1).svg',
    'mail.svg',
    'recycle.svg',
    'reset.svg',
    'rotate.svg',
    'smartphone-linear.svg',
    'sport-soccer-16-filled.svg',
    'telegram.svg',
    'terminal.svg',
    'volunteer-activism-outline.svg'
]);

const providedRenames = {
    'arrow-down-svgrepo-com.svg': 'arrow-down.svg',
    'arrow-next-small-svgrepo-com.svg': 'arrow-next.svg',
    'arrow-prev-small-svgrepo-com.svg': 'arrow-prev.svg',
    'arrow-up-svgrepo-com.svg': 'arrow-up.svg',
    'desktop-svgrepo-com.svg': 'desktop.svg',
    'dvd (1).svg': 'dvd.svg',
    'leaf (1).svg': 'leaf-variant.svg',
    'mail (1).svg': 'mail-alt.svg',
    'note-add (1).svg': 'note-add.svg',
    'pallete-2-broken.svg': 'palette-broken.svg',
    'play-line-duotone.svg': 'play-duotone.svg',
    'qr-code.svg': 'qr-code.svg',
    'round-contrast.svg': 'contrast-round.svg',
    'round-music-off.svg': 'music-off-round.svg',
    'round-share.svg': 'share-round.svg',
    'smartphone-linear.svg': 'smartphone.svg',
    'sound-off-2-svgrepo-com.svg': 'sound-off-alt.svg',
    'sound-off-svgrepo-com.svg': 'sound-off.svg',
    'sound-volume-1-svgrepo-com.svg': 'sound-volume-1.svg',
    'sound-volume-2-svgrepo-com.svg': 'sound-volume-2.svg',
    'suitcase-linear.svg': 'suitcase.svg',
    'tag-linear.svg': 'tag.svg',
    'zoom-in-broken-svgrepo-com.svg': 'zoom-in-broken.svg',
    'zoom-out-broken-svgrepo-com.svg': 'zoom-out-broken.svg'
};

function ensureDirectories() {
    iconDirectories.forEach(relative => {
        fs.mkdirSync(path.join(iconsDir, relative), { recursive: true });
    });
    mediaDirectories.forEach(relative => {
        fs.mkdirSync(path.join(assetsDir, relative), { recursive: true });
    });
}

function removeStaleDirectories() {
    for (const relative of ['brand', 'games', 'screensavers', 'states', 'ui']) {
        const target = path.join(assetsDir, relative);
        if (!fs.existsSync(target)) continue;
        const removeEmptyTree = current => {
            for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
                const child = path.join(current, entry.name);
                if (entry.isDirectory()) removeEmptyTree(child);
            }
            if (fs.readdirSync(current).length !== 0) {
                throw new Error(`Refusing to remove non-empty stale directory: ${current}`);
            }
            fs.rmdirSync(current);
        };
        removeEmptyTree(target);
    }
}

function moveFile(source, target) {
    if (!fs.existsSync(source)) return false;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
        const sourceHash = require('crypto').createHash('sha256').update(fs.readFileSync(source)).digest('hex');
        const targetHash = require('crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex');
        if (sourceHash !== targetHash) {
            throw new Error(`Refusing to overwrite ${target} with a different file from ${source}`);
        }
        return false;
    }
    fs.renameSync(source, target);
    return true;
}

function normalizeMonochrome(svg, category) {
    if (category === 'brand') return svg;
    return svg
        .replace(/((?:fill|stroke)\s*=\s*["'])\s*(?:black|#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))\s*(["'])/gi, '$1currentColor$2')
        .replace(/(fill\s*:\s*)(?:black|#000(?:000)?)(\s*[;}])/gi, '$1currentColor$2')
        .replace(/(stroke\s*:\s*)(?:black|#000(?:000)?)(\s*[;}])/gi, '$1currentColor$2');
}

function getAttr(svg, name) {
    const match = svg.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return match ? match[1] : '';
}

function classifyProvided(name) {
    if (/^(linkedin|telegram)\.svg$/i.test(name)) return 'brand';
    if (/^(pixel-|gamepad|bomb|flag|pickaxe|radar|sport-|play-|pause|reset|rotate|zoom-|click-tap)/i.test(name)) return 'games/minesweeper';
    if (/^(gift|reward|suitcase|tag)/i.test(name)) return 'games/blackjack';
    if (/^(hacker|flowchart|external-link|vpn|security-check|warning|x|compass|go-back|bachelor-cap|university|conference|people-team)/i.test(name)) return 'states';
    if (/^(dvd|matrix|starfield|sunrise|ai-line)/i.test(name)) return 'screensavers';
    if (/^(sound-|round-music|music-off|round-share|share|mail|send|link|qr-code|language|lang-|english-input|de|globe)/i.test(name)) return 'ui';
    return 'ui';
}

function moveExistingIcons(records) {
    for (const [name, category] of Object.entries(existingIconCategories)) {
        const source = path.join(iconsDir, name);
        const target = path.join(iconsDir, category, name);
        if (moveFile(source, target)) {
            records.push({ key: `${category}/${name.replace(/\.svg$/i, '')}`, path: path.relative(repo, target).replace(/\\/g, '/'), source: 'existing-repository', original: name });
        }
    }
}

function copyProvidedIcons(records) {
    if (!fs.existsSync(providedDir)) {
        throw new Error(`Provided icon directory does not exist: ${providedDir}`);
    }

    for (const sourceName of fs.readdirSync(providedDir).filter(name => name.toLowerCase().endsWith('.svg')).sort()) {
        const category = classifyProvided(sourceName);
        const canonicalName = providedRenames[sourceName] || sourceName;
        const key = `${category}/${canonicalName.replace(/\.svg$/i, '')}`;
        const target = path.join(iconsDir, category, canonicalName);
        if (providedDuplicateNames.has(sourceName)) {
            records.push({ key, path: '', source: 'provided-folder', original: sourceName, duplicateOf: 'existing-canonical' });
            continue;
        }

        const raw = fs.readFileSync(path.join(providedDir, sourceName), 'utf8');
        if (!getAttr(raw, 'viewBox')) throw new Error(`Missing viewBox in supplied icon: ${sourceName}`);
        const normalized = normalizeMonochrome(raw, category.split('/')[0]);
        if (fs.existsSync(target)) {
            const existing = fs.readFileSync(target, 'utf8');
            if (existing !== normalized) throw new Error(`Refusing to overwrite canonical icon: ${target}`);
            records.push({ key, path: path.relative(repo, target).replace(/\\/g, '/'), source: 'provided-folder', original: sourceName, reused: true });
            continue;
        }
        fs.writeFileSync(target, normalized, 'utf8');
        records.push({ key, path: path.relative(repo, target).replace(/\\/g, '/'), source: 'provided-folder', original: sourceName });
    }
}

function moveRootMedia() {
    for (const [sourceName, destination] of Object.entries(rootMediaMoves)) {
        moveFile(path.join(assetsDir, sourceName), path.join(assetsDir, destination));
    }

    const minerSource = path.join(assetsDir, 'miner');
    const minerTarget = path.join(assetsDir, 'images', 'miner');
    if (fs.existsSync(minerSource)) {
        for (const name of fs.readdirSync(minerSource)) {
            moveFile(path.join(minerSource, name), path.join(minerTarget, name));
        }
        if (fs.existsSync(minerSource) && fs.readdirSync(minerSource).length === 0) fs.rmdirSync(minerSource);
    }
}

function buildSprite(records) {
    const iconFiles = [];
    for (const category of iconDirectories) {
        const dir = path.join(iconsDir, category);
        if (!fs.existsSync(dir)) continue;
        const walk = current => {
            for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
                const full = path.join(current, entry.name);
                if (entry.isDirectory()) walk(full);
                else if (entry.isFile() && entry.name.endsWith('.svg')) iconFiles.push(full);
            }
        };
        walk(dir);
    }

    const symbols = [];
    const known = new Set();
    for (const file of iconFiles.sort()) {
        const relative = path.relative(iconsDir, file).replace(/\\/g, '/');
        const key = relative.replace(/\.svg$/i, '').replace(/\//g, '-');
        if (known.has(key)) throw new Error(`Duplicate sprite key: ${key}`);
        known.add(key);
        let svg = fs.readFileSync(file, 'utf8');
        const viewBox = getAttr(svg, 'viewBox') || '0 0 24 24';
        // Source icons can contain an XML declaration and a nested SVG root.
        // A nested document is invalid inside a sprite symbol and renders blank
        // in Chromium, so keep only the outer document's contents.
        const svgRoot = svg.match(/<svg\b[^>]*>/i);
        const rootMarkup = svgRoot ? svgRoot[0] : '';
        const rootFill = getAttr(rootMarkup, 'fill') || (getAttr(rootMarkup, 'style').match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i) || [])[1] || '';
        const rootStroke = getAttr(rootMarkup, 'stroke') || (getAttr(rootMarkup, 'style').match(/(?:^|;)\s*stroke\s*:\s*([^;]+)/i) || [])[1] || '';
        const innerContent = (svgRoot
            ? svg.slice((svgRoot.index || 0) + svgRoot[0].length)
            : svg)
            .replace(/<\/svg>\s*$/i, '')
            .replace(/<\?xml[\s\S]*?\?>/gi, '')
            .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
            .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
            .trim();
        const inheritedAttrs = [
            rootFill ? `fill="${rootFill}"` : '',
            rootStroke ? `stroke="${rootStroke}"` : ''
        ].filter(Boolean).join(' ');
        const inner = inheritedAttrs ? `<g ${inheritedAttrs}>${innerContent}</g>` : innerContent;
        symbols.push(`<symbol id="${key}" viewBox="${viewBox}">${inner}</symbol>`);
        const record = records.find(item => item.path === path.join('assets', 'icons', relative).replace(/\\/g, '/'));
        if (!record) records.push({ key: relative.replace(/\.svg$/i, ''), path: `assets/icons/${relative}`, source: 'existing-canonical' });
        else record.spriteId = key;
    }

    const sprite = [
        '<svg xmlns="http://www.w3.org/2000/svg">',
        '<defs>',
        symbols.join('\n'),
        '</defs>',
        '</svg>',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(iconsDir, 'sprite.svg'), sprite, 'utf8');
    records.forEach(record => {
        if (!record.spriteId && record.path) record.spriteId = record.path.replace(/^assets\/icons\//, '').replace(/\.svg$/i, '').replace(/\//g, '-');
    });
}

function main() {
    ensureDirectories();
    const records = [];
    moveExistingIcons(records);
    copyProvidedIcons(records);
    moveRootMedia();
    removeStaleDirectories();
    buildSprite(records);

    const canonicalByPath = new Map();
    const duplicates = [];
    for (const record of records) {
        if (!record.path) {
            duplicates.push(record);
            continue;
        }
        const current = canonicalByPath.get(record.path) || {};
        canonicalByPath.set(record.path, { ...current, ...record });
    }

    const addLicenseMetadata = (record) => ({
        ...record,
        sourceCategory: record.source === 'provided-folder' ? 'supplied-svg' : 'existing-canonical',
        license: record.source === 'provided-folder'
            ? 'unverified-user-supplied'
            : 'existing-project-asset'
    });
    const canonicalRecords = [...canonicalByPath.values()].sort((a, b) => a.key.localeCompare(b.key)).map(addLicenseMetadata);
    const duplicateRecords = duplicates.sort((a, b) => a.original.localeCompare(b.original)).map(addLicenseMetadata);

    const manifest = {
        version: 1,
        sprite: 'assets/icons/sprite.svg',
        suppliedDirectory: 'external-supplied-folder',
        licenseNotes: {
            suppliedSvg: 'License information was not included with the supplied folder; confirm ownership or license before redistribution.',
            fallbackCatalog: 'All SVG Icons was researched only as a fallback. No fallback asset is imported or fetched at runtime.',
            fallbackUrl: 'https://allsvgicons.com/compare/svgrepo-alternatives/'
        },
        records: canonicalRecords,
        duplicates: duplicateRecords
    };
    fs.writeFileSync(path.join(iconsDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Migrated ${records.length} icon records and generated ${path.join('assets', 'icons', 'sprite.svg')}`);
}

main();
