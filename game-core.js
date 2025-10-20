// game-core.js
class GameCore {
  constructor(config = {}) {
    this.ROWS = config.ROWS || 10;
    this.COLS = config.COLS || 10;
    this.COLORS = config.COLORS || ['#e91e63', '#4caf50', '#2196f3', '#ff9800'];
    this.board = [];
    this.gameRect = null;
    this.cellSize = 0;
    this.init();
  }

  init() {
    this.board = this.generateBoard();
    this.renderBoard();
  }

  generateBoard() {
    const b = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(null));
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        let color;
        do {
          color = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
        } while (
          (r >= 2 && b[r-1][c] === color && b[r-2][c] === color) ||
          (c >= 2 && b[r][c-1] === color && b[r][c-2] === color)
        );
        b[r][c] = color;
      }
    }
    return b;
  }

  renderBoard(highlightMatches = new Set()) {
    const gameEl = document.getElementById('game');
    if (!gameEl) return;
    gameEl.innerHTML = '';
    this.gameRect = gameEl.getBoundingClientRect();
    const gap = 2;
    this.cellSize = (this.gameRect.width - gap * (this.COLS - 1)) / this.COLS;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.backgroundColor = this.board[r][c];
        if (highlightMatches.has(`${r},${c}`)) cell.classList.add('falling');
        cell.dataset.row = r;
        cell.dataset.col = c;
        gameEl.appendChild(cell);
      }
    }
  }

  getCellFromPoint(x, y) {
    if (!this.gameRect) return null;
    const pad = 6;
    const left = this.gameRect.left + pad;
    const top = this.gameRect.top + pad;
    const width = this.gameRect.width - pad * 2;
    const height = this.gameRect.height - pad * 2;
    if (x < left || x > left + width || y < top || y > top + height) return null;
    const col = Math.floor((x - left) / (this.cellSize + 2));
    const row = Math.floor((y - top) / (this.cellSize + 2));
    if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) return { row, col };
    return null;
  }

  // ... остальные методы (findMatches, removeMatchesAndRefill и т.д.) без изменений
}
