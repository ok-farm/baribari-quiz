// ゲーム定数
const WORDS = ["バリバリ", "パリパリ", "ハリハリ"];
const CORRECT_WORD = "バリバリ";
const WIN_SCORE = 3;
const GAME_TIME = 20;

// 音声オブジェクトの作成と設定
const sounds = {};

// 音声ファイルの初期化
const audioFiles = {
  "バリバリ": 'baribari-voice.mp3',
  "パリパリ": 'paripari-voice.mp3',
  "ハリハリ": 'harihari-voice.mp3'
};

// 各音声を初期化してボリュームを設定
Object.keys(audioFiles).forEach(key => {
  sounds[key] = new Audio(audioFiles[key]);
  sounds[key].volume = 0.07; // 7% volume
});

// スコアメッセージの更新
function updateScoreMessage(score) {
  const remaining = WIN_SCORE - score;
  const scoreElement = document.querySelector('.score');
  
  if (score >= WIN_SCORE) {
    scoreElement.textContent = 'やったね⚡️';
  } else {
    scoreElement.textContent = `バリバリを${remaining}つ集めろ⚡️`;
  }
}

// DOM要素
const elements = {
  eruptionArea: document.getElementById("eruption-area"),
  gobouImg: document.getElementById("gobou-img"),
  scoreSpan: document.getElementById("score"),
  timerSpan: document.getElementById("timer"),
  messageDiv: document.getElementById("message"),
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  clearScreen: document.getElementById("clear-screen"),
  coverImage: document.getElementById("cover-image"),
  restartBtn: document.getElementById("restart-btn")
};

// ゲーム状態
let gameState = {
  score: 0,
  timeLeft: GAME_TIME,
  gameActive: false,
  gameInterval: null,
  eruptionInterval: null
};

// 噴火ワード作成
function createEruptionWord() {
  if (!gameState.gameActive) return;
  
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const wordDiv = document.createElement("div");
  wordDiv.className = "eruption-word";
  wordDiv.textContent = word;
  
  // 初期位置を画像の上端中央に設定
  const gobouRect = elements.gobouImg.getBoundingClientRect();
  const startX = gobouRect.left + (gobouRect.width / 2);
  const startY = gobouRect.top;
  
  // ランダムな角度（-45度から45度の範囲）
  const angle = (Math.random() * 90) - 45; // -45度から45度
  const angleRad = angle * (Math.PI / 180); // ラジアンに変換
  
  // ランダムな距離（80vh）
  const distance = 80;
  
  // 終了位置を計算
  const endX = Math.sin(angleRad) * distance;
  const endY = -distance; // 上方向に移動
  
  wordDiv.style.left = startX + 'px';
  wordDiv.style.top = startY + 'px';
  
  // カスタムプロパティでアニメーションの終了点を設定
  wordDiv.style.setProperty('--end-x', `${endX}vh`);
  wordDiv.style.setProperty('--end-y', `${endY}vh`);
  
  // クリックイベント
  wordDiv.addEventListener("click", () => {
    if (!gameState.gameActive) return;
    
    checkWord(wordDiv, word);
    
    elements.scoreSpan.textContent = gameState.score;
  });
  
  // アニメーション終了時に要素を削除
  wordDiv.addEventListener("animationend", () => wordDiv.remove());
  
  elements.eruptionArea.appendChild(wordDiv);
}

function checkWord(wordElement, word) {
  // 対応する音声を再生
  if (sounds[word]) {
    const sound = sounds[word];
    sound.volume = 0.05; // 念のため再生時にもボリュームを設定
    sound.currentTime = 0;
    sound.play().catch(e => console.log("音声再生エラー:", e));
  }

  if (word === CORRECT_WORD) {
    // 正解の場合
    gameState.score++;
    updateScoreMessage(gameState.score);
    wordElement.remove();
    
    // クリア判定
    if (gameState.score >= WIN_SCORE) {
      endGame(true);
    }
  } else {
    // 不正解の場合
    gameState.score = Math.max(0, gameState.score - 1); // スコアを減点（0より下にはならない）
    updateScoreMessage(gameState.score); // スコア表示を更新
    wordElement.classList.add("incorrect");
    setTimeout(() => {
      wordElement.remove();
    }, 500);
  }
}

