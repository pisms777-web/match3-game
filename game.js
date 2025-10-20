const ROWS = 10;
const COLS = 10;
const COLORS = ['#e91e63', '#4caf50', '#2196f3', '#ff9800'];
let score = 0;
let board = [];
let isDown = false;
let startRow = -1;
let startCol = -1;
let gameRect = null;
let cellSize = 0;
let draggingClone = null;
let highScore = localStorage.getItem('match3HighScore') ? parseInt(localStorage.getItem('match3HighScore')) : 0;

// === Звук ===
let audioContext = null;
function playSuccessSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
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

// === Частицы ===
function createParticles(x, y, color, count = 8) {
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

// === Игровая логика ===
function generateBoard() {
  const b = Array(ROWS).fill().map(() => Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let color;
      do {
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (
        (r >= 2 && b[r-1][c] === color && b[r-2][c] === color) ||
        (c >= 2 && b[r][c-1] === color && b[r][c-2] === color)
      );
      b[r][c] = color;
    }
  }
  return b;
}

function findMatches() {
  const matches = new Set();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const col = board[r][c];
      if (col && board[r][c+1] === col && board[r][c+2] === col) {
        let k = c;
        while (k < COLS && board[r][k] === col) {
          matches.add(`${r},${k}`);
          k++;
        }
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const col = board[r][c];
      if (col && board[r+1][c] === col && board[r+2][c] === col) {
        let k = r;
        while (k < ROWS && board[k][c] === col) {
          matches.add(`${k},${c}`);
          k++;
        }
      }
    }
  }
  return matches;
}

function removeMatchesAndRefill(matches) {
  if (matches.size > 0) {
    playSuccessSound();
    score += matches.size * 10;
    document.getElementById('score').textContent = `Счёт: ${score}`;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('match3HighScore', highScore);
    }
    const gameEl = document.getElementById('game');
    const rect = gameEl.getBoundingClientRect();
    matches.forEach(pos => {
      const [r, c] = pos.split(',').map(Number);
      const color = board[r][c];
      const x = rect.left + 6 + c * (cellSize + 2) + cellSize / 2;
      const y = rect.top + 6 + r * (cellSize + 2) + cellSize / 2;
      createParticles(x, y, color);
    });
  }
  matches.forEach(pos => {
    const [r, c] = pos.split(',').map(Number);
    board[r][c] = null;
  });
  for (let c = 0; c < COLS; c++) {
    const colVals = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== null) colVals.push(board[r][c]);
    }
    while (colVals.length < ROWS) {
      colVals.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    for (let r = 0; r < ROWS; r++) {
      board[ROWS - 1 - r][c] = colVals[r];
    }
  }
  renderBoard(matches);
  setTimeout(() => {
    const newMatches = findMatches();
    if (newMatches.size > 0) {
      removeMatchesAndRefill(newMatches);
    }
  }, 400);
}

function attemptSwap(r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  const matches = findMatches();
  if (matches.size === 0) {
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    renderBoard();
  } else {
    renderBoard();
    setTimeout(() => removeMatchesAndRefill(matches), 300);
  }
}

// === DOM ===
function renderBoard(highlightMatches = new Set()) {
  const gameEl = document.getElementById('game');
  gameEl.innerHTML = '';
  gameRect = gameEl.getBoundingClientRect();
  const gap = 2;
  cellSize = (gameRect.width - gap * (COLS - 1)) / COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.backgroundColor = board[r][c];
      if (highlightMatches.has(`${r},${c}`)) {
        cell.classList.add('falling');
      }
      cell.dataset.row = r;
      cell.dataset.col = c;
      gameEl.appendChild(cell);
    }
  }
}

function getCellFromPoint(x, y) {
  if (!gameRect) return null;
  const pad = 6;
  const left = gameRect.left + pad;
  const top = gameRect.top + pad;
  const width = gameRect.width - pad * 2;
  const height = gameRect.height - pad * 2;
  if (x < left || x > left + width || y < top || y > top + height) return null;
  const col = Math.floor((x - left) / (cellSize + 2));
  const row = Math.floor((y - top) / (cellSize + 2));
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) return { row, col };
  return null;
}

function createDraggingClone(color, clientX, clientY) {
  if (draggingClone) draggingClone.remove();
  draggingClone = document.createElement('div');
  draggingClone.id = 'dragging-clone';
  draggingClone.style.width = `${cellSize}px`;
  draggingClone.style.height = `${cellSize}px`;
  draggingClone.style.backgroundColor = color;
  document.body.appendChild(draggingClone);
  updateDraggingPosition(clientX, clientY);
}

function updateDraggingPosition(clientX, clientY) {
  if (!draggingClone) return;

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

  draggingClone.style.left = `${finalX}px`;
  draggingClone.style.top = `${finalY}px`;
}

function removeDraggingClone() {
  if (draggingClone) {
    draggingClone.remove();
    draggingClone = null;
  }
}

// === Только Touch (Android) ===
document.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  const cell = getCellFromPoint(x, y);
  if (!cell) return;
  isDown = true;
  startRow = cell.row;
  startCol = cell.col;
  createDraggingClone(board[startRow][startCol], x, y);
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!isDown || e.touches.length !== 1) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  updateDraggingPosition(x, y);
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!isDown) return;
  removeDraggingClone();
  if (e.changedTouches.length === 0) return;

  const x = e.changedTouches[0].clientX;
  const y = e.changedTouches[0].clientY;

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

  let bestCandidate = null;
  let minDist = Infinity;

  for (const cand of candidates) {
    if (cand.r < 0 || cand.r >= ROWS || cand.c < 0 || cand.c >= COLS) continue;
    const cx = left + cand.c * (cellSize + 2) + cellSize / 2;
    const cy = top + cand.r * (cellSize + 2) + cellSize / 2;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < minDist) {
      minDist = dist;
      bestCandidate = cand;
    }
  }

  if (bestCandidate &&
      (bestCandidate.r !== startRow || bestCandidate.c !== startCol) &&
      (Math.abs(bestCandidate.r - startRow) + Math.abs(bestCandidate.c - startCol) === 1)) {
    attemptSwap(startRow, startCol, bestCandidate.r, bestCandidate.c);
  } else {
    renderBoard();
  }

  isDown = false;
  startRow = -1;
  startCol = -1;
}, { passive: false });

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

window.addEventListener('load', () => {
  board = generateBoard();
  renderBoard();
});