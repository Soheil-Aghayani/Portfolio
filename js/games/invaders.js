// Space Invaders / Galaga Space Shooter Game
// Web Audio Synth Engine for Space Invaders
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

    playLaser() {
        this.play(650, 150, 'sawtooth', 0.08, 0.03);
    }

    playExplosion() {
        this.play(300, 40, 'triangle', 0.18, 0.15);
    }

    playHit() {
        this.play(200, 80, 'square', 0.12, 0.08);
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
            gain.gain.setValueAtTime(0.06, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.07 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.2);
        });
    }

    playLose() {
        this.play(200, 50, 'sine', 0.6, 0.18);
    }
}

export class InvadersGame {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.sound = new SoundEngine();

        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;

        // Player Ship Config
        this.playerWidth = 26;
        this.playerHeight = 16;
        this.playerX = (this.canvas.width - this.playerWidth) / 2;
        this.playerY = this.canvas.height - 40;
        this.playerSpeed = 4.5;
        this.playerInvulnerableTime = 0; // i-frames after hit

        // Entity Arrays
        this.bullets = [];
        this.invaders = [];
        this.particles = [];
        this.floatingTexts = [];
        this.stars = [];

        // UFO Mystery Ship
        this.ufo = null;
        this.lastUfoSpawn = 0;
        this.ufoSpawnInterval = 15000 + Math.random() * 10000; // 15–25s

        // Animation frame counter
        this.animFrame = 0;
        this.lastAnimTick = 0;

        // Controls State
        this.leftPressed = false;
        this.rightPressed = false;
        this.spacePressed = false;
        this.lastPlayerShotTime = 0;
        this.playerShotCooldown = 180;

        // Mobile touch variables
        this.isTouching = false;
        this.touchX = 0;

        // Alien Grid March parameters
        this.invaderDirection = 1;
        this.invaderSpeed = 0.55;
        this.invaderStepDown = 8;
        this.lastAlienShotTime = 0;
        this.alienShotInterval = 2200;
        this.alienBulletSpeed = 2.5; // scales up each wave

