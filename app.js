// アプリケーションの状態管理
let currentWords = [];
let currentIndex = 0;
let answeredWords = new Set();
let correctCount = 0;
let wrongCount = 0;
let selectedCategory = null;
let reviewWords = new Set(); // 復習用チェック（★）
let correctWords = new Set(); // 正解済み（青マーカー用）
let wrongWords = new Set();
let isCardRevealed = false;
let currentRangeStart = 0; // 現在の学習範囲（開始index）
let currentRangeEnd = 0;   // 現在の学習範囲（終了index、exclusive）
let isInputModeActive = false; // 日本語→英語入力モードかどうか
let inputAnswerSubmitted = false; // 入力回答が送信済みかどうか

// カテゴリごとの正解・間違い単語を読み込む
function loadCategoryWords(category) {
    const savedCorrectWords = localStorage.getItem(`correctWords-${category}`);
    const savedWrongWords = localStorage.getItem(`wrongWords-${category}`);
    
    const correctSet = new Set();
    const wrongSet = new Set();
    
    if (savedCorrectWords) {
        const parsed = JSON.parse(savedCorrectWords);
        parsed.forEach(id => correctSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
    }
    
    if (savedWrongWords) {
        const parsed = JSON.parse(savedWrongWords);
        parsed.forEach(id => wrongSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
    }
    
    return { correctSet, wrongSet };
}

// カテゴリごとの正解・間違い単語を保存
function saveCategoryWords(category, correctSet, wrongSet) {
    localStorage.setItem(`correctWords-${category}`, JSON.stringify([...correctSet]));
    localStorage.setItem(`wrongWords-${category}`, JSON.stringify([...wrongSet]));
}

// localStorageから復習チェック、間違い、進捗を読み込む
function loadData() {
    const savedReviewWords = localStorage.getItem('reviewWords');
    if (savedReviewWords) {
        const parsed = JSON.parse(savedReviewWords);
        reviewWords = new Set(parsed.map(id => typeof id === 'string' ? parseInt(id, 10) : id));
    }
    
    // グローバルなcorrectWordsとwrongWordsは後方互換性のため残す（既存のカテゴリ用）
    const savedCorrectWords = localStorage.getItem('correctWords');
    if (savedCorrectWords) {
        const parsed = JSON.parse(savedCorrectWords);
        correctWords = new Set(parsed.map(id => typeof id === 'string' ? parseInt(id, 10) : id));
    }
    
    const savedWrongWords = localStorage.getItem('wrongWords');
    if (savedWrongWords) {
        const parsed = JSON.parse(savedWrongWords);
        wrongWords = new Set(parsed.map(id => typeof id === 'string' ? parseInt(id, 10) : id));
    }
}

// 進捗を読み込む
function loadProgress(category) {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        return progress[category] || 0;
    }
    return 0;
}

// 進捗を保存
function saveProgress(category, index) {
    const savedProgress = localStorage.getItem('learningProgress');
    let progress = savedProgress ? JSON.parse(savedProgress) : {};
    progress[category] = index;
    localStorage.setItem('learningProgress', JSON.stringify(progress));
}

// 進捗をリセット
function resetProgress(category) {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        delete progress[category];
        localStorage.setItem('learningProgress', JSON.stringify(progress));
    }
    updateCategoryStars();
}

// カテゴリーの星表示を更新
function updateCategoryStars() {
    const categories = ['超よく出る600', 'よく出る300', '差がつく200', '基本語彙500'];
    
    categories.forEach(category => {
        const element = document.getElementById(`stars-${category}`);
        if (!element) return;
        
        let categoryWords;
        if (category === '基本語彙500') {
            categoryWords = wordData.slice(0, Math.min(500, wordData.length));
        } else {
            categoryWords = wordData.filter(word => word.category === category);
        }
        const savedIndex = loadProgress(category);
        
        if (categoryWords.length === 0) {
            element.textContent = '☆☆☆☆☆';
            return;
        }
        
        // 進捗率を計算（正解数、間違い数）
        let correctCountInCategory = 0;
        let wrongCountInCategory = 0;
        
        // カテゴリごとの進捗を取得
        const { correctSet, wrongSet } = loadCategoryWords(category);
        
        categoryWords.forEach(word => {
            // カテゴリごとの進捗を優先的に使用
            const isCorrect = correctSet.has(word.id);
            const isWrong = wrongSet.has(word.id);
            
            // 優先順位変更: 間違い(赤) > 正解(青)
            // 間違いリストにあるものは、正解済みであっても「赤」で表示（要注意単語として）
            // 間違いリストになく、正解リストにあるものは「青」
            if (isWrong) {
                wrongCountInCategory++;
            } else if (isCorrect) {
                correctCountInCategory++;
            }
        });
        
        const total = categoryWords.length;
        const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
        const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
        
        // 星の数を計算（進捗率ベース：正解数で判定するのが妥当か、学習済み数で判定するか。ここでは学習済み（正解+間違い）で判定）
        const completedCount = correctCountInCategory + wrongCountInCategory;
        const progressPercent = total === 0 ? 0 : (completedCount / total) * 100;
        const starsCount = Math.floor(progressPercent / 20);
        
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < starsCount) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        element.textContent = stars;

        // 進捗バーとテキストを更新
        const correctBar = document.getElementById(`progress-correct-${category}`);
        const wrongBar = document.getElementById(`progress-wrong-${category}`);
        const text = document.getElementById(`progress-text-${category}`);
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.width = `${wrongPercent}%`;
        }
        if (text) {
            // 要望により「完璧になった英単語（青）」の数を表示
            text.textContent = `${correctCountInCategory} / ${total}`;
        }
    });
}

// 復習チェックを保存
function saveReviewWords() {
    localStorage.setItem('reviewWords', JSON.stringify([...reviewWords]));
}

// 正解済みを保存
function saveCorrectWords() {
    localStorage.setItem('correctWords', JSON.stringify([...correctWords]));
    // ホーム画面にいる場合は進捗を更新
    if (!elements.mainContent.classList.contains('hidden')) {
        // 学習画面にいる場合は更新しない（ホームに戻ったときに更新される）
    }
}

