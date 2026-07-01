
export class TetrisGame {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.cols = 10;
        this.rows = 20;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        this.tileSize = 0;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOverState = false;
        this.isPaused = false;
        
        this.timer = null;
        this.dropInterval = 1000; // ms between drops
        this.lastDropTime = 0;
        this.animationFrameId = null;

        // Modern Neon Color Palette
        this.COLORS = {
            1: '#2dd4bf', // Teal (I)
            2: '#a78bfa', // Amethyst (O)
            3: '#fb923c', // Sunset (T)
            4: '#10b981', // Forest (S)
            5: '#fb7185', // Rose (Z)
            6: '#38bdf8', // Frost (J)
            7: '#fbbf24'  // Yellow (L)
        };

        // Tetromino shapes
        this.SHAPES = {
            1: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
            2: [[2,2], [2,2]],                               // O
            3: [[0,3,0], [3,3,3], [0,0,0]],                   // T
            4: [[0,4,4], [4,4,0], [0,0,0]],                   // S
            5: [[5,5,0], [0,5,5], [0,0,0]],                   // Z
            6: [[6,0,0], [6,6,6], [0,0,0]],                   // J
            7: [[0,0,7], [7,7,7], [0,0,0]]                    // L
        };

        this.piece = null; // Current falling piece { matrix, x, y, type }
        
