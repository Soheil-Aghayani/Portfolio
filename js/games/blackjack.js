const localIcon = (name, options = {}) => window.IconRegistry
    ? window.IconRegistry.svg(name, options)
    : '';

// Audio Synth Engine using Web Audio API (Lazily initialized)
const cardSuitIcon = (suit, label = '') => window.IconRegistry
    ? window.IconRegistry.svg(`games/blackjack/${suit}`, { className: 'bj-suit-icon', label })
    : '';

class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(freqStart, freqEnd, type, duration, volume = 0.08) {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
        if (freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playDeal() {
        this.play(800, 300, 'triangle', 0.15, 0.04);
    }

    playFlip() {
        this.play(400, 600, 'sine', 0.12, 0.05);
    }

    playWin(profit) {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Scale note quantity based on profit amount
        let notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
        if (profit >= 400) {
            notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96]; // Ultimate win melody
        } else if (profit >= 200) {
            notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; 
        } else if (profit >= 100) {
            notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        }

        notes.forEach((note, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(note, now + idx * 0.06);
            gain.gain.setValueAtTime(0.06, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.06 + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.18);
        });
    }

    playLose() {
        this.play(300, 100, 'sine', 0.45, 0.14);
    }

    playPush() {
        this.play(320, 320, 'triangle', 0.22, 0.08);
    }

    playGlitch() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 6; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(Math.random() * 600 + 200, now + i * 0.035);
            gain.gain.setValueAtTime(0.035, now + i * 0.035);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.055);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.035);
            osc.stop(now + i * 0.035 + 0.055);
        }
    }
}

export class BlackjackGame {
    constructor(container) {
        this.container = container;
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        
        // Game States: 'BETTING', 'DEALING', 'PLAYING', 'RESOLVED'
        this.gameState = 'BETTING'; 
        
        this.bankroll = parseInt(localStorage.getItem('blackjack_bankroll') || 1000);
        this.currentBet = 0;
        this.activeBetChips = []; // Stores the exact sequence of chips bet
        this.activeColumns = []; // Stores chip denominations in chronological order of placement
        
        this.streak = 0;
        this.charges = 3; 
        this.winsForCharge = 0; 
        this.peeked = false;
        
        this.userName = localStorage.getItem('blackjack_user_name') || '';
        this.rescueCompUsed = localStorage.getItem('blackjack_rescue_comp_used') === 'true';
        this.highScore = parseInt(localStorage.getItem('blackjack_high_score') || 0);

        this.sound = new SoundEngine();

        // Canvas particles state
        this.effectsParticles = [];
        this.effectsAnimId = null;

        // Build UI structure
        this.container.innerHTML = `
            <div class="blackjack-table" style="position: relative;">
                <!-- Win Hologram Banner -->
                <div class="bj-win-banner" id="bjWinBanner">
                    <div class="bj-win-banner-title" id="bjWinBannerTitle">YOU WIN!</div>
                    <div class="bj-win-banner-amount" id="bjWinBannerAmount">+$100</div>
                </div>

                <!-- Heart Warming Gift Modal Popup -->
                <div class="bj-comp-gift" id="bjCompGift">
                    <div class="bj-gift-icon">${window.IconRegistry ? window.IconRegistry.svg('games/blackjack/gift-linear', { className: 'bj-gift-svg', label: 'Gift credits' }) : ''}</div>
                    <div class="bj-gift-title" id="bjGiftTitle">COMP COMPASSION</div>
                    <div class="bj-gift-msg" id="bjGiftMsg">The House stands with you. Here is a gift of $100 credits!</div>
                </div>

                <!-- Particle Layer -->
                <canvas id="bjEffectsCanvas" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 20;"></canvas>

                <div class="bj-row">
                    <h3>Dealer <span id="bjDealerScore"></span></h3>
                    <div id="bjDealerCards" class="bj-cards"></div>
                </div>
                <div class="bj-row">
                    <h3>You <span id="bjPlayerScore"></span></h3>
                    <div id="bjPlayerCards" class="bj-cards">
                        <div class="bj-bet-circle-wrapper" style="margin-right: 12px; display: flex; align-items: center; justify-content: center; min-height: 74px;">
                            <div class="bj-bet-circle">
                                <div id="bjChipsContainer" class="bj-chips-stack-3d"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bj-hud">
                    <!-- Inline Cyber Deck Panel -->
                    <div class="bj-hud-hacks">
                        <div class="bj-energy-label">DECK: <span id="bjWinsCount" style="color:var(--text-muted);font-weight:normal;font-size:0.65rem;">(0/3)</span></div>
                        <div class="bj-energy-cells" id="bjEnergyCells"></div>
                        <button id="bjPeek" class="bj-hack-btn peek" type="button">${localIcon('ui/eye', { label: 'Peek' })} PEEK</button>
                        <button id="bjGlitch" class="bj-hack-btn glitch" type="button">${localIcon('states/hacker', { label: 'Glitch' })} GLITCH</button>
                    </div>

                    <!-- Inline Betting & Credits HUD -->
                    <div class="bj-hud-betting">
                        <div class="bj-hud-left">
                            <div class="bj-bankroll">
                                CREDITS: <span id="bjBankroll">$${this.bankroll}</span>
                                <button id="bjResign" class="bj-resign-icon-btn" type="button" title="Resign & Reset Bankroll">
                                    ${window.IconRegistry ? window.IconRegistry.svg('games/shared/reset', { className: 'bj-reset-svg', label: 'Reset bankroll' }) : ''}
                                </button>
                            </div>
                            <div class="bj-current-bet-display" id="bjCurrentBetDisplay" style="display:none;">
                                BET: <span id="bjBetValue">$0</span>
                            </div>
                        </div>
                        <div class="bj-bet-controls" id="bjBetControls">
                            <div class="bj-chips-row">
                                <button class="bj-bet-btn chip-10" data-amount="10" type="button" aria-label="Bet 10 credits"><span class="bj-bet-icon">${localIcon('ui/hand-money', { className: 'bj-bet-chip-icon' })}</span><span class="bj-bet-value">10</span></button>
                                <button class="bj-bet-btn chip-50" data-amount="50" type="button" aria-label="Bet 50 credits"><span class="bj-bet-icon">${localIcon('ui/hand-money', { className: 'bj-bet-chip-icon' })}</span><span class="bj-bet-value">50</span></button>
                                <button class="bj-bet-btn chip-100" data-amount="100" type="button" aria-label="Bet 100 credits"><span class="bj-bet-icon">${localIcon('ui/hand-money', { className: 'bj-bet-chip-icon' })}</span><span class="bj-bet-value">100</span></button>
                                <button class="bj-bet-btn chip-200" data-amount="200" type="button" aria-label="Bet 200 credits"><span class="bj-bet-icon">${localIcon('ui/hand-money', { className: 'bj-bet-chip-icon' })}</span><span class="bj-bet-value">200</span></button>
                            </div>
                            <div class="bj-actions-row">
                                <button id="bjClear" class="bj-action-bet-btn clear" type="button" title="Clear current bet">${localIcon('ui/close-rounded', { label: 'Clear bet' })} Clear</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="bjMsg" class="os-line" style="min-height: 20px; margin: 8px 0; font-size: 0.85rem;" role="status" aria-live="polite"></div>
                <div class="bj-controls">
                    <button id="bjHit" class="btn hit-btn" type="button">${localIcon('games/minesweeper/click-tap', { label: 'Hit' })} Hit</button>
                    <button id="bjStand" class="btn stand-btn" type="button">${localIcon('states/check-circle', { label: 'Stand' })} Stand</button>
                    <button id="bjDeal" class="btn deal-btn" type="button" style="display:none;">${localIcon('games/shared/play', { label: 'Deal' })} Deal</button>
                </div>
                
                <div class="game-overlay" id="bjOverlay">
                    <div class="game-overlay-title" id="bjOverlayTitle">BROKE!</div>
                    <div class="game-overlay-msg" id="bjOverlayMsg"></div>
                    <button class="game-overlay-btn" id="bjOverlayBtn" type="button">${localIcon('games/shared/reset', { label: 'Reset bankroll' })} Reset Bankroll</button>
                </div>

                <!-- Cyberpunk Registration Modal -->
                <div class="bj-reg-modal" id="bjRegModal">
                    <div class="bj-reg-content">
                        <div class="bj-reg-left">
                            <img id="bjRegImg" src="assets/images/portfolio/name.webp" alt="Casino Boss" class="bj-reg-avatar" />
                        </div>
                        <div class="bj-reg-right">
                            <div class="bj-reg-title">REGISTRATION REQUIRED</div>
                            <p class="bj-reg-subtitle" id="bjRegSubtitle">Welcome to the lounge, runner. Provide your handle to register your Cyber Deck.</p>
                            <div class="bj-reg-input-group">
                                <input type="text" id="bjRegInput" maxlength="16" placeholder="Enter handle..." autofocus />
                                <span class="bj-reg-error" id="bjRegError"></span>
                            </div>
                            <button class="bj-reg-submit" id="bjRegSubmit" type="button">${localIcon('states/verified-user', { label: 'Enter the lounge' })} Enter the Lounge</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elDealerCards = container.querySelector('#bjDealerCards');
        this.elPlayerCards = container.querySelector('#bjPlayerCards');
        this.elDealerScore = container.querySelector('#bjDealerScore');
        this.elPlayerScore = container.querySelector('#bjPlayerScore');
        this.elMsg = container.querySelector('#bjMsg');
        this.elBankroll = container.querySelector('#bjBankroll');
        this.elWinsCount = container.querySelector('#bjWinsCount');
        
        this.btnHit = container.querySelector('#bjHit');
        this.btnStand = container.querySelector('#bjStand');
        this.btnResign = container.querySelector('#bjResign');
        this.btnPeek = container.querySelector('#bjPeek');
        this.btnGlitch = container.querySelector('#bjGlitch');
        
        this.btnClear = container.querySelector('#bjClear');
        this.btnDeal = container.querySelector('#bjDeal');
        
        this.betControls = container.querySelector('#bjBetControls');
        this.currentBetDisplay = container.querySelector('#bjCurrentBetDisplay');
        this.elBetValue = container.querySelector('#bjBetValue');

        // Banner, Gift and Canvas targets
        this.winBanner = container.querySelector('#bjWinBanner');
        this.winBannerTitle = container.querySelector('#bjWinBannerTitle');
        this.winBannerAmount = container.querySelector('#bjWinBannerAmount');
        
        this.compGiftEl = container.querySelector('#bjCompGift');
        this.giftTitleEl = container.querySelector('#bjGiftTitle');
        this.giftMsgEl = container.querySelector('#bjGiftMsg');
        
        this.effectsCanvas = container.querySelector('#bjEffectsCanvas');
        this.effectsCtx = this.effectsCanvas.getContext('2d');

        this.overlayEl = container.querySelector('#bjOverlay');
        this.overlayTitleEl = container.querySelector('#bjOverlayTitle');
        this.overlayMsgEl = container.querySelector('#bjOverlayMsg');
        this.overlayBtn = container.querySelector('#bjOverlayBtn');

        this.btnHit.onclick = () => this.hit();
        this.btnStand.onclick = () => this.stand();
        this.btnPeek.onclick = () => this.usePeek();
        this.btnGlitch.onclick = () => this.useGlitch();
        this.btnResign.onclick = () => this.resign();
        this.btnClear.onclick = () => this.clearBet();
        this.btnDeal.onclick = () => this.executeDeal();
        this.overlayBtn.onclick = () => this.resetBrokeState();

        // Bind bet buttons
        container.querySelectorAll('.bj-bet-btn').forEach(btn => {
            btn.onclick = () => {
                const amount = parseInt(btn.getAttribute('data-amount'));
                this.placeBet(amount);
            };
        });

        this.handleTableClick = this.handleTableClick.bind(this);
        this.container.removeEventListener('click', this.handleTableClick);
        this.container.addEventListener('click', this.handleTableClick);

        // Set dimensions for the effects canvas
        setTimeout(() => {
            const rect = this.container.querySelector('.blackjack-table').getBoundingClientRect();
            this.effectsCanvas.width = rect.width;
            this.effectsCanvas.height = rect.height;
        }, 150);

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async dealCard(hand, isDealer, animateLast = true) {
        this.sound.playDeal();
        hand.push(this.deck.pop());
        this.render(isDealer && hand.length > 2, animateLast);
        await this.sleep(220);
    }

    async start() {
        this.sound.init(); // Warm audio context

        // Prompt for valid username using our gorgeous modal if not set yet
        if (!this.userName) {
            await this.showRegistrationModal();
        }

        this.gameState = 'BETTING';
        this.playerHand = [];
        this.dealerHand = [];
        this.activeBetChips = [];
        this.currentBet = 0;
        this.peeked = false;
        
        this.overlayEl.classList.remove('show');
        this.winBanner.classList.remove('show');
        this.compGiftEl.classList.remove('show');
        this.elMsg.textContent = `Welcome, ${this.userName}. Build your bet with chips, then click Deal.`;
        this.elMsg.className = 'os-line';

        this.render(false, false);

        // Bind keyboard shortcuts
        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        this.container.removeEventListener('click', this.handleTableClick);
        this.container.addEventListener('click', this.handleTableClick);
    }

    showRegistrationModal() {
        return new Promise((resolve) => {
            const modal = this.container.querySelector('#bjRegModal');
            const avatar = this.container.querySelector('#bjRegImg');
            const input = this.container.querySelector('#bjRegInput');
            const submitBtn = this.container.querySelector('#bjRegSubmit');
            const errorSpan = this.container.querySelector('#bjRegError');
            const subtitle = this.container.querySelector('#bjRegSubtitle');
            
            // Reset modal state
            modal.classList.add('show');
            avatar.src = 'assets/images/portfolio/name.webp';
            input.value = '';
            input.disabled = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = `${localIcon('states/verified-user', { label: 'Enter the lounge' })} Enter the Lounge`;
            errorSpan.textContent = '';
            subtitle.textContent = 'Welcome to the lounge, runner. Provide your handle to register your Cyber Deck.';
            
            // Focus input with timeout to allow CSS animation to start
            setTimeout(() => input.focus(), 150);
            
            const handleRegistration = async () => {
                const rawVal = input.value;
                const trimmed = rawVal.trim();
                
                // Letters and spaces only, 2-16 characters
                const isValid = /^[A-Za-z\s]+$/.test(trimmed) && trimmed.length >= 2 && trimmed.length <= 16;
                if (!isValid) {
                    errorSpan.textContent = 'Use only letters and spaces (2-16 chars).';
                    this.sound.play(180, 180, 'triangle', 0.15, 0.1);
                    input.focus();
                    return;
                }
                
                // Clear error, disable inputs during transition
                errorSpan.textContent = '';
                input.disabled = true;
                submitBtn.disabled = true;
                
                // Save name
                this.userName = trimmed;
                localStorage.setItem('blackjack_user_name', trimmed);
                
                // Play success sound
                this.sound.play(600, 900, 'sine', 0.1, 0.08);
                
                // Transition Avatar to Welcome!
                avatar.classList.add('fade-out');
                await this.sleep(150);
            avatar.src = 'assets/images/portfolio/welcome.webp';
                avatar.classList.remove('fade-out');
                
                // Update text
                subtitle.textContent = `A pleasure, ${trimmed}. Let's see if you can break the bank tonight.`;
                submitBtn.innerHTML = `${localIcon('states/verified', { label: 'Access granted' })} Access Granted`;
                
                // Wait for player to read welcoming text
                await this.sleep(1500);
                
                // Fade out modal and resolve
                modal.classList.remove('show');
                resolve(trimmed);
            };
            