// 間違えた単語を保存
function saveWrongWords() {
    localStorage.setItem('wrongWords', JSON.stringify([...wrongWords]));
    // ホーム画面にいる場合は進捗を更新
    if (!elements.mainContent.classList.contains('hidden')) {
        // 学習画面にいる場合は更新しない（ホームに戻ったときに更新される）
    }
}


// DOM要素の取得
const elements = {
    categorySelection: document.getElementById('categorySelection'),
    mainContent: document.getElementById('mainContent'),
    wordCard: document.getElementById('wordCard'),
    cardInner: document.getElementById('cardInner'),
    wordNumber: document.getElementById('wordNumber'),
    englishWord: document.getElementById('englishWord'),
    posContainer: document.getElementById('posContainer'),
    // partOfSpeech: document.getElementById('partOfSpeech'), // 削除（動的生成に変更）
    // difficulty: document.getElementById('difficulty'), // 削除
    // frequency: document.getElementById('frequency'), // 削除
    // categoryBadge: document.getElementById('categoryBadge'), // 削除
    starBtn: document.getElementById('starBtn'),
    meaning: document.getElementById('meaning'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    // remaining: document.getElementById('remaining'), // 削除
    wordListSection: document.getElementById('wordListSection'),
    wordList: document.getElementById('wordList'),
    feedbackOverlay: document.getElementById('feedbackOverlay'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalActions: document.getElementById('modalActions'),
    headerSubtitle: document.getElementById('headerSubtitle'),
    correctBtn: document.getElementById('correctBtn'),
    wrongBtn: document.getElementById('wrongBtn'),
    masteredBtn: document.getElementById('masteredBtn'),
    homeBtn: document.getElementById('homeBtn')
};

// モーダル表示関数
function showModal(title, message, actions) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modalActions.innerHTML = '';
    
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `modal-btn ${action.type}`;
        btn.textContent = action.text;
        btn.onclick = () => {
            closeModal();
            if (action.onClick) action.onClick();
        };
        elements.modalActions.appendChild(btn);
    });
    
    // 背景クリックで閉じるイベント
    const handleOverlayClick = (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
            elements.modalOverlay.removeEventListener('click', handleOverlayClick);
        }
    };
    elements.modalOverlay.addEventListener('click', handleOverlayClick);
    
    elements.modalOverlay.classList.remove('hidden');
    // アニメーション用
    setTimeout(() => {
        elements.modalOverlay.classList.add('active');
    }, 10);
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
    setTimeout(() => {
        elements.modalOverlay.classList.add('hidden');
    }, 200);
}

// 確認ダイアログ（Promiseラッパー）
function showConfirm(message) {
    return new Promise((resolve) => {
        showModal('確認', message, [
            { text: 'OK', type: 'confirm', onClick: () => resolve(true) },
            { text: 'キャンセル', type: 'cancel', onClick: () => resolve(false) }
        ]);
    });
}

// アラートダイアログ（Promiseラッパー）
function showAlert(title, message) {
    return new Promise((resolve) => {
        showModal(title, message, [
            { text: 'OK', type: 'confirm', onClick: () => resolve() }
        ]);
    });
}

// カテゴリーを自動割り当て（data.jsにcategoryがない場合）
function assignCategories() {
    if (typeof wordData === 'undefined') return;
    
    wordData.forEach((word, index) => {
        if (!word.category) {
            // インデックスに基づいてカテゴリーを割り当て
            if (index < 600) {
                word.category = '超よく出る600';
            } else if (index < 900) {
                word.category = 'よく出る300';
            } else {
                word.category = '差がつく200';
            }
        }
    });
}

// 画面固定のための設定
function preventZoom() {
    // ダブルタップズームを防止
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // ピンチズームを防止
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    });
    document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    });

    // 画面の向きを固定（可能な場合）
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {
            // ロックに失敗しても続行
        });
    }
}

// 初期化
function init() {
    preventZoom();
    assignCategories();
    loadData();
    showCategorySelection();
    setupEventListeners();
}

// カテゴリー選択画面を表示
function showCategorySelection() {
    elements.categorySelection.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    selectedCategory = null;
    updateNavState('home');
    elements.headerSubtitle.textContent = '大阪府公立高校対応';
    
    // カテゴリー選択画面ではホームボタンを非表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.add('hidden');
    }
    
    // 設定ボタンを表示
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.remove('hidden');
    }
    
    document.body.classList.remove('learning-mode');
    
    // 最新のデータを読み込んでから進捗を更新
    loadData();
    updateCategoryStars(); // 星の表示を更新
}

// カテゴリーを選択してコース選択画面を表示
function startCategory(category) {
    selectedCategory = category;
    
    // 基本語彙500の場合は、最初の500語を取得
    let categoryWords;
    if (category === '基本語彙500') {
        categoryWords = wordData.slice(0, Math.min(500, wordData.length));
    } else {
        categoryWords = wordData.filter(word => word.category === category);
    }

    if (categoryWords.length === 0) {
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    // カテゴリー選択画面を非表示
    elements.categorySelection.classList.add('hidden');
    
    // 基本語彙500の場合は直接日本語→英語モードで開始
    if (category === '基本語彙500') {
        initInputModeLearning(category, categoryWords);
    } else {
        // コース選択画面を表示
        showCourseSelection(category, categoryWords);
    }
}

// 日本語→英語モードで学習を初期化
function initInputModeLearning(category, words) {
    selectedCategory = category;
    currentWords = words;
    isInputModeActive = true;
    
    currentRangeStart = 0;
    currentRangeEnd = words.length;
    currentIndex = 0;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    // 設定ボタンを非表示
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.add('hidden');
    }
    
    document.body.classList.add('learning-mode');

    // 学習画面ではホームボタンを表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }

    // カードモードを非表示、入力モードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const cardHint = document.getElementById('cardHint');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.remove('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    
    // 左右移動ボタンを非表示
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    
    displayInputMode();
    updateStats();
    updateNavState('learning');
}

