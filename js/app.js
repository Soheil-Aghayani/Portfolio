
import { GameLauncher } from './games/launcher.js';

document.addEventListener('DOMContentLoaded', () => {
    // Register Terminal
    // We assume OS and TerminalApp are loaded globally via <script>
    if (window.OS) {
        window.OS.register('terminal', 'osTerm', 'osTerm', {
            onOpen: () => {
                if (window.TerminalApp) window.TerminalApp.boot();
            }
        });

        // Register Notes
        // Notes UI logic is in js/notes.js which attaches to window.NotesApp (if we use that pattern)
        // But OS.register mainly handles the Window DOM elements.
        window.OS.register('notes', 'notesWrap', 'notesWin', {
            onOpen: () => {
                if (window.NotesApp) window.NotesApp.render();
            }
        });

        // Register Game Center
        // We need to initialize the launcher
        const launcher = new GameLauncher('appWin'); // We will create this ID in HTML
        launcher.render();

        window.OS.register('games', 'appWrap', 'appWin', {
            onOpen: () => {
                launcher.showMenu();
            }
        });
    }

    // Hello World Trigger
    const hw = document.getElementById('helloWorld');
    if (hw) {
        hw.addEventListener('click', () => {
            if (window.OS) window.OS.open('terminal');
        });
        hw.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (window.OS) window.OS.open('terminal');
            }
        });
    }
});
