
import { SnakeGame } from './snake.js?v=2.2';
import { BlackjackGame } from './blackjack.js?v=2.2';
import { TetrisGame } from './tetris.js?v=2.2';
import { Game2048 } from './2048.js?v=2.2';
import { MinesweeperGame } from './minesweeper.js?v=2.2';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            {
                id: 'snake',
                name: 'Snake',
                img: 'assets/snake.svg'
            },
            {
                id: 'blackjack',
                name: 'Blackjack',
                img: 'assets/blackjack.svg'
            },
            {
                id: 'tetris',
                name: 'Tetris',
                img: 'assets/tetris.svg'
            },
            {
                id: 'g2048',
                name: '2048',
                img: 'assets/2048.svg'
            },
            {
                id: 'minesweeper',
                name: 'Minesweeper',
                img: 'assets/minesweeper.svg'
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
        gameWrap.style.width = '100%';
        gameWrap.style.height = '100%';
        gameWrap.style.display = 'flex';
        gameWrap.style.flexDirection = 'column';
        gameWrap.style.alignItems = 'center';
        gameWrap.style.justifyContent = 'center';

        stage.appendChild(gameWrap);

        // Navigation bar
        const navBar = document.createElement('div');
        navBar.style.width = '100%';
        navBar.style.padding = '10px 20px';
        navBar.style.display = 'flex';
        navBar.style.justifyContent = 'flex-start';

        const backBtn = document.createElement('button');
        backBtn.className = 'game-back-btn';
        backBtn.type = 'button';
        backBtn.setAttribute('aria-label', 'Back to Game Menu');
        backBtn.setAttribute('title', 'Back to Game Menu');
        backBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">arrow_back</span> Back to Menu';
        backBtn.onclick = () => this.showMenu();

        navBar.appendChild(backBtn);
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

            const canvas = document.createElement('canvas');
            canvas.width = 360;
            canvas.height = 360;
            canvas.className = 'in-app-game-canvas';

            // Restart Button
            const restartBtn = document.createElement('button');
            restartBtn.className = 'snake-restart-btn';
            restartBtn.textContent = 'Play Again';
            restartBtn.style.display = 'none'; // Hidden by default
            restartBtn.onclick = () => {
                restartBtn.style.display = 'none';
                this.activeGame.start();
                content.focus();
            };

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

            snakeContainer.appendChild(canvas);
            snakeContainer.appendChild(restartBtn);
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
                    restartBtn.style.display = 'none';
                },
                onEnd: (score) => {
                    restartBtn.style.display = 'block';
                    restartBtn.focus();
                    const curHigh = parseInt(localStorage.getItem('snake_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('snake_high_score', score);
                        document.getElementById('snakeHighScore').textContent = score;
                    }
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

            const canvas = document.createElement('canvas');
            canvas.height = 360; // tileSize is dynamically set, canvas width is computed in game
            canvas.className = 'in-app-game-canvas';

            // Restart Button
            const restartBtn = document.createElement('button');
            restartBtn.className = 'snake-restart-btn';
            restartBtn.textContent = 'Play Again';
            restartBtn.style.display = 'none';
            restartBtn.onclick = () => {
                restartBtn.style.display = 'none';
                this.activeGame.start();
                content.focus();
            };

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

            tetrisContainer.appendChild(canvas);
            tetrisContainer.appendChild(restartBtn);
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
                    restartBtn.style.display = 'none';
                },
                onEnd: (score) => {
                    restartBtn.style.display = 'block';
                    restartBtn.focus();
                    const curHigh = parseInt(localStorage.getItem('tetris_high_score') || 0);
                    if (score > curHigh) {
                        localStorage.setItem('tetris_high_score', score);
                        document.getElementById('tetrisHighScore').textContent = score;
                    }
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
            this.activeGame = new MinesweeperGame(content);
            this.activeGame.start();
        }
    }

    showMenu() {
        if (this.activeGame && this.activeGame.stop) {
            this.activeGame.stop();
        }
        this.activeGame = null;

        const stage = this.container.querySelector('#gameStage');
        const menu = this.container.querySelector('#gameMenu');
        stage.style.display = 'none';
        menu.style.display = 'grid';

        if (this.lastFocusedGameIcon) {
            this.lastFocusedGameIcon.focus();
        }
    }
}
