
class Terminal {
    constructor() {
        this.out = document.getElementById('osTermOut');
        this.input = document.getElementById('osTermInput');
        this.promptEl = document.getElementById('osPrompt');
        this.printing = false;
        this.cwd = '~';

        this.CONTACTS = {
            email: 'soheil.aghayani@ut.ac.ir',
            phone: '+989120543587',
            linkedin: 'https://linkedin.com/in/AgSeyl',
            telegram: 'https://t.me/AgSeyl',
            resume: 'https://drive.google.com/file/d/1GZ7ax2uNbPelLVPA_eVCbk2uX2dVmjXw/view?usp=sharing'
        };

        this.THESIS = 'Biofuel Production from Waste Cooking Oil through Transesterification Process in the Presence of a Catalyst Synthesized from Waste Seashells';

        // Load command history
        this.history = JSON.parse(localStorage.getItem('term_history') || '[]');
        this.historyIndex = this.history.length;

        this.init();
    }

    init() {
        if (!this.input) return;
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = this.input.value;
                this.input.value = '';
                
                if (val.trim()) {
                    this.history.push(val);
                    if (this.history.length > 50) this.history.shift(); // Limit history size
                    localStorage.setItem('term_history', JSON.stringify(this.history));
                }
                this.historyIndex = this.history.length;
                this.run(val);
            }

            // Command History Navigation
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.history.length === 0) return;
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex];
                }
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            }

            // Tab Autocomplete
            if (e.key === 'Tab') {
                e.preventDefault();
                this.handleAutocomplete();
            }
        });

        // Focus input when clicking anywhere in terminal
        const termWin = document.getElementById('osTerm');
        if (termWin) {
            termWin.addEventListener('click', (e) => {
                if (window.getSelection().toString()) return;
                this.input.focus();
            });
        }
    }

    handleAutocomplete() {
        const val = this.input.value.trim().toLowerCase();
        if (!val) return;

        const commands = ['help', 'bio', 'thesis', 'skills', 'contact', 'resume', 'notes', 'play', 'clear', 'exit', 'matrix', '2048', 'minesweeper', 'breakout', 'invaders', 'shooter'];
        const matches = commands.filter(c => c.startsWith(val));

        if (matches.length === 1) {
            this.input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            // Display matching options in terminal
            this.addLine(`${this.getPrompt()} ${this.input.value}`, 'os-dim');
            this.addLine(matches.join('   '), 'os-dim');
            this.out.scrollTop = this.out.scrollHeight;
        }
    }

    async boot() {
        if (this.printing) return;
        this.printing = true;
        this.clear();

        // Check if already booted in this session to prevent repetitive BIOS animations
        const alreadyBooted = sessionStorage.getItem('term_booted');
        if (alreadyBooted) {
            const now = new Date();
            const stamp = now.toLocaleString();
            await this.typeLine('Last login: ' + stamp + ' on ttys001', 'os-dim', 200);
            await this.typeLine('Welcome back to Soheil_OS v2.0.', 'os-ok', 150);
            await this.typeLine("Type 'help' to see available commands.", 'os-dim', 150);
            this.addLine('', '');
            this.printing = false;
            this.out.scrollTop = this.out.scrollHeight;
            return;
        }

        sessionStorage.setItem('term_booted', 'true');

        const speed = 250;
        await this.typeLine('AMIBIOS (C) 2026 American Megatrends, Inc.', 'os-dim', speed);
        await this.typeLine('BIOS Date: 07/02/26 Ver: 08.00.12', 'os-dim', speed);
        await this.typeLine('CPU: AMD Ryzen 9 @ 4.80 GHz', 'os-dim', speed);
        await this.typeLine('Speed: 4800 MHz', 'os-dim', speed);
        await this.sleep(120);
        
        await this.typeLine('Checking RAM ... OK (65536MB)', 'os-dim', speed);
        await this.sleep(100);
        
        await this.typeLine('Detecting Storage Devices ...', 'os-dim', speed);
        await this.sleep(80);
        await this.typeLine('  SATA Port 0: NVMe SSD 2TB - OK', 'os-dim', speed);
        await this.typeLine('  SATA Port 1: HDD 4TB - OK', 'os-dim', speed);
        await this.sleep(100);

        await this.typeLine('Initializing OS Kernel ...', 'os-ok', speed);
        await this.sleep(80);
        await this.typeLine('Loading network drivers ...', 'os-ok', speed);
        await this.sleep(60);
        await this.typeLine('Connecting to guest@soheil-os ... SUCCESS', 'os-ok', speed);
        await this.sleep(250);
        
        this.clear();
        const now = new Date();
        const stamp = now.toLocaleString();
        await this.typeLine('Last login: ' + stamp + ' on ttys001', 'os-dim', 200);
        await this.typeLine('Welcome to Soheil_OS v2.0. Modular & Optimized.', 'os-ok', 150);
        await this.typeLine("Type 'help' to see available commands.", 'os-dim', 150);
        this.addLine('', '');

        this.printing = false;
        this.out.scrollTop = this.out.scrollHeight;
    }

    async run(raw) {
        const cmdRaw = String(raw || '').trim();
        if (!cmdRaw) return;

        this.addLine(`${this.getPrompt()} ${cmdRaw}`, 'os-dim');

        if (this.printing) return;
        this.printing = true;

        const parts = cmdRaw.split(/\s+/);
        const main = (parts[0] || '').toLowerCase();
        const args = parts.slice(1);

        switch (main) {
            case 'help':
            case '?':
                await this.cmdHelp();
                break;
            case 'bio':
                await this.cmdBio();
                break;
            case 'thesis':
                await this.cmdThesis(args);
                break;
            case 'skills':
                await this.cmdSkills();
                break;
            case 'contact':
                await this.cmdContact();
                break;
            case 'resume':
                window.open(this.CONTACTS.resume, '_blank');
                await this.typeLine('Opening resume...', 'os-ok');
                break;
            case 'clear':
            case 'cls':
                this.clear();
                break;
            case 'exit':
            case 'quit':
                if (window.OS) window.OS.close('terminal');
                break;
            case 'matrix':
                await this.cmdMatrix();
                break;
            case 'snake':
                if (window.OS) window.OS.open('games', 'snake');
                await this.typeLine('Launching Snake...', 'os-ok');
                break;
            case 'blackjack':
            case 'bj':
                if (window.OS) window.OS.open('games', 'blackjack');
                await this.typeLine('Launching Blackjack...', 'os-ok');
                break;
            case 'tetris':
                if (window.OS) window.OS.open('games', 'tetris');
                await this.typeLine('Launching Tetris...', 'os-ok');
                break;
            case '2048':
                if (window.OS) window.OS.open('games', 'g2048');
                await this.typeLine('Launching 2048...', 'os-ok');
                break;
            case 'minesweeper':
            case 'ms':
                if (window.OS) window.OS.open('games', 'minesweeper');
                await this.typeLine('Launching Minesweeper...', 'os-ok');
                break;
            case 'breakout':
                if (window.OS) window.OS.open('games', 'breakout');
                await this.typeLine('Launching Breakout...', 'os-ok');
                break;
            case 'invaders':
            case 'shooter':
                if (window.OS) window.OS.open('games', 'invaders');
                await this.typeLine('Launching Space Shooter...', 'os-ok');
                break;
            case 'notes':
                await this.cmdNotes(args);
                break;
            case 'play':
            case 'games':
                if (args.length > 0) {
                    const gameName = args[0].toLowerCase();
                    if (gameName === 'snake') {
                        if (window.OS) window.OS.open('games', 'snake');
                        await this.typeLine('Launching Snake...', 'os-dim');
                    } else if (gameName === 'blackjack' || gameName === 'bj') {
                        if (window.OS) window.OS.open('games', 'blackjack');
                        await this.typeLine('Launching Blackjack...', 'os-dim');
                    } else if (gameName === 'tetris') {
                        if (window.OS) window.OS.open('games', 'tetris');
                        await this.typeLine('Launching Tetris...', 'os-dim');
                    } else if (gameName === '2048') {
                        if (window.OS) window.OS.open('games', 'g2048');
                        await this.typeLine('Launching 2048...', 'os-dim');
                    } else if (gameName === 'minesweeper' || gameName === 'ms') {
                        if (window.OS) window.OS.open('games', 'minesweeper');
                        await this.typeLine('Launching Minesweeper...', 'os-dim');
                    } else if (gameName === 'breakout') {
                        if (window.OS) window.OS.open('games', 'breakout');
                        await this.typeLine('Launching Breakout...', 'os-dim');
                    } else if (gameName === 'invaders' || gameName === 'shooter' || gameName === 'space') {
                        if (window.OS) window.OS.open('games', 'invaders');
                        await this.typeLine('Launching Space Shooter...', 'os-dim');
                    } else {
                        await this.typeLine(`Game not found: ${gameName}`, 'os-bad');
                        await this.typeLine('Available: snake, blackjack, tetris, 2048, minesweeper, breakout, shooter', 'os-dim');
                    }
                } else {
                    if (window.OS) window.OS.open('games');
                    await this.typeLine('Launching Game Center...', 'os-dim');
                }
                break;
            case 'cd':
                await this.cmdCd(args);
                break;
            default:
                await this.typeLine(`command not found: ${main}`, 'os-bad');
        }

        this.printing = false;
        // Scroll to bottom
        this.out.scrollTop = this.out.scrollHeight;
    }

    async cmdMatrix() {
        await this.typeLine('Loading Matrix Digital Rain... Press "ESC" or "Q" to exit.', 'os-ok');
        await this.sleep(400);

        this.out.style.overflow = 'hidden';

        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '46px';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = 'calc(100% - 46px)';
        canvas.style.background = '#000';
        canvas.style.zIndex = '90';
        this.out.parentElement.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight - 46;
        };
        resize();
        window.addEventListener('resize', resize);

        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ';
        const fontSize = 12;
        let columns = Math.floor(canvas.width / fontSize);
        let drops = Array(columns).fill(1);

        let animId;
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0f0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const txt = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(txt, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animId = requestAnimationFrame(draw);
        };
        
        draw();

        const exitMatrix = () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
            document.removeEventListener('keydown', keyHandler);
            canvas.remove();
            this.out.style.overflow = 'auto';
            this.addLine('Matrix session closed.', 'os-ok');
            this.input.focus();
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
                exitMatrix();
            }
        };

        document.addEventListener('keydown', keyHandler);
        canvas.addEventListener('click', exitMatrix);
        canvas.addEventListener('touchstart', exitMatrix);
    }

    async cmdHelp() {
        const speed = 100;
        await this.typeLine('Available commands:', 'os-dim', speed);
        await this.typeLine('- bio: Personal introduction', 'os-dim', speed);
        await this.typeLine('- thesis: Research topic', 'os-dim', speed);
        await this.typeLine('- skills: Technical stack', 'os-dim', speed);
        await this.typeLine('- contact: Contact links', 'os-dim', speed);
        await this.typeLine('- resume: Open resume link', 'os-dim', speed);
        await this.typeLine('- notes: Open Notes App', 'os-dim', speed);
        await this.typeLine('- play: Games', 'os-dim', speed);
        await this.typeLine('- matrix: Falling digital rain', 'os-dim', speed);
        await this.typeLine('- clear: Wipe console', 'os-dim', speed);
        await this.typeLine('- exit: Close terminal', 'os-dim', speed);
    }

    async cmdBio() {
        await this.typeLine('Bio', 'os-warn');
        await this.typeLine('Environmental Engineering. Solid Waste Management. LCA and emissions modeling.', 'os-dim');
        await this.typeLine('I build workflows that turn complex data into decisions.', 'os-dim');
    }

    async cmdThesis(args) {
        const sub = (args[0] || '').trim().toLowerCase();

        if (sub === 'flowchart' || sub === 'fc') {
            const viewer = document.getElementById('flowchartViewer');
            const btn = document.getElementById('toggleFlowchartBtn');
            if (viewer && btn) {
                if (viewer.style.display === 'none') {
                    btn.click();
                }
                viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.typeLine('Opening secure flowchart viewer on the page...', 'os-ok');
            } else {
                await this.typeLine('Flowchart viewer not found on page.', 'os-bad');
            }
            return;
        }

        await this.typeLine('Thesis', 'os-warn');
        await this.typeLine('My research focuses on circular economy solutions for green energy: synthesizing high-activity Calcium Oxide (CaO) catalysts from waste seashells to convert Waste Cooking Oil (WCO) into high-quality biodiesel.', 'os-dim');
        this.addLine('', '');
        
        await this.typeLine('Optimal reaction parameters (9:1 methanol ratio, 3 wt.% catalyst loading, 65°C for 3 hours) yielded a 95.7% conversion rate, complying with ASTM D6751 standards. The Life Cycle Assessment (LCA) indicates up to an 86% reduction in greenhouse gas emissions compared to petroleum diesel.', 'os-dim');
        this.addLine('', '');
        
        await this.typeLine('To view the detailed process flowchart, type "thesis flowchart".', 'os-warn');
    }

    async cmdSkills() {
        await this.typeLine('Skills', 'os-warn');
        await this.typeLine('SimaPro, LandGEM, Python, ChemDraw, OpenLCA, LCA workflows.', 'os-dim');
    }

    async cmdContact() {
        await this.typeLine('Contacts', 'os-warn');
        await this.typeLine(`Email: ${this.CONTACTS.email}`, 'os-dim');
        await this.typeLine(`Phone: ${this.CONTACTS.phone}`, 'os-dim');
        await this.typeLine(`LinkedIn: ${this.CONTACTS.linkedin}`, 'os-dim');
        await this.typeLine(`Telegram: ${this.CONTACTS.telegram}`, 'os-dim');
    }

    async cmdCd(args) {
        const path = args[0] || '~';
        if (path === 'notes') {
            if (window.OS) window.OS.open('notes');
            return;
        }
        if (path === 'games') {
            if (window.OS) window.OS.open('games');
            return;
        }
        if (path === '~' || path === '/' || path === 'home') {
            this.cwd = '~';
        } else {
            await this.typeLine(`cd: no such directory: ${path}`, 'os-bad');
            return;
        }
        this.updatePrompt();
    }

    safeUrl(u) {
        const s = String(u || '').trim();
        if (!s) return '';
        if (s.startsWith('http://') || s.startsWith('https://')) return s;
        if (s.startsWith('mailto:') || s.startsWith('tel:')) return s;
        return '';
    }

    async cmdNotes(args) {
        const sub = (args[0] || '').toLowerCase();

        if (!window.NotesApp) {
            await this.typeLine('Notes system not initialized.', 'os-bad');
            return;
        }

        if (!sub) {
            if (window.OS) window.OS.open('notes');
            await this.typeLine('Notes opened. Use "notes export" to publish.', 'os-dim');
            return;
        }

        if (sub === 'help') {
            await this.typeLine('Notes commands:', 'os-dim');
            await this.typeLine('- notes: Open notes app', 'os-dim');
            await this.typeLine('- notes list: List notes in terminal', 'os-dim');
            await this.typeLine('- notes export: Copy local notes as JSON', 'os-dim');
            await this.typeLine('- notes add: Create a local note (admin required)', 'os-dim');
            await this.typeLine('- notes clear: Clear all local notes (admin required)', 'os-dim');
            return;
        }

        if (sub === 'list' || sub === 'ls') {
            const list = [];
            const notesPublic = window.NotesApp.notesPublic || [];
            const notesLocal = window.NotesApp.notesLocal || [];
            
            for (const n of notesPublic) list.push({ ...n, _src: 'public' });
            for (const n of notesLocal) list.push({ ...n, _src: 'local' });
            list.sort((a, b) => (b.ts || 0) - (a.ts || 0));

            if (list.length === 0) {
                await this.typeLine('No notes found.', 'os-warn');
                return;
            }

            let i = 1;
            for (const n of list.slice(0, 25)) {
                const u = this.safeUrl(n.link);
                const name = String(n.name || 'Untitled');
                const tag = n._src === 'public' ? 'public' : 'local';
                await this.typeLine(`[${i}] ${name} (${tag})${u ? ' - ' + u : ''}`, 'os-dim', 80);
                i += 1;
            }
            if (list.length > 25) {
                await this.typeLine('... more notes exist', 'os-dim');
            }
            return;
        }

        if (sub === 'export') {
            const notesLocal = window.NotesApp.notesLocal || [];
            const payload = notesLocal.map(n => ({
                id: n.id,
                name: String(n.name || ''),
                desc: String(n.desc || ''),
                link: String(n.link || ''),
                ts: n.ts || Date.now()
            }));

            const jsonText = JSON.stringify(payload, null, 2);
            await this.typeLine('Exported local notes JSON. Paste into notes.json in your repo root.', 'os-ok');

            // Print preview
            const preview = jsonText.split('\n').slice(0, 25);
            for (const line of preview) {
                this.addLine(line, 'os-dim');
            }
            if (jsonText.split('\n').length > 25) {
                this.addLine('... (truncated)', 'os-dim');
            }

            try {
                await navigator.clipboard.writeText(jsonText);
                await this.typeLine('Copied full JSON to clipboard successfully.', 'os-ok');
            } catch (err) {
                await this.typeLine('Clipboard copy failed. Copy preview text manually.', 'os-warn');
            }
            return;
        }

        if (sub === 'add') {
            if (window.OS) window.OS.open('notes');
            if (!window.NotesApp.isAuthed()) {
                window.NotesApp.openAuth();
            } else {
                window.NotesApp.openEditor();
            }
            return;
        }

        if (sub === 'clear') {
            if (!window.NotesApp.isAuthed()) {
                await this.typeLine('Admin credentials required. Open Notes UI and login first.', 'os-warn');
                return;
            }
            window.NotesApp.writeLocalNotes([]);
            await this.typeLine('Local notes cleared.', 'os-ok');
            return;
        }

        await this.typeLine('Unknown notes command. Try "notes help".', 'os-warn');
    }

    // Utilities
    getPrompt() {
        return `soheil@macbook:${this.cwd}$`;
    }

    updatePrompt() {
        if (this.promptEl) this.promptEl.textContent = this.getPrompt();
    }

    clear() {
        if (this.out) this.out.innerHTML = '';
    }

    addLine(text, cls) {
        const div = document.createElement('div');
        div.className = 'os-line' + (cls ? ' ' + cls : '');
        div.textContent = text;
        this.out.appendChild(div);
        this.out.scrollTop = this.out.scrollHeight;
        return div;
    }

    async typeLine(text, cls, cps = 95) {
        const line = this.addLine(text, cls);
        this.out.scrollTop = this.out.scrollHeight;
        
        // Print lines rapidly with a tiny sequential delay (e.g. 5-15ms)
        const delay = Math.max(5, Math.round(300 / cps));
        await this.sleep(delay);
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

// Instantiate and attach to window for access
window.TerminalApp = new Terminal();
