/**
 * 记忆翻牌游戏 - Memory Match
 */

class MemoryGame {
    constructor() {
        this.cards = [];
        this.flipped = [];
        this.matched = new Set();
        this.moves = 0;
        this.locked = false;
        this.emojis = ['🍎', '🍋', '🍇', '🍒', '🌸', '🌻', '🐶', '🐱'];

        this.boardEl = document.getElementById('memBoard');

        document.getElementById('memNewGame').addEventListener('click', () => this.newGame());
        this.newGame();
    }

    newGame() {
        const pairs = [...this.emojis, ...this.emojis];
        this.shuffle(pairs);
        this.cards = pairs;
        this.flipped = [];
        this.matched = new Set();
        this.moves = 0;
        this.locked = false;
        this.updateUI();
        this.render();
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    handleClick(index) {
        if (this.locked) return;
        if (this.matched.has(index)) return;
        if (this.flipped.includes(index)) return;
        if (this.flipped.length >= 2) return;

        this.flipped.push(index);
        this.render();

        if (this.flipped.length === 2) {
            this.moves++;
            this.locked = true;
            const [a, b] = this.flipped;

            if (this.cards[a] === this.cards[b]) {
                this.matched.add(a);
                this.matched.add(b);
                this.flipped = [];
                this.locked = false;
                this.updateUI();
                this.render();

                if (this.matched.size === this.cards.length) {
                    setTimeout(() => alert(`🎉 恭喜你赢了！\n总步数: ${this.moves}`), 300);
                }
            } else {
                setTimeout(() => {
                    this.flipped = [];
                    this.locked = false;
                    this.render();
                }, 600);
            }
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById('memMoves').textContent = this.moves;
        document.getElementById('memPairs').textContent = this.matched.size / 2;
    }

    render() {
        this.boardEl.innerHTML = '';
        this.cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'mem-card';
            if (this.flipped.includes(index) || this.matched.has(index)) {
                card.classList.add('flipped');
            }
            if (this.matched.has(index)) {
                card.classList.add('matched');
            }

            card.innerHTML = `
                <div class="mem-card-inner">
                    <div class="mem-card-front">❓</div>
                    <div class="mem-card-back">${emoji}</div>
                </div>
            `;
            card.addEventListener('click', () => this.handleClick(index));
            this.boardEl.appendChild(card);
        });
    }
}
