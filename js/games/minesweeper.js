const SMILEY_SVG_HAPPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`;
const SMILEY_SVG_WIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; color: var(--primary);"><circle cx="12" cy="12" r="10"></circle><path d="M6 9h12l-1.5 4h-9L6 9z" fill="currentColor" opacity="0.3"></path><line x1="6" y1="9" x2="18" y2="9"></line><path d="M9 15s1.5 1.5 3 1.5 3-1.5 3-1.5"></path></svg>`;
const SMILEY_SVG_LOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; color: #ef4444;"><circle cx="12" cy="12" r="10"></circle><path d="M9 9l2 2m-2 0l2-2"></path><path d="M13 9l2 2m-2 0l2-2"></path><circle cx="12" cy="15" r="1.5"></circle></svg>`;

const FLAG_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #fb7185; filter: drop-shadow(0 0 4px rgba(251, 113, 133, 0.6));"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="rgba(251, 113, 133, 0.3)"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
const MINE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ef4444; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6));"><circle cx="12" cy="12" r="8" fill="rgba(239, 68, 68, 0.2)"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="19.07" y1="4.93" x2="17.66" y2="6.34"></line><line x1="6.34" y1="17.66" x2="4.93" y2="19.07"></line><circle cx="10" cy="10" r="1.2" fill="#fff" stroke="none"></circle></svg>`;

