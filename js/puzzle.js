/**
 * 滑块拼图游戏 - Sliding Puzzle (15-Puzzle)
 */

class PuzzleGame {
    constructor() {
        this.size = 4;
        this.tiles = [];
        this.emptyIndex = 15;
        this.moves = 0;

        this.boardEl = document.getElementById('puzBoard');
        this.colors = [
            '#6c5ce7', '#a29bfe', '#fd79a8', '#e17055',
            '#00b894', '#00cec9', '#0984e3', '#6c5ce7',
            '#fdcb6e', '#e17055', '#a29bfe', '#00b894',
            '#fd79a8', '#0984e3', '#fdcb6e', '#636e72'
        ];

        document.getElementById('puzNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('puzShuffle').addEventListener('click', () => this.shuffleBoard());

        this.newGame();
        this.bindKeys();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game-puzzle').classList.contains('active')) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); this.moveFrom(this.emptyIndex + this.size); break;
                case 'ArrowDown': e.preventDefault(); this.moveFrom(this.emptyIndex - this.size); break;
                case 'ArrowLeft': e.preventDefault(); this.moveFrom(this.emptyIndex + 1); break;
                case 'ArrowRight': e.preventDefault(); this.moveFrom(this.emptyIndex - 1); break;
            }
        });
    }

    newGame() {
        this.tiles = Array.from({ length: this.size * this.size - 1 }, (_, i) => i + 1);
        this.tiles.push(0); // 0 = empty
        this.emptyIndex = this.size * this.size - 1;
        this.moves = 0;
        this.render();
        this.updateUI();
    }

    shuffleBoard() {
        // 从解决状态通过合法移动打乱
        this.newGame();
        const numMoves = 200;
        const validMoves = [];
        for (let i = 0; i < numMoves; i++) {
            validMoves.length = 0;
            const row = Math.floor(this.emptyIndex / this.size);
            const col = this.emptyIndex % this.size;
            if (row > 0) validMoves.push(this.emptyIndex - this.size);
            if (row < this.size - 1) validMoves.push(this.emptyIndex + this.size);
            if (col > 0) validMoves.push(this.emptyIndex - 1);
            if (col < this.size - 1) validMoves.push(this.emptyIndex + 1);
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.swap(this.emptyIndex, move);
            this.emptyIndex = move;
        }
        this.moves = 0;
        this.render();
        this.updateUI();
    }

    canMove(index) {
        const row = Math.floor(index / this.size);
        const col = index % this.size;
        const eRow = Math.floor(this.emptyIndex / this.size);
        const eCol = this.emptyIndex % this.size;
        return (Math.abs(row - eRow) + Math.abs(col - eCol)) === 1;
    }

    moveFrom(index) {
        if (index < 0 || index >= this.size * this.size) return;
        if (!this.canMove(index)) return;

        this.swap(index, this.emptyIndex);
        this.emptyIndex = index;
        this.moves++;
        this.render();
        this.updateUI();

        if (this.isSolved()) {
            setTimeout(() => alert(`🎉 恭喜你拼好了！\n总步数: ${this.moves}`), 100);
        }
    }

    swap(a, b) {
        [this.tiles[a], this.tiles[b]] = [this.tiles[b], this.tiles[a]];
    }

    isSolved() {
        for (let i = 0; i < this.size * this.size - 1; i++) {
            if (this.tiles[i] !== i + 1) return false;
        }
        return this.tiles[this.size * this.size - 1] === 0;
    }

    updateUI() {
        document.getElementById('puzMoves').textContent = this.moves;
    }

    render() {
        this.boardEl.innerHTML = '';
        this.tiles.forEach((tile, index) => {
            const cell = document.createElement('div');
            cell.className = 'puz-tile';
            if (tile === 0) {
                cell.classList.add('empty');
            } else {
                cell.textContent = tile;
                cell.style.background = this.colors[tile - 1];
                cell.addEventListener('click', () => this.moveFrom(index));
            }
            this.boardEl.appendChild(cell);
        });
    }
}
