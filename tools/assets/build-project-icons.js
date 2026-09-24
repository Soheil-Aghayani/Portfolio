const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'images', 'projects', 'icons');

const PROJECTS = [
    { name: 'egg-timer', source: 'assets/icons/ui/time.svg', colors: ['#fde68a', '#f59e0b', '#92400e'], kind: 'glyph' },
    { name: 'design-suite', source: 'assets/icons/ui/outline-pan-tool.svg', colors: ['#fdba74', '#ef4444', '#881337'], kind: 'glyph' },
    { name: 'food-recipe', source: 'assets/icons/ui/leaf.svg', colors: ['#f9a8d4', '#ec4899', '#831843'], kind: 'glyph' },
    { name: 'deutschly', source: 'assets/icons/ui/language.svg', colors: ['#c4b5fd', '#635bff', '#312e81'], kind: 'glyph' },
    { name: 'pahlavan', source: 'assets/icons/states/verified.svg', colors: ['#6ee7b7', '#059669', '#064e3b'], kind: 'glyph' },
    { name: 'scholarpulse', source: 'assets/icons/ui/journal.svg', colors: ['#a5f3fc', '#06b6d4', '#164e63'], kind: 'glyph' },
    { name: 'civilicapulse', source: 'assets/images/projects/source-icons/civilicapulse.webp', colors: ['#bfdbfe', '#3b82f6', '#1e3a8a'], kind: 'image' },
    { name: 'laboratory-rules', source: 'assets/icons/states/warning.svg', colors: ['#fecaca', '#ef4444', '#7f1d1d'], kind: 'glyph' },
    { name: 'coffpen', source: 'assets/icons/ui/journal.svg', colors: ['#fde68a', '#f59e0b', '#78350f'], kind: 'glyph' },
    { name: 'dodge-game', source: 'assets/images/projects/previews/dodge-game.webp', colors: ['#fed7aa', '#f97316', '#451a03'], kind: 'image' }
];

function readGlyph(file) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const match = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!match) throw new Error(`Invalid SVG source: ${file}`);

    const viewBox = (match[1].match(/\bviewBox\s*=\s*["']([^"']+)["']/i) || [])[1] || '0 0 24 24';
    const body = match[2]
        .replace(/currentColor/g, '#ffffff')
        .replace(/<title>[\s\S]*?<\/title>/gi, '');
    return { viewBox, body };
}

function renderShell(project, index) {
    const [light, accent, deep] = project.colors;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg-${index}" x1="56" y1="36" x2="456" y2="478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${light}"/><stop offset="0.32" stop-color="${accent}"/><stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <radialGradient id="glow-${index}" cx="0" cy="0" r="1" gradientTransform="translate(214 174) rotate(59) scale(246 252)" gradientUnits="userSpaceOnUse">
      <stop stop-color="${light}" stop-opacity="0.98"/><stop offset="0.56" stop-color="${accent}" stop-opacity="0.7"/><stop offset="1" stop-color="${deep}" stop-opacity="0.18"/>
    </radialGradient>
    <linearGradient id="glass-${index}" x1="80" y1="64" x2="424" y2="456" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.34"/><stop offset="0.42" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="1" stop-color="#020617" stop-opacity="0.27"/>
    </linearGradient>
    <clipPath id="clip-${index}"><rect x="24" y="24" width="464" height="464" rx="116"/></clipPath>
  </defs>
  <rect x="18" y="18" width="476" height="476" rx="122" fill="#020617" opacity="0.5"/>
  <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#bg-${index})"/>
  <g clip-path="url(#clip-${index})">
    <circle cx="256" cy="238" r="150" fill="url(#glow-${index})" opacity="0.9"/>
    <circle cx="256" cy="238" r="117" fill="#0b1220" opacity="0.2"/>
    <path d="M84 365c75 42 157 62 246 50c57-8 99-25 137-51c-38 66-112 106-203 106c-81 0-145-31-180-105Z" fill="#020617" opacity="0.22"/>
    <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#glass-${index})" opacity="0.1"/>
  </g>
  <rect x="31" y="31" width="450" height="450" rx="109" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="2"/>
</svg>`;
}

function renderFinish(index) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="finish-glass-${index}" x1="80" y1="64" x2="424" y2="456" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.32"/><stop offset="0.42" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="1" stop-color="#020617" stop-opacity="0.27"/>
    </linearGradient>
    <clipPath id="finish-clip-${index}"><rect x="24" y="24" width="464" height="464" rx="116"/></clipPath>
  </defs>
  <g clip-path="url(#finish-clip-${index})">
    <path d="M43 132C77 58 151 24 258 24c92 0 166 28 215 91c-75-31-147-40-218-27C160 102 96 122 43 154Z" fill="#ffffff" opacity="0.13"/>
    <path d="M40 392c77 62 163 87 259 75c65-8 123-33 175-75c-44 67-120 106-220 106c-92 0-169-34-214-106Z" fill="#020617" opacity="0.14"/>
    <rect x="42" y="42" width="428" height="428" rx="96" fill="url(#finish-glass-${index})" opacity="0.2"/>
  </g>
  <rect x="39" y="39" width="434" height="434" rx="99" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>
</svg>`;
}

function roundedMask() {
    return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="428" height="428"><rect width="428" height="428" rx="96" fill="white"/></svg>');
}

async function buildProjectIcon(project, index) {
    const base = await sharp(Buffer.from(renderShell(project, index))).png().toBuffer();
    const layers = [];

    if (project.kind === 'glyph') {
        const glyph = readGlyph(project.source);
        const glyphSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="${glyph.viewBox}">${glyph.body}</svg>`;
        const glyphPng = await sharp(Buffer.from(glyphSvg)).resize(240, 240, { fit: 'contain' }).png().toBuffer();
        const glyphGlow = await sharp(glyphPng).blur(12).png().toBuffer();
        layers.push({ input: glyphGlow, left: 136, top: 118, blend: 'screen' });
        layers.push({ input: glyphPng, left: 136, top: 118 });
    } else {
        const source = path.join(ROOT, project.source);
        const imagePng = await sharp(source).resize(428, 428, { fit: 'cover', position: 'centre' }).png().toBuffer();
        const clippedImage = await sharp(imagePng).composite([{ input: roundedMask(), blend: 'dest-in' }]).png().toBuffer();
        layers.push({ input: clippedImage, left: 42, top: 42 });
    }

    layers.push({ input: Buffer.from(renderFinish(index)), blend: 'over' });
    await sharp(base)
        .composite(layers)
        .webp({ quality: 88, effort: 5 })
        .toFile(path.join(OUTPUT_DIR, `${project.name}.webp`));
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    for (const [position, project] of PROJECTS.entries()) {
        await buildProjectIcon(project, position + 1);
        console.log(`Built ${project.name}.webp`);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
