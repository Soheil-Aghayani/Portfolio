// Audio Synth Engine using Web Audio API (Lazily initialized)
class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(freqStart, freqEnd, type, duration, volume = 0.08) {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
        if (freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playBounce() {
        this.play(160, 280, 'triangle', 0.08, 0.1);
    }

    playArmored() {
        this.play(220, 110, 'square', 0.1, 0.07);
    }

    playBrick() {
        this.play(520, 180, 'sine', 0.12, 0.12);
    }

    playPowerup() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [293.66, 349.23, 440.00, 587.33]; // D minor arpeggio
        notes.forEach((note, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(note, now + idx * 0.05);
            gain.gain.setValueAtTime(0.08, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.05 + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.12);
        });
    }

    playLaser() {
        this.play(700, 250, 'sawtooth', 0.09, 0.02);
    }

    playLose() {
        this.play(260, 60, 'sine', 0.5, 0.18);
    }

    playWin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // Happy arpeggio
        notes.forEach((note, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(note, now + idx * 0.07);
            gain.gain.setValueAtTime(0.08, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.07 + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.22);
        });
    }
}

export class BreakoutGame {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.sound = new SoundEngine();

        this.score = 0;
        this.level = 1;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;

        this.basePaddleWidth = 72;
        this.paddleWidth = this.basePaddleWidth;
        this.paddleHeight = 10;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.prevPaddleX = this.paddleX;
        this.paddleTilt = 0;

        this.ballRadius = 5.5;
        this.balls = []; // Support multi-balls

        this.rightPressed = false;
        this.leftPressed = false;

        // Grid Configuration
        this.brickRowCount = 5;
        this.brickColumnCount = 6;
        this.brickWidth = 48;
        this.brickHeight = 13;
        this.brickPadding = 6;
        this.brickOffsetTop = 40;
        
        // Center brick offsets dynamically
        this.brickOffsetLeft = (this.canvas.width - (this.brickColumnCount * this.brickWidth + (this.brickColumnCount - 1) * this.brickPadding)) / 2;

        this.bricks = [];
        this.particles = [];
        this.powerups = [];
        this.lasers = [];
        this.floatingTexts = [];
        this.scanlineY = 0;

        // Visual feedback
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // Power-up States
        this.laserActive = false;
        this.laserTimeLeft = 0;
        this.shieldActive = false;
        this.wideTimeLeft = 0;
        this.lastLaserFire = 0;

        // Level Transition states
        this.isLevelTransition = false;
        this.transitionStartTime = 0;

        // Neon brick colors
        this.BRICK_COLORS = [
            '#fb7185', // Rose
            '#a78bfa', // Amethyst
            '#fb923c', // Sunset
            '#4ade80', // Green
            '#38bdf8'  // Frost
        ];

        this.BRICK_GRADIENTS = [
            ['#fb7185', '#be123c'],
            ['#a78bfa', '#6d28d9'],
            ['#fb923c', '#c2410c'],
            ['#4ade80', '#15803d'],
            ['#38bdf8', '#0369a1']
        ];

