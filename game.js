// ゲーム定数
const WORDS = ["バリバリ", "パリパリ", "ハリハリ"];
const CORRECT_WORD = "バリバリ";
const WIN_SCORE = 3;
const GAME_TIME = 10;

// DOM要素
const elements = {
  eruptionArea: document.getElementById("eruption-area"),
  gobouImg: document.getElementById("gobou-img"),
  scoreSpan: document.getElementById("score"),
  timerSpan: document.getElementById("timer"),
  messageDiv: document.getElementById("message"),
  startScreen: document.getElementById("start-screen"),
  coverImage: document.getElementById("cover-image")
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
    
    if (word === CORRECT_WORD) {
      gameState.score++;
      showMessage("正解！バリバリ！");
    } else {
      gameState.score = Math.max(0, gameState.score - 1);
      showMessage("違うよ！スコア-1");
    }
    
    elements.scoreSpan.textContent = gameState.score;
    wordDiv.remove();
    
    if (gameState.score >= WIN_SCORE) {
      endGame(true);
    }
  });
  
  // アニメーション終了時に要素を削除
  wordDiv.addEventListener("animationend", () => wordDiv.remove());
  
  elements.eruptionArea.appendChild(wordDiv);
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
  // 状態リセット
  gameState = {
    score: 0,
    timeLeft: GAME_TIME,
    gameActive: true,
    gameInterval: null,
    eruptionInterval: null
  };
  
  // UIリセット
  elements.scoreSpan.textContent = "0";
  elements.timerSpan.textContent = GAME_TIME;
  elements.messageDiv.textContent = "";
  elements.eruptionArea.innerHTML = "";
  
  // ゲーム画面表示
  elements.gobouImg.style.display = "block";
  elements.eruptionArea.style.display = "block";
  elements.coverImage.style.display = "none";
  elements.startScreen.style.display = "none";
  
  // ゲーム開始
  startTimer();
  startEruption();
}

// ゲーム終了
function endGame(win) {
  gameState.gameActive = false;
  clearInterval(gameState.gameInterval);
  clearInterval(gameState.eruptionInterval);
  
  // 結果メッセージ
  showMessage(win ? "クリア！バリバリ達人！" : "時間切れ！また挑戦してね");
  
  // 2秒後にスタート画面に戻る
  setTimeout(() => {
    elements.eruptionArea.innerHTML = "";
    elements.gobouImg.style.display = "none";
    elements.eruptionArea.style.display = "none";
    elements.coverImage.style.display = "flex";
    elements.startScreen.style.display = "flex";
  }, 1200);
}

// 初期表示
window.addEventListener("DOMContentLoaded", () => {
  elements.gobouImg.style.display = "none";
  elements.eruptionArea.style.display = "none";
  elements.coverImage.style.display = "flex";
  elements.startScreen.style.display = "flex";
  
  // スタートボタンイベント（DOM読み込み後に設定）
  document.getElementById("start-btn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startGame();
  });
});