// コース選択画面を表示（100刻み）
function showCourseSelection(category, categoryWords) {
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    
    courseTitle.textContent = `${category} - コースを選んでください`;
    courseList.innerHTML = '';
    
    const CHUNK = 100;
    const chunkCount = Math.ceil(categoryWords.length / CHUNK);
    
    for (let i = 0; i < chunkCount; i++) {
        const start = i * CHUNK;
        const end = Math.min((i + 1) * CHUNK, categoryWords.length);
        const courseWords = categoryWords.slice(start, end);
        
        // 進捗を計算（カテゴリごと）
        let correctCountInCourse = 0;
        let wrongCountInCourse = 0;
        const { correctSet, wrongSet } = loadCategoryWords(category);
        
        courseWords.forEach(word => {
            const isCorrect = correctSet.has(word.id);
            const isWrong = wrongSet.has(word.id);
            
            // 優先順位変更: 間違い(赤) > 正解(青)
            if (isWrong) {
                wrongCountInCourse++;
            } else if (isCorrect) {
                correctCountInCourse++;
            }
        });
        
        const total = courseWords.length;
        const correctPercent = total === 0 ? 0 : (correctCountInCourse / total) * 100;
        const wrongPercent = total === 0 ? 0 : (wrongCountInCourse / total) * 100;
        const completedCount = correctCountInCourse + wrongCountInCourse;
        
        const courseCard = createCourseCard(
            `No.${start + 1} - No.${end}`,
            `${start + 1}語目から${end}語目まで`,
            correctPercent,
            wrongPercent,
            completedCount,
            total,
            () => {
                // コースを選択したら、そのコースの単語範囲で学習方法選択モーダルを表示
                const { wrongSet } = loadCategoryWords(category);
                const wrongWordsInCourse = courseWords.filter(word => wrongSet.has(word.id));
                const savedIndex = loadProgress(category);
                const hasProgress = savedIndex > start && savedIndex < end;
                
                showMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, start, end);
            }
        );
        courseList.appendChild(courseCard);
    }
    
    courseSelection.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    // 設定ボタンを表示
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.remove('hidden');
    }
}

// コースカードを作成
function createCourseCard(title, description, correctPercent, wrongPercent, completedCount, total, onClick) {
    const card = document.createElement('button');
    card.className = 'category-card';
    card.onclick = onClick;
    
    const cardId = `course-${title.replace(/\s+/g, '-')}`;
    
    card.innerHTML = `
        <div class="category-info">
            <div class="category-header">
                <div class="category-name">${title}</div>
            </div>
            <div class="category-meta">${description}</div>
            <div class="category-progress">
                <div class="category-progress-bar">
                    <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                    <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                </div>
                <div class="category-progress-text">${completedCount} / ${total}</div>
            </div>
        </div>
        <div class="category-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
    `;
    
    return card;
    }

// 学習方法選択モーダルを表示
function showMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, courseStart, courseEnd) {
    elements.modalTitle.textContent = category;
    elements.modalMessage.textContent = '学習方法を選んでください';
    elements.modalActions.innerHTML = '';
    
    // カード形式のコンテナを作成
    const methodList = document.createElement('div');
    methodList.className = 'method-selection-list';
    
    // はじめから（常に表示）
    const startCard = createMethodCard('はじめから', '最初から学習を開始します', () => {
        closeModal();
        initLearning(category, courseWords, 0, courseWords.length, courseStart);
    });
    methodList.appendChild(startCard);

    // 前回の続きから（保存済みインデックスがこのコース範囲内にある場合のみ）
    if (hasProgress && savedIndex >= courseStart && savedIndex < courseEnd) {
        const relativeIndex = savedIndex - courseStart;
        const continueCard = createMethodCard('前回の続きから', '前回の続きから学習を再開します', () => {
            closeModal();
            initLearning(category, courseWords, relativeIndex, courseWords.length, savedIndex);
        });
        methodList.appendChild(continueCard);
    }

    // 間違えた問題（間違いがある場合のみ）
    if (wrongWordsInCourse.length > 0) {
        const wrongCard = createMethodCard(`間違えた問題 (${wrongWordsInCourse.length}問)`, '間違えた単語だけを復習します', () => {
            closeModal();
            initLearning('間違い復習', wrongWordsInCourse, 0, wrongWordsInCourse.length, 0);
        });
        methodList.appendChild(wrongCard);
    }

    // チェックした問題のみ（チェックがある場合のみ）
    const checkedWordsInCourse = courseWords.filter(word => reviewWords.has(word.id));
    if (checkedWordsInCourse.length > 0) {
        const checkedCard = createMethodCard(`チェックした問題のみ (${checkedWordsInCourse.length}問)`, 'チェックをつけた単語だけを復習します', () => {
            closeModal();
            initLearning('チェックした問題', checkedWordsInCourse, 0, checkedWordsInCourse.length, 0);
        });
        methodList.appendChild(checkedCard);
    }
    
    elements.modalActions.appendChild(methodList);
    
    // 背景クリックで閉じるイベント
    const handleOverlayClick = (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
            elements.modalOverlay.removeEventListener('click', handleOverlayClick);
        }
    };
    elements.modalOverlay.addEventListener('click', handleOverlayClick);
    
    elements.modalOverlay.classList.remove('hidden');
    // アニメーション用
    setTimeout(() => {
        elements.modalOverlay.classList.add('active');
    }, 10);
}

// 学習方法カードを作成
function createMethodCard(title, description, onClick) {
    const card = document.createElement('button');
    card.className = 'method-card';
    card.onclick = onClick;
    
    card.innerHTML = `
        <div class="method-card-info">
            <div class="method-card-title">${title}</div>
            <div class="method-card-description">${description}</div>
        </div>
        <div class="method-card-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
    `;
    
    return card;
}

