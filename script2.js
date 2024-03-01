//vh 정리
let vh = window.innerHeight * 0.01
document.documentElement.style.setProperty('--vh', `${vh}px`)
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
})
// 버튼 및 폼 요소 가져오기
const addCardButton = document.getElementById('addCardButton');
const addCardForm = document.getElementById('addCardForm');
const saveCompleteButton = document.getElementById('saveCompleteButton');
const reviewScreen = document.getElementById('reviewScreen');
const csvFileInput = document.getElementById('csvFileInput');

// 데이터베이스에 저장될 카드 데이터 배열
let students = [];

// 다시 하기 버튼 생성
const restartButton = document.createElement('button');
        restartButton.textContent = '다시 하기';
        restartButton.style.display = 'none'; // 초기에는 숨겨둠
        restartButton.classList.add('restartButton');
        document.body.appendChild(restartButton);

// 다시 하기 버튼 클릭 시 이벤트 처리
restartButton.addEventListener('click', () => {
        // 카드 맞추기 활동 관련 요소들 초기화
        currentCardIndex = 0;
        reviewScreen.innerHTML = ''; // 리뷰 화면 초기화
        //students 배열 초기화
        students = firststudents;
        shuffleCards(); // 카드 다시 섞기
        showCard(); // 카드 맞추기 활동 다시 시작
        restartButton.style.display = 'none'; // "다시 하기" 버튼 숨기기
});
// 모든 맞추기 활동이 끝날 때 "다시 하기" 버튼을 표시하는 함수
function showRestartButton() {
            restartButton.style.display = 'block';
            restartButton.style.margin = '0 auto'; // 가운데 정렬을 위한 margin 설정
        }

// "csv 파일로 카드 추가하기" 버튼 클릭 시 이벤트 처리
document.getElementById('uploadCSVButton').addEventListener('click', () => {
    csvFileInput.click(); // CSV 파일 업로드 버튼 클릭 시 파일 입력(input) 요소 클릭
});

// CSV 파일 업로드 버튼 클릭 시 이벤트 처리
csvFileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const contents = e.target.result;
        processCSV(contents);
    };

    reader.readAsText(file, 'UTF-8'); // UTF-8 형식으로 파일 읽기
}

// CSV 파일 처리 함수
function processCSV(contents) {
    const lines = contents.split('\n'); // 줄 단위로 파싱
    lines.forEach(line => {
        const [number, name] = line.trim().split(','); // 쉼표를 기준으로 카드 문제와 이름 분리
        if (number && name) { // 카드 문제와 이름이 모두 있는 경우에만 추가
            students.push({ number: number.trim(), name: name.trim() });
        }
    });
    alert('CSV 파일이 성공적으로 추가되었습니다.'); // 성공적으로 추가된 경우 알림
}


// 저장 완료 버튼 클릭 시 이벤트 처리
saveCompleteButton.addEventListener('click', () => {
    // "카드 추가" 버튼과 "CSV 파일로 카드 추가하기" 버튼 숨기기
    addCardButton.style.display = 'none';
    addCardForm.style.display = 'none';
    uploadCSVButton.style.display = 'none';
    // students 배열 저장하기
    firststudents = students;
    //h1태그 숨기기
    document.querySelector('h1').style.display = 'none';
    reviewScreen.innerHTML = ''; // 리뷰 화면 초기화
    shuffleCards(); // 카드 무작위 섞기
    currentCardIndex = 0; // 현재 카드 인덱스 초기화
    showCard(); // 다음 카드 보여주기
    reviewScreen.style.display = 'block';
});

// 총 카드 수 보여주는 함수
function showTotalCardsNumber() {
    const totalCardsNumber = document.createElement('div');
    totalCardsNumber.textContent = `총 카드 수: ${students.length}`;
    reviewScreen.appendChild(totalCardsNumber);
}

// 카드를 무작위로 섞는 함수
function shuffleCards() {
    for (let i = students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [students[i], students[j]] = [students[j], students[i]];
    }
}

