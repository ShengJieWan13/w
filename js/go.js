/**
 * 围棋游戏 - Go (简化版 9x9)
 * 规则：吃子、打劫、弃权、计数
 */

class GoGame {
    constructor() {
        this.size = 9;
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.currentPlayer = 1; // 1=黑, 2=白
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.koPoint = null;

        this.canvas = document.getElementById('goBoard');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 60;
        this.padding = 40;

        document.getElementById('goNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('goPass').addEventListener('click', () => this.pass());

        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.newGame();
    }

    newGame() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.currentPlayer = 1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.koPoint = null;
        this.updateUI();
        this.draw();
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scale;
        const y = (e.clientY - rect.top) * scale;

        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);

        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return;
        if (this.board[row][col] !== 0) return;

        // 检查打劫
        if (this.koPoint && this.koPoint.row === row && this.koPoint.col === col) return;

        // 临时落子
        this.board[row][col] = this.currentPlayer;

        // 检查是否提对方子
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        let capturedAny = false;
        this.koPoint = null;

        // 检查四个相邻对方棋子
        const neighbors = this.getNeighbors(row, col);
        for (const [nr, nc] of neighbors) {
            if (this.board[nr][nc] === opponent) {
                const group = this.getGroup(nr, nc);
                if (this.countLiberties(group) === 0) {
                    capturedAny = true;
                    for (const [gr, gc] of group) {
                        this.board[gr][gc] = 0;
                        this.captures[this.currentPlayer]++;
                    }
                    // 如果刚好提了一颗子，记录下来作为可能的打劫点
                    if (group.length === 1) {
                        this.koPoint = { row: group[0][0], col: group[0][1] };
                    }
                }
            }
        }

        // 检查自杀
        const myGroup = this.getGroup(row, col);
        if (this.countLiberties(myGroup) === 0 && !capturedAny) {
            this.board[row][col] = 0;
            return; // 无效落子
        }

        // 如果提了多颗子，清除打劫
        if (!capturedAny || this.countLiberties(this.getGroup(row, col)) !== 1) {
            this.koPoint = null;
        } else {
            // 检查打劫：如果提了一颗子，自己只有一口气，且那个气就是被提子的位置
            if (this.koPoint && this.countLiberties(myGroup) === 1) {
                const liberties = this.getLiberties(myGroup);
                if (liberties.length === 1) {
                    const [lr, lc] = liberties[0];
                    if (lr === this.koPoint.row && lc === this.koPoint.col) {
                        // 确实打劫
                    } else {
                        this.koPoint = null;
                    }
                }
            }
        }

        this.passes = 0;
        this.currentPlayer = opponent;
        this.updateUI();
        this.draw();
    }

    getGroup(row, col) {
        const color = this.board[row][col];
        const group = [];
        const visited = new Set();
        const stack = [[row, col]];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([r, c]);

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                if (this.board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return group;
    }

    countLiberties(group) {
        return this.getLiberties(group).length;
    }

    getLiberties(group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(r, c)) {
                if (this.board[nr][nc] === 0) {
                    liberties.add(`${nr},${nc}`);
                }
            }
        }
        return [...liberties].map(s => s.split(',').map(Number));
    }

    getNeighbors(row, col) {
        const neighbors = [];
        if (row > 0) neighbors.push([row - 1, col]);
        if (row < this.size - 1) neighbors.push([row + 1, col]);
        if (col > 0) neighbors.push([row, col - 1]);
        if (col < this.size - 1) neighbors.push([row, col + 1]);
        return neighbors;
    }

    pass() {
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateUI();
            this.draw();
        }
    }

    endGame() {
        // 简单计分：按提子数
        const blackScore = this.captures[1];
        const whiteScore = this.captures[2] + 6.5; // 贴目
        let msg;
        if (blackScore > whiteScore) {
            msg = `🏆 黑方胜！\n捕获: 黑 ${this.captures[1]} vs 白 ${this.captures[2]}\n白方贴目 6.5 目`;
        } else if (whiteScore > blackScore) {
            msg = `🏆 白方胜！\n捕获: 黑 ${this.captures[1]} vs 白 ${this.captures[2]}\n白方贴目 6.5 目`;
        } else {
            msg = `🤝 平局！\n捕获: 黑 ${this.captures[1]} vs 白 ${this.captures[2]}`;
        }
        setTimeout(() => alert(msg), 100);
        this.newGame();
    }

    updateUI() {
        const turnEl = document.getElementById('goTurn');
        turnEl.textContent = this.currentPlayer === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
        document.getElementById('goScore').textContent =
            `黑 ${this.captures[1]} : ${this.captures[2]} 白`;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 背景
        ctx.fillStyle = '#dcb468';
        ctx.fillRect(0, 0, w, h);

        // 网格线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.size; i++) {
            const pos = this.padding + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(this.padding, pos);
            ctx.lineTo(this.padding + (this.size - 1) * this.cellSize, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, this.padding);
            ctx.lineTo(pos, this.padding + (this.size - 1) * this.cellSize);
            ctx.stroke();
        }

        // 星位点
        const starPoints = this.size === 9 ? [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]] : [];
        for (const [r, c] of starPoints) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.padding + c * this.cellSize, this.padding + r * this.cellSize, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 棋子
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) continue;
                const x = this.padding + c * this.cellSize;
                const y = this.padding + r * this.cellSize;
                const radius = this.cellSize * 0.44;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);

                if (this.board[r][c] === 1) {
                    // 黑子
                    const gradient = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    gradient.addColorStop(0, '#555');
                    gradient.addColorStop(1, '#111');
                    ctx.fillStyle = gradient;
                } else {
                    // 白子
                    const gradient = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    gradient.addColorStop(0, '#fff');
                    gradient.addColorStop(1, '#ccc');
                    ctx.fillStyle = gradient;
                }
                ctx.fill();
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // 最后一手标记
        if (this.passes === 0) {
            // 简单标记最后落子位置在光标处
        }
    }
}