// 学習初期化処理（共通化）
// rangeEnd: 学習範囲の終了index（exclusive）
// rangeStartOverride: 進捗計算に用いる開始index（表示開始位置をずらすため）
function initLearning(category, words, startIndex = 0, rangeEnd = undefined, rangeStartOverride = undefined) {
    selectedCategory = category;
    currentWords = words;
    isInputModeActive = false; // 通常のカードモードにリセット
    
    const start = Math.max(0, startIndex || 0);
    const end = typeof rangeEnd === 'number' ? Math.min(rangeEnd, currentWords.length) : currentWords.length;
    const rangeStart = typeof rangeStartOverride === 'number' ? rangeStartOverride : start;

    currentRangeStart = rangeStart;
    currentRangeEnd = end;
    currentIndex = start;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    // 設定ボタンを非表示
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.add('hidden');
    }
    
    document.body.classList.add('learning-mode');
    
    // 学習画面ではホームボタンを表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }

    // 間違い復習モードの場合のみCSSクラスを付与
    if (category === '間違い復習') {
        elements.mainContent.classList.add('mode-mistake');
    } else {
        elements.mainContent.classList.remove('mode-mistake');
    }

    // 入力モードを非表示、カードモードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const cardHint = document.getElementById('cardHint');
    
    if (inputMode) inputMode.classList.add('hidden');
    if (wordCard) wordCard.classList.remove('hidden');
    if (cardHint) cardHint.classList.remove('hidden');

    displayCurrentWord();
    updateStats();
    updateNavState('learning');
}

// イベントリスナーの設定
function setupEventListeners() {
    // カテゴリーボタン (クラス名変更に対応)
    document.querySelectorAll('.category-card[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.currentTarget.getAttribute('data-category');
            startCategory(category);
        });
    });
    
    // 間違い復習ボタン（カテゴリー選択画面） - 削除
    // const wrongWordsBtn = document.getElementById('wrongWordsCategoryBtn');
    // if (wrongWordsBtn) {
    //     wrongWordsBtn.addEventListener('click', showWrongWords);
    // }

    // ★ボタン（スワイプに影響させない）- 復習用チェック
    elements.starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleReview();
    });
    elements.starBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    // カードのタップで答えを表示
    elements.wordCard.addEventListener('click', handleCardTap);

    // スワイプ検知
    setupSwipeDetection(elements.wordCard);

    // elements.showWrongWordsBtn.addEventListener('click', showWrongWords); // 削除
    
    // 正解・不正解・完璧ボタン
    elements.correctBtn.addEventListener('click', () => markAnswer(true));
    elements.wrongBtn.addEventListener('click', () => markAnswer(false));
    elements.masteredBtn.addEventListener('click', () => markMastered());
    
    // ホームボタン
    if (elements.homeBtn) {
        elements.homeBtn.addEventListener('click', async () => {
            if (await showConfirm('学習を中断してホームに戻りますか？')) {
                showCategorySelection();
            }
        });
    }
    
    // 矢印ナビゲーション
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToPreviousWord();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToNextWord();
        });
    }
    
    // シャッフルボタン
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shuffleWords();
        });
    }
    
    // コース選択画面から戻るボタン
    const backToCategoryBtn = document.getElementById('backToCategoryBtn');
    if (backToCategoryBtn) {
        backToCategoryBtn.addEventListener('click', () => {
            const courseSelection = document.getElementById('courseSelection');
            if (courseSelection) {
                courseSelection.classList.add('hidden');
            }
            elements.categorySelection.classList.remove('hidden');
            elements.headerSubtitle.textContent = '大阪府公立高校対応';
        });
    }
    
    // 設定メニューボタン
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('hidden');
        });
        
        // メニュー外をクリックで閉じる
        document.addEventListener('click', (e) => {
            if (settingsMenu && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsMenu.classList.add('hidden');
            }
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            settingsMenu.classList.add('hidden');
            clearLearningHistory();
        });
    }
    
    // 日本語→英語入力モードのイベントリスナー
    const submitBtn = document.getElementById('submitBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    const inputStarBtn = document.getElementById('inputStarBtn');
    
    if (submitBtn) {
        // 解答ボタン
        submitBtn.addEventListener('click', () => {
            submitAnswer();
        });
        
        // Enterキーで解答（グローバルイベント）
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && isInputModeActive && !submitBtn.disabled && !inputAnswerSubmitted) {
                submitAnswer();
            }
        });
    }
    
    if (dontKnowBtn) {
        // わからないボタン
        dontKnowBtn.addEventListener('click', () => {
            markAnswerAsDontKnow();
        });
    }
    
    if (inputStarBtn) {
        inputStarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReview();
        });
    }
    
}

// 日本語→英語入力モードの表示
function displayInputMode() {
    if (currentIndex >= currentRangeEnd) {
        showInputCompletionScreen();
        return;
    }

    const word = currentWords[currentIndex];
    inputAnswerSubmitted = false;
    
    const inputWordNumber = document.getElementById('inputWordNumber');
    const inputMeaning = document.getElementById('inputMeaning');
    const letterInputs = document.getElementById('letterInputs');
    const submitBtn = document.getElementById('submitBtn');
    const inputResult = document.getElementById('inputResult');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswer = document.getElementById('correctAnswer');
    const inputStarBtn = document.getElementById('inputStarBtn');
    
    if (inputWordNumber) {
        inputWordNumber.textContent = `No.${word.id}`;
    }
    if (inputMeaning) {
        inputMeaning.textContent = word.meaning;
    }
    
    // 文字数分の入力フィールドを生成
    if (letterInputs) {
        letterInputs.innerHTML = '';
        const wordLength = word.word.length;
        
        for (let i = 0; i < wordLength; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'letter-input';
            input.maxLength = 1;
            input.dataset.index = i;
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.inputMode = 'text';
            input.setAttribute('inputmode', 'text');
            
            // 入力時の処理
            input.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                e.target.value = value;
                
                // 次のフィールドにフォーカス
                if (value && i < wordLength - 1) {
                    const nextInput = letterInputs.querySelector(`input[data-index="${i + 1}"]`);
                    if (nextInput) nextInput.focus();
                }
            });
            
            // バックスペースで前のフィールドに戻る
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && i > 0) {
                    const prevInput = letterInputs.querySelector(`input[data-index="${i - 1}"]`);
                    if (prevInput) prevInput.focus();
                }
            });
            
            letterInputs.appendChild(input);
        }
        
        // 最初の入力フィールドにフォーカス
        const firstInput = letterInputs.querySelector('input[data-index="0"]');
        if (firstInput) firstInput.focus();
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (dontKnowBtn) {
        dontKnowBtn.disabled = false;
    }
    if (inputResult) {
        inputResult.classList.add('hidden');
    }
    
    // チェックボタンの状態
    if (inputStarBtn) {
        if (reviewWords.has(word.id)) {
            inputStarBtn.classList.add('active');
        } else {
            inputStarBtn.classList.remove('active');
        }
    }
    
    updateStats();
}