// メッセージ表示
function showMessage(msg) {
  elements.messageDiv.textContent = msg;
  elements.messageDiv.classList.add('show');
  
  // 既存のタイマーをクリア
  if (window.messageTimer) {
    clearTimeout(window.messageTimer);
  }
  
  // 新しいタイマーを設定
  window.messageTimer = setTimeout(() => {
    elements.messageDiv.classList.remove('show');
  }, 2000);
}

// タイマー開始
function startTimer() {
  elements.timerSpan.textContent = gameState.timeLeft;
  gameState.gameInterval = setInterval(() => {
    gameState.timeLeft--;
    elements.timerSpan.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

// 噴火開始
function startEruption() {
  // 1秒ごとに新しい単語を生成
  gameState.eruptionInterval = setInterval(createEruptionWord, 1000);
}

// ゲーム開始
function startGame() {
  console.log('startGame called'); // デバッグ用
  
  // ゲーム状態をリセット
  resetGame();
  
  // ゲーム状態をアクティブに
  gameState.gameActive = true;
  gameState.score = 0;
  gameState.timeLeft = GAME_TIME;
  
  // スクロールを無効化
  document.body.classList.add('game-active');
  
  // スコアメッセージを初期化
  const scoreElement = document.querySelector('.score');
  if (scoreElement) {
    scoreElement.textContent = `バリバリを${WIN_SCORE}つ集めろ⚡️`;
  }
  
  // タイマーを初期化
  if (elements.timerSpan) {
    elements.timerSpan.textContent = gameState.timeLeft;
  }
  
  // 画面表示を切り替え
  console.log('Switching screens...'); // デバッグ用
  
  // スタート画面とカバー画像を非表示
  if (elements.startScreen) elements.startScreen.style.display = 'none';
  if (elements.clearScreen) elements.clearScreen.style.display = 'none';
  if (elements.coverImage) elements.coverImage.style.display = 'none';
  
  // ゲーム画面を表示
  const gameScreen = document.getElementById('game-screen');
  if (gameScreen) {
    console.log('Showing game screen'); // デバッグ用
    gameScreen.style.display = 'flex';
  }
  
  // ゲーム要素を表示
  const gobouImg = document.getElementById('gobou-img');
  const eruptionArea = document.getElementById('eruption-area');
  
  if (gobouImg) gobouImg.style.display = 'block';
  if (eruptionArea) eruptionArea.style.display = 'block';
  
  // ゲーム開始
  startTimer();
  startEruption();
  
  console.log('Game started'); // デバッグ用
}

// ゲーム終了
function endGame(win) {
  clearInterval(gameState.eruptionInterval);
  clearInterval(gameState.gameInterval);
  
  // スクロールを有効化
  document.body.classList.remove('game-active');
  
  // 結果メッセージ
  showMessage(win ? "クリア！バリバリ達人！" : "時間切れ！また挑戦してね");
  
  // 2秒後にクリア画面またはゲームオーバー画面を表示
  setTimeout(() => {
    if (elements.messageDiv) elements.messageDiv.style.display = 'none';
    if (win) {
      showClearScreen();
    } else {
      if (elements.coverImage) elements.coverImage.style.display = 'block';
      if (elements.startScreen) elements.startScreen.style.display = 'flex';
      if (elements.gameScreen) elements.gameScreen.style.display = 'none';
      resetGame();
    }
  }, 2000);
}

function showClearScreen() {
  // ゲーム画面を非表示
  if (elements.gameScreen) elements.gameScreen.style.display = 'none';
  
  // クリア画面を表示
  const clearScreen = document.getElementById('clear-screen');
  if (clearScreen) {
    clearScreen.style.display = 'flex';
    // 画面の一番上にスクロール
    clearScreen.scrollTo(0, 0);
  }
  
  // 既存のイベントリスナーを削除してから追加（重複防止）
  if (elements.restartBtn) {
    const newRestartBtn = elements.restartBtn.cloneNode(true);
    elements.restartBtn.parentNode.replaceChild(newRestartBtn, elements.restartBtn);
    elements.restartBtn = newRestartBtn;
  }
  
  // 再開ボタンのイベントリスナーを設定
  elements.restartBtn.addEventListener('click', () => {
    elements.clearScreen.style.display = 'none';
    elements.coverImage.style.display = 'block';
    elements.startScreen.style.display = 'flex';
    resetGame();
  });
}

function resetGame() {
  console.log('Resetting game...');
  
  // ゲーム状態をリセット
  gameState = {
    score: 0,
    timeLeft: GAME_TIME,
    gameActive: false,
    timerId: null,
    eruptionInterval: null
  };
  
  // タイマーをクリア
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
  
  // 噴火エフェクトをクリア
  if (gameState.eruptionInterval) {
    clearInterval(gameState.eruptionInterval);
    gameState.eruptionInterval = null;
  }
  
  // 噴火ワードをクリア
  const eruptionArea = document.getElementById('eruption-area');
  if (eruptionArea) {
    eruptionArea.innerHTML = '';
  }
  
  // メッセージをクリア
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.textContent = '';
  }
  
  // スコア表示をリセット
  const scoreElement = document.querySelector('.score');
  if (scoreElement) {
    scoreElement.textContent = `バリバリを${WIN_SCORE}つ集めろ⚡️`;
  }
  
  // タイマー表示をリセット
  const timerSpan = document.getElementById('timer');
  if (timerSpan) {
    timerSpan.textContent = GAME_TIME;
  }
  
  console.log('Game reset complete');
}

// 初期表示
window.addEventListener("DOMContentLoaded", () => {
  console.log('DOM fully loaded'); // デバッグ用
  
  // 要素の参照を確実に取得
  const getElement = (id) => {
    const el = document.getElementById(id);
    if (!el) console.error(`Element with id '${id}' not found`);
    return el;
  };
  
  // 要素の参照を更新
  elements.eruptionArea = getElement("eruption-area");
  elements.gobouImg = getElement("gobou-img");
  elements.timerSpan = getElement("timer");
  elements.messageDiv = getElement("message");
  elements.startScreen = getElement("start-screen");
  elements.clearScreen = getElement("clear-screen");
  elements.coverImage = getElement("cover-image");
  elements.restartBtn = getElement("restart-btn");
  
  // 初期表示を設定
  console.log('Initializing display...'); // デバッグ用
  
  // ゲーム要素を非表示
  const gobouImg = document.getElementById('gobou-img');
  const eruptionArea = document.getElementById('eruption-area');
  const gameScreen = document.getElementById('game-screen');
  
  if (gobouImg) gobouImg.style.display = 'none';
  if (eruptionArea) eruptionArea.style.display = 'none';
  if (gameScreen) gameScreen.style.display = 'none';
  
  // スタート画面を表示
  const startScreen = document.getElementById('start-screen');
  const coverImage = document.getElementById('cover-image');
  
  if (startScreen) startScreen.style.display = 'flex';
  if (coverImage) coverImage.style.display = 'flex';
  
  // クリア画面を非表示
  const clearScreen = document.getElementById('clear-screen');
  if (clearScreen) clearScreen.style.display = 'none';
  
  // ゲーム状態の初期化
  resetGame();
  
  // スタートボタンイベント
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startGame();
    });
  }
  
  // リスタートボタンイベント
  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetGame();
      if (elements.clearScreen) elements.clearScreen.style.display = "none";
      if (elements.coverImage) elements.coverImage.style.display = "flex";
      if (elements.startScreen) elements.startScreen.style.display = "flex";
    });
  }
});

