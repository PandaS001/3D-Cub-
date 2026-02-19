// Конфигурация
const CONFIG = {
    musicEnabled: true
};

// Состояние игры
let boardState = Array(6).fill(null).map(() => Array(9).fill(""));
let currentPlayer = 'X'; // X ходит первым
let gameActive = true;
let playerXScore = 0;
let playerOScore = 0;
let winningCombination = [];

// DOM элементы
let faces, squares, musicControl, bgMusic;
let playerXScoreEl, playerOScoreEl, currentTurnEl;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.querySelector('.splash-screen');
    const mainPage = document.querySelector('.main-page');
    musicControl = document.querySelector('.music-control');
    bgMusic = document.getElementById('bgMusic');
    
    playerXScoreEl = document.getElementById('playerX-score');
    playerOScoreEl = document.getElementById('playerO-score');
    currentTurnEl = document.getElementById('current-turn');
    
    createConstellations();
    
    if (CONFIG.musicEnabled) {
        bgMusic.volume = 0.3;
        musicControl.addEventListener('click', toggleMusic);
    }
    
    setTimeout(() => {
        splashScreen.style.display = 'none';
        mainPage.style.display = 'block';
        initGame();
        
        if (CONFIG.musicEnabled) {
            bgMusic.play().catch(() => {
                musicControl.textContent = '🎵';
            });
        }
    }, 2000);
    
    document.getElementById('restartButton').addEventListener('click', resetGame);
    document.getElementById('resetScoreButton').addEventListener('click', resetScores);
});

// Создание созвездий
function createConstellations() {
    const container = document.querySelector('.constellations');
    const symbols = ['✨', '⭐', '🌟', '💫', '⚡', '🌠'];
    
    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.className = 'constellation';
        star.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
        star.style.left = Math.random() * 100 + 'vw';
        star.style.animationDuration = (8 + Math.random() * 15) + 's';
        star.style.animationDelay = Math.random() * 5 + 's';
        star.style.fontSize = (15 + Math.random() * 30) + 'px';
        container.appendChild(star);
    }
}

// Инициализация игры
function initGame() {
    faces = document.querySelectorAll('.cube-face');
    createBoard();
    updateScores();
    updateTurnDisplay();
}

// Создание игрового поля
function createBoard() {
    faces.forEach((face, faceIndex) => {
        face.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.face = faceIndex;
            square.dataset.index = i;
            square.addEventListener('click', handleSquareClick);
            face.appendChild(square);
        }
    });
    squares = document.querySelectorAll('.square');
}

// Обработка клика
function handleSquareClick(event) {
    if (!gameActive) {
        alert('Игра окончена! Нажмите "Новая игра"');
        return;
    }
    
    const square = event.target;
    const faceIndex = parseInt(square.dataset.face);
    const squareIndex = parseInt(square.dataset.index);
    
    // Проверяем, свободна ли клетка
    if (boardState[faceIndex][squareIndex] !== "") {
        alert('Эта клетка уже занята!');
        return;
    }
    
    // Делаем ход текущим игроком
    makeMove(faceIndex, squareIndex, currentPlayer);
}

// Совершение хода
function makeMove(faceIndex, squareIndex, player) {
    if (!gameActive) return;
    
    console.log(`Ход игрока ${player} на грань ${faceIndex}, клетку ${squareIndex}`);
    
    // Ставим метку
    boardState[faceIndex][squareIndex] = player;
    
    // Обновляем отображение
    const square = document.querySelector(`[data-face="${faceIndex}"][data-index="${squareIndex}"]`);
    square.textContent = player === 'X' ? '❌' : '⭕';
    square.classList.add(player === 'X' ? 'x-move' : 'o-move');
    
    // Проверка победы в 3D
    const winResult = checkWin3D(player);
    if (winResult.win) {
        winningCombination = winResult.combination;
        highlightWinningCombination();
        gameActive = false;
        
        if (player === 'X') {
            playerXScore++;
            showVictory('Игрок X победил!', '❌');
        } else {
            playerOScore++;
            showVictory('Игрок O победил!', '⭕');
        }
        
        updateScores();
        disableAllSquares();
        return;
    }
    
    // Проверка ничьей
    if (isBoardFull()) {
        gameActive = false;
        showVictory('Ничья!', '🤝');
        disableAllSquares();
        return;
    }
    
    // Смена игрока
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    console.log(`Теперь ходит ${currentPlayer}`);
    updateTurnDisplay();
}

// ==================== ПОЛНАЯ 3D ЛОГИКА ПРОВЕРКИ ПОБЕДЫ ====================