// 前の単語に移動（履歴ベースではなく単純なインデックス操作）
function goToPreviousWord() {
    if (currentIndex > 0) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        elements.wordCard.classList.remove('flipped');
        
        currentIndex--;
        if (isInputModeActive) {
            displayInputMode();
        } else {
            displayCurrentWord();
        }
        // 前に戻った場合、進捗保存はしない（進んだときのみ保存するのが一般的）
    }
}

// 次の入力フィールドを追加
function addNextInputField() {
    const letterInputs = document.getElementById('letterInputs');
    if (!letterInputs) return;
    
    const inputs = letterInputs.querySelectorAll('.letter-input');
    const currentIndex = inputs.length;
    
    // 最後のフィールドに入力があるか確認
    const lastInput = inputs[inputs.length - 1];
    if (!lastInput || !lastInput.value) return;
    
    // 次のフィールドが既に存在するかチェック
    const existingNext = letterInputs.querySelector(`input[data-index="${currentIndex}"]`);
    if (existingNext) {
        existingNext.focus();
        return;
    }
    
    // 新しい入力フィールドを作成
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'letter-input';
    input.maxLength = 1;
    input.dataset.index = currentIndex;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.inputMode = 'text';
    input.setAttribute('inputmode', 'text');
    
    // 入力時の処理
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        e.target.value = value;
        
        // 入力があれば次のフィールドを追加
        if (value) {
            addNextInputField();
        }
    });
    
    // バックスペースで前のフィールドに戻る
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value) {
            const currentIdx = parseInt(e.target.dataset.index);
            if (currentIdx > 0) {
                const prevInput = letterInputs.querySelector(`input[data-index="${currentIdx - 1}"]`);
                if (prevInput) {
                    prevInput.focus();
                    // 現在のフィールドを削除
                    e.target.remove();
                }
            }
        }
    });
    
    letterInputs.appendChild(input);
    input.focus();
}

// 日本語→英語入力モードの回答送信
function submitAnswer() {
    if (inputAnswerSubmitted || currentIndex >= currentRangeEnd) return;
    
    const word = currentWords[currentIndex];
    const letterInputs = document.getElementById('letterInputs');
    const submitBtn = document.getElementById('submitBtn');
    const inputResult = document.getElementById('inputResult');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswer = document.getElementById('correctAnswer');
    
    if (!letterInputs || !inputResult || !resultMessage || !correctAnswer) return;
    
    // 入力された文字を結合
    const inputs = letterInputs.querySelectorAll('.letter-input');
    const userAnswer = Array.from(inputs).map(input => input.value.trim()).join('').toLowerCase();
    const correctWord = word.word.toLowerCase();
    
    inputAnswerSubmitted = true;
    
    // 入力フィールドを無効化
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    if (submitBtn) submitBtn.disabled = true;
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (dontKnowBtn) dontKnowBtn.disabled = true;
    
    // 1文字ごとに正解・不正解を表示（入力されているもののみ）
    inputs.forEach((input, index) => {
        const userChar = input.value.trim().toLowerCase();
        const correctChar = word.word[index] ? word.word[index].toLowerCase() : '';
        
        // 入力されていないフィールドは判定しない
        if (!userChar) return;
        
        if (userChar === correctChar) {
            input.classList.add('correct');
        } else {
            input.classList.add('wrong');
        }
    });
    
    // 正解/不正解の判定
    const isCorrect = userAnswer === correctWord;
    
    // 正解の単語を常に表示
    correctAnswer.textContent = word.word;
    inputResult.classList.remove('hidden');
    
    // 画面全体のフィードバック表示（テキストなし、色のみ）
    markAnswer(isCorrect);
    
    // 次へボタンを表示（自動で進まない）
    showNextButton();
}

// わからないボタンを押した場合の処理
function markAnswerAsDontKnow() {
    if (inputAnswerSubmitted || currentIndex >= currentRangeEnd) return;
    
    const word = currentWords[currentIndex];
    const letterInputs = document.getElementById('letterInputs');
    const submitBtn = document.getElementById('submitBtn');
    const inputResult = document.getElementById('inputResult');
    const correctAnswer = document.getElementById('correctAnswer');
    
    inputAnswerSubmitted = true;
    
    // 入力フィールドを無効化
    const inputs = letterInputs.querySelectorAll('.letter-input');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    if (submitBtn) submitBtn.disabled = true;
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (dontKnowBtn) dontKnowBtn.disabled = true;
    
    // 正解を表示
    correctAnswer.textContent = word.word;
    inputResult.classList.remove('hidden');
    
    // 間違い扱いにする
    markAnswer(false);
    
    // 次へボタンを表示（自動で進まない）
    showNextButton();
}

// 次へボタンを表示
function showNextButton() {
    const submitBtn = document.getElementById('submitBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    
    if (submitBtn) {
        submitBtn.textContent = '次へ';
        submitBtn.disabled = false;
        submitBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentIndex < currentRangeEnd - 1) {
                currentIndex++;
                // ボタンを元に戻す
                submitBtn.textContent = '解答';
                submitBtn.onclick = null; // イベントリスナーはsetupEventListenersで設定済み
                if (dontKnowBtn) {
                    dontKnowBtn.style.display = '';
                }
                displayInputMode();
            } else {
                showInputCompletionScreen();
            }
        };
    }
    
    if (dontKnowBtn) {
        dontKnowBtn.style.display = 'none';
    }
}

