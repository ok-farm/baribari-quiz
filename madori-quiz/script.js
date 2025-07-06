const floorPlanImages = [
    { name: '1K', path: 'madori1.jpg' },
    { name: '1K', path: 'madori2.png' },
    { name: '1R', path: 'madori3.png' },
    { name: '1LDK', path: 'madori4.png' },
];

// 他の間取りタイプの選択肢をダミーで用意
const allPlanTypes = ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3K', '3DK', '3LDK', '4LDK'];

const quizContainer = document.getElementById('quiz-container');
const floorPlanImage = document.getElementById('floor-plan-image');
const optionsContainer = document.getElementById('options-container');
const resultContainer = document.getElementById('result-container');
const scoreSpan = document.getElementById('score');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');
const questionNumberElement = document.getElementById('question-number');

let currentQuiz = [];
let currentQuestionIndex = 0;
let score = 0;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateQuiz() {
    currentQuiz = shuffle([...floorPlanImages]).slice(0, 3);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    floorPlanImage.src = question.path;
    
    // 問題番号を更新
    questionNumberElement.textContent = `${currentQuestionIndex + 1}/${currentQuiz.length}`;

    const correctAnswer = question.name;
    const wrongAnswerTypes = allPlanTypes.filter(type => type !== correctAnswer);

    const options = shuffle([correctAnswer, ...shuffle(wrongAnswerTypes).slice(0, 2)]);

    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = function() {
            // 他のボタンの選択状態をリセット
            const buttons = optionsContainer.querySelectorAll('button');
            buttons.forEach(btn => btn.classList.remove('selected'));
            // クリックしたボタンに選択状態を追加
            this.classList.add('selected');
            // 回答をチェック
            checkAnswer(option === correctAnswer);
        };
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) {
        score++;
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < 3) {
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    scoreSpan.textContent = score;

    if (score === 3) {
        resultMessage.textContent = 'すごい！';
    } else if (score === 2) {
        resultMessage.textContent = 'やるね！';
    } else if (score === 1) {
        resultMessage.textContent = 'もう少し';
    } else {
        resultMessage.textContent = '残念…';
    }
}

retryButton.addEventListener('click', () => {
    resultContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    // 選択状態をリセットしてから新しいクイズを開始
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    generateQuiz();
});

generateQuiz();
