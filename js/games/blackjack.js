
export class BlackjackGame {
    constructor(container) {
        this.container = container;
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;

        // Build UI structure
        this.container.innerHTML = `
            <div class="blackjack-table">
                <div class="bj-row">
                    <h3>Dealer <span id="bjDealerScore"></span></h3>
                    <div id="bjDealerCards" class="bj-cards"></div>
                </div>
                <div class="bj-row">
                    <h3>You <span id="bjPlayerScore"></span></h3>
                    <div id="bjPlayerCards" class="bj-cards"></div>
                </div>
                <div id="bjMsg" class="os-line" role="status" aria-live="polite" style="min-height: 24px; margin-bottom:10px;"></div>
                <div class="bj-controls">
                    <button id="bjHit" class="btn" style="padding: 10px 20px;">Hit</button>
                    <button id="bjStand" class="btn" style="padding: 10px 20px;">Stand</button>
                    <button id="bjRestart" class="btn" style="display:none; padding: 10px 20px;">Play Again</button>
                </div>
            </div>
        `;

        this.elDealerCards = container.querySelector('#bjDealerCards');
        this.elPlayerCards = container.querySelector('#bjPlayerCards');
        this.elDealerScore = container.querySelector('#bjDealerScore');
        this.elPlayerScore = container.querySelector('#bjPlayerScore');
        this.elMsg = container.querySelector('#bjMsg');
        this.btnHit = container.querySelector('#bjHit');
        this.btnStand = container.querySelector('#bjStand');
        this.btnRestart = container.querySelector('#bjRestart');

        this.btnHit.onclick = () => this.hit();
        this.btnStand.onclick = () => this.stand();
        this.btnRestart.onclick = () => this.start();
    }

    start() {
        this.deck = this.buildDeck();
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        this.gameOver = false;

        this.btnHit.style.display = 'inline-block';
        this.btnStand.style.display = 'inline-block';
        this.btnRestart.style.display = 'none';
        this.elMsg.textContent = '';
        this.elMsg.className = 'os-line';

        this.render(false);

        if (this.handValue(this.playerHand) === 21) {
            this.end("Blackjack! You win.", "os-ok");
        }
    }

    hit() {
        if (this.gameOver) return;
        this.playerHand.push(this.deck.pop());
        const val = this.handValue(this.playerHand);
        this.render(false);

        if (val > 21) {
            this.end("Bust! Dealer wins.", "os-bad");
        } else if (val === 21) {
            this.stand();
        }
    }

    stand() {
        if (this.gameOver) return;

        while (this.handValue(this.dealerHand) < 17) {
            this.dealerHand.push(this.deck.pop());
        }

        const p = this.handValue(this.playerHand);
        const d = this.handValue(this.dealerHand);

        this.render(true);

        if (d > 21) return this.end("Dealer bust. You win!", "os-ok");
        if (p > d) return this.end("You win!", "os-ok");
        if (p < d) return this.end("Dealer wins.", "os-bad");
        return this.end("Push. Draw.", "os-warn");
    }

    end(msg, cls) {
        this.gameOver = true;
        this.elMsg.textContent = msg;
        this.elMsg.className = 'os-line ' + cls;
        this.btnHit.style.display = 'none';
        this.btnStand.style.display = 'none';
        this.btnRestart.style.display = 'inline-block';
        this.render(true);
    }

    render(revealDealer) {
        this.elPlayerCards.innerHTML = this.playerHand.map(c => this.cardHtml(c)).join('');
        this.elPlayerScore.textContent = `(${this.handValue(this.playerHand)})`;

        if (revealDealer) {
            this.elDealerCards.innerHTML = this.dealerHand.map(c => this.cardHtml(c)).join('');
            this.elDealerScore.textContent = `(${this.handValue(this.dealerHand)})`;
        } else {
            // Show first card, hide second
            const first = this.dealerHand[0];
            this.elDealerCards.innerHTML = this.cardHtml(first) + `<div class="bj-card" style="background:#2dd4bf; border:1px solid #fff;">?</div>`;
            this.elDealerScore.textContent = `(?)`;
        }
    }

    cardHtml(c) {
        const color = (c.s === '♥' || c.s === '♦') ? 'red' : 'black';
        return `<div class="bj-card" style="color:${color}">${c.r}${c.s}</div>`;
    }

    buildDeck() {
        const suits = ['♠','♥','♦','♣'];
        const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        const deck = [];
        for (const s of suits) for (const r of ranks) deck.push({ r, s });
        // Fisher-Yates shuffle
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
}