        this.handleInput = this.handleInput.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
    }

    resize() {
        if (!this.canvas) return;
        this.tileSize = Math.floor(this.canvas.height / this.rows);
        this.canvas.width = this.tileSize * this.cols;
    }

    start() {
        this.resize();
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOverState = false;
        this.isPaused = false;
        this.dropInterval = 1000;

        this.spawnPiece();
        this.lastDropTime = performance.now();
        
        if (this.timer) cancelAnimationFrame(this.timer);
        this.timer = requestAnimationFrame(this.gameLoop);

        window.removeEventListener('keydown', this.handleInput);
        window.addEventListener('keydown', this.handleInput);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) cancelAnimationFrame(this.timer);
        this.timer = null;
        window.removeEventListener('keydown', this.handleInput);
    }

    spawnPiece() {
        const type = Math.floor(Math.random() * 7) + 1;
        const matrix = JSON.parse(JSON.stringify(this.SHAPES[type]));
        
        this.piece = {
            matrix,
            x: Math.floor((this.cols - matrix[0].length) / 2),
            y: -1, // Start slightly above visible screen
            type
        };

        // Game Over Check
        if (this.checkCollision()) {
            this.gameOver();
        }
    }

    checkCollision(offsetX = 0, offsetY = 0, customMatrix = null) {
        const matrix = customMatrix || this.piece.matrix;
        const px = this.piece.x + offsetX;
        const py = this.piece.y + offsetY;

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] !== 0) {
                    const boardX = px + c;
                    const boardY = py + r;

                    if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
                        return true; // Wall/Floor hit
                    }

                    if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
                        return true; // Existing block hit
                    }
                }
            }
        }
        return false;
    }

    rotate() {
        const matrix = this.piece.matrix;
        const n = matrix.length;
        const rotated = Array(n).fill().map(() => Array(n).fill(0));

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                rotated[c][n - 1 - r] = matrix[r][c];
            }
        }

        // Wall kick: try pushing left or right if rotation collides with walls
        const originalMatrix = this.piece.matrix;
        this.piece.matrix = rotated;

        if (this.checkCollision()) {
            // Try kick right
            if (!this.checkCollision(1, 0)) { this.piece.x += 1; return; }
            // Try kick left
            if (!this.checkCollision(-1, 0)) { this.piece.x -= 1; return; }
            // Try kick up (kick off floor)
            if (!this.checkCollision(0, -1)) { this.piece.y -= 1; return; }

            // Revert
            this.piece.matrix = originalMatrix;
        }
    }

    move(dirX) {
        if (!this.checkCollision(dirX, 0)) {
            this.piece.x += dirX;
            this.draw();
        }
    }

    drop() {
        if (this.gameOverState || this.isPaused) return;

        if (!this.checkCollision(0, 1)) {
            this.piece.y += 1;
        } else {
            this.lockPiece();
        }
        this.lastDropTime = performance.now();
        this.draw();
    }

    hardDrop() {
        if (this.gameOverState || this.isPaused) return;
        
        let droppedLines = 0;
        while (!this.checkCollision(0, 1)) {
            this.piece.y += 1;
            droppedLines++;
        }
        this.score += droppedLines * 2;
        this.lockPiece();
        this.lastDropTime = performance.now();
        this.draw();
    }

    lockPiece() {
        const matrix = this.piece.matrix;
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] !== 0) {
                    const boardY = this.piece.y + r;
                    if (boardY >= 0) {
                        this.board[boardY][this.piece.x + c] = this.piece.type;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
    }

    clearLines() {
        let cleared = 0;
        
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(val => val !== 0)) {
                this.board.splice(r, 1);
                this.board.unshift(Array(this.cols).fill(0));
                cleared++;
                r++; // check same index again since it is shifted
            }
        }

        if (cleared > 0) {
            const linePoints = { 1: 100, 2: 300, 3: 500, 4: 800 };
            this.score += (linePoints[cleared] || 800) * this.level;
            this.lines += cleared;
            
            // Level up every 10 lines
            const nextLevel = Math.floor(this.lines / 10) + 1;
            if (nextLevel > this.level) {
                this.level = nextLevel;
                // speed up: drop interval decreases
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
            }
        }
    }

    getGhostY() {
        let ghostY = this.piece.y;
        while (!this.checkCollision(0, ghostY - this.piece.y + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    gameOver() {
        this.gameOverState = true;
        if (this.timer) cancelAnimationFrame(this.timer);
        if (this.callbacks.onEnd) this.callbacks.onEnd(this.score);
        this.draw();
    }

    gameLoop(timestamp) {
        if (this.gameOverState) return;

        if (!this.isPaused) {
            const elapsed = timestamp - this.lastDropTime;
            if (elapsed > this.dropInterval) {
                this.drop();
            }
        }

        this.draw();
        this.timer = requestAnimationFrame(this.gameLoop);
    }

    draw() {
        this.ctx.fillStyle = '#090d16'; // Match theme dark bg
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let c = 0; c <= this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * this.tileSize, 0);
            this.ctx.lineTo(c * this.tileSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let r = 0; r <= this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * this.tileSize);
            this.ctx.lineTo(this.canvas.width, r * this.tileSize);
            this.ctx.stroke();
        }

        // Draw locked board pieces
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== 0) {
                    this.drawBlock(c, r, this.COLORS[this.board[r][c]]);
                }
            }
        }

        // Draw ghost piece (projection)
        if (this.piece && !this.gameOverState && !this.isPaused) {
            const ghostY = this.getGhostY();
            const matrix = this.piece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] !== 0) {
                        this.drawBlock(this.piece.x + c, ghostY + r, this.COLORS[this.piece.type], true);
                    }
                }
            }
        }

        // Draw active falling piece
        if (this.piece && !this.gameOverState) {
            const matrix = this.piece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] !== 0) {
                        this.drawBlock(this.piece.x + c, this.piece.y + r, this.COLORS[this.piece.type]);
                    }
                }
            }
        }

        // Game Over Overlay
        if (this.gameOverState) {
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#f43f5e';
            this.ctx.font = '800 24px inherit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
        }
    }

    drawBlock(x, y, color, isGhost = false) {
        if (y < 0) return; // don't draw above screen

        const pad = 2;
        const rx = x * this.tileSize + pad;
        const ry = y * this.tileSize + pad;
        const size = this.tileSize - pad * 2;

        this.ctx.beginPath();
        if (isGhost) {
            // Draw outline for ghost piece
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([4, 2]); // dotted outline
            this.ctx.rect(rx, ry, size, size);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // reset
        } else {
            // Draw filled rounded rect for normal blocks
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            
            // Neon glow effect (soft shadow)
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 8;
            
            // Draw rounded rect manually
            const radius = 4;
            this.ctx.moveTo(rx + radius, ry);
            this.ctx.lineTo(rx + size - radius, ry);
            this.ctx.quadraticCurveTo(rx + size, ry, rx + size, ry + radius);
            this.ctx.lineTo(rx + size, ry + size - radius);
            this.ctx.quadraticCurveTo(rx + size, ry + size, rx + size - radius, ry + size);
            this.ctx.lineTo(rx + radius, ry + size - radius);
            this.ctx.quadraticCurveTo(rx, ry + size, rx, ry + size - radius);
            this.ctx.lineTo(rx, ry + radius);
            this.ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Reset shadows
            this.ctx.shadowBlur = 0;
        }
    }

    handleInput(e) {
        if (this.gameOverState) return;

        if (e.key === 'p' || e.key === 'P') {
            this.isPaused = !this.isPaused;
            this.draw();
            return;
        }

        if (this.isPaused) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.move(-1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.move(1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.drop();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'x':
            case 'X':
                this.rotate();
                this.draw();
                break;
            case ' ': // Space for hard drop
                e.preventDefault(); // Prevent scrolling page
                this.hardDrop();
                break;
        }
    }
}
