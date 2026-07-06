
import { SnakeGame } from './snake.js?v=6.3';
import { BlackjackGame } from './blackjack.js?v=6.3';
import { TetrisGame } from './tetris.js?v=6.3';
import { Game2048 } from './2048.js?v=6.3';
import { MinesweeperGame } from './minesweeper.js?v=6.3';
import { BreakoutGame } from './breakout.js?v=6.3';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            {
                id: 'snake',
                name: 'Snake',
                img: 'assets/snake.webp'
            },
            {
                id: 'blackjack',
                name: 'Blackjack',
                img: 'assets/blackjack.webp'
            },
            {
                id: 'tetris',
                name: 'Tetris',
                img: 'assets/tetris.webp'
            },
            {
                id: 'g2048',
                name: '2048',
                img: 'assets/2048.webp'
            },
            {
                id: 'minesweeper',
                name: 'Minesweeper',
                img: 'assets/minesweeper.webp'
            },
            {
                id: 'breakout',
                name: 'Breakout',
                img: 'assets/breakout.webp'
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
                                <img src="${g.img}" alt="${g.name}" draggable="false" />
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

    launch(id) {
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
        backBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">arrow_back</span> Back to Menu';
        backBtn.onclick = () => this.showMenu();

        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'game-pause-btn';
        pauseBtn.type = 'button';
        pauseBtn.style.display = 'none'; // Hidden by default, shown for pause-supporting games
        pauseBtn.setAttribute('aria-label', 'Pause game');
        pauseBtn.setAttribute('title', 'Pause game');
        pauseBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">pause</span> Pause';
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
                <button class="snake-btn" data-dir="up" type="button" aria-label="Move up" title="Move up"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_up</span></button>
                <div></div>
                <button class="snake-btn" data-dir="left" type="button" aria-label="Move left" title="Move left"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_left</span></button>
                <button class="snake-btn" data-dir="down" type="button" aria-label="Move down" title="Move down"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_down</span></button>
                <button class="snake-btn" data-dir="right" type="button" aria-label="Move right" title="Move right"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_right</span></button>
            `;

            snakeContainer.appendChild(canvasWrapper);
            snakeContainer.appendChild(controls);
            content.appendChild(snakeContainer);

            this.activeGame = new SnakeGame(canvas, {
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
                <button class="snake-btn" data-action="rotate" type="button" aria-label="Rotate block" title="Rotate block"><span class="material-symbols-rounded" aria-hidden="true">rotate_right</span></button>
                <button class="snake-btn" data-action="drop" type="button" aria-label="Soft drop" title="Soft drop"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_down</span></button>
                <button class="snake-btn" data-action="hard" type="button" aria-label="Hard drop" title="Hard drop"><span class="material-symbols-rounded" aria-hidden="true">vertical_align_bottom</span></button>
                <button class="snake-btn" data-action="left" type="button" aria-label="Move left" title="Move left"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_left</span></button>
                <div></div>
                <button class="snake-btn" data-action="right" type="button" aria-label="Move right" title="Move right"><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_right</span></button>
            `;

            tetrisContainer.appendChild(canvasWrapper);
            tetrisContainer.appendChild(controls);
            content.appendChild(tetrisContainer);

            this.activeGame = new TetrisGame(canvas, {
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
            this.activeGame = new BlackjackGame(content);
            this.activeGame.start();
        }
        else if (id === 'g2048') {
            this.activeGame = new Game2048(content);
            this.activeGame.start();
        }
        else if (id === 'minesweeper') {
            this.activeGame = new MinesweeperGame(content, {
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
            this.activeGame.start();
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

            this.activeGame = new BreakoutGame(canvas, {
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
            btn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">play_arrow</span> Resume';
            btn.classList.add('paused');
        } else {
            btn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">pause</span> Pause';
            btn.classList.remove('paused');
        }
    }
}
