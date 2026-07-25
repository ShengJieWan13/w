/**
 * 数独游戏 - Sudoku（增强版）
 * 功能：草稿模式、六级难度、每日一题、计时器、统计记录
 */

class SudokuGame {
    constructor() {
        // 棋盘数据
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.given = Array(9).fill(null).map(() => Array(9).fill(false));
        // 草稿：drafts[r][c] 是一个 Set，包含 1-9 的候选数字
        this.drafts = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));

        this.selectedRow = -1;
        this.selectedCol = -1;
        this.difficulty = 'medium';
        this.isDaily = false;
        this.draftMode = false; // 草稿模式开关

        // 计时器
        this.timerSeconds = 0;
        this.timerInterval = null;
        this.timerRunning = false;
        this.timerPaused = false;
        this.started = false;  // 用户是否点了开始
        this.firstInput = false; // 是否已经开始填数字

        // 提示计数 & 错误次数
        this.hintCount = 0;
        this.errorCount = 0;

        // DOM 元素
        this.boardEl = document.getElementById('sudokuBoard');
        this.numpadEl = document.getElementById('sudokuNumpad');

        // 绑定事件
        document.getElementById('sudokuNewGame').addEventListener('click', () => this.newGame());
        document.getElementById('sudokuDaily').addEventListener('click', () => this.loadDaily());
        document.getElementById('sudokuHint').addEventListener('click', () => this.giveHint());
        document.getElementById('sudokuDraftToggle').addEventListener('click', () => this.toggleDraftMode());
        document.getElementById('sudokuTimerBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('sudokuStatsBtn').addEventListener('click', () => this.openStats());
        document.getElementById('statsClose').addEventListener('click', () => this.closeStats());
        document.querySelector('.stats-overlay').addEventListener('click', () => this.closeStats());
        document.getElementById('sudokuDifficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.isDaily = false;
            this.newGame();
        });

        this.buildNumpad();
        this.newGame();
        this.bindKeys();
    }

    // ============ 难度配置 ============
    getDifficultyConfig() {
        const configs = {
            very_easy: { clues: 45, label: '入门' },
            easy:      { clues: 38, label: '简单' },
            medium:    { clues: 32, label: '中等' },
            hard:      { clues: 27, label: '困难' },
            expert:    { clues: 23, label: '专家' },
            master:    { clues: 20, label: '大师' },
        };
        return configs[this.difficulty] || configs.medium;
    }

    // ============ 种子随机数（用于每日一题） ============
    seededRandom(seed) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = ((h << 5) - h) + seed.charCodeAt(i);
        }
        return function () {
            h ^= (h << 13);
            h ^= (h >> 17);
            h ^= (h << 5);
            return (h >>> 0) / 4294967296;
        };
    }

    // ============ 键盘绑定 ============
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game-sudoku').classList.contains('active')) return;
            if (this.selectedRow === -1) return;

            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                e.preventDefault();
                if (this.draftMode) {
                    this.toggleDraft(this.selectedRow, this.selectedCol, num);
                } else {
                    this.placeNumber(num);
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                e.preventDefault();
                if (this.draftMode) {
                    this.clearDrafts(this.selectedRow, this.selectedCol);
                } else {
                    this.placeNumber(0);
                }
            } else if (e.key === 'ArrowUp' && this.selectedRow > 0) {
                e.preventDefault();
                this.selectCell(this.selectedRow - 1, this.selectedCol);
            } else if (e.key === 'ArrowDown' && this.selectedRow < 8) {
                e.preventDefault();
                this.selectCell(this.selectedRow + 1, this.selectedCol);
            } else if (e.key === 'ArrowLeft' && this.selectedCol > 0) {
                e.preventDefault();
                this.selectCell(this.selectedRow, this.selectedCol - 1);
            } else if (e.key === 'ArrowRight' && this.selectedCol < 8) {
                e.preventDefault();
                this.selectCell(this.selectedRow, this.selectedCol + 1);
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.toggleDraftMode();
            }
        });
    }

    // ============ 数字键盘 ============
    buildNumpad() {
        this.numpadEl.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'numpad-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => {
                if (this.draftMode) {
                    this.toggleDraft(this.selectedRow, this.selectedCol, i);
                } else {
                    this.placeNumber(i);
                }
            });
            this.numpadEl.appendChild(btn);
        }
        const eraseBtn = document.createElement('button');
        eraseBtn.className = 'numpad-btn erase';
        eraseBtn.textContent = '✕ 清除';
        eraseBtn.addEventListener('click', () => {
            if (this.draftMode) {
                this.clearDrafts(this.selectedRow, this.selectedCol);
            } else {
                this.placeNumber(0);
            }
        });
        this.numpadEl.appendChild(eraseBtn);
    }

    // ============ 草稿模式 ============
    toggleDraftMode() {
        this.draftMode = !this.draftMode;
        const btn = document.getElementById('sudokuDraftToggle');
        if (this.draftMode) {
            btn.classList.add('active');
            btn.textContent = '✏️ 草稿:开';
        } else {
            btn.classList.remove('active');
            btn.textContent = '✏️ 草稿';
        }
    }

    toggleDraft(row, col, num) {
        if (row < 0 || col < 0) return;
        if (this.given[row][col]) return;
        if (this.board[row][col] !== 0) return;
        if (!this.started || this.timerPaused) return; // 未开始或暂停中禁止操作 // 已填数字的格子不写草稿

        if (this.drafts[row][col].has(num)) {
            this.drafts[row][col].delete(num);
        } else {
            this.drafts[row][col].add(num);
        }
        this.startTimerIfNeeded();
        this.render();
    }

    clearDrafts(row, col) {
        if (row < 0 || col < 0) return;
        if (this.given[row][col]) return;
        this.drafts[row][col].clear();
        this.render();
    }

    // ============ 落子 ============
    placeNumber(num) {
        if (this.selectedRow === -1) return;
        if (this.given[this.selectedRow][this.selectedCol]) return;
        if (!this.started || this.timerPaused) return; // 未开始或暂停中禁止操作

        this.board[this.selectedRow][this.selectedCol] = num;
        // 清除该格草稿
        this.drafts[this.selectedRow][this.selectedCol].clear();

        // 错误计数：填了非零数字但与答案不符
        if (num !== 0 && num !== this.solution[this.selectedRow][this.selectedCol]) {
            this.errorCount++;
            document.getElementById('sudokuErrorCount').textContent = `❌ 错误: ${this.errorCount}`;
        }

        this.startTimerIfNeeded();
        this.render();

        if (this.isComplete()) {
            this.finishGame();
        }
    }

    startTimerIfNeeded() {
        if (!this.started) return; // 没点开始不计时
        if (!this.firstInput) {
            this.firstInput = true;
        }
    }

    // ============ 计时器：开始/暂停/继续 ============
    toggleTimer() {
        if (!this.started) {
            // 第一次点：开始
            this.started = true;
            this.startTimer();
            this.updateTimerBtn();
        } else if (this.timerRunning) {
            // 正在计时 → 暂停
            this.pauseTimer();
        } else {
            // 已暂停 → 继续
            this.resumeTimer();
        }
    }

    startTimer() {
        this.timerRunning = true;
        this.timerPaused = false;
        this.timerSeconds = 0;
        this.updateTimerDisplay();
        document.getElementById('sudokuTimerDisplay').classList.add('running');
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.timerRunning = false;
        this.timerPaused = true;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        document.getElementById('sudokuTimerDisplay').classList.remove('running');
        this.updateTimerBtn();
    }

    resumeTimer() {
        this.timerRunning = true;
        this.timerPaused = false;
        document.getElementById('sudokuTimerDisplay').classList.add('running');
        this.updateTimerBtn();
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        this.timerRunning = false;
        this.timerPaused = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        document.getElementById('sudokuTimerDisplay').classList.remove('running');
    }

    resetTimer() {
        this.stopTimer();
        this.timerSeconds = 0;
        this.started = false;
        this.firstInput = false;
        document.getElementById('sudokuTimerDisplay').classList.remove('running');
        this.updateTimerDisplay();
        this.updateTimerBtn();
    }

    updateTimerBtn() {
        const btn = document.getElementById('sudokuTimerBtn');
        if (!this.started) {
            btn.textContent = '▶ 开始';
            btn.classList.remove('paused');
        } else if (this.timerPaused) {
            btn.textContent = '▶ 继续';
            btn.classList.add('paused');
        } else {
            btn.textContent = '⏸ 暂停';
            btn.classList.remove('paused');
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        document.getElementById('sudokuTimer').textContent =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // ============ 生成题目 ============
    generatePuzzle(seed) {
        const rand = seed ? this.seededRandom(seed) : () => Math.random();
        // 生成完整解
        this.fillSolution(rand);
        this.solution = this.board.map(row => [...row]);

        // 所有格子标记为 given
        this.given = Array(9).fill(null).map(() => Array(9).fill(true));

        // 根据难度决定保留的提示数
        const config = this.getDifficultyConfig();
        const cluesToKeep = config.clues;
        const cellsToRemove = 81 - cluesToKeep;

        const positions = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                positions.push([r, c]);
            }
        }
        // 使用传入的 rand 打乱
        this.shuffle(positions, rand);

        for (let i = 0; i < cellsToRemove; i++) {
            const [r, c] = positions[i];
            this.board[r][c] = 0;
            this.given[r][c] = false;
        }
    }

    fillSolution(rand) {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solveRandom(this.board, rand || (() => Math.random()));
    }

    solveRandom(grid, rand) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    this.shuffle(nums, rand);
                    for (const num of nums) {
                        if (this.isValid(grid, r, c, num)) {
                            grid[r][c] = num;
                            if (this.solveRandom(grid, rand)) return true;
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

    shuffle(arr, rand) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ============ 每日一题 ============
    loadDaily() {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const seed = `sudoku-daily-${dateStr}`;

        this.isDaily = true;
        this.difficulty = 'medium'; // 每日一题固定中等难度
        document.getElementById('sudokuDifficulty').value = 'medium';

        this.resetGame();
        this.generatePuzzle(seed);
        this.render();
    }

    // ============ 新游戏 ============
    newGame() {
        this.isDaily = false;
        this.resetGame();
        this.generatePuzzle(null);
        this.render();
    }

    resetGame() {
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.hintCount = 0;
        this.errorCount = 0;
        this.drafts = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
        this.draftMode = false;
        const btn = document.getElementById('sudokuDraftToggle');
        btn.classList.remove('active');
        btn.textContent = '✏️ 草稿';
        document.getElementById('sudokuHintCount').textContent = '💡 提示: 0';
        document.getElementById('sudokuErrorCount').textContent = '❌ 错误: 0';
        document.getElementById('sudokuTimerBtn').textContent = '▶ 开始';
        document.getElementById('sudokuTimerBtn').classList.remove('paused');
        this.resetTimer();
    }

    // ============ 完成判定 ============
    isComplete() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0) return false;
                if (this.board[r][c] !== this.solution[r][c]) return false;
            }
        }
        return true;
    }

    finishGame() {
        this.stopTimer();
        const time = this.timerSeconds;
        const diffLabel = this.getDifficultyConfig().label;
        const type = this.isDaily ? '每日一题' : diffLabel;

        // 保存统计
        this.saveRecord({
            date: new Date().toISOString().split('T')[0],
            time: time,
            timeDisplay: this.formatTime(time),
            difficulty: type,
            hints: this.hintCount,
            errors: this.errorCount,
            isDaily: this.isDaily,
        });

        setTimeout(() => {
            const stars = time < 180 ? '🌟🌟🌟' : time < 420 ? '🌟🌟' : time < 720 ? '🌟' : '';
            alert(`🎉 恭喜完成！\n📅 ${type}\n⏱ 用时: ${this.formatTime(time)}\n💡 提示: ${this.hintCount} 次\n❌ 错误: ${this.errorCount} 次\n${stars}`);
        }, 200);
    }

    // ============ 统计记录 ============
    saveRecord(record) {
        const key = 'sudoku_stats';
        let stats = [];
        try {
            stats = JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            stats = [];
        }
        stats.unshift(record);
        // 最多保留 50 条
        if (stats.length > 50) stats = stats.slice(0, 50);
        localStorage.setItem(key, JSON.stringify(stats));
    }

    getStats() {
        try {
            return JSON.parse(localStorage.getItem('sudoku_stats') || '[]');
        } catch (e) {
            return [];
        }
    }

    // ============ 统计弹窗 ============
    openStats() {
        const stats = this.getStats();
        const modal = document.getElementById('sudokuStatsModal');

        document.getElementById('statTotal').textContent = stats.length;

        if (stats.length > 0) {
            const times = stats.map(s => s.time);
            const bestTime = Math.min(...times);
            const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            document.getElementById('statBestTime').textContent = this.formatTime(bestTime);
            document.getElementById('statAvgTime').textContent = this.formatTime(avgTime);

            // 计算连续天数
            const days = new Set(stats.map(s => s.date));
            const sortedDays = [...days].sort().reverse();
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < sortedDays.length; i++) {
                const expected = new Date(today);
                expected.setDate(today.getDate() - i);
                const expectedStr = expected.toISOString().split('T')[0];
                if (days.has(expectedStr)) {
                    streak++;
                } else if (i === 0) {
                    // 今天没玩，检查昨天
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    if (days.has(yesterdayStr)) {
                        streak++;
                        today.setDate(today.getDate() - 1);
                        i--;
                        continue;
                    }
                    break;
                } else {
                    break;
                }
            }
            document.getElementById('statStreak').textContent = streak;

            // 渲染历史
            const historyEl = document.getElementById('statsHistory');
            historyEl.innerHTML = stats.slice(0, 20).map((s, i) => `
                <div class="stat-record">
                    <span class="rec-date">${s.date}</span>
                    <span class="rec-diff">${s.difficulty}</span>
                    <span class="rec-time">${s.timeDisplay || this.formatTime(s.time)}</span>
                    <span>💡${s.hints || 0}</span>
                    <span>❌${s.errors || 0}</span>
                </div>
            `).join('');
        } else {
            document.getElementById('statBestTime').textContent = '--:--';
            document.getElementById('statAvgTime').textContent = '--:--';
            document.getElementById('statStreak').textContent = '0';
            document.getElementById('statsHistory').innerHTML =
                '<p class="stats-empty">暂无记录，快去挑战吧！</p>';
        }

        modal.classList.add('open');
    }

    closeStats() {
        document.getElementById('sudokuStatsModal').classList.remove('open');
    }

    // ============ 提示 ============
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
        if (!this.started || this.timerPaused) return; // 未开始或暂停中禁止操作

        this.startTimerIfNeeded();

        const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[r][c] = this.solution[r][c];
        this.given[r][c] = true;
        this.drafts[r][c].clear();
        this.hintCount++;
        document.getElementById('sudokuHintCount').textContent = `💡 提示: ${this.hintCount}`;

        this.render();
        const idx = r * 9 + c;
        const cell = this.boardEl.children[idx];
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 600);
        }

        if (this.isComplete()) {
            this.finishGame();
        }
    }

    // ============ 选择格子 ============
    selectCell(row, col) {
        this.selectedRow = row;
        this.selectedCol = col;
        this.render();
    }

    // ============ 渲染 ============
    render() {
        this.boardEl.innerHTML = '';
        const selectedVal = this.selectedRow !== -1 ? this.board[this.selectedRow]?.[this.selectedCol] : 0;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';

                if (this.given[r][c]) {
                    cell.classList.add('given');
                }

                // 错误标记
                if (this.board[r][c] !== 0 && !this.given[r][c] &&
                    this.board[r][c] !== this.solution[r][c]) {
                    cell.classList.add('error');
                }

                // 选中标记
                if (r === this.selectedRow && c === this.selectedCol) {
                    cell.classList.add('selected');
                }

                // 高亮相同数字
                if (selectedVal !== 0 && this.board[r][c] === selectedVal &&
                    !(r === this.selectedRow && c === this.selectedCol)) {
                    cell.classList.add('same-number');
                }

                // 渲染内容
                if (this.board[r][c] !== 0) {
                    cell.textContent = this.board[r][c];
                } else if (this.drafts[r][c].size > 0) {
                    // 显示草稿数字
                    const draftGrid = document.createElement('div');
                    draftGrid.className = 'draft-grid';
                    for (let n = 1; n <= 9; n++) {
                        const draftNum = document.createElement('span');
                        draftNum.className = 'draft-num';
                        draftNum.textContent = this.drafts[r][c].has(n) ? n : '';
                        draftGrid.appendChild(draftNum);
                    }
                    cell.appendChild(draftGrid);
                }

                cell.addEventListener('click', () => this.selectCell(r, c));
                this.boardEl.appendChild(cell);
            }
        }
    }
}
