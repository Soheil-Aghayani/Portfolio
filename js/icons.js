(function (window, document) {
    'use strict';

    const SPRITE_URL = 'assets/icons/sprite.svg';

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

        return `<svg class="${escapeAttribute(className)}"${size}${label}${focusable}><use href="${SPRITE_URL}#${escapeAttribute(id)}"></use></svg>`;
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
            root.querySelectorAll('[data-icon]').forEach(target => {
                const name = target.getAttribute('data-icon');
                const label = target.getAttribute('data-icon-label') || '';
                const size = target.getAttribute('data-icon-size') || '';
                const className = target.getAttribute('data-icon-class') || '';
                this.mount(target, name, { label, size, className });
            });
        }
    };

    window.IconRegistry = IconRegistry;
    document.addEventListener('DOMContentLoaded', () => IconRegistry.hydrate());
})(window, document);