// 다음 카드 보여주는 함수
function showCard() {
    if (currentCardIndex < students.length) {
        saveCompleteButton.style.display = 'none'
        const currentCard = students[currentCardIndex];
        const question = document.createElement('div');
        question.classList.add('question');
        const studentNumberSpan = document.createElement('span');
        studentNumberSpan.textContent = `${currentCard.number}`;
        const viewportWidth = window.innerWidth * 0.3; // 뷰포트 너비의 30%
        studentNumberSpan.style.fontSize = `${viewportWidth}px`; // 카드 문제 크기를 설정합니다.
        //question 가운데 정렬하기
        question.classList.add('question');
        question.appendChild(studentNumberSpan);
        // 현재 카드 순서와 총 카드 수를 나타내는 문구 생성
        const cardCounter = document.createElement('div');
        cardCounter.textContent = `${currentCardIndex + 1} / ${students.length}`;
        cardCounter.classList.add('card-counter'); // 추가한 요소에 클래스 추가
        
        // question 요소에 cardCounter를 자식으로 추가
        question.appendChild(cardCounter);
        question.addEventListener('click', () => {
            const answer = document.createElement('div');
            //answer 가운데 정렬하기
            answer.classList.add('answer');
            answer.textContent = currentCard.name;
            reviewScreen.innerHTML = ''; // 리뷰 화면 초기화
            const viewportWidth = window.innerWidth * 0.2; // 뷰포트 너비의 20%
            answer.style.fontSize = `${viewportWidth}px`; // 카드 문제 크기를 설정합니다.
            showDifficultyButtons(currentCard);
            reviewScreen.appendChild(answer);
            const style = document.createElement('style');
            document.head.appendChild(style);
        });
        reviewScreen.appendChild(question);
        currentCardIndex++;
    } else {
        alert('모든 맞추기 활동이 끝났습니다!'); // 모든 카드를 다 본 경우 알림
        showRestartButton();
    }
}

// 난이도 버튼 보여주는 함수
function showDifficultyButtons(currentCard) {
    const difficultyButtons = document.createElement('div');
    difficultyButtons.classList.add('difficulty-buttons');
    const difficulties = ['매우 어려움', '어려움', '쉬움', '매우 쉬움'];
    difficulties.forEach(difficulty => {
        const button = document.createElement('button');
        button.textContent = difficulty;
        button.style.flex = '1'; // 버튼이 동일한 너비를 가지도록 flex 속성 설정
        button.addEventListener('click', () => {
            currentCard.difficulty = difficulty;
            if (difficulty === '어려움' || difficulty === '매우 어려움') {
                students.push(currentCard); // 어려운 카드는 다시 맨 뒤에 추가
            }
            reviewScreen.innerHTML = ''; // 리뷰 화면 초기화
            showCard(); // 다음 카드 보여주기
        });
        difficultyButtons.appendChild(button);
    });
    reviewScreen.appendChild(difficultyButtons);
}

// 카드 추가 버튼 클릭 시 이벤트 처리
addCardButton.addEventListener('click', () => {
    addCardForm.style.display = 'block';
});

// 폼 제출 시 이벤트 처리
addCardForm.addEventListener('submit', (event) => {
    event.preventDefault(); // 기본 동작 방지
    const studentNumber = document.getElementById('studentNumber').value;
    const studentName = document.getElementById('studentName').value;
    // 데이터베이스에 카드 추가
    students.push({ number: studentNumber, name: studentName });
    // 입력 폼 숨기기
    addCardForm.reset(); // 폼 초기화
    addCardForm.style.display = 'block';
})

// 화면 크기에 따라 카드 정답의 글자 크기를 조정하는 함수
function adjustFontSize() {
    const answer = document.querySelector('.answer');
    const viewportWidth = window.innerWidth;
    const fontSize = Math.min(viewportWidth * 0.05, 24); // 뷰포트 너비의 5% 또는 최대 24px 크기로 제한
    answer.style.fontSize = `${fontSize}px`;
}

// 초기화 시 호출하여 한 번 실행하고, 화면 크기 변경 시 마다 실행되도록 함
adjustFontSize();
window.addEventListener('resize', adjustFontSize);
