/**
 * 主控制逻辑 - 游戏切换 & 移动端菜单
 */

(function () {
    'use strict';

    // 游戏实例
    let games = {};
    let currentGame = 'sudoku';

    // 初始化
    function init() {
        // 侧边栏切换
        const navItems = document.querySelectorAll('.game-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const gameId = item.getAttribute('data-game');
                switchGame(gameId);
            });
        });

        // 移动端菜单
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);

        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });

        // 关闭侧边栏（移动端点击导航后）
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                }
            });
        });

        // 初始化默认游戏
        switchGame('sudoku');
    }

    function switchGame(gameId) {
        // 更新导航
        document.querySelectorAll('.game-nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-game') === gameId);
        });

        // 更新面板
        document.querySelectorAll('.game-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const panel = document.getElementById('game-' + gameId);
        if (panel) panel.classList.add('active');

        currentGame = gameId;

        // 延迟初始化游戏（确保 DOM 可见后再初始化，这对 Canvas 很重要）
        if (!games[gameId]) {
            initGame(gameId);
        }
    }

    function initGame(gameId) {
        switch (gameId) {
            case 'sudoku':
                games.sudoku = new SudokuGame();
                break;
            case 'go':
                games.go = new GoGame();
                break;
            case '2048':
                games.game2048 = new Game2048();
                break;
            case 'minesweeper':
                games.minesweeper = new Minesweeper();
                break;
            case 'memory':
                games.memory = new MemoryGame();
                break;
            case 'puzzle':
                games.puzzle = new PuzzleGame();
                break;
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
