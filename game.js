// ゲーム定数
const WORDS = ["バリバリ", "パリパリ", "ハリハリ"];
const CORRECT_WORD = "バリバリ";
const WIN_SCORE = 3;
const GAME_TIME = 20;

// Web Audio APIのセットアップ
let audioContext = null;
let gainNode = null;
const audioBuffers = new Map();

// 音声ファイルのパス
const audioFiles = {
  "バリバリ": 'baribari-voice.mp3',
  "パリパリ": 'paripari-voice.mp3',
  "ハリハリ": 'harihari-voice.mp3'
};

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  // ユーザーが最初にページを操作したときに音声を初期化
  const initOnFirstInteraction = () => {
    // 既に初期化済みの場合は何もしない
    if (window.audioInitialized) return;
    window.audioInitialized = true;
    
    console.log('First user interaction detected');
    
    // モバイル向けにタッチイベントを無効化（スクロールを防ぐ）
    document.body.style.touchAction = 'manipulation';
    
    // 音声コンテキストを初期化
    initAudioContext();
    
    // タッチイベントをキャンセル
    return false;
  };
  
  // モバイル対応: タッチスタートとタッチエンドで初期化を試みる
  const touchEvents = ['touchstart', 'touchend', 'click'];
  touchEvents.forEach(event => {
    document.addEventListener(event, initOnFirstInteraction, {
      capture: true,
      passive: false,
      once: true
    });
  });
  
  // スタートボタンでも初期化を試みる
  if (elements.startBtn) {
    elements.startBtn.addEventListener('touchstart', initOnFirstInteraction, { once: true });
  }
});

