
document.addEventListener('DOMContentLoaded', () => {
    const hw = document.getElementById('helloWorld');
    const openTerminal = () => {
        if (window.OS) window.OS.open('terminal');
    };

    // Register terminal and bind its launcher before loading optional apps.
    if (window.OS) {
        window.OS.register('terminal', 'osTerm', 'osTerm-win', {
            onOpen: () => {
                if (window.TerminalApp) window.TerminalApp.boot();
            }
        });
    }

    if (hw) {
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
        onOpen: () => {
            if (window.NotesApp) window.NotesApp.render();
        }
    });

    import('./games/launcher.js?v=2.2')
        .then(({ GameLauncher }) => {
            const launcher = new GameLauncher('appBody');
            launcher.render();

            window.OS.register('games', 'appWrap', 'appWin', {
                onOpen: (gameId) => {
                    if (gameId) {
                        launcher.launch(gameId);
                    } else {
                        launcher.showMenu();
                    }
                }
            });
        })
        .catch((err) => {
            console.error('Game launcher failed to initialize:', err);
        });
});
