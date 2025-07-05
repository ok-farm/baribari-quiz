// ゲーム定数
const WORDS = ["バリバリ", "パリパリ", "ハリハリ"];
const CORRECT_WORD = "バリバリ";
const WIN_SCORE = 3;
const GAME_TIME = 20;

// スコアメッセージの更新
function updateScoreMessage(score) {
  const remaining = WIN_SCORE - score;
  const remainingSpan = document.getElementById('remaining');
  if (remaining > 0) {
    remainingSpan.textContent = `${remaining}集めろ⚡️`;
  } else {
    remainingSpan.textContent = 'やったね⚡️';
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
  // ゲーム状態をリセット
  resetGame();
  
  // ゲーム状態をアクティブに
  gameState.gameActive = true;
  
  // スコアメッセージを初期化
  updateScoreMessage(0);
  
  // UIを更新
  elements.scoreSpan.textContent = gameState.score;
  elements.timerSpan.textContent = gameState.timeLeft;
  
  // 画面表示を切り替え
  elements.startScreen.style.display = 'none';
  elements.clearScreen.style.display = 'none';
  elements.coverImage.style.display = 'none';
  elements.gameScreen.style.display = 'block';
  elements.gobouImg.style.display = 'block';
  elements.eruptionArea.style.display = 'block';
  
  // ゲーム開始
  startTimer();
  startEruption();
}

// ゲーム終了
function endGame(win) {
  clearInterval(gameState.eruptionInterval);
  clearInterval(gameState.gameInterval);
  
  // 結果メッセージ
  showMessage(win ? "クリア！バリバリ達人！" : "時間切れ！また挑戦してね");
  
  // 2秒後にクリア画面またはゲームオーバー画面を表示
  setTimeout(() => {
    elements.messageDiv.style.display = 'none';
    if (win) {
      showClearScreen();
    } else {
      elements.coverImage.style.display = 'block';
      elements.startScreen.style.display = 'flex';
      elements.gameScreen.style.display = 'none';
      resetGame();
    }
  }, 2000);
}

function showClearScreen() {
  elements.gameScreen.style.display = 'none';
  elements.clearScreen.style.display = 'flex';
  
  // 既存のイベントリスナーを削除してから追加（重複防止）
  const newRestartBtn = elements.restartBtn.cloneNode(true);
  elements.restartBtn.parentNode.replaceChild(newRestartBtn, elements.restartBtn);
  elements.restartBtn = newRestartBtn;
  
  // 再開ボタンのイベントリスナーを設定
  elements.restartBtn.addEventListener('click', () => {
    elements.clearScreen.style.display = 'none';
    elements.coverImage.style.display = 'block';
    elements.startScreen.style.display = 'flex';
    resetGame();
  });
}

function resetGame() {
  // ゲーム状態をリセット
  gameState = {
    score: 0,
    timeLeft: GAME_TIME,
    gameActive: false,
    gameInterval: null,
    eruptionInterval: null
  };
  
  // UIをリセット
  if (elements.scoreSpan) elements.scoreSpan.textContent = gameState.score;
  if (elements.timerSpan) elements.timerSpan.textContent = gameState.timeLeft;
  if (elements.eruptionArea) {
    elements.eruptionArea.innerHTML = '';
    elements.eruptionArea.style.display = 'none';
  }
  
  // メッセージをクリア
  if (elements.messageDiv) {
    elements.messageDiv.textContent = '';
    elements.messageDiv.style.display = 'none';
    elements.messageDiv.className = '';
  }
  
  // すべてのインターバルをクリア
  clearInterval(gameState.gameInterval);
  clearInterval(gameState.eruptionInterval);
}

// 初期表示
window.addEventListener("DOMContentLoaded", () => {
  // ゲーム状態の初期化
  resetGame();
  
  // 初期表示の設定
  elements.coverImage = document.getElementById("cover-image");
  elements.startScreen = document.getElementById("start-screen");
  elements.gameScreen = document.getElementById("game-screen");
  elements.clearScreen = document.getElementById("clear-screen");
  elements.gobouImg = document.getElementById("gobou-img");
  elements.eruptionArea = document.getElementById("eruption-area");
  
  // 初期表示を設定
  elements.gobouImg.style.display = "none";
  elements.eruptionArea.style.display = "none";
  elements.coverImage.style.display = "flex";
  elements.startScreen.style.display = "flex";
  elements.gameScreen.style.display = "none";
  elements.clearScreen.style.display = "none";
  
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
      elements.clearScreen.style.display = "none";
      elements.coverImage.style.display = "flex";
      elements.startScreen.style.display = "flex";
    });
  }
});

