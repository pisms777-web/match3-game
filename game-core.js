// game-core.js
// Версия: v2.0
// Ответственность: игровая доска, перетаскивание, совпадения, анимации

class GameCore {
  constructor(config) {
    this.ROWS = config.ROWS || 10;
    this.COLS = config.COLS || 10;
    this.COLORS = config.COLORS || ['#e91e63', '#4caf50', '#2196f3', '#ff9800'];
    this.onScoreChange = config.onScoreChange || (() => {});
    this.onBoardUpdate = config.onBoardUpdate || (() => {});
    this.onSwapAttempt = config.onSwapAttempt || (() => {});

    this.board = [];
    this.isDown = false;
    this.startRow = -1;
    this.startCol = -1;
    this.gameRect = null;
    this.cellSize = 0;
    this.draggingClone = null;

    this.init();
  }

  init() {
    this.board = this.generateBoard();
    this.renderBoard();
  }

  // === ГЕНЕРАЦИЯ ДОСКИ ===
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

  // === ПОИСК СОВПАДЕНИЙ ===
  findMatches() {
    const matches = new Set();
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c <= this.COLS - 3; c++) {
        const col = this.board[r][c];
        if (col && this.board[r][c+1] === col && this.board[r][c+2] === col) {
          let k = c;
          while (k < this.COLS && this.board[r][k] === col) {
            matches.add(`${r},${k}`);
            k++;
          }
        }
      }
    }
    for (let c = 0; c < this.COLS; c++) {
      for (let r = 0; r <= this.ROWS - 3; r++) {
        const col = this.board[r][c];
        if (col && this.board[r+1][c] === col && this.board[r+2][c] === col) {
          let k = r;
          while (k < this.ROWS && this.board[k][c] === col) {
            matches.add(`${k},${c}`);
            k++;
          }
        }
      }
    }
    return matches;
  }

  // === ОБНОВЛЕНИЕ ДОСКИ ===
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
        if (highlightMatches.has(`${r},${c}`)) {
          cell.classList.add('falling');
        }
        cell.dataset.row = r;
        cell.dataset.col = c;
        gameEl.appendChild(cell);
      }
    }
    this.onBoardUpdate(this.board);
  }

  // === ПОЛУЧЕНИЕ КЛЕТКИ ПО КООРДИНАТАМ ===
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

  // === ЧАСТИЦЫ ===
  createParticles(x, y, color, count = 8) {
    const gameEl = document.getElementById('game');
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.backgroundColor = color;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      gameEl.appendChild(particle);
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      let opacity = 1;
      const animate = () => {
        if (opacity <= 0) {
          particle.remove();
          return;
        }
        const newX = parseFloat(particle.style.left) + vx * 0.02;
        const newY = parseFloat(particle.style.top) + vy * 0.02;
        opacity -= 0.03;
        particle.style.left = `${newX}px`;
        particle.style.top = `${newY}px`;
        particle.style.opacity = opacity;
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }

  // === ЗВУК ===
  playSuccessSound() {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  // === УДАЛЕНИЕ СОВПАДЕНИЙ ===
  removeMatchesAndRefill(matches, scoreCallback) {
    if (matches.size > 0) {
      this.playSuccessSound();
      const points = matches.size * 10;
      scoreCallback(points);
      const gameEl = document.getElementById('game');
      const rect = gameEl.getBoundingClientRect();
      matches.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        const color = this.board[r][c];
        const x = rect.left + 6 + c * (this.cellSize + 2) + this.cellSize / 2;
        const y = rect.top + 6 + r * (this.cellSize + 2) + this.cellSize / 2;
        this.createParticles(x, y, color);
      });
    }
    matches.forEach(pos => {
      const [r, c] = pos.split(',').map(Number);
      this.board[r][c] = null;
    });
    for (let c = 0; c < this.COLS; c++) {
      const colVals = [];
      for (let r = this.ROWS - 1; r >= 0; r--) {
        if (this.board[r][c] !== null) colVals.push(this.board[r][c]);
      }
      while (colVals.length < this.ROWS) {
        colVals.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
      }
      for (let r = 0; r < this.ROWS; r++) {
        this.board[this.ROWS - 1 - r][c] = colVals[r];
      }
    }
    this.renderBoard(matches);
    setTimeout(() => {
      const newMatches = this.findMatches();
      if (newMatches.size > 0) {
        this.removeMatchesAndRefill(newMatches, scoreCallback);
      }
    }, 400);
  }

  // === ПЕРЕТАСКИВАНИЕ ===
  handleTouchStart(x, y) {
    const cell = this.getCellFromPoint(x, y);
    if (!cell) return false;
    this.isDown = true;
    this.startRow = cell.row;
    this.startCol = cell.col;
    this.createDraggingClone(this.board[this.startRow][this.startCol], x, y);
    return true;
  }

  handleTouchMove(x, y) {
    if (!this.isDown) return;
    this.updateDraggingPosition(x, y);
  }

  handleTouchEnd(x, y) {
    if (!this.isDown) return;
    this.removeDraggingClone();
    const pad = 6;
    const left = this.gameRect.left + pad;
    const top = this.gameRect.top + pad;
    const centerX = left + this.startCol * (this.cellSize + 2) + this.cellSize / 2;
    const centerY = top + this.startRow * (this.cellSize + 2) + this.cellSize / 2;
    const candidates = [
      { r: this.startRow, c: this.startCol },
      { r: this.startRow - 1, c: this.startCol },
      { r: this.startRow + 1, c: this.startCol },
      { r: this.startRow, c: this.startCol - 1 },
      { r: this.startRow, c: this.startCol + 1 }
    ];
    let best = null;
    let minDist = Infinity;
    for (const cand of candidates) {
      if (cand.r < 0 || cand.r >= this.ROWS || cand.c < 0 || cand.c >= this.COLS) continue;
      const cx = left + cand.c * (this.cellSize + 2) + this.cellSize / 2;
      const cy = top + cand.r * (this.cellSize + 2) + this.cellSize / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < minDist) {
        minDist = dist;
        best = cand;
      }
    }
    if (best && (best.r !== this.startRow || best.c !== this.startCol) &&
        (Math.abs(best.r - this.startRow) + Math.abs(best.c - this.startCol) === 1)) {
      this.onSwapAttempt(this.startRow, this.startCol, best.r, best.c);
    } else {
      this.renderBoard();
    }
    this.isDown = false;
    this.startRow = -1;
    this.startCol = -1;
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ПЕРЕТАСКИВАНИЯ ===
  createDraggingClone(color, clientX, clientY) {
    if (this.draggingClone) this.draggingClone.remove();
    this.draggingClone = document.createElement('div');
    this.draggingClone.id = 'dragging-clone';
    this.draggingClone.style.width = `${this.cellSize}px`;
    this.draggingClone.style.height = `${this.cellSize}px`;
    this.draggingClone.style.backgroundColor = color;
    document.body.appendChild(this.draggingClone);
    this.updateDraggingPosition(clientX, clientY);
  }

  updateDraggingPosition(clientX, clientY) {
    if (!this.draggingClone) return;
    const centerX = this.gameRect.left + 6 + this.startCol * (this.cellSize + 2) + this.cellSize / 2;
    const centerY = this.gameRect.top + 6 + this.startRow * (this.cellSize + 2) + this.cellSize / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const max = this.cellSize * 0.9;
    dx = Math.max(-max, Math.min(max, dx));
    dy = Math.max(-max, Math.min(max, dy));
    let finalX = centerX;
    let finalY = centerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > this.cellSize / 3 && this.startCol < this.COLS - 1) finalX = centerX + (this.cellSize + 2);
      else if (dx < -this.cellSize / 3 && this.startCol > 0) finalX = centerX - (this.cellSize + 2);
    } else {
      if (dy > this.cellSize / 3 && this.startRow < this.ROWS - 1) finalY = centerY + (this.cellSize + 2);
      else if (dy < -this.cellSize / 3 && this.startRow > 0) finalY = centerY - (this.cellSize + 2);
    }
    this.draggingClone.style.left = `${finalX}px`;
    this.draggingClone.style.top = `${finalY}px`;
  }

  removeDraggingClone() {
    if (this.draggingClone) {
      this.draggingClone.remove();
      this.draggingClone = null;
    }
  }

  // === ПУБЛИЧНЫЙ МЕТОД ДЛЯ СБРОСА ===
  resetBoard() {
    this.board = this.generateBoard();
    this.renderBoard();
  }
}
