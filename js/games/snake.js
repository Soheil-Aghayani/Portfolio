
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

        this.handleInput = this.handleInput.bind(this);
        this.resize();
    }

    resize() {
        if (!this.canvas) return;
        // Assuming fixed size for now as per original css, but adaptable
        this.cols = Math.floor(this.canvas.width / this.size);
        this.rows = Math.floor(this.canvas.height / this.size);
    }

    start() {
        this.resize();
        this.snake = {
            dir: {x:1, y:0},
            nextDir: {x:1, y:0},
            body: [{x: Math.floor(this.cols/2), y: Math.floor(this.rows/2)}],
            food: null,
            score: 0,
            alive: true
        };

        this.placeFood();
        this.draw();

        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), 120);

        // Attach input listeners
        window.addEventListener('keydown', this.handleInput);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        window.removeEventListener('keydown', this.handleInput);
    }

    handleInput(e) {
        if (!this.snake || !this.snake.alive) return;

        switch(e.key) {
            case 'ArrowUp': this.setDir(0, -1); break;
            case 'ArrowDown': this.setDir(0, 1); break;
            case 'ArrowLeft': this.setDir(-1, 0); break;
            case 'ArrowRight': this.setDir(1, 0); break;
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
            this.placeFood();
        } else {
            this.snake.body.pop();
        }

        this.draw();
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

        // BG
        this.ctx.fillStyle = 'rgba(2,6,23,0.55)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const s = this.size;

        // Food
        if (this.snake.food) {
            this.ctx.fillStyle = 'rgba(96,165,250,0.95)';
            this.ctx.fillRect(this.snake.food.x * s, this.snake.food.y * s, s, s);
        }

        // Body
        for (let i = 0; i < this.snake.body.length; i++) {
            const p = this.snake.body[i];
            this.ctx.fillStyle = i === 0 ? 'rgba(45,212,191,0.95)' : 'rgba(226,232,240,0.75)';
            this.ctx.fillRect(p.x * s, p.y * s, s, s);
        }
    }

    gameOver() {
        this.snake.alive = false;
        this.stop();
        if (this.callbacks.onEnd) this.callbacks.onEnd(this.snake.score);
    }
}
