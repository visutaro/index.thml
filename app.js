// 設定
let SCRIPT_URL = localStorage.getItem('scriptUrl') || '';

// Tab切り替え
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ===== 25Tap Game =====
let gameNumbers = [];
let currentNumber = 1;
let startTime = null;
let timerInterval = null;
let roundTimes = [];
let currentRound = 0;
const MAX_ROUNDS = 3;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateRoundDisplay() {
    const resultsDiv = document.getElementById('roundResults');
    resultsDiv.innerHTML = '';
    
    if (roundTimes.length > 0) {
        const bestTime = Math.min(...roundTimes);
        roundTimes.forEach((time, index) => {
            const div = document.createElement('div');
            div.className = 'round-item';
            div.innerHTML = `
                <span class="round-label">${index + 1}回目</span>
                <span class="round-time ${time === bestTime ? 'best' : ''}">${time}秒${time === bestTime ? ' 🏆' : ''}</span>
            `;
            resultsDiv.appendChild(div);
        });
    }
}

function startNewRound() {
    currentRound++;
    document.getElementById('roundNumber').textContent = `${currentRound}/${MAX_ROUNDS}`;
    
    gameNumbers = shuffleArray([...Array(25)].map((_, i) => i + 1));
    currentNumber = 1;
    document.getElementById('nextNumber').textContent = currentNumber;
    
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    
    gameNumbers.forEach(num => {
        const cell = document.createElement('div');
        cell.className = 'game-cell';
        cell.textContent = num;
        cell.addEventListener('click', () => handleCellClick(num, cell));
        grid.appendChild(cell);
    });

    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 10);
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    document.getElementById('gameTime').textContent = elapsed;
}

function handleCellClick(num, cell) {
    if (num === currentNumber) {
        cell.classList.add('found');
        
        if (currentNumber === 25) {
            clearInterval(timerInterval);
            const finalTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
            roundTimes.push(finalTime);
            updateRoundDisplay();
            
            if (currentRound >= MAX_ROUNDS) {
                // 3回終了
                document.getElementById('startGameBtn').style.display = 'none';
                document.getElementById('recordGameBtn').style.display = 'block';
            } else {
                // 次のラウンドを自動開始
                setTimeout(() => {
                    startNewRound();
                }, 1000);
            }
        } else {
            currentNumber++;
            document.getElementById('nextNumber').textContent = currentNumber;
        }
    }
}

document.getElementById('startGameBtn').addEventListener('click', () => {
    roundTimes = [];
    currentRound = 0;
    document.getElementById('roundResults').innerHTML = '';
    document.getElementById('recordGameBtn').style.display = 'none';
    startNewRound();
});

document.getElementById('recordGameBtn').addEventListener('click', () => {
    const bestTime = Math.min(...roundTimes);
    showRecordModal('25Tap', bestTime);
});

// ===== HIIT =====
let hiitSets = 0;

document.getElementById('setsUp').addEventListener('click', () => {
    hiitSets++;
    document.getElementById('setsCount').textContent = hiitSets;
});

document.getElementById('setsDown').addEventListener('click', () => {
    if (hiitSets > 0) {
        hiitSets--;
        document.getElementById('setsCount').textContent = hiitSets;
    }
});

document.getElementById('completeHiit').addEventListener('click', () => {
    if (hiitSets > 0) {
        showRecordModal('HIIT', hiitSets);
    } else {
        alert('セット数を入力してください');
    }
});

// ===== 瞑想タイマー =====
let meditationTime = 0;
let meditationInterval = null;
let meditationStartTime = null;
let useSound = true;
let useVibrate = false;

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        meditationTime = parseInt(btn.dataset.minutes) * 60;
        updateTimerDisplay();
    });
});

document.getElementById('soundToggle').addEventListener('click', function() {
    useSound = !useSound;
    this.classList.toggle('active');
    if (useSound && useVibrate) {
        useVibrate = false;
        document.getElementById('vibrateToggle').classList.remove('active');
    }
});

document.getElementById('vibrateToggle').addEventListener('click', function() {
    useVibrate = !useVibrate;
    this.classList.toggle('active');
    if (useVibrate && useSound) {
        useSound = false;
        document.getElementById('soundToggle').classList.remove('active');
    }
});

