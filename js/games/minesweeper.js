const localIcon = (name, options = {}) => window.IconRegistry ? window.IconRegistry.svg(name, options) : '';
const SMILEY_SVG_HAPPY = localIcon('games/minesweeper/smiley-happy', { className: 'ms-state-icon' });
const SMILEY_SVG_WIN   = localIcon('games/minesweeper/smiley-win', { className: 'ms-state-icon' });
const SMILEY_SVG_LOSE  = localIcon('games/minesweeper/smiley-lose', { className: 'ms-state-icon ms-state-icon-lose' });
const FLAG_SVG = localIcon('games/minesweeper/flag-filled', { className: 'ms-cell-icon ms-flag-icon' });
const MINE_SVG = localIcon('games/minesweeper/bomb-bold', { className: 'ms-cell-icon ms-mine-icon' });

const MODES = [
    { id: 'zen',        icon: 'states/compass', name: 'ZEN',      sub: 'PLAYLIST',  desc: 'Relaxed sweep, no time pressure.',     hasDiff: true  },
    { id: 'time-trial', icon: 'ui/time', name: 'TIME',     sub: 'TRIAL',     desc: 'Race the clock! Hacks off on Hard.',   hasDiff: true  },
    { id: 'endless',    icon: 'games/minesweeper/pixel-map-pin', name: 'ENDLESS',  sub: 'DRIFT',     desc: 'Infinite sector drift! Clear safe tiles to expand.', hasDiff: false }
];

export class MinesweeperGame {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;

        this.rows = 10; this.cols = 10; this.mineCount = 15;
        this.mode = 'zen'; this.difficulty = 'easy'; this.timeLimit = 0;
        this.score = 0;

        this.grid = [];
        this.gameOverState = false;
        this.won = false;
        this.firstClick = true;
        this.isPaused = false;

        // Mobile tap tool: 'dig' vs 'flag'
        this.inputTool = 'dig';

        this.panX = 0; this.panY = 0; this.scale = 1;
        this.minesRemaining = this.mineCount;
        this.time = 0; this.timer = null;

        this.initialShield = true; this.initialPing = 1;
        this.shieldActive = true; this.pingCharges = 1;
        this.lastMilestone = 0;

        // Carousel state
        this._carouselIndex = 0;

