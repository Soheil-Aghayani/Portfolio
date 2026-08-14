(function (window, document) {
    'use strict';

    // Bump this whenever the generated sprite changes so browsers do not keep
    // serving an older icon set from GitHub Pages' cache.
    const SPRITE_URL = 'assets/icons/sprite.svg?v=3.1-icon-md';

    function escapeAttribute(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function normalizeName(name) {
        return String(name || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/\.svg$/i, '')
            .replace(/\//g, '-')
            .replace(/[^a-z0-9_-]/gi, '-');
    }

    function buildSvg(name, options = {}) {
        const id = normalizeName(name);
        if (!id) return '';

        const className = ['svg-icon', options.className || ''].filter(Boolean).join(' ');
        const size = options.size ? ` width="${escapeAttribute(options.size)}" height="${escapeAttribute(options.size)}"` : '';
        const label = options.label ? ` role="img" aria-label="${escapeAttribute(options.label)}"` : ' aria-hidden="true"';
        const focusable = options.label ? ' focusable="false"' : ' focusable="false"';

        const useHref = `${SPRITE_URL}#${escapeAttribute(id)}`;
        return `<svg class="${escapeAttribute(className)}" data-icon-name="${escapeAttribute(id)}"${size}${label}${focusable}><use href="${useHref}" xlink:href="${useHref}"></use></svg>`;
    }

    const IconRegistry = {
        spriteUrl: SPRITE_URL,
        id: normalizeName,
        svg: buildSvg,
        mount(target, name, options = {}) {
            if (!target) return;
            target.innerHTML = buildSvg(name, options);
        },
        hydrate(root = document) {
            const targets = [];
            if (root.matches?.('[data-icon]')) targets.push(root);
            targets.push(...root.querySelectorAll('[data-icon]'));
            targets.forEach(target => {
                const name = target.getAttribute('data-icon');
                const label = target.getAttribute('data-icon-label') || '';
                const size = target.getAttribute('data-icon-size') || '';
                const className = target.getAttribute('data-icon-class') || '';
                this.mount(target, name, { label, size, className });
            });
        }
    };

    window.IconRegistry = IconRegistry;

    function start() {
        IconRegistry.hydrate();

        // Dynamic game and flowchart controls can add data-icon nodes after boot.
        const observer = new MutationObserver((records) => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) IconRegistry.hydrate(node);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})(window, document);