function updateTimerDisplay() {
    const minutes = Math.floor(meditationTime / 60);
    const seconds = meditationTime % 60;
    document.getElementById('timerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

document.getElementById('startTimer').addEventListener('click', () => {
    if (meditationTime > 0 && !meditationInterval) {
        meditationStartTime = Date.now();
        meditationInterval = setInterval(() => {
            meditationTime--;
            updateTimerDisplay();
            
            if (meditationTime <= 0) {
                clearInterval(meditationInterval);
                meditationInterval = null;
                notifyComplete();
                const duration = Math.round((Date.now() - meditationStartTime) / 1000 / 60);
                showRecordModal('瞑想', duration);
            }
        }, 1000);
    }
});

document.getElementById('stopTimer').addEventListener('click', () => {
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
        if (meditationStartTime) {
            const duration = Math.round((Date.now() - meditationStartTime) / 1000 / 60);
            if (duration > 0) {
                showRecordModal('瞑想', duration);
            }
        }
    }
});

function notifyComplete() {
    if (useSound) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                oscillator.start();
                oscillator.stop(context.currentTime + 0.2);
            }, i * 300);
        }
    }
    
    if (useVibrate && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

// ===== 設定 =====
document.getElementById('saveSettings').addEventListener('click', () => {
    const scriptUrl = document.getElementById('scriptUrl').value;
    const hiitUrl = document.getElementById('hiitUrl').value;
    
    if (scriptUrl) {
        SCRIPT_URL = scriptUrl;
        localStorage.setItem('scriptUrl', scriptUrl);
    }
    
    if (hiitUrl) {
        localStorage.setItem('hiitUrl', hiitUrl);
        loadHiitVideo();
    }
    
    alert('保存しました');
});

function loadSettings() {
    const scriptUrl = localStorage.getItem('scriptUrl');
    const hiitUrl = localStorage.getItem('hiitUrl');
    
    if (scriptUrl) {
        SCRIPT_URL = scriptUrl;
        document.getElementById('scriptUrl').value = scriptUrl;
    }
    
    if (hiitUrl) {
        document.getElementById('hiitUrl').value = hiitUrl;
        loadHiitVideo();
    }
}

function loadHiitVideo() {
    const url = localStorage.getItem('hiitUrl');
    if (url) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            document.getElementById('videoContainer').innerHTML = 
                `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        }
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ===== 記録Modal =====
let currentActivity = null;
let currentResult = null;

function showRecordModal(activity, result) {
    if (!SCRIPT_URL) {
        alert('設定画面でスプレッドシートURLを入力してください');
        return;
    }
    
    currentActivity = activity;
    currentResult = result;
    
    document.getElementById('modalTitle').textContent = `${activity}の記録`;
    
    const resultDisplay = document.getElementById('resultDisplay');
    const resultValue = document.getElementById('resultValue');
    const resultLabel = document.getElementById('resultLabel');
    
    resultDisplay.style.display = 'block';
    
    if (activity === '25Tap') {
        resultValue.textContent = `${result}秒`;
        resultLabel.textContent = 'ベストタイム';
    } else if (activity === 'HIIT') {
        resultValue.textContent = `${result}セット`;
        resultLabel.textContent = '完了';
    } else if (activity === '瞑想') {
        resultValue.textContent = `${result}分`;
        resultLabel.textContent = '瞑想時間';
    }
    
    const moodGroup = document.getElementById('moodGroup');
    if (activity === '瞑想') {
        moodGroup.style.display = 'block';
        initRatingButtons('moodRating', 5);
    } else {
        moodGroup.style.display = 'none';
    }
    
    initRatingButtons('conditionRating', 5);
    document.getElementById('memoText').value = '';
    document.getElementById('recordModal').classList.add('active');
}

function initRatingButtons(containerId, max) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 1; i <= max; i++) {
        const btn = document.createElement('button');
        btn.className = 'rating-btn';
        btn.textContent = i;
        btn.addEventListener('click', function() {
            container.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
        container.appendChild(btn);
    }
}

document.getElementById('cancelRecord').addEventListener('click', () => {
    document.getElementById('recordModal').classList.remove('active');
});

document.getElementById('saveRecord').addEventListener('click', async () => {
    const condition = document.querySelector('#conditionRating .rating-btn.selected')?.textContent;
    
    if (!condition) {
        alert('体調を選択してください');
        return;
    }
    
    const now = new Date();
    const date = now.toLocaleDateString('ja-JP');
    const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const memo = document.getElementById('memoText').value;
    
    let data = {
        date: date,
        time: time,
        condition: condition,
        memo: memo
    };
    
    if (currentActivity === '25Tap') {
        data.type = '25Tap';
        data.score = currentResult;
    } else if (currentActivity === 'HIIT') {
        data.type = 'HIIT';
        data.sets = currentResult;
    } else if (currentActivity === '瞑想') {
        const mood = document.querySelector('#moodRating .rating-btn.selected')?.textContent;
        if (!mood) {
            alert('瞑想後の気分を選択してください');
            return;
        }
        data.type = '瞑想';
        data.mood = mood;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        alert('記録を保存しました！');
        document.getElementById('recordModal').classList.remove('active');
        
        // リセット
        if (currentActivity === '25Tap') {
            roundTimes = [];
            currentRound = 0;
            document.getElementById('roundNumber').textContent = '0/3';
            document.getElementById('nextNumber').textContent = '-';
            document.getElementById('gameTime').textContent = '0.00';
            document.getElementById('roundResults').innerHTML = '';
            document.getElementById('gameGrid').innerHTML = '';
            document.getElementById('startGameBtn').style.display = 'block';
            document.getElementById('recordGameBtn').style.display = 'none';
        } else if (currentActivity === 'HIIT') {
            hiitSets = 0;
            document.getElementById('setsCount').textContent = 0;
        } else if (currentActivity === '瞑想') {
            meditationTime = 0;
            updateTimerDisplay();
        }
    } catch (error) {
        alert('記録の保存に失敗しました');
        console.error(error);
    }
});

// 初期化
loadSettings();