// 日本語→英語モードの完了画面を表示
function showInputCompletionScreen() {
    const inputMode = document.getElementById('inputMode');
    
    if (inputMode) {
        inputMode.classList.add('hidden');
    }
    
    // 完了メッセージを表示
    showAlert('通知', `学習完了！\n覚えた数: ${correctCount}\n覚えていない数: ${wrongCount}`);
    
    // ホームに戻る
    setTimeout(() => {
        showCategorySelection();
    }, 2000);
}

// 前の単語に移動（履歴ベースではなく単純なインデックス操作）
function goToPreviousWord() {
    if (currentIndex > 0) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        elements.wordCard.classList.remove('flipped');
        
        currentIndex--;
        displayCurrentWord();
        // 前に戻った場合、進捗保存はしない（進んだときのみ保存するのが一般的）
    }
}

// 次の単語に移動（回答せずに進む場合）
function goToNextWord() {
    if (currentIndex < currentWords.length - 1) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        elements.wordCard.classList.remove('flipped');

        currentIndex++;
        displayCurrentWord();
        // ここで進捗保存するかは要件次第だが、回答していないので保存しない方が無難
        // もし「見た」だけで進捗とするなら保存する。今回は保存しない。
    }
}

// ナビゲーションボタンの状態更新
/*
function updateNavButtons() {
    if (!elements.prevBtn || !elements.nextBtn) return;
    
    elements.prevBtn.disabled = currentIndex === 0;
    elements.nextBtn.disabled = currentIndex >= currentWords.length - 1;
}
*/

// 前の単語に移動
// function goToPreviousWord() { ... } // 削除（履歴を残す実装の場合は必要だが今回は削除）

// ナビゲーションの状態更新（ナビゲーションバー削除により不要）
function updateNavState(state) {
    // ナビゲーションバーを削除したため、この関数は空
}

// スワイプ検知の設定
function setupSwipeDetection(card) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const getPoint = (e) => {
        if (e.touches && e.touches[0]) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches[0]) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handleStart = (e) => {
        const point = getPoint(e);
        startX = point.x;
        startY = point.y;
        isDragging = true;
        card.classList.add('dragging');
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        
        // 表面ならスワイプ無効
        if (!card.classList.contains('flipped')) return;
        
        const point = getPoint(e);
        const dx = point.x - startX;
        const dy = point.y - startY;

        // 間違い復習モードのみ上スワイプ有効
        const isMistakeMode = selectedCategory === '間違い復習';

        // 横スワイプまたは上スワイプ
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
            // 裏面：正解/不正解（回転あり）
            card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
            const opacityDrop = Math.min(Math.abs(dx) / 180, 0.18);
            card.style.opacity = `${1 - opacityDrop}`;
        } else if (isMistakeMode && dy < -6 && Math.abs(dy) > Math.abs(dx)) {
            // 上移動（完璧）- 裏面のみ
            card.style.transform = `translateY(${dy}px) scale(${1 + dy/1000})`;
            const opacityDrop = Math.min(Math.abs(dy) / 180, 0.18);
            card.style.opacity = `${1 - opacityDrop}`;
        }
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        
        // 表面なら処理しない
        if (!card.classList.contains('flipped')) return;

        const point = getPoint(e);
        const dx = point.x - startX;
        const dy = point.y - startY;

        const threshold = 80;
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        const isVertical = Math.abs(dy) > Math.abs(dx);
        const isMistakeMode = selectedCategory === '間違い復習';

        card.style.transition = '';

        if (isHorizontal && Math.abs(dx) > threshold) {
            // 裏面：判定
            if (dx < 0) {
                markAnswer(true);
            } else {
                markAnswer(false);
            }
        } else if (isMistakeMode && isVertical && dy < -threshold) {
            // 上スワイプ（完璧）
            markMastered();
        } else {
            // 元に戻る
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            card.style.transform = '';
            card.style.opacity = '';
        }
    };

    // pointerイベントでタッチ/マウス両方をサポート
    card.addEventListener('pointerdown', handleStart);
    card.addEventListener('pointermove', handleMove);
    card.addEventListener('pointerup', handleEnd);
    card.addEventListener('pointerleave', handleEnd);
}

// カードをタップして答え表示
function handleCardTap() {
    if (!isCardRevealed) {
        revealCard();
        return;
    }
    isCardRevealed = false;
    elements.wordCard.classList.remove('flipped');
    // カードが元に戻ったとき、ボタンを非表示
    const actionHint = document.getElementById('cardHint');
    if (actionHint) {
        actionHint.style.display = 'none';
    }
    // elements.cardHint.textContent = 'タップでカードをひっくり返す';
}

function revealCard() {
    isCardRevealed = true;
    elements.wordCard.classList.add('flipped');
    // カードがひっくり返ったとき、ボタンを表示
    const actionHint = document.getElementById('cardHint');
    if (actionHint) {
        actionHint.style.display = 'flex';
    }
    // elements.cardHint.textContent = 'スワイプして正解/不正解を選んでください';
}

// 復習チェックの切り替え
function toggleReview() {
    if (currentIndex >= currentWords.length) return;

    const word = currentWords[currentIndex];
    if (reviewWords.has(word.id)) {
        reviewWords.delete(word.id);
    } else {
        reviewWords.add(word.id);
    }

    saveReviewWords();
    updateStarButton();
    applyMarkers(word);
}

// ★ボタンの状態を更新（復習チェック用）
function updateStarButton() {
    if (currentIndex >= currentWords.length) return;

    const word = currentWords[currentIndex];
    if (reviewWords.has(word.id)) {
        elements.starBtn.classList.add('active');
    } else {
        elements.starBtn.classList.remove('active');
    }
}

    // 復習チェック一覧を表示
    // (startCategoryの変更に伴い、呼び出しロジックを調整)
    // 既存のshowReviewWords等は startCategory を呼ばず独自に初期化している部分もあるが、
    // ここでは startCategory 内の分岐ロジック修正に合わせて、
    // 呼び出し元の修正は最小限に留める。
    // ただし、startCategory('復習チェック') と呼ぶと不具合が出るため、
    // showReviewWords 内で initLearning を呼ぶ形にするのが安全。

