const initApp = () => {
    let osStylesPromise;
    let terminalPromise;
    let notesPromise;

    const ensureOsStyles = () => {
        if (osStylesPromise) return osStylesPromise;

        const existing = document.querySelector('link[data-os-styles]');
        if (existing) return Promise.resolve(existing);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/os.css?v=2.2';
        link.dataset.osStyles = 'true';
        osStylesPromise = new Promise((resolve, reject) => {
            link.onload = () => resolve(link);
            link.onerror = reject;
        });
        document.head.appendChild(link);
        return osStylesPromise;
    };

    const ensureTerminal = () => {
        if (!terminalPromise) {
            terminalPromise = ensureOsStyles()
                .then(() => import('./terminal.js?v=2.3'))
                .then(() => window.TerminalApp)
                .catch((err) => {
                    terminalPromise = null;
                    throw err;
                });
        }
        return terminalPromise;
    };

    const ensureNotes = () => {
        if (!notesPromise) {
            notesPromise = ensureOsStyles()
                .then(() => import('./notes.js?v=2.2'))
                .then(() => window.NotesApp)
                .catch((err) => {
                    notesPromise = null;
                    throw err;
                });
        }
        return notesPromise;
    };

    window.ensureTerminalApp = ensureTerminal;
    window.ensureNotesApp = ensureNotes;

    const hw = document.getElementById('helloWorld');
    const openTerminal = async () => {
        try {
            await ensureTerminal();
            if (window.OS && window.OS.open) {
                window.OS.open('terminal');
            } else {
                const osTerm = document.getElementById('osTerm');
                if (osTerm) {
                    osTerm.classList.add('open');
                    osTerm.removeAttribute('inert');
                    window.TerminalApp?.boot();
                }
            }
        } catch (err) {
            console.error('Terminal failed to initialize:', err);
        }
    };

    // Register terminal and bind its launcher before loading optional apps.
    if (window.OS) {
        window.OS.register('terminal', 'osTerm', 'osTerm-win', {
            onOpen: async () => {
                try {
                    const terminal = await ensureTerminal();
                    terminal?.boot();
                } catch (err) {
                    console.error('Terminal failed to initialize:', err);
                }
            }
        });
    }

    if (hw) {
        hw.style.cursor = 'pointer';
        hw.addEventListener('click', openTerminal);
        hw.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.key === ' ') e.preventDefault();
                openTerminal();
            }
        });
    }

    if (!window.OS) return;

    window.OS.register('notes', 'notesWrap', 'notesWin', {
        onOpen: async () => {
            try {
                const notes = await ensureNotes();
                notes?.render();
            } catch (err) {
                console.error('Notes failed to initialize:', err);
            }
        }
    });

    let launcherPromise;
    const ensureGameLauncher = () => {
        if (!launcherPromise) {
            launcherPromise = import('./games/launcher.js?v=9.0')
                .then(({ GameLauncher }) => {
                    const launcher = new GameLauncher('appBody');
                    window.gameLauncherInstance = launcher;
                    launcher.render();
                    return launcher;
                })
                .catch((err) => {
                    launcherPromise = null;
                    throw err;
                });
        }
        return launcherPromise;
    };

    window.OS.register('games', 'appWrap', 'appWin', {
        onOpen: async (gameId) => {
            const appBody = document.getElementById('appBody');
            if (!window.gameLauncherInstance && appBody) {
                appBody.innerHTML = '<div class="app-loading" role="status">Loading Game Center...</div>';
            }

            try {
                await ensureOsStyles();
                const launcher = await ensureGameLauncher();
                if (gameId) {
                    launcher.launch(gameId);
                } else {
                    launcher.showMenu();
                }
            } catch (err) {
                console.error('Game launcher failed to initialize:', err);
                if (appBody) appBody.innerHTML = '<div class="app-loading" role="alert">Game Center could not load.</div>';
            }
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
