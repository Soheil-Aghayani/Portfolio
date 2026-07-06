
class WindowManager {
    constructor() {
        this.apps = {};
        this.activeApp = null;
    }

    /**
     * Registers an app with the system.
     * @param {string} id - Unique app ID (e.g., 'terminal', 'notes', 'games').
     * @param {string} wrapId - DOM ID of the wrapper (.os-term, .notes-wrap).
     * @param {string} winId - DOM ID of the inner window (.os-term-win).
     * @param {object} options - Optional callbacks { onClose, onOpen }.
     */
    register(id, wrapId, winId, options = {}) {
        const wrap = document.getElementById(wrapId);
        const win = document.getElementById(winId);
        if (!wrap || !win) {
            console.warn(`WindowManager: Elements not found for ${id}`);
            return;
        }

        this.apps[id] = {
            id,
            wrap,
            win,
            options,
            isOpen: false
        };

        // Click outside to close (optional, maybe not for all apps, but keeping consistent with current behavior)
        wrap.addEventListener('click', (e) => {
            if (e.target === wrap) {
                this.close(id);
            }
        });

        // Setup window controls if they exist inside this window
        // We look for standard class names: .os-dot.red (close), .os-dot.green (max), .os-dot.yellow (min)
        const closeBtn = win.querySelector('.os-dot.red, .notes-dot.red');
        const maxBtn = win.querySelector('.os-dot.green, .notes-dot.green');
        const minBtn = win.querySelector('.os-dot.yellow, .notes-dot.yellow');

        if (closeBtn) closeBtn.addEventListener('click', () => this.close(id));
        if (maxBtn) maxBtn.addEventListener('click', () => this.toggleMax(id));
        if (minBtn) minBtn.addEventListener('click', () => this.minimize(id));
    }

    open(id, ...args) {
        const app = this.apps[id];
        if (!app) return;

        // Store active element for restoring focus
        app.previousFocus = document.activeElement;

        // Close others? For now, we allow stacking or just simple z-index?
        // The CSS assumes fixed positioning covering the screen, so usually one at a time or overlay.
        // Let's keep it simple: just open.

        app.wrap.classList.add('open');
        app.wrap.setAttribute('aria-hidden', 'false');
        app.win.classList.remove('max'); // Reset max state on open usually
        app.isOpen = true;
        this.activeApp = id;

        // Manage focus
        app.wrap.setAttribute('tabindex', '-1');
        app.wrap.focus();

        document.body.style.overflow = 'hidden'; // Lock scroll
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';

        if (app.options.onOpen) app.options.onOpen(...args);
    }

    close(id) {
        const app = this.apps[id];
        if (!app) return;

        app.wrap.classList.remove('open');
        app.wrap.setAttribute('aria-hidden', 'true');
        app.isOpen = false;

        if (this.activeApp === id) this.activeApp = null;

        // Check if any other apps are open before unlocking scroll
        const anyOpen = Object.values(this.apps).some(a => a.isOpen);
        if (!anyOpen) {
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
            document.documentElement.style.overscrollBehavior = '';
        }

        // Restore focus
        if (app.previousFocus) {
            app.previousFocus.focus();
        }

        if (app.options.onClose) app.options.onClose();
    }

    toggleMax(id) {
        const app = this.apps[id];
        if (!app) return;
        app.win.classList.toggle('max');
        app.win.classList.toggle('maxed'); // Support both legacy class names
    }

    minimize(id) {
        // Simple minimize: just hide the content body?
        // For now, let's just toggle a 'minimized' class or hide the body part.
        // In the existing code, it hid the '.os-term-out'.
        // We might need a custom handler for this.
        const app = this.apps[id];
        if (app && app.options.onMin) {
            app.options.onMin();
        } else {
            // Default behavior: toggle opacity or similar?
            // Leaving blank as default minimize behavior isn't fully defined for all apps.
        }
    }

    isOpen(id) {
        return this.apps[id] && this.apps[id].isOpen;
    }
}

// Global instance
window.OS = new WindowManager();

// Prevent background scrolling on touch devices and desktop when an app window is active
document.addEventListener('touchmove', (e) => {
    if (window.OS && window.OS.activeApp) {
        const app = window.OS.apps[window.OS.activeApp];
        if (app && app.wrap && app.win) {
            // If touch is outside the modal window, block it completely
            const isInsideWin = app.win.contains(e.target);
            if (!isInsideWin) {
                if (e.cancelable) e.preventDefault();
                return;
            }

            // If inside the window, check if it's in a scrollable element
            let current = e.target;
            let isScrollable = false;
            while (current && current !== app.win) {
                const style = window.getComputedStyle(current);
                const overflowY = style.getPropertyValue('overflow-y') || style.getPropertyValue('overflow');
                if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
                    isScrollable = true;
                    break;
                }
                current = current.parentElement;
            }

            if (!isScrollable) {
                if (e.cancelable) e.preventDefault();
            }
        }
    }
}, { passive: false });

document.addEventListener('wheel', (e) => {
    if (window.OS && window.OS.activeApp) {
        const app = window.OS.apps[window.OS.activeApp];
        if (app && app.wrap && app.win) {
            const isInsideWin = app.win.contains(e.target);
            if (!isInsideWin) {
                if (e.cancelable) e.preventDefault();
            }
        }
    }
}, { passive: false });

