
import { SnakeGame } from './snake.js';
import { BlackjackGame } from './blackjack.js';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            {
                id: 'snake',
                name: 'Snake',
                img: 'Snake.png'
            },
            {
                id: 'blackjack',
                name: 'Blackjack',
                img: 'Card.png'
            }
        ];

        this.activeGame = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="app-body">
                <div id="gameMenu" class="game-grid">
                    ${this.games.map(g => `
                        <div class="game-icon" data-id="${g.id}" role="button" tabindex="0">
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
            btn.addEventListener('click', () => this.launch(btn.dataset.id));
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

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.width = '100%';
        content.style.position = 'relative'; // Ensure overlay works if needed
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
            };

            // Mobile Controls
            const controls = document.createElement('div');
            controls.className = 'snake-controls';
            controls.innerHTML = `
                <div></div>
                <button class="snake-btn" data-dir="up" type="button"><span class="material-symbols-rounded">keyboard_arrow_up</span></button>
                <div></div>
                <button class="snake-btn" data-dir="left" type="button"><span class="material-symbols-rounded">keyboard_arrow_left</span></button>
                <button class="snake-btn" data-dir="down" type="button"><span class="material-symbols-rounded">keyboard_arrow_down</span></button>
                <button class="snake-btn" data-dir="right" type="button"><span class="material-symbols-rounded">keyboard_arrow_right</span></button>
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
        }
        else if (id === 'blackjack') {
            this.activeGame = new BlackjackGame(content);
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
    }
}