export class MinesweeperGame {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onScore, onStart, onEnd }

        this.rows = 10;
        this.cols = 10;
        this.mineCount = 15;

        // Playlist parameters
        this.mode = 'zen'; // 'zen', 'time-trial', 'endless'
        this.difficulty = 'easy'; // 'easy', 'medium', 'hard'
        this.timeLimit = 0;
        this.score = 0; // For Endless mode

        this.grid = [];
        this.gameOverState = false;
        this.won = false;
        this.firstClick = true;
        this.isPaused = false;
        
        this.minesRemaining = this.mineCount;
        this.time = 0;
        this.timer = null;

        // Cyber Deck Hacks System Config
        this.initialShield = true;
        this.initialPing = 1;
        this.shieldActive = true;
        this.pingCharges = 1;

        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="ms-container" id="msContainer" style="width: 100%; display: flex; flex-direction: column; justify-content: center; min-height: 420px;">
                <!-- Main UI injected by showStartMenu or renderGameLayout -->
            </div>

            <!-- Miner mascot instruction modal -->
            <div class="ms-modal" id="msTutorialModal">
                <div class="ms-modal-content">
                    <div class="ms-modal-header">
                        <div class="ms-modal-title">🛠️ MINER'S MANUAL</div>
                        <button class="ms-modal-close-btn" id="msModalCloseBtn" type="button" aria-label="Close Manual">&times;</button>
                    </div>
                    <div class="ms-modal-body">
                        <div class="ms-miner-img-wrapper">
                            <img class="ms-miner-img" id="msModalMinerImg" src="" alt="Miner Mascot">
                        </div>
                        <div class="ms-modal-text" id="msModalText"></div>
                        <div class="ms-modal-nav">
                            <button class="ms-nav-btn" id="msModalPrevBtn" type="button">◀ PREV</button>
                            <span style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace; align-self: center;" id="msModalProgress">1 / 6</span>
                            <button class="ms-nav-btn" id="msModalNextBtn" type="button">NEXT ▶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.mainContainer = this.container.querySelector('#msContainer');
        
        // Wire up manual close button
        const modal = this.container.querySelector('#msTutorialModal');
        const closeBtn = this.container.querySelector('#msModalCloseBtn');
        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.classList.remove('show');
        }

        this.showStartMenu();
    }

    showStartMenu() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;

        this.mainContainer.innerHTML = `
            <div class="ms-menu-screen">
                <div class="ms-menu-title">CYBER DECK MINES</div>
                
                <div class="ms-menu-modes">
                    <!-- Zen Mode Card -->
                    <div class="ms-mode-card ${this.mode === 'zen' ? 'selected' : ''}" id="modeCardZen">
                        <button class="ms-mode-btn" type="button" id="selectZenBtn">
                            <span>🧘 ZEN MODE</span>
                        </button>
                        <div class="ms-mode-desc">Untimed tactical sweeps. Choose difficulty:</div>
                        <div class="ms-diff-row">
                            <button class="ms-diff-btn ${this.mode === 'zen' && this.difficulty === 'easy' ? 'selected' : ''}" type="button" data-mode="zen" data-diff="easy">Easy (10m)</button>
                            <button class="ms-diff-btn ${this.mode === 'zen' && this.difficulty === 'medium' ? 'selected' : ''}" type="button" data-mode="zen" data-diff="medium">Med (15m)</button>
                            <button class="ms-diff-btn ${this.mode === 'zen' && this.difficulty === 'hard' ? 'selected' : ''}" type="button" data-mode="zen" data-diff="hard">Hard (20m)</button>
                        </div>
                    </div>

                    <!-- Time Trial Card -->
                    <div class="ms-mode-card ${this.mode === 'time-trial' ? 'selected' : ''}" id="modeCardTimeTrial">
                        <button class="ms-mode-btn" type="button" id="selectTimeTrialBtn">
                            <span>⚡ TIME TRIAL</span>
                        </button>
                        <div class="ms-mode-desc">Race against timer! Hard mode turns off hacks.</div>
                        <div class="ms-diff-row">
                            <button class="ms-diff-btn ${this.mode === 'time-trial' && this.difficulty === 'easy' ? 'selected' : ''}" type="button" data-mode="time-trial" data-diff="easy">Easy (120s)</button>
                            <button class="ms-diff-btn ${this.mode === 'time-trial' && this.difficulty === 'medium' ? 'selected' : ''}" type="button" data-mode="time-trial" data-diff="medium">Med (90s)</button>
                            <button class="ms-diff-btn ${this.mode === 'time-trial' && this.difficulty === 'hard' ? 'selected' : ''}" type="button" data-mode="time-trial" data-diff="hard">Hard (90s)</button>
                        </div>
                    </div>

                    <!-- Endless Mode Card -->
                    <div class="ms-mode-card ${this.mode === 'endless' ? 'selected' : ''}" id="modeCardEndless">
                        <button class="ms-mode-btn" type="button" id="selectEndlessBtn">
                            <span>♾️ ENDLESS MODE</span>
                        </button>
                        <div class="ms-mode-desc">Drag and expand board. Infinite mines, dig forever!</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; width: 100%; margin-top: 8px;">
                    <button class="ms-btn" style="flex: 1;" id="msStartGameBtn" type="button">START</button>
                    <button class="ms-btn" style="background: #334155; box-shadow: none; padding: 12px; width: 44px; min-width: 44px;" id="msMenuTutorialBtn" type="button" title="How to Play">❓</button>
                </div>
            </div>
        `;

        const cards = {
            zen: this.mainContainer.querySelector('#modeCardZen'),
            'time-trial': this.mainContainer.querySelector('#modeCardTimeTrial'),
            endless: this.mainContainer.querySelector('#modeCardEndless')
        };

        const selectMode = (modeName) => {
            this.mode = modeName;
            Object.keys(cards).forEach(k => {
                if (cards[k]) {
                    cards[k].classList.toggle('selected', k === modeName);
                }
            });
        };

        this.mainContainer.querySelector('#selectZenBtn').onclick = () => selectMode('zen');
        this.mainContainer.querySelector('#selectTimeTrialBtn').onclick = () => selectMode('time-trial');
        this.mainContainer.querySelector('#selectEndlessBtn').onclick = () => selectMode('endless');

        const diffBtns = this.mainContainer.querySelectorAll('.ms-diff-btn');
        diffBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const m = btn.dataset.mode;
                const d = btn.dataset.diff;
                this.mode = m;
                this.difficulty = d;

                diffBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectMode(m);
            };
        });

        this.mainContainer.querySelector('#msStartGameBtn').onclick = () => this.setupGameParamsAndStart();
        this.mainContainer.querySelector('#msMenuTutorialBtn').onclick = () => this.showTutorialModal();
    }

    showTutorialModal() {
        const modal = this.container.querySelector('#msTutorialModal');
        const textEl = this.container.querySelector('#msModalText');
        const imgEl = this.container.querySelector('#msModalMinerImg');
        const prevBtn = this.container.querySelector('#msModalPrevBtn');
        const nextBtn = this.container.querySelector('#msModalNextBtn');
        const progressEl = this.container.querySelector('#msModalProgress');

        if (!modal || !textEl || !imgEl || !prevBtn || !nextBtn || !progressEl) return;

        const isMobile = window.innerWidth <= 768;
        const steps = [
            {
                img: 'tutorial_1',
                text: isMobile 
                    ? "Howdy, greenhorn! Tap a box to scan it. If it's safe, it'll show how many mines are adjacent. Don't touch a mine or you'll lose a limb!"
                    : "Howdy, greenhorn! Left-click a box to scan it. If it's safe, it'll show how many mines are adjacent. Don't click a mine or you'll lose a limb!"
            },
            {
                img: 'tutorial_2',
                text: "Mines are highly unstable and destructive! One wrong move and KABOOM! Watch your step, cadet."
            },
            {
                img: 'tutorial_3',
                text: "You don't need to blow up mines to clear them. Mark them carefully with flags to disable their trigger mechanisms."
            },
            {
                img: 'tutorial_4',
                text: "Plant a Red Cyber-Flag on any tile you're sure has a mine. This locks the tile and keeps you from clicking it accidentally!"
            },
            {
                img: 'tutorial_5',
                text: "Not sure? Cycle a flagged tile to a Question Mark (?) as a placeholder until you gather more surrounding data."
            },
            {
                img: 'tutorial_6',
                text: "To win, reveal all safe boxes or flag all mines correctly. In Endless Mode, though... there is no winning. You just dig until you blow up. Just like a miner's life! Pointless, eh?"
            }
        ];

        let currentStepIndex = 0;

        const updateStep = () => {
            const step = steps[currentStepIndex];
            imgEl.src = this.getMinerImgSrc(step.img);
            textEl.textContent = step.text;
            progressEl.textContent = `${currentStepIndex + 1} / ${steps.length}`;
            prevBtn.disabled = currentStepIndex === 0;
            nextBtn.disabled = currentStepIndex === steps.length - 1;
        };

        prevBtn.onclick = () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                updateStep();
            }
        };

        nextBtn.onclick = () => {
            if (currentStepIndex < steps.length - 1) {
                currentStepIndex++;
                updateStep();
            }
        };

        updateStep();
        modal.classList.add('show');
    }

    getMinerImgSrc(poseKey) {
        // These are the images we successfully generated and copied to assets
        const knownAssets = [
            'tutorial_1', 'tutorial_2', 'tutorial_3', 'tutorial_4', 'tutorial_5', 'tutorial_6',
            'win_easy', 'win_medium', 'win_fast', 'win_record'
        ];
        if (knownAssets.includes(poseKey)) {
            return `assets/miner/${poseKey}.webp`;
        }

        // Logical fallback mappings for missing images:
        if (poseKey === 'win_hard') return `assets/miner/win_medium.webp`;
        if (poseKey.startsWith('lose_')) {
            if (poseKey === 'lose_easy') return `assets/miner/win_easy.webp`; // sarcastic clap
            if (poseKey === 'lose_medium') return `assets/miner/tutorial_5.webp`; // scratching head
            if (poseKey === 'lose_hard') return `assets/miner/tutorial_6.webp`; // philosophical pose
            if (poseKey === 'lose_slow') return `assets/miner/tutorial_5.webp`; // scratching head
            return `assets/miner/win_easy.webp`;
        }
        return `assets/miner/tutorial_1.webp`;
    }

    getMinerComment(success, reason = '') {
        if (success) {
            if (this.mode === 'time-trial') {
                let bestTime = localStorage.getItem('minesweeper_best_time');
                const isNewRecord = !bestTime || this.time < parseInt(bestTime);
                if (isNewRecord) {
                    return {
                        img: 'win_record',
                        text: "Incredible! A new speed record! You navigated that field like a lightning bolt!"
                    };
                } else {
                    return {
                        img: 'win_fast',
                        text: "Great job, runner! You beat the clock with time to spare! Keep this speed up!"
                    };
                }
            } else {
                if (this.difficulty === 'easy') {
                    return {
                        img: 'win_easy',
                        text: "Wow, easy mode cleared... Do you want a gold star or a pacifier with that? Try something harder!"
                    };
                } else if (this.difficulty === 'medium') {
                    return {
                        img: 'win_medium',
                        text: "Solid work! You cleared the field and kept your limbs intact. Ready for the hard stuff?"
                    };
                } else {
                    return {
                        img: 'win_hard',
                        text: "Holy dynamite! You cleared the hard board! I didn't think you had it in you!"
                    };
                }
            }
        } else {
            if (this.mode === 'time-trial') {
                if (reason === 'time-out') {
                    return {
                        img: 'lose_slow',
                        text: "Time's up! You were moving slower than molasses in a cold cave. Hustle up next time!"
                    };
                } else {
                    return {
                        img: 'lose_not_record',
                        text: "Failed to beat your best time. Honestly, even my grandma can swing a pickaxe faster than that!"
                    };
                }
            } else if (this.mode === 'zen') {
                if (this.difficulty === 'easy') {
                    return {
                        img: 'lose_easy',
                        text: "You blew up on EASY? Even my pet rock Mr. Fofo could clear this in his sleep!"
                    };
                } else if (this.difficulty === 'medium') {
                    return {
                        img: 'lose_medium',
                        text: "Oops! A mine got you. Don't worry, here's a band-aid 🩹 for your pride. Try again!"
                    };
                } else {
                    return {
                        img: 'lose_hard',
                        text: "Ouch, hard mode is brutal. I feel for you, kid. Maybe try Zen Easy or Medium to build up your strength?"
                    };
                }
            } else {
                return {
                    img: 'lose_slow',
                    text: `Your endless journey ends here! You dug up ${this.score} safe spots before getting blasted. Pointless, like a miner's life!`
                };
            }
        }
    }

    setupGameParamsAndStart() {
        if (this.mode === 'zen') {
            this.rows = 10;
            this.cols = 10;
            if (this.difficulty === 'easy') this.mineCount = 10;
            else if (this.difficulty === 'medium') this.mineCount = 15;
            else this.mineCount = 20;

            this.initialShield = true;
            this.initialPing = 1;
        } else if (this.mode === 'time-trial') {
            this.rows = 10;
            this.cols = 10;
            if (this.difficulty === 'easy') {
                this.mineCount = 15;
                this.timeLimit = 120;
                this.initialShield = true;
                this.initialPing = 1;
            } else if (this.difficulty === 'medium') {
                this.mineCount = 15;
                this.timeLimit = 90;
                this.initialShield = true;
                this.initialPing = 1;
            } else {
                this.mineCount = 20;
                this.timeLimit = 90;
                this.initialShield = false;
                this.initialPing = 0;
            }
        } else if (this.mode === 'endless') {
            this.rows = 10;
            this.cols = 10;
            this.mineCount = 12; // initial mines
            this.initialShield = true;
            this.initialPing = 1;
            this.score = 0;
        }

        this.renderGameLayout();
        this.start();
    }

    renderGameLayout() {
        const isEndless = this.mode === 'endless';
        this.mainContainer.innerHTML = `
            <div class="ms-header">
                <button class="ms-btn" style="padding: 6px 12px; font-size: 0.8rem; background: #334155; color: #fff; box-shadow: none; min-width: auto;" id="msBackToMenuBtn" type="button">◀ MENU</button>
                <div class="ms-counter-box">
                    <div class="ms-counter-label" id="msCounterLabel">${isEndless ? 'Score' : 'Mines'}</div>
                    <div id="msMinesCount" class="ms-counter-val">0</div>
                </div>
                <button class="ms-smiley state-happy" id="msSmileyBtn" type="button" aria-label="Reset Game">${SMILEY_SVG_HAPPY}</button>
                <div class="ms-counter-box">
                    <div class="ms-counter-label">Time</div>
                    <div id="msTimer" class="ms-counter-val">000</div>
                </div>
            </div>

            <div class="ms-hacks-container">
                <button class="ms-hack-btn disabled" id="msHackShield" type="button" title="Shield: Absorbs 1 mine explosion automatically.">
                    <span class="ms-hack-icon">🛡️</span> SHIELD: ON
                </button>
                <button class="ms-hack-btn disabled" id="msHackPing" type="button" title="Ping: Reveals a random safe cell. (Unlocks after 1st click)">
                    <span class="ms-hack-icon">📡</span> PING (1)
                </button>
            </div>

            <div style="position: relative; width: fit-content; height: fit-content; margin: 0 auto;">
                <div class="ms-board-scroll-wrapper" id="msBoardWrapper">
                    <div class="ms-board" id="msBoard" role="grid" aria-label="Minesweeper Board">
                        <!-- cells generated dynamically -->
                    </div>
                </div>
                
                <div class="ms-overlay" id="msOverlay">
                    <div class="ms-title" id="msOverlayTitle">GAME OVER</div>
                    <div class="ms-msg" id="msOverlayMsg">Time: 000s</div>
                    
                    <!-- Miner mascot dialog on Game Over -->
                    <div class="ms-miner-box">
                        <div class="ms-miner-img-wrapper">
                            <img class="ms-miner-img" id="msGameOverMinerImg" src="" alt="Miner Mascot">
                        </div>
                        <div class="ms-miner-bubble" id="msGameOverMinerText"></div>
                    </div>

                    <button class="ms-btn" style="margin-top: 14px;" id="msOverlayBtn" type="button">Play Again</button>
                </div>
            </div>
        `;

        this.boardEl = this.mainContainer.querySelector('#msBoard');
        this.boardWrapperEl = this.mainContainer.querySelector('#msBoardWrapper');
        this.smileyBtn = this.mainContainer.querySelector('#msSmileyBtn');
        this.minesCountEl = this.mainContainer.querySelector('#msMinesCount');
        this.timerEl = this.mainContainer.querySelector('#msTimer');

        this.smileyBtn.onclick = () => this.start();

        const backBtn = this.mainContainer.querySelector('#msBackToMenuBtn');
        if (backBtn) {
            backBtn.onclick = () => this.showStartMenu();
        }

        const pingBtn = this.mainContainer.querySelector('#msHackPing');
        if (pingBtn) {
            pingBtn.onclick = () => this.usePing();
        }

        this.setupDragScrolling();
    }

    setupDragScrolling() {
        const slider = this.boardWrapperEl;
        if (!slider) return;
        
        let isDown = false;
        let startX, startY;
        let scrollLeft, scrollTop;

        slider.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('ms-cell') || e.target.closest('.ms-cell')) {
                return;
            }
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            startY = e.pageY - slider.offsetTop;
            scrollLeft = slider.scrollLeft;
            scrollTop = slider.scrollTop;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const y = e.pageY - slider.offsetTop;
            const walkX = (x - startX) * 1.5;
            const walkY = (y - startY) * 1.5;
            slider.scrollLeft = scrollLeft - walkX;
            slider.scrollTop = scrollTop - walkY;
        });

        slider.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('ms-cell') || e.target.closest('.ms-cell')) {
                return;
            }
            isDown = true;
            const touch = e.touches[0];
            startX = touch.pageX - slider.offsetLeft;
            startY = touch.pageY - slider.offsetTop;
            scrollLeft = slider.scrollLeft;
            scrollTop = slider.scrollTop;
        }, { passive: true });

        slider.addEventListener('touchend', () => {
            isDown = false;
        });

        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const touch = e.touches[0];
            const x = touch.pageX - slider.offsetLeft;
            const y = touch.pageY - slider.offsetTop;
            const walkX = (x - startX) * 1.5;
            const walkY = (y - startY) * 1.5;
            slider.scrollLeft = scrollLeft - walkX;
            slider.scrollTop = scrollTop - walkY;
        }, { passive: true });
    }

    start() {
        this.gameOverState = false;
        this.won = false;
        this.firstClick = true;
        this.isPaused = false;
        this.minesRemaining = this.mineCount;
        this.time = this.mode === 'time-trial' ? this.timeLimit : 0;
        this.score = 0;
        
        this.shieldActive = this.initialShield;
        this.pingCharges = this.initialPing;

        if (this.timer) clearInterval(this.timer);
        this.timer = null;

        if (this.mode === 'endless') {
            this.minesCountEl.textContent = '0';
        } else {
            this.minesCountEl.textContent = this.minesRemaining;
        }

        this.timerEl.textContent = this.mode === 'time-trial' 
            ? String(this.timeLimit).padStart(3, '0') 
            : '000';
            
        this.smileyBtn.innerHTML = SMILEY_SVG_HAPPY;
        this.smileyBtn.className = 'ms-smiley state-happy';

        const overlay = this.container.querySelector('#msOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }

        if (this.boardEl) {
            this.boardEl.classList.remove('shake');
        }

        // Reset dimensions for Endless start (back to 10x10)
        if (this.mode === 'endless') {
            this.rows = 10;
            this.cols = 10;
            this.mineCount = 12;
        }

        this.buildGrid();
        this.renderBoard();
        this.updateHacksUI();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        if (this.callbacks.onStart) this.callbacks.onStart();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    buildGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    row: r,
                    col: c,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    questioned: false,
                    count: 0
                });
            }
            this.grid.push(row);
        }
    }

    placeMines(startR, startC) {
        let placed = 0;
        const avoidCells = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = startR + dr;
                const nc = startC + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    avoidCells.add(`${nr},${nc}`);
                }
            }
        }

        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            const key = `${r},${c}`;

            if (!this.grid[r][c].mine && !avoidCells.has(key)) {
                this.grid[r][c].mine = true;
                placed++;
            }
        }

        // Calculate initial adjacent counts
        this.recalculateCounts();
    }

    recalculateCounts() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].mine) continue;
                let count = 0;
                this.getNeighbors(r, c).forEach(n => {
                    if (n.mine) count++;
                });
                this.grid[r][c].count = count;
            }
        }
    }

    getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    neighbors.push(this.grid[nr][nc]);
                }
            }
        }
        return neighbors;
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        this.boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 28px)`;
        this.boardEl.style.gridTemplateRows = `repeat(${this.rows}, 28px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellData = this.grid[r][c];
                const cellEl = document.createElement('button');
                cellEl.className = 'ms-cell';
                cellEl.setAttribute('type', 'button');
                cellEl.setAttribute('role', 'gridcell');
                cellEl.setAttribute('aria-label', `Cell row ${r+1} column ${c+1}`);
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;

                let holdTimer;
                let wasLongPress = false;
                let suppressClickUntil = 0;
                let activePointerId = null;
                let startX = 0;
                let startY = 0;

                const clearHoldTimer = () => {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                };

                cellEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (wasLongPress || Date.now() < suppressClickUntil) {
                        return;
                    }
                    this.handleCellClick(r, c);
                });

                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (wasLongPress || Date.now() < suppressClickUntil) {
                        return;
                    }
                    this.handleCellRightClick(r, c);
                });

                cellEl.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'mouse') return;
                    e.preventDefault();
                    wasLongPress = false;
                    activePointerId = e.pointerId;
                    startX = e.clientX;
                    startY = e.clientY;
                    try { cellEl.setPointerCapture(activePointerId); } catch(err) {}

                    clearHoldTimer();
                    holdTimer = setTimeout(() => {
                        wasLongPress = true;
                        suppressClickUntil = Date.now() + 500;
                        this.handleCellRightClick(r, c);
                        if (navigator.vibrate) {
                            try { navigator.vibrate(50); } catch(err) {}
                        }
                    }, 200);
                });

                cellEl.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'mouse') return;
                    clearHoldTimer();
                    if (wasLongPress) {
                        e.preventDefault();
                        setTimeout(() => {
                            wasLongPress = false;
                        }, 500);
                    }
                    try { cellEl.releasePointerCapture(activePointerId); } catch(err) {}
                    activePointerId = null;
                });

                cellEl.addEventListener('pointermove', (e) => {
                    if (e.pointerType === 'mouse' || activePointerId !== e.pointerId) return;
                    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
                    if (dist > 10) {
                        clearHoldTimer();
                    }
                });

                cellEl.addEventListener('pointercancel', () => {
                    clearHoldTimer();
                    activePointerId = null;
                });

                this.boardEl.appendChild(cellEl);
            }
        }
    }

    handleCellClick(r, c) {
        if (this.gameOverState || this.isPaused) return;

        const cell = this.grid[r][c];
        if (cell.revealed || cell.flagged) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(r, c);
            this.startTimer();
            this.updateHacksUI();
        }

        this.reveal(r, c);
        this.updateUI();
        this.checkGameStatus();
    }

    handleCellRightClick(r, c) {
        if (this.gameOverState || this.isPaused) return;

        const cell = this.grid[r][c];
        if (cell.revealed) return;

        if (cell.flagged) {
            cell.flagged = false;
            cell.questioned = true;
            if (this.mode !== 'endless') {
                this.minesRemaining += 1;
            }
        } else if (cell.questioned) {
            cell.questioned = false;
        } else {
            cell.flagged = true;
            cell.questioned = false;
            if (this.mode !== 'endless') {
                this.minesRemaining -= 1;
            }
        }

        if (this.mode !== 'endless') {
            this.minesCountEl.textContent = this.minesRemaining;
        }
        this.updateCellUI(r, c);
        this.checkGameStatus();
    }

    reveal(r, c) {
        const cell = this.grid[r][c];
        cell.revealed = true;
        cell.questioned = false;

        if (this.mode === 'endless' && !cell.mine) {
            this.score++;
            this.minesCountEl.textContent = this.score;
        }

        if (cell.mine) {
            if (window.godModeActive) {
                cell.revealed = false;
                cell.flagged = true;
                cell.questioned = false;
                if (this.mode !== 'endless') {
                    this.minesRemaining--;
                    this.minesCountEl.textContent = this.minesRemaining;
                }
                this.updateCellUI(r, c);
                if (navigator.vibrate) {
                    try { navigator.vibrate([100, 50, 100]); } catch(err) {}
                }
                return;
            }

            // Cyber Shield Passive Hack
            if (this.shieldActive) {
                this.shieldActive = false;
                cell.revealed = false;
                cell.flagged = true;
                cell.questioned = false;
                if (this.mode !== 'endless') {
                    this.minesRemaining--;
                    this.minesCountEl.textContent = this.minesRemaining;
                }
                this.updateCellUI(r, c);
                this.updateHacksUI();

                if (navigator.vibrate) {
                    try { navigator.vibrate([80, 50, 80]); } catch(err) {}
                }
                if (this.boardEl) {
                    this.boardEl.classList.add('shield-flash');
                    setTimeout(() => this.boardEl.classList.remove('shield-flash'), 400);
                }
                return;
            }

            this.gameOver(false, 'mine-hit');
            return;
        }

        // Expand board if getting close to bounds in Endless mode
        if (this.mode === 'endless') {
            let addR = 0;
            let addC = 0;
            if (r >= this.rows - 2) addR = 5;
            if (c >= this.cols - 2) addC = 5;
            
            if (addR > 0 || addC > 0) {
                this.expandGrid(addR, addC);
            }
        }

        if (cell.count === 0) {
            this.getNeighbors(r, c).forEach(n => {
                if (!n.revealed && !n.flagged) {
                    this.reveal(n.row, n.col);
                }
            });
        }
    }

    expandGrid(addRows, addCols) {
        const prevRows = this.rows;
        const prevCols = this.cols;

        // 1. Add rows
        if (addRows > 0) {
            for (let r = prevRows; r < prevRows + addRows; r++) {
                const row = [];
                for (let c = 0; c < prevCols; c++) {
                    row.push({
                        row: r,
                        col: c,
                        mine: false,
                        revealed: false,
                        flagged: false,
                        questioned: false,
                        count: 0
                    });
                }
                this.grid.push(row);
            }
            this.rows += addRows;
        }

        // 2. Add columns
        if (addCols > 0) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = prevCols; c < prevCols + addCols; c++) {
                    this.grid[r].push({
                        row: r,
                        col: c,
                        mine: false,
                        revealed: false,
                        flagged: false,
                        questioned: false,
                        count: 0
                    });
                }
            }
            this.cols += addCols;
        }

        // 3. Dynamic mine seeding (~15% probability on new cells)
        const density = 0.15;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (r >= prevRows || c >= prevCols) {
                    if (Math.random() < density) {
                        this.grid[r][c].mine = true;
                    }
                }
            }
        }

        // 4. Recalculate counts
        this.recalculateCounts();

        // 5. Re-render board DOM
        this.renderBoard();
        this.updateUI();
    }

    startTimer(resume = false) {
        if (this.timer) clearInterval(this.timer);
        
        if (this.mode === 'time-trial') {
            if (!resume) this.time = this.timeLimit;
            this.timer = setInterval(() => {
                this.time--;
                const displayTime = String(Math.max(this.time, 0)).padStart(3, '0');
                this.timerEl.textContent = displayTime;
                
                if (this.time <= 0) {
                    clearInterval(this.timer);
                    this.gameOver(false, 'time-out');
                }
            }, 1000);
        } else {
            if (!resume) this.time = 0;
            this.timer = setInterval(() => {
                this.time++;
                const displayTime = String(Math.min(this.time, 999)).padStart(3, '0');
                this.timerEl.textContent = displayTime;
            }, 1000);
        }
    }

    togglePause() {
        if (this.gameOverState) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
            this.showPauseOverlay(true);
        } else {
            this.startTimer(true);
            this.showPauseOverlay(false);
        }
        this.updateHacksUI();
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    showPauseOverlay(show) {
        const overlay = this.container.querySelector('#msOverlay');
        const overlayTitle = this.container.querySelector('#msOverlayTitle');
        const overlayMsg = this.container.querySelector('#msOverlayMsg');
        const overlayBtn = this.container.querySelector('#msOverlayBtn');

        if (overlay && overlayTitle && overlayMsg && overlayBtn) {
            if (show) {
                overlayTitle.textContent = 'PAUSED';
                overlayTitle.style.color = '#38bdf8';
                overlayMsg.textContent = 'Game is paused';
                overlayBtn.textContent = 'Resume';
                overlayBtn.onclick = () => this.togglePause();
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    }

    handleKeyDown(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.firstClick) return;
            e.preventDefault();
            this.togglePause();
        }
    }

    updateCellUI(r, c) {
        const cell = this.grid[r][c];
        const cellEl = this.boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!cellEl) return;

        cellEl.className = 'ms-cell';
        cellEl.innerHTML = '';

        if (cell.revealed) {
            cellEl.classList.add('revealed');
            if (cell.mine) {
                cellEl.classList.add('mine');
                cellEl.innerHTML = MINE_SVG;
            } else if (cell.count > 0) {
                cellEl.classList.add(`ms-num-${cell.count}`);
                cellEl.textContent = cell.count;
            }
        } else if (cell.flagged) {
            cellEl.classList.add('flagged');
            cellEl.innerHTML = FLAG_SVG;
        } else if (cell.questioned) {
            cellEl.classList.add('questioned');
            cellEl.textContent = '?';
        }
    }

    updateUI() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.updateCellUI(r, c);
            }
        }
    }

    checkGameStatus() {
        if (this.gameOverState) return;
        if (this.mode === 'endless') return;

        let allSafeRevealed = true;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (!cell.mine && !cell.revealed) {
                    allSafeRevealed = false;
                    break;
                }
            }
            if (!allSafeRevealed) break;
        }

        let allMinesFlaggedCorrectly = true;
        let flaggedCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.flagged) {
                    flaggedCount++;
                    if (!cell.mine) {
                         allMinesFlaggedCorrectly = false;
                    }
                }
            }
        }
        const winByFlagging = (flaggedCount === this.mineCount && allMinesFlaggedCorrectly);

        if (allSafeRevealed || winByFlagging) {
            this.gameOver(true);
        }
    }

    gameOver(success, reason = '') {
        this.gameOverState = true;
        this.won = success;
        if (this.timer) clearInterval(this.timer);

        this.updateHacksUI();

        this.smileyBtn.innerHTML = success ? SMILEY_SVG_WIN : SMILEY_SVG_LOSE;
        this.smileyBtn.className = success ? 'ms-smiley state-win' : 'ms-smiley state-lose';

        if (!success && this.boardEl) {
            this.boardEl.classList.add('shake');
        }

        // Reveal mines
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.mine) {
                    if (success) {
                        cell.flagged = true;
                        cell.questioned = false;
                    } else {
                        cell.revealed = true;
                    }
                }
                this.updateCellUI(r, c);
            }
        }

        let isNewRecord = false;
        let bestTime = localStorage.getItem('minesweeper_best_time');
        
        if (success && this.mode === 'time-trial') {
            if (!bestTime || this.timeLimit - this.time < parseInt(bestTime)) {
                localStorage.setItem('minesweeper_best_time', this.timeLimit - this.time);
                bestTime = this.timeLimit - this.time;
                isNewRecord = true;
            }
        } else if (success) {
            if (!bestTime || this.time < parseInt(bestTime)) {
                localStorage.setItem('minesweeper_best_time', this.time);
                bestTime = this.time;
                isNewRecord = true;
            }
        }

        const overlay = this.container.querySelector('#msOverlay');
        const overlayTitle = this.container.querySelector('#msOverlayTitle');
        const overlayMsg = this.container.querySelector('#msOverlayMsg');
        const overlayBtn = this.container.querySelector('#msOverlayBtn');
        const gameOverMinerImg = this.container.querySelector('#msGameOverMinerImg');
        const gameOverMinerText = this.container.querySelector('#msGameOverMinerText');

        if (overlay && overlayTitle && overlayMsg && overlayBtn && gameOverMinerImg && gameOverMinerText) {
            overlayTitle.textContent = success ? 'VICTORY!' : 'GAME OVER';
            overlayTitle.style.color = success ? 'var(--primary)' : '#ef4444';
            
            if (this.mode === 'endless') {
                overlayMsg.innerHTML = `Safe cells cleared: ${this.score}`;
            } else if (this.mode === 'time-trial') {
                const secondsTaken = this.timeLimit - this.time;
                overlayMsg.innerHTML = success 
                    ? `Time taken: ${secondsTaken}s (Left: ${this.time}s)`
                    : `Blew up with ${this.time}s remaining!`;
            } else {
                const displayTime = String(this.time).padStart(3, '0');
                const displayBest = bestTime ? String(bestTime).padStart(3, '0') + 's' : '---';
                overlayMsg.innerHTML = success 
                    ? `Clear Time: ${displayTime}s<br>Best Time: ${displayBest}`
                    : `Blew up in ${displayTime}s<br>Best Time: ${displayBest}`;
            }

            // Get Miner Mascot image and speech comment
            const minerResult = this.getMinerComment(success, reason);
            gameOverMinerImg.src = this.getMinerImgSrc(minerResult.img);
            gameOverMinerText.textContent = minerResult.text;

            overlayBtn.onclick = () => this.start();

            setTimeout(() => {
                overlay.classList.add('show');
            }, 800);
        }

        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(success ? this.time : 0);
        }
    }

    updateHacksUI() {
        const shieldBtn = this.container.querySelector('#msHackShield');
        const pingBtn = this.container.querySelector('#msHackPing');

        if (shieldBtn) {
            if (this.shieldActive) {
                shieldBtn.className = 'ms-hack-btn active';
                shieldBtn.innerHTML = '<span class="ms-hack-icon">🛡️</span> SHIELD: ON';
            } else {
                shieldBtn.className = 'ms-hack-btn disabled';
                shieldBtn.innerHTML = '<span class="ms-hack-icon">🛡️</span> SHIELD: OFF';
            }
        }

        if (pingBtn) {
            if (this.pingCharges > 0 && !this.firstClick && !this.gameOverState && !this.isPaused) {
                pingBtn.className = 'ms-hack-btn active';
                pingBtn.disabled = false;
            } else {
                pingBtn.className = 'ms-hack-btn disabled';
                pingBtn.disabled = true;
            }
            pingBtn.innerHTML = `<span class="ms-hack-icon">📡</span> PING (${this.pingCharges})`;
        }
    }

    usePing() {
        if (this.gameOverState || this.isPaused || this.firstClick || this.pingCharges <= 0) return;

        const candidates = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (!cell.mine && !cell.revealed) {
                    candidates.push(cell);
                }
            }
        }

        if (candidates.length > 0) {
            const randCell = candidates[Math.floor(Math.random() * candidates.length)];
            this.reveal(randCell.row, randCell.col);
            this.updateUI();
            this.checkGameStatus();

            this.pingCharges = 0;
            this.updateHacksUI();

            if (navigator.vibrate) {
                try { navigator.vibrate(30); } catch(err) {}
            }
        }
    }
}