function showReviewWords() {
    const reviews = wordData.filter(word => reviewWords.has(word.id));

    if (reviews.length === 0) {
        showAlert('通知', '復習チェックが付いた単語がありません。');
        return;
    }

    showConfirm(`復習チェック${reviews.length}語で学習を開始しますか？`).then(result => {
        if (result) {
            initLearning('復習チェック', reviews, 0);
        }
    });
}

// 間違えた単語一覧を表示
function showWrongWords() {
    const wrongs = wordData.filter(word => wrongWords.has(word.id));

    if (wrongs.length === 0) {
        showAlert('通知', '間違えた単語がありません。');
        return;
    }

    showConfirm(`間違えた単語${wrongs.length}語で復習を開始しますか？`).then(result => {
        if (result) {
            initLearning('間違い復習', wrongs, 0);
        }
    });
}

// マーカーを適用（重ね塗りなし。黄は上段、赤/青は下段で2本見える）
function applyMarkers(word) {
    if (!word || !elements.englishWord) return;

    // start/endは0-1で位置指定。黄は上段、赤/青は下段。間に小さな空白を設ける。
    const band = (color, start = 0.6, end = 0.82) =>
        `linear-gradient(180deg, transparent ${start * 100}%, ${color} ${start * 100}%, ${color} ${end * 100}%, transparent ${end * 100}%)`;

    const layers = [];
    
    // カテゴリごとの進捗を取得（カテゴリがある場合）
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory) {
        const categoryWords = loadCategoryWords(selectedCategory);
        categoryCorrectSet = categoryWords.correctSet;
        categoryWrongSet = categoryWords.wrongSet;
    }

    if (reviewWords.has(word.id)) {
        // 黄は蛍光マーカー風（上段、少し広め・明るめ）
        layers.push(band('rgba(253, 253, 112, 0.55)', 0.34, 0.54));
        // 下段は赤優先、なければ青（黄との間に僅かな空白）
        if (categoryWrongSet.has(word.id)) {
            layers.push(band('rgba(239, 68, 68, 0.28)', 0.60, 0.82));
        } else if (categoryCorrectSet.has(word.id)) {
            layers.push(band('rgba(59, 130, 246, 0.30)', 0.60, 0.82));
        }
    } else if (categoryWrongSet.has(word.id)) {
        layers.push(band('rgba(239, 68, 68, 0.30)', 0.60, 0.82));
    } else if (categoryCorrectSet.has(word.id)) {
        layers.push(band('rgba(59, 130, 246, 0.32)', 0.60, 0.82));
    }

    const image = layers.join(',');
    elements.englishWord.style.backgroundImage = image;
    elements.englishWord.style.backgroundSize = image ? '100% 100%' : '';
    elements.englishWord.style.backgroundRepeat = image ? 'no-repeat' : '';
    elements.englishWord.style.backgroundPosition = image ? '0 0' : '';
}

// 現在の単語を表示
function displayCurrentWord() {
    if (currentIndex >= currentRangeEnd) {
        // 学習完了時は何も表示しない（完了画面を削除）
        return;
    }

    const word = currentWords[currentIndex];
    isCardRevealed = false;
    elements.wordCard.classList.remove('flipped');
    elements.wordCard.style.transform = '';
    elements.wordCard.style.opacity = '';
    
    // カードが元に戻ったとき、ボタンを非表示
    const actionHint = document.getElementById('cardHint');
    if (actionHint) {
        actionHint.style.display = 'none';
    }

    // 単語番号は元のIDを使用（シャッフル後も元の番号を表示）
    elements.wordNumber.textContent = `No.${word.id}`;
    elements.englishWord.textContent = word.word;
    applyMarkers(word);
    
    // 品詞の分割と色分け表示
    const posList = (word.partOfSpeech || '').split('・');
    elements.posContainer.innerHTML = ''; // クリア
    
    posList.forEach(pos => {
        const span = document.createElement('div');
        span.className = 'part-of-speech';
        span.textContent = pos;
        
        if (pos.includes('動詞')) {
            span.classList.add('verb');
        } else if (pos.includes('名詞')) {
            span.classList.add('noun');
        } else if (pos.includes('形容詞')) {
            span.classList.add('adjective');
        } else if (pos.includes('副詞')) {
            span.classList.add('adverb');
        } else {
            span.classList.add('other');
        }
        elements.posContainer.appendChild(span);
    });

    // 裏面にも品詞を表示
    const posContainerBack = document.getElementById('posContainerBack');
    if (posContainerBack) {
        posContainerBack.innerHTML = elements.posContainer.innerHTML;
    }
    
    // スタイルリセット
    elements.wordNumber.style.backgroundColor = '';
    elements.wordNumber.style.color = '';

    elements.meaning.textContent = word.meaning;

    // elements.cardHint.textContent = 'タップでカードをひっくり返す'; // ヒントはCSSで固定表示に変更したためJS制御不要
    updateStarButton();
    updateStats();
    updateNavButtons(); // ボタン状態更新
}

// ナビゲーションボタンの状態更新
function updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (!prevBtn || !nextBtn) return;
    
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= currentRangeEnd - 1;
}

// 完璧としてマーク（上スワイプ）
function markMastered() {
    if (currentIndex >= currentWords.length) return;

    const word = currentWords[currentIndex];
    answeredWords.add(word.id);
    
    // 正解としてカウント
    correctCount++;
    correctWords.add(word.id);
    
    // カテゴリごとの進捗を更新
    if (selectedCategory) {
        const { correctSet, wrongSet } = loadCategoryWords(selectedCategory);
        correctSet.add(word.id);
        wrongSet.delete(word.id);
        saveCategoryWords(selectedCategory, correctSet, wrongSet);
    }
    
    saveCorrectWords();
    
    // 完璧なので間違いリストから削除
    if (wrongWords.has(word.id)) {
        wrongWords.delete(word.id);
        saveWrongWords();
    }

    applyMarkers(word);
    updateStats();

    // 画面全体のフィードバック表示（薄い水色）
    elements.feedbackOverlay.className = `feedback-overlay mastered active`;
    setTimeout(() => {
        elements.feedbackOverlay.classList.remove('active');
    }, 400);

    // 上スワイプアニメーション
    elements.wordCard.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
    elements.wordCard.style.transform = `translateY(-120%) scale(0.8)`;
    elements.wordCard.style.opacity = '0.2';

    setTimeout(() => {
        elements.wordCard.style.transition = '';
        elements.wordCard.style.transform = '';
        elements.wordCard.style.opacity = '';
        currentIndex++;
        // 進捗を保存
        if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習') {
            saveProgress(selectedCategory, currentIndex);
        }
        displayCurrentWord();
    }, 180);
}

