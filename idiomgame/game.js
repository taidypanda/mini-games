const backToHomeButton = document.getElementById('backToHome');

// 加载 JSON 词库
fetch('idiom.json')
    .then(response => response.json())
    .then(data => {
        const idioms = data.map(item => ({
            ...item,
            blanks: [] // 初始为空，后面根据难度动态生成
        }));
        initGame(idioms);
    });

// 游戏状态
let allIdioms = [];
let currentIdiomIndex = 0;
let score = 0;
let currentBlanks = [];
let filledBlanks = {};
let timeLeft = 30;
let timerId = null;
let currentMode = "normal";
let currentDifficulty = "medium";
let lastWord = null; // 用于成语接龙

// DOM 元素
const modeSelect = document.getElementById("mode-select");
const difficultySelect = document.getElementById("difficulty-select");
const idiomDiv = document.getElementById("idiom");
const hintTextDiv = document.getElementById("hint-text");
const optionsDiv = document.getElementById("options");
const hintBtn = document.getElementById("hint-btn");
const scoreDiv = document.getElementById("score");
const timerDiv = document.getElementById("timer");
const messageDiv = document.getElementById("message");

// 初始化游戏
function initGame(idioms) {
    allIdioms = idioms;
    currentMode = modeSelect.value;
    currentDifficulty = difficultySelect.value;
    modeSelect.onchange = () => resetGame();
    difficultySelect.onchange = () => resetGame();
    resetGame();
}

// 重置游戏
function resetGame() {
    const idiom = getNextIdiom();
    const blankCount = currentDifficulty === "easy" ? 1 : currentDifficulty === "medium" ? 2 : 3;
    idiom.blanks = getRandomBlanks(idiom.word.length, blankCount);
    currentBlanks = idiom.blanks.slice();
    filledBlanks = {};
    timeLeft = 30;
    clearInterval(timerId);
    timerId = setInterval(updateTimer, 1000);
    displayIdiom(idiom);
    displayOptions(idiom);
    updateScore();
    updateTimer();
    messageDiv.textContent = "";
}

// 获取下一个成语
function getNextIdiom() {
    if (currentMode === "dragon" && lastWord) {
        const candidates = allIdioms.filter(i => i.first === lastWord);
        if (candidates.length > 0) {
            currentIdiomIndex = allIdioms.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
        } else {
            currentIdiomIndex = Math.floor(Math.random() * allIdioms.length); // 无匹配时随机
        }
    } else {
        currentIdiomIndex = Math.floor(Math.random() * allIdioms.length);
    }
    return allIdioms[currentIdiomIndex];
}

// 显示成语或提示信息
function displayIdiom(idiom) {
    idiomDiv.innerHTML = "";
    hintTextDiv.textContent = "";
    if (currentMode === "normal") {
        for (let i = 0; i < idiom.word.length; i++) {
            if (idiom.blanks.includes(i)) {
                const blank = document.createElement("span");
                blank.className = "blank";
                blank.id = `blank-${i}`;
                if (filledBlanks[i]) {
                    blank.textContent = filledBlanks[i];
                    blank.classList.add("filled");
                }
                idiomDiv.appendChild(blank);
            } else {
                idiomDiv.appendChild(document.createTextNode(idiom.word[i]));
            }
        }
    } else if (currentMode === "pinyin") {
        hintTextDiv.textContent = idiom.pinyin;
        displayBlanks(idiom);
    } else if (currentMode === "meaning") {
        hintTextDiv.textContent = idiom.explanation;
        displayBlanks(idiom);
    } else if (currentMode === "dragon") {
        hintTextDiv.textContent = lastWord ? `接龙：上一成语“${allIdioms.find(i => i.last === lastWord)?.word}”，请以“${lastWord}”开头` : "接龙：任意开始";
        displayBlanks(idiom);
    }
}

// 显示空格
function displayBlanks(idiom) {
    for (let i = 0; i < idiom.word.length; i++) {
        const blank = document.createElement("span");
        blank.className = "blank";
        blank.id = `blank-${i}`;
        if (filledBlanks[i]) {
            blank.textContent = filledBlanks[i];
            blank.classList.add("filled");
        }
        idiomDiv.appendChild(blank);
    }
}

// 显示候选字
function displayOptions(idiom) {
    optionsDiv.innerHTML = "";
    const chars = generateOptions(idiom);
    chars.forEach(char => {
        const option = document.createElement("div");
        option.className = "option";
        option.textContent = char;
        option.onclick = () => selectChar(char, idiom);
        optionsDiv.appendChild(option);
    });
}

// 生成候选字
function generateOptions(idiom) {
    const correctChars = idiom.blanks.map(i => idiom.word[i]);
    const allChars = idiom.word + "天地人你我他风吹草动画龙点睛"; // 可替换为更大的字符池
    let options = [...correctChars];
    while (options.length < 10) {
        const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
        if (!options.includes(randomChar)) options.push(randomChar);
    }
    return shuffle(options);
}

// 选择字符
function selectChar(char, idiom) {
    for (let i = 0; i < currentBlanks.length; i++) {
        const pos = currentBlanks[i];
        if (!filledBlanks[pos]) {
            filledBlanks[pos] = char;
            displayIdiom(idiom);
            if (char === idiom.word[pos]) {
                score += 10;
                currentBlanks.splice(i, 1);
                if (currentBlanks.length === 0) {
                    if (currentMode === "dragon" && idiom.first !== lastWord && lastWord !== null) {
                        score -= 20;
                        messageDiv.textContent = "接龙失败，未以正确字开头，扣20分！";
                        setTimeout(resetGame, 1000);
                    } else {
                        lastWord = idiom.last;
                        messageDiv.textContent = "恭喜过关！";
                        clearInterval(timerId);
                        setTimeout(resetGame, 1000);
                    }
                }
            } else {
                score -= 5;
                messageDiv.textContent = "选错了，扣5分！";
                setTimeout(() => {
                    delete filledBlanks[pos];
                    displayIdiom(idiom);
                    messageDiv.textContent = "";
                }, 500);
            }
            updateScore();
            break;
        }
    }
}

// 提示功能
hintBtn.onclick = () => {
    const idiom = allIdioms[currentIdiomIndex];
    for (let pos of idiom.blanks) {
        if (!filledBlanks[pos]) {
            const blank = document.getElementById(`blank-${pos}`);
            blank.classList.add("highlight");
            setTimeout(() => blank.classList.remove("highlight"), 1000);
            if (currentMode === "pinyin") {
                messageDiv.textContent = `提示：${idiom.explanation}`;
            } else if (currentMode === "meaning" || currentMode === "dragon") {
                messageDiv.textContent = `提示：${idiom.pinyin}`;
            } else {
                messageDiv.textContent = `提示：${idiom.explanation}`;
            }
            setTimeout(() => messageDiv.textContent = "", 2000);
            break;
        }
    }
};

// 更新得分
function updateScore() {
    scoreDiv.textContent = `得分: ${score}`;
}

// 更新计时器
function updateTimer() {
    timerDiv.textContent = `剩余时间: ${timeLeft}s`;
    timeLeft--;
    if (timeLeft < 0) {
        clearInterval(timerId);
        messageDiv.textContent = "时间到，游戏结束！";
        setTimeout(resetGame, 2000);
    }
}

// 随机选择空位
function getRandomBlanks(length, count) {
    const indices = Array.from({ length }, (_, i) => i);
    return shuffle(indices).slice(0, count);
}

// 随机打乱数组
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

backToHomeButton.addEventListener('click', () => {
    window.location.href = '../index.html'; // 跳转到小游戏列表页面
});