        // Pan & gesture state
        this._panActive = false;
        this._onPanMove = null;
        this._onPanUp = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.initUI();
    }

    // ─────────────────────────── UI INIT ───────────────────────────
    initUI() {
        Object.assign(this.container.style, {
            display: 'flex', flexDirection: 'column',
            alignItems: 'stretch', overflow: 'hidden',
            flex: '1', minHeight: '0', width: '100%', height: '100%'
        });

        this.container.innerHTML = `
            <div class="ms-root" id="msRoot"></div>
            <div class="ms-modal" id="msTutorialModal">
                <div class="ms-modal-content">
                    <div class="ms-modal-header">
                        <div class="ms-modal-title">${localIcon('games/minesweeper/pickaxe', { className: 'ms-inline-icon' })} MINER's MANUAL</div>
                        <button class="ms-modal-close-btn" id="msModalCloseBtn" type="button">&times;</button>
                    </div>
                    <div class="ms-modal-body">
                        <div style="width:90px;height:90px;border-radius:10px;border:2px solid var(--primary);overflow:hidden;flex-shrink:0;background:#fff;margin:0 auto 10px;">
                            <img id="msModalMinerImg" src="${this.getMinerImgSrc('tutorial_1')}" alt="Miner" style="width:100%;height:100%;object-fit:contain;">
                        </div>
                        <div class="ms-modal-text" id="msModalText" style="color:#e2e8f0;font-size:0.85rem;line-height:1.4;margin-bottom:12px;"></div>
                        <div class="ms-modal-nav" style="display:flex;justify-content:space-between;gap:8px;">
                            <button class="ms-btn" id="msModalPrevBtn" type="button" style="padding:6px 12px;font-size:0.75rem;">${localIcon('games/shared/arrow-left', { className: 'ms-inline-icon' })} PREV</button>
                            <span style="color:var(--text-muted);font-size:0.8rem;font-family:monospace;align-self:center;" id="msModalProgress">1/6</span>
                            <button class="ms-btn" id="msModalNextBtn" type="button" style="padding:6px 12px;font-size:0.75rem;">NEXT ${localIcon('games/shared/arrow-right', { className: 'ms-inline-icon' })}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.root = this.container.querySelector('#msRoot');
        const closeBtn = this.container.querySelector('#msModalCloseBtn');
        const modal    = this.container.querySelector('#msTutorialModal');
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');

        this.showStartMenu();
    }

    // ─────────────────────────── LOBBY ───────────────────────────
    showStartMenu() {
        this._cleanPanListeners();
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this._panActive = false;
        window.removeEventListener('keydown', this.handleKeyDown);

        this.root.innerHTML = `
            <div class="ms-menu-screen">
                <div class="ms-menu-header">
                    <div class="ms-mascot-thumb">
                        <img src="${this.getMinerImgSrc('tutorial_1')}" alt="Miner">
                    </div>
                    <div>
                        <div class="ms-menu-title">CYBER DECK MINES</div>
                        <div class="ms-menu-sub">Select a mode to begin sweeping</div>
                    </div>
                </div>

                <div class="ms-carousel">
                    <button class="ms-carousel-arrow" id="msPrev" type="button" aria-label="Previous mode">&#9664;</button>
                    <div class="ms-carousel-track" id="msCarouselTrack"></div>
                    <button class="ms-carousel-arrow" id="msNext" type="button" aria-label="Next mode">&#9654;</button>
                </div>

                <div class="ms-carousel-dots" id="msCarouselDots">
                    ${MODES.map((_, i) => `<span class="ms-dot${i === this._carouselIndex ? ' active' : ''}"></span>`).join('')}
                </div>

                <div class="ms-menu-actions">
                    <button class="ms-btn ms-start-btn" id="msStartBtn" type="button">${localIcon('games/shared/play', { className: 'ms-inline-icon' })} START SWEEP</button>
                    <button class="ms-btn ms-manual-btn" id="msManualBtn" type="button" title="How to Play">${localIcon('states/info', { className: 'ms-inline-icon' })}</button>
                </div>
            </div>
        `;

        const track  = this.root.querySelector('#msCarouselTrack');
        const dotsEl = this.root.querySelector('#msCarouselDots');

        const renderCard = (dir = 0) => {
            const idx = this._carouselIndex;
            const m   = MODES[idx];
            this.mode = m.id;

            const animClass = dir >= 0 ? 'ms-slide-right' : 'ms-slide-left';
            track.innerHTML = `
                <div class="ms-mode-card ${animClass}">
                    <div class="ms-mode-icon">${localIcon(m.icon, { className: 'ms-mode-svg' })}</div>
                    <div class="ms-mode-name">${m.name} <span class="ms-mode-sub-label">${m.sub}</span></div>
                    <div class="ms-mode-desc">${m.desc}</div>
                    ${m.hasDiff ? `
                    <div class="ms-diff-row">
                        <button class="ms-icon-diff ms-diff-easy ${this.difficulty==='easy'   ? 'selected':''}" data-diff="easy"   type="button" title="Easy"><span class="ms-difficulty-dot"></span></button>
                        <button class="ms-icon-diff ms-diff-medium ${this.difficulty==='medium' ? 'selected':''}" data-diff="medium" type="button" title="Medium"><span class="ms-difficulty-dot"></span></button>
                        <button class="ms-icon-diff ms-diff-hard ${this.difficulty==='hard'   ? 'selected':''}" data-diff="hard"   type="button" title="Hard"><span class="ms-difficulty-dot"></span></button>
                    </div>
                    ` : `<div class="ms-mode-badge">${localIcon('games/minesweeper/pixel-map-pin-with-dot', { className: 'ms-inline-icon' })} INFINITE SECTOR DRIFT</div>`}
                </div>
            `;

            dotsEl.querySelectorAll('.ms-dot').forEach((d, i) => d.classList.toggle('active', i === idx));

            if (m.hasDiff) {
                track.querySelectorAll('.ms-icon-diff').forEach(btn => {
                    btn.onclick = e => { e.stopPropagation(); this.difficulty = btn.dataset.diff; renderCard(0); };
                });
            }
        };

        const navigate = dir => {
            this._carouselIndex = (this._carouselIndex + dir + MODES.length) % MODES.length;
            renderCard(dir);
        };

        renderCard(1);

        this.root.querySelector('#msPrev').onclick = () => navigate(-1);
        this.root.querySelector('#msNext').onclick = () => navigate(1);

        let swipeX = 0;
        track.addEventListener('pointerdown', e => { swipeX = e.clientX; });
        track.addEventListener('pointerup',   e => {
            const d = e.clientX - swipeX;
            if (Math.abs(d) > 40) navigate(d < 0 ? 1 : -1);
        });

        this.root.querySelector('#msStartBtn').onclick  = () => this.setupGameParamsAndStart();
        this.root.querySelector('#msManualBtn').onclick = () => this.showTutorialModal();
    }

    // ─────────────────────────── GAME SETUP ───────────────────────────
    setupGameParamsAndStart() {
        if (this.mode === 'zen') {
            this.rows = 10; this.cols = 10;
            this.mineCount = this.difficulty === 'easy' ? 10 : this.difficulty === 'medium' ? 15 : 20;
            this.initialShield = true; this.initialPing = 1;
        } else if (this.mode === 'time-trial') {
            this.rows = 10; this.cols = 10;
            if (this.difficulty === 'easy')         { this.mineCount = 15; this.timeLimit = 120; this.initialShield = true;  this.initialPing = 1; }
            else if (this.difficulty === 'medium')  { this.mineCount = 15; this.timeLimit = 90;  this.initialShield = true;  this.initialPing = 1; }
            else                                    { this.mineCount = 20; this.timeLimit = 90;  this.initialShield = false; this.initialPing = 0; }
        } else {
            // Endless mode starts at 12x12
            this.rows = 12; this.cols = 12; this.mineCount = 18;
            this.initialShield = true; this.initialPing = 1; this.score = 0; this.lastMilestone = 0;
        }
        this.renderGameLayout();
        this.start();
    }

    // ─────────────────────────── GAME LAYOUT ───────────────────────────
    renderGameLayout() {
        const endless = this.mode === 'endless';

        this.root.innerHTML = `
            <!-- ── Centered HUD: Mines | Smiley | Time | Dig/Flag Toggle ── -->
            <div class="ms-hud-bar">
                <div class="ms-counter-box">
                    <div class="ms-counter-label">${endless ? 'SCORE' : 'MINES'}</div>
                    <div id="msMinesCount" class="ms-counter-val">0</div>
                </div>
                <button class="ms-smiley state-happy" id="msSmileyBtn" type="button" title="Reset Game">${SMILEY_SVG_HAPPY}</button>
                <div class="ms-counter-box">
                    <div class="ms-counter-label">${endless ? 'DEPTH' : 'TIME'}</div>
                    <div id="msTimer" class="ms-counter-val">000</div>
                </div>
                <!-- Tap Input Mode Switch (Dig vs Flag) -->
                <button class="ms-tool-toggle-btn active-dig" id="msToolToggleBtn" type="button" title="Toggle Dig / Flag Mode">
                    <span class="ms-tool-icon" id="msToolIcon">${localIcon('games/minesweeper/pickaxe', { className: 'ms-inline-icon' })}</span>
                    <span class="ms-tool-label" id="msToolLabel">DIG</span>
                </button>
            </div>

            <!-- ── Hacks row ── -->
            <div class="ms-hacks-bar">
                <button class="ms-hack-btn disabled" id="msHackShield" type="button" title="Shield absorbs 1 mine hit">${localIcon('states/security-check', { className: 'ms-inline-icon' })} SHIELD</button>
                <button class="ms-hack-btn disabled" id="msHackPing"   type="button" title="Reveal one safe cell">${localIcon('games/minesweeper/radar-light', { className: 'ms-inline-icon' })} PING</button>
            </div>

            <!-- ── Viewport (fills remaining space) ── -->
            <div class="ms-viewport" id="msViewport">
                <!-- Floating back-to-menu pill -->
                <button class="ms-float-btn" id="msFloatMenuBtn" type="button" title="Back to mode select">${localIcon('games/shared/arrow-left', { className: 'ms-inline-icon' })} MENU</button>

                <!-- Milestone Toast Popup -->
                <div class="ms-toast-banner" id="msToastBanner"></div>

                <!-- Game board (GPU pan/zoom layer) -->
                <div class="ms-board" id="msBoard" role="grid" aria-label="Minesweeper Board"></div>

                <!-- Zoom HUD -->
                <div class="ms-zoom-hud">
                    <button class="ms-zoom-btn" id="msZoomOut"  type="button" title="Zoom Out">${localIcon('games/minesweeper/zoom-out-broken', { className: 'ms-inline-icon' })}</button>
                    <button class="ms-zoom-btn ms-zoom-fit" id="msZoomFit" type="button" title="Center & Fit Board">FIT</button>
                    <button class="ms-zoom-btn" id="msZoomIn"   type="button" title="Zoom In">${localIcon('games/minesweeper/zoom-in-broken', { className: 'ms-inline-icon' })}</button>
                </div>

                <!-- Game-over / pause overlay -->
                <div class="ms-overlay" id="msOverlay">
                    <div class="ms-overlay-title" id="msOverlayTitle">GAME OVER</div>
                    <div class="ms-overlay-msg"   id="msOverlayMsg">—</div>
                    <button class="ms-btn" id="msOverlayBtn" type="button">Play Again</button>
                    <button class="ms-btn" id="msOverlayMenuBtn" type="button"
                        style="margin-top:6px;background:#334155;box-shadow:none;font-size:0.78rem;padding:8px 18px;">${localIcon('games/shared/arrow-left', { className: 'ms-inline-icon' })} MENU</button>
                </div>
            </div>
        `;

        this.boardEl      = this.root.querySelector('#msBoard');
        this.viewportEl   = this.root.querySelector('#msViewport');
        this.smileyBtn    = this.root.querySelector('#msSmileyBtn');
        this.minesCountEl = this.root.querySelector('#msMinesCount');
        this.timerEl      = this.root.querySelector('#msTimer');

        this.smileyBtn.onclick = () => this.start();
        this.root.querySelector('#msFloatMenuBtn').onclick   = () => this.showStartMenu();
        this.root.querySelector('#msHackPing').onclick       = () => this.usePing();
        this.root.querySelector('#msOverlayBtn').onclick     = () => this.start();
        this.root.querySelector('#msOverlayMenuBtn').onclick = () => this.showStartMenu();

        // Wire Dig/Flag mode toggle button
        const toolBtn   = this.root.querySelector('#msToolToggleBtn');
        const toolIcon  = this.root.querySelector('#msToolIcon');
        const toolLabel = this.root.querySelector('#msToolLabel');

        toolBtn.onclick = () => {
            if (this.inputTool === 'dig') {
                this.inputTool = 'flag';
                toolBtn.className = 'ms-tool-toggle-btn active-flag';
                toolIcon.innerHTML = localIcon('games/minesweeper/flag-filled', { className: 'ms-inline-icon' });
                toolLabel.textContent = 'FLAG';
            } else {
                this.inputTool = 'dig';
                toolBtn.className = 'ms-tool-toggle-btn active-dig';
                toolIcon.innerHTML = localIcon('games/minesweeper/pickaxe', { className: 'ms-inline-icon' });
                toolLabel.textContent = 'DIG';
            }
        };

        this.setupViewportTransform();
    }

    // ─────────────────────────── GPU PAN / ZOOM & CENTERING ───────────────────────────
    setupViewportTransform() {
        const vp    = this.viewportEl;
        const board = this.boardEl;
        if (!vp || !board) return;

        this.panX = 0; this.panY = 0; this.scale = 1;
        this._panActive = false;

        // Uses translate(-50%, -50%) translate3d(panX, panY, 0) so board is DEAD CENTER when panX=0, panY=0!
        const applyTransform = () => {
            board.style.transform = `translate(-50%, -50%) translate3d(${this.panX}px,${this.panY}px,0) scale(${this.scale})`;
        };
        this.applyTransform = applyTransform;

        const autoFit = () => {
            const cW = vp.clientWidth  - 32;
            const cH = vp.clientHeight - 32;
            const cellPixel = 36; // 34px cell + 2px gap
            const bW = this.cols * cellPixel + 12;
            const bH = this.rows * cellPixel + 12;
            this.scale = Math.min(1.2, Math.max(0.35, Math.min(cW / bW, cH / bH)));
            this.panX = 0; this.panY = 0;
            applyTransform();
        };
        this.autoFitScale = autoFit;
        setTimeout(autoFit, 30);

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                if (this.boardEl && !this._panActive) applyTransform();
            });
            ro.observe(vp);
        }

        // ── Drag-threshold pan ──
        const THRESHOLD = 12;
        let dragging = false;
        let sx = 0, sy = 0, ipx = 0, ipy = 0, pid = null;
        let activePointers = new Map();

        const onDown = e => {
            if (e.target.closest('.ms-float-btn, .ms-zoom-hud, .ms-overlay')) return;
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.size === 1) {
                dragging = true;
                sx = e.clientX; sy = e.clientY;
                ipx = this.panX; ipy = this.panY;
                pid = e.pointerId;
                this._panActive = false;
            }
        };

        const onMove = e => {
            if (!dragging) return;
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.size === 2) {
                const pts = Array.from(activePointers.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                if (this._lastPinchDist) {
                    const delta = (dist - this._lastPinchDist) * 0.005;
                    this.scale = Math.min(2.5, Math.max(0.3, this.scale + delta));
                    applyTransform();
                }
                this._lastPinchDist = dist;
                this._panActive = true;
                return;
            }

            if (e.pointerId !== pid) return;
            const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
            if (dist > THRESHOLD) {
                this._panActive = true;
                vp.style.cursor = 'grabbing';
                this.panX = ipx + (e.clientX - sx);
                this.panY = ipy + (e.clientY - sy);
                applyTransform();
            }
        };

        const onUp = e => {
            activePointers.delete(e.pointerId);
            if (activePointers.size < 2) this._lastPinchDist = null;

            if (e.pointerId === pid) {
                dragging = false;
                pid = null;
                vp.style.cursor = 'grab';
                if (this._panActive) {
                    setTimeout(() => { this._panActive = false; }, 80);
                }
            }
        };

        this._onPanMove = onMove;
        this._onPanUp   = onUp;

        vp.addEventListener('pointerdown', onDown, true);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup',   onUp);
        window.addEventListener('pointercancel', onUp);

        vp.addEventListener('click', e => {
            if (this._panActive) { e.stopPropagation(); e.preventDefault(); }
        }, true);

        vp.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.12 : -0.12;
            this.scale = Math.min(2.5, Math.max(0.3, this.scale + delta));
            applyTransform();
        }, { passive: false });

        this.root.querySelector('#msZoomIn') .onclick = () => { this.scale = Math.min(2.5, this.scale + 0.2); applyTransform(); };
        this.root.querySelector('#msZoomOut').onclick = () => { this.scale = Math.max(0.3, this.scale - 0.2); applyTransform(); };
        this.root.querySelector('#msZoomFit').onclick = () => autoFit();
    }

    _cleanPanListeners() {
        if (this._onPanMove) { window.removeEventListener('pointermove', this._onPanMove); this._onPanMove = null; }
        if (this._onPanUp)   { window.removeEventListener('pointerup',   this._onPanUp);   this._onPanUp   = null; }
    }

    // ─────────────────────────── GAME LOGIC ───────────────────────────
    start() {
        this.gameOverState = false; this.won = false;
        this.firstClick    = true;  this.isPaused = false;
        this.minesRemaining = this.mineCount;
        this.time  = this.mode === 'time-trial' ? this.timeLimit : 0;
        this.score = 0;
        this.shieldActive  = this.initialShield;
        this.pingCharges   = this.initialPing;
        this.lastMilestone = 0;
        this._panActive    = false;

        if (this.timer) { clearInterval(this.timer); this.timer = null; }

        if (this.minesCountEl) this.minesCountEl.textContent = this.mode === 'endless' ? '0' : this.minesRemaining;
        if (this.timerEl)      this.timerEl.textContent      = this.mode === 'time-trial' ? String(this.timeLimit).padStart(3,'0') : '000';
        if (this.smileyBtn)    { this.smileyBtn.innerHTML = SMILEY_SVG_HAPPY; this.smileyBtn.className = 'ms-smiley state-happy'; }

        const ov = this.root.querySelector('#msOverlay');
        if (ov) ov.classList.remove('show');
        if (this.boardEl) this.boardEl.classList.remove('shake');

        if (this.mode === 'endless') { this.rows = 12; this.cols = 12; this.mineCount = 18; }

        this.buildGrid();
        this.renderBoard();
        this.updateHacksUI();
        if (this.autoFitScale) this.autoFitScale();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this._cleanPanListeners();
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    buildGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({ row: r, col: c, mine: false, revealed: false, flagged: false, questioned: false, count: 0 });
            }
            this.grid.push(row);
        }
    }

    placeMines(startR, startC) {
        const avoid = new Set();
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const nr = startR+dr, nc = startC+dc;
                if (nr>=0&&nr<this.rows&&nc>=0&&nc<this.cols) avoid.add(`${nr},${nc}`);
            }
        let placed = 0;
        while (placed < this.mineCount) {
            const r = Math.floor(Math.random()*this.rows);
            const c = Math.floor(Math.random()*this.cols);
            if (!this.grid[r][c].mine && !avoid.has(`${r},${c}`)) { this.grid[r][c].mine = true; placed++; }
        }
        this.recalc();
    }

    recalc() {
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].mine) continue;
                this.grid[r][c].count = this.neighbors(r,c).filter(n=>n.mine).length;
            }
    }

    neighbors(r, c) {
        const out = [];
        for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
            if (!dr&&!dc) continue;
            const nr=r+dr, nc=c+dc;
            if (nr>=0&&nr<this.rows&&nc>=0&&nc<this.cols) out.push(this.grid[nr][nc]);
        }
        return out;
    }

    // ─────────────────────────── BOARD RENDER ───────────────────────────
    renderBoard() {
        this.boardEl.innerHTML = '';
        this.boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 34px)`;
        this.boardEl.style.gridTemplateRows    = `repeat(${this.rows}, 34px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const el = document.createElement('button');
                el.className = 'ms-cell';
                el.type = 'button';
                el.dataset.row = r;
                el.dataset.col = c;
                el.setAttribute('aria-label', `Row ${r+1} Col ${c+1}`);

                // ── Tap / Click handling ──
                el.addEventListener('click', e => {
                    e.preventDefault();
                    if (this._panActive || this._wasLongPress) return;

                    if (this.inputTool === 'flag') {
                        this.handleCellRightClick(r, c);
                    } else {
                        this.handleCellClick(r, c);
                    }
                });

                // ── Right-click always flags ──
                el.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    if (this._panActive || this._wasLongPress) return;
                    this.handleCellRightClick(r, c);
                });

                // ── Touch long-press (180ms) for quick flag ──
                let holdTimer = null;
                let lpSuppressUntil = 0;

                const cancelHold = () => { clearTimeout(holdTimer); holdTimer = null; };

                el.addEventListener('pointerdown', e => {
                    if (e.pointerType === 'mouse') return;
                    this._wasLongPress = false;
                    cancelHold();
                    holdTimer = setTimeout(() => {
                        if (this._panActive) return;
                        this._wasLongPress = true;
                        lpSuppressUntil = Date.now() + 500;
                        this.handleCellRightClick(r, c);
                        if (navigator.vibrate) try { navigator.vibrate(30); } catch(_) {}
                    }, 180);
                });

                el.addEventListener('pointerup', e => {
                    if (e.pointerType === 'mouse') return;
                    cancelHold();
                    if (Date.now() < lpSuppressUntil) e.preventDefault();
                    setTimeout(() => { this._wasLongPress = false; }, 550);
                });

                el.addEventListener('pointermove', e => {
                    if (e.pointerType === 'mouse') return;
                    if (Math.hypot(e.movementX, e.movementY) > 5) cancelHold();
                });

                el.addEventListener('pointercancel', () => cancelHold());

                this.boardEl.appendChild(el);
            }
        }
    }

    handleCellClick(r, c) {
        if (this.gameOverState || this.isPaused) return;
        const cell = this.grid[r][c];
        if (!cell || cell.revealed || cell.flagged) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(r, c);
            this.startTimer();
            this.updateHacksUI();
        }

        this.reveal(r, c);
        this.updateUI();

        // Single clean endless check after click cascade finishes
        if (this.mode === 'endless' && !this.gameOverState) {
            this.checkEndlessExpansion();
        }

        this.checkWin();
    }

    handleCellRightClick(r, c) {
        if (this.gameOverState || this.isPaused) return;
        const cell = this.grid[r][c];
        if (!cell || cell.revealed) return;
        if (cell.flagged)           { cell.flagged = false; cell.questioned = true;  if (this.mode!=='endless') this.minesRemaining++; }
        else if (cell.questioned)   { cell.questioned = false; }
        else                        { cell.flagged = true;  cell.questioned = false; if (this.mode!=='endless') this.minesRemaining--; }
        if (this.mode!=='endless' && this.minesCountEl) this.minesCountEl.textContent = this.minesRemaining;
        this.paintCell(r, c);
        this.checkWin();
    }

    reveal(r, c) {
        const cell = this.grid[r][c];
        if (!cell || cell.revealed) return;
        cell.revealed = true; cell.questioned = false;

        if (this.mode === 'endless' && !cell.mine) {
            this.score++;
            const depth = Math.floor(this.score * 1.5);
            if (this.minesCountEl) this.minesCountEl.textContent = this.score;
            if (this.timerEl)      this.timerEl.textContent      = String(Math.min(depth, 999)).padStart(3,'0');

            // Milestone rewards
            if (depth >= this.lastMilestone + 30) {
                this.lastMilestone = Math.floor(depth / 30) * 30;
                this.pingCharges++;
                this.updateHacksUI();
                this.showToast(`${localIcon('games/minesweeper/pixel-star', { className: 'ms-inline-icon' })} DEPTH MILESTONE: ${this.lastMilestone}m! +1 PING!`);
            }
        }

        if (cell.mine) {
            if (window.godModeActive) { cell.revealed=false; cell.flagged=true; this.paintCell(r,c); return; }
            if (this.shieldActive) {
                this.shieldActive = false;
                cell.revealed = false; cell.flagged = true;
                if (this.mode!=='endless') { this.minesRemaining--; if (this.minesCountEl) this.minesCountEl.textContent=this.minesRemaining; }
                this.paintCell(r,c); this.updateHacksUI();
                if (this.boardEl) { this.boardEl.classList.add('shield-flash'); setTimeout(()=>this.boardEl.classList.remove('shield-flash'),450); }
                return;
            }
            this.gameOver(false,'mine-hit');
            return;
        }

        if (cell.count === 0) {
            this.neighbors(r,c).forEach(n => { if (!n.revealed&&!n.flagged) this.reveal(n.row,n.col); });
        }
    }

    checkEndlessExpansion() {
        if (this.mode !== 'endless' || this.gameOverState) return;
        let minR = this.rows, maxR = -1, minC = this.cols, maxC = -1;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].revealed) {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }

        const addT = minR < 2 ? 3 : 0;
        const addB = maxR >= this.rows - 2 ? 3 : 0;
        const addL = minC < 2 ? 3 : 0;
        const addR = maxC >= this.cols - 2 ? 3 : 0;

        if ((addT || addB || addL || addR) && (this.rows < 28 || this.cols < 28)) {
            this.expandGrid4D(addT, addB, addL, addR);
        }
    }

    expandGrid4D(addTop, addBottom, addLeft, addRight) {
        const pr = this.rows, pc = this.cols;

        if (addTop > 0) {
            this.grid.forEach(row => row.forEach(c => c.row += addTop));
            const newRows = Array.from({length: addTop}, (_, r) =>
                Array.from({length: pc}, (__, c) => ({ row:r,col:c,mine:false,revealed:false,flagged:false,questioned:false,count:0 }))
            );
            this.grid = newRows.concat(this.grid);
            this.rows += addTop;
        }
        if (addBottom > 0) {
            for (let r = this.rows; r < this.rows + addBottom; r++)
                this.grid.push(Array.from({length:this.cols},(_,c)=>({row:r,col:c,mine:false,revealed:false,flagged:false,questioned:false,count:0})));
            this.rows += addBottom;
        }
        if (addLeft > 0) {
            this.grid.forEach(row => row.forEach(c => c.col += addLeft));
            this.grid.forEach((row, r) => {
                const newCols = Array.from({length:addLeft},(_,c)=>({row:r,col:c,mine:false,revealed:false,flagged:false,questioned:false,count:0}));
                this.grid[r] = newCols.concat(row);
            });
            this.cols += addLeft;
        }
        if (addRight > 0) {
            this.grid.forEach((row,r) => {
                for (let c=this.cols; c<this.cols+addRight; c++)
                    row.push({row:r,col:c,mine:false,revealed:false,flagged:false,questioned:false,count:0});
            });
            this.cols += addRight;
        }

        // Populate new cells with balanced mine density (12%)
        const density = 0.12;
        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) {
            const isNew = (addTop>0&&r<addTop)||(addBottom>0&&r>=this.rows-addBottom)||
                          (addLeft>0&&c<addLeft)||(addRight>0&&c>=this.cols-addRight);
            if (isNew && !this.grid[r][c].revealed && Math.random()<density) {
                this.grid[r][c].mine = true;
            }
        }
        this.recalc();
        this.renderBoard();
        this.updateUI();
        if (this.applyTransform) this.applyTransform();
    }

    showToast(msg) {
        const toast = this.root.querySelector('#msToastBanner');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ─────────────────────────── TIMER ───────────────────────────
    startTimer(resume = false) {
        if (this.timer) clearInterval(this.timer);
        if (this.mode === 'time-trial') {
            if (!resume) this.time = this.timeLimit;
            this.timer = setInterval(() => {
                this.time--;
                if (this.timerEl) this.timerEl.textContent = String(Math.max(0,this.time)).padStart(3,'0');
                if (this.time <= 0) { clearInterval(this.timer); this.gameOver(false,'time-out'); }
            }, 1000);
        } else {
            if (!resume) this.time = 0;
            this.timer = setInterval(() => {
                this.time++;
                if (this.mode!=='endless'&&this.timerEl) this.timerEl.textContent = String(Math.min(this.time,999)).padStart(3,'0');
            }, 1000);
        }
    }

    // ─────────────────────────── PAUSE ───────────────────────────
    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) { clearInterval(this.timer); this.timer=null; this.showOverlay('PAUSED','Game paused','Resume',()=>this.togglePause()); }
        else { this.startTimer(true); const ov=this.root.querySelector('#msOverlay'); if(ov) ov.classList.remove('show'); }
        this.updateHacksUI();
        if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle(this.isPaused);
    }

    handleKeyDown(e) {
        if ((e.key==='p'||e.key==='P') && !this.firstClick) { e.preventDefault(); this.togglePause(); }
    }

    // ─────────────────────────── WIN CHECK ───────────────────────────
    checkWin() {
        if (this.gameOverState || this.mode==='endless') return;
        let allSafe = true;
        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) {
            if (!this.grid[r][c].mine && !this.grid[r][c].revealed) { allSafe=false; break; }
        }
        let flagCount=0, allCorrect=true;
        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) {
            if (this.grid[r][c].flagged) { flagCount++; if (!this.grid[r][c].mine) allCorrect=false; }
        }
        if (allSafe || (flagCount===this.mineCount&&allCorrect)) this.gameOver(true);
    }

    // ─────────────────────────── GAME OVER ───────────────────────────
    gameOver(success, reason='') {
        this.gameOverState = true; this.won = success;
        if (this.timer) clearInterval(this.timer);
        this.updateHacksUI();

        if (this.smileyBtn) {
            this.smileyBtn.innerHTML = success ? SMILEY_SVG_WIN : SMILEY_SVG_LOSE;
            this.smileyBtn.className = success ? 'ms-smiley state-win' : 'ms-smiley state-lose';
        }
        if (!success && this.boardEl) this.boardEl.classList.add('shake');

        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) {
            const cell=this.grid[r][c];
            if (cell.mine) { if (success) { cell.flagged=true; cell.questioned=false; } else cell.revealed=true; }
            this.paintCell(r,c);
        }

        let best = localStorage.getItem('ms_best_'+this.mode+'_'+this.difficulty);
        if (success) {
            const t = this.mode==='time-trial' ? this.timeLimit-this.time : this.time;
            if (!best || t < parseInt(best)) { localStorage.setItem('ms_best_'+this.mode+'_'+this.difficulty, t); best=t; }
        }

        const mc = this.getMinerComment(success, reason);
        let msg = '';
        if (this.mode==='endless') msg = `Tiles Cleared: ${this.score} · Max Depth: ${Math.floor(this.score*1.5)}m`;
        else if (this.mode==='time-trial') msg = success ? `Done in ${this.timeLimit-this.time}s (${this.time}s left)` : `Time expired after ${this.timeLimit-this.time}s`;
        else { const t=String(this.time).padStart(3,'0'); const b=best?String(best).padStart(3,'0')+'s':'---'; msg=success?`Clear: ${t}s · Best: ${b}`:`Exploded in ${t}s · Best: ${b}`; }

        this.showOverlay(success ? 'VICTORY!' : 'DETONATED', `${msg}<br><span style="color:var(--primary);font-size:0.78rem;">${mc}</span>`, 'Play Again', () => this.start());

        if (this.callbacks.onEnd) this.callbacks.onEnd(success);
    }

    showOverlay(title, msg, btnText, onAction) {
        const ov    = this.root.querySelector('#msOverlay');
        const tEl   = this.root.querySelector('#msOverlayTitle');
        const mEl   = this.root.querySelector('#msOverlayMsg');
        const btn   = this.root.querySelector('#msOverlayBtn');
        if (!ov) return;
        tEl.textContent = title;
        mEl.innerHTML   = msg;
        btn.textContent = btnText;
        btn.onclick     = () => { ov.classList.remove('show'); if (onAction) onAction(); };
        ov.classList.add('show');
    }

    // ─────────────────────────── HACKS ───────────────────────────
    usePing() {
        if (this.gameOverState || this.isPaused || this.pingCharges <= 0) return;
        const unrev = [];
        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) {
            const cell=this.grid[r][c];
            if (!cell.mine && !cell.revealed && !cell.flagged) unrev.push(cell);
        }
        if (!unrev.length) return;
        const pick = unrev[Math.floor(Math.random()*unrev.length)];
        this.pingCharges--;
        this.updateHacksUI();
        if (this.firstClick) { this.firstClick=false; this.placeMines(pick.row, pick.col); this.startTimer(); }
        this.reveal(pick.row, pick.col);
        this.updateUI();
        this.checkWin();
    }

    updateHacksUI() {
        const shieldBtn = this.root.querySelector('#msHackShield');
        const pingBtn   = this.root.querySelector('#msHackPing');
        if (!shieldBtn || !pingBtn) return;
        const off = this.gameOverState || this.isPaused;
        shieldBtn.className = `ms-hack-btn${this.shieldActive && !off ? ' active' : ' disabled'}`;
        shieldBtn.innerHTML = `${localIcon('states/security-check', { className: 'ms-inline-icon' })} SHIELD (${this.shieldActive ? 'READY' : 'USED'})`;
        pingBtn.className   = `ms-hack-btn${this.pingCharges > 0 && !off ? ' active' : ' disabled'}`;
        pingBtn.innerHTML   = `${localIcon('games/minesweeper/radar-light', { className: 'ms-inline-icon' })} PING (${this.pingCharges})`;
    }

    // ─────────────────────────── PAINT CELL ───────────────────────────
    updateUI() {
        for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) this.paintCell(r,c);
    }

    paintCell(r, c) {
        if (!this.boardEl) return;
        const idx  = r * this.cols + c;
        const el   = this.boardEl.children[idx];
        const cell = this.grid[r][c];
        if (!el || !cell) return;

        el.className = 'ms-cell';
        el.innerHTML = '';

        if (cell.revealed) {
            el.classList.add('revealed');
            if (cell.mine) {
                el.classList.add('mine');
                el.innerHTML = MINE_SVG;
            } else if (cell.count > 0) {
                el.classList.add(`ms-num-${cell.count}`);
                el.textContent = cell.count;
            }
        } else if (cell.flagged) {
            el.classList.add('flagged');
            el.innerHTML = FLAG_SVG;
        } else if (cell.questioned) {
            el.classList.add('questioned');
            el.textContent = '?';
        }
    }

    // ─────────────────────────── MASCOT / COMMENTS ───────────────────────────
    getMinerImgSrc(type) {
        const safeType = String(type || 'tutorial_1').replace(/[^a-z0-9_-]/gi, '');
        return `assets/images/miner/${safeType}.webp`;
    }

    getMinerComment(success, reason) {
        if (success) return "Flawless sweep! Sector disarmed and cleared.";
        if (reason === 'time-out') return "Time's up! The clock ran out on this sector.";
        return "Boom! Watch out for high-risk proximity cells.";
    }

    showTutorialModal() {
        const modal = this.container.querySelector('#msTutorialModal');
        const text  = this.container.querySelector('#msModalText');
        const prog  = this.container.querySelector('#msModalProgress');
        const prev  = this.container.querySelector('#msModalPrevBtn');
        const next  = this.container.querySelector('#msModalNextBtn');
        if (!modal || !text) return;

        const pages = [
            "Welcome to Cyber Deck Mines! Your goal is to clear all safe cells without detonating any hidden mines.",
            "Use the DIG / FLAG mode toggle in the top bar to easily switch between digging cells and placing warning flags.",
            "On touch devices, long-pressing any cell for 180ms also instantly toggles a flag on that cell.",
            "Drag anywhere on the board or use two fingers to pan around. Use the ＋ and − controls in the bottom right to zoom.",
            "Click FIT in the bottom right anytime to center and auto-scale the entire board inside your view!",
            "SHIELD absorbs 1 accidental mine hit! PING reveals a guaranteed safe cell when you get stuck.",
            "Try Endless Mode for infinite expansion! Earn PING rewards every 30m depth!"
        ];

        let page = 0;
        const update = () => {
            text.textContent = pages[page];
            prog.textContent = `${page+1}/${pages.length}`;
            prev.style.display = page === 0 ? 'none' : 'inline-block';
            next.innerHTML   = page === pages.length - 1 ? 'GOT IT!' : `NEXT ${localIcon('games/shared/arrow-right', { className: 'ms-inline-icon' })}`;
        };

        prev.onclick = () => { if (page > 0) { page--; update(); } };
        next.onclick = () => {
            if (page < pages.length - 1) { page++; update(); }
            else modal.classList.remove('show');
        };

        update();
        modal.classList.add('show');
    }
}
