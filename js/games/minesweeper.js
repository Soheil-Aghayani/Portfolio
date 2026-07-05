
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
        
        this.minesRemaining = this.mineCount;
        this.time = 0;
        this.timer = null;

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
                    <button class="ms-smiley" id="msSmileyBtn" type="button" aria-label="Reset Game">😊</button>
                    <div class="ms-counter-box">
                        <div class="ms-counter-label">Time</div>
                        <div id="msTimer" class="ms-counter-val">000</div>
                    </div>
                </div>

                <div class="ms-board" id="msBoard" role="grid" aria-label="Minesweeper Board">
                    <!-- 100 cells generated dynamically -->
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
        this.minesRemaining = this.mineCount;
        this.time = 0;
        
        if (this.timer) clearInterval(this.timer);
        this.timer = null;

        this.minesCountEl.textContent = this.minesRemaining;
        this.timerEl.textContent = '000';
        this.smileyBtn.textContent = '😊';

        if (this.boardEl) {
            this.boardEl.classList.remove('shake');
        }

        this.buildGrid();
        this.renderBoard();

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
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
                cellEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCellClick(r, c);
                });

                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellRightClick(r, c);
                });

                // Long press / Touch hold for mobile flag placement
                let touchTimer;
                cellEl.addEventListener('touchstart', (e) => {
                    touchTimer = setTimeout(() => {
                        this.handleCellRightClick(r, c);
                    }, 500); // 500ms long press
                }, { passive: true });

                cellEl.addEventListener('touchend', () => {
                    clearTimeout(touchTimer);
                });

                cellEl.addEventListener('touchmove', () => {
                    clearTimeout(touchTimer);
                });

                this.boardEl.appendChild(cellEl);
            }
        }
    }

    handleCellClick(r, c) {
        if (this.gameOverState) return;

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
        if (this.gameOverState) return;

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

    startTimer() {
        this.time = 0;
        this.timer = setInterval(() => {
            this.time++;
            const displayTime = String(Math.min(this.time, 999)).padStart(3, '0');
            this.timerEl.textContent = displayTime;
        }, 1000);
    }

    updateCellUI(r, c) {
        const cell = this.grid[r][c];
        const cellEl = this.boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!cellEl) return;

        cellEl.className = 'ms-cell';
        cellEl.textContent = '';

        if (cell.revealed) {
            cellEl.classList.add('revealed');
            if (cell.mine) {
                cellEl.classList.add('mine');
                cellEl.textContent = '💣';
            } else if (cell.count > 0) {
                cellEl.classList.add(`ms-num-${cell.count}`);
                cellEl.textContent = cell.count;
            }
        } else if (cell.flagged) {
            cellEl.classList.add('flagged');
            cellEl.textContent = '🚩';
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

        this.smileyBtn.textContent = success ? '😎' : '😵';

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

        // Trigger end callbacks
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(success ? this.time : 0);
        }
    }
}