// オーディオコンテキストを初期化
function initAudioContext() {
  if (audioContext) return;
  
  try {
    // オーディオコンテキストを作成
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    
    // ゲインノードを作成して接続
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.07; // 7% volume
    gainNode.connect(audioContext.destination);
    
    console.log('AudioContext initialized');
    
    // 音声ファイルをプリロード
    preloadAudioFiles();
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
}

// 音声ファイルをプリロード
async function preloadAudioFiles() {
  if (!audioContext) {
    console.warn('Cannot preload audio: AudioContext not initialized');
    return Promise.resolve();
  }
  
  console.log('Starting to preload audio files...');
  
  try {
    // すべての音声ファイルを並列に読み込む
    await Promise.all(
      Object.entries(audioFiles).map(async ([key, url]) => {
        try {
          // 既にロード済みの場合はスキップ
          if (audioBuffers.has(key)) {
            console.log(`Already loaded: ${key}`);
            return;
          }
          
          console.log(`Loading: ${url}`);
          
          // 音声ファイルをフェッチ
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} loading ${url}`);
          }
          
          // バイナリデータを取得してデコード
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // メモリに保存
          audioBuffers.set(key, audioBuffer);
          console.log(`✅ Successfully loaded: ${key}`);
          
          return audioBuffer;
        } catch (error) {
          console.error(`❌ Error loading ${url}:`, error);
          throw error; // エラーを再スローして呼び出し元で処理できるようにする
        }
      })
    );
    
    console.log('✅ All audio files loaded successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Error in preloadAudioFiles:', error);
    return Promise.reject(error);
  }
}

// 音声を再生する関数
function playSound(key, attempt = 1) {
  // 最大リトライ回数を超えたら諦める
  const MAX_ATTEMPTS = 3;
  if (attempt > MAX_ATTEMPTS) {
    console.warn(`Max play attempts (${MAX_ATTEMPTS}) reached for sound: ${key}`);
    return;
  }
  
  // オーディオコンテキストが一時停止状態の場合は再開を試みる
  if (audioContext && audioContext.state === 'suspended') {
    console.log('AudioContext is suspended, attempting to resume...');
    audioContext.resume()
      .then(() => {
        console.log('AudioContext resumed successfully, retrying playback...');
        playSound(key, attempt + 1);
      })
      .catch(error => {
        console.error('Failed to resume AudioContext:', error);
        // リトライ
        if (attempt < MAX_ATTEMPTS) {
          console.log(`Retrying playback (${attempt + 1}/${MAX_ATTEMPTS})...`);
          setTimeout(() => playSound(key, attempt + 1), 300 * attempt);
        }
      });
    return;
  }
  
  // オーディオコンテキストが初期化されていない場合は初期化を試みる
  if (!audioContext) {
    console.warn('AudioContext not initialized, trying to initialize...');
    initAudioContext();
    
    // 少し待ってから再試行
    setTimeout(() => playSound(key, attempt + 1), 300);
    return;
  }
  
  // オーディオバッファが読み込まれていない場合はスキップ
  const buffer = audioBuffers.get(key);
  if (!buffer) {
    console.warn(`Audio buffer not loaded: ${key}`);
    
    // ファイルの再読み込みを試みる
    if (attempt === 1) {
      console.log('Attempting to reload audio files...');
      preloadAudioFiles().then(() => {
        setTimeout(() => playSound(key, attempt + 1), 300);
      });
    }
    return;
  }
  
  try {
    // 新しい音源ノードを作成
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // ゲインノードに接続
    source.connect(gainNode);
    
    // 再生終了時のクリーンアップ
    source.onended = () => {
      console.log(`Playback finished: ${key}`);
      try {
        source.disconnect();
      } catch (e) {
        console.warn('Error during source cleanup:', e);
      }
    };
    
    // エラーハンドリング
    source.onerror = (error) => {
      console.error('Error during playback:', error);
      try {
        source.disconnect();
      } catch (e) {
        console.warn('Error during error handling:', e);
      }
      
      // リトライ
      if (attempt < MAX_ATTEMPTS) {
        console.log(`Retrying playback after error (${attempt + 1}/${MAX_ATTEMPTS})...`);
        setTimeout(() => playSound(key, attempt + 1), 300 * attempt);
      }
    };
    
    // 再生を開始
    console.log(`Starting playback: ${key}`);
    source.start(0);
  } catch (error) {
    console.error(`Error playing sound ${key}:`, error);
    
    // リトライ
    if (attempt < MAX_ATTEMPTS) {
      console.log(`Retrying after error (${attempt + 1}/${MAX_ATTEMPTS})...`);
      setTimeout(() => playSound(key, attempt + 1), 300 * attempt);
    }
  }
}

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
  // 初期化時に全てnullにしておく
  eruptionArea: null,
  gobouImg: null,
  timerSpan: null,
  scoreSpan: null,
  messageDiv: null,
  startScreen: null,
  gameScreen: null,
  resultScreen: null,
  finalScore: null,
  finalMessage: null,
  startBtn: null,
  retryBtn: null,
  homeBtn: null,
  clearScreen: null,
  clearFinalScore: null,
  clearHomeBtn: null
};

// 要素の参照を確実に取得する関数
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element with id '${id}' not found`);
  }
  return element;
}

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
  playSound(word);

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
  if (win) {
    showMessage("🎉GAME CLEAR🎉");
  } else {
    showMessage("時間切れ！また挑戦してね");
  }
  
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
  elements.scoreSpan = getElement("score");
  elements.messageDiv = getElement("message");
  elements.startScreen = getElement("start-screen");
  elements.gameScreen = getElement("game-screen");
  elements.resultScreen = getElement("result-screen");
  elements.finalScore = getElement("final-score");
  elements.finalMessage = getElement("final-message");
  elements.startBtn = getElement("start-btn");
  elements.retryBtn = getElement("retry-btn");
  elements.homeBtn = getElement("home-btn");
  elements.clearScreen = getElement("clear-screen");
  elements.clearFinalScore = getElement("clear-final-score");
  elements.clearHomeBtn = getElement("clear-home-btn");
  
  // 必要な要素がすべて存在するか確認
  Object.entries(elements).forEach(([key, element]) => {
    if (!element) {
      console.warn(`Element '${key}' is missing in the HTML`);
    }
  });
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
  if (elements.startBtn) {
    elements.startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // ゲームを開始
      startGame();
      
      // テスト用に少し遅れて音を鳴らす
      setTimeout(() => {
        console.log('Playing test sound...');
        playSound('バリバリ');
      }, 500);
    });
  } else {
    console.error('Start button not found');
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

