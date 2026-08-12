const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/icons/manifest.json'), 'utf8'));

function normalizeBody(svg) {
    const match = String(svg).match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    if (!match) return '';
    return match[1]
        .replace(/<!--(?:.|\n|\r)*?-->/g, '')
        .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim();
}

function digest(body) {
    return crypto.createHash('sha1').update(normalizeBody(body)).digest('hex');
}

const canonicalByDigest = new Map();
for (const record of manifest.records) {
    const svgPath = path.join(root, record.path.replaceAll('/', path.sep));
    if (!fs.existsSync(svgPath)) continue;
    const key = digest(fs.readFileSync(svgPath, 'utf8'));
    if (!canonicalByDigest.has(key)) canonicalByDigest.set(key, record);
}

const inlineIconPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;
const files = ['index.html', 'projects.html'];
let replaced = 0;

for (const file of files) {
    const filePath = path.join(root, file);
    let source = fs.readFileSync(filePath, 'utf8');
    source = source.replace(inlineIconPattern, (full, attrs, body) => {
        if (/\bpreview-svg\b/i.test(attrs)) return full;
        const record = canonicalByDigest.get(digest(`<svg>${body}</svg>`));
        if (!record) return full;

        const id = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
        const label = attrs.match(/\baria-label\s*=\s*["']([^"']+)["']/i)?.[1];
        const preserved = [
            id ? ` id="${id}"` : '',
            label ? ` data-icon-label="${label}"` : '',
            ' aria-hidden="true"'
        ].join('');
        replaced++;
        return `<span class="svg-icon-slot" data-icon="${record.key}"${preserved}></span>`;
    });

    const contextualReplacements = [
        { pattern: /<a\b[^>]*href="[^"]*linkedin[^"]*"[^>]*>[\s\S]*?<\/a>/gi, icon: 'brand/linkedin-circle' },
        { pattern: /<a\b[^>]*href="[^"]*t\.me[^\"]*"[^>]*>[\s\S]*?<\/a>/gi, icon: 'brand/telegram' },
        { pattern: /<a\b[^>]*id="shareTwitter"[^>]*>[\s\S]*?<\/a>/gi, icon: 'states/x' }
    ];
    for (const { pattern, icon } of contextualReplacements) {
        source = source.replace(pattern, block => block.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/i,
            `<span class="svg-icon-slot" data-icon="${icon}" aria-hidden="true"></span>`));
    }
    fs.writeFileSync(filePath, source);
}

console.log(`Extracted ${replaced} duplicated inline icons.`);
