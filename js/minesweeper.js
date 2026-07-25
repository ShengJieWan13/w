/**
 * 扫雷游戏 - Minesweeper
 */

class Minesweeper {
    constructor() {
        this.difficulty = 'easy';
        this.configs = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.minePositions = new Set();
        this.gameOver = false;
        this.timerInterval = null;
        this.seconds = 0;

        this.boardEl = document.getElementById('msBoard');

        document.getElementById('msNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('msDifficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        this.newGame();
    }

    get config() { return this.configs[this.difficulty]; }

    newGame() {
        const { rows, cols, mines } = this.config;
        this.gameOver = false;
        this.seconds = 0;
        this.board = Array(rows).fill(null).map(() => Array(cols).fill(0));
        this.revealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
        this.flagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
        this.minePositions = new Set();

        // 随机布雷
        const positions = [];
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                positions.push([r, c]);
        this.shuffle(positions);
        for (let i = 0; i < mines; i++) {
            const [r, c] = positions[i];
            this.minePositions.add(`${r},${c}`);
            this.board[r][c] = -1;
        }

        // 计算数字
        for (const key of this.minePositions) {
            const [mr, mc] = key.split(',').map(Number);
            for (const [nr, nc] of this.getNeighbors(mr, mc)) {
                if (this.board[nr][nc] !== -1) this.board[nr][nc]++;
            }
        }

        this.updateUI();
        this.startTimer();
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    getNeighbors(row, col) {
        const { rows, cols } = this.config;
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    neighbors.push([nr, nc]);
                }
            }
        }
        return neighbors;
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.seconds = 0;
        document.getElementById('msTimer').textContent = '0';
        this.timerInterval = setInterval(() => {
            if (!this.gameOver && this.revealed.some(r => r.some(c => c))) {
                this.seconds++;
                document.getElementById('msTimer').textContent = this.seconds;
            }
        }, 1000);
    }

    handleClick(row, col, isRightClick) {
        if (this.gameOver) return;

        if (isRightClick) {
            if (!this.revealed[row][col]) {
                this.flagged[row][col] = !this.flagged[row][col];
                this.updateUI();
            }
            return;
        }

        if (this.flagged[row][col]) return;
        if (this.revealed[row][col]) return;

        // 第一次点击不能是地雷 —— 如果点到雷，重新布雷
        if (this.minePositions.has(`${row},${col}`) && !this.revealed.some(r => r.some(c => c))) {
            this.moveMine(row, col);
        }

        if (this.minePositions.has(`${row},${col}`)) {
            this.revealAll();
            this.gameOver = true;
            clearInterval(this.timerInterval);
            this.updateUI();
            setTimeout(() => alert('💥 踩雷了！游戏结束'), 100);
            return;
        }

        this.floodFill(row, col);
        this.updateUI();

        if (this.checkWin()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
            this.updateUI();
            setTimeout(() => alert(`🎉 恭喜你赢了！\n用时: ${this.seconds} 秒`), 100);
        }
    }

    moveMine(row, col) {
        const { rows, cols } = this.config;
        this.minePositions.delete(`${row},${col}`);
        this.board[row][col] = 0;
        // 重新计算周围数字
        for (const [nr, nc] of this.getNeighbors(row, col)) {
            if (this.board[nr][nc] === -1) continue;
            this.board[nr][nc] = 0;
            for (const [nnr, nnc] of this.getNeighbors(nr, nc)) {
                if (this.minePositions.has(`${nnr},${nnc}`)) this.board[nr][nc]++;
            }
        }
        // 找一个新的空位放雷
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!this.minePositions.has(`${r},${c}`) && this.board[r][c] !== -1 &&
                    !(r === row && c === col)) {
                    this.minePositions.add(`${r},${c}`);
                    this.board[r][c] = -1;
                    for (const [nr, nc] of this.getNeighbors(r, c)) {
                        if (this.board[nr][nc] !== -1) this.board[nr][nc]++;
                    }
                    return;
                }
            }
        }
    }

    floodFill(row, col) {
        const { rows, cols } = this.config;
        if (row < 0 || row >= rows || col < 0 || col >= cols) return;
        if (this.revealed[row][col]) return;
        if (this.flagged[row][col]) return;

        this.revealed[row][col] = true;

        if (this.board[row][col] === 0) {
            for (const [nr, nc] of this.getNeighbors(row, col)) {
                if (!this.revealed[nr][nc] && this.board[nr][nc] !== -1) {
                    this.floodFill(nr, nc);
                }
            }
        }
    }

    revealAll() {
        const { rows, cols } = this.config;
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                if (this.minePositions.has(`${r},${c}`))
                    this.revealed[r][c] = true;
    }

    checkWin() {
        const { rows, cols } = this.config;
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                if (!this.revealed[r][c] && !this.minePositions.has(`${r},${c}`))
                    return false;
        return true;
    }

    updateUI() {
        const { rows, cols, mines } = this.config;
        const flaggedCount = this.flagged.flat().filter(Boolean).length;
        document.getElementById('msMinesLeft').textContent = mines - flaggedCount;

        this.boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
        this.boardEl.innerHTML = '';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';

                if (this.revealed[r][c]) {
                    cell.classList.add('revealed');
                    if (this.minePositions.has(`${r},${c}`)) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[r][c] > 0) {
                        cell.textContent = this.board[r][c];
                        cell.setAttribute('data-count', this.board[r][c]);
                    }
                } else if (this.flagged[r][c]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                const rIdx = r, cIdx = c;
                cell.addEventListener('click', () => this.handleClick(rIdx, cIdx, false));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleClick(rIdx, cIdx, true);
                });
                this.boardEl.appendChild(cell);
            }
        }
    }
}
