/**
 * 围棋游戏 - Go（增强版）
 * 功能：残局练习、AI 对战（Monte Carlo）、胜率显示、AI 提示、双人对弈
 */

// ==================== 残局题库（答案位置均空白） ====================
const TSUMEKO_PROBLEMS = [
    {
        name: '第1题：双打吃',
        desc: '黑先，一步同时打吃两块白棋',
        size: 9, color: 1,
        setup: {
            black: [[3,2],[3,4],[4,3],[5,2],[5,5]],
            white: [[3,3],[4,2],[4,5],[5,3],[5,4]]
        },
        answer: [4, 4]
    },
    {
        name: '第2题：征子',
        desc: '黑先，用征子（扭羊头）吃白棋',
        size: 9, color: 1,
        setup: {
            black: [[3,3],[4,4],[5,2],[5,5]],
            white: [[3,4],[4,3],[4,5],[5,4]]
        },
        answer: [3, 5]
    },
    {
        name: '第3题：做活',
        desc: '黑先，做两只眼活棋',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,5],[3,2],[3,4],[3,5],[4,3]],
            white: [[1,2],[1,5],[2,1],[2,6],[3,1],[3,6],[4,2],[4,4],[4,5]]
        },
        answer: [2, 3]
    },
    {
        name: '第4题：扑杀',
        desc: '黑先，扑进去缩小白棋眼位将其杀死',
        size: 9, color: 1,
        setup: {
            black: [[1,3],[2,1],[2,5],[3,2],[3,4],[4,3]],
            white: [[2,2],[2,3],[2,4],[3,3]]
        },
        answer: [1, 2]
    },
    {
        name: '第5题：接不归',
        desc: '黑先，利用接不归吃掉白子',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,4],[3,1],[3,3],[4,2]],
            white: [[2,3],[3,2],[4,1],[4,3]]
        },
        answer: [2, 1]
    },
    {
        name: '第6题：倒扑',
        desc: '黑先，故意送一子然后倒扑吃白',
        size: 9, color: 1,
        setup: {
            black: [[1,2],[2,1],[2,4],[3,3],[4,2]],
            white: [[2,2],[2,3],[3,2],[3,4],[4,3]]
        },
        answer: [1, 3]
    },
    {
        name: '第7题：枷吃',
        desc: '黑先，用枷吃（虚枷）吃掉白棋',
        size: 9, color: 1,
        setup: {
            black: [[3,1],[3,5],[4,3],[5,2],[5,4]],
            white: [[3,3],[4,2],[4,4]]
        },
        answer: [3, 2]
    },
    {
        name: '第8题：角部做活',
        desc: '黑先，在角上做活',
        size: 9, color: 1,
        setup: {
            black: [[0,1],[1,0],[1,2],[2,1]],
            white: [[0,0],[0,2],[1,1],[2,0]]
        },
        answer: [2, 2]
    },
    {
        name: '第9题：边上对杀',
        desc: '黑先，在边上对杀快一气取胜',
        size: 9, color: 1,
        setup: {
            black: [[2,1],[3,0],[3,2],[4,1]],
            white: [[2,0],[2,2],[3,1]]
        },
        answer: [1, 1]
    },
    {
        name: '第10题：劫争',
        desc: '黑先，制造劫争吃掉白角',
        size: 9, color: 1,
        setup: {
            black: [[0,2],[1,1],[1,3],[2,0],[2,4],[3,1],[3,3]],
            white: [[1,0],[1,2],[2,1],[2,2],[2,3],[3,2]]
        },
        answer: [0, 1]
    },
    {
        name: '第11题：滚打包收',
        desc: '黑先，滚打包收吃白棋',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,4],[3,1],[3,5],[4,3]],
            white: [[2,3],[3,2],[3,3],[3,4],[4,2],[4,4]]
        },
        answer: [4, 1]
    },
    {
        name: '第12题：金鸡独立',
        desc: '黑先，利用金鸡独立杀白',
        size: 9, color: 1,
        setup: {
            black: [[1,2],[2,1],[2,4],[3,3],[4,2]],
            white: [[1,3],[2,2],[2,3],[3,1],[3,2],[4,1]]
        },
        answer: [1, 1]
    }
];

