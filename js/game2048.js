/**
 * 2048 游戏
 */

class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.best = parseInt(localStorage.getItem('2048_best') || '0');

        this.boardEl = document.getElementById('tfeBoard');
        this.scoreEl = document.getElementById('tfeScore');
        this.bestEl = document.getElementById('tfeBest');

        document.getElementById('tfeNewGame').addEventListener('click', () => this.newGame());
        this.bindKeys();
        this.newGame();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game-2048').classList.contains('active')) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); this.move('up'); break;
                case 'ArrowDown': e.preventDefault(); this.move('down'); break;
                case 'ArrowLeft': e.preventDefault(); this.move('left'); break;
                case 'ArrowRight': e.preventDefault(); this.move('right'); break;
            }
        });

        // 触摸支持
        let touchStartX = 0, touchStartY = 0;
        this.boardEl.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.boardEl.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.move(dx > 0 ? 'right' : 'left');
            } else {
                this.move(dy > 0 ? 'down' : 'up');
            }
        });
    }

    newGame() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateUI();
    }

    addRandomTile() {
        const empty = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) empty.push([r, c]);
            }
        }
        if (empty.length === 0) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    move(direction) {
        const oldGrid = this.grid.map(row => [...row]);
        this.grid = this.rotateForMove(direction);

        let moved = false;
        for (let r = 0; r < this.size; r++) {
            const { row, score, didMove } = this.mergeRow(this.grid[r]);
            this.grid[r] = row;
            this.score += score;
            if (didMove) moved = true;
        }

        this.grid = this.unrotateForMove(direction);

        if (moved) {
            this.addRandomTile();
            this.updateUI();
            if (this.isGameOver()) {
                setTimeout(() => alert('游戏结束！点击"新游戏"重新开始'), 200);
            }
        }
    }

    mergeRow(row) {
        let arr = row.filter(v => v !== 0);
        let score = 0;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                score += arr[i];
                arr.splice(i + 1, 1);
            }
        }
        const newRow = arr.concat(Array(this.size - arr.length).fill(0));
        const didMove = row.some((v, i) => v !== newRow[i]);
        return { row: newRow, score, didMove };
    }

    rotateForMove(dir) {
        let grid = this.grid.map(r => [...r]);
        if (dir === 'left') return grid;
        if (dir === 'right') return grid.map(r => r.slice().reverse());
        if (dir === 'up') {
            const rotated = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
            for (let r = 0; r < this.size; r++)
                for (let c = 0; c < this.size; c++)
                    rotated[c][r] = grid[r][c];
            return rotated;
        }
        if (dir === 'down') {
            const rotated = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
            for (let r = 0; r < this.size; r++)
                for (let c = 0; c < this.size; c++)
                    rotated[this.size - 1 - c][r] = grid[r][c];
            return rotated;
        }
        return grid;
    }

    unrotateForMove(dir) {
        let grid = this.grid.map(r => [...r]);
        if (dir === 'left') return grid;
        if (dir === 'right') return grid.map(r => r.slice().reverse());
        if (dir === 'up') {
            const rotated = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
            for (let r = 0; r < this.size; r++)
                for (let c = 0; c < this.size; c++)
                    rotated[c][r] = grid[r][c];
            return rotated;
        }
        if (dir === 'down') {
            const rotated = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
            for (let r = 0; r < this.size; r++)
                for (let c = 0; c < this.size; c++)
                    rotated[c][this.size - 1 - r] = grid[r][c];
            return rotated;
        }
        return grid;
    }

    isGameOver() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
                if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return false;
                if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return false;
            }
        }
        return true;
    }

    updateUI() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'tfe-cell';
                const val = this.grid[r][c];
                cell.textContent = val || '';
                if (val > 0) cell.setAttribute('data-value', val);
                this.boardEl.appendChild(cell);
            }
        }
        this.scoreEl.textContent = this.score;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('2048_best', this.best);
        }
        this.bestEl.textContent = this.best;
    }
}