        // Layouts configuration: 0 = empty space, 1 = normal brick, 2 = double-life armored brick
        this.LAYOUTS = {
            1: [
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1]
            ],
            2: [
                [1, 0, 1, 1, 0, 1],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [1, 0, 1, 1, 0, 1]
            ],
            3: [
                [2, 0, 2, 0, 2, 0],
                [0, 1, 0, 1, 0, 1],
                [2, 0, 2, 0, 2, 0],
                [0, 1, 0, 1, 0, 1],
                [2, 2, 2, 2, 2, 2]
            ],
            4: [
                [0, 1, 0, 0, 1, 0],
                [0, 0, 1, 1, 0, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 0, 1, 1, 0, 1],
                [2, 1, 0, 0, 1, 2]
            ],
            5: [
                [2, 2, 2, 2, 2, 2],
                [2, 1, 1, 1, 1, 2],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [2, 2, 2, 2, 2, 2]
            ]
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        this.animationId = null;
        this.targetPaddleX = 0;
        this.targetSpeed = 4.5;
    }

    start() {
        this.sound.init(); // Warm audio context
        this.score = 0;
        this.level = 1;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;
        this.isLevelTransition = false;

        this.paddleWidth = this.basePaddleWidth;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.targetPaddleX = this.paddleX;
        this.prevPaddleX = this.paddleX;
        this.paddleTilt = 0;

        // Initialize single primary ball starting slow
        const baseSpeed = 2.6; // starts slow
        this.targetSpeed = 4.5;
        this.balls = [{
            x: this.canvas.width / 2,
            y: this.canvas.height - 25,
            dx: baseSpeed * 0.7 * (Math.random() > 0.5 ? 1 : -1),
            dy: -baseSpeed,
            trail: []
        }];

        this.particles = [];
        this.powerups = [];
        this.lasers = [];
        this.floatingTexts = [];
        this.scanlineY = 0;
        
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        this.laserActive = false;
        this.laserTimeLeft = 0;
        this.shieldActive = false;
        this.wideTimeLeft = 0;

        this.initBricks();

        // Bind events
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchstart', this.handleTouchStart);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
        window.addEventListener('touchstart', this.handleTouchStart, { passive: true });

        this.canvas.removeEventListener('mousedown', this.handleCanvasClick);
        this.canvas.addEventListener('mousedown', this.handleCanvasClick);

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = requestAnimationFrame(this.gameLoop);

        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('mousedown', this.handleCanvasClick);
    }

    initBricks() {
        this.bricks = [];
        const currentLayout = this.LAYOUTS[this.level] || this.LAYOUTS[1];
        
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                const brickType = currentLayout[r] ? (currentLayout[r][c] !== undefined ? currentLayout[r][c] : 1) : 0;
                
                this.bricks[c][r] = {
                    x: 0,
                    y: 0,
                    status: brickType, // 0 = empty, 1 = normal, 2 = double-life armored
                    initialStatus: brickType,
                    color: brickType === 2 ? '#94a3b8' : this.BRICK_COLORS[r],
                    gradient: brickType === 2 ? ['#e2e8f0', '#475569'] : this.BRICK_GRADIENTS[r]
                };
            }
        }
    }

    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            this.rightPressed = true;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            this.leftPressed = true;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            if (this.laserActive && !this.gameOverState && !this.isLevelTransition) {
                e.preventDefault();
                this.fireLaser();
            }
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
        const scaleX = this.canvas.width / rect.width;
        const relativeX = (e.clientX - rect.left) * scaleX;
        const clampedX = Math.max(0, Math.min(relativeX, this.canvas.width));
        this.targetPaddleX = clampedX - this.paddleWidth / 2;
    }

    handleTouchMove(e) {
        if (e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const relativeX = (e.touches[0].clientX - rect.left) * scaleX;
        const clampedX = Math.max(0, Math.min(relativeX, this.canvas.width));
        this.targetPaddleX = clampedX - this.paddleWidth / 2;
    }

    handleTouchStart(e) {
        if (e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const relativeX = (e.touches[0].clientX - rect.left) * scaleX;
        const clampedX = Math.max(0, Math.min(relativeX, this.canvas.width));
        this.targetPaddleX = clampedX - this.paddleWidth / 2;
    }

    handleCanvasClick(e) {
        if (this.laserActive && !this.gameOverState && !this.isPaused && !this.isLevelTransition) {
            this.fireLaser();
        }
    }

    fireLaser() {
        const now = Date.now();
        if (now - this.lastLaserFire < 220) return; // Laser fire rate cap
        this.lastLaserFire = now;

        this.sound.playLaser();
        this.triggerShake(3, 8);

        // Spawn double laser lines from left & right corners of the paddle
        this.lasers.push({ x: this.paddleX + 6, y: this.canvas.height - 18 });
        this.lasers.push({ x: this.paddleX + this.paddleWidth - 6, y: this.canvas.height - 18 });
    }

    triggerShake(duration, intensity) {
        this.shakeTime = duration;
        this.shakeIntensity = intensity;
    }

    spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1.2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                radius: Math.random() * 2.8 + 1,
                alpha: 1.0,
                decay: Math.random() * 0.025 + 0.018,
                color
            });
        }
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x,
            y,
            text,
            alpha: 1.0,
            color
        });
    }

    spawnPowerup(x, y) {
        if (Math.random() > 0.22) return; // 22% chance to drop power-up

        const types = [
            { type: 'BALL', symbol: 'B', color: '#38bdf8' },  // Multi-Ball
            { type: 'WIDE', symbol: 'W', color: '#4ade80' },  // Wide paddle
            { type: 'LASER', symbol: 'L', color: '#fb7185' }, // Laser weapon
            { type: 'SHIELD', symbol: 'S', color: '#fb923c' } // Shield save
        ];

        const roll = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
            x,
            y,
            vy: 1.8,
            symbol: roll.symbol,
            color: roll.color,
            type: roll.type,
            radius: 8
        });
    }

    hitBrick(b, r) {
        if (b.status === 2) {
            // Decement armored block to cracked normal block
            b.status = 1;
            b.color = this.BRICK_COLORS[r];
            b.gradient = this.BRICK_GRADIENTS[r];
            
            this.sound.playArmored();
            this.triggerShake(3, 4);
            this.score += 5;
            this.spawnParticles(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, '#94a3b8', 6);
            this.spawnFloatingText(b.x + this.brickWidth / 2, b.y, '+5', '#94a3b8');
        } else {
            // Break completely
            this.sound.playBrick();
            this.triggerShake(5, 6);
            b.status = 0;
            this.score += 10;
            
            this.spawnParticles(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.color);
            this.spawnFloatingText(b.x + this.brickWidth / 2, b.y, '+10', b.color);
            this.spawnPowerup(b.x + this.brickWidth / 2, b.y + this.brickHeight);
        }

        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);

        if (this.checkWin()) {
            this.advanceLevel();
        }
    }

    advanceLevel() {
        if (this.level < 5) {
            this.isLevelTransition = true;
            this.transitionStartTime = performance.now();
            
            this.level++;
            this.sound.playPowerup();

            // Clear current in-flight bullets and drops
            this.powerups = [];
            this.lasers = [];

            // Spawn floating text on level complete
            this.spawnFloatingText(this.canvas.width / 2, this.canvas.height / 2, `LEVEL ${this.level}`, 'var(--primary)');
        } else {
            this.won = true;
            this.gameOverState = true;
            this.sound.playWin();
            if (this.callbacks.onEnd) this.callbacks.onEnd(this.score, true);
        }
    }

    executeLevelLoad() {
        this.isLevelTransition = false;
        
        // Reset paddle width and active states
        this.paddleWidth = this.basePaddleWidth;
        this.laserActive = false;
        this.shieldActive = false;

        // Reset ball position and multiply speeds (starts slow, targets higher speed)
        const baseSpeed = 2.6 + (this.level - 1) * 0.45;
        this.targetSpeed = 4.5 + (this.level - 1) * 0.45;
        this.balls = [{
            x: this.canvas.width / 2,
            y: this.canvas.height - 25,
            dx: baseSpeed * 0.7 * (Math.random() > 0.5 ? 1 : -1),
            dy: -baseSpeed,
            trail: []
        }];

        this.initBricks();
        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
    }

    collisionDetection() {
        this.balls.forEach((ball) => {
            for (let c = 0; c < this.brickColumnCount; c++) {
                for (let r = 0; r < this.brickRowCount; r++) {
                    const b = this.bricks[c][r];
                    if (b.status > 0) {
                        // Aabb box overlap collision
                        if (
                            ball.x + this.ballRadius > b.x &&
                            ball.x - this.ballRadius < b.x + this.brickWidth &&
                            ball.y + this.ballRadius > b.y &&
                            ball.y - this.ballRadius < b.y + this.brickHeight
                        ) {
                            // Bounce physics off bricks first
                            const prevX = ball.x - ball.dx;
                            const prevY = ball.y - ball.dy;

                            if (prevX + this.ballRadius <= b.x || prevX - this.ballRadius >= b.x + this.brickWidth) {
                                ball.dx = -ball.dx;
                            } else {
                                ball.dy = -ball.dy;
                            }

                            // Dynamic speed ramp
                            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                            if (speed < this.targetSpeed) {
                                const newSpeed = Math.min(speed * 1.025, this.targetSpeed);
                                ball.dx = (ball.dx / speed) * newSpeed;
                                ball.dy = (ball.dy / speed) * newSpeed;
                            } else if (speed < 7.2) {
                                const newSpeed = Math.min(speed * 1.004, 7.2);
                                ball.dx = (ball.dx / speed) * newSpeed;
                                ball.dy = (ball.dy / speed) * newSpeed;
                            }

                            // Register the hit consequence
                            this.hitBrick(b, r);
                            return;
                        }
                    }
                }
            }
        });
    }

    checkWin() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status > 0) return false;
            }
        }
        return true;
    }

    drawBackground() {
        // Tron Grid background
        this.ctx.fillStyle = '#090d16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw horizontal grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw vertical grid lines
        for (let x = 0; x < this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw scanline
        this.scanlineY += 1.2;
        if (this.scanlineY > this.canvas.height) this.scanlineY = 0;
        this.ctx.fillStyle = 'rgba(45, 212, 191, 0.03)';
        this.ctx.fillRect(0, this.scanlineY - 4, this.canvas.width, 8);
    }

    drawBalls() {
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';

        this.balls.forEach((ball) => {
            // Draw neon tail ribbon
            if (ball.trail.length > 1) {
                this.ctx.save();
                this.ctx.lineWidth = 4.5;
                this.ctx.lineCap = 'round';
                for (let i = 1; i < ball.trail.length; i++) {
                    const start = ball.trail[i - 1];
                    const end = ball.trail[i];
                    const alpha = (i / ball.trail.length) * 0.35;
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    this.ctx.shadowBlur = 6;
                    this.ctx.shadowColor = primaryColor;
                    this.ctx.beginPath();
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(end.x, end.y);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }

            // Draw core ball
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = primaryColor;
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawPaddle() {
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';
        const paddleY = this.canvas.height - this.paddleHeight - 8;

        this.ctx.save();
        
        // Translate the paddle based on current position
        this.ctx.translate(this.paddleX + this.paddleWidth / 2, paddleY + this.paddleHeight / 2);
        
        // Draw Glassmorphic paddle base
        const grad = this.ctx.createLinearGradient(
            -this.paddleWidth / 2, -this.paddleHeight / 2,
            -this.paddleWidth / 2, this.paddleHeight / 2
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, primaryColor);

        this.ctx.beginPath();
        this.ctx.roundRect(-this.paddleWidth / 2, -this.paddleHeight / 2, this.paddleWidth, this.paddleHeight, 5);
        this.ctx.fillStyle = grad;
        this.ctx.shadowBlur = 14;
        this.ctx.shadowColor = primaryColor;
        this.ctx.fill();

        // Laser Guns Visual
        if (this.laserActive) {
            this.ctx.fillStyle = '#fb7185';
            this.ctx.fillRect(-this.paddleWidth / 2, -this.paddleHeight / 2 - 4, 4, 5); // left nozzle
            this.ctx.fillRect(this.paddleWidth / 2 - 4, -this.paddleHeight / 2 - 4, 4, 5); // right nozzle
            
            // Add muzzle flash glow
            this.ctx.shadowColor = '#fb7185';
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(-this.paddleWidth / 2 + 1, -this.paddleHeight / 2 - 2, 2, 2);
            this.ctx.fillRect(this.paddleWidth / 2 - 3, -this.paddleHeight / 2 - 2, 2, 2);
        }

        this.ctx.restore();
    }

    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status > 0) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    b.x = brickX;
                    b.y = brickY;

                    this.ctx.save();
                    
                    // Create linear gradients for depth
                    const grad = this.ctx.createLinearGradient(brickX, brickY, brickX, brickY + this.brickHeight);
                    grad.addColorStop(0, b.color);
                    grad.addColorStop(1, b.gradient[1]);

                    this.ctx.beginPath();
                    this.ctx.roundRect(brickX, brickY, this.brickWidth, this.brickHeight, 3.5);
                    this.ctx.fillStyle = grad;
                    this.ctx.strokeStyle = b.initialStatus === 2 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)';
                    this.ctx.lineWidth = b.initialStatus === 2 ? 1.5 : 1;
                    
                    this.ctx.shadowBlur = 6;
                    this.ctx.shadowColor = b.color;
                    
                    this.ctx.fill();
                    this.ctx.stroke();

                    // Reflection line
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(brickX + 2, brickY + 1.5, this.brickWidth - 4, 1.5);

                    // Draw cracks if previously armored and currently cracked
                    if (b.initialStatus === 2 && b.status === 1) {
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                        this.ctx.lineWidth = 1.2;
                        this.ctx.beginPath();
                        
                        this.ctx.moveTo(brickX + 4, brickY + 3);
                        this.ctx.lineTo(brickX + 11, brickY + 9);
                        this.ctx.lineTo(brickX + 19, brickY + 4);

                        this.ctx.moveTo(brickX + this.brickWidth - 7, brickY + 2);
                        this.ctx.lineTo(brickX + this.brickWidth - 13, brickY + 7);
                        this.ctx.lineTo(brickX + this.brickWidth - 19, brickY + 4);

                        this.ctx.stroke();
                    }
                    
                    this.ctx.restore();
                }
            }
        }
    }

    drawPowerups() {
        this.powerups.forEach((pu) => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
            
            // Neon pill background
            this.ctx.fillStyle = pu.color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = pu.color;
            this.ctx.fill();
            this.ctx.stroke();

            // Draw center character code
            this.ctx.fillStyle = '#0f172a';
            this.ctx.font = 'bold 10px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(pu.symbol, pu.x, pu.y);
            this.ctx.restore();
        });
    }

    drawLasers() {
        this.ctx.save();
        this.ctx.fillStyle = '#fb7185';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#fb7185';
        
        this.lasers.forEach((laser) => {
            this.ctx.fillRect(laser.x - 1, laser.y - 10, 2.5, 12);
        });
        
        this.ctx.restore();
    }

    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // soft gravity
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

    drawFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 0.65; // float upward
            ft.alpha -= 0.022; // fade out

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 12px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = ft.color;
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }

    drawShield() {
        if (!this.shieldActive) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#fb923c';
        this.ctx.lineWidth = 3.5;
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = '#fb923c';
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 3);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 3);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawPause() {
        this.ctx.fillStyle = 'rgba(9, 13, 22, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

        this.ctx.font = '12px Outfit, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillText('Press P or Click Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 15);
    }

    drawLevelBanner() {
        this.ctx.fillStyle = 'rgba(9, 13, 22, 0.55)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.shadowColor = 'var(--primary)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 - 5);

        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '11px Outfit, sans-serif';
        this.ctx.fillText('GET READY...', this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.restore();
    }

    gameLoop(timestamp) {
        if (this.gameOverState || this.isPaused) {
            // Render basic layouts on pause/game over
            this.drawBackground();
            this.drawBricks();
            this.drawBalls();
            this.drawPaddle();
            this.drawParticles();
            this.drawFloatingTexts();
            if (this.isPaused) this.drawPause();

            this.animationId = requestAnimationFrame(this.gameLoop);
            return;
        }

        if (this.isLevelTransition) {
            // Level transition banner screen
            const elapsed = timestamp - this.transitionStartTime;
            if (elapsed > 1200) {
                this.executeLevelLoad();
            } else {
                this.drawBackground();
                this.drawPaddle();
                this.drawParticles();
                this.drawLevelBanner();
            }
            this.animationId = requestAnimationFrame(this.gameLoop);
            return;
        }

        // Timer decrements for power-ups
        if (this.laserActive) {
            this.laserTimeLeft--;
            if (this.laserTimeLeft <= 0) {
                this.laserActive = false;
                this.spawnFloatingText(this.paddleX + this.paddleWidth / 2, this.canvas.height - 20, 'LASERS EXPIRED', '#fb7185');
            }
        }
        if (this.wideTimeLeft > 0) {
            this.wideTimeLeft--;
            if (this.wideTimeLeft <= 0) {
                this.paddleWidth = this.basePaddleWidth;
                this.spawnFloatingText(this.paddleX + this.paddleWidth / 2, this.canvas.height - 20, 'PADDLE SHRUNK', '#4ade80');
            }
        }

        // Screen Shake calculation
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeTime > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeTime--;
        }

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        this.drawBackground();
        this.drawBricks();
        this.drawShield();
        this.drawLasers();
        this.drawPowerups();
        this.drawBalls();
        this.drawPaddle();
        this.drawParticles();
        this.drawFloatingTexts();

        this.collisionDetection();

        // 1. Move and update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.y -= 4.5; // travel speed

            // Check hit with active bricks
            let hit = false;
            for (let c = 0; c < this.brickColumnCount; c++) {
                for (let r = 0; r < this.brickRowCount; r++) {
                    const b = this.bricks[c][r];
                    if (b.status > 0) {
                        if (laser.x > b.x && laser.x < b.x + this.brickWidth && laser.y > b.y && laser.y < b.y + this.brickHeight) {
                            hit = true;
                            this.hitBrick(b, r);
                            break;
                        }
                    }
                }
                if (hit) break;
            }

            if (hit || laser.y < 0) {
                this.lasers.splice(i, 1);
            }
        }

        // 2. Move and update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.y += pu.vy;

            // Check paddle collision
            const paddleY = this.canvas.height - this.paddleHeight - 8;
            if (
                pu.y + pu.radius > paddleY &&
                pu.y - pu.radius < paddleY + this.paddleHeight &&
                pu.x + pu.radius > this.paddleX &&
                pu.x - pu.radius < this.paddleX + this.paddleWidth
            ) {
                this.sound.playPowerup();
                this.score += 50;
                this.spawnParticles(pu.x, pu.y, pu.color, 15);
                this.spawnFloatingText(pu.x, pu.y - 10, `${pu.type}! +50`, pu.color);

                // Apply powerup
                if (pu.type === 'BALL') {
                    // Spawn 2 extra balls
                    const baseBall = this.balls[0] || { x: this.canvas.width / 2, y: this.canvas.height - 30, dx: 3, dy: -3 };
                    this.balls.push({
                        x: baseBall.x,
                        y: baseBall.y,
                        dx: baseBall.dx + (Math.random() - 0.5) * 1.5,
                        dy: -Math.abs(baseBall.dy),
                        trail: []
                    });
                    this.balls.push({
                        x: baseBall.x,
                        y: baseBall.y,
                        dx: baseBall.dx + (Math.random() - 0.5) * 1.5,
                        dy: -Math.abs(baseBall.dy),
                        trail: []
                    });
                } else if (pu.type === 'WIDE') {
                    this.paddleWidth = 110;
                    this.wideTimeLeft = 450; // ~7.5 seconds
                } else if (pu.type === 'LASER') {
                    this.laserActive = true;
                    this.laserTimeLeft = 360; // ~6 seconds
                } else if (pu.type === 'SHIELD') {
                    this.shieldActive = true;
                }

                if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);

                this.powerups.splice(i, 1);
                continue;
            }

            // Exceeded canvas bottom
            if (pu.y - pu.radius > this.canvas.height) {
                this.powerups.splice(i, 1);
            }
        }

        // 3. Move and update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            
            // Record tail path
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 8) ball.trail.shift();

            // Wall bounce (Left/Right)
            if (ball.x + ball.dx > this.canvas.width - this.ballRadius || ball.x + ball.dx < this.ballRadius) {
                ball.dx = -ball.dx;
                this.sound.playBounce();
            }

            // Ceiling bounce
            if (ball.y + ball.dy < this.ballRadius) {
                ball.dy = -ball.dy;
                this.sound.playBounce();
            }
            // Bottom boundary logic
            else if (ball.y + ball.dy > this.canvas.height - this.ballRadius - 5) {
                // Check paddle overlap
                const paddleY = this.canvas.height - this.paddleHeight - 8;
                if (ball.x > this.paddleX && ball.x < this.paddleX + this.paddleWidth) {
                    this.sound.playBounce();
                    this.triggerShake(4, 5);

                    // Angle alteration depending on impact offset from paddle center
                    const hitPoint = (ball.x - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    const speedUpMultiplier = speed < this.targetSpeed ? 1.025 : 1.004;
                    const newSpeed = Math.min(speed * speedUpMultiplier, 7.2);
                    
                    ball.dx = hitPoint * 4.2;
                    ball.dy = -Math.sqrt(Math.max(9, newSpeed * newSpeed - ball.dx * ball.dx));
                }
                // Shield save fallback
                else if (this.shieldActive) {
                    this.shieldActive = false;
                    ball.dy = -ball.dy;
                    this.sound.playBounce();
                    this.triggerShake(8, 10);
                    this.spawnFloatingText(this.canvas.width / 2, this.canvas.height - 20, 'SHIELD TRIGGERED', '#fb923c');
                }
                // Ball lost
                else {
                    if (window.godModeActive) {
                        ball.dy = -Math.abs(ball.dy);
                        this.sound.playBounce();
                        this.triggerShake(4, 5);
                        this.spawnFloatingText(ball.x, this.canvas.height - 20, 'AUTO BOUNCE', '#fbbf24');
                        continue;
                    }
                    this.spawnParticles(ball.x, ball.y, '#ffffff', 20); // big spark loss
                    this.balls.splice(i, 1);
                    continue;
                }
            }

            ball.x += ball.dx;
            ball.y += ball.dy;
        }

        // If no balls remaining, Game Over
        if (this.balls.length === 0) {
            this.gameOverState = true;
            this.sound.playLose();
            if (this.callbacks.onEnd) {
                this.callbacks.onEnd(this.score, false);
            }
            this.ctx.restore();
            this.animationId = requestAnimationFrame(this.gameLoop);
            return;
        }

        // Smoothly handle paddle motion and tilt
        const prevX = this.paddleX;
        if (this.rightPressed) {
            this.targetPaddleX = Math.min(this.targetPaddleX + 7.5, this.canvas.width - this.paddleWidth);
        } else if (this.leftPressed) {
            this.targetPaddleX = Math.max(this.targetPaddleX - 7.5, 0);
        }

        // Interpolate paddleX towards targetPaddleX for smooth glide movement
        this.paddleX += (this.targetPaddleX - this.paddleX) * 0.32;
        this.paddleX = Math.max(0, Math.min(this.paddleX, this.canvas.width - this.paddleWidth));
        


        this.ctx.restore(); // end screen shake translation

        this.animationId = requestAnimationFrame(this.gameLoop);
    }
}
