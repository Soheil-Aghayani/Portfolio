
const GAME_LOADERS = {
    snake: () => import('./snake.js?v=6.4').then(module => module.SnakeGame),
    blackjack: () => import('./blackjack.js?v=6.4').then(module => module.BlackjackGame),
    tetris: () => import('./tetris.js?v=6.4').then(module => module.TetrisGame),
    g2048: () => import('./2048.js?v=6.4').then(module => module.Game2048),
    minesweeper: () => import('./minesweeper.js?v=9.0').then(module => module.MinesweeperGame),
    breakout: () => import('./breakout.js?v=6.4').then(module => module.BreakoutGame),
    invaders: () => import('./invaders.js?v=6.4').then(module => module.InvadersGame)
};

const localIcon = (name, options = {}) => window.IconRegistry
    ? window.IconRegistry.svg(name, options)
    : '';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            {
                id: 'snake',
                name: 'Snake',
                img: 'assets/images/games/snake.webp'
            },
            {
                id: 'blackjack',
                name: 'Blackjack',
                img: 'assets/images/games/blackjack.webp'
            },
            {
                id: 'tetris',
                name: 'Tetris',
                img: 'assets/images/games/tetris.webp'
            },
            {
                id: 'g2048',
                name: '2048',
                img: 'assets/images/games/2048.webp'
            },
            {
                id: 'minesweeper',
                name: 'Minesweeper',
                img: 'assets/images/games/minesweeper.webp'
            },
            {
                id: 'breakout',
                name: 'Breakout',
                img: 'assets/images/games/breakout.webp'
            },
            {
                id: 'invaders',
                name: 'Space Shooter',
                img: 'assets/images/games/invaders.webp'
            }
        ];

        this.activeGame = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="app-body">
                <div id="gameMenu" class="game-grid">
                    ${this.games.map(g => `
                        <div class="game-icon" data-id="${g.id}" role="button" tabindex="0" aria-label="Launch ${g.name}">
                            <div class="game-icon-img">
                            <img src="${g.img}" alt="${g.name}" loading="lazy" decoding="async" draggable="false" />
                            </div>
                            <span class="game-icon-name">${g.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div id="gameStage" class="game-container" style="display:none;"></div>
            </div>
        `;

        this.container.querySelectorAll('.game-icon').forEach(btn => {
            const launchGame = () => {
                this.lastFocusedGameIcon = btn;
                this.launch(btn.dataset.id);
            };
            btn.addEventListener('click', launchGame);
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent scrolling on Space
                    launchGame();
                }
            });
        });
    }

    async launch(id) {
        const loadGame = GAME_LOADERS[id];
        if (!loadGame) return;

        let GameClass;
        try {
            GameClass = await loadGame();
        } catch (error) {
            console.error(`Failed to load ${id} game`, error);
            this.showMenu();
            return;
        }

        const stage = this.container.querySelector('#gameStage');
        const menu = this.container.querySelector('#gameMenu');

        // Hide Menu, Show Stage
        menu.style.display = 'none';
        stage.style.display = 'flex';
        stage.innerHTML = ''; // clear previous

        // Wrapper for game
        const gameWrap = document.createElement('div');
        gameWrap.className = 'game-stage-wrapper';

        stage.appendChild(gameWrap);

        // Navigation bar
        const navBar = document.createElement('div');
        navBar.className = 'game-navbar';
        navBar.style.width = '100%';
        navBar.style.padding = '10px 20px';
        navBar.style.display = 'flex';
        navBar.style.justifyContent = 'flex-start';
        navBar.style.alignItems = 'center';

        const backBtn = document.createElement('button');
        backBtn.className = 'game-back-btn';
        backBtn.type = 'button';
        backBtn.setAttribute('aria-label', 'Back to Game Menu');
        backBtn.setAttribute('title', 'Back to Game Menu');
        backBtn.innerHTML = `${localIcon('games/shared/arrow-back', { label: 'Back' })} Back to Menu`;
        backBtn.onclick = () => this.confirmExit(() => this.showMenu());

        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'game-pause-btn';
        pauseBtn.type = 'button';
        pauseBtn.style.display = 'none'; // Hidden by default, shown for pause-supporting games
        pauseBtn.setAttribute('aria-label', 'Pause game');
        pauseBtn.setAttribute('title', 'Pause game');
        pauseBtn.innerHTML = `${localIcon('games/shared/pause', { label: 'Pause' })} Pause`;
        pauseBtn.onclick = () => {
            if (this.activeGame && typeof this.activeGame.togglePause === 'function') {
                this.activeGame.togglePause();
            }
        };

        navBar.appendChild(backBtn);
        navBar.appendChild(pauseBtn);
        gameWrap.appendChild(navBar);

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.width = '100%';
        content.style.position = 'relative'; // Ensure overlay works if needed
        content.setAttribute('tabindex', '-1');
        content.style.outline = 'none';
        gameWrap.appendChild(content);

        if (id === 'snake') {
            // High Score Board
            const savedHighScore = localStorage.getItem('snake_high_score') || 0;

            const scoreBoard = document.createElement('div');
            scoreBoard.className = 'snake-scoreboard';
            scoreBoard.innerHTML = `
                <div class="snake-score-item">SCORE <span id="snakeScore">0</span></div>
                <div class="snake-score-item">HIGH SCORE <span id="snakeHighScore">${savedHighScore}</span></div>
            `;

            // Insert ScoreBoard before content
            gameWrap.insertBefore(scoreBoard, content);

            // Container for Canvas + Controls
            const snakeContainer = document.createElement('div');
            snakeContainer.style.display = 'flex';
            snakeContainer.style.flexDirection = 'column';
            snakeContainer.style.alignItems = 'center';
            snakeContainer.style.gap = '15px';

            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'game-canvas-wrapper';

            const canvas = document.createElement('canvas');
            canvas.width = 360;
            canvas.height = 360;
            canvas.className = 'in-app-game-canvas';

            // HTML Overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-overlay';
            overlay.id = 'snakeOverlay';
            overlay.innerHTML = `
                <div class="game-overlay-title">GAME OVER</div>
                <div class="game-overlay-msg" id="snakeOverlayMsg"></div>
                <button class="game-overlay-btn" id="snakeOverlayBtn" type="button">Play Again</button>
            `;

            canvasWrapper.appendChild(canvas);
            canvasWrapper.appendChild(overlay);

            // Mobile Controls
            const controls = document.createElement('div');
            controls.className = 'snake-controls';
            controls.innerHTML = `
                <div></div>
                <button class="snake-btn" data-dir="up" type="button" aria-label="Move up" title="Move up">${localIcon('games/shared/arrow-up', { label: 'Move up' })}</button>
                <div></div>
                <button class="snake-btn" data-dir="left" type="button" aria-label="Move left" title="Move left">${localIcon('games/shared/arrow-left', { label: 'Move left' })}</button>
                <button class="snake-btn" data-dir="down" type="button" aria-label="Move down" title="Move down">${localIcon('games/shared/arrow-down', { label: 'Move down' })}</button>
                <button class="snake-btn" data-dir="right" type="button" aria-label="Move right" title="Move right">${localIcon('games/shared/arrow-right', { label: 'Move right' })}</button>
            `;

            snakeContainer.appendChild(canvasWrapper);
            snakeContainer.appendChild(controls);
            content.appendChild(snakeContainer);

            this.activeGame = new GameClass(canvas, {
                onScore: (score) => {
                    document.getElementById('snakeScore').textContent = score;
                    const curHigh = parseInt(localStorage.getItem('snake_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('snake_high_score', score);
                        document.getElementById('snakeHighScore').textContent = score;
                    }
                },
                onStart: () => {
                    document.getElementById('snakeScore').textContent = 0;
                    overlay.classList.remove('show');
                    pauseBtn.style.display = 'inline-flex';
                    this.updatePauseButtonState(pauseBtn, false);
                },
                onEnd: (score) => {
                    pauseBtn.style.display = 'none';
                    const curHigh = parseInt(localStorage.getItem('snake_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('snake_high_score', score);
                        document.getElementById('snakeHighScore').textContent = score;
                    }
                    
                    const overlayMsg = document.getElementById('snakeOverlayMsg');
                    const updatedHigh = localStorage.getItem('snake_high_score') || 0;
                    overlayMsg.innerHTML = `Score: ${score}<br>High Score: ${updatedHigh}`;
                    
                    const overlayBtn = document.getElementById('snakeOverlayBtn');
                    overlayBtn.onclick = () => {
                        overlay.classList.remove('show');
                        this.activeGame.start();
                        content.focus();
                    };
                    
                    overlay.classList.add('show');
                },
                onPauseToggle: (isPaused) => {
                    this.updatePauseButtonState(pauseBtn, isPaused);
                }
            });

            // Wire up controls
            controls.querySelectorAll('.snake-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent canvas click trigger
                    const dir = btn.dataset.dir;
                    if (dir === 'up') this.activeGame.setDir(0, -1);
                    if (dir === 'down') this.activeGame.setDir(0, 1);
                    if (dir === 'left') this.activeGame.setDir(-1, 0);
                    if (dir === 'right') this.activeGame.setDir(1, 0);
                });
            });

            this.activeGame.start();
            content.focus();
        }
        else if (id === 'tetris') {
            const savedHighScore = localStorage.getItem('tetris_high_score') || 0;

            const scoreBoard = document.createElement('div');
            scoreBoard.className = 'snake-scoreboard';
            scoreBoard.style.maxWidth = '180px'; // Align with the 180px Tetris board width
            scoreBoard.innerHTML = `
                <div class="snake-score-item">SCORE <span id="tetrisScore">0</span></div>
                <div class="snake-score-item">LEVEL <span id="tetrisLevel">1</span></div>
                <div class="snake-score-item">HIGH <span id="tetrisHighScore">${savedHighScore}</span></div>
            `;

            // Insert ScoreBoard before content
            gameWrap.insertBefore(scoreBoard, content);

            // Container for Canvas + Controls
            const tetrisContainer = document.createElement('div');
            tetrisContainer.style.display = 'flex';
            tetrisContainer.style.flexDirection = 'column';
            tetrisContainer.style.alignItems = 'center';
            tetrisContainer.style.gap = '15px';

            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'game-canvas-wrapper tetris-wrapper';

            const canvas = document.createElement('canvas');
            canvas.height = 360; // tileSize is dynamically set, canvas width is computed in game
            canvas.className = 'in-app-game-canvas';

            // HTML Overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-overlay';
            overlay.id = 'tetrisOverlay';
            overlay.innerHTML = `
                <div class="game-overlay-title" style="font-size:1.5rem;">GAME OVER</div>
                <div class="game-overlay-msg" id="tetrisOverlayMsg" style="font-size:0.85rem;"></div>
                <button class="game-overlay-btn" id="tetrisOverlayBtn" type="button" style="padding:10px 18px; font-size:0.85rem;">Play Again</button>
            `;

            canvasWrapper.appendChild(canvas);
            canvasWrapper.appendChild(overlay);

            // Mobile Controls
            const controls = document.createElement('div');
            controls.className = 'snake-controls';
            controls.innerHTML = `
                <button class="snake-btn" data-action="rotate" type="button" aria-label="Rotate block" title="Rotate block">${localIcon('games/shared/rotate', { label: 'Rotate block' })}</button>
                <button class="snake-btn" data-action="drop" type="button" aria-label="Soft drop" title="Soft drop">${localIcon('games/shared/arrow-down', { label: 'Soft drop' })}</button>
                <button class="snake-btn" data-action="hard" type="button" aria-label="Hard drop" title="Hard drop">${localIcon('games/shared/arrow-down', { label: 'Hard drop' })}</button>
                <button class="snake-btn" data-action="left" type="button" aria-label="Move left" title="Move left">${localIcon('games/shared/arrow-left', { label: 'Move left' })}</button>
                <div></div>
                <button class="snake-btn" data-action="right" type="button" aria-label="Move right" title="Move right">${localIcon('games/shared/arrow-right', { label: 'Move right' })}</button>
            `;

            tetrisContainer.appendChild(canvasWrapper);
            tetrisContainer.appendChild(controls);
            content.appendChild(tetrisContainer);

            this.activeGame = new GameClass(canvas, {
                onScore: (score, level) => {
                    document.getElementById('tetrisScore').textContent = score;
                    document.getElementById('tetrisLevel').textContent = level;
                    const curHigh = parseInt(localStorage.getItem('tetris_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('tetris_high_score', score);
                        document.getElementById('tetrisHighScore').textContent = score;
                    }
                },
                onStart: () => {
                    document.getElementById('tetrisScore').textContent = 0;
                    document.getElementById('tetrisLevel').textContent = 1;
                    overlay.classList.remove('show');
                    pauseBtn.style.display = 'inline-flex';
                    this.updatePauseButtonState(pauseBtn, false);
                },
                onEnd: (score) => {
                    pauseBtn.style.display = 'none';
                    const curHigh = parseInt(localStorage.getItem('tetris_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('tetris_high_score', score);
                        document.getElementById('tetrisHighScore').textContent = score;
                    }
                    
                    const overlayMsg = document.getElementById('tetrisOverlayMsg');
                    const updatedHigh = localStorage.getItem('tetris_high_score') || 0;
                    overlayMsg.innerHTML = `Score: ${score}<br>High Score: ${updatedHigh}`;

                    const overlayBtn = document.getElementById('tetrisOverlayBtn');
                    overlayBtn.onclick = () => {
                        overlay.classList.remove('show');
                        this.activeGame.start();
                        content.focus();
                    };

                    overlay.classList.add('show');
                },
                onPauseToggle: (isPaused) => {
                    this.updatePauseButtonState(pauseBtn, isPaused);
                }
            });

            // Wire up controls
            controls.querySelectorAll('.snake-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const act = btn.dataset.action;
                    if (act === 'left') this.activeGame.move(-1);
                    if (act === 'right') this.activeGame.move(1);
                    if (act === 'rotate') { this.activeGame.rotate(); this.activeGame.draw(); }
                    if (act === 'drop') this.activeGame.drop();
                    if (act === 'hard') this.activeGame.hardDrop();
                });
            });

            this.activeGame.start();
            content.focus();
        }
        else if (id === 'blackjack') {
            this.activeGame = new GameClass(content);
            this.activeGame.start();
        }
        else if (id === 'g2048') {
            this.activeGame = new GameClass(content);
            this.activeGame.start();
        }
        else if (id === 'minesweeper') {
            this.activeGame = new GameClass(content, {
                onStart: () => {
                    pauseBtn.style.display = 'inline-flex';
                    this.updatePauseButtonState(pauseBtn, false);
                },
                onEnd: () => {
                    pauseBtn.style.display = 'none';
                },
                onPauseToggle: (isPaused) => {
                    this.updatePauseButtonState(pauseBtn, isPaused);
                }
            });
            // The constructor calls showStartMenu() — no need to call .start() here
        }
        else if (id === 'breakout') {
            const savedHighScore = localStorage.getItem('breakout_high_score') || 0;

            const scoreBoard = document.createElement('div');
            scoreBoard.className = 'snake-scoreboard';
            scoreBoard.innerHTML = `
                <div class="snake-score-item">SCORE <span id="breakoutScore">0</span></div>
                <div class="snake-score-item">LEVEL <span id="breakoutLevel">1</span></div>
                <div class="snake-score-item">HIGH SCORE <span id="breakoutHighScore">${savedHighScore}</span></div>
            `;

            gameWrap.insertBefore(scoreBoard, content);

            const breakoutContainer = document.createElement('div');
            breakoutContainer.style.display = 'flex';
            breakoutContainer.style.flexDirection = 'column';
            breakoutContainer.style.alignItems = 'center';
            breakoutContainer.style.gap = '15px';

            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'game-canvas-wrapper';

            const canvas = document.createElement('canvas');
            canvas.width = 360;
            canvas.height = 360;
            canvas.className = 'in-app-game-canvas';

            // HTML Overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-overlay';
            overlay.id = 'breakoutOverlay';
            overlay.innerHTML = `
                <div class="game-overlay-title" id="breakoutOverlayTitle">GAME OVER</div>
                <div class="game-overlay-msg" id="breakoutOverlayMsg"></div>
                <button class="game-overlay-btn" id="breakoutOverlayBtn" type="button">Play Again</button>
            `;

            canvasWrapper.appendChild(canvas);
            canvasWrapper.appendChild(overlay);

            breakoutContainer.appendChild(canvasWrapper);
            content.appendChild(breakoutContainer);

            this.activeGame = new GameClass(canvas, {
                onScore: (score, level) => {
                    document.getElementById('breakoutScore').textContent = score;
                    if (document.getElementById('breakoutLevel')) {
                        document.getElementById('breakoutLevel').textContent = level;
                    }
                    const curHigh = parseInt(localStorage.getItem('breakout_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('breakout_high_score', score);
                        document.getElementById('breakoutHighScore').textContent = score;
                    }
                },
                onStart: () => {
                    document.getElementById('breakoutScore').textContent = 0;
                    if (document.getElementById('breakoutLevel')) {
                        document.getElementById('breakoutLevel').textContent = 1;
                    }
                    overlay.classList.remove('show');
                    pauseBtn.style.display = 'inline-flex';
                    this.updatePauseButtonState(pauseBtn, false);
                },
                onEnd: (score, isWin) => {
                    pauseBtn.style.display = 'none';
                    const curHigh = parseInt(localStorage.getItem('breakout_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('breakout_high_score', score);
                        document.getElementById('breakoutHighScore').textContent = score;
                    }

                    const overlayTitle = document.getElementById('breakoutOverlayTitle');
                    overlayTitle.textContent = isWin ? 'YOU WIN!' : 'GAME OVER';
                    overlayTitle.style.color = isWin ? 'var(--primary)' : '#ef4444';

                    const overlayMsg = document.getElementById('breakoutOverlayMsg');
                    const updatedHigh = localStorage.getItem('breakout_high_score') || 0;
                    overlayMsg.innerHTML = isWin 
                        ? `Congratulations! You cleared all bricks!<br>Score: ${score}<br>High Score: ${updatedHigh}`
                        : `Score: ${score}<br>High Score: ${updatedHigh}`;

                    const overlayBtn = document.getElementById('breakoutOverlayBtn');
                    overlayBtn.onclick = () => {
                        overlay.classList.remove('show');
                        this.activeGame.start();
                        content.focus();
                    };

                    overlay.classList.add('show');
                },
                onPauseToggle: (isPaused) => {
                    this.updatePauseButtonState(pauseBtn, isPaused);
                }
            });

            this.activeGame.start();
            content.focus();
        }
        else if (id === 'invaders') {
            const savedHighScore = localStorage.getItem('invaders_high_score') || 0;

            const scoreBoard = document.createElement('div');
            scoreBoard.className = 'snake-scoreboard';
            scoreBoard.innerHTML = `
                <div class="snake-score-item">SCORE <span id="invadersScore">0</span></div>
                <div class="snake-score-item">WAVE <span id="invadersLevel">1</span></div>
                <div class="snake-score-item">HIGH SCORE <span id="invadersHighScore">${savedHighScore}</span></div>
            `;

            gameWrap.insertBefore(scoreBoard, content);

            const invadersContainer = document.createElement('div');
            invadersContainer.style.display = 'flex';
            invadersContainer.style.flexDirection = 'column';
            invadersContainer.style.alignItems = 'center';
            invadersContainer.style.gap = '15px';

            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'game-canvas-wrapper';

            const canvas = document.createElement('canvas');
            canvas.width = 360;
            canvas.height = 360;
            canvas.className = 'in-app-game-canvas';

            // HTML Overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-overlay';
            overlay.id = 'invadersOverlay';
            overlay.innerHTML = `
                <div class="game-overlay-title" id="invadersOverlayTitle">GAME OVER</div>
                <div class="game-overlay-msg" id="invadersOverlayMsg"></div>
                <button class="game-overlay-btn" id="invadersOverlayBtn" type="button">Play Again</button>
            `;

            canvasWrapper.appendChild(canvas);
            canvasWrapper.appendChild(overlay);

            invadersContainer.appendChild(canvasWrapper);

            // Mobile D-pad controls (Autofire is always active)
            const mobileControls = document.createElement('div');
            mobileControls.style.cssText = `
                display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center;
                width: 100%; padding: 4px 0;
            `;

            const buttonsRow = document.createElement('div');
            buttonsRow.style.cssText = `
                display: flex; gap: 30px; align-items: center; justify-content: center;
                width: 100%;
            `;

            const btnStyle = (color) => `
                background: ${color}22; border: 1px solid ${color}55; color: ${color};
                border-radius: 14px; font-size: 24px; padding: 12px 32px; cursor: pointer;
                user-select: none; -webkit-user-select: none; touch-action: none;
                font-family: monospace; font-weight: bold; min-width: 110px; text-align: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: all 0.1s;
            `;

            const leftBtn = document.createElement('button');
            leftBtn.innerHTML = localIcon('games/shared/arrow-left', { label: 'Move left' });
            leftBtn.style.cssText = btnStyle('#2dd4bf');
            leftBtn.setAttribute('aria-label', 'Move Left');

            const rightBtn = document.createElement('button');
            rightBtn.innerHTML = localIcon('games/shared/arrow-right', { label: 'Move right' });
            rightBtn.style.cssText = btnStyle('#2dd4bf');
            rightBtn.setAttribute('aria-label', 'Move Right');

            // Touch events for D-pad buttons
            leftBtn.addEventListener('touchstart',  (e) => { e.preventDefault(); if(this.activeGame) this.activeGame.leftPressed = true;  }, { passive: false });
            leftBtn.addEventListener('touchend',    (e) => { e.preventDefault(); if(this.activeGame) this.activeGame.leftPressed = false; }, { passive: false });
            leftBtn.addEventListener('mousedown',   ()  => { if(this.activeGame) this.activeGame.leftPressed = true;  });
            leftBtn.addEventListener('mouseup',     ()  => { if(this.activeGame) this.activeGame.leftPressed = false; });

            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if(this.activeGame) this.activeGame.rightPressed = true;  }, { passive: false });
            rightBtn.addEventListener('touchend',   (e) => { e.preventDefault(); if(this.activeGame) this.activeGame.rightPressed = false; }, { passive: false });
            rightBtn.addEventListener('mousedown',  ()  => { if(this.activeGame) this.activeGame.rightPressed = true;  });
            rightBtn.addEventListener('mouseup',    ()  => { if(this.activeGame) this.activeGame.rightPressed = false; });

            const infoLabel = document.createElement('div');
            infoLabel.innerHTML = `${localIcon('games/minesweeper/pixel-invader', { className: 'game-inline-icon', label: 'Auto-fire' })} AUTO-FIRE ACTIVE`;
            infoLabel.style.cssText = 'color: #10b981; font-size: 10px; font-weight: 800; letter-spacing: 1px; font-family: monospace; text-shadow: 0 0 6px rgba(16,185,129,0.4);';

            buttonsRow.appendChild(leftBtn);
            buttonsRow.appendChild(rightBtn);
            mobileControls.appendChild(buttonsRow);
            mobileControls.appendChild(infoLabel);
            invadersContainer.appendChild(mobileControls);

            content.appendChild(invadersContainer);

            this.activeGame = new GameClass(canvas, {
                onScore: (score, level) => {
                    document.getElementById('invadersScore').textContent = score;
                    if (document.getElementById('invadersLevel')) {
                        document.getElementById('invadersLevel').textContent = level;
                    }
                    const curHigh = parseInt(localStorage.getItem('invaders_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('invaders_high_score', score);
                        document.getElementById('invadersHighScore').textContent = score;
                    }
                },
                onStart: () => {
                    document.getElementById('invadersScore').textContent = 0;
                    if (document.getElementById('invadersLevel')) {
                        document.getElementById('invadersLevel').textContent = 1;
                    }
                    overlay.classList.remove('show');
                    pauseBtn.style.display = 'inline-flex';
                    this.updatePauseButtonState(pauseBtn, false);
                },
                onEnd: (score) => {
                    pauseBtn.style.display = 'none';
                    const curHigh = parseInt(localStorage.getItem('invaders_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('invaders_high_score', score);
                        document.getElementById('invadersHighScore').textContent = score;
                    }

                    const overlayTitle = document.getElementById('invadersOverlayTitle');
                    overlayTitle.textContent = 'GAME OVER';
                    overlayTitle.style.color = '#ef4444';

                    const overlayMsg = document.getElementById('invadersOverlayMsg');
                    const updatedHigh = localStorage.getItem('invaders_high_score') || 0;
                    overlayMsg.innerHTML = `Final Score: ${score}<br>High Score: ${updatedHigh}`;

                    const overlayBtn = document.getElementById('invadersOverlayBtn');
                    overlayBtn.onclick = () => {
                        overlay.classList.remove('show');
                        this.activeGame.start();
                        content.focus();
                    };

                    overlay.classList.add('show');
                },
                onPauseToggle: (isPaused) => {
                    this.updatePauseButtonState(pauseBtn, isPaused);
                }
            });

            this.activeGame.start();
            content.focus();
        }
    }

    isGameActive() {
        if (!this.activeGame) return false;
        if (this.activeGame.gameOverState) return false;
        // Minesweeper check: active if firstClick is false (sweep started)
        if (typeof this.activeGame.firstClick === 'boolean') {
            return this.activeGame.firstClick === false;
        }
        if (this.activeGame.running || this.activeGame.inHand) return true;
        if (typeof this.activeGame.score === 'number' && this.activeGame.score > 0) return true;
        return true;
    }

    confirmExit(onConfirm) {
        if (!this.isGameActive()) {
            if (onConfirm) onConfirm();
            return;
        }

        if (this.activeGame && typeof this.activeGame.togglePause === 'function' && !this.activeGame.isPaused) {
            this.activeGame.togglePause();
        }

        let confirmOverlay = this.container.querySelector('#gameConfirmOverlay');
        if (!confirmOverlay) {
            confirmOverlay = document.createElement('div');
            confirmOverlay.id = 'gameConfirmOverlay';
            confirmOverlay.className = 'game-confirm-overlay';
            confirmOverlay.innerHTML = `
                <div class="game-confirm-box">
                    <div class="game-confirm-icon">${localIcon('states/warning', { label: 'Warning' })}</div>
                    <div class="game-confirm-title">QUIT CURRENT GAME?</div>
                    <div class="game-confirm-msg">You have a game run in progress. Exiting now will discard your current active progress.</div>
                    <div class="game-confirm-actions">
                        <button class="ms-btn game-confirm-resume-btn" id="gameConfirmResumeBtn" type="button">RESUME GAME</button>
                        <button class="ms-btn game-confirm-quit-btn" id="gameConfirmQuitBtn" type="button">QUIT SESSION</button>
                    </div>
                </div>
            `;
            const appBodyDiv = this.container.querySelector('.app-body') || this.container;
            appBodyDiv.appendChild(confirmOverlay);
        }

        const resumeBtn = confirmOverlay.querySelector('#gameConfirmResumeBtn');
        const quitBtn   = confirmOverlay.querySelector('#gameConfirmQuitBtn');

        const hideModal = () => confirmOverlay.classList.remove('show');

        resumeBtn.onclick = () => {
            hideModal();
            if (this.activeGame && typeof this.activeGame.togglePause === 'function' && this.activeGame.isPaused) {
                this.activeGame.togglePause();
            }
        };

        quitBtn.onclick = () => {
            hideModal();
            if (onConfirm) onConfirm();
        };

        confirmOverlay.classList.add('show');
    }

    showMenu() {
        if (this.activeGame && this.activeGame.stop) {
            this.activeGame.stop();
        }
        this.activeGame = null;

        // Hide pause button when going back to menu
        const pauseBtn = this.container.querySelector('.game-pause-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';

        const stage = this.container.querySelector('#gameStage');
        const menu = this.container.querySelector('#gameMenu');
        stage.style.display = 'none';
        menu.style.display = 'grid';

        if (this.lastFocusedGameIcon) {
            this.lastFocusedGameIcon.focus();
        }
    }

    updatePauseButtonState(btn, isPaused) {
        if (!btn) return;
        if (isPaused) {
            btn.innerHTML = `${localIcon('games/shared/play', { label: 'Resume' })} Resume`;
            btn.classList.add('paused');
        } else {
            btn.innerHTML = `${localIcon('games/shared/pause', { label: 'Pause' })} Pause`;
            btn.classList.remove('paused');
        }
    }
}
