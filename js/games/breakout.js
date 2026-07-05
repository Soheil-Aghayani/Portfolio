
export class BreakoutGame {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.score = 0;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;

        this.paddleHeight = 10;
        this.paddleWidth = 70;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;

        this.ballRadius = 5;
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 30;
        this.dx = 3.5;
        this.dy = -3.5;

        this.rightPressed = false;
        this.leftPressed = false;

        // Grid Configuration
        this.brickRowCount = 5;
        this.brickColumnCount = 6;
        this.brickWidth = 48;
        this.brickHeight = 14;
        this.brickPadding = 6;
        this.brickOffsetTop = 40;
        this.brickOffsetLeft = 20;

        this.bricks = [];
        this.particles = [];

        // Neon Glowing Colors for Rows
        this.BRICK_COLORS = [
            '#fb7185', // Row 0: Rose
            '#a78bfa', // Row 1: Amethyst
            '#fb923c', // Row 2: Sunset
            '#4ade80', // Row 3: Green
            '#38bdf8'  // Row 4: Frost
        ];

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        this.animationId = null;
    }

    start() {
        this.score = 0;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;

        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 30;
        this.dx = 3 + Math.random(); // slightly randomized angle
        this.dy = -3.5;

        this.particles = [];
        this.initBricks();

        // Bind events
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: true });

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = requestAnimationFrame(this.gameLoop);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        }
    }

    initBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = { x: 0, y: 0, status: 1, color: this.BRICK_COLORS[r] };
            }
        }
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            this.rightPressed = true;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            this.leftPressed = true;
        }
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
            this.rightPressed = false;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
            this.leftPressed = false;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const root = document.documentElement;
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < this.canvas.width) {
            this.paddleX = relativeX - this.paddleWidth / 2;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const relativeX = e.touches[0].clientX - rect.left;
        if (relativeX > 0 && relativeX < this.canvas.width) {
            this.paddleX = relativeX - this.paddleWidth / 2;
        }
    }

    spawnParticles(x, y, color) {
        // Spawn 8-10 glowing particles on brick break
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: Math.random() * 2 + 1,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.015,
                color
            });
        }
    }

    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    if (this.x > b.x && this.x < b.x + this.brickWidth && this.y > b.y && this.y < b.y + this.brickHeight) {
                        this.dy = -this.dy;
                        b.status = 0;
                        this.score += 10;
                        this.spawnParticles(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.color);
                        
                        // Increase ball speed slightly as game progresses
                        this.dx *= 1.01;
                        this.dy *= 1.01;

                        if (this.callbacks.onScore) {
                            this.callbacks.onScore(this.score);
                        }

                        // Check Win
                        if (this.checkWin()) {
                            this.won = true;
                            this.gameOverState = true;
                            if (this.callbacks.onEnd) {
                                this.callbacks.onEnd(this.score, true);
                            }
                        }
                    }
                }
            }
        }
    }

    checkWin() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) return false;
            }
        }
        return true;
    }

    drawBall() {
        // Outer glowing ball
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = primaryColor;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPaddle() {
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddleX, this.canvas.height - this.paddleHeight - 5, this.paddleWidth, this.paddleHeight, 4);
        this.ctx.fillStyle = primaryColor;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = primaryColor;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.roundRect(brickX, brickY, this.brickWidth, this.brickHeight, 3);
                    this.ctx.fillStyle = this.bricks[c][r].color;
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowColor = this.bricks[c][r].color;
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
        }
    }

    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawPause() {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }

    gameLoop() {
        if (this.gameOverState || this.isPaused) {
            if (this.gameOverState) {
                this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = this.won ? '#2dd4bf' : '#ef4444';
                this.ctx.font = 'bold 24px Outfit, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.won ? 'YOU WIN!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.font = '14px Outfit, sans-serif';
                this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            }
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        this.drawParticles();
        this.collisionDetection();

        // Boundary collision logic (Left/Right)
        if (this.x + this.dx > this.canvas.width - this.ballRadius || this.x + this.dx < this.ballRadius) {
            this.dx = -this.dx;
        }

        // Top collision logic
        if (this.y + this.dy < this.ballRadius) {
            this.dy = -this.dy;
        } 
        // Bottom boundary check
        else if (this.y + this.dy > this.canvas.height - this.ballRadius - 5) {
            // Check if ball hits the paddle
            if (this.x > this.paddleX && this.x < this.paddleX + this.paddleWidth) {
                // Calculate hit angle reflection depending on where the ball lands on paddle
                const hitPoint = (this.x - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                
                this.dx = hitPoint * 4.5;
                // Re-balance dy based on speed to prevent ball from losing vertical energy
                this.dy = -Math.sqrt(Math.max(4, currentSpeed * currentSpeed - this.dx * this.dx));
            } else {
                // Game Over
                this.gameOverState = true;
                if (this.callbacks.onEnd) {
                    this.callbacks.onEnd(this.score, false);
                }
                return;
            }
        }

        // Move paddle
        if (this.rightPressed) {
            this.paddleX = Math.min(this.paddleX + 7, this.canvas.width - this.paddleWidth);
        } else if (this.leftPressed) {
            this.paddleX = Math.max(this.paddleX - 7, 0);
        }

        this.x += this.dx;
        this.y += this.dy;

        this.animationId = requestAnimationFrame(this.gameLoop);
    }
}
