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
    'sound-off-2-svgrepo-com.svg',
    'sound-minus-svgrepo-com.svg',
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

// Explicit selections supplied by the owner take precedence over an older
// canonical duplicate. The source paths stay outside the repository; only
// the selected SVG content is copied into the canonical asset tree.
const selectedIconImports = [
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\x.svg`, destination: 'icons/states/x.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\telegram.svg`, destination: 'icons/brand/telegram.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\compass.svg`, destination: 'icons/states/compass.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\leaf.svg`, destination: 'icons/ui/leaf.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\suitcase-linear.svg`, destination: 'icons/games/blackjack/suitcase.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\ecology-science-erlenmeyer-flask-experiment-lab-flask-science-chemistry-solution.svg`, destination: 'icons/ui/ecology-science-erlenmeyer-flask-experiment-lab-flask-science-chemistry-solution.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\filter.svg`, destination: 'icons/ui/filter.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\journal.svg`, destination: 'icons/ui/journal.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\conference.svg`, destination: 'icons/states/conference.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\external-link-rounded.svg`, destination: 'icons/states/external-link-rounded.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\globe.svg`, destination: 'icons/ui/globe.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\recycle.svg`, destination: 'icons/ui/recycle.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\qr-code.svg`, destination: 'icons/ui/qr-code.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\sport-soccer-16-filled.svg`, destination: 'icons/games/minesweeper/sport-soccer-16-filled.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\terminal.svg`, destination: 'icons/ui/terminal.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\leaf (1).svg`, destination: 'icons/ui/leaf-variant.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\bar-chart-rounded.svg`, destination: 'icons/ui/bar-chart-rounded.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\python.svg`, destination: 'icons/ui/python.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\chemistry-light.svg`, destination: 'icons/ui/chemistry-light.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\language.svg`, destination: 'icons/ui/language.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\lang-en-us.svg`, destination: 'icons/ui/lang-en-us.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\de.svg`, destination: 'icons/ui/de.svg' },
    { source: String.raw`C:\Users\Soheil\Desktop\Port icon\volunteer-activism-outline.svg`, destination: 'icons/states/volunteer-activism-outline.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\heart-bold.svg`, destination: 'icons/states/heart-bold.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\zazen-fill (1).svg`, destination: 'icons/games/minesweeper/zazen-fill.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\endless-sky.svg`, destination: 'icons/games/minesweeper/endless-sky.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\time.svg`, destination: 'icons/ui/time.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\info-svgrepo-com.svg`, destination: 'icons/ui/info-svgrepo-com.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\bomb-bold.svg`, destination: 'icons/games/minesweeper/bomb-bold.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\flag-filled.svg`, destination: 'icons/games/minesweeper/flag-filled.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\radar-light.svg`, destination: 'icons/games/minesweeper/radar-light.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\pause-linear.svg`, destination: 'icons/games/shared/pause.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\play-line-duotone.svg`, destination: 'icons/games/shared/play.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\reset.svg`, destination: 'icons/games/shared/reset.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\zoom-out-broken-svgrepo-com.svg`, destination: 'icons/games/minesweeper/zoom-out-broken.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\zoom-in-broken-svgrepo-com.svg`, destination: 'icons/games/minesweeper/zoom-in-broken.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\arrow-down-svgrepo-com.svg`, destination: 'icons/games/shared/arrow-down.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\arrow-up-svgrepo-com.svg`, destination: 'icons/games/shared/arrow-up.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\arrow-prev-small-svgrepo-com.svg`, destination: 'icons/ui/arrow-prev.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\arrow-next-small-svgrepo-com.svg`, destination: 'icons/ui/arrow-next.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\note-01.svg`, destination: 'icons/ui/note-01.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\note-add (1).svg`, destination: 'icons/ui/note-add.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\note-edit.svg`, destination: 'icons/ui/note-edit.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\note-remove.svg`, destination: 'icons/ui/note-remove.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\notes-outline.svg`, destination: 'icons/ui/notes-outline.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\gamepad.svg`, destination: 'icons/games/shared/gamepad.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\flowchart-outline-sharp.svg`, destination: 'icons/states/flowchart-outline-sharp.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\go-back.svg`, destination: 'icons/states/go-back.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\hacker.svg`, destination: 'icons/states/hacker.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\check.svg`, destination: 'icons/ui/check.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\click-tap.svg`, destination: 'icons/games/minesweeper/click-tap.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\gift-linear.svg`, destination: 'icons/games/blackjack/gift-linear.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\github.svg`, destination: 'icons/brand/github.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\outline-pan-tool.svg`, destination: 'icons/ui/outline-pan-tool.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\round-share.svg`, destination: 'icons/ui/share-round.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\sound-volume-2-svgrepo-com.svg`, destination: 'icons/ui/sound-volume-2.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\sound-volume-1-svgrepo-com.svg`, destination: 'icons/ui/sound-volume-1.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\sound-off-2-svgrepo-com.svg`, destination: 'icons/ui/sound-off-2.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\sound-minus-svgrepo-com.svg`, destination: 'icons/ui/sound-minus.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\close-rounded.svg`, destination: 'icons/ui/close-rounded.svg' },
    { source: String.raw`C:\Users\Soheil\Downloads\round-contrast.svg`, destination: 'icons/ui/contrast-round.svg' }
];

