/**
 * 围棋游戏 - Go（增强版）
 * 功能：残局练习、AI 对战（Monte Carlo）、胜率显示、AI 提示、双人对弈
 */

// ==================== 残局题库 ====================
const TSUMEKO_PROBLEMS = [
    {
        name: '第1题：双打吃',
        desc: '黑先，找出双打吃的位置吃掉白棋',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,3],[3,3],[4,2],[5,3],[5,4]],
            white: [[3,2],[3,4],[4,3],[4,4],[5,2]]
        },
        answer: [3, 2]
    },
    {
        name: '第2题：征子',
        desc: '黑先，用征子（扭羊头）吃白△',
        size: 9, color: 1,
        setup: {
            black: [[2,4],[3,3],[4,5],[5,4]],
            white: [[3,4],[3,5],[4,4]]
        },
        answer: [3, 5]
    },
    {
        name: '第3题：做眼',
        desc: '黑先，做两只真眼活棋',
        size: 9, color: 1,
        setup: {
            black: [[2,3],[2,4],[3,2],[3,5],[4,3],[4,4]],
            white: [[1,3],[1,4],[2,2],[2,5],[3,1],[3,6],[4,2],[4,5]]
        },
        answer: [3, 4]
    },
    {
        name: '第4题：破眼杀棋',
        desc: '黑先，破坏白棋眼位将其吃掉',
        size: 9, color: 1,
        setup: {
            black: [[1,3],[2,2],[2,4],[3,1],[3,5],[4,3]],
            white: [[2,3],[3,2],[3,3],[3,4]]
        },
        answer: [3, 3]
    },
    {
        name: '第5题：接不归',
        desc: '黑先，利用接不归吃掉白子',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,4],[3,1],[3,3],[4,2]],
            white: [[2,3],[3,2],[4,1],[4,3]]
        },
        answer: [3, 1]
    },
    {
        name: '第6题：倒扑',
        desc: '黑先，利用倒扑吃白',
        size: 9, color: 1,
        setup: {
            black: [[2,1],[2,3],[3,2],[4,1]],
            white: [[2,2],[3,1],[3,3]]
        },
        answer: [3, 1]
    },
    {
        name: '第7题：枷吃',
        desc: '黑先，用枷吃（门吃）吃掉白棋',
        size: 9, color: 1,
        setup: {
            black: [[3,2],[3,4],[4,1],[4,5],[5,3]],
            white: [[3,3],[4,3],[4,4]]
        },
        answer: [4, 2]
    },
    {
        name: '第8题：角部死活',
        desc: '黑先，在角部做活',
        size: 9, color: 1,
        setup: {
            black: [[0,0],[0,1],[1,0],[1,2],[2,1]],
            white: [[0,2],[2,0],[2,2],[3,1]]
        },
        answer: [1, 1]
    },
    {
        name: '第9题：边上杀棋',
        desc: '黑先，在边上杀死白棋',
        size: 9, color: 1,
        setup: {
            black: [[3,0],[3,2],[4,1],[5,0],[5,2]],
            white: [[3,1],[4,0],[4,2],[5,1]]
        },
        answer: [4, 1]
    },
    {
        name: '第10题：宽气劫',
        desc: '黑先，制造劫争',
        size: 9, color: 1,
        setup: {
            black: [[2,2],[2,4],[3,1],[3,5],[4,2],[4,4]],
            white: [[2,3],[3,2],[3,3],[3,4],[4,3]]
        },
        answer: [3, 2]
    },
    {
        name: '第11题：点杀',
        desc: '黑先，找到白棋要点将其点杀',
        size: 9, color: 1,
        setup: {
            black: [[1,4],[2,3],[2,5],[3,2],[3,6],[4,4],[4,5]],
            white: [[2,4],[3,3],[3,4],[3,5]]
        },
        answer: [3, 4]
    },
    {
        name: '第12题：滚打包收',
        desc: '黑先，滚打包收吃白',
        size: 9, color: 1,
        setup: {
            black: [[2,1],[2,3],[3,0],[3,2],[4,1],[4,3]],
            white: [[2,2],[3,1],[3,3],[4,2]]
        },
        answer: [2, 2]
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

// ==================== Go AI（Monte Carlo 模拟） ====================
class GoAI {
    constructor(boardObj) {
        this.boardObj = boardObj;
        this.playoutCount = 100; // 默认模拟次数
    }

    // 获取所有合法落子
    getLegalMoves(board, color, koPoint) {
        const size = board.length;
        const moves = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] !== 0) continue;
                if (koPoint && koPoint[0] === r && koPoint[1] === c) continue;
                // 快速检查自杀
                const testBoard = board.map(row => [...row]);
                testBoard[r][c] = color;
                if (this.isSuicide(testBoard, r, c, color)) continue;
                moves.push([r, c]);
            }
        }
        // 打乱顺序
        for (let i = moves.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [moves[i], moves[j]] = [moves[j], moves[i]];
        }
        return moves;
    }

    isSuicide(board, row, col, color) {
        const opponent = color === 1 ? 2 : 1;
        const neighbors = this.getNeighbors(board, row, col);
        // 如果吃掉对方子，不是自杀
        for (const [nr, nc] of neighbors) {
            if (board[nr][nc] === opponent) {
                const group = this.getGroup(board, nr, nc);
                if (this.countLiberties(board, group) === 0) return false;
            }
        }
        // 检查自己
        const myGroup = this.getGroup(board, row, col);
        return this.countLiberties(board, myGroup) === 0;
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
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([r, c]);
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return group;
    }

    countLiberties(board, group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === 0) liberties.add(`${nr},${nc}`);
            }
        }
        return liberties.size;
    }

    // 在棋盘上落子，返回 [新棋盘, 提子数, 新打劫点]
    playMove(board, row, col, color, koPoint) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = color;
        const opponent = color === 1 ? 2 : 1;
        let captures = 0;
        let newKo = null;

        for (const [nr, nc] of this.getNeighbors(newBoard, row, col)) {
            if (newBoard[nr][nc] === opponent) {
                const group = this.getGroup(newBoard, nr, nc);
                if (this.countLiberties(newBoard, group) === 0) {
                    captures += group.length;
                    for (const [gr, gc] of group) newBoard[gr][gc] = 0;
                    if (group.length === 1) newKo = [group[0][0], group[0][1]];
                }
            }
        }

        // 检查是否形成有效打劫
        if (newKo && captures === 1) {
            const myGroup = this.getGroup(newBoard, row, col);
            if (this.countLiberties(newBoard, myGroup) !== 1) newKo = null;
        } else {
            newKo = null;
        }

        return { board: newBoard, captures, koPoint: newKo };
    }

    // 启发式随机模拟一局
    simulateRandomGame(board, startColor, koPoint) {
        let simBoard = board.map(r => [...r]);
        let currentColor = startColor;
        let simKo = koPoint ? [...koPoint] : null;
        let passes = 0;
        const maxMoves = board.length * board.length * 2;

        for (let moveNum = 0; moveNum < maxMoves; moveNum++) {
            const moves = this.getLegalMoves(simBoard, currentColor, simKo);

            // 启发式：优先在已有棋子附近落子
            const nearMoves = moves.filter(([r, c]) => this.hasNeighbor(simBoard, r, c));
            const candidates = nearMoves.length > 0 ? nearMoves : moves;

            if (candidates.length === 0) {
                passes++;
                if (passes >= 2) break;
                currentColor = currentColor === 1 ? 2 : 1;
                simKo = null;
                continue;
            }

            passes = 0;
            const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
            const result = this.playMove(simBoard, r, c, currentColor, simKo);
            simBoard = result.board;
            simKo = result.koPoint;
            currentColor = currentColor === 1 ? 2 : 1;
        }

        // 简易计分：数子
        let blackScore = 0, whiteScore = 0;
        const visited = new Set();
        const size = simBoard.length;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (simBoard[r][c] === 1) blackScore++;
                else if (simBoard[r][c] === 2) whiteScore++;
                else if (!visited.has(`${r},${c}`)) {
                    // 空地 —— 判断属于谁
                    const territory = this.floodEmpty(simBoard, r, c, visited);
                    const owners = new Set();
                    for (const [er, ec] of territory) {
                        for (const [nr, nc] of this.getNeighbors(simBoard, er, ec)) {
                            if (simBoard[nr][nc] !== 0) owners.add(simBoard[nr][nc]);
                        }
                    }
                    if (owners.size === 1) {
                        if (owners.has(1)) blackScore += territory.length;
                        else if (owners.has(2)) whiteScore += territory.length;
                    }
                }
            }
        }

        whiteScore += 6.5; // 贴目
        return blackScore > whiteScore ? 1 : (whiteScore > blackScore ? 2 : 0);
    }

    floodEmpty(board, row, col, visited) {
        const territory = [];
        const stack = [[row, col]];
        const size = board.length;
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            if (board[r][c] !== 0) continue;
            visited.add(key);
            territory.push([r, c]);
            for (const [nr, nc] of this.getNeighbors(board, r, c)) {
                if (board[nr][nc] === 0 && !visited.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return territory;
    }

    hasNeighbor(board, row, col) {
        for (const [nr, nc] of this.getNeighbors(board, row, col)) {
            if (board[nr][nc] !== 0) return true;
            // 两格以内也算"附近"
            for (const [nnr, nnc] of this.getNeighbors(board, nr, nc)) {
                if (board[nnr][nnc] !== 0) return true;
            }
        }
        return false;
    }

    // 评估所有合法落子的胜率
    evaluateMoves(board, color, koPoint, numPlayouts) {
        const moves = this.getLegalMoves(board, color, koPoint);
        if (moves.length === 0) return [];

        const n = numPlayouts || this.playoutCount;
        const results = [];

        for (const [r, c] of moves) {
            const result = this.playMove(board, r, c, color, koPoint);
            let wins = 0;
            const opponent = color === 1 ? 2 : 1;

            for (let i = 0; i < n; i++) {
                const winner = this.simulateRandomGame(result.board, opponent, result.koPoint);
                if (winner === color) wins++;
            }
            results.push({ row: r, col: c, winRate: wins / n, wins, total: n });
        }

        results.sort((a, b) => b.winRate - a.winRate);
        return results;
    }

    // 获取最佳落子
    getBestMove(board, color, koPoint, numPlayouts) {
        const evaluated = this.evaluateMoves(board, color, koPoint, numPlayouts);
        if (evaluated.length === 0) return null;
        return [evaluated[0].row, evaluated[0].col, evaluated[0].winRate, evaluated];
    }

    // 估计当前胜率
    estimateWinRate(board, koPoint, numPlayouts) {
        const n = numPlayouts || 50;
        let blackWins = 0;
        for (let i = 0; i < n; i++) {
            const winner = this.simulateRandomGame(board, 1, koPoint);
            if (winner === 1) blackWins++;
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

        const puzzle = TSUMEKO_PROBLEMS[currentPuzzle];
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

        this.updateWinRate();
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
        this.updateWinRate();
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
        this.updateWinRate();
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

        // 天元开局
        if (this.moveHistory.length === 0 && this.goBoardData.every(r => r.every(c => c === 0))) {
            const center = Math.floor(this.size / 2);
            this.makeAIMove(center, center, '首手天元');
            return;
        }

        const playouts = this.size <= 9 ? 150 : (this.size <= 13 ? 100 : 50);
        const result = this.ai.getBestMove(this.goBoardData, this.aiColor, this.koPoint, playouts);

        if (!result || result.length === 0) {
            this.passes++;
            if (this.passes >= 2) {
                this.endGame();
            } else {
                this.currentTurn = this.playerColor;
                document.getElementById('goAITurn').textContent = this.playerColor === 1 ? '⚫ 你的回合' : '⚪ 你的回合';
                this.aiThinking = false;
                this.koPoint = null;
                this.updateWinRate();
            }
            return;
        }

        const [row, col, winRate, allEvals] = result;
        this.makeAIMove(row, col, `胜率预估: ${Math.round(winRate * 100)}%`);
    }

    makeAIMove(row, col, info) {
        // 检查打劫
        if (this.koPoint && this.koPoint[0] === row && this.koPoint[1] === col) {
            // 换一个第二选项
            this.aiThinking = false;
            return;
        }

        this.goBoardData[row][col] = this.aiColor;
        if (this.ai.isSuicide(this.goBoardData, row, col, this.aiColor)) {
            this.goBoardData[row][col] = 0;
            this.aiThinking = false;
            return;
        }

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
        this.updateWinRate();
        this.board.draw();
    }

    showHint() {
        if (this.aiThinking || this.gameOver) return;
        if (this.currentTurn !== this.playerColor) return;

        const playouts = this.size <= 9 ? 200 : (this.size <= 13 ? 120 : 60);
        const ai = new GoAI(this.board);
        const evaluated = ai.evaluateMoves(this.goBoardData, this.playerColor, this.koPoint, playouts);

        if (evaluated.length === 0) {
            document.getElementById('goHintDisplay').textContent = '💡 暂无建议落子位置';
            document.getElementById('goHintDisplay').style.display = 'block';
            return;
        }

        const top = evaluated.slice(0, 3);
        const letters = 'ABCDEFGHIJKLMNOPQRS';
        const hints = top.map((m, i) => {
            const letter = letters[m.col] || m.col;
            const num = this.size - m.row;
            return `${['🥇','🥈','🥉'][i]} ${letter}${num} (胜率 ${Math.round(m.winRate * 100)}%)`;
        }).join('  ');

        document.getElementById('goHintDisplay').textContent = `💡 ${hints}`;
        document.getElementById('goHintDisplay').style.display = 'block';

        // 高亮建议落子
        this.board.highlights = top.map((m, i) =>
            [m.row, m.col, ['rgba(39, 174, 96, 0.6)', 'rgba(52, 152, 219, 0.5)', 'rgba(155, 89, 182, 0.4)'][i]]
        );
        this.board.draw();
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

    updateWinRate() {
        if (this.aiThinking) return;
        // 使用轻量模拟估计胜率
        const ai = new GoAI(this.board);
        const smallPlayouts = this.size <= 9 ? 60 : 30;
        setTimeout(() => {
            const rate = ai.estimateWinRate(this.goBoardData, this.koPoint, smallPlayouts);
            const bp = Math.round(rate.blackRate * 100);
            const wp = Math.round(rate.whiteRate * 100);
            document.getElementById('wrBlack').textContent = bp + '%';
            document.getElementById('wrWhite').textContent = wp + '%';
            document.getElementById('wrBlackBar').style.width = bp + '%';
        }, 0);
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
