
const SMILEY_SVG_HAPPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`;
const SMILEY_SVG_WIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; color: var(--primary);"><circle cx="12" cy="12" r="10"></circle><path d="M6 9h12l-1.5 4h-9L6 9z" fill="currentColor" opacity="0.3"></path><line x1="6" y1="9" x2="18" y2="9"></line><path d="M9 15s1.5 1.5 3 1.5 3-1.5 3-1.5"></path></svg>`;
const SMILEY_SVG_LOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; color: #ef4444;"><circle cx="12" cy="12" r="10"></circle><path d="M9 9l2 2m-2 0l2-2"></path><path d="M13 9l2 2m-2 0l2-2"></path><circle cx="12" cy="15" r="1.5"></circle></svg>`;

const FLAG_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #fb7185; filter: drop-shadow(0 0 4px rgba(251, 113, 133, 0.6));"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="rgba(251, 113, 133, 0.3)"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
const MINE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ef4444; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6));"><circle cx="12" cy="12" r="8" fill="rgba(239, 68, 68, 0.2)"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="19.07" y1="4.93" x2="17.66" y2="6.34"></line><line x1="6.34" y1="17.66" x2="4.93" y2="19.07"></line><circle cx="10" cy="10" r="1.2" fill="#fff" stroke="none"></circle></svg>`;

export class MinesweeperGame {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.rows = 10;
        this.cols = 10;
        this.mineCount = 15;

        this.grid = [];
        this.gameOverState = false;
        this.won = false;
        this.firstClick = true;
        this.isPaused = false;
        
        this.minesRemaining = this.mineCount;
        this.time = 0;
        this.timer = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="ms-container">
                <div class="ms-header">
                    <div class="ms-counter-box">
                          <div class="ms-counter-label">Mines</div>
                          <div id="msMinesCount" class="ms-counter-val">15</div>
                      </div>
                      <button class="ms-smiley state-happy" id="msSmileyBtn" type="button" aria-label="Reset Game">${SMILEY_SVG_HAPPY}</button>
                    <div class="ms-counter-box">
                        <div class="ms-counter-label">Time</div>
                        <div id="msTimer" class="ms-counter-val">000</div>
                    </div>
                </div>

