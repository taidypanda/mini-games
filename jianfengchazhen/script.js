const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart');
const nextLevelButton = document.getElementById('nextLevel');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const needleCountDisplay = document.getElementById('needleCount');

let score = 0;
let level = 1;
let gameOver = false;
let levelComplete = false;
let centerX, centerY;
const discRadius = 100;
let rotationSpeed = 0.02; // 降低初始转速
let discAngle = 0;
let needles = [];
let pendingNeedle;
const needleLength = 50;
const needleWidth = 4;
const baseNeedlesPerLevel = 3;

// 动态设置画布尺寸
canvas.width = Math.min(window.innerWidth - 20, 400);
canvas.height = 600;

// 计算中心点
centerX = canvas.width / 2;
centerY = canvas.height / 2 - 50;
pendingNeedle = { y: canvas.height - 50, active: false };

function initGame() {
    score = 0;
    level = 1;
    gameOver = false;
    levelComplete = false;
    rotationSpeed = 0.02; // 初始转速
    discAngle = 0;
    needles = [];
    pendingNeedle = { y: canvas.height - 50, active: false };
    nextLevelButton.style.display = 'none';
    updateScore();
    updateLevel();
    updateNeedleCount();
    animate();
}

function nextLevel() {
    level++;
    score += 10;
    rotationSpeed += 0.005; // 每关转速缓慢增加
    needles = [];
    pendingNeedle = { y: canvas.height - 50, active: false };
    levelComplete = false;
    nextLevelButton.style.display = 'none';
    updateScore();
    updateLevel();
    updateNeedleCount();
    animate();
}

function drawDisc() {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(discAngle);
    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(discRadius / 2, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

function drawNeedle(angle, color = '#e74c3c') {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(discAngle + angle);
    ctx.fillStyle = color;
    ctx.fillRect(-needleWidth / 2, discRadius, needleWidth, needleLength);
    ctx.restore();
}

function drawPendingNeedle() {
    if (!pendingNeedle.active) {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(centerX - needleWidth / 2, pendingNeedle.y, needleWidth, needleLength);
    } else {
        let y = pendingNeedle.y;
        pendingNeedle.y -= 10;
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(centerX - needleWidth / 2, y, needleWidth, needleLength);
        if (y <= centerY + discRadius) {
            checkCollision();
        }
    }
}

function checkCollision() {
    const newAngle = -discAngle;
    for (let needle of needles) {
        let needleAngle = (needle.angle + discAngle) % (Math.PI * 2);
        if (needleAngle < 0) needleAngle += Math.PI * 2;
        let adjustedNewAngle = (newAngle + discAngle) % (Math.PI * 2);
        if (adjustedNewAngle < 0) adjustedNewAngle += Math.PI * 2;
        let angleDiff = Math.abs(needleAngle - adjustedNewAngle);
        angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        if (angleDiff < 0.05) {
            gameOver = true;
            alert(`游戏结束！积分: ${score}`);
            return;
        }
    }
    needles.push({ angle: newAngle });
    score++;
    const needlesToPass = baseNeedlesPerLevel + (level - 1);
    if (needles.length >= needlesToPass) {
        levelComplete = true;
        nextLevelButton.style.display = 'block';
    }
    pendingNeedle = { y: canvas.height - 50, active: false };
    updateScore();
    updateNeedleCount();
}

function updateScore() {
    scoreDisplay.textContent = `积分: ${score}`;
}

function updateLevel() {
    levelDisplay.textContent = `关卡: ${level}`;
}

function updateNeedleCount() {
    const needlesToPass = baseNeedlesPerLevel + (level - 1);
    const remainingNeedles = needlesToPass - needles.length;
    needleCountDisplay.textContent = `总共针数: ${needlesToPass} / 剩余针数: ${remainingNeedles >= 0 ? remainingNeedles : 0}`;
}

function animate() {
    if (gameOver || levelComplete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    discAngle += rotationSpeed;
    if (discAngle > Math.PI * 2) discAngle -= Math.PI * 2;

    drawDisc();

    for (let needle of needles) {
        drawNeedle(needle.angle);
    }

    drawPendingNeedle();
    requestAnimationFrame(animate);
}

canvas.addEventListener('click', () => {
    if (!gameOver && !levelComplete && !pendingNeedle.active) {
        pendingNeedle.active = true;
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameOver && !levelComplete && !pendingNeedle.active) {
        pendingNeedle.active = true;
    }
});

restartButton.addEventListener('click', initGame);
nextLevelButton.addEventListener('click', nextLevel);

initGame();
