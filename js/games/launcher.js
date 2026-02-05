
import { SnakeGame } from './snake.js';
import { BlackjackGame } from './blackjack.js';

export class GameLauncher {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.games = [
            { id: 'snake', name: 'Snake', icon: 'all_inclusive' },
            { id: 'blackjack', name: 'Blackjack', icon: 'style' }
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
                                <span class="material-symbols-rounded">${g.icon}</span>
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
        // Let's add a small internal back button for better UX
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
        gameWrap.appendChild(content);

        if (id === 'snake') {
            const canvas = document.createElement('canvas');
            canvas.width = 360;
            canvas.height = 360;
            canvas.className = 'in-app-game-canvas';
            content.appendChild(canvas);

            this.activeGame = new SnakeGame(canvas, {
                onEnd: (score) => {
                    // console.log("Game Over", score);
                }
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