                <div style="position: relative; width: fit-content; height: fit-content; margin: 0 auto;">
                    <div class="ms-board" id="msBoard" role="grid" aria-label="Minesweeper Board">
                        <!-- 100 cells generated dynamically -->
                    </div>
                    <div class="ms-overlay" id="msOverlay">
                        <div class="ms-title" id="msOverlayTitle">GAME OVER</div>
                        <div class="ms-msg" id="msOverlayMsg">Time: 000s</div>
                        <button class="ms-btn" id="msOverlayBtn" type="button">Play Again</button>
                    </div>
                </div>
            </div>
        `;

        this.boardEl = this.container.querySelector('#msBoard');
        this.smileyBtn = this.container.querySelector('#msSmileyBtn');
        this.minesCountEl = this.container.querySelector('#msMinesCount');
        this.timerEl = this.container.querySelector('#msTimer');

        this.smileyBtn.onclick = () => this.start();
    }

    start() {
        this.gameOverState = false;
        this.won = false;
        this.firstClick = true;
        this.isPaused = false;
        this.minesRemaining = this.mineCount;
        this.time = 0;
        
        if (this.timer) clearInterval(this.timer);
        this.timer = null;

        this.minesCountEl.textContent = this.minesRemaining;
        this.timerEl.textContent = '000';
        this.smileyBtn.innerHTML = SMILEY_SVG_HAPPY;
        this.smileyBtn.className = 'ms-smiley state-happy';

        const overlay = this.container.querySelector('#msOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }

        if (this.boardEl) {
            this.boardEl.classList.remove('shake');
        }

        this.buildGrid();
        this.renderBoard();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    buildGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    row: r,
                    col: c,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    count: 0
                });
            }
            this.grid.push(row);
        }
    }

    placeMines(startR, startC) {
        let placed = 0;
        // Avoid starting cell and its adjacent cells (3x3 area)
        const avoidCells = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = startR + dr;
                const nc = startC + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    avoidCells.add(`${nr},${nc}`);
                }
            }
        }

        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            const key = `${r},${c}`;

            if (!this.grid[r][c].mine && !avoidCells.has(key)) {
                this.grid[r][c].mine = true;
                placed++;
            }
        }

        // Calculate counts
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].mine) continue;
                let count = 0;
                this.getNeighbors(r, c).forEach(n => {
                    if (n.mine) count++;
                });
                this.grid[r][c].count = count;
            }
        }
    }

    getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    neighbors.push(this.grid[nr][nc]);
                }
            }
        }
        return neighbors;
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellData = this.grid[r][c];
                const cellEl = document.createElement('button');
                cellEl.className = 'ms-cell';
                cellEl.setAttribute('type', 'button');
                cellEl.setAttribute('role', 'gridcell');
                cellEl.setAttribute('aria-label', `Cell row ${r+1} column ${c+1}`);
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;

                // Event Listeners
                let holdTimer;
                let wasLongPress = false;
                let suppressClickUntil = 0;
                let activePointerId = null;
                let startX = 0;
                let startY = 0;

                const clearHoldTimer = () => {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                };

                cellEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (wasLongPress || Date.now() < suppressClickUntil) {
                        wasLongPress = false;
                        return;
                    }
                    this.handleCellClick(r, c);
                });

                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellRightClick(r, c);
                });

                // Long press / touch hold for mobile flag placement.
                cellEl.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'mouse') return;
                    e.preventDefault();
                    wasLongPress = false;
                    activePointerId = e.pointerId;
                    startX = e.clientX;
                    startY = e.clientY;
                    try { cellEl.setPointerCapture(activePointerId); } catch(err) {}

                    clearHoldTimer();
                    holdTimer = setTimeout(() => {
                        wasLongPress = true;
                        suppressClickUntil = Date.now() + 700;
                        this.handleCellRightClick(r, c);
                        if (navigator.vibrate) {
                            try { navigator.vibrate(50); } catch(err) {}
                        }
                    }, 450);
                });

                cellEl.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'mouse') return;
                    clearHoldTimer();
                    if (wasLongPress) {
                        e.preventDefault();
                    }
                    try { cellEl.releasePointerCapture(activePointerId); } catch(err) {}
                    activePointerId = null;
                });

                cellEl.addEventListener('pointermove', (e) => {
                    if (e.pointerType === 'mouse' || activePointerId !== e.pointerId) return;
                    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
                    if (dist > 10) {
                        clearHoldTimer();
                    }
                });

                cellEl.addEventListener('pointercancel', () => {
                    clearHoldTimer();
                    activePointerId = null;
                });

                this.boardEl.appendChild(cellEl);
            }
        }
    }

    handleCellClick(r, c) {
        if (this.gameOverState || this.isPaused) return;

        const cell = this.grid[r][c];
        if (cell.revealed || cell.flagged) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(r, c);
            this.startTimer();
        }

        this.reveal(r, c);
        this.updateUI();
        this.checkGameStatus();
    }

    handleCellRightClick(r, c) {
        if (this.gameOverState || this.isPaused) return;

        const cell = this.grid[r][c];
        if (cell.revealed) return;

        cell.flagged = !cell.flagged;
        this.minesRemaining += cell.flagged ? -1 : 1;
        this.minesCountEl.textContent = this.minesRemaining;

        this.updateCellUI(r, c);
    }

    reveal(r, c) {
        const cell = this.grid[r][c];
        cell.revealed = true;

        if (cell.mine) {
            if (window.godModeActive) {
                cell.revealed = false;
                cell.flagged = true;
                this.minesRemaining--;
                this.minesCountEl.textContent = this.minesRemaining;
                this.updateCellUI(r, c);
                if (navigator.vibrate) {
                    try { navigator.vibrate([100, 50, 100]); } catch(err) {}
                }
                return;
            }
            this.gameOver(false);
            return;
        }

        if (cell.count === 0) {
            this.getNeighbors(r, c).forEach(n => {
                if (!n.revealed && !n.flagged) {
                    this.reveal(n.row, n.col);
                }
            });
        }
    }

    startTimer(resume = false) {
        if (this.timer) clearInterval(this.timer);
        if (!resume) this.time = 0;
        this.timer = setInterval(() => {
            this.time++;
            const displayTime = String(Math.min(this.time, 999)).padStart(3, '0');
            this.timerEl.textContent = displayTime;
        }, 1000);
    }

    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
            this.showPauseOverlay(true);
        } else {
            this.startTimer(true);
            this.showPauseOverlay(false);
        }
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    showPauseOverlay(show) {
        const overlay = this.container.querySelector('#msOverlay');
        const overlayTitle = this.container.querySelector('#msOverlayTitle');
        const overlayMsg = this.container.querySelector('#msOverlayMsg');
        const overlayBtn = this.container.querySelector('#msOverlayBtn');

        if (overlay && overlayTitle && overlayMsg && overlayBtn) {
            if (show) {
                overlayTitle.textContent = 'PAUSED';
                overlayTitle.style.color = '#38bdf8'; // friendly blue
                overlayMsg.textContent = 'Game is paused';
                overlayBtn.textContent = 'Resume';
                overlayBtn.onclick = () => this.togglePause();
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    }

    handleKeyDown(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.firstClick) return; // Don't pause before game has started
            e.preventDefault();
            this.togglePause();
        }
    }

    updateCellUI(r, c) {
        const cell = this.grid[r][c];
        const cellEl = this.boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!cellEl) return;

        cellEl.className = 'ms-cell';
        cellEl.innerHTML = '';

        if (cell.revealed) {
            cellEl.classList.add('revealed');
            if (cell.mine) {
                cellEl.classList.add('mine');
                cellEl.innerHTML = MINE_SVG;
            } else if (cell.count > 0) {
                cellEl.classList.add(`ms-num-${cell.count}`);
                cellEl.textContent = cell.count;
            }
        } else if (cell.flagged) {
            cellEl.classList.add('flagged');
            cellEl.innerHTML = FLAG_SVG;
        }
    }

    updateUI() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.updateCellUI(r, c);
            }
        }
    }

    checkGameStatus() {
        if (this.gameOverState) return;

        // Check if all non-mine cells are revealed
        let win = true;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (!cell.mine && !cell.revealed) {
                    win = false;
                    break;
                }
            }
            if (!win) break;
        }

        if (win) {
            this.gameOver(true);
        }
    }

    gameOver(success) {
        this.gameOverState = true;
        this.won = success;
        if (this.timer) clearInterval(this.timer);

        this.smileyBtn.innerHTML = success ? SMILEY_SVG_WIN : SMILEY_SVG_LOSE;
        this.smileyBtn.className = success ? 'ms-smiley state-win' : 'ms-smiley state-lose';

        if (!success && this.boardEl) {
            this.boardEl.classList.add('shake');
        }

        // Reveal all mines
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.mine) {
                    if (success) {
                        cell.flagged = true;
                    } else {
                        cell.revealed = true;
                    }
                }
                this.updateCellUI(r, c);
            }
        }

        // Handle Best Time Record & Overlay display
        let isNewRecord = false;
        let bestTime = localStorage.getItem('minesweeper_best_time');
        if (success) {
            if (!bestTime || this.time < parseInt(bestTime)) {
                localStorage.setItem('minesweeper_best_time', this.time);
                bestTime = this.time;
                isNewRecord = true;
            }
        }

        const overlay = this.container.querySelector('#msOverlay');
        const overlayTitle = this.container.querySelector('#msOverlayTitle');
        const overlayMsg = this.container.querySelector('#msOverlayMsg');
        const overlayBtn = this.container.querySelector('#msOverlayBtn');

        if (overlay && overlayTitle && overlayMsg && overlayBtn) {
            overlayTitle.textContent = success ? 'VICTORY!' : 'GAME OVER';
            overlayTitle.style.color = success ? 'var(--primary)' : '#ef4444';
            
            const displayTime = String(this.time).padStart(3, '0');
            const displayBest = bestTime ? String(bestTime).padStart(3, '0') + 's' : '---';
            
            overlayMsg.innerHTML = success 
                ? (isNewRecord 
                    ? `🏆 NEW RECORD!<br>Clear Time: ${displayTime}s` 
                    : `Clear Time: ${displayTime}s<br>Best Time: ${displayBest}`)
                : `Blew up in ${displayTime}s<br>Best Time: ${displayBest}`;

            overlayBtn.onclick = () => this.start();

            setTimeout(() => {
                overlay.classList.add('show');
            }, 800);
        }

        // Trigger end callbacks
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(success ? this.time : 0);
        }
    }
}
