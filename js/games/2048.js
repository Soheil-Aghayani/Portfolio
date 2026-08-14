
const localIcon = (name, options = {}) => window.IconRegistry
    ? window.IconRegistry.svg(name, options)
    : '';

export class Game2048 {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.mergedGrid = Array(4).fill().map(() => Array(4).fill(false));
        this.score = 0;
        this.gameOverState = false;
        this.won = false;
        this.keepPlaying = false;

        this.touchStartClientX = 0;
        this.touchStartClientY = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.initUI();
    }

    initUI() {
        const savedHighScore = localStorage.getItem('2048_high_score') || 0;

        this.container.innerHTML = `
            <div class="g2048-container">
                <div class="g2048-scoreboard">
                    <div class="g2048-score-box">
                        <div class="g2048-score-label">Score</div>
                        <div id="g2048Score" class="g2048-score-value">0</div>
                    </div>
                    <div class="g2048-score-box" id="g2048UndoBox" style="display: none; cursor: pointer; border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.1);">
                        <div class="g2048-score-label" style="color: #10b981;">Cheat Mode</div>
                        <div id="g2048UndoBtn" class="g2048-score-value" style="font-size: 0.95rem; line-height: 1.8; color: #10b981;">${localIcon('games/shared/rotate', { className: 'g2048-inline-icon', label: 'Undo' })} UNDO</div>
                    </div>
                    <div class="g2048-score-box">
                        <div class="g2048-score-label">Best</div>
                        <div id="g2048HighScore" class="g2048-score-value">${savedHighScore}</div>
                    </div>
                </div>

                <div class="g2048-board" id="g2048Board" tabindex="0" aria-label="2048 Board">
                    <!-- 16 empty cells -->
                    <div class="g2048-cell" data-row="0" data-col="0"></div>
                    <div class="g2048-cell" data-row="0" data-col="1"></div>
                    <div class="g2048-cell" data-row="0" data-col="2"></div>
                    <div class="g2048-cell" data-row="0" data-col="3"></div>

                    <div class="g2048-cell" data-row="1" data-col="0"></div>
                    <div class="g2048-cell" data-row="1" data-col="1"></div>
                    <div class="g2048-cell" data-row="1" data-col="2"></div>
                    <div class="g2048-cell" data-row="1" data-col="3"></div>

                    <div class="g2048-cell" data-row="2" data-col="0"></div>
                    <div class="g2048-cell" data-row="2" data-col="1"></div>
                    <div class="g2048-cell" data-row="2" data-col="2"></div>
                    <div class="g2048-cell" data-row="2" data-col="3"></div>

                    <div class="g2048-cell" data-row="3" data-col="0"></div>
                    <div class="g2048-cell" data-row="3" data-col="1"></div>
                    <div class="g2048-cell" data-row="3" data-col="2"></div>
                    <div class="g2048-cell" data-row="3" data-col="3"></div>

                    <div class="g2048-overlay" id="g2048Overlay">
                        <div class="g2048-title" id="g2048OverlayTitle">Game Over</div>
                        <div class="g2048-msg" id="g2048OverlayMsg">No moves left!</div>
                        <button class="g2048-btn" id="g2048RestartBtn" type="button">${localIcon('games/shared/reset', { label: 'New game' })} New Game</button>
                    </div>
                </div>
            </div>
        `;

        this.boardEl = this.container.querySelector('#g2048Board');
        this.overlayEl = this.container.querySelector('#g2048Overlay');
        this.overlayTitleEl = this.container.querySelector('#g2048OverlayTitle');
        this.overlayMsgEl = this.container.querySelector('#g2048OverlayMsg');
        this.restartBtn = this.container.querySelector('#g2048RestartBtn');
        this.undoBox = this.container.querySelector('#g2048UndoBox');

        this.restartBtn.onclick = () => {
            this.start();
        };

        if (this.undoBox) {
            this.undoBox.onclick = (e) => {
                e.stopPropagation();
                this.undo();
            };
        }
    }

    start() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.mergedGrid = Array(4).fill().map(() => Array(4).fill(false));
        this.score = 0;
        this.history = [];
        this.gameOverState = false;
        this.won = false;
        this.keepPlaying = false;

        if (this.undoBox) {
            this.undoBox.style.display = window.godModeActive ? 'flex' : 'none';
        }

        this.overlayEl.classList.remove('show');

        // Spawn initial two tiles
        this.spawnTile();
        this.spawnTile();
        this.render();

        // Listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        this.boardEl.removeEventListener('touchstart', this.handleTouchStart);
        this.boardEl.removeEventListener('touchend', this.handleTouchEnd);
        this.boardEl.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        this.boardEl.addEventListener('touchend', this.handleTouchEnd, { passive: true });

        this.boardEl.focus();

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        window.removeEventListener('keydown', this.handleKeyDown);
        if (this.boardEl) {
            this.boardEl.removeEventListener('touchstart', this.handleTouchStart);
            this.boardEl.removeEventListener('touchend', this.handleTouchEnd);
        }
    }

    spawnTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render() {
        // Update scores
        document.getElementById('g2048Score').textContent = this.score;
        const savedHigh = parseInt(localStorage.getItem('2048_high_score') || 0);
        if (this.score > savedHigh) {
            localStorage.setItem('2048_high_score', this.score);
            document.getElementById('g2048HighScore').textContent = this.score;
        } else {
            document.getElementById('g2048HighScore').textContent = savedHigh;
        }

        if (this.undoBox) {
            this.undoBox.style.display = window.godModeActive ? 'flex' : 'none';
        }

        // Render board
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = this.container.querySelector(`.g2048-cell[data-row="${r}"][data-col="${c}"]`);
                cell.innerHTML = '';
                const val = this.grid[r][c];
                if (val > 0) {
                    const tile = document.createElement('div');
                    tile.className = `g2048-tile tile-${val <= 2048 ? val : 'super'}`;
                    if (this.mergedGrid[r][c]) {
                        tile.classList.add('merged');
                    }
                    tile.textContent = val;
                    cell.appendChild(tile);
                }
            }
        }

        // Trigger score callback
        if (this.callbacks.onScore) {
            this.callbacks.onScore(this.score);
        }
    }

    handleKeyDown(e) {
        if (this.gameOverState) return;

        const prevGrid = JSON.parse(JSON.stringify(this.grid));
        const prevScore = this.score;

        let moved = false;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                moved = this.moveUp();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                moved = this.moveDown();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                moved = this.moveLeft();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                moved = this.moveRight();
                break;
            default:
                return; // Let other keys propagate
        }

        if (moved) {
            if (!this.history) this.history = [];
            this.history.push({ grid: prevGrid, score: prevScore });
            if (this.history.length > 15) this.history.shift();

            this.spawnTile();
            this.render();
            this.checkGameStatus();
        }
    }

    handleTouchStart(e) {
        if (e.touches.length > 0) {
            this.touchStartClientX = e.touches[0].clientX;
            this.touchStartClientY = e.touches[0].clientY;
        }
    }

    handleTouchEnd(e) {
        if (this.gameOverState || e.changedTouches.length === 0) return;

        const deltaX = e.changedTouches[0].clientX - this.touchStartClientX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartClientY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const threshold = 30;

        if (Math.max(absDeltaX, absDeltaY) < threshold) return;

        const prevGrid = JSON.parse(JSON.stringify(this.grid));
        const prevScore = this.score;

        let moved = false;
        if (absDeltaX > absDeltaY) {
            if (deltaX > 0) {
                moved = this.moveRight();
            } else {
                moved = this.moveLeft();
            }
        } else {
            if (deltaY > 0) {
                moved = this.moveDown();
            } else {
                moved = this.moveUp();
            }
        }

        if (moved) {
            if (!this.history) this.history = [];
            this.history.push({ grid: prevGrid, score: prevScore });
            if (this.history.length > 15) this.history.shift();

            this.spawnTile();
            this.render();
            this.checkGameStatus();
        }
    }

    // Move Logic helpers
    slideLineLeft(line) {
        const filtered = line.filter(x => x !== 0);
        let scoreGain = 0;
        const newLine = Array(4).fill(0);
        const mergedPositions = Array(4).fill(false);

        let targetIdx = 0;
        for (let i = 0; i < filtered.length; i++) {
            if (i < filtered.length - 1 && filtered[i] === filtered[i+1]) {
                newLine[targetIdx] = filtered[i] * 2;
                scoreGain += newLine[targetIdx];
                mergedPositions[targetIdx] = true;
                i++; // Skip the next index as it merged
            } else {
                newLine[targetIdx] = filtered[i];
            }
            targetIdx++;
        }

        return { line: newLine, scoreGain, merged: mergedPositions };
    }

    transpose(grid) {
        return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    }

    moveLeft() {
        let moved = false;
        let totalScoreGain = 0;
        const newGrid = [];
        const newMergedGrid = [];

        for (let r = 0; r < 4; r++) {
            const { line, scoreGain, merged } = this.slideLineLeft(this.grid[r]);
            newGrid.push(line);
            newMergedGrid.push(merged);

            if (scoreGain > 0 || JSON.stringify(line) !== JSON.stringify(this.grid[r])) {
                moved = true;
            }
            totalScoreGain += scoreGain;
        }

        if (moved) {
            this.grid = newGrid;
            this.mergedGrid = newMergedGrid;
            this.score += totalScoreGain;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        let totalScoreGain = 0;
        const newGrid = [];
        const newMergedGrid = [];

        for (let r = 0; r < 4; r++) {
            const reversed = [...this.grid[r]].reverse();
            const { line, scoreGain, merged } = this.slideLineLeft(reversed);
            
            const resultLine = [...line].reverse();
            const resultMerged = [...merged].reverse();

            newGrid.push(resultLine);
            newMergedGrid.push(resultMerged);

            if (scoreGain > 0 || JSON.stringify(resultLine) !== JSON.stringify(this.grid[r])) {
                moved = true;
            }
            totalScoreGain += scoreGain;
        }

        if (moved) {
            this.grid = newGrid;
            this.mergedGrid = newMergedGrid;
            this.score += totalScoreGain;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        let totalScoreGain = 0;

        const transposed = this.transpose(this.grid);
        const newTransposedGrid = [];
        const newTransposedMerged = [];

        for (let r = 0; r < 4; r++) {
            const { line, scoreGain, merged } = this.slideLineLeft(transposed[r]);
            newTransposedGrid.push(line);
            newTransposedMerged.push(merged);

            if (scoreGain > 0 || JSON.stringify(line) !== JSON.stringify(transposed[r])) {
                moved = true;
            }
            totalScoreGain += scoreGain;
        }

        if (moved) {
            this.grid = this.transpose(newTransposedGrid);
            this.mergedGrid = this.transpose(newTransposedMerged);
            this.score += totalScoreGain;
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        let totalScoreGain = 0;

        const transposed = this.transpose(this.grid);
        const newTransposedGrid = [];
        const newTransposedMerged = [];

        for (let r = 0; r < 4; r++) {
            const reversed = [...transposed[r]].reverse();
            const { line, scoreGain, merged } = this.slideLineLeft(reversed);
            
            const resultLine = [...line].reverse();
            const resultMerged = [...merged].reverse();

            newTransposedGrid.push(resultLine);
            newTransposedMerged.push(resultMerged);

            if (scoreGain > 0 || JSON.stringify(resultLine) !== JSON.stringify(transposed[r])) {
                moved = true;
            }
            totalScoreGain += scoreGain;
        }

        if (moved) {
            this.grid = this.transpose(newTransposedGrid);
            this.mergedGrid = this.transpose(newTransposedMerged);
            this.score += totalScoreGain;
        }
        return moved;
    }

    checkGameStatus() {
        // Check for 2048 win
        if (!this.won && !this.keepPlaying) {
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (this.grid[r][c] === 2048) {
                        this.won = true;
                        this.showWinOverlay();
                        return;
                    }
                }
            }
        }

        // Check for Game Over (no empty cells and no adjacent equal numbers)
        let hasEmpty = false;
        let hasMove = false;

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) {
                    hasEmpty = true;
                    break;
                }
            }
            if (hasEmpty) break;
        }

        if (!hasEmpty) {
            // Check horizontally and vertically for adjacent matches
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    const val = this.grid[r][c];
                    // Check Right
                    if (c < 3 && val === this.grid[r][c + 1]) hasMove = true;
                    // Check Down
                    if (r < 3 && val === this.grid[r + 1][c]) hasMove = true;
                    if (hasMove) break;
                }
                if (hasMove) break;
            }

            if (!hasMove) {
                this.gameOver();
            }
        }
    }

    showWinOverlay() {
        this.overlayTitleEl.textContent = "You Win!";
        this.overlayTitleEl.style.color = "var(--primary)";
        const updatedHigh = localStorage.getItem('2048_high_score') || 0;
        this.overlayMsgEl.innerHTML = `You reached the 2048 tile!<br>Score: ${this.score}<br>High Score: ${updatedHigh}`;
        this.restartBtn.innerHTML = `${localIcon('games/shared/play', { label: 'Keep playing' })} Keep Playing`;
        
        // Custom restart btn behavior for keep playing
        this.restartBtn.onclick = () => {
            this.keepPlaying = true;
            this.overlayEl.classList.remove('show');
            this.boardEl.focus();
            // Restore default onclick behavior for future game overs
            this.restartBtn.onclick = () => this.start();
        };

        this.overlayEl.classList.add('show');
        if (this.callbacks.onScore) {
            this.callbacks.onScore(this.score);
        }
    }

    gameOver() {
        this.gameOverState = true;
        this.overlayTitleEl.textContent = "Game Over";
        this.overlayTitleEl.style.color = "#ef4444";
        const updatedHigh = localStorage.getItem('2048_high_score') || 0;
        this.overlayMsgEl.innerHTML = `No moves left!<br>Score: ${this.score}<br>High Score: ${updatedHigh}`;
        this.restartBtn.innerHTML = `${localIcon('games/shared/reset', { label: 'Play again' })} Play Again`;
        this.restartBtn.onclick = () => this.start();

        this.overlayEl.classList.add('show');

        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(this.score);
        }
    }

    undo() {
        if (this.history && this.history.length > 0) {
            const prevState = this.history.pop();
            this.grid = JSON.parse(JSON.stringify(prevState.grid));
            this.score = prevState.score;
            this.gameOverState = false;
            this.overlayEl.classList.remove('show');
            this.render();
        }
    }
}
