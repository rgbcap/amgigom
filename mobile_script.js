console.log('script.js 로드 시작');

// 라이브러리 로드 확인 (스크립트 최상단)
if (typeof XLSX === 'undefined') console.log('XLSX 라이브러리 로드 실패');
if (typeof JSZip === 'undefined') console.log('JSZip 라이브러리 로드 실패');

let cards = []; // 카드 배열: [{photo: base64, name: '이름', number: '번호'}]
let firstCards = []; // 처음 저장된 카드 데이터
let currentCardIndex = 0;

// vh 정리
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    adjustFontSize();
});

// DOM 로드 후 요소 바인딩
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료');

    // 버튼 및 폼 요소 가져오기
    const addCardButton = document.getElementById('addCardButton');
    const addCardForm = document.getElementById('addCardForm');
    const saveCompleteButton = document.getElementById('saveCompleteButton');
    const reviewScreen = document.getElementById('reviewScreen');
    // const csvFileInput = document.getElementById('csvFileInput');
    // const uploadCSVButton = document.getElementById('uploadCSVButton');
    // const uploadExcelButton = document.getElementById('uploadExcelButton');
    const excelInput = document.getElementById('excelInput');
    const status = document.getElementById('status');
    const cardContainer = document.getElementById('cardContainer');

    // 요소 확인
    if (!cardContainer) {
        console.error('cardContainer 요소를 찾을 수 없습니다.');
        if (status) status.textContent = '오류: cardContainer 요소를 찾을 수 없습니다. HTML을 확인하세요.';
        return;
    }
    if (!uploadExcelButton || !excelInput ) {
        console.error('uploadExcelButton, excelInput 요소를 찾을 수 없습니다.');
        if (status) status.textContent = '오류: 버튼, 파일 입력 또는 드롭 영역 요소를 찾을 수 없습니다.';
        return;
    }
    if (!reviewScreen || !status) {
        console.error('reviewScreen 또는 status 요소를 찾을 수 없습니다.');
        if (status) status.textContent = '오류: reviewScreen 또는 status 요소를 찾을 수 없습니다.';
        return;
    }

    // 라이브러리 로드 확인
    if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') {
        console.error('XLSX 또는 JSZip 라이브러리가 로드되지 않았습니다.');
        status.textContent = '오류: XLSX 또는 JSZip 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하거나 로컬 라이브러리를 사용하세요.';
        status.style.color = 'red';
        return;
    }

    // 다시 하기 버튼 생성
    const restartButton = document.createElement('button');
    restartButton.textContent = '다시 하기';
    restartButton.classList.add('restartButton');
    document.body.appendChild(restartButton);

    // 페이지 로드 시 카드 초기화
    cards = []; // 새로고침 시 데이터 삭제
    displayCards();

    // Excel 버튼 이벤트 연결
    uploadExcelButton.addEventListener('click', () => {
        console.log('Excel 파일 추가 버튼 클릭');
        excelInput.click();
    });

    // // 드래그 앤 드롭 이벤트
    // dropArea.addEventListener('dragover', (e) => {
    //     e.preventDefault();
    //     dropArea.classList.add('dragover');
    //     console.log('드래그 오버');
    // });

    // dropArea.addEventListener('dragleave', () => {
    //     dropArea.classList.remove('dragover');
    //     console.log('드래그 리브');
    // });

    // dropArea.addEventListener('drop', (e) => {
    //     e.preventDefault();
    //     dropArea.classList.remove('dragover');
    //     console.log('파일 드롭');
    //     const file = e.dataTransfer.files[0];
    //     if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    //         processExcelFile(file);
    //     } else {
    //         status.textContent = '오류: .xlsx 또는 .xls 파일을 드롭하세요.';
    //         status.style.color = 'red';
    //     }
    // });

    // Excel 파일 업로드 처리
    excelInput.addEventListener('change', async (e) => {
        console.log('Excel 파일 선택됨');
        const file = e.target.files[0];
        if (!file) {
            console.log('파일 선택 안됨');
            status.textContent = '오류: 파일이 선택되지 않았습니다.';
            status.style.color = 'red';
            return;
        }
        processExcelFile(file);
    });

    // Excel 파일 처리 함수
    async function processExcelFile(file) {
        status.textContent = '처리 중...';
        status.style.color = 'blue';
        console.log('Excel 파일 처리 시작');

        try {
            const reader = new FileReader();
            reader.onload = async function (event) {
                console.log('Excel 파일 읽기 시작');
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // sharedStrings 추출
                    const sharedStrings = workbook.Strings || [];
                    console.log('Shared Strings:', sharedStrings.map(s => s.t));

                    // 이미지 추출
                    const zip = await JSZip.loadAsync(data);
                    const imageFiles = Object.keys(zip.files)
                        .filter(fileName => fileName.startsWith('xl/media/'))
                        .sort((a, b) => {
                            const numA = parseInt(a.match(/image(\d+)/)?.[1] || 0);
                            const numB = parseInt(b.match(/image(\d+)/)?.[1] || 0);
                            return numA - numB;
                        });
                    const images = [];
                    for (const imageFile of imageFiles) {
                        const imageData = await zip.files[imageFile].async('base64');
                        let mimeType = 'image/png';
                        if (imageFile.endsWith('.jpg') || imageFile.endsWith('.jpeg')) mimeType = 'image/jpeg';
                        else if (imageFile.endsWith('.gif')) mimeType = 'image/gif';
                        else if (imageFile.endsWith('.bmp')) mimeType = 'image/bmp';
                        images.push(`data:${mimeType};base64,${imageData}`);
                    }

                    // 이름 인덱스 동적 생성
                    const numImages = images.length;
                    const nameIndices = [];
                    for (let n = 1; n <= numImages; n++) {
                        const index = n + 3 + 3 * Math.floor((n - 1) / 24);
                        nameIndices.push(index);
                    }

                    // 이름 추출 및 가공
                    const names = nameIndices.map(idx => sharedStrings[idx]?.t || 'Unknown');
                    const processedNames = names.map(name => name.replace(/^.*?\d+학년 \d+반 (\d+번) (.+)/, '$1\n$2'));

                    // 디버깅
                    console.log('이름 인덱스:', nameIndices);
                    console.log('원본 이름:', names);
                    console.log('가공된 이름:', processedNames);
                    console.log('추출된 이미지 파일:', imageFiles);

                    // 이미지와 이름 매핑
                    const minLength = Math.min(processedNames.length, images.length);
                    if (processedNames.length !== images.length) {
                        status.textContent = `경고: 이름(${processedNames.length})과 이미지(${images.length}) 수가 다릅니다. ${minLength}개의 카드만 생성됩니다.`;
                        status.style.color = 'orange';
                    }

                    cards = [];
                    for (let i = 0; i < minLength; i++) {
                        cards.push({ photo: images[i], name: processedNames[i], number: `학생 ${i + 1}` });
                    }

                    displayCards();
                    status.textContent = ''; // 문구 제거
                } catch (error) {
                    console.error('Excel 처리 오류:', error.message);
                    status.textContent = `오류: ${error.message}`;
                    status.style.color = 'red';
                }
            };
            reader.readAsArrayBuffer(file);
            console.log('Excel 파일 읽기 요청');
        } catch (error) {
            console.error('파일 읽기 오류:', error.message);
            status.textContent = `오류: ${error.message}`;
            status.style.color = 'red';
        }
    }

    // CSV 파일 업로드 처리
    // uploadCSVButton.addEventListener('click', () => {
    //     console.log('CSV 파일 추가 버튼 클릭');
    //     csvFileInput.click();
    // });

    // csvFileInput.addEventListener('change', handleFileUpload);

    // function handleFileUpload(event) {
    //     console.log('CSV 파일 선택됨');
    //     const file = event.target.files[0];
    //     if (!file) {
    //         console.log('파일 선택 안됨');
    //         status.textContent = '오류: 파일이 선택되지 않았습니다.';
    //         status.style.color = 'red';
    //         return;
    //     }
    //     const reader = new FileReader();
    //     reader.onload = function(e) {
    //         console.log('CSV 파일 읽기 완료');
    //         const contents = e.target.result;
    //         processCSV(contents);
    //     };
    //     reader.readAsText(file, 'UTF-8');
    // }

    // function processCSV(contents) {
    //     const lines = contents.split('\n');
    //     lines.forEach(line => {
    //         const [number, name] = line.trim().split(',');
    //         if (number && name) {
    //             cards.push({ number: number.trim(), name: name.trim(), photo: null });
    //         }
    //     });
    //     alert('CSV 파일이 성공적으로 추가되었습니다.');
    //     firstCards = [...cards];
    //     displayCards();
    // }

    // 카드 추가 폼 처리
    addCardButton.addEventListener('click', () => {
        console.log('카드 추가 버튼 클릭');
        addCardForm.style.display = 'block';
    });

    addCardForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('카드 추가 폼 제출');
        const studentNumber = document.getElementById('studentNumber').value;
        const studentName = document.getElementById('studentName').value;
        cards.push({ number: studentNumber, name: studentName, photo: null });
        addCardForm.reset();
        addCardForm.style.display = 'block';
        firstCards = [...cards];
        displayCards();
    });

    // 저장 완료 버튼 처리
    saveCompleteButton.addEventListener('click', () => {
        console.log('저장 완료 버튼 클릭');
        addCardButton.style.display = 'none';
        addCardForm.style.display = 'none';
        // uploadCSVButton.style.display = 'none';
        uploadExcelButton.style.display = 'none';
        excelInput.style.display = 'none';
        document.querySelector('h1').style.display = 'none';
        cardContainer.innerHTML = ''; // 플립 카드 제거
        reviewScreen.innerHTML = '';
        shuffleCards();
        currentCardIndex = 0;
        firstCards = [...cards];
        showCard();
        reviewScreen.style.display = 'block';
    });

    // 다시 하기 버튼 처리
    restartButton.addEventListener('click', () => {
        console.log('다시 하기 버튼 클릭');
        reviewScreen.innerHTML = '';
        cards = [...firstCards];
        currentCardIndex = 0;
        restartButton.style.display = 'none';
        shuffleCards();
        showCard();
    });

    // 총 카드 수 표시
    function showTotalCardsNumber() {
        console.log('총 카드 수 표시');
        const totalCardsNumber = document.createElement('div');
        totalCardsNumber.textContent = `총 카드 수: ${cards.length}`;
        reviewScreen.appendChild(totalCardsNumber);
    }

    // 카드 섞기
    function shuffleCards() {
        console.log('카드 섞기 시작');
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        console.log('카드 섞기 완료');
    }

    // 카드 표시 (플립 카드)
    function displayCards() {
        console.log('카드 표시 시작');
        if (!cardContainer) {
            console.error('cardContainer 요소가 없습니다.');
            status.textContent = '오류: cardContainer 요소가 없습니다.';
            status.style.color = 'red';
            return;
        }
        cardContainer.innerHTML = '';
        cards.forEach(card => {
            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card';
            flipCard.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        ${card.photo ? `<img src="${card.photo}" alt="학생 사진">` : `<span>학생 ${card.number}</span>`}
                    </div>
                    <div class="flip-card-back">
                        <h2>${card.name}</h2>
                    </div>
                </div>
            `;
            flipCard.addEventListener('click', () => {
                flipCard.classList.toggle('flipped');
            });
            cardContainer.appendChild(flipCard);
        });
        console.log('카드 표시 완료');
    }

    // 리뷰 카드 표시
    function showCard() {
        console.log('카드 표시 요청, 인덱스:', currentCardIndex);
        if (currentCardIndex < cards.length) {
            saveCompleteButton.style.display = 'none';
            const currentCard = cards[currentCardIndex];
            const question = document.createElement('div');
            question.classList.add('question');
            const content = document.createElement('span');
            content.textContent = currentCard.photo ? '' : currentCard.number;
            content.style.fontSize = `${window.innerWidth * 0.3}px`;
            if (currentCard.photo) {
                const img = document.createElement('img');
                img.src = currentCard.photo;
                img.alt = '학생 사진';
                img.className = 'review-image';
                img.style.width = 'auto'; // 확대를 위해 auto로 설정
                img.style.height = 'auto';
                question.appendChild(img);
            } else {
                question.appendChild(content);
            }
            const cardCounter = document.createElement('div');
            cardCounter.textContent = `${currentCardIndex + 1} / ${cards.length}`;
            cardCounter.classList.add('card-counter');
            question.appendChild(cardCounter);
            question.addEventListener('click', () => {
                console.log('카드 클릭, 이름 표시:', currentCard.name);
                const answer = document.createElement('div');
                answer.classList.add('answer');
                answer.textContent = currentCard.name;
                answer.style.fontSize = `${window.innerWidth * 0.2}px`;
                answer.style.whiteSpace = 'pre-line'; // 줄바꿈 반영
                reviewScreen.innerHTML = '';
                showDifficultyButtons(currentCard);
                reviewScreen.appendChild(answer);
            });
            reviewScreen.appendChild(question);
            currentCardIndex++;
        } else {
            alert('모든 맞추기 활동이 끝났습니다!');
            restartButton.style.display = 'block';
            restartButton.style.margin = '0 auto';
            console.log('모든 카드 표시 완료');
        }
    }

    // 난이도 버튼 표시
    function showDifficultyButtons(currentCard) {
        console.log('난이도 버튼 표시');
        const difficultyButtons = document.createElement('div');
        difficultyButtons.classList.add('difficulty-buttons');
        const difficulties = ['매우 어려움', '어려움', '쉬움', '매우 쉬움'];
        difficulties.forEach(difficulty => {
            const button = document.createElement('button');
            button.textContent = difficulty;
            button.addEventListener('click', () => {
                console.log('난이도 선택:', difficulty);
                currentCard.difficulty = difficulty;
                if (difficulty === '어려움' || difficulty === '매우 어려움') {
                    cards.push(currentCard);
                }
                reviewScreen.innerHTML = '';
                showCard();
            });
            difficultyButtons.appendChild(button);
        });
        reviewScreen.appendChild(difficultyButtons);
    }

    // 글자 크기 조정
    function adjustFontSize() {
        const answer = document.querySelector('.answer');
        if (answer) {
            const viewportWidth = window.innerWidth;
            const fontSize = Math.min(viewportWidth * 0.05, 24);
            answer.style.fontSize = `${fontSize}px`;
        }
        const spans = document.querySelectorAll('.question span');
        spans.forEach(span => {
            span.style.fontSize = `${window.innerWidth * 0.3}px`;
        });
    }

    window.addEventListener('resize', adjustFontSize);
});

console.log('script.js 로드 완료');
