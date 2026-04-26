// js/snake.js

export function initSnakeGame(canvas, scoreEl, callbacks) {
    // callbacks expects: { onLog, onExit }
    let snake = null;
    let snakeTimer = null;

    function reset() {
        const size = 18;
        // Handle case where canvas might be hidden/missing
        const w = canvas ? canvas.width : 360;
        const h = canvas ? canvas.height : 360;
        const cols = Math.floor(w / size);
        const rows = Math.floor(h / size);

        snake = {
            size, cols, rows,
            dir: {x:1, y:0},
            nextDir: {x:1, y:0},
            body: [{x: Math.floor(cols/2), y: Math.floor(rows/2)}],
            food: null,
            score: 0,
            alive: true
        };
        
        placeFood();
        draw();
        if (scoreEl) scoreEl.textContent = '0';
    }

    function placeFood() {
        if (!snake) return;
        while (true) {
            const fx = Math.floor(Math.random() * snake.cols);
            const fy = Math.floor(Math.random() * snake.rows);
            const hit = snake.body.some(p => p.x === fx && p.y === fy);
            if (!hit) { snake.food = {x:fx, y:fy}; return; }
        }
    }

    function draw() {
        if (!canvas || !snake) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(2,6,23,0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const s = snake.size;

        // Draw Food
        if (snake.food) {
            ctx.fillStyle = 'rgba(96,165,250,0.95)';
            ctx.fillRect(snake.food.x * s, snake.food.y * s, s, s);
        }

        // Draw Snake
        for (let i = 0; i < snake.body.length; i++) {
            const p = snake.body[i];
            ctx.fillStyle = i === 0 ? 'rgba(45,212,191,0.95)' : 'rgba(226,232,240,0.75)';
            ctx.fillRect(p.x * s, p.y * s, s, s);
        }
    }

    function tick() {
        if (!snake || !snake.alive) return;

        snake.dir = snake.nextDir;
        const head = snake.body[0];
        const nx = head.x + snake.dir.x;
        const ny = head.y + snake.dir.y;

        // Check walls or self-collision
        if (nx < 0 || ny < 0 || nx >= snake.cols || ny >= snake.rows || 
            snake.body.some((p, idx) => idx !== 0 && p.x === nx && p.y === ny)) {
            snake.alive = false;
            stop();
            if (callbacks.onLog) callbacks.onLog('Snake ended. Score: ' + snake.score, 'os-warn');
            if (callbacks.onLog) callbacks.onLog('Press Esc or close button.', 'os-dim');
            return;
        }

        snake.body.unshift({x: nx, y: ny});

        if (snake.food && nx === snake.food.x && ny === snake.food.y) {
            snake.score += 1;
            if (scoreEl) scoreEl.textContent = String(snake.score);
            placeFood();
        } else {
            snake.body.pop();
        }
        draw();
    }

    function start() {
        reset();
        if (snakeTimer) clearInterval(snakeTimer);
        snakeTimer = setInterval(tick, 120);
        if (callbacks.onLog) callbacks.onLog('Snake started. Arrow keys or buttons.', 'os-warn');
    }

    function stop() {
        if (snakeTimer) { clearInterval(snakeTimer); snakeTimer = null; }
    }

    function setDir(dx, dy) {
        if (!snake || !snake.alive) return;
        // Prevent 180 degree turns
        if (snake.dir.x === -dx && snake.dir.y === -dy) return;
        snake.nextDir = {x: dx, y: dy};
    }

    return { start, stop, setDir };
}