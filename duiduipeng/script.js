const gameBoard = document.getElementById('game-board');
const restartButton = document.getElementById('restart');
const hintButton = document.getElementById('hint');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const rankingList = document.getElementById('ranking-list');
let cards = [];
let flippedCards = [];
let matchedCards = 0;
let score = 0;
let level = 1;
let gridSize = 2;
let isHintActive = false;
let isRevealPhase = true; // 标记明牌阶段

const allCardValues = [
    'images/1.png',
    'images/2.png',
    'images/3.png',
    'images/4.png',
    'images/5.png',
    'images/6.png',
    'images/7.png',
    'images/8.png'
];

function initGame() {
    const cardCount = (gridSize * gridSize) / 2;
    const cardValues = shuffle([...allCardValues]).slice(0, cardCount);
    cards = [...cardValues, ...cardValues];
    cards = shuffle(cards);
    gameBoard.innerHTML = '';
    flippedCards = [];
    matchedCards = 0;
    isRevealPhase = true;
    hintButton.disabled = true; // 明牌阶段禁用提示

    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 80px)`;
    gameBoard.style.width = `${gridSize * 85}px`;

    cards.forEach(value => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = value;
        card.style.backgroundImage = `url(${value})`;
        card.classList.add('flipped');
        gameBoard.appendChild(card);
    });

    updateScoreDisplay();
    updateLevelDisplay();
    setTimeout(hideAllCards, 5000); // 5秒明牌
}

function hideAllCards() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        card.classList.remove('flipped');
        card.style.backgroundImage = '';
        card.addEventListener('click', flipCard);
        card.addEventListener('touchstart', flipCard);
    });
    isRevealPhase = false; // 明牌阶段结束
    hintButton.disabled = false; // 启用提示
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function flipCard(e) {
    e.preventDefault();
    if (isRevealPhase || isHintActive || flippedCards.length >= 2 || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');
    this.style.backgroundImage = `url(${this.dataset.value})`;
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.value === card2.dataset.value) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedCards += 2;
        score += 10;
        updateScoreDisplay();
        flippedCards = [];
        if (matchedCards === cards.length) {
            score += 100;
            updateScoreDisplay();
            level++;
            if (gridSize < 4) gridSize += 1;
            setTimeout(nextLevel, 1000);
        }
    } else {
        score = Math.max(0, score - 5); // 匹配失败扣5分
        updateScoreDisplay();
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.style.backgroundImage = '';
            card2.style.backgroundImage = '';
            flippedCards = [];
        }, 1000);
    }
}

function nextLevel() {
    initGame();
}

function showHint() {
    if (isRevealPhase || isHintActive) return; // 明牌阶段或提示进行中不可用
    if (score < 50) {
        alert('积分不足！需要50分才能使用提示。');
        return;
    }

    isHintActive = true;
    hintButton.disabled = true;
    score -= 50; // 使用提示扣50分
    updateScoreDisplay();

    const allCards = document.querySelectorAll('.card:not(.matched)');
    allCards.forEach(card => {
        if (!card.classList.contains('flipped')) {
            card.classList.add('flipped');
            card.style.backgroundImage = `url(${card.dataset.value})`;
        }
    });

    setTimeout(() => {
        allCards.forEach(card => {
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped');
                card.style.backgroundImage = '';
            }
        });
        isHintActive = false;
        hintButton.disabled = false;
    }, 2000);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `积分: ${score}`;
}

function updateLevelDisplay() {
    levelDisplay.textContent = `关卡: ${level} (${gridSize}x${gridSize})`;
}

function updateRanking() {
    let rankings = JSON.parse(localStorage.getItem('rankings')) || [];
    rankings.push(score);
    rankings = [...new Set(rankings)].sort((a, b) => b - a).slice(0, 3);
    localStorage.setItem('rankings', JSON.stringify(rankings));
    displayRanking(rankings);
}

function displayRanking(rankings) {
    rankingList.innerHTML = '';
    rankings.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score} 分`;
        rankingList.appendChild(li);
    });
}

function resetGame() {
    updateRanking();
    score = 0;
    level = 1;
    gridSize = 2;
    initGame();
}

displayRanking(JSON.parse(localStorage.getItem('rankings')) || []);

restartButton.addEventListener('click', resetGame);
hintButton.addEventListener('click', showHint);

initGame();
