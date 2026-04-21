class MinesweeperGame {
    constructor() {
        this.currentLevel = 1;
        this.unlockedLevels = 1;
        this.gameStarted = false;
        this.gameOver = false;
        this.firstClick = true;
        this.mineCount = 0;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.timeElapsed = 0;
        this.timer = null;
        this.board = [];
        this.rows = 9;
        this.cols = 9;
        this.mines = 10;
        this.bestTimes = {};

        this.initElements();
        this.loadProgress();
        this.initEventListeners();
        this.updateLevelInfo();
        this.generateLevelSelector();
    }

    initElements() {
        this.boardElement = document.getElementById('game-board');
        this.levelNumberElement = document.getElementById('level-number');
        this.mineCountElement = document.getElementById('mine-count');
        this.timeCountElement = document.getElementById('time-count');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.levelSelectBtn = document.getElementById('level-select-btn');
        this.exitBtn = document.getElementById('exit-btn');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.winModal = document.getElementById('win-modal');
        this.levelSelectModal = document.getElementById('level-select-modal');
        this.restartBtn = document.getElementById('restart-btn');
        this.backToLevelsBtn = document.getElementById('back-to-levels-btn');
        this.nextLevelBtn = document.getElementById('next-level-btn');
        this.winBackToLevelsBtn = document.getElementById('win-back-to-levels-btn');
        this.closeLevelSelectBtn = document.getElementById('close-level-select-btn');
        this.levelSelector = document.getElementById('level-selector');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.levelSelectBtn.addEventListener('click', () => this.showLevelSelector());
        this.exitBtn.addEventListener('click', () => this.exitGame());
        this.restartBtn.addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            this.resetGame();
        });
        this.backToLevelsBtn.addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            this.showLevelSelector();
        });
        this.nextLevelBtn.addEventListener('click', () => {
            this.hideModal(this.winModal);
            this.nextLevel();
        });
        this.winBackToLevelsBtn.addEventListener('click', () => {
            this.hideModal(this.winModal);
            this.showLevelSelector();
        });
        this.closeLevelSelectBtn.addEventListener('click', () => {
            this.hideModal(this.levelSelectModal);
        });
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('minesweeperProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.unlockedLevels = progress.unlockedLevels || 1;
            this.currentLevel = progress.currentLevel || 1;
            this.bestTimes = progress.bestTimes || {};
        }
    }

    saveProgress() {
        const progress = {
            unlockedLevels: this.unlockedLevels,
            currentLevel: this.currentLevel,
            bestTimes: this.bestTimes
        };
        localStorage.setItem('minesweeperProgress', JSON.stringify(progress));
    }

    updateLevelInfo() {
        this.levelNumberElement.textContent = this.currentLevel;
        this.updateLevelSettings();
    }

    updateLevelSettings() {
        if (this.currentLevel <= 25) {
            // 初级关卡
            this.rows = 9;
            this.cols = 9;
            this.mines = 10;
        } else if (this.currentLevel <= 50) {
            // 中级关卡
            this.rows = 16;
            this.cols = 16;
            this.mines = 40;
        } else if (this.currentLevel <= 75) {
            // 高级关卡
            this.rows = 16;
            this.cols = 30;
            this.mines = 99;
        } else {
            // 终极关卡
            this.rows = 20;
            this.cols = 30;
            this.mines = 120;
        }
        this.mineCount = this.mines;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.mineCountElement.textContent = this.mineCount;
    }

    startGame() {
        if (!this.gameStarted || this.gameOver) {
            this.resetGame();
        }
    }

    resetGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.firstClick = true;
        this.timeElapsed = 0;
        this.timeCountElement.textContent = this.timeElapsed;
        this.updateLevelSettings();
        this.generateBoard();
        this.renderBoard();
        this.startTimer();
    }

    generateBoard() {
        // 初始化空白棋盘
        this.board = [];
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // 确保第一个点击的位置及其周围不是地雷
            if (!this.board[row][col].isMine && 
                Math.abs(row - firstClickRow) > 1 || 
                Math.abs(col - firstClickCol) > 1) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        this.calculateNeighborMines();
    }

    calculateNeighborMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].isMine) {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols && 
                                this.board[ni][nj].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[i][j].neighborMines = count;
                }
            }
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 35px)`;
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 35px)`;

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;

                if (this.board[i][j].isRevealed) {
                    cell.classList.add('revealed');
                    if (this.board[i][j].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[i][j].neighborMines > 0) {
                        cell.classList.add(`number-${this.board[i][j].neighborMines}`);
                        cell.textContent = this.board[i][j].neighborMines;
                    }
                } else if (this.board[i][j].isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                cell.addEventListener('click', (e) => this.handleCellClick(e, i, j));
                cell.addEventListener('contextmenu', (e) => this.handleCellRightClick(e, i, j));

                this.boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(e, row, col) {
        e.preventDefault();
        if (this.gameOver || this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }

        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
        }

        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.showGameOverModal();
        } else {
            this.revealCell(row, col);
            this.checkWin();
        }
    }

    handleCellRightClick(e, row, col) {
        e.preventDefault();
        if (this.gameOver || this.board[row][col].isRevealed) {
            return;
        }

        if (this.board[row][col].isFlagged) {
            this.board[row][col].isFlagged = false;
            this.flagCount--;
        } else if (this.flagCount < this.mineCount) {
            this.board[row][col].isFlagged = true;
            this.flagCount++;
        }

        this.mineCountElement.textContent = this.mineCount - this.flagCount;
        this.renderBoard();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
            this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }

        this.board[row][col].isRevealed = true;
        this.revealedCount++;

        if (this.board[row][col].neighborMines === 0) {
            // 递归揭示周围的格子
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    if (di === 0 && dj === 0) continue;
                    this.revealCell(row + di, col + dj);
                }
            }
        }

        this.renderBoard();
    }

    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isMine) {
                    this.board[i][j].isRevealed = true;
                }
            }
        }
        this.renderBoard();
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        if (this.revealedCount === totalCells - this.mines) {
            this.gameOver = true;
            this.stopTimer();
            this.unlockNextLevel();
            this.saveBestTime();
            this.showWinModal();
        }
    }

    unlockNextLevel() {
        if (this.currentLevel < 100 && this.currentLevel === this.unlockedLevels) {
            this.unlockedLevels++;
            this.saveProgress();
        }
    }

    saveBestTime() {
        const levelKey = `level${this.currentLevel}`;
        if (!this.bestTimes[levelKey] || this.timeElapsed < this.bestTimes[levelKey]) {
            this.bestTimes[levelKey] = this.timeElapsed;
            this.saveProgress();
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            this.timeElapsed++;
            this.timeCountElement.textContent = this.timeElapsed;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    showGameOverModal() {
        this.gameOverModal.style.display = 'flex';
    }

    showWinModal() {
        const winMessage = document.getElementById('win-message');
        winMessage.textContent = `你成功通过了第${this.currentLevel}关，用时${this.timeElapsed}秒！`;
        this.winModal.style.display = 'flex';
    }

    showLevelSelector() {
        this.generateLevelSelector();
        this.levelSelectModal.style.display = 'flex';
    }

    generateLevelSelector() {
        this.levelSelector.innerHTML = '';
        for (let i = 1; i <= 100; i++) {
            const levelBtn = document.createElement('button');
            levelBtn.classList.add('level-btn');
            if (i <= this.unlockedLevels) {
                levelBtn.classList.add('unlocked');
                if (i === this.currentLevel) {
                    levelBtn.classList.add('current');
                }
                levelBtn.addEventListener('click', () => this.selectLevel(i));
            } else {
                levelBtn.classList.add('locked');
            }
            levelBtn.textContent = i;
            this.levelSelector.appendChild(levelBtn);
        }
    }

    selectLevel(level) {
        if (level <= this.unlockedLevels) {
            this.currentLevel = level;
            this.updateLevelInfo();
            this.hideModal(this.levelSelectModal);
            this.resetGame();
        }
    }

    nextLevel() {
        if (this.currentLevel < 100) {
            this.currentLevel++;
            this.updateLevelInfo();
            this.resetGame();
        }
    }

    exitGame() {
        this.saveProgress();
        alert('游戏已保存，感谢游玩！');
    }

    hideModal(modal) {
        modal.style.display = 'none';
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});