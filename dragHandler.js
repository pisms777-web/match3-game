// dragHandler.js

let isDown = false;
let startRow = -1;
let startCol = -1;
let draggingClone = null;

// Эти переменные должны быть доступны извне (например, из index.html)
let board = null;
let gameRect = null;
let cellSize = 0;
let ROWS = 10;
let COLS = 10;
let COLORS = [];

// Функции, которые должны быть реализованы в основном файле
let renderBoard = null;
let attemptSwap = null;
let getCellFromPoint = null;

// ----------------------------
// ВНУТРЕННИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ----------------------------

function createDraggingClone(color, clientX, clientY) {
  if (draggingClone) draggingClone.remove();
  draggingClone = document.createElement('div');
  draggingClone.id = 'dragging-clone';
  draggingClone.style.width = `${cellSize}px`;
  draggingClone.style.height = `${cellSize}px`;
  draggingClone.style.backgroundColor = color;
  document.body.appendChild(draggingClone);
  draggingClone.style.left = `${clientX}px`;
  draggingClone.style.top = `${clientY}px`;
}

function removeDraggingClone() {
  if (draggingClone) {
    draggingClone.remove();
    draggingClone = null;
  }
}

// ----------------------------
// ОСНОВНЫЕ ОБРАБОТЧИКИ
// ----------------------------

function handleTouchStart(x, y) {
  // Важно: размеры должны быть актуальны!
  // renderBoard() должен был уже обновить gameRect и cellSize
  const cell = getCellFromPoint(x, y);
  if (!cell) return false;

  isDown = true;
  startRow = cell.row;
  startCol = cell.col;
  createDraggingClone(board[startRow][startCol], x, y);
  return true;
}

function handleTouchMove(x, y) {
  if (!isDown) return;
  if (draggingClone) {
    draggingClone.style.left = `${x}px`;
    draggingClone.style.top = `${y}px`;
  }
}

function handleTouchEnd(x, y) {
  if (!isDown) return;

  removeDraggingClone();

  const pad = 6;
  const left = gameRect.left + pad;
  const top = gameRect.top + pad;
  const centerX = left + startCol * (cellSize + 2) + cellSize / 2;
  const centerY = top + startRow * (cellSize + 2) + cellSize / 2;

  const candidates = [
    { r: startRow, c: startCol },
    { r: startRow - 1, c: startCol },
    { r: startRow + 1, c: startCol },
    { r: startRow, c: startCol - 1 },
    { r: startRow, c: startCol + 1 }
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

  if (best && (best.r !== startRow || best.c !== startCol) &&
      (Math.abs(best.r - startRow) + Math.abs(best.c - startCol) === 1)) {
    attemptSwap(startRow, startCol, best.r, best.c);
  } else {
    renderBoard(); // вернуть визуал
  }

  isDown = false;
  startRow = -1;
  startCol = -1;
}

// ----------------------------
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ
// ----------------------------

window.DragHandler = {
  init(config) {
    board = config.board;
    gameRect = config.gameRect;
    cellSize = config.cellSize;
    ROWS = config.ROWS || 10;
    COLS = config.COLS || 10;
    COLORS = config.COLORS || [];
    renderBoard = config.renderBoard;
    attemptSwap = config.attemptSwap;
    getCellFromPoint = config.getCellFromPoint;
  },
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  isDragging: () => isDown
};