            // Listeners helper
            const onKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegistration();
                }
            };
            
            const onSubmitClick = (e) => {
                e.preventDefault();
                handleRegistration();
            };
            
            // Bind listeners
            input.addEventListener('keydown', onKeyDown);
            submitBtn.addEventListener('click', onSubmitClick);
            
            // Override promise cleanup
            const originalResolve = resolve;
            resolve = (val) => {
                input.removeEventListener('keydown', onKeyDown);
                submitBtn.removeEventListener('click', onSubmitClick);
                originalResolve(val);
            };
        });
    }

    placeBet(amount) {
        if (this.gameState !== 'BETTING') return;
        if (this.bankroll < amount) {
            this.elMsg.textContent = 'Insufficient credits!';
            this.elMsg.className = 'os-line os-bad';
            this.sound.play(180, 180, 'triangle', 0.15, 0.1);
            return;
        }

        this.bankroll -= amount;
        this.activeBetChips.push(amount);
        this.currentBet = this.activeBetChips.reduce((a, b) => a + b, 0);

        if (!this.activeColumns.includes(amount)) {
            this.activeColumns.push(amount);
        }
        
        localStorage.setItem('blackjack_bankroll', this.bankroll);
        
        this.sound.play(600, 400, 'sine', 0.08, 0.05);
        this.elMsg.textContent = 'Build your bet with chips, then click Deal.';
        this.elMsg.className = 'os-line';
        this.render(false, false);
    }

    clearBet() {
        if (this.gameState !== 'BETTING' || this.currentBet === 0) return;

        this.bankroll += this.currentBet;
        this.activeBetChips = [];
        this.activeColumns = [];
        this.currentBet = 0;
        localStorage.setItem('blackjack_bankroll', this.bankroll);
        
        this.sound.play(400, 200, 'sine', 0.12, 0.05);
        this.elMsg.textContent = 'Bet cleared.';
        this.elMsg.className = 'os-line';
        this.render(false, false);
    }

    async executeDeal() {
        if (this.gameState !== 'BETTING' || this.currentBet === 0) return;
        
        this.gameState = 'DEALING';
        this.winBanner.classList.remove('show');
        this.compGiftEl.classList.remove('show');
        
        this.deck = this.buildDeck();
        this.playerHand = [];
        this.dealerHand = [];
        this.peeked = false;

        this.render(false, false);

        // Sequence initial deal
        await this.dealCard(this.playerHand, false, true);
        await this.dealCard(this.dealerHand, true, true);
        await this.dealCard(this.playerHand, false, true);
        await this.dealCard(this.dealerHand, true, true);

        const pVal = this.handValue(this.playerHand);
        const dVal = this.handValue(this.dealerHand);

        if (dVal === 21) {
            this.render(true, false);
            if (pVal === 21) {
                this.end("Both have Blackjack. Push.", "os-warn", "draw");
            } else {
                this.end("Dealer has Blackjack. Dealer wins.", "os-bad", "loss");
            }
        } else if (pVal === 21) {
            this.render(true, false);
            this.end("Blackjack! You win.", "os-ok", "win-blackjack");
        } else {
            this.gameState = 'PLAYING';
            this.btnHit.focus();
            this.render(false, false);
        }
    }

    handleKeyDown(e) {
        return;
    }

    async handleTableClick(e) {
        if (this.gameState !== 'BETTING') return;
        const chipEl = e.target.closest('.bj-chip');
        if (!chipEl) return;
        if (chipEl.classList.contains('retrieve-animate')) return;
        
        const val = parseInt(chipEl.getAttribute('data-val'));
        if (isNaN(val)) return;
        
        const idx = this.activeBetChips.lastIndexOf(val);
        if (idx !== -1) {
            chipEl.classList.add('retrieve-animate');
            this.sound.play(450, 300, 'sine', 0.08, 0.05);
            
            await this.sleep(180);
            
            this.activeBetChips.splice(idx, 1);
            this.bankroll += val;
            this.currentBet = this.activeBetChips.reduce((a, b) => a + b, 0);
            
            if (!this.activeBetChips.includes(val)) {
                this.activeColumns = this.activeColumns.filter(c => c !== val);
            }
            
            localStorage.setItem('blackjack_bankroll', this.bankroll);
            this.render(false, false);
        }
    }

    async hit() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'DEALING';

        await this.dealCard(this.playerHand, false, true);
        const val = this.playerHand.length > 0 ? this.handValue(this.playerHand) : 0;

        if (val > 21) {
            this.end("Bust! Dealer wins.", "os-bad", "loss");
        } else if (val === 21) {
            this.stand(true);
        } else {
            this.gameState = 'PLAYING';
            this.btnHit.focus();
            this.render(false, false);
        }
    }

    async stand(force = false) {
        if (this.gameState !== 'PLAYING' && !force) return;
        this.gameState = 'DEALING';

        this.sound.playFlip();
        this.peeked = false;
        this.render(true, false);
        await this.sleep(500);

        while (this.handValue(this.dealerHand) < 17) {
            this.sound.playDeal();
            this.dealerHand.push(this.deck.pop());
            this.render(true, true);
            await this.sleep(550);
        }

        const p = this.handValue(this.playerHand);
        const d = this.handValue(this.dealerHand);

        if (d > 21) return this.end("Dealer bust. You win!", "os-ok", "win");
        if (p > d) return this.end("You win!", "os-ok", "win");
        if (p < d) return this.end("Dealer wins.", "os-bad", "loss");
        return this.end("Push. Draw.", "os-warn", "draw");
    }

    usePeek() {
        if (this.gameState !== 'PLAYING' || this.charges < 1 || this.peeked) return;
        this.charges--;
        this.peeked = true;
        this.sound.play(400, 1200, 'sine', 0.25, 0.05);
        this.render(false, false);
    }

    async useGlitch() {
        if (this.gameState !== 'PLAYING' || this.charges < 1 || this.playerHand.length < 2) return;
        
        this.gameState = 'DEALING';
        this.charges--;
        
        this.playerHand.pop();
        this.sound.playGlitch();
        await this.sleep(220);

        await this.dealCard(this.playerHand, false, true);
        const val = this.handValue(this.playerHand);

        if (val > 21) {
            this.end("Bust! Dealer wins.", "os-bad", "loss");
        } else if (val === 21) {
            this.stand(true);
        } else {
            this.gameState = 'PLAYING';
            this.btnHit.focus();
            this.render(false, false);
        }
    }

    resign() {
        this.bankroll = 1000;
        this.charges = 3;
        this.winsForCharge = 0;
        this.streak = 0;
        this.activeBetChips = [];
        this.activeColumns = [];
        this.currentBet = 0;
        
        this.rescueCompUsed = false;
        localStorage.removeItem('blackjack_rescue_comp_used');
        
        this.userName = '';
        localStorage.removeItem('blackjack_user_name');
        
        localStorage.setItem('blackjack_bankroll', this.bankroll);
        
        this.sound.play(200, 450, 'sawtooth', 0.35, 0.08);
        this.elMsg.textContent = 'Cyber Deck reloaded. Play started from scratch.';
        this.elMsg.className = 'os-line os-ok';
        this.start();
    }

    spawnWinParticles(count, profit, isFirstBurst = true) {
        const width = this.effectsCanvas.width;
        const height = this.effectsCanvas.height;

        const scaleFactor = Math.min(2.5, 0.5 + profit / 150);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI - Math.PI; 
            const speed = (Math.random() * 6.5 + 4.5) * (0.8 + scaleFactor * 0.18);
            this.effectsParticles.push({
                x: width / 2 + (Math.random() - 0.5) * 80,
                y: height - 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.0,
                radius: Math.random() * 5.0 + 3.8,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.32,
                alpha: 1.0,
                decay: (Math.random() * 0.0095 + 0.006) / (0.85 + scaleFactor * 0.15), 
                color: Math.random() > 0.4 ? '#fbbf24' : (Math.random() > 0.5 ? '#f59e0b' : '#34d399'), 
                gravity: 0.35,
                bounce: 0.45 + Math.random() * 0.22
            });
        }

        if (isFirstBurst) {
            if (profit >= 400) {
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.8), profit, false), 220);
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.6), profit, false), 440);
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.5), profit, false), 660);
            } else if (profit >= 200) {
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.7), profit, false), 220);
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.5), profit, false), 440);
            } else if (profit >= 100) {
                setTimeout(() => this.spawnWinParticles(Math.floor(count * 0.6), profit, false), 250);
            }
        }

        if (!this.effectsAnimId) {
            this.effectsAnimId = requestAnimationFrame(() => this.updateEffects());
        }
    }

    updateEffects() {
        const ctx = this.effectsCtx;
        const canvas = this.effectsCanvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.effectsParticles.length === 0) {
            this.effectsAnimId = null;
            return;
        }

        for (let i = this.effectsParticles.length - 1; i >= 0; i--) {
            const p = this.effectsParticles[i];
            
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.vRot;
            p.alpha -= p.decay;

            if (p.y > canvas.height - p.radius) {
                p.y = canvas.height - p.radius;
                p.vy = -p.vy * p.bounce;
                p.vx *= 0.85; 
            }
            
            if (p.x < p.radius) {
                p.x = p.radius;
                p.vx = -p.vx * p.bounce;
            } else if (p.x > canvas.width - p.radius) {
                p.x = canvas.width - p.radius;
                p.vx = -p.vx * p.bounce;
            }

            if (p.alpha <= 0) {
                this.effectsParticles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.75, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.8;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `900 ${Math.floor(p.radius * 0.9)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);

            ctx.restore();
        }

        this.effectsAnimId = requestAnimationFrame(() => this.updateEffects());
    }

    breakdownBet(amount) {
        let temp = amount;
        const list = [];
        while (temp >= 200) { list.push(200); temp -= 200; }
        while (temp >= 100) { list.push(100); temp -= 100; }
        while (temp >= 50) { list.push(50); temp -= 50; }
        while (temp >= 10) { list.push(10); temp -= 10; }
        return list;
    }

    end(msg, cls, outcome) {
        this.gameState = 'RESOLVED';
        window.removeEventListener('keydown', this.handleKeyDown);

        this.elMsg.textContent = msg;
        this.elMsg.className = 'os-line ' + cls;

        let profit = 0;
        const isWin = (outcome === 'win' || outcome === 'win-blackjack');

        if (isWin) {
            profit = outcome === 'win-blackjack' ? Math.round((this.currentBet * 1.5) / 10) * 10 : this.currentBet;
            this.sound.playWin(profit);
            
            // Strategic payout: Dealer matches bet chips on table
            if (outcome === 'win-blackjack') {
                this.activeBetChips.push(...this.breakdownBet(profit));
            } else {
                const len = this.activeBetChips.length;
                for (let i = 0; i < len; i++) {
                    this.activeBetChips.push(this.activeBetChips[i]);
                }
            }

            this.bankroll += (this.currentBet + profit);
            
            this.streak++;
            if (this.streak > this.highScore) {
                this.highScore = this.streak;
                localStorage.setItem('blackjack_high_score', this.highScore);
            }

            // 3 Wins Cyber Deck Charge
            this.winsForCharge++;
            if (this.winsForCharge >= 3) {
                this.charges = Math.min(3, this.charges + 1);
                this.winsForCharge = 0;
                setTimeout(() => this.sound.play(587.33, 880.00, 'sine', 0.25, 0.08), 80);
            }

            // count scales dynamically with profit size
            const count = Math.min(75, 18 + Math.floor(profit * 0.16));
            
            this.winBannerTitle.textContent = outcome === 'win-blackjack' ? 'BLACKJACK!' : 'YOU WIN!';
            this.winBannerAmount.textContent = `+$${profit}`;
            this.winBanner.classList.add('show');
            
            // Physical screen rumble for large wins
            if (profit >= 100) {
                const tableEl = this.container.querySelector('.blackjack-table');
                if (tableEl) {
                    tableEl.classList.add('bj-shake-active');
                    setTimeout(() => tableEl.classList.remove('bj-shake-active'), 450);
                }
            }

            this.spawnWinParticles(count, profit, true);
        } else if (outcome === 'loss') {
            this.sound.playLose();
            this.streak = 0;
            
            // Add sweep-loss immediately so they slide away toward dealer!
            const stackEl = this.container.querySelector('#bjChipsContainer');
            if (stackEl) {
                stackEl.classList.remove('sweep-win');
                stackEl.classList.add('sweep-loss');
            }
        } else {
            // Push
            this.sound.playPush();
            this.bankroll += this.currentBet; 
        }

        this.currentBet = 0;
        localStorage.setItem('blackjack_bankroll', this.bankroll);

        // --- NEW COMPLIMENTARY BONUS SCHEME LOGIC ---
        let compAwarded = false;
        let compAmount = 0;
        let compTitle = 'COMP COMPASSION';
        let compMsg = '';

        const pValue = this.playerHand.length > 0 ? this.handValue(this.playerHand) : 0;
        const isBroke = (this.bankroll <= 0);

        if (isBroke) {
            // First-time rescue comp: 100% chance
            if (!this.rescueCompUsed) {
                this.rescueCompUsed = true;
                localStorage.setItem('blackjack_rescue_comp_used', 'true');
                
                compAwarded = true;
                compAmount = 500; // Flat rescue comp
                this.bankroll = 500;
                localStorage.setItem('blackjack_bankroll', this.bankroll);
                
                compTitle = "VIP RESCUE COMP";
                compMsg = `We value your presence, ${this.userName}. The House stands with you and awards a warm gift of $500 rescue credits!`;
            }
        } else {
            // Comp is genuinely rare — should feel like a special gift, not routine
            // • Natural Blackjack (2-card 21): 10% chance
            // • Loss: 5% chance
            // • Draw/Push: never (bankroll returned, no need for comp)
            let regularCompTrigger = false;
            const isNaturalBlackjack = (outcome === 'win-blackjack' && this.playerHand.length === 2);

            if (isNaturalBlackjack && Math.random() < 0.10) {
                regularCompTrigger = true;
            } else if (outcome === 'loss' && Math.random() < 0.05) {
                regularCompTrigger = true;
            }

            if (regularCompTrigger) {
                const rawBonus = this.bankroll * 0.1;
                compAmount = Math.max(10, Math.round(rawBonus / 10) * 10); // aligned to $10 minimum
                if (compAmount > 0) {
                    compAwarded = true;
                    this.bankroll += compAmount;
                    localStorage.setItem('blackjack_bankroll', this.bankroll);
                    compTitle = "HOUSE COMPASSION";
                    compMsg = `The Dealer sends a complimentary package for ${this.userName} containing a warming gift of $${compAmount} credits!`;
                }
            }
        }

        this.render(true, false);

        if (compAwarded) {
            // Delay comp notification by 1 second to let hand resolution show first
            setTimeout(() => {
                this.sound.playWin(compAmount);
                this.giftTitleEl.textContent = compTitle;
                this.giftMsgEl.textContent = compMsg;
                this.compGiftEl.classList.add('show');
                
                this.spawnWinParticles(15, compAmount, false);
                this.render(true, false);
                
                // Automatically close gift card after 2.6 seconds
                setTimeout(() => {
                    this.compGiftEl.classList.remove('show');
                }, 2600);
            }, 1000);
        }

        // Check if Broke (if rescue comp was already used, they actually go broke)
        if (this.bankroll <= 0) {
            setTimeout(() => {
                this.overlayTitleEl.textContent = 'BROKE!';
                this.overlayTitleEl.style.color = '#ef4444';
                this.overlayMsgEl.innerHTML = `You ran out of credits!<br>Streak: ${this.streak}<br>High Score: ${this.highScore}`;
                this.overlayEl.classList.add('show');
                this.overlayBtn.focus();
            }, compAwarded ? 3600 : 800); // Wait longer if comp was playing
        } else {
            // Auto transition back to betting status after 2.4s to let win banner shine
            setTimeout(() => {
                if (this.gameState === 'RESOLVED') {
                    const stackEl = this.container.querySelector('#bjChipsContainer');
                    if (stackEl) {
                        if (outcome !== 'loss') {
                            stackEl.classList.remove('sweep-loss');
                            stackEl.classList.add('sweep-win');
                        }
                    }
                    
                    setTimeout(() => {
                        this.winBanner.classList.remove('show');
                        this.gameState = 'BETTING';
                        this.playerHand = [];
                        this.dealerHand = [];
                        this.activeBetChips = [];
                        this.activeColumns = [];
                        this.currentBet = 0;
                        
                        if (stackEl) {
                            stackEl.classList.remove('sweep-loss', 'sweep-win');
                        }
                        
                        this.render(false, false);
                        this.elMsg.textContent = 'Build your bet with chips, then click Deal.';
                    }, 350); // wait for sweep animation
                }
            }, 2400);
        }
    }

    resetBrokeState() {
        this.bankroll = 1000;
        this.charges = 3;
        this.winsForCharge = 0;
        this.streak = 0;
        this.rescueCompUsed = false;
        localStorage.removeItem('blackjack_rescue_comp_used');
        localStorage.setItem('blackjack_bankroll', this.bankroll);
        
        this.overlayEl.classList.remove('show');
        this.start();
    }

    getChipsHtml() {
        return this.activeColumns.map((colVal, colIdx) => {
            const chips = this.activeBetChips
                .map((val, originalIdx) => ({ val, originalIdx }))
                .filter(item => item.val === colVal);

            const offsetLeft = 6 + colIdx * 30; // Spaced 30px apart

            // Cap the visual rendering stack at 10 chips to prevent skyscraper overflow
            const maxVisual = 10;
            const visualChips = chips.slice(-maxVisual);

            let stackHtml = visualChips.map((c, idx) => {
                const isNewest = (this.gameState === 'BETTING' && c.originalIdx === this.activeBetChips.length - 1);
                const animClass = isNewest ? 'throw-animate' : '';
                let colorClass = '';
                if (colVal === 200) colorClass = 'chip-200';
                else if (colVal === 100) colorClass = 'chip-100';
                else if (colVal === 50) colorClass = 'chip-50';
                else colorClass = 'chip-10';

                return `<div class="bj-chip ${colorClass} ${animClass}" style="--idx: ${idx}; left: ${offsetLeft}px; bottom: calc(${idx} * 3.5px);" data-val="${colVal}"><span>${colVal}</span></div>`;
            }).join('');

            // Display floating stack count if more than 1 chip in stack
            if (chips.length > 1) {
                const labelBottom = visualChips.length * 3.5 + 26; // just above the top visual chip
                stackHtml += `<div class="bj-chip-multiplier" style="left: ${offsetLeft}px; bottom: ${labelBottom}px;">x${chips.length}</div>`;
            }

            return stackHtml;
        }).join('');
    }

    render(revealDealer, animateLast = false) {
        // Render Player Cards, preserving the permanent betting circle wrapper
        const playerCardsContainer = this.container.querySelector('#bjPlayerCards');
        if (playerCardsContainer) {
            const betWrapper = playerCardsContainer.querySelector('.bj-bet-circle-wrapper');
            playerCardsContainer.innerHTML = '';
            if (betWrapper) {
                playerCardsContainer.appendChild(betWrapper);
            }
            
            this.playerHand.forEach((c, idx) => {
                const isLast = animateLast && (idx === this.playerHand.length - 1);
                const cardHtmlStr = this.cardHtml(c, isLast);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHtmlStr;
                playerCardsContainer.appendChild(tempDiv.firstElementChild);
            });
        }

        // Render stack inside permanent chips container
        const chipsContainer = this.container.querySelector('#bjChipsContainer');
        if (chipsContainer) {
            chipsContainer.innerHTML = this.getChipsHtml();
        }

        this.elPlayerScore.textContent = this.playerHand.length > 0 ? `(${this.handValue(this.playerHand)})` : '';

        if (revealDealer) {
            this.elDealerCards.innerHTML = this.dealerHand.map((c, idx) => {
                const isLast = animateLast && (idx === this.dealerHand.length - 1);
                return this.cardHtml(c, isLast);
            }).join('');
            this.elDealerScore.textContent = this.dealerHand.length > 0 ? `(${this.handValue(this.dealerHand)})` : '';
        } else {
            const first = this.dealerHand[0];
            const second = this.dealerHand[1];

            const firstHtml = first ? this.cardHtml(first, animateLast && this.dealerHand.length === 1) : '';
            
            let secondHtml = '';
            if (second) {
                if (this.peeked || window.godModeActive) {
                    secondHtml = this.cardHtml(second, false, true); 
                } else {
                    secondHtml = this.cardHtml(null, animateLast && this.dealerHand.length === 2);
                }
            }

            this.elDealerCards.innerHTML = firstHtml + secondHtml;
            
            if (first && second && (this.peeked || window.godModeActive)) {
                this.elDealerScore.textContent = `(${this.handValue([first, second])}) (Matrix Peek)`;
            } else {
                this.elDealerScore.textContent = first ? `(${this.handValue([first])})` : '';
            }
        }

        this.elBankroll.textContent = `$${this.bankroll}`;
        this.elWinsCount.textContent = `(${this.winsForCharge}/3 wins)`;

        const betValue = this.gameState === 'BETTING' ? this.currentBet : this.currentBet || this.activeBetChips.reduce((a,b)=>a+b, 0);

        if (this.gameState === 'BETTING') {
            this.betControls.style.display = 'flex';
            
            if (this.currentBet > 0) {
                this.currentBetDisplay.style.display = 'inline-flex';
                this.elBetValue.textContent = `$${this.currentBet}`;
                this.btnDeal.disabled = false;
                this.btnClear.disabled = false;
            } else {
                this.currentBetDisplay.style.display = 'none';
                this.btnDeal.disabled = true;
                this.btnClear.disabled = true;
            }

            this.container.querySelectorAll('.bj-bet-btn').forEach(btn => {
                const amt = parseInt(btn.getAttribute('data-amount'));
                btn.disabled = this.bankroll < amt;
            });
        } else {
            this.betControls.style.display = 'none';
            
            if (this.activeBetChips.length > 0) {
                this.currentBetDisplay.style.display = 'inline-flex';
                this.elBetValue.textContent = `$${betValue}`;
            } else {
                this.currentBetDisplay.style.display = 'none';
            }
        }

        // Toggle actions and Deal buttons based on state
        if (this.gameState === 'BETTING') {
            this.btnHit.style.display = 'none';
            this.btnStand.style.display = 'none';
            this.btnDeal.style.display = 'inline-block';
        } else if (this.gameState === 'PLAYING') {
            this.btnHit.style.display = 'inline-block';
            this.btnStand.style.display = 'inline-block';
            this.btnDeal.style.display = 'none';
            this.btnHit.disabled = false;
            this.btnStand.disabled = false;
        } else {
            // Dealing / Resolved
            this.btnHit.style.display = 'inline-block';
            this.btnStand.style.display = 'inline-block';
            this.btnDeal.style.display = 'none';
            this.btnHit.disabled = true;
            this.btnStand.disabled = true;
        }

        this.updateHacksUI();
    }

    updateHacksUI() {
        const cellsContainer = this.container.querySelector('#bjEnergyCells');
        if (cellsContainer) {
            cellsContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const cell = document.createElement('div');
                cell.className = `bj-energy-cell ${i < this.charges ? 'active' : ''}`;
                cellsContainer.appendChild(cell);
            }
        }

        const isPlaying = this.gameState === 'PLAYING';
        if (this.btnPeek) {
            this.btnPeek.disabled = !isPlaying || this.charges < 1 || this.peeked;
        }
        if (this.btnGlitch) {
            this.btnGlitch.disabled = !isPlaying || this.charges < 1 || this.playerHand.length < 2;
        }
    }

    cardHtml(c, isNew = false, isPeeked = false) {
        if (!c) {
            return `
                <div class="bj-card bj-card-back ${isNew ? 'deal-animate' : ''}">
                    <div class="bj-card-back-pattern"></div>
                </div>
            `;
        }

        let suitName = '';
        let suitColor = '';
        let glowColor = '';
        
        if (c.s === 'hearts') { suitName = 'hearts'; suitColor = '#fb7185'; glowColor = 'rgba(251, 113, 133, 0.45)'; }
        else if (c.s === 'diamonds') { suitName = 'diamonds'; suitColor = '#fb923c'; glowColor = 'rgba(251, 146, 60, 0.45)'; }
        else if (c.s === 'spades') { suitName = 'spades'; suitColor = '#38bdf8'; glowColor = 'rgba(56, 189, 248, 0.45)'; }
        else if (c.s === 'clubs') { suitName = 'clubs'; suitColor = '#4ade80'; glowColor = 'rgba(74, 222, 128, 0.45)'; }

        if (isPeeked) {
            suitColor = '#2dd4bf';
            glowColor = 'rgba(45, 212, 191, 0.5)';
            suitName += ' hacked-card';
        }

        const cornerSuitIcon = cardSuitIcon(c.s);
        const centerSuitIcon = cardSuitIcon(c.s, `${suitName} suit`);

        return `
            <div class="bj-card ${suitName} ${isNew ? 'deal-animate' : ''}" style="--suit-color: ${suitColor}; --suit-glow: ${glowColor}">
                <div class="bj-card-corner top-left">
                    <span class="rank">${c.r}</span>
                    <span class="suit">${cornerSuitIcon}</span>
                </div>
                <div class="bj-card-center-suit">${centerSuitIcon}</div>
                <div class="bj-card-corner bottom-right">
                    <span class="rank">${c.r}</span>
                    <span class="suit">${cornerSuitIcon}</span>
                </div>
                ${isPeeked ? '<div class="bj-card-peek-scan"></div>' : ''}
            </div>
        `;
    }

    buildDeck() {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        const deck = [];
        for (const s of suits) for (const r of ranks) deck.push({ r, s });
        
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    handValue(hand) {
        let total = 0;
        let aces = 0;
        for (const c of hand) {
            const v = (c.r === 'A') ? 11 : (['K','Q','J'].includes(c.r) ? 10 : parseInt(c.r));
            total += v;
            if (c.r === 'A') aces++;
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

    stop() {
        if (this.effectsAnimId) cancelAnimationFrame(this.effectsAnimId);
        window.removeEventListener('keydown', this.handleKeyDown);
        this.container.removeEventListener('click', this.handleTableClick);
    }
}
