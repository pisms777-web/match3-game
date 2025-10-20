// drag-handler.js
// Версия: v2.1
// Ответственность: обработка touch-событий, движение фишки, выбор соседа

class DragHandler {
  constructor(gameCore, config = {}) {
    this.gameCore = gameCore;
    this.onSwap = config.onSwap || (() => {});
    this.isDown = false;
    this.startRow = -1;
    this.startCol = -1;
    this.draggingClone = null;
    this.init();
  }

  init() {
    // Обработчики только для touch (Android)
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  createDraggingClone(color, clientX, clientY) {
    if (this.draggingClone) this.draggingClone.remove();
    this.draggingClone = document.createElement('div');
    this.draggingClone.id = 'dragging-clone';
    this.draggingClone.style.width = `${this.gameCore.cellSize}px`;
    this.draggingClone.style.height = `${this.gameCore.cellSize}px`;
    this.draggingClone.style.backgroundColor = color;
    document.body.appendChild(this.draggingClone);
    this.updateDraggingPosition(clientX, clientY);
  }

  updateDraggingPosition(clientX, clientY) {
    if (!this.draggingClone) return;
    const { gameRect, cellSize, startCol, startRow, COLS, ROWS } = this.gameCore;
    const centerX = gameRect.left + 6 + startCol * (cellSize + 2) + cellSize / 2;
    const centerY = gameRect.top + 6 + startRow * (cellSize + 2) + cellSize / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const max = cellSize * 0.9;
    dx = Math.max(-max, Math.min(max, dx));
    dy = Math.max(-max, Math.min(max, dy));
    let finalX = centerX;
    let finalY = centerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > cellSize / 3 && startCol < COLS - 1) finalX = centerX + (cellSize + 2);
      else if (dx < -cellSize / 3 && startCol > 0) finalX = centerX - (cellSize + 2);
    } else {
      if (dy > cellSize / 3 && startRow < ROWS - 1) finalY = centerY + (cellSize + 2);
      else if (dy < -cellSize / 3 && startRow > 0) finalY = centerY - (cellSize + 2);
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

  handleTouchStart(e) {
    if (this.isModalOpen()) return;
    if (e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const cell = this.gameCore.getCellFromPoint(x, y);
    if (!cell) return;
    this.isDown = true;
    this.startRow = cell.row;
    this.startCol = cell.col;
    this.createDraggingClone(this.gameCore.board[this.startRow][this.startCol], x, y);
    e.preventDefault();
  }

  handleTouchMove(e) {
    if (this.isModalOpen()) return;
    if (!this.isDown || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    this.updateDraggingPosition(x, y);
    e.preventDefault();
  }

  handleTouchEnd(e) {
    if (this.isModalOpen()) return;
    if (!this.isDown) return;
    this.removeDraggingClone();
    if (e.changedTouches.length === 0) return;
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    const { gameRect, cellSize, ROWS, COLS } = this.gameCore;
    const pad = 6;
    const left = gameRect.left + pad;
    const top = gameRect.top + pad;
    const centerX = left + this.startCol * (cellSize + 2) + cellSize / 2;
    const centerY = top + this.startRow * (cellSize + 2) + cellSize / 2;
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
      if (cand.r < 0 || cand.r >= ROWS || cand.c < 0 || cand.c >= COLS) continue;
      const cx = left + cand.c * (cellSize + 2) + cellSize / 2;
      const cy = top + cand.r * (cellSize + 2) + cellSize / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < minDist) {
        minDist = dist;
        best = cand;
      }
    }
    if (best && (best.r !== this.startRow || best.c !== this.startCol) &&
        (Math.abs(best.r - this.startRow) + Math.abs(best.c - this.startCol) === 1)) {
      this.onSwap(this.startRow, this.startCol, best.r, best.c);
    } else {
      this.gameCore.renderBoard();
    }
    this.isDown = false;
    this.startRow = -1;
    this.startCol = -1;
  }

  isModalOpen() {
    return document.getElementById('notification').style.display === 'flex' ||
           document.getElementById('settings').style.display === 'flex';
  }
}
