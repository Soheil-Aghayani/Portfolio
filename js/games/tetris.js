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
        
        this.particles = [];
        this.scanlineY = 0;

        // Clear animation state variables
        this.isClearingAnimation = false;
        this.clearingRows = [];
        this.clearingStartTime = 0;
        this.pendingClearedCount = 0;

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

        // Linear Gradient Color Pairs [Start, End]
        this.GRADIENTS = {
            1: ['#2dd4bf', '#0f766e'],
            2: ['#a78bfa', '#6d28d9'],
            3: ['#fb923c', '#c2410c'],
            4: ['#10b981', '#047857'],
            5: ['#fb7185', '#be123c'],
            6: ['#38bdf8', '#0369a1'],
            7: ['#fbbf24', '#b45309']
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
        this.particles = [];
        this.scanlineY = 0;

        this.isClearingAnimation = false;
        this.clearingRows = [];
        this.clearingStartTime = 0;
        this.pendingClearedCount = 0;

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
            if (window.godModeActive) {
                // God Mode Saves the Day! Shift everything down by 6 rows.
                for (let r = this.rows - 1; r >= 6; r--) {
                    this.board[r] = [...this.board[r - 6]];
                }
                for (let r = 0; r < 6; r++) {
                    this.board[r] = Array(this.cols).fill(0);
                }
                this.piece.y = -1;
                this.piece.x = Math.floor((this.cols - this.piece.matrix[0].length) / 2);
                this.score = Math.max(0, this.score - 200); // Small penalty or correction
                if (this.elScore) this.elScore.textContent = this.score;
                return;
            }
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
        }
    }

    drop() {
        if (this.gameOverState || this.isPaused || this.isClearingAnimation) return;

        if (!this.checkCollision(0, 1)) {
            this.piece.y += 1;
        } else {
            this.lockPiece();
        }
        this.lastDropTime = performance.now();
    }

    hardDrop() {
        if (this.gameOverState || this.isPaused || this.isClearingAnimation) return;
        
        let droppedLines = 0;
        while (!this.checkCollision(0, 1)) {
            this.piece.y += 1;
            droppedLines++;
        }
        this.score += droppedLines * 2;
        this.lockPiece();
        this.lastDropTime = performance.now();
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

        const linesWereCleared = this.clearLines();
        if (!linesWereCleared) {
            this.spawnPiece();
            if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
        }
    }

    clearLines() {
        const fullRows = [];
        for (let r = 0; r < this.rows; r++) {
            if (this.board[r].every(val => val !== 0 && val !== -1)) {
                fullRows.push(r);
            }
        }

        if (fullRows.length > 0) {
            this.isClearingAnimation = true;
            this.clearingRows = fullRows;
            this.clearingStartTime = performance.now();
            
            // Mark rows as clearing (-1) for flash effect
            fullRows.forEach(r => {
                this.board[r].fill(-1);
            });

            this.pendingClearedCount = fullRows.length;
            return true;
        }

        return false;
    }

    executeLineClear() {
        let cleared = this.pendingClearedCount;
        
        // Remove clearing rows (-1) and trigger shockwaves
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(val => val === -1)) {
                // Spawn row explosion particles
                for (let c = 0; c < this.cols; c++) {
                    const xCenter = c * this.tileSize + this.tileSize / 2;
                    const yCenter = r * this.tileSize + this.tileSize / 2;
                    
                    // Create white sparks
                    for (let k = 0; k < 6; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 4.5 + 1.5;
                        this.particles.push({
                            x: xCenter,
                            y: yCenter,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed - 1, // slight upwards bias
                            color: '#ffffff',
                            size: Math.random() * 3.5 + 1.5,
                            alpha: 1.0,
                            life: 20 + Math.random() * 20
                        });
                    }

                    // Create colored theme sparks
                    const randomThemeColor = Object.values(this.COLORS)[Math.floor(Math.random() * 7)];
                    for (let k = 0; k < 3; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 3.2 + 1;
                        this.particles.push({
                            x: xCenter,
                            y: yCenter,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed - 0.5,
                            color: randomThemeColor,
                            size: Math.random() * 2.5 + 1,
                            alpha: 1.0,
                            life: 25 + Math.random() * 25
                        });
                    }
                }

                // Spawn shockwave ring particles at the center of the row
                const midX = (this.cols * this.tileSize) / 2;
                const midY = r * this.tileSize + this.tileSize / 2;
                for (let i = 0; i < 18; i++) {
                    const angle = (i / 18) * Math.PI * 2;
                    const speed = 6.2; // fast shockwave
                    this.particles.push({
                        x: midX,
                        y: midY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed * 0.45,
                        color: 'rgba(255, 255, 255, 0.95)',
                        size: 4.8,
                        alpha: 1.0,
                        life: 16
                    });
                }

                this.board.splice(r, 1);
                this.board.unshift(Array(this.cols).fill(0));
                r++; // check same index
            }
        }

        const linePoints = { 1: 100, 2: 300, 3: 500, 4: 800 };
        this.score += (linePoints[cleared] || 800) * this.level;
        this.lines += cleared;
        
        // Level up every 10 lines
        const nextLevel = Math.floor(this.lines / 10) + 1;
        if (nextLevel > this.level) {
            this.level = nextLevel;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
        }

        this.isClearingAnimation = false;
        this.clearingRows = [];
        this.pendingClearedCount = 0;

        this.spawnPiece();
        this.lastDropTime = performance.now();
        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
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
        if (this.callbacks.onEnd) this.callbacks.onEnd(this.score);
    }

    gameLoop(timestamp) {
        if (!this.isPaused && !this.gameOverState) {
            if (this.isClearingAnimation) {
                const elapsed = timestamp - this.clearingStartTime;
                if (elapsed > 250) { // 250ms clear flash
                    this.executeLineClear();
                }
            } else {
                const elapsed = timestamp - this.lastDropTime;
                if (elapsed > this.dropInterval) {
                    this.drop();
                }
            }
        }

        this.draw();
        this.timer = requestAnimationFrame(this.gameLoop);
    }

    draw() {
        this.ctx.fillStyle = '#090d16'; // Match theme dark bg
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw grid lines (pulsing)
        const pulseOpacity = 0.02 + Math.sin(Date.now() / 250) * 0.012;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
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

        // 2. Draw locked board pieces
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== 0) {
                    this.drawBlock(c, r, this.COLORS[this.board[r][c]], false, this.board[r][c]);
                }
            }
        }

        // 3. Draw ghost piece (projection)
        if (this.piece && !this.gameOverState && !this.isPaused && !this.isClearingAnimation) {
            const ghostY = this.getGhostY();
            const matrix = this.piece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] !== 0) {
                        this.drawBlock(this.piece.x + c, ghostY + r, this.COLORS[this.piece.type], true, this.piece.type);
                    }
                }
            }
        }

        // 4. Draw active falling piece
        if (this.piece && !this.gameOverState && !this.isClearingAnimation) {
            const matrix = this.piece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] !== 0) {
                        this.drawBlock(this.piece.x + c, this.piece.y + r, this.COLORS[this.piece.type], false, this.piece.type);
                    }
                }
            }
        }

        // 5. Draw Sweeping Scanline
        this.scanlineY += 1.8;
        if (this.scanlineY > this.canvas.height) {
            this.scanlineY = 0;
        }
        this.ctx.save();
        const scanGrad = this.ctx.createLinearGradient(0, this.scanlineY - 10, 0, this.scanlineY + 10);
        scanGrad.addColorStop(0, 'rgba(45, 212, 191, 0)');
        scanGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.04)');
        scanGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
        this.ctx.fillStyle = scanGrad;
        this.ctx.fillRect(0, this.scanlineY - 10, this.canvas.width, 20);
        this.ctx.restore();

        // 6. Draw and Update Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06; // gravity
            p.vx *= 0.98; // air drag
            p.size = Math.max(0.1, p.size - 0.04); // shrink particle over time
            p.alpha -= 0.022;
            p.life -= 1;
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(idx, 1);
                return;
            }
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 7. Game Over Dark Overlay
        if (this.gameOverState) {
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 8. Paused Overlay
        if (this.isPaused) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

            this.ctx.font = '10px Outfit, sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText('Press P or Click Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 15);
            this.ctx.restore();
        }
    }

    drawBlock(x, y, color, isGhost = false, blockType = 1) {
        if (y < 0) return; // don't draw above screen

        const pad = 2;
        const rx = x * this.tileSize + pad;
        const ry = y * this.tileSize + pad;
        const size = this.tileSize - pad * 2;

        this.ctx.beginPath();
        if (blockType === -1) {
            // Full glowing white row during clear flash
            this.ctx.save();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 18;
            
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
            this.ctx.restore();
            return;
        }

        if (isGhost) {
            // Draw ghost piece: subtle filled rectangle with glow outline
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(rx, ry, size, size);

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([4, 2]); // dotted outline
            this.ctx.rect(rx, ry, size, size);
            this.ctx.stroke();
            this.ctx.restore();
        } else {
            // Draw filled rounded rect for normal blocks with gradient and gloss
            this.ctx.save();
            
            // Linear Gradient
            const grad = this.ctx.createLinearGradient(rx, ry, rx, ry + size);
            const mainColor = color;
            const darkColor = this.GRADIENTS[blockType] ? this.GRADIENTS[blockType][1] : color;
            grad.addColorStop(0, mainColor);
            grad.addColorStop(1, darkColor);

            this.ctx.fillStyle = grad;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
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
            
            // Reset shadows for gloss
            this.ctx.shadowBlur = 0;

            // Draw glossy reflection shines
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            this.ctx.fillRect(rx + 2, ry + 2, size - 4, 2.5); // horizontal top glossy shine
            this.ctx.fillRect(rx + 2, ry + 2, 2.5, size - 4); // vertical left glossy shine
            
            this.ctx.restore();
        }
    }

    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastDropTime = performance.now();
        }
        this.draw();
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    handleInput(e) {
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        if (this.gameOverState || this.isPaused || this.isClearingAnimation) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.move(-1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.move(1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.drop();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'x':
            case 'X':
                e.preventDefault();
                this.rotate();
                break;
            case ' ': // Space for hard drop
                e.preventDefault(); // Prevent scrolling page
                this.hardDrop();
                break;
        }
    }
}