        // TWINKLING BACKGROUND STARS (Parallax Neon Starfield)
        for (let i = 0; i < 60; i++) {
            const layer = Math.random();
            let size, speed, color;
            if (layer < 0.5) {
                // Background layer (slow, small, dim white/blue)
                size = Math.random() * 0.8 + 0.4;
                speed = Math.random() * 0.15 + 0.05;
                color = Math.random() < 0.5 ? 'rgba(100, 116, 139, 0.4)' : 'rgba(56, 189, 248, 0.3)';
            } else if (layer < 0.85) {
                // Midground layer (medium, warm white/cyan)
                size = Math.random() * 1.2 + 0.8;
                speed = Math.random() * 0.4 + 0.2;
                color = Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 212, 191, 0.5)';
            } else {
                // Foreground layer (fast, large, glowing purple/white)
                size = Math.random() * 1.6 + 1.2;
                speed = Math.random() * 0.9 + 0.6;
                color = Math.random() < 0.5 ? 'rgba(217, 70, 239, 0.7)' : 'rgba(255, 255, 255, 0.8)';
            }
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size,
                speed,
                color
            });
        }

        // Binding event listeners
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    start() {
        this.score = 0;
        this.level = 1;
        this.lives = window.godModeActive ? 99 : 3;
        this.gameOverState = false;
        this.won = false;
        this.isPaused = false;
        this.bullets = [];
        this.particles = [];
        this.floatingTexts = [];
        this.ufo = null;
        this.lastUfoSpawn = Date.now();
        this.ufoSpawnInterval = 15000 + Math.random() * 10000;
        this.animFrame = 0;
        this.lastAnimTick = 0;
        this.alienBulletSpeed = 2.5;

        // Wave splash state
        this.waveSplash = null;
        
        this.playerX = (this.canvas.width - this.playerWidth) / 2;
        this.playerInvulnerableTime = 0;

        this.initLevel();

        // Register Input Event Listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: true });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });

        // Loop triggering
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.tick = this.tick.bind(this);
        this.animationId = requestAnimationFrame(this.tick);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    initLevel() {
        this.invaders = [];
        this.bullets = [];
        this.invaderDirection = 1;

        const lvl = this.level;
        const isBossWave = (lvl % 3 === 0); // every 3rd wave is a BOSS wave

        // Per-level scaling (smoother log progression + responsive player speed)
        this.invaderSpeed = 0.45 + Math.log2(lvl) * 0.16;
        this.alienShotInterval = Math.max(900, 2200 - Math.log2(lvl) * 350);
        this.alienBulletSpeed = 2.0 + Math.log2(lvl) * 0.45;
        this.playerSpeed = 5.0;

        if (isBossWave) {
            // ---- BOSS WAVE: single large alien with HP ----
            const bossHp = 10 + Math.floor(lvl / 3) * 5; // Level 3: 15 HP, Level 6: 20 HP, Level 9: 25 HP
            this.invaders.push({
                x: this.canvas.width / 2 - 30,
                y: 70,
                width: 60,
                height: 36,
                type: 'boss',
                points: 500 + lvl * 100,
                hp: bossHp,
                maxHp: bossHp,
                alive: true
            });
            // Boss also gets two flanker guards
            [this.canvas.width / 2 - 90, this.canvas.width / 2 + 50].forEach(bx => {
                this.invaders.push({
                    x: bx, y: 90,
                    width: 22, height: 16,
                    type: 'magenta', points: 80,
                    alive: true
                });
            });
            return;
        }

        // ---- NORMAL WAVES: formation based on level ----
        const formations = [
            'grid',    // wave 1
            'vshape',  // wave 2
            'grid',    // (wave 3 = boss)
            'diamond', // wave 4
            'zigzag',  // wave 5
            'grid',    // (wave 6 = boss)
            'dense',   // wave 7
            'vshape',  // wave 8
        ];
        const formation = formations[(lvl - 1) % formations.length];

        // Grow the grid with level (capped)
        const rows = Math.min(2 + Math.floor(lvl / 2), 5);
        const cols = Math.min(5 + Math.floor(lvl / 3), 8);

        const invW = 22, invH = 16;
        const xGap = 42, yGap = 30;
        const gridW = cols * invW + (cols - 1) * (xGap - invW);
        const baseX = (this.canvas.width - gridW) / 2;
        const baseY = 55;

        const typeForRow = (r) => {
            if (r === 0) return { type: 'magenta', pts: 30 };
            if (r === 1) return { type: 'cyan',    pts: 20 };
            return            { type: 'yellow',  pts: 10 };
        };

        const addAlien = (col, row, offsetX = 0) => {
            const { type, pts } = typeForRow(row);
            this.invaders.push({
                x: baseX + col * xGap + offsetX,
                y: baseY + row * yGap,
                width: invW, height: invH,
                type, points: pts, alive: true
            });
        };

        if (formation === 'vshape') {
            // V-shape: indent middle rows
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const indent = r * xGap * 0.45;
                    addAlien(c, r, indent);
                }
            }
        } else if (formation === 'diamond') {
            // Diamond: max cols in middle row
            const midRow = Math.floor(rows / 2);
            for (let r = 0; r < rows; r++) {
                const spread = Math.abs(r - midRow);
                const rowCols = Math.max(2, cols - spread * 2);
                const rowOffset = spread * xGap;
                for (let c = 0; c < rowCols; c++) {
                    addAlien(c, r, rowOffset);
                }
            }
        } else if (formation === 'zigzag') {
            // Zigzag: alternate rows offset
            for (let r = 0; r < rows; r++) {
                const offset = (r % 2 === 0) ? 0 : xGap * 0.5;
                for (let c = 0; c < cols; c++) {
                    addAlien(c, r, offset);
                }
            }
        } else if (formation === 'dense') {
            // Dense: extra rows, tighter spacing
            const denseRows = Math.min(rows + 1, 5);
            const denseCols = Math.min(cols + 1, 9);
            for (let r = 0; r < denseRows; r++) {
                for (let c = 0; c < denseCols; c++) {
                    const { type, pts } = typeForRow(r);
                    this.invaders.push({
                        x: baseX + c * 34, // tighter
                        y: baseY + r * 24,
                        width: 18, height: 14,
                        type, points: pts, alive: true
                    });
                }
            }
        } else {
            // Default grid
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    addAlien(c, r);
                }
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    handleKeyDown(e) {
        if (this.gameOverState || this.isPaused) return;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.leftPressed = true;
            e.preventDefault();
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.rightPressed = true;
            e.preventDefault();
        }
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.spacePressed = true;
            e.preventDefault();
        }
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.leftPressed = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.rightPressed = false;
        }
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.spacePressed = false;
        }
    }

    handleTouchStart(e) {
        if (this.gameOverState || this.isPaused) return;
        this.isTouching = true;
        this.updateTouchPos(e);
    }

    handleTouchMove(e) {
        if (this.gameOverState || this.isPaused) return;
        this.updateTouchPos(e);
    }

    handleTouchEnd() {
        this.isTouching = false;
    }

    updateTouchPos(e) {
        if (e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
    }

    firePlayerBullet() {
        const now = Date.now();
        if (now - this.lastPlayerShotTime < this.playerShotCooldown) return;

        this.sound.playLaser();
        
        if (window.godModeActive) {
            // Triple-shot Spread firing!
            this.bullets.push({ x: this.playerX + this.playerWidth / 2, y: this.playerY, dx: 0, dy: -6.5, isPlayer: true });
            this.bullets.push({ x: this.playerX + this.playerWidth / 2, y: this.playerY, dx: -1.8, dy: -6.0, isPlayer: true });
            this.bullets.push({ x: this.playerX + this.playerWidth / 2, y: this.playerY, dx: 1.8, dy: -6.0, isPlayer: true });
        } else {
            // Standard single laser
            this.bullets.push({
                x: this.playerX + this.playerWidth / 2,
                y: this.playerY,
                dx: 0,
                dy: -5.0,
                isPlayer: true
            });
        }
        this.lastPlayerShotTime = now;
    }

    alienFire() {
        const aliveAliens = this.invaders.filter(a => a.alive);
        if (aliveAliens.length === 0) return;

        // Check if boss is alive
        const boss = aliveAliens.find(a => a.type === 'boss');

        if (boss) {
            // Boss Multi-Pattern Attacks!
            const roll = Math.random();
            if (roll < 0.4) {
                // 3-way spread pattern
                this.bullets.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height, dx: -0.7, dy: this.alienBulletSpeed * 0.9, isPlayer: false });
                this.bullets.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height, dx: 0, dy: this.alienBulletSpeed, isPlayer: false });
                this.bullets.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height, dx: 0.7, dy: this.alienBulletSpeed * 0.9, isPlayer: false });
            } else if (roll < 0.75) {
                // Aimed target-seeking bullet
                const playerCenter = this.playerX + this.playerWidth / 2;
                const bossCenter = boss.x + boss.width / 2;
                const dx = (playerCenter - bossCenter) * 0.012; // trace player speed
                const clampedDx = Math.max(-1.4, Math.min(1.4, dx));
                this.bullets.push({
                    x: bossCenter,
                    y: boss.y + boss.height,
                    dx: clampedDx,
                    dy: this.alienBulletSpeed,
                    isPlayer: false
                });
            } else {
                // Standard double laser
                this.bullets.push({ x: boss.x + 12, y: boss.y + boss.height, dx: 0, dy: this.alienBulletSpeed, isPlayer: false });
                this.bullets.push({ x: boss.x + boss.width - 12, y: boss.y + boss.height, dx: 0, dy: this.alienBulletSpeed, isPlayer: false });
            }
            this.sound.play(180, 90, 'square', 0.12, 0.04);
        } else {
            // Standard alien fires straight down
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            this.bullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                dx: 0,
                dy: this.alienBulletSpeed,
                isPlayer: false
            });
        }
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.5 + 1.0;
            this.particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: Math.random() * 2 + 1,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.03,
                color: color
            });
        }
    }

    spawnFloatingText(x, y, text, color = '#ffffff') {
        this.floatingTexts.push({
            x,
            y,
            text,
            dy: -0.6,
            life: 1.0,
            decay: 0.02,
            color
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    tick() {
        if (this.gameOverState) {
            this.draw();
            return;
        }

        if (this.isPaused) {
            this.draw();
            this.animationId = requestAnimationFrame(this.tick);
            return;
        }

        // Animate alien jitter every 400ms
        const now = Date.now();
        if (now - this.lastAnimTick > 400) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.lastAnimTick = now;
        }

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(this.tick);
    }

    update() {
        // --- 1. Starfield Scrolling ---
        this.stars.forEach(s => {
            s.y += s.speed;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });

        // --- 2. Decaying Invulnerability ---
        if (this.playerInvulnerableTime > 0) {
            this.playerInvulnerableTime -= 16.67; // decrement approx frame duration
        }

        // Auto-fire player lasers!
        this.firePlayerBullet();

        // --- 3. Handle Keyboard & Touch Ship Movements ---
        if (this.leftPressed) {
            this.playerX = Math.max(0, this.playerX - this.playerSpeed);
        }
        if (this.rightPressed) {
            this.playerX = Math.min(this.canvas.width - this.playerWidth, this.playerX + this.playerSpeed);
        }

        if (this.isTouching) {
            // Smooth drag-to-move: follow finger position on canvas
            const targetX = this.touchX - this.playerWidth / 2;
            const diffX = targetX - this.playerX;
            if (Math.abs(diffX) > 2) {
                this.playerX += diffX * 0.28;
            }
            this.playerX = Math.max(0, Math.min(this.canvas.width - this.playerWidth, this.playerX));
        }

        // --- 4. Update Bullets ---
        this.bullets.forEach((b, idx) => {
            b.x += b.dx || 0;
            b.y += b.dy;

            // Remove out of bounds bullets
            if (b.y < 0 || b.y > this.canvas.height) {
                this.bullets.splice(idx, 1);
            }
        });

        // --- 5. Alien Grid March Movement Logic ---
        let shiftDown = false;
        let leftBoundary = 0;
        let rightBoundary = this.canvas.width;

        const aliveAliens = this.invaders.filter(a => a.alive);
        if (aliveAliens.length === 0) {
            // Level cleared!
            this.levelComplete();
            return;
        }

        // Check if any alien reaches the side limits
        aliveAliens.forEach(alien => {
            if (this.invaderDirection === 1 && alien.x + alien.width >= rightBoundary - 10) {
                shiftDown = true;
            }
            if (this.invaderDirection === -1 && alien.x <= leftBoundary + 10) {
                shiftDown = true;
            }
        });

        // Increase speed as fewer aliens remain
        const totalStartAliens = 18;
        const ratioRemaining = aliveAliens.length / totalStartAliens;
        const currentSpeed = this.invaderSpeed * (1.5 - ratioRemaining * 0.6); // milder acceleration as aliens die

        if (shiftDown) {
            this.invaderDirection *= -1;
            this.invaders.forEach(alien => {
                // Shifting down: Boss shifts down slower and stops at y = 140
                if (alien.type === 'boss') {
                    if (alien.y < 140) {
                        alien.y += this.invaderStepDown * 0.5;
                    }
                } else {
                    alien.y += this.invaderStepDown;
                }

                // Game Over if aliens reach player height
                if (alien.y + alien.height >= this.playerY && alien.alive) {
                    if (!window.godModeActive) {
                        this.lives = 0;
                        this.triggerGameOver();
                    } else {
                        // God mode wipes aliens near ship!
                        this.spawnParticles(alien.x, alien.y, '#ef4444');
                        alien.alive = false;
                    }
                }
            });
        } else {
            this.invaders.forEach(alien => {
                alien.x += currentSpeed * this.invaderDirection;
            });
        }

        // --- 6. Alien Laser Shoots (Triggered periodically) ---
        const now = Date.now();
        const adjustedInterval = this.alienShotInterval * (ratioRemaining * 0.6 + 0.4);
        if (now - this.lastAlienShotTime > adjustedInterval) {
            this.alienFire();
            this.lastAlienShotTime = now;
        }

        // --- 7. Collisions Logic ---
        this.bullets.forEach((b, bIdx) => {
            if (b.isPlayer) {
                // Check if player bullet hits alien
                this.invaders.forEach(alien => {
                    if (alien.alive && this.checkCollision({ x: b.x - 1, y: b.y, width: 2, height: 6 }, alien)) {
                        // Boss takes multiple hits
                        if (alien.type === 'boss') {
                            alien.hp--;
                            this.sound.playHit();
                            this.spawnFloatingText(alien.x + alien.width / 2, alien.y - 5,
                                `${alien.hp} HP LEFT`, '#f43f5e');
                            // Flash effect
                            this.spawnParticles(b.x, b.y, '#f43f5e');
                            this.bullets.splice(bIdx, 1);
                            if (alien.hp <= 0) {
                                alien.alive = false;
                                this.sound.playExplosion();
                                this.spawnParticles(alien.x + alien.width / 2, alien.y + alien.height / 2, '#f43f5e');
                                this.spawnParticles(alien.x + 15, alien.y + 10, '#ef4444');
                                this.score += alien.points;
                                this.spawnFloatingText(alien.x + alien.width / 2, alien.y, `+${alien.points}`, '#f43f5e');
                                if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
                            }
                            return;
                        }

                        // Regular alien — one-shot kill
                        alien.alive = false;
                        this.bullets.splice(bIdx, 1);
                        this.sound.playExplosion();

                        let color = '#ef4444';
                        if (alien.type === 'cyan')    color = '#2dd4bf';
                        if (alien.type === 'yellow')  color = '#eab308';
                        if (alien.type === 'magenta') color = '#d946ef';
                        this.spawnParticles(alien.x + alien.width / 2, alien.y + alien.height / 2, color);

                        this.score += alien.points;
                        this.spawnFloatingText(alien.x + alien.width / 2, alien.y, `+${alien.points}`, color);

                        if (this.callbacks.onScore) {
                            this.callbacks.onScore(this.score, this.level);
                        }
                    }
                });
            } else {
                // Check if alien bullet hits player
                if (this.checkCollision({ x: b.x - 1, y: b.y, width: 2, height: 6 }, { x: this.playerX, y: this.playerY, width: this.playerWidth, height: this.playerHeight })) {
                    this.bullets.splice(bIdx, 1);
                    if (this.playerInvulnerableTime <= 0 && !window.godModeActive) {
                        this.lives--;
                        this.sound.playHit();
                        this.spawnParticles(this.playerX + this.playerWidth / 2, this.playerY + this.playerHeight / 2, '#f87171');
                        this.playerInvulnerableTime = 1500; // 1.5s invincibility frames
                        
                        if (this.lives <= 0) {
                            this.triggerGameOver();
                        }
                    }
                }
            }
        });

        // --- 8. Update UFO Mystery Ship ---
        const nowUfo = Date.now();
        if (!this.ufo && (nowUfo - this.lastUfoSpawn) > this.ufoSpawnInterval) {
            this.ufo = {
                x: -40,
                y: 42,
                width: 32,
                height: 12,
                speed: 1.2,
                points: 150 + Math.floor(Math.random() * 6) * 50 // 150–450 pts
            };
            this.lastUfoSpawn = nowUfo;
            this.ufoSpawnInterval = 15000 + Math.random() * 10000;
        }

        if (this.ufo) {
            this.ufo.x += this.ufo.speed;
            if (this.ufo.x > this.canvas.width + 40) {
                this.ufo = null;
            } else {
                // Check if player bullet hits UFO
                this.bullets.forEach((b, bIdx) => {
                    if (b.isPlayer && this.ufo && this.checkCollision(
                        { x: b.x - 1, y: b.y, width: 2, height: 6 }, this.ufo
                    )) {
                        const pts = this.ufo.points;
                        this.spawnParticles(this.ufo.x + this.ufo.width / 2, this.ufo.y, '#f43f5e');
                        this.spawnFloatingText(this.ufo.x + this.ufo.width / 2, this.ufo.y - 5, `+${pts}`, '#f43f5e');
                        this.sound.playExplosion();
                        this.score += pts;
                        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
                        this.ufo = null;
                        this.bullets.splice(bIdx, 1);
                    }
                });
            }
        }

        // --- 9. Update Particles ---
        this.particles.forEach((p, idx) => {
            p.x += p.dx;
            p.y += p.dy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(idx, 1);
            }
        });

        // --- 10. Update Floating Texts ---
        this.floatingTexts.forEach((ft, idx) => {
            ft.y += ft.dy;
            ft.life -= ft.decay;
            if (ft.life <= 0) {
                this.floatingTexts.splice(idx, 1);
            }
        });
    }

    levelComplete() {
        this.sound.playWin();
        this.level++;

        const isBossWave = (this.level % 3 === 0);
        const waveNames = [
            '', 'ROOKIE WAVE', 'SKIRMISH', 'BOSS INCOMING!',
            'ASSAULT WAVE', 'BLITZ', 'BOSS INCOMING!',
            'RAMPAGE', 'SIEGE', 'BOSS INCOMING!'
        ];
        const waveName = waveNames[this.level] ||
            (isBossWave ? 'BOSS INCOMING!' : `WAVE ${this.level}`);

        // Show wave splash screen for 2 seconds
        this.waveSplash = {
            title: `WAVE ${this.level}`,
            subtitle: waveName,
            isBoss: isBossWave,
            timer: 2000 // ms
        };
        this.isPaused = true;

        setTimeout(() => {
            this.waveSplash = null;
            this.isPaused = false;
            this.initLevel();
            if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.level);
        }, 2000);
    }

    triggerGameOver() {
        this.sound.playLose();
        this.gameOverState = true;
        
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(this.score);
        }

        // Overlay element handling
        const overlay = document.getElementById('invadersOverlay');
        const overlayMsg = document.getElementById('invadersOverlayMsg');
        if (overlay && overlayMsg) {
            const high = localStorage.getItem('invaders_high_score') || 0;
            overlayMsg.innerHTML = `Cleared Waves: ${this.level - 1}<br>Final Score: ${this.score}<br>High Score: ${high}`;
            overlay.classList.add('show');
        }
    }

    draw() {
        this.ctx.fillStyle = '#060a12';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Twinkling Stars (Parallax Layers)
        this.stars.forEach(s => {
            const twinkle = 0.45 + Math.sin(Date.now() * 0.005 + s.x) * 0.35;
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = twinkle;
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        this.ctx.globalAlpha = 1.0; // reset

        // 2. Draw UFO Mystery Ship
        if (this.ufo) {
            const uf = this.ufo;
            // Pulsing red glow saucer
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#f43f5e';
            this.ctx.fillStyle = '#f43f5e';
            this.ctx.beginPath();
            this.ctx.ellipse(uf.x + uf.width / 2, uf.y + 4, uf.width / 2, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fda4af';
            this.ctx.beginPath();
            this.ctx.ellipse(uf.x + uf.width / 2, uf.y + 1, uf.width / 4, 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            const blinkOn = Math.floor(Date.now() / 150) % 2 === 0;
            this.ctx.fillStyle = blinkOn ? '#fff' : '#f43f5e';
            this.ctx.fillRect(uf.x + 6, uf.y + 5, 2, 2);
            this.ctx.fillRect(uf.x + uf.width / 2 - 1, uf.y + 5, 2, 2);
            this.ctx.fillRect(uf.x + uf.width - 8, uf.y + 5, 2, 2);
        }

        // 3. Draw Invaders (Aliens) with custom high-tech vector graphics
        this.invaders.forEach(alien => {
            if (!alien.alive) return;

            // --- BOSS DREADNOUGHT ---
            if (alien.type === 'boss') {
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
                const bossColor = `rgba(244, 63, 94, 1)`;

                // Glowing shield boundary
                this.ctx.strokeStyle = `rgba(244, 63, 94, ${0.15 + pulse * 0.15})`;
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.width * 0.72, 0, Math.PI * 2);
                this.ctx.stroke();

                // Delta wing warship hull
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#f43f5e';
                this.ctx.fillStyle = bossColor;
                this.ctx.beginPath();
                this.ctx.moveTo(alien.x + alien.width / 2, alien.y + alien.height); // nose cone pointing down
                this.ctx.lineTo(alien.x + alien.width, alien.y + 8);
                this.ctx.lineTo(alien.x + alien.width - 12, alien.y);
                this.ctx.lineTo(alien.x + 12, alien.y);
                this.ctx.lineTo(alien.x, alien.y + 8);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;

                // Engine thrust trails
                this.ctx.fillStyle = '#f97316';
                this.ctx.fillRect(alien.x + 15, alien.y - 5, 6, 5);
                this.ctx.fillRect(alien.x + alien.width - 21, alien.y - 5, 6, 5);
                if (Date.now() % 120 < 60) {
                    this.ctx.fillStyle = '#ef4444';
                    this.ctx.fillRect(alien.x + 17, alien.y - 8, 2, 3);
                    this.ctx.fillRect(alien.x + alien.width - 19, alien.y - 8, 2, 3);
                }

                // Glowing core eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(alien.x + alien.width / 2 - 8, alien.y + 12, 3, 3);
                this.ctx.fillRect(alien.x + alien.width / 2 + 5, alien.y + 12, 3, 3);

                // Boss HP bar
                const hpRatio = alien.hp / alien.maxHp;
                const barW = alien.width + 12;
                const barX = alien.x - 6;
                const barY = alien.y - 14;
                this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this.ctx.fillRect(barX, barY, barW, 6);
                this.ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
                this.ctx.fillRect(barX, barY, barW * hpRatio, 6);
                return;
            }

            // --- REGULAR ALIEN SHIPS ---
            const color = alien.type === 'magenta' ? '#d946ef' : (alien.type === 'cyan' ? '#2dd4bf' : '#eab308');
            this.ctx.fillStyle = color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = color;

            if (alien.type === 'cyan') {
                // Sleek Chevron Fighter
                this.ctx.beginPath();
                this.ctx.moveTo(alien.x + alien.width / 2, alien.y + alien.height);
                this.ctx.lineTo(alien.x + alien.width, alien.y + 2);
                this.ctx.lineTo(alien.x + alien.width - 4, alien.y);
                this.ctx.lineTo(alien.x + alien.width / 2, alien.y + 6);
                this.ctx.lineTo(alien.x + 4, alien.y);
                this.ctx.lineTo(alien.x, alien.y + 2);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Tiny engine trail
                if (Date.now() % 160 < 80) {
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.fillRect(alien.x + alien.width / 2 - 2, alien.y - 4, 4, 3);
                }
            } else if (alien.type === 'yellow') {
                // Heavy Hex Bomber
                this.ctx.beginPath();
                this.ctx.moveTo(alien.x + 4, alien.y);
                this.ctx.lineTo(alien.x + alien.width - 4, alien.y);
                this.ctx.lineTo(alien.x + alien.width, alien.y + 6);
                this.ctx.lineTo(alien.x + alien.width - 5, alien.y + alien.height);
                this.ctx.lineTo(alien.x + 5, alien.y + alien.height);
                this.ctx.lineTo(alien.x, alien.y + 6);
                this.ctx.closePath();
                this.ctx.fill();

                // Side laser cannons
                this.ctx.fillRect(alien.x - 2, alien.y + 4, 2, 7);
                this.ctx.fillRect(alien.x + alien.width, alien.y + 4, 2, 7);
            } else {
                // Magenta Elite Diamond Interceptor
                this.ctx.beginPath();
                this.ctx.moveTo(alien.x + alien.width / 2, alien.y);
                this.ctx.lineTo(alien.x + alien.width, alien.y + alien.height / 2);
                this.ctx.lineTo(alien.x + alien.width - 4, alien.y + alien.height);
                this.ctx.lineTo(alien.x + 4, alien.y + alien.height);
                this.ctx.lineTo(alien.x, alien.y + alien.height / 2);
                this.ctx.closePath();
                this.ctx.fill();

                // Lower engine cooling thrusters
                this.ctx.fillRect(alien.x + 3, alien.y + alien.height, 2, 3);
                this.ctx.fillRect(alien.x + alien.width - 5, alien.y + alien.height, 2, 3);
            }

            this.ctx.shadowBlur = 0;
            // Draw cockpit overlay
            this.ctx.fillStyle = '#060a12';
            this.ctx.fillRect(alien.x + alien.width / 2 - 3, alien.y + 4, 6, 3);
        });

        // 3. Draw Player Spaceship (Glowing Neon Aura)
        const blinkState = Math.floor(this.playerInvulnerableTime / 100) % 2 === 0;
        if (this.playerInvulnerableTime <= 0 || blinkState) {
            const shipColor = window.godModeActive ? '#10b981' : '#2dd4bf';
            this.ctx.fillStyle = shipColor;
            this.ctx.strokeStyle = window.godModeActive ? '#059669' : '#0d9488';
            this.ctx.lineWidth = 2.5;
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = shipColor;

            this.ctx.beginPath();
            this.ctx.moveTo(this.playerX + this.playerWidth / 2, this.playerY);
            this.ctx.lineTo(this.playerX + this.playerWidth, this.playerY + this.playerHeight);
            this.ctx.lineTo(this.playerX + this.playerWidth - 6, this.playerY + this.playerHeight - 3);
            this.ctx.lineTo(this.playerX + 6, this.playerY + this.playerHeight - 3);
            this.ctx.lineTo(this.playerX, this.playerY + this.playerHeight);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Thrust fire trail
            if (Date.now() % 120 < 60) {
                this.ctx.fillStyle = '#f97316';
                this.ctx.fillRect(this.playerX + this.playerWidth / 2 - 2, this.playerY + this.playerHeight - 1, 4, 6);
            }
        }

        // 4. Draw Lasers (glowing laser rays)
        this.bullets.forEach(b => {
            const bulletColor = b.isPlayer ? (window.godModeActive ? '#10b981' : '#2dd4bf') : '#f97316';
            this.ctx.fillStyle = bulletColor;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = bulletColor;
            
            this.ctx.fillRect(b.x - 1.5, b.y, 3, 9);
            
            this.ctx.shadowBlur = 0; // reset
        });

        // 5. Draw Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0; // reset alpha

        // 6. Draw Floating Points Texts
        this.floatingTexts.forEach(ft => {
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 10px Courier New';
            this.ctx.globalAlpha = ft.life;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
        });
        this.ctx.globalAlpha = 1.0; // reset alpha

        // 7. Draw danger ground line
        this.ctx.strokeStyle = 'rgba(239,68,68,0.35)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.playerY - 8);
        this.ctx.lineTo(this.canvas.width, this.playerY - 8);
        this.ctx.stroke();

        // 8. Draw Scanlines Overlay
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.022)';
        for (let sl = 0; sl < this.canvas.height; sl += 4) {
            this.ctx.fillRect(0, sl, this.canvas.width, 1);
        }

        // 9. Lives HUD icons
        if (!this.gameOverState) {
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '9px Courier New';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('LIVES:', 10, 20);
            for (let i = 0; i < Math.min(this.lives, 5); i++) {
                this.ctx.fillStyle = window.godModeActive ? '#10b981' : '#ef4444';
                this.ctx.fillRect(48 + i * 11, 13, 8, 8);
            }
            if (this.lives > 5) {
                this.ctx.fillStyle = '#ef4444';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`x${this.lives}`, 48 + 5 * 11 + 2, 21);
            }
        }

        // 10. Draw wave level badge (top right)
        this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
        this.ctx.font = 'bold 9px Courier New';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`WAVE ${this.level}`, this.canvas.width - 8, 20);

        // 11. Wave splash OR Pause overlay
        if (this.waveSplash) {
            const ws = this.waveSplash;
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            // Dim background
            this.ctx.fillStyle = 'rgba(6,10,18,0.82)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Glow ring
            const pulseGlow = 10 + 6 * Math.sin(Date.now() * 0.005);
            this.ctx.shadowBlur = pulseGlow;
            this.ctx.shadowColor = ws.isBoss ? '#f43f5e' : '#10b981';
            // Wave number
            this.ctx.fillStyle = ws.isBoss ? '#f43f5e' : '#10b981';
            this.ctx.font = `bold 32px Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ws.title, cx, cy - 20);
            // Wave subtitle
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = ws.isBoss ? '#fca5a5' : '#6ee7b7';
            this.ctx.font = 'bold 13px Courier New';
            this.ctx.fillText(ws.subtitle, cx, cy + 10);
            // Countdown hint
            this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
            this.ctx.font = '10px Courier New';
            this.ctx.fillText('Get ready...', cx, cy + 32);
        } else if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(6,10,18,0.65)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 22px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.font = '11px Courier New';
            this.ctx.fillStyle = 'rgba(255,255,255,0.55)';
            this.ctx.fillText('Press P or tap Pause to resume', this.canvas.width / 2, this.canvas.height / 2 + 14);
        }
    }
}
