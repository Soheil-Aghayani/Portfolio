export class SnakeGame {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onScore, onEnd }

        this.size = 18;
        this.cols = 0;
        this.rows = 0;
        this.snake = null;
        this.timer = null;
        this.isPaused = false;
        this.gameOverState = false;

        this.particles = [];
        this.animFrameId = null;
        this.scanlineY = 0;

        this.handleInput = this.handleInput.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.resize();
        this.canvas.addEventListener('click', this.handleClick);
    }

    resize() {
        if (!this.canvas) return;
        this.cols = Math.floor(this.canvas.width / this.size);
        this.rows = Math.floor(this.canvas.height / this.size);
    }

    start() {
        this.resize();
        this.gameOverState = false;
        this.isPaused = false;
        this.particles = [];
        this.scanlineY = 0;
        this.obstacles = [];
        this.floatingTexts = [];
        this.shieldActive = false;
        this.speedSlowDuration = 0;
        this.speedBoostDuration = 0;
        this.snake = {
            dir: {x:1, y:0},
            nextDir: {x:1, y:0},
            body: [{x: Math.floor(this.cols/2), y: Math.floor(this.rows/2)}],
            food: null,
            foodType: 'normal',
            score: 0,
            alive: true
        };

        this.placeFood();

        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.nextTick();

        // Start render loop
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        const render = () => {
            this.draw();
            this.animFrameId = requestAnimationFrame(render);
        };
        this.animFrameId = requestAnimationFrame(render);

        // Ensure we don't duplicate listeners
        window.removeEventListener('keydown', this.handleInput);
        window.addEventListener('keydown', this.handleInput);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
        window.removeEventListener('keydown', this.handleInput);
    }

    pause() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (this.timer) clearTimeout(this.timer);
            this.timer = null;
        } else {
            this.nextTick();
        }
        this.draw();
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    nextTick() {
        if (!this.snake || !this.snake.alive || this.isPaused) return;

        this.tick();

        let interval = 220;
        if (this.speedSlowDuration > 0) {
            interval = 320;
        } else if (this.speedBoostDuration > 0) {
            interval = 140;
        }

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.nextTick(), interval);
    }

    handleInput(e) {
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        if (this.gameOverState) {
            if (e.key === ' ' || e.key === 'Enter') {
                this.start();
            }
            return;
        }

        if (this.isPaused) return;
        if (!this.snake || !this.snake.alive) return;

        switch(e.key) {
            case 'ArrowUp': this.setDir(0, -1); break;
            case 'ArrowDown': this.setDir(0, 1); break;
            case 'ArrowLeft': this.setDir(-1, 0); break;
            case 'ArrowRight': this.setDir(1, 0); break;
        }
    }

    handleClick() {
        if (this.gameOverState) {
            this.start();
        }
    }

    setDir(dx, dy) {
        if (this.snake.dir.x === -dx && this.snake.dir.y === -dy) return;
        this.snake.nextDir = {x: dx, y: dy};
    }

    tick() {
        if (!this.snake || !this.snake.alive) return;

        // Decrement powerup steps
        if (this.speedSlowDuration > 0) this.speedSlowDuration--;
        if (this.speedBoostDuration > 0) this.speedBoostDuration--;

        this.snake.dir = this.snake.nextDir;
        const head = this.snake.body[0];
        const nx = head.x + this.snake.dir.x;
        const ny = head.y + this.snake.dir.y;

        // Wall collision
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) {
            if (this.shieldActive) {
                this.breakShield();
                return;
            }
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.body.some((p, idx) => idx !== 0 && p.x === nx && p.y === ny)) {
            if (this.shieldActive) {
                this.breakShield();
                return;
            }
            this.gameOver();
            return;
        }

        // Obstacle collision
        if (this.obstacles && this.obstacles.some(o => o.x === nx && o.y === ny)) {
            if (this.shieldActive) {
                this.breakShield();
                return;
            }
            this.gameOver();
            return;
        }

        this.snake.body.unshift({x: nx, y: ny});

        // Eat food
        if (this.snake.food && nx === this.snake.food.x && ny === this.snake.food.y) {
            let scoreGained = 1;
            let text = '+1';
            let textColor = '#2dd4bf';

            if (this.snake.foodType === 'golden') {
                scoreGained = 3;
                text = 'GOLD SHIELD + TIME SLOW!';
                textColor = '#fbbf24';
                this.shieldActive = true;
                this.speedSlowDuration = 20; // 20 steps of slowness
                this.speedBoostDuration = 0;
                this.createShieldBurst(nx * this.size + this.size / 2, ny * this.size + this.size / 2);
            } else if (this.snake.foodType === 'rainbow') {
                scoreGained = 2;
                text = 'SPEED BOOST (2x)!';
                textColor = '#ec4899';
                this.speedBoostDuration = 25; // 25 steps of speed boost
                this.speedSlowDuration = 0;
            }

            this.snake.score += scoreGained;
            if (this.callbacks.onScore) this.callbacks.onScore(this.snake.score);
            
            this.spawnFloatingText(
                nx * this.size + this.size / 2,
                ny * this.size + this.size / 2 - 10,
                text,
                textColor
            );

            this.createBurst(nx * this.size + this.size / 2, ny * this.size + this.size / 2);

            // Generate cyber wall obstacle every 5 points, up to 6 obstacles
            if (this.snake.score > 0 && this.snake.score % 5 === 0 && this.obstacles.length < 6) {
                this.spawnObstacle();
            }

            this.placeFood();
        } else {
            const tail = this.snake.body.pop();
            // Spawn tail dust particles occasionally
            if (Math.random() < 0.45) {
                this.particles.push({
                    x: tail.x * this.size + this.size / 2 + (Math.random() - 0.5) * 6,
                    y: tail.y * this.size + this.size / 2 + (Math.random() - 0.5) * 6,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    color: this.shieldActive ? '#fbbf24' : (this.speedBoostDuration > 0 ? '#ec4899' : '#0ea5e9'),
                    size: Math.random() * 2 + 0.8,
                    alpha: 0.8,
                    life: 25 + Math.random() * 15
                });
            }
        }

        // Rainbow Apple trail particles
        if (this.speedBoostDuration > 0 && Math.random() < 0.8) {
            const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
            const head = this.snake.body[0];
            this.particles.push({
                x: head.x * this.size + this.size / 2 + (Math.random() - 0.5) * 6,
                y: head.y * this.size + this.size / 2 + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2 + 1,
                alpha: 0.9,
                life: 15 + Math.random() * 10
            });
        }
    }

    breakShield() {
        this.shieldActive = false;
        const head = this.snake.body[0];
        this.spawnFloatingText(
            head.x * this.size + this.size / 2,
            head.y * this.size + this.size / 2,
            'SHIELD BLOCKED CRASH!',
            '#fbbf24'
        );
        if (navigator.vibrate) {
            try { navigator.vibrate([80, 40, 80]); } catch(e) {}
        }
        this.createShieldBurst(head.x * this.size + this.size / 2, head.y * this.size + this.size / 2);
    }

    createShieldBurst(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#fbbf24',
                size: Math.random() * 3 + 1.5,
                alpha: 1.0,
                life: 30 + Math.random() * 20
            });
        }
    }

    spawnObstacle() {
        while (true) {
            const ox = Math.floor(Math.random() * this.cols);
            const oy = Math.floor(Math.random() * this.rows);
            const hitBody = this.snake.body.some(p => p.x === ox && p.y === oy);
            const head = this.snake.body[0];
            const dist = Math.abs(head.x - ox) + Math.abs(head.y - oy);
            const hitFood = this.snake.food && this.snake.food.x === ox && this.snake.food.y === oy;
            const hitObstacle = this.obstacles && this.obstacles.some(o => o.x === ox && o.y === oy);

            if (!hitBody && dist > 2 && !hitFood && !hitObstacle) {
                this.obstacles.push({x: ox, y: oy});
                this.spawnFloatingText(ox * this.size + this.size / 2, oy * this.size + this.size / 2 - 10, 'CYBER WALL ADDED', '#ef4444');
                
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 1.5 + 0.5;
                    this.particles.push({
                        x: ox * this.size + this.size / 2,
                        y: oy * this.size + this.size / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: '#ef4444',
                        size: Math.random() * 2 + 1,
                        alpha: 0.9,
                        life: 20 + Math.random() * 10
                    });
                }
                break;
            }
        }
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1.0,
            life: 60
        });
    }

    createBurst(x, y) {
        const colors = ['#2dd4bf', '#0ea5e9', '#fb7185', '#ffffff'];
        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.2 + 0.8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2.5 + 1.2,
                alpha: 1,
                life: 25 + Math.random() * 15
            });
        }
    }

    placeFood() {
        const rand = Math.random();
        if (rand < 0.15) {
            this.snake.foodType = 'golden';
        } else if (rand < 0.30) {
            this.snake.foodType = 'rainbow';
        } else {
            this.snake.foodType = 'normal';
        }

        while (true) {
            const fx = Math.floor(Math.random() * this.cols);
            const fy = Math.floor(Math.random() * this.rows);
            const hitBody = this.snake.body.some(p => p.x === fx && p.y === fy);
            const hitObstacle = this.obstacles && this.obstacles.some(o => o.x === fx && o.y === fy);
            if (!hitBody && !hitObstacle) {
                this.snake.food = {x: fx, y: fy};
                return;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const s = this.size;

        // 1. Draw Cyber Grid
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        const pulseOpacity = 0.03 + Math.sin(Date.now() / 300) * 0.015;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
        this.ctx.lineWidth = 0.5;
        for (let c = 0; c <= this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * s, 0);
            this.ctx.lineTo(c * s, this.canvas.height);
            this.ctx.stroke();
        }
        for (let r = 0; r <= this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * s);
            this.ctx.lineTo(this.canvas.width, r * s);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. Draw Pulsing Glowing Food
        if (this.snake && this.snake.food) {
            this.ctx.save();
            const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;
            const radius = (s / 2) * pulse;
            const centerX = this.snake.food.x * s + s / 2;
            const centerY = this.snake.food.y * s + s / 2;

            let colorMain = '#fb7185';
            let colorCore = '#fff';
            let sparkleColor = '#fb7185';

            if (this.snake.foodType === 'golden') {
                colorMain = '#fbbf24';
                colorCore = '#fffbeb';
                sparkleColor = '#fbbf24';
            } else if (this.snake.foodType === 'rainbow') {
                const hue = (Date.now() / 5) % 360;
                colorMain = `hsl(${hue}, 100%, 60%)`;
                colorCore = `hsl(${(hue + 180) % 360}, 100%, 90%)`;
                sparkleColor = colorMain;
            }

            // Spawn ambient sparkles around food
            if (Math.random() < 0.18) {
                this.particles.push({
                    x: centerX + (Math.random() - 0.5) * 8,
                    y: centerY + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5 - 0.2, // slowly drift upwards
                    color: sparkleColor,
                    size: Math.random() * 1.5 + 1,
                    alpha: 1,
                    life: 30 + Math.random() * 20
                });
            }
            
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = colorMain;
            
            const grad = this.ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, radius);
            grad.addColorStop(0, colorCore);
            grad.addColorStop(0.3, colorMain);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw Obstacles (Cyber Walls)
        if (this.obstacles) {
            this.obstacles.forEach(o => {
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                this.ctx.strokeStyle = '#ef4444';
                this.ctx.lineWidth = 1.5;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#ef4444';
                
                this.ctx.beginPath();
                this.ctx.roundRect(o.x * s + 2, o.y * s + 2, s - 4, s - 4, 4);
                this.ctx.fill();
                this.ctx.stroke();
                
                // hazard stripes in wall
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(o.x * s + 4, o.y * s + 4);
                this.ctx.lineTo(o.x * s + s - 4, o.y * s + s - 4);
                this.ctx.moveTo(o.x * s + s - 4, o.y * s + 4);
                this.ctx.lineTo(o.x * s + 4, o.y * s + s - 4);
                this.ctx.stroke();
                this.ctx.restore();
            });
        }

        // 3. Draw Glowing Snake
        if (this.snake && this.snake.body) {
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';
            
            let startColor = 'rgba(14, 165, 233, ';
            let shadowColor = '#0ea5e9';
            let coreColor = primaryColor;

            if (this.shieldActive) {
                startColor = 'rgba(251, 191, 36, ';
                shadowColor = '#fbbf24';
                coreColor = '#fbbf24';
            } else if (this.speedBoostDuration > 0) {
                startColor = 'rgba(236, 72, 153, ';
                shadowColor = '#ec4899';
                coreColor = '#ec4899';
            }

            // Draw body segments (connected lines from tail to neck)
            if (this.snake.body.length > 1) {
                for (let i = this.snake.body.length - 1; i > 0; i--) {
                    const prev = this.snake.body[i - 1];
                    const curr = this.snake.body[i];
                    const prevCx = prev.x * s + s / 2;
                    const prevCy = prev.y * s + s / 2;
                    const currCx = curr.x * s + s / 2;
                    const currCy = curr.y * s + s / 2;
                    
                    const segmentFactor = Math.max(0.5, 1 - (i / this.snake.body.length) * 0.5);
                    const width = (s - 2) * segmentFactor;
                    const alpha = Math.max(0.3, 0.95 - (i / this.snake.body.length) * 0.55);
                    
                    this.ctx.save();
                    // Glow stroke
                    this.ctx.strokeStyle = `${startColor}${alpha})`;
                    this.ctx.lineWidth = width;
                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = shadowColor;
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevCx, prevCy);
                    this.ctx.lineTo(currCx, currCy);
                    this.ctx.stroke();
                    
                    // Core stroke (neon light tube effect)
                    this.ctx.strokeStyle = coreColor;
                    this.ctx.lineWidth = width * 0.4;
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevCx, prevCy);
                    this.ctx.lineTo(currCx, currCy);
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                }
            }
            
            // Draw head
            const head = this.snake.body[0];
            const cx = head.x * s + s / 2;
            const cy = head.y * s + s / 2;
            
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.shieldActive ? '#fbbf24' : (this.speedBoostDuration > 0 ? '#ec4899' : primaryColor);
            this.ctx.fillStyle = this.ctx.shadowColor;
            
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, s / 2 - 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes looking in moving direction
            this.ctx.fillStyle = '#fff';
            const eyeRadius = 2.2;
            const eyeOffset = 3.5;
            const dir = this.snake.dir;
            
            let eye1X, eye1Y, eye2X, eye2Y;
            if (dir.x !== 0) { // Moving horizontal
                eye1X = cx + dir.x * eyeOffset;
                eye1Y = cy - eyeOffset;
                eye2X = cx + dir.x * eyeOffset;
                eye2Y = cy + eyeOffset;
            } else { // Moving vertical
                eye1X = cx - eyeOffset;
                eye1Y = cy + dir.y * eyeOffset;
                eye2X = cx + eyeOffset;
                eye2Y = cy + dir.y * eyeOffset;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
            this.ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pupils
            this.ctx.fillStyle = '#0f172a';
            this.ctx.beginPath();
            this.ctx.arc(eye1X + (dir.x * 0.5), eye1Y + (dir.y * 0.5), 1, 0, Math.PI * 2);
            this.ctx.arc(eye2X + (dir.x * 0.5), eye2Y + (dir.y * 0.5), 1, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }

        // 4. Draw Sweeping Scanline
        this.scanlineY += 1.5;
        if (this.scanlineY > this.canvas.height) {
            this.scanlineY = 0;
        }
        this.ctx.save();
        const scanGrad = this.ctx.createLinearGradient(0, this.scanlineY - 8, 0, this.scanlineY + 8);
        scanGrad.addColorStop(0, 'rgba(45, 212, 191, 0)');
        scanGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.05)');
        scanGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
        this.ctx.fillStyle = scanGrad;
        this.ctx.fillRect(0, this.scanlineY - 8, this.canvas.width, 16);
        this.ctx.restore();

        // 5. Draw Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
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

        // Draw Floating Texts
        if (this.floatingTexts) {
            this.floatingTexts.forEach((ft) => {
                ft.y -= 0.5; // drift up
                ft.alpha = ft.life / 60;
                ft.life--;
                
                this.ctx.save();
                this.ctx.fillStyle = ft.color;
                this.ctx.globalAlpha = ft.alpha;
                this.ctx.font = 'bold 11px Outfit, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = ft.color;
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            });
            this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
        }

        // 6. Draw Paused Overlay
        if (this.isPaused) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 24px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

            this.ctx.font = '12px Outfit, sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText('Press P or Click Pause to Resume', this.canvas.width / 2, this.canvas.height / 2 + 15);
            this.ctx.restore();
        }
    }

    gameOver() {
        this.snake.alive = false;
        this.gameOverState = true;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        if (this.callbacks.onEnd) this.callbacks.onEnd(this.snake.score);
    }
}