// ==================== 通用围棋棋盘类 ====================
class GoBoard {
    constructor(canvasId, size, cellSize, padding) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.size = size;
        this.cellSize = cellSize;
        this.padding = padding;
        this.board = Array(size).fill(null).map(() => Array(size).fill(0));
        this.lastMove = null;
        this.highlights = [];
        this.marks = [];
        this.territoryHints = [];
    }

    resizeCanvas() {
        const total = this.padding * 2 + (this.size - 1) * this.cellSize;
        this.canvas.width = total;
        this.canvas.height = total;
    }

    getIntersection(ex, ey) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        const x = (ex - rect.left) * scale;
        const y = (ey - rect.top) * scale;
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        return [row, col];
    }

    draw(extra = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 棋盘背景
        ctx.fillStyle = '#dcb468';
        ctx.fillRect(0, 0, w, h);

        // 网格线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.8;
        const p = this.padding;
        const end = p + (this.size - 1) * this.cellSize;
        for (let i = 0; i < this.size; i++) {
            const pos = p + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(p, pos);
            ctx.lineTo(end, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, p);
            ctx.lineTo(pos, end);
            ctx.stroke();
        }

        // 星位点
        const stars = this.getStarPoints();
        for (const [r, c] of stars) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(p + c * this.cellSize, p + r * this.cellSize, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 坐标标注
        ctx.fillStyle = '#555';
        ctx.font = `${Math.max(10, this.cellSize * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelOffset = this.cellSize * 0.35;
        const letters = this.size <= 13 ? 'ABCDEFGHIJKLMNOPQRS'.slice(0, this.size) : '';
        if (letters) {
            for (let i = 0; i < this.size; i++) {
                ctx.fillText(letters[i], p + i * this.cellSize, p - labelOffset);
                ctx.fillText(String(this.size - i), p - labelOffset, p + i * this.cellSize);
            }
        }

        // 领土提示（半透明色块）
        for (const [r, c, color] of this.territoryHints) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            ctx.fillStyle = color === 1 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)';
            ctx.fillRect(x - this.cellSize * 0.35, y - this.cellSize * 0.35,
                this.cellSize * 0.7, this.cellSize * 0.7);
        }

        // 高亮格子
        for (const [r, c, style] of this.highlights) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            ctx.fillStyle = style || 'rgba(255, 200, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, this.cellSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // 标记（三角、方块等）
        for (const [r, c, type] of this.marks) {
            const x = p + c * this.cellSize;
            const y = p + r * this.cellSize;
            const s = this.cellSize * 0.2;
            ctx.fillStyle = '#c0392b';
            if (type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(x, y - s);
                ctx.lineTo(x - s, y + s * 0.8);
                ctx.lineTo(x + s, y + s * 0.8);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'square') {
                ctx.fillRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
            } else if (type === 'circle') {
                ctx.beginPath();
                ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 棋子
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) continue;
                const x = p + c * this.cellSize;
                const y = p + r * this.cellSize;
                const radius = this.cellSize * 0.44;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                if (this.board[r][c] === 1) {
                    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    grad.addColorStop(0, '#555');
                    grad.addColorStop(1, '#111');
                    ctx.fillStyle = grad;
                } else {
                    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
                    grad.addColorStop(0, '#fff');
                    grad.addColorStop(1, '#ccc');
                    ctx.fillStyle = grad;
                }
                ctx.fill();
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // 最后落子标记
        if (this.lastMove && extra.showLastMove !== false) {
            const [lr, lc] = this.lastMove;
            const x = p + lc * this.cellSize;
            const y = p + lr * this.cellSize;
            const markColor = this.board[lr][lc] === 1 ? '#fff' : '#333';
            ctx.fillStyle = markColor;
            ctx.beginPath();
            ctx.arc(x, y, this.cellSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getStarPoints() {
        if (this.size === 9) return [[2,2],[2,6],[4,4],[6,2],[6,6]];
        if (this.size === 13) return [[3,3],[3,9],[6,6],[9,3],[9,9]];
        if (this.size === 19) return [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];
        if (this.size <= 9) return [[Math.floor(this.size/2), Math.floor(this.size/2)]];
        const q = Math.floor(this.size / 4);
        const m = Math.floor(this.size / 2);
        return [[q,q],[q,this.size-1-q],[m,m],[this.size-1-q,q],[this.size-1-q,this.size-1-q]];
    }
}

// ==================== Go AI（轻量 Monte Carlo） ====================
class GoAI {
    constructor(boardObj) {
        this.boardObj = boardObj;
    }

    getNeighbors(board, row, col) {
        const n = [];
        const size = board.length;
        if (row > 0) n.push([row - 1, col]);
        if (row < size - 1) n.push([row + 1, col]);
        if (col > 0) n.push([row, col - 1]);
        if (col < size - 1) n.push([row, col + 1]);
        return n;
    }

    getGroup(board, row, col) {
        const color = board[row][col];
        if (color === 0) return [];
        const group = [];
        const visited = new Set();
        const stack = [[row, col]];
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = r + ',' + c;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([r, c]);
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === color && !visited.has(nr + ',' + nc)) stack.push([nr, nc]);
            }
        }
        return group;
    }

    countLiberties(board, group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === 0) liberties.add(nr + ',' + nc);
            }
        }
        return liberties.size;
    }

    isSuicide(board, row, col, color) {
        const opponent = color === 1 ? 2 : 1;
        for (const [nr, nc] of this.getNeighbors(board, row, col)) {
            if (board[nr][nc] === opponent) {
                if (this.countLiberties(board, this.getGroup(board, nr, nc)) === 0) return false;
            }
        }
        board[row][col] = color;
        const alive = this.countLiberties(board, this.getGroup(board, row, col)) > 0;
        board[row][col] = 0;
        return !alive;
    }

    hasNearby(board, row, col) {
        for (const [nr, nc] of this.getNeighbors(board, row, col)) {
            if (board[nr][nc] !== 0) return true;
            for (const [nr2, nc2] of this.getNeighbors(board, nr, nc)) {
                if (board[nr2][nc2] !== 0) return true;
            }
        }
        return false;
    }

    // 获取候选落子（只取附近有棋子的空位 + 随机采样）
    getCandidateMoves(board, color, koPoint, maxCandidates) {
        const size = board.length;
        const nearMoves = [];
        const farMoves = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] !== 0) continue;
                if (koPoint && koPoint[0] === r && koPoint[1] === c) continue;
                if (this.hasNearby(board, r, c)) {
                    nearMoves.push([r, c]);
                } else {
                    farMoves.push([r, c]);
                }
            }
        }
        // 洗牌
        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };
        shuffle(nearMoves);
        shuffle(farMoves);
        // 合并：附近棋子优先，限制总数
        let candidates = nearMoves.concat(farMoves);
        const limit = maxCandidates || (size <= 9 ? 30 : 20);
        if (candidates.length > limit) candidates = candidates.slice(0, limit);

        // 过滤自杀
        return candidates.filter(([r, c]) => !this.isSuicide(board, r, c, color));
    }

    // 快速模拟一局（限制步数）
    quickSim(board, startColor, koPoint, maxSteps) {
        const size = board.length;
        let simBoard = board.map(r => [...r]);
        let color = startColor;
        let ko = koPoint ? [koPoint[0], koPoint[1]] : null;
        let passes = 0;
        const steps = maxSteps || Math.min(50, size * 3);

        for (let s = 0; s < steps; s++) {
            // 简单取合法落子（不复制棋盘）
            const legals = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (simBoard[r][c] !== 0) continue;
                    if (ko && ko[0] === r && ko[1] === c) continue;
                    if (this.isSuicide(simBoard, r, c, color)) continue;
                    legals.push([r, c]);
                }
            }
            // 只在附近有棋子的位置中选
            const near = legals.filter(([r, c]) => this.hasNearby(simBoard, r, c));
            const picks = near.length > 0 ? near : legals;

            if (picks.length === 0) {
                passes++;
                if (passes >= 2) break;
                color = color === 1 ? 2 : 1;
                ko = null;
                continue;
            }
            passes = 0;
            const [r, c] = picks[Math.floor(Math.random() * picks.length)];

            // 执行落子 + 提子
            simBoard[r][c] = color;
            const opp = color === 1 ? 2 : 1;
            let newKo = null;
            for (const [nr, nc] of this.getNeighbors(simBoard, r, c)) {
                if (simBoard[nr][nc] === opp) {
                    const grp = this.getGroup(simBoard, nr, nc);
                    if (this.countLiberties(simBoard, grp) === 0) {
                        for (const [gr, gc] of grp) simBoard[gr][gc] = 0;
                        if (grp.length === 1) newKo = [grp[0][0], grp[0][1]];
                    }
                }
            }
            ko = newKo;
            color = opp;
        }

        // 快速计分：只数子
        let bs = 0, ws = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (simBoard[r][c] === 1) bs++;
                else if (simBoard[r][c] === 2) ws++;
            }
        }
        ws += 6.5;
        return bs > ws ? 1 : (ws > bs ? 2 : 0);
    }

    // 评估候选落子
    evaluateMoves(board, color, koPoint, numPlayouts) {
        const candidates = this.getCandidateMoves(board, color, koPoint, 25);
        if (candidates.length === 0) return [];

        const n = numPlayouts || 10;
        const results = [];
        const opponent = color === 1 ? 2 : 1;
        const maxSteps = Math.min(40, board.length * 2);

        for (const [r, c] of candidates) {
            // 应用落子
            const simStart = board.map(row => [...row]);
            simStart[r][c] = color;
            let newKo = null;
            for (const [nr, nc] of this.getNeighbors(simStart, r, c)) {
                if (simStart[nr][nc] === opponent) {
                    const grp = this.getGroup(simStart, nr, nc);
                    if (this.countLiberties(simStart, grp) === 0) {
                        for (const [gr, gc] of grp) simStart[gr][gc] = 0;
                        if (grp.length === 1) newKo = [grp[0][0], grp[0][1]];
                    }
                }
            }

            let wins = 0;
            for (let i = 0; i < n; i++) {
                if (this.quickSim(simStart, opponent, newKo, maxSteps) === color) wins++;
            }
            results.push({ row: r, col: c, winRate: wins / n });
        }
        results.sort((a, b) => b.winRate - a.winRate);
        return results;
    }

    getBestMove(board, color, koPoint, numPlayouts) {
        const ev = this.evaluateMoves(board, color, koPoint, numPlayouts);
        if (ev.length === 0) return null;
        return [ev[0].row, ev[0].col, ev[0].winRate];
    }

    estimateWinRate(board, koPoint, numPlayouts) {
        const n = numPlayouts || 8;
        let blackWins = 0;
        for (let i = 0; i < n; i++) {
            if (this.quickSim(board, 1, koPoint, 30) === 1) blackWins++;
        }
        return { blackRate: blackWins / n, whiteRate: 1 - blackWins / n };
    }
}

// ==================== 残局练习模式 ====================
class GoPractice {
    constructor() {
        this.currentPuzzle = 0;
        this.board = new GoBoard('goPracticeBoard', 9, 60, 40);
        this.board.resizeCanvas();
        this.solved = false;
        this.history = [];

        document.getElementById('goPrevPuzzle').addEventListener('click', () => this.loadPuzzle(this.currentPuzzle - 1));
        document.getElementById('goNextPuzzle').addEventListener('click', () => this.loadPuzzle(this.currentPuzzle + 1));
        document.getElementById('goResetPuzzle').addEventListener('click', () => this.resetPuzzle());
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.loadPuzzle(0);
    }

    loadPuzzle(index) {
        if (index < 0) index = TSUMEKO_PROBLEMS.length - 1;
        if (index >= TSUMEKO_PROBLEMS.length) index = 0;
        this.currentPuzzle = index;
        this.solved = false;
        this.history = [];

        const puzzle = TSUMEKO_PROBLEMS[index];
        this.board.size = puzzle.size;
        this.board.cellSize = 60;
        this.board.padding = 40;
        this.board.resizeCanvas();
        this.board.board = Array(puzzle.size).fill(null).map(() => Array(puzzle.size).fill(0));
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];

        for (const [r, c] of puzzle.setup.black) this.board.board[r][c] = 1;
        for (const [r, c] of puzzle.setup.white) this.board.board[r][c] = 2;

        // 标记关键白子
        this.board.marks = puzzle.setup.white.slice(-2).map(([r, c]) => [r, c, 'triangle']);

        document.getElementById('practiceTitle').textContent = puzzle.name;
        document.getElementById('practiceDesc').textContent = puzzle.desc;
        document.getElementById('practiceResult').textContent = '';
        document.getElementById('practiceResult').className = 'practice-result';

        this.board.draw();
    }

    resetPuzzle() {
        this.loadPuzzle(this.currentPuzzle);
    }

    handleClick(e) {
        if (this.solved) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.board.board[row][col] !== 0) return;

        const puzzle = TSUMEKO_PROBLEMS[this.currentPuzzle];
        const [ar, ac] = puzzle.answer;

        // 临时显示用户落子
        this.board.board[row][col] = puzzle.color;
        this.board.lastMove = [row, col];
        this.board.draw();

        setTimeout(() => {
            if (row === ar && col === ac) {
                this.solved = true;
                document.getElementById('practiceResult').textContent = '✅ 正确！干得漂亮！';
                document.getElementById('practiceResult').className = 'practice-result success';
                this.board.highlights = [[row, col, 'rgba(39, 174, 96, 0.5)']];
            } else {
                document.getElementById('practiceResult').textContent = '❌ 不对，再试试！';
                document.getElementById('practiceResult').className = 'practice-result fail';
                this.board.board[row][col] = 0;
                this.board.lastMove = null;
                this.board.highlights = [[row, col, 'rgba(231, 76, 60, 0.4)']];
                setTimeout(() => { this.board.highlights = []; this.board.draw(); }, 800);
            }
            this.board.draw();
        }, 200);
    }
}

// ==================== AI 对战模式 ====================
class GoAIGame {
    constructor() {
        this.size = 13;
        this.playerColor = 2; // 玩家执白
        this.aiColor = 1;
        this.board = new GoBoard('goAIBoard', this.size, 44, 36);
        this.board.resizeCanvas();
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.koPoint = null;
        this.currentTurn = 1; // 黑先
        this.gameOver = false;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.ai = new GoAI(this.board);
        this.aiThinking = false;
        this.moveHistory = [];

        document.getElementById('goAINewGame').addEventListener('click', () => this.newGame());
        document.getElementById('goAIPass').addEventListener('click', () => this.pass());
        document.getElementById('goAIHint').addEventListener('click', () => this.showHint());
        document.getElementById('goBoardSize').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });
        document.getElementById('goAIColor').addEventListener('change', (e) => {
            this.playerColor = e.target.value === 'black' ? 1 : 2;
            this.aiColor = this.playerColor === 1 ? 2 : 1;
            this.newGame();
        });
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.newGame();
    }

    newGame() {
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.board.board = this.goBoardData;
        this.board.size = this.size;
        this.board.cellSize = this.size <= 9 ? 60 : (this.size <= 13 ? 44 : 30);
        this.board.padding = this.size <= 9 ? 40 : (this.size <= 13 ? 36 : 30);
        this.board.resizeCanvas();
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];
        this.board.territoryHints = [];
        this.koPoint = null;
        this.currentTurn = 1;
        this.gameOver = false;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.moveHistory = [];
        document.getElementById('goHintDisplay').style.display = 'none';
        document.getElementById('goAITurn').textContent = '⚫ AI 思考中...';
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.draw();

        // 如果 AI 执黑，自动下第一步
        if (this.aiColor === 1) {
            setTimeout(() => this.aiMove(), 300);
        }
    }

    handleClick(e) {
        if (this.gameOver) return;
        if (this.aiThinking) return;
        if (this.currentTurn !== this.playerColor) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.goBoardData[row][col] !== 0) return;
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) return;

        // 落子前检查自杀
        this.goBoardData[row][col] = this.playerColor;
        if (this.ai.isSuicide(this.goBoardData, row, col, this.playerColor)) {
            this.goBoardData[row][col] = 0;
            return;
        }

        // 执行提子
        const opponent = this.aiColor;
        let captured = false;
        for (const [nr, nc] of this.ai.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = this.ai.getGroup(this.goBoardData, nr, nc);
                if (this.ai.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.playerColor] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.currentTurn = this.aiColor;
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.board = this.goBoardData;
        this.board.draw();

        // AI 回应
        if (!this.gameOver) {
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 100);
        }
    }

    aiMove() {
        document.getElementById('goHintDisplay').style.display = 'none';

        // 首手天元
        if (this.moveHistory.length === 0 && this.goBoardData.every(r => r.every(c => c === 0))) {
            const center = Math.floor(this.size / 2);
            this.makeAIMove(center, center);
            return;
        }

        // 轻量 playouts：9×9=15, 13×13=10, 19×19=6
        const playouts = this.size <= 9 ? 15 : (this.size <= 13 ? 10 : 6);
        const result = this.ai.getBestMove(this.goBoardData, this.aiColor, this.koPoint, playouts);

        if (!result) {
            this.passes++;
            if (this.passes >= 2) { this.endGame(); }
            else {
                this.currentTurn = this.playerColor;
                document.getElementById('goAITurn').textContent = this.playerColor === 1 ? '⚫ 你的回合' : '⚪ 你的回合';
                this.aiThinking = false;
                this.koPoint = null;
                this.scheduleWinRateUpdate();
            }
            return;
        }

        const [row, col, winRate] = result;
        this.makeAIMove(row, col);
    }

    makeAIMove(row, col) {
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) {
            this.aiThinking = false;
            return;
        }
        if (this.ai.isSuicide(this.goBoardData, row, col, this.aiColor)) {
            this.aiThinking = false;
            return;
        }

        this.goBoardData[row][col] = this.aiColor;
        const opponent = this.playerColor;
        let captured = false;
        for (const [nr, nc] of this.ai.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = this.ai.getGroup(this.goBoardData, nr, nc);
                if (this.ai.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.aiColor] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.moveHistory.push([row, col]);
        this.currentTurn = this.playerColor;
        document.getElementById('goAITurn').textContent = this.playerColor === 1 ? '⚫ 你的回合' : '⚪ 你的回合';
        this.aiThinking = false;
        this.board.board = this.goBoardData;
        this.updateScore();
        this.scheduleWinRateUpdate();
        this.board.draw();
    }

    showHint() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;

        document.getElementById('goHintDisplay').textContent = '💡 AI 正在分析...';
        document.getElementById('goHintDisplay').style.display = 'block';

        // 异步计算提示
        setTimeout(() => {
            const playouts = this.size <= 9 ? 12 : (this.size <= 13 ? 8 : 5);
            const ai = new GoAI(this.board);
            const evaluated = ai.evaluateMoves(this.goBoardData, this.playerColor, this.koPoint, playouts);

            if (evaluated.length === 0) {
                document.getElementById('goHintDisplay').textContent = '💡 暂无建议落子位置';
                return;
            }

            const top = evaluated.slice(0, 3);
            const letters = 'ABCDEFGHIJKLMNOPQRS';
            const hints = top.map((m, i) => {
                const letter = letters[m.col] || m.col;
                const num = this.size - m.row;
                return `${['🥇','🥈','🥉'][i]} ${letter}${num} (${Math.round(m.winRate * 100)}%)`;
            }).join('  ');

            document.getElementById('goHintDisplay').textContent = `💡 ${hints}`;
            this.board.highlights = top.map((m, i) =>
                [m.row, m.col, ['rgba(39,174,96,0.6)', 'rgba(52,152,219,0.5)', 'rgba(155,89,182,0.4)'][i]]
            );
            this.board.draw();
        }, 50);
    }

    pass() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
        } else {
            this.currentTurn = this.aiColor;
            this.koPoint = null;
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 150);
        }
    }

    scheduleWinRateUpdate() {
        // 延迟更新胜率，不阻塞 UI
        setTimeout(() => {
            if (this.aiThinking || this.gameOver) return;
            const ai = new GoAI(this.board);
            const rate = ai.estimateWinRate(this.goBoardData, this.koPoint, this.size <= 9 ? 10 : 6);
            const bp = Math.round(rate.blackRate * 100);
            const wp = Math.round(rate.whiteRate * 100);
            document.getElementById('wrBlack').textContent = bp + '%';
            document.getElementById('wrWhite').textContent = wp + '%';
            document.getElementById('wrBlackBar').style.width = bp + '%';
        }, 200);
    }

    pass() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
        } else {
            this.currentTurn = this.aiColor;
            this.koPoint = null;
            document.getElementById('goAITurn').textContent = '🤖 AI 思考中...';
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 100);
        }
    }

    endGame() {
        this.gameOver = true;
        this.aiThinking = false;
        const bs = this.captures[1];
        const ws = this.captures[2] + 6.5;
        const msg = bs > ws ? '🏆 黑方(AI)胜！' : ws > bs ? '🏆 白方(你)胜！' : '🤝 平局！';
        document.getElementById('goAITurn').textContent = msg;
        document.getElementById('goHintDisplay').style.display = 'none';
        setTimeout(() => alert(msg + '\n黑方提子: ' + this.captures[1] + '\n白方提子: ' + this.captures[2] + '\n白方贴目 6.5'), 100);
    }

    updateScore() {
        document.getElementById('goAIScore').textContent =
            `黑 ${this.captures[1]} : ${this.captures[2]} 白`;
    }
}

// ==================== 双人对弈模式 ====================
class GoPVPGame {
    constructor() {
        this.size = 9;
        this.board = new GoBoard('goPVPBoard', this.size, 60, 40);
        this.board.resizeCanvas();
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.koPoint = null;
        this.currentPlayer = 1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.gameOver = false;

        document.getElementById('goPVPNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('goPVPPass').addEventListener('click', () => this.pass());
        document.getElementById('goPVPSize').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });
        this.board.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.newGame();
    }

    newGame() {
        this.goBoardData = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.board.board = this.goBoardData;
        this.board.size = this.size;
        this.board.cellSize = this.size <= 9 ? 60 : (this.size <= 13 ? 44 : 30);
        this.board.padding = this.size <= 9 ? 40 : (this.size <= 13 ? 36 : 30);
        this.board.resizeCanvas();
        this.board.lastMove = null;
        this.board.highlights = [];
        this.board.marks = [];
        this.board.territoryHints = [];
        this.koPoint = null;
        this.currentPlayer = 1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.gameOver = false;
        this.updateUI();
        this.board.draw();
    }

    handleClick(e) {
        if (this.gameOver) return;
        const pos = this.board.getIntersection(e.clientX, e.clientY);
        if (!pos) return;
        const [row, col] = pos;
        if (this.goBoardData[row][col] !== 0) return;
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) return;

        const opponent = this.currentPlayer === 1 ? 2 : 1;
        this.goBoardData[row][col] = this.currentPlayer;

        // 检查自杀（使用共享 AI 类）
        const sharedAI = new GoAI(this.board);
        if (sharedAI.isSuicide(this.goBoardData, row, col, this.currentPlayer)) {
            this.goBoardData[row][col] = 0;
            return;
        }

        let captured = false;
        for (const [nr, nc] of sharedAI.getNeighbors(this.goBoardData, row, col)) {
            if (this.goBoardData[nr][nc] === opponent) {
                const group = sharedAI.getGroup(this.goBoardData, nr, nc);
                if (sharedAI.countLiberties(this.goBoardData, group) === 0) {
                    captured = true;
                    this.captures[this.currentPlayer] += group.length;
                    for (const [gr, gc] of group) this.goBoardData[gr][gc] = 0;
                    if (group.length === 1) this.koPoint = [group[0][0], group[0][1]];
                    else this.koPoint = null;
                }
            }
        }
        if (!captured) this.koPoint = null;

        this.board.lastMove = [row, col];
        this.passes = 0;
        this.currentPlayer = opponent;
        this.board.board = this.goBoardData;
        this.updateUI();
        this.board.draw();
    }

    pass() {
        if (this.gameOver) return;
        this.passes++;
        if (this.passes >= 2) {
            this.gameOver = true;
            const bs = this.captures[1];
            const ws = this.captures[2] + 6.5;
            const msg = bs > ws ? '🏆 黑方胜！' : ws > bs ? '🏆 白方胜！' : '🤝 平局！';
            setTimeout(() => alert(msg + '\n黑方提子: ' + this.captures[1] + '\n白方提子: ' + this.captures[2] + '\n白方贴目 6.5'), 100);
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.koPoint = null;
            this.updateUI();
            this.board.draw();
        }
    }

    updateUI() {
        document.getElementById('goPVPTurn').textContent =
            this.currentPlayer === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
        document.getElementById('goPVPScore').textContent =
            `黑 ${this.captures[1]} : ${this.captures[2]} 白`;
    }
}

// ==================== 主控制器 ====================
class GoGame {
    constructor() {
        this.mode = 'practice';
        this.practice = null;
        this.aiGame = null;
        this.pvpGame = null;

        // Tab 切换
        document.querySelectorAll('.go-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.getAttribute('data-gotab');
                this.switchMode(mode);
            });
        });

        this.switchMode('practice');
    }

    switchMode(mode) {
        this.mode = mode;

        document.querySelectorAll('.go-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-gotab') === mode);
        });
        document.querySelectorAll('.go-sub-panel').forEach(p => p.classList.remove('active'));

        switch (mode) {
            case 'practice':
                document.getElementById('goPanelPractice').classList.add('active');
                if (!this.practice) this.practice = new GoPractice();
                break;
            case 'ai':
                document.getElementById('goPanelAI').classList.add('active');
                if (!this.aiGame) this.aiGame = new GoAIGame();
                break;
            case 'pvp':
                document.getElementById('goPanelPVP').classList.add('active');
                if (!this.pvpGame) this.pvpGame = new GoPVPGame();
                break;
        }
    }
}
