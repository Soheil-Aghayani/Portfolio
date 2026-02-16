
import { SnakeGame } from './snake.js';
import { BlackjackGame } from './blackjack.js';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            {
                id: 'snake',
                name: 'Snake',
                img: 'https://s8.uupload.ir/files/snake_q7dz.png'
            },
            {
                id: 'blackjack',
                name: 'Blackjack',
                img: 'https://s8.uupload.ir/files/selfcontrol_macos_bigsur_icon_189760_prq.png'
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

        // Add Back Button logic handled by Window header or internal back button
        const backBtn = document.createElement('button');
        backBtn.className = 'game-back-btn';
        backBtn.innerHTML = '<span class="material-symbols-rounded">arrow_back</span> Back';
        backBtn.onclick = () => this.showMenu();

        // Wrapper for game
        const gameWrap = document.createElement('div');
        gameWrap.style.width = '100%';
        gameWrap.style.height = '100%';
        gameWrap.style.display = 'flex';
        gameWrap.style.flexDirection = 'column';
        gameWrap.style.alignItems = 'center';
        gameWrap.style.justifyContent = 'center';

        stage.appendChild(gameWrap);

        // Inject Back Button at top of game wrap
        const topBar = document.createElement('div');
        topBar.style.width = '100%';
        topBar.style.padding = '10px';
        topBar.appendChild(backBtn);
        gameWrap.appendChild(topBar);

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.width = '100%';
        content.style.position = 'relative'; // Ensure overlay works if needed
        gameWrap.appendChild(content);

        if (id === 'snake') {
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
            snakeContainer.appendChild(controls);
            content.appendChild(snakeContainer);

            this.activeGame = new SnakeGame(canvas, {
                onEnd: (score) => {
                    // console.log("Game Over", score);
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
