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
        this.particles = [];
        this.scanlineY = 0;
        this.snake = {
            dir: {x:1, y:0},
            nextDir: {x:1, y:0},
            body: [{x: Math.floor(this.cols/2), y: Math.floor(this.rows/2)}],
            food: null,
            score: 0,
            alive: true
        };

        this.placeFood();

        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), 120);

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
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
        window.removeEventListener('keydown', this.handleInput);
    }

    pause() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
    }

    handleInput(e) {
        if (this.gameOverState) {
            if (e.key === ' ' || e.key === 'Enter') {
                this.start();
            }
            return;
        }

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

        this.snake.dir = this.snake.nextDir;
        const head = this.snake.body[0];
        const nx = head.x + this.snake.dir.x;
        const ny = head.y + this.snake.dir.y;

        // Wall collision
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) {
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.body.some((p, idx) => idx !== 0 && p.x === nx && p.y === ny)) {
            this.gameOver();
            return;
        }

        this.snake.body.unshift({x: nx, y: ny});

        // Eat food
        if (this.snake.food && nx === this.snake.food.x && ny === this.snake.food.y) {
            this.snake.score += 1;
            if (this.callbacks.onScore) this.callbacks.onScore(this.snake.score);
            this.createBurst(nx * this.size + this.size / 2, ny * this.size + this.size / 2);
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
                    color: '#0ea5e9',
                    size: Math.random() * 2 + 0.8,
                    alpha: 0.8,
                    life: 25 + Math.random() * 15
                });
            }
        }
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
                life: 20 + Math.random() * 15
            });
        }
    }

    placeFood() {
        while (true) {
            const fx = Math.floor(Math.random() * this.cols);
            const fy = Math.floor(Math.random() * this.rows);
            const hit = this.snake.body.some(p => p.x === fx && p.y === fy);
            if (!hit) {
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

            // Spawn ambient sparkles around food
            if (Math.random() < 0.15) {
                this.particles.push({
                    x: centerX + (Math.random() - 0.5) * 8,
                    y: centerY + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5 - 0.2, // slowly drift upwards
                    color: '#fb7185',
                    size: Math.random() * 1.5 + 1,
                    alpha: 1,
                    life: 30 + Math.random() * 20
                });
            }
            
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#fb7185';
            
            const grad = this.ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, radius);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, '#fb7185');
            grad.addColorStop(1, 'rgba(251, 113, 133, 0)');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 3. Draw Glowing Snake
        if (this.snake && this.snake.body) {
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2dd4bf';
            
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
                    this.ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
                    this.ctx.lineWidth = width;
                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = '#0ea5e9';
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevCx, prevCy);
                    this.ctx.lineTo(currCx, currCy);
                    this.ctx.stroke();
                    
                    // Core stroke (neon light tube effect)
                    this.ctx.strokeStyle = primaryColor;
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
            this.ctx.shadowColor = primaryColor;
            this.ctx.fillStyle = primaryColor;
            
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
    }

    gameOver() {
        this.snake.alive = false;
        this.gameOverState = true;
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        if (this.callbacks.onEnd) this.callbacks.onEnd(this.snake.score);
    }
}