// スワイプまたはボタンで正解/不正解をマーク
function markAnswer(isCorrect) {
    if (currentIndex >= currentWords.length) return;

    const word = currentWords[currentIndex];
    answeredWords.add(word.id);

    if (isCorrect) {
        correctCount++;
        correctWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        if (selectedCategory) {
            const { correctSet, wrongSet } = loadCategoryWords(selectedCategory);
            correctSet.add(word.id);
            // 正解した場合は間違いリストから削除
            wrongSet.delete(word.id);
            saveCategoryWords(selectedCategory, correctSet, wrongSet);
        }
        
        saveCorrectWords();
    } else {
        wrongCount++;
        // 間違えた場合は間違いリストに追加
        wrongWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        if (selectedCategory) {
            const { correctSet, wrongSet } = loadCategoryWords(selectedCategory);
            wrongSet.add(word.id);
            // 間違えた場合は正解リストから削除
            correctSet.delete(word.id);
            saveCategoryWords(selectedCategory, correctSet, wrongSet);
        }
        
        saveWrongWords();
    }

    applyMarkers(word);
    updateStats();

    // 画面全体のフィードバック表示（薄い色）
    elements.feedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
    setTimeout(() => {
        elements.feedbackOverlay.classList.remove('active');
    }, 400);

    // 軽いスワイプアニメーション
    const direction = isCorrect ? -120 : 120;
    elements.wordCard.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
    elements.wordCard.style.transform = `translateX(${direction}%) rotate(${isCorrect ? -12 : 12}deg)`;
    elements.wordCard.style.opacity = '0.2';

    setTimeout(() => {
        elements.wordCard.style.transition = '';
        elements.wordCard.style.transform = '';
        elements.wordCard.style.opacity = '';
        currentIndex++;
        // 進捗を保存
        if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習') {
            saveProgress(selectedCategory, currentIndex);
        }
        displayCurrentWord();
    }, 180);
}

// 完了画面を表示
function showCompletion() {
    // elements.englishWord.textContent = '完了！'; // 削除：カード表示を変更しない
    showConfirm(`学習完了！\n覚えた数: ${correctCount}\n覚えていない数: ${wrongCount}\n\nもう一度学習しますか？`).then(result => {
        if (result) {
            // 進捗をリセットして最初から
            if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習') {
                resetProgress(selectedCategory);
            }
            
            if (selectedCategory === '間違い復習') {
                // 間違い復習の場合はリストを再取得（削除されたものを除外）
                const wrongs = wordData.filter(word => wrongWords.has(word.id));
                if (wrongs.length === 0) {
                    showAlert('通知', '全ての間違いをクリアしました！');
                    showCategorySelection();
                    return;
                }
                initLearning('間違い復習', wrongs, 0);
            } else if (selectedCategory === '復習チェック') {
                // 復習チェックの場合もリストを再取得（削除されたものを除外）
                const reviews = wordData.filter(word => reviewWords.has(word.id));
                if (reviews.length === 0) {
                    showAlert('通知', '全ての復習チェックをクリアしました！');
                    showCategorySelection();
                    return;
                }
                initLearning('復習チェック', reviews, 0);
            } else if (selectedCategory) {
                // 通常カテゴリー
                initLearning(selectedCategory, currentWords, 0);
            } else {
                showCategorySelection();
            }
        } else {
            showCategorySelection(); // キャンセル時はホームへ
        }
    });
}

// 統計を更新
function updateStats() {
    const total = currentRangeEnd - currentRangeStart;
    // 現在見ている英単語の位置（1から始まる）
    const currentPosition = currentIndex + 1;
    // 進捗率は現在位置を基準に計算
    const progressPercent = total > 0 ? Math.min((currentPosition / total) * 100, 100) : 0;
    
    elements.progressText.textContent = `${currentPosition} / ${total}`;
    if (elements.progressFill) {
    elements.progressFill.style.width = `${progressPercent}%`;
    }
}

// リセット
function resetApp() {
    showConfirm('学習をリセットしますか？').then(result => {
        if (result) {
            if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習') {
                resetProgress(selectedCategory);
            }
            if (selectedCategory) {
                startCategory(selectedCategory);
            } else {
                showCategorySelection();
            }
        }
    });
}

// 学習履歴を消す
function clearLearningHistory() {
    showConfirm('全ての学習履歴を消去しますか？\n（正解・間違い・復習チェック・進捗が全て消えます）').then(result => {
        if (result) {
            // 全ての学習履歴をクリア
            correctWords.clear();
            wrongWords.clear();
            reviewWords.clear();
            
            // localStorageからも削除
            localStorage.removeItem('correctWords');
            localStorage.removeItem('wrongWords');
            localStorage.removeItem('reviewWords');
            localStorage.removeItem('learningProgress');
            
            // 画面を更新
            if (elements.categorySelection && !elements.categorySelection.classList.contains('hidden')) {
                loadData();
                updateCategoryStars();
            }
            
            showAlert('通知', '学習履歴を消去しました。');
        }
    });
}

// シャッフル
function shuffleWords() {
    for (let i = currentWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentWords[i], currentWords[j]] = [currentWords[j], currentWords[i]];
    }

    currentIndex = 0;
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    
    // 進捗をリセット
    if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習') {
        resetProgress(selectedCategory);
    }
    
    displayCurrentWord();
    updateStats();

    showAlert('通知', '単語をシャッフルしました。');
}

// アプリケーションの起動
init();
