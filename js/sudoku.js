/**
 * 数独游戏 - Sudoku
 */

class SudokuGame {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.given = Array(9).fill(null).map(() => Array(9).fill(false));
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.difficulty = 'medium';

        this.boardEl = document.getElementById('sudokuBoard');
        this.numpadEl = document.getElementById('sudokuNumpad');

        document.getElementById('sudokuNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('sudokuHint').addEventListener('click', () => this.giveHint());
        document.getElementById('sudokuDifficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        this.buildNumpad();
        this.newGame();
        this.bindKeys();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game-sudoku').classList.contains('active')) return;
            if (this.selectedRow === -1) return;

            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                this.placeNumber(num);
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.placeNumber(0);
            } else if (e.key === 'ArrowUp' && this.selectedRow > 0) {
                this.selectCell(this.selectedRow - 1, this.selectedCol);
            } else if (e.key === 'ArrowDown' && this.selectedRow < 8) {
                this.selectCell(this.selectedRow + 1, this.selectedCol);
            } else if (e.key === 'ArrowLeft' && this.selectedCol > 0) {
                this.selectCell(this.selectedRow, this.selectedCol - 1);
            } else if (e.key === 'ArrowRight' && this.selectedCol < 8) {
                this.selectCell(this.selectedRow, this.selectedCol + 1);
            }
        });
    }

    buildNumpad() {
        this.numpadEl.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'numpad-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => this.placeNumber(i));
            this.numpadEl.appendChild(btn);
        }
        const eraseBtn = document.createElement('button');
        eraseBtn.className = 'numpad-btn erase';
        eraseBtn.textContent = '✕ 清除';
        eraseBtn.addEventListener('click', () => this.placeNumber(0));
        this.numpadEl.appendChild(eraseBtn);
    }

    generatePuzzle() {
        // 生成完整解
        this.fillSolution();
        this.solution = this.board.map(row => [...row]);

        // 根据难度移除数字
        const cellsToRemove = { easy: 36, medium: 46, hard: 54 }[this.difficulty];

        // 重置 given 标记
        this.given = Array(9).fill(null).map(() => Array(9).fill(true));

        const positions = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                positions.push([r, c]);
            }
        }
        this.shuffle(positions);

        for (let i = 0; i < cellsToRemove; i++) {
            const [r, c] = positions[i];
            this.board[r][c] = 0;
            this.given[r][c] = false;
        }
    }

    fillSolution() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solve(this.board);
    }

    solve(grid) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    this.shuffle(nums);
                    for (const num of nums) {
                        if (this.isValid(grid, r, c, num)) {
                            grid[r][c] = num;
                            if (this.solve(grid)) return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num) return false;
            if (grid[i][col] === num) return false;
        }
        const boxR = Math.floor(row / 3) * 3;
        const boxC = Math.floor(col / 3) * 3;
        for (let r = boxR; r < boxR + 3; r++) {
            for (let c = boxC; c < boxC + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        return true;
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    placeNumber(num) {
        if (this.selectedRow === -1) return;
        if (this.given[this.selectedRow][this.selectedCol]) return;

        this.board[this.selectedRow][this.selectedCol] = num;
        this.render();

        if (this.isComplete()) {
            setTimeout(() => alert('🎉 恭喜！你完成了这个数独！'), 100);
        }
    }

    isComplete() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0) return false;
                if (this.board[r][c] !== this.solution[r][c]) return false;
            }
        }
        return true;
    }

    selectCell(row, col) {
        this.selectedRow = row;
        this.selectedCol = col;
        this.render();
    }

    giveHint() {
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) {
                    emptyCells.push([r, c]);
                }
            }
        }
        if (emptyCells.length === 0) return;

        const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[r][c] = this.solution[r][c];
        this.given[r][c] = true;

        this.render();
        const idx = r * 9 + c;
        const cell = this.boardEl.children[idx];
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 600);
        }

        if (this.isComplete()) {
            setTimeout(() => alert('🎉 恭喜！你完成了这个数独！'), 100);
        }
    }

    newGame() {
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.generatePuzzle();
        this.render();
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                if (this.given[r][c]) {
                    cell.classList.add('given');
                }
                if (this.board[r][c] !== 0 && !this.given[r][c] && this.board[r][c] !== this.solution[r][c]) {
                    cell.classList.add('error');
                }
                if (r === this.selectedRow && c === this.selectedCol) {
                    cell.classList.add('selected');
                }
                if (this.selectedRow !== -1 && this.board[r][c] !== 0 &&
                    this.board[r][c] === this.board[this.selectedRow]?.[this.selectedCol] &&
                    !(r === this.selectedRow && c === this.selectedCol)) {
                    cell.classList.add('same-number');
                }
                cell.textContent = this.board[r][c] || '';
                cell.addEventListener('click', () => this.selectCell(r, c));
                this.boardEl.appendChild(cell);
            }
        }
    }
}