const selectedIconDestinationPaths = new Set(
    selectedIconImports.map(({ destination }) => destination.replace(/^icons[\\/]/, '').replace(/\\/g, '/'))
);

// Match the heavier visual weight of the supplied filled icons without
// changing logo artwork or large game illustrations.
const RENDER_STROKE_WIDTH = '2.2';

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
        if (selectedIconDestinationPaths.has(path.relative(iconsDir, target).replace(/\\/g, '/'))) {
            records.push({ key, path: '', source: 'provided-folder', original: sourceName, duplicateOf: 'explicit-user-selection' });
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

function copySelectedIcons(records) {
    for (const selection of selectedIconImports) {
        const source = path.resolve(selection.source);
        const target = path.join(assetsDir, selection.destination);
        if (!fs.existsSync(source)) throw new Error(`Selected icon source does not exist: ${source}`);

        const raw = fs.readFileSync(source, 'utf8');
        if (!getAttr(raw, 'viewBox')) throw new Error(`Missing viewBox in selected icon: ${source}`);

        const previousHash = fs.existsSync(target)
            ? require('crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex')
            : '';
        const selectedHash = require('crypto').createHash('sha256').update(raw).digest('hex');
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (previousHash !== selectedHash) fs.writeFileSync(target, raw, 'utf8');

        records.push({
            key: selection.destination.replace(/^icons\//, '').replace(/\.svg$/i, ''),
            path: path.relative(repo, target).replace(/\\/g, '/'),
            source: 'user-selected-file',
            sourceCategory: 'explicit-user-selection',
            sourceFile: `${selection.source.includes('Downloads') ? 'Downloads' : 'Port icon'}/${path.basename(source)}`,
            selection: 'explicit-user-selection',
            reused: previousHash === selectedHash,
            replacedCanonicalHash: previousHash && previousHash !== selectedHash ? previousHash : undefined
        });
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
        let innerContent = (svgRoot
            ? svg.slice((svgRoot.index || 0) + svgRoot[0].length)
            : svg)
            .replace(/<\/svg>\s*$/i, '')
            .replace(/<\?xml[\s\S]*?\?>/gi, '')
            .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
            .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
            .trim();
        if (!relative.startsWith('brand/')) {
            innerContent = innerContent.replace(
                /(\bstroke-width\s*=\s*["'])(?:1\.5|1\.8|2)(["'])/gi,
                `$1${RENDER_STROKE_WIDTH}$2`
            );
        }
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
    copySelectedIcons(records);
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
        sourceCategory: record.sourceCategory || (record.source === 'provided-folder' ? 'supplied-svg' : 'existing-canonical'),
        license: record.source === 'provided-folder' || record.source === 'user-selected-file'
            ? 'unverified-user-supplied'
            : 'existing-project-asset'
    });
    const canonicalRecords = [...canonicalByPath.values()].sort((a, b) => a.key.localeCompare(b.key)).map(addLicenseMetadata);
    const duplicateRecords = duplicates.sort((a, b) => a.original.localeCompare(b.original)).map(addLicenseMetadata);

    const manifest = {
        version: 1,
        sprite: 'assets/icons/sprite.svg',
        rendering: {
            strokeWidth: RENDER_STROKE_WIDTH,
            note: 'Applied to non-brand sprite strokes only; filled icons keep their original geometry.'
        },
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