// Все возможные линии на кубе (54 линии)
function getAllLines() {
    const lines = [];
    
    // 1. Линии на каждой грани (по 8 линий на грань = 48)
    for (let face = 0; face < 6; face++) {
        // Горизонтали (3 линии)
        for (let row = 0; row < 3; row++) {
            const start = row * 3;
            lines.push([[face, start], [face, start + 1], [face, start + 2]]);
        }
        
        // Вертикали (3 линии)
        for (let col = 0; col < 3; col++) {
            lines.push([[face, col], [face, col + 3], [face, col + 6]]);
        }
        
        // Диагонали (2 линии)
        lines.push([[face, 0], [face, 4], [face, 8]]);
        lines.push([[face, 2], [face, 4], [face, 6]]);
    }
    
    // 2. 3D линии через центр (6 линий)
    lines.push([[0,4], [5,4], [4,4]]);
    lines.push([[2,4], [6,4], [4,4]]);
    lines.push([[1,4], [5,4], [3,4]]);
    lines.push([[1,4], [6,4], [3,4]]);
    
    // 3. Угловые диагонали куба (8 линий)
    lines.push([[0,0], [5,0], [4,6]]);
    lines.push([[0,2], [5,2], [4,8]]);
    lines.push([[0,6], [5,6], [4,0]]);
    lines.push([[0,8], [5,8], [4,2]]);
    lines.push([[2,0], [6,2], [4,2]]);
    lines.push([[2,2], [6,8], [4,0]]);
    lines.push([[2,6], [6,0], [4,8]]);
    lines.push([[2,8], [6,6], [4,6]]);
    
    // 4. Кольцевые линии (12 линий)
    for (let i = 0; i < 3; i++) {
        lines.push([[0,i*3], [1,i*3], [2,i*3], [3,i*3]]);
        lines.push([[0,i*3+1], [1,i*3+1], [2,i*3+1], [3,i*3+1]]);
        lines.push([[0,i*3+2], [1,i*3+2], [2,i*3+2], [3,i*3+2]]);
    }
    
    return lines;
}

// Проверка победы в 3D
function checkWin3D(player) {
    const lines = getAllLines();
    
    for (let line of lines) {
        let count = 0;
        for (let [face, index] of line) {
            if (boardState[face] && boardState[face][index] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count === line.length) {
            return { win: true, combination: line };
        }
    }
    
    return { win: false, combination: [] };
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Проверка заполненности поля
function isBoardFull() {
    for (let face = 0; face < 6; face++) {
        if (boardState[face].includes("")) return false;
    }
    return true;
}

// Отключение всех клеток
function disableAllSquares() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.add('disabled');
    });
}

// Подсветка выигрышной комбинации
function highlightWinningCombination() {
    for (let [face, index] of winningCombination) {
        const square = document.querySelector(`[data-face="${face}"][data-index="${index}"]`);
        if (square) square.classList.add('winning');
    }
}

// ==================== UI ФУНКЦИИ ====================

function updateScores() {
    playerXScoreEl.textContent = playerXScore;
    playerOScoreEl.textContent = playerOScore;
}

function updateTurnDisplay() {
    if (currentPlayer === 'X') {
        currentTurnEl.innerHTML = '❌ Ход игрока X';
        currentTurnEl.style.color = '#ff4d4d';
    } else {
        currentTurnEl.innerHTML = '⭕ Ход игрока O';
        currentTurnEl.style.color = '#00ffff';
    }
}

function resetGame() {
    boardState = Array(6).fill(null).map(() => Array(9).fill(""));
    currentPlayer = 'X'; // Всегда начинаем с X
    gameActive = true;
    winningCombination = [];
    
    document.querySelectorAll('.square').forEach(sq => {
        sq.textContent = '';
        sq.classList.remove('x-move', 'o-move', 'winning', 'disabled');
    });
    
    updateTurnDisplay();
    console.log('Игра сброшена, ходит X');
}

function resetScores() {
    playerXScore = 0;
    playerOScore = 0;
    updateScores();
    resetGame();
}

function showVictory(message, icon) {
    const oldOverlay = document.getElementById('victory-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    const victoryHTML = `
        <div class="victory-overlay" id="victory-overlay">
            <div class="victory-modal">
                <div class="victory-icon">${icon}</div>
                <h2 class="victory-title">${message}</h2>
                <button class="victory-btn" id="victory-ok">Новая игра</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', victoryHTML);
    
    const overlay = document.getElementById('victory-overlay');
    overlay.style.display = 'flex';
    
    document.getElementById('victory-ok').addEventListener('click', () => {
        overlay.remove();
        resetGame();
    });
    
    // Автоматическое закрытие через 3 секунды
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    }, 3000);
}

function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play();
        musicControl.textContent = '🔊';
    } else {
        bgMusic.pause();
        musicControl.textContent = '🎵';
    }
}