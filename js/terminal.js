
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

        this.init();
    }

    init() {
        if (!this.input) return;
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = this.input.value;
                this.input.value = '';
                this.run(val);
            }
        });

        // Focus input when clicking anywhere in terminal
        const termWin = document.getElementById('osTerm');
        if (termWin) {
            termWin.addEventListener('click', (e) => {
                // Don't focus if selecting text
                if (window.getSelection().toString()) return;
                this.input.focus();
            });
        }
    }

    boot() {
        if (this.printing) return;
        this.clear();
        const now = new Date();
        const stamp = now.toLocaleString();

        this.typeLine('Last login: ' + stamp + ' on ttys001', 'os-dim', 70)
            .then(() => this.sleep(120))
            .then(() => this.typeLine('Welcome to Soheil_OS v2.0. Modular & Optimized.', 'os-ok', 50))
            .then(() => this.sleep(100))
            .then(() => this.typeLine("Type 'help' to see available commands.", 'os-dim', 50))
            .then(() => this.addLine('', ''));
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
                await this.cmdThesis();
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
            case 'notes':
                if (window.OS) window.OS.open('notes');
                await this.typeLine('Launching Notes App...', 'os-dim');
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
                    } else {
                        await this.typeLine(`Game not found: ${gameName}`, 'os-bad');
                        await this.typeLine('Available: snake, blackjack', 'os-dim');
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

    // Commands implementation
    async cmdHelp() {
        const speed = 40;
        await this.typeLine('Available commands:', 'os-dim', speed);
        await this.typeLine('- bio: Personal introduction', 'os-dim', speed);
        await this.typeLine('- thesis: Research topic', 'os-dim', speed);
        await this.typeLine('- skills: Technical stack', 'os-dim', speed);
        await this.typeLine('- contact: Contact links', 'os-dim', speed);
        await this.typeLine('- resume: Open resume link', 'os-dim', speed);
        await this.typeLine('- notes: Open Notes App', 'os-dim', speed);
        await this.typeLine('- play: Games', 'os-dim', speed);
        await this.typeLine('  -- snake', 'os-dim', speed);
        await this.typeLine('  -- black jack', 'os-dim', speed);
        await this.typeLine('- clear: Wipe console', 'os-dim', speed);
        await this.typeLine('- exit: Close terminal', 'os-dim', speed);
    }

    async cmdBio() {
        await this.typeLine('Bio', 'os-warn');
        await this.typeLine('Environmental Engineering. Solid Waste Management. LCA and emissions modeling.', 'os-dim');
        await this.typeLine('I build workflows that turn complex data into decisions.', 'os-dim');
    }

    async cmdThesis() {
        await this.typeLine('Thesis', 'os-warn');
        await this.typeLine(this.THESIS, 'os-dim', 40);
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

    async typeLine(text, cls, cps = 60) {
        const line = this.addLine('', cls);
        const s = String(text || '');
        const delay = Math.round(1000 / cps);

        for (let i = 0; i < s.length; i++) {
            line.textContent += s[i];
            if (i % 3 === 0) this.out.scrollTop = this.out.scrollHeight;
            await this.sleep(delay);
        }
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

// Instantiate and attach to window for access
window.TerminalApp = new Terminal();
