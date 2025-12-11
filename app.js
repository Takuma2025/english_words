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
let isShiftActive = false; // Shiftキーがアクティブかどうか（大文字入力モード）

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
    const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'Group1 超頻出600', 'Group2 頻出200', 'Group3 ハイレベル100', '基本語彙500'];
    
    categories.forEach(category => {
        const element = document.getElementById(`stars-${category}`);
        if (!element) return;
        
        let categoryWords;
        if (category === '基本語彙500') {
            categoryWords = wordData.slice(0, Math.min(500, wordData.length));
        } else if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
            // elementaryWordDataが定義されているか確認
            if (typeof elementaryWordData !== 'undefined') {
                categoryWords = elementaryWordData;
            } else {
                categoryWords = [];
            }
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
            // 最初の部分は「小学生で習った単語とカテゴリー別に覚える単語」として扱う
            // その後、Group1 超頻出600、Group2 頻出200、Group3 ハイレベル100に分割
            // 注意: 実際のデータ構造に応じて調整が必要
            if (index < 600) {
                word.category = 'Group1 超頻出600';
            } else if (index < 800) {
                word.category = 'Group2 頻出200';
            } else if (index < 900) {
                word.category = 'Group3 ハイレベル100';
            } else {
                // 900以降は「小学生で習った単語とカテゴリー別に覚える単語」として扱う
                // または、データ構造に応じて調整
                word.category = '小学生で習った単語とカテゴリー別に覚える単語';
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
    
    // ホーム画面に追加されていない場合のみオーバレイを表示
    checkAndShowInstallPrompt();
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
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、elementaryWordDataを使用
    let categoryWords;
    if (category === '基本語彙500') {
        categoryWords = wordData.slice(0, Math.min(500, wordData.length));
    } else if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        // elementaryWordDataが定義されているか確認
        if (typeof elementaryWordData !== 'undefined') {
            categoryWords = elementaryWordData;
        } else {
            showAlert('エラー', '小学生で習った単語データが見つかりません。');
            return;
        }
    } else {
        categoryWords = wordData.filter(word => word.category === category);
    }

    if (categoryWords.length === 0) {
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    // カテゴリー選択画面を非表示
    elements.categorySelection.classList.add('hidden');
    
    // 基本語彙500と小学生で習った単語の場合は学習方法選択モーダルを表示
    if (category === '基本語彙500' || category === '小学生で習った単語とカテゴリー別に覚える単語') {
        const { wrongSet } = loadCategoryWords(category);
        const wrongWordsInCategory = categoryWords.filter(word => wrongSet.has(word.id));
        const savedIndex = loadProgress(category);
        const hasProgress = savedIndex > 0;
        
        showInputModeMethodSelectionModal(category, categoryWords, hasProgress, savedIndex, wrongWordsInCategory);
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

// 入力モード用の学習方法選択モーダルを表示
function showInputModeMethodSelectionModal(category, categoryWords, hasProgress, savedIndex, wrongWordsInCategory) {
    elements.modalTitle.textContent = category;
    elements.modalMessage.textContent = '学習方法を選んでください';
    elements.modalActions.innerHTML = '';
    
    // カード形式のコンテナを作成
    const methodList = document.createElement('div');
    methodList.className = 'method-selection-list';
    
    // はじめから（常に表示）
    const startCard = createMethodCard('はじめから', '最初から学習を開始します', () => {
        closeModal();
        initInputModeLearning(category, categoryWords);
    });
    methodList.appendChild(startCard);

    // 前回の続きから（保存済みインデックスがある場合のみ）
    if (hasProgress && savedIndex > 0 && savedIndex < categoryWords.length) {
        const continueCard = createMethodCard('前回の続きから', '前回の続きから学習を再開します', () => {
            closeModal();
            const remainingWords = categoryWords.slice(savedIndex);
            initInputModeLearning(category, remainingWords);
        });
        methodList.appendChild(continueCard);
    }

    // 間違えた問題（間違いがある場合のみ）
    if (wrongWordsInCategory.length > 0) {
        const wrongCard = createMethodCard(`間違えた問題 (${wrongWordsInCategory.length}問)`, '間違えた単語だけを復習します', () => {
            closeModal();
            initInputModeLearning('間違い復習', wrongWordsInCategory);
        });
        methodList.appendChild(wrongCard);
    }

    // チェックした問題のみ（チェックがある場合のみ）
    const checkedWordsInCategory = categoryWords.filter(word => reviewWords.has(word.id));
    if (checkedWordsInCategory.length > 0) {
        const checkedCard = createMethodCard(`チェックした問題のみ (${checkedWordsInCategory.length}問)`, 'チェックをつけた単語だけを復習します', () => {
            closeModal();
            initInputModeLearning('チェックした問題', checkedWordsInCategory);
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (inputMode) inputMode.classList.add('hidden');
    if (wordCard) wordCard.classList.remove('hidden');
    if (cardHint) cardHint.classList.remove('hidden');
    
    // 基本語彙500と小学生で習った単語のときだけ前へ・次へボタンを非表示、それ以外は表示
    if (category === '基本語彙500' || category === '小学生で習った単語とカテゴリー別に覚える単語') {
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
    } else {
        if (prevBtn) prevBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
    }

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
    const inputStarBtn = document.getElementById('inputStarBtn');
    
    // Enterキーで解答（グローバルイベント）
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && isInputModeActive && !inputAnswerSubmitted) {
            submitAnswer();
        }
    });
    
    
    if (inputStarBtn) {
        inputStarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReview();
        });
    }
    
    // 仮想キーボードのイベントリスナー
    setupVirtualKeyboard();
    
}

// 仮想キーボードの設定
function setupVirtualKeyboard() {
    const keyboard = document.getElementById('virtualKeyboard');
    if (!keyboard) return;
    
    // キーボードキーのタッチ/クリックイベント（タッチ優先で即座に反応）
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const letter = key.dataset.key;
        
        // スペースキーの特別処理
        if (letter === ' ') {
            const handleSpace = (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertLetter(' ');
            };
            
            key.addEventListener('touchstart', handleSpace, { passive: false });
            key.addEventListener('click', handleSpace);
        } else {
            // 通常の文字キー
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertLetter(letter);
            }, { passive: false });
            
            key.addEventListener('click', (e) => {
                e.preventDefault();
                insertLetter(letter);
            });
        }
    });
    
    // Shiftキー
    const shiftKey = document.getElementById('keyboardShift');
    if (shiftKey) {
        const handleShift = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleShift();
        };
        
        shiftKey.addEventListener('touchstart', handleShift, { passive: false });
        shiftKey.addEventListener('click', handleShift);
    }
    
    // バックスペースキー
    const backspaceKey = document.getElementById('keyboardBackspace');
    if (backspaceKey) {
        backspaceKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBackspace();
        }, { passive: false });
        
        backspaceKey.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackspace();
        });
    }
    
    // 解答ボタン（決定ボタン）
    const decideBtn = document.getElementById('keyboardDecide');
    if (decideBtn) {
        const handleDecide = (e) => {
            e.preventDefault();
            if (isInputModeActive) {
                if (!inputAnswerSubmitted) {
                    submitAnswer();
                } else {
                    // 回答済みの場合は次へ進む
                    if (currentIndex < currentRangeEnd - 1) {
                        // カードを横にスライドアウト
                        const inputModeContent = document.querySelector('.input-mode-content');
                        if (inputModeContent) {
                            // 現在のカードを左にスライドアウト
                            inputModeContent.classList.add('slide-out');
                            
                            // アニメーション後に次へ進む
                            setTimeout(() => {
                                currentIndex++;
                                inputAnswerSubmitted = false;
                                decideBtn.textContent = '解答';
                                const passBtn = document.getElementById('keyboardPass');
                                if (passBtn) passBtn.style.display = '';
                                
                                // まず新しいカードを右側に配置（slide-outを削除してslide-inを追加）
                                inputModeContent.classList.remove('slide-out', 'active');
                                inputModeContent.classList.add('slide-in');
                                
                                // コンテンツを更新（アニメーションリセットをスキップ）
                                displayInputMode(true);
                                
                                // ブラウザにレンダリングを強制して右側の位置を確定
                                void inputModeContent.offsetHeight;
                                
                                // 次のフレームで右から左にスライドイン
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        inputModeContent.classList.add('active');
                                    });
                                });
                                
                                // アニメーション完了後にクラスをクリア
                                setTimeout(() => {
                                    inputModeContent.classList.remove('slide-in', 'active');
                                }, 300);
                            }, 300);
                        } else {
                            // フォールバック：アニメーションなしで進む
                            currentIndex++;
                            inputAnswerSubmitted = false;
                            decideBtn.textContent = '解答';
                            const passBtn = document.getElementById('keyboardPass');
                            if (passBtn) passBtn.style.display = '';
                            displayInputMode();
                        }
                    } else {
                        showInputCompletionScreen();
                    }
                }
            }
        };
        
        decideBtn.addEventListener('touchstart', handleDecide, { passive: false });
        decideBtn.addEventListener('click', handleDecide);
    }
    
    // パスボタン
    const passBtn = document.getElementById('keyboardPass');
    if (passBtn) {
        const handlePass = (e) => {
            e.preventDefault();
            if (!inputAnswerSubmitted && isInputModeActive) {
                markAnswerAsDontKnow();
            }
        };
        
        passBtn.addEventListener('touchstart', handlePass, { passive: false });
        passBtn.addEventListener('click', handlePass);
    }
}

// 文字を入力フィールドに挿入
function insertLetter(letter) {
    if (inputAnswerSubmitted || !isInputModeActive) return;
    
    const letterInputs = document.getElementById('letterInputs');
    if (!letterInputs) return;
    
    const inputs = letterInputs.querySelectorAll('.letter-input:not([disabled])');
    const activeInput = Array.from(inputs).find(input => !input.value || document.activeElement === input);
    
    if (activeInput) {
        // スペースの場合はそのまま、それ以外はShiftキーの状態に応じて大文字小文字を変換
        let letterToInsert;
        const wasShiftActive = isShiftActive; // 入力前のShift状態を保存
        
        if (letter === ' ') {
            letterToInsert = ' '; // スペースはそのまま
        } else {
            // Shiftキーがアクティブの場合は大文字、そうでなければ小文字
            // letterはdata-keyから取得した小文字なので、toUpperCase()で大文字に変換
            if (wasShiftActive) {
                letterToInsert = String(letter).toUpperCase();
                // 1文字入力したら自動的に小文字モードに戻る
                toggleShift();
            } else {
                letterToInsert = String(letter).toLowerCase();
            }
        }
        
        // 直接値を設定（inputイベントで小文字に変換されるのを防ぐ）
        activeInput.value = letterToInsert;
        
        // inputイベントを発火して次のフィールドにフォーカスを移動
        const inputEvent = new Event('input', { bubbles: true });
        activeInput.dispatchEvent(inputEvent);
        
        // 次のフィールドにフォーカス
        const nextInput = letterInputs.querySelector(`input[data-index="${parseInt(activeInput.dataset.index) + 1}"]`);
        if (nextInput && !nextInput.disabled) {
            nextInput.focus();
        }
    }
}

// Shiftキーのトグルとキーボード表示の更新
function toggleShift() {
    isShiftActive = !isShiftActive;
    const shiftKey = document.getElementById('keyboardShift');
    if (shiftKey) {
        if (isShiftActive) {
            shiftKey.classList.add('active');
            shiftKey.dataset.shift = 'true';
        } else {
            shiftKey.classList.remove('active');
            shiftKey.dataset.shift = 'false';
        }
    }
    updateKeyboardDisplay();
}

// キーボードの表示を更新（大文字/小文字）
function updateKeyboardDisplay() {
    const keyboard = document.getElementById('virtualKeyboard');
    if (!keyboard) return;
    
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const letter = key.dataset.key;
        if (letter && letter !== ' ') { // スペースキーは除外
            if (isShiftActive) {
                key.textContent = letter.toUpperCase();
            } else {
                key.textContent = letter.toLowerCase();
            }
        }
    });
}

// バックスペース処理
function handleBackspace() {
    if (inputAnswerSubmitted || !isInputModeActive) return;
    
    const letterInputs = document.getElementById('letterInputs');
    if (!letterInputs) return;
    
    const inputs = letterInputs.querySelectorAll('.letter-input:not([disabled])');
    const activeInput = document.activeElement;
    
    if (activeInput && activeInput.classList.contains('letter-input')) {
        if (activeInput.value) {
            activeInput.value = '';
        } else {
            // 前のフィールドに移動
            const currentIndex = parseInt(activeInput.dataset.index);
            if (currentIndex > 0) {
                const prevInput = letterInputs.querySelector(`input[data-index="${currentIndex - 1}"]`);
                if (prevInput && !prevInput.disabled) {
                    prevInput.focus();
                    prevInput.value = '';
                }
            }
        }
    } else {
        // フォーカスがない場合は最後の入力済みフィールドをクリア
        const filledInputs = Array.from(inputs).filter(input => input.value);
        if (filledInputs.length > 0) {
            const lastInput = filledInputs[filledInputs.length - 1];
            lastInput.value = '';
            lastInput.focus();
        }
    }
}

// 日本語→英語入力モードの表示
function displayInputMode(skipAnimationReset = false) {
    if (currentIndex >= currentRangeEnd) {
        showInputCompletionScreen();
        return;
    }

    // アニメーションクラスをリセット（スキップフラグがfalseの場合のみ）
    if (!skipAnimationReset) {
        const inputModeContent = document.querySelector('.input-mode-content');
        if (inputModeContent) {
            inputModeContent.classList.remove('slide-out', 'slide-in', 'active');
        }
    }

    const word = currentWords[currentIndex];
    inputAnswerSubmitted = false;
    
    // No.を更新
    if (elements.wordNumber) {
        elements.wordNumber.textContent = `No.${word.id}`;
    }
    
    const inputMeaning = document.getElementById('inputMeaning');
    const letterInputs = document.getElementById('letterInputs');
    const submitBtn = document.getElementById('submitBtn');
    const inputResult = document.getElementById('inputResult');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswer = document.getElementById('correctAnswer');
    const inputStarBtn = document.getElementById('inputStarBtn');
    
    if (inputMeaning) {
        // 品詞を一文字に変換
        const posShort = getPartOfSpeechShort(word.partOfSpeech || '');
        const posClass = getPartOfSpeechClass(word.partOfSpeech || '');
        
        // 意味の前に品詞を表示
        const meaningWrapper = inputMeaning.parentElement;
        let posElement = document.getElementById('inputPosInline');
        if (!posElement) {
            posElement = document.createElement('span');
            posElement.id = 'inputPosInline';
            posElement.className = `pos-inline part-of-speech ${posClass}`;
            meaningWrapper.insertBefore(posElement, inputMeaning);
        }
        if (posShort) {
            posElement.textContent = posShort;
            posElement.className = `pos-inline part-of-speech ${posClass}`;
            posElement.style.display = '';
        } else {
            posElement.style.display = 'none';
        }
        
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
            input.inputMode = 'none';
            input.setAttribute('inputmode', 'none');
            input.setAttribute('readonly', 'readonly');
            
            // 入力時の処理（大文字小文字を保持）
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                // 大文字小文字を保持したまま設定（小文字に変換しない）
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
    }
    
    // 仮想キーボードのボタンは常に有効
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
    
    // マーカーを適用
    applyMarkers(word);
    
    // Shiftキーの状態をリセット
    isShiftActive = false;
    const shiftKey = document.getElementById('keyboardShift');
    if (shiftKey) {
        shiftKey.classList.remove('active');
        shiftKey.dataset.shift = 'false';
    }
    updateKeyboardDisplay(); // キーボード表示を更新
    
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
    const inputResult = document.getElementById('inputResult');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswer = document.getElementById('correctAnswer');
    
    if (!letterInputs || !inputResult || !resultMessage || !correctAnswer) return;
    
    // 入力された文字を結合（大文字小文字を区別）
    const inputs = letterInputs.querySelectorAll('.letter-input');
    const userAnswer = Array.from(inputs).map(input => input.value.trim()).join('');
    const correctWord = word.word;
    
    inputAnswerSubmitted = true;
    
    // 入力フィールドを無効化
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // 仮想キーボードのボタンは無効化しない（回答後も次へ進めるため）
    
    // 1文字ごとに正解・不正解を表示（入力されていない部分も赤く表示、大文字小文字を区別）
    inputs.forEach((input, index) => {
        const userChar = input.value.trim();
        const correctChar = word.word[index] || '';
        
        // 入力されていないフィールドは赤く表示
        if (!userChar) {
            input.classList.add('wrong');
            return;
        }
        
        if (userChar === correctChar) {
            input.classList.add('correct');
        } else {
            input.classList.add('wrong');
        }
    });
    
    // 正解/不正解の判定（大文字小文字を区別）
    const isCorrect = userAnswer === correctWord;
    
    // 正解の単語を表示（常に緑色で表示）
    correctAnswer.textContent = word.word;
    correctAnswer.classList.add('correct');
    correctAnswer.classList.remove('wrong');
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
    const inputResult = document.getElementById('inputResult');
    const correctAnswer = document.getElementById('correctAnswer');
    
    inputAnswerSubmitted = true;
    
    // 入力フィールドを無効化
    const inputs = letterInputs.querySelectorAll('.letter-input');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // 仮想キーボードのボタンは無効化しない
    
    // 正解を表示（緑色で表示）
    correctAnswer.textContent = word.word;
    correctAnswer.classList.add('correct');
    correctAnswer.classList.remove('wrong');
    inputResult.classList.remove('hidden');
    
    // 間違い扱いにする
    markAnswer(false);
    
    // 次へボタンを表示（自動で進まない）
    showNextButton();
}

// 次へボタンを表示
function showNextButton() {
    const decideBtn = document.getElementById('keyboardDecide');
    const passBtn = document.getElementById('keyboardPass');
    
    if (decideBtn) {
        decideBtn.textContent = '次へ';
    }
    
    if (passBtn) {
        passBtn.style.display = 'none';
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
    let animationFrameId = null;

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
        // 表面ならスワイプ無効
        if (!card.classList.contains('flipped')) return;
        
        const point = getPoint(e);
        startX = point.x;
        startY = point.y;
        isDragging = true;
        card.classList.add('dragging');
        
        // ブラウザのデフォルト動作を防ぐ
        e.preventDefault();
        
        // 既存のアニメーションフレームをキャンセル
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // トランジションを無効化して即座に反応させる
        card.style.transition = 'none';
    };

    const updateCardPosition = (dx, dy, isMistakeMode) => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            // 横スワイプ
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 3) {
            card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
            const opacityDrop = Math.min(Math.abs(dx) / 180, 0.18);
            card.style.opacity = `${1 - opacityDrop}`;
            } else if (isMistakeMode && dy < -3 && Math.abs(dy) > Math.abs(dx)) {
                // 上移動（完璧）- 裏面のみ
            card.style.transform = `translateY(${dy}px) scale(${1 + dy/1000})`;
            const opacityDrop = Math.min(Math.abs(dy) / 180, 0.18);
            card.style.opacity = `${1 - opacityDrop}`;
        }
        });
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        
        // 表面ならスワイプ無効
        if (!card.classList.contains('flipped')) return;
        
        // ブラウザのデフォルト動作を防ぐ
        e.preventDefault();
        
        const point = getPoint(e);
        const dx = point.x - startX;
        const dy = point.y - startY;

        // 間違い復習モードのみ上スワイプ有効
        const isMistakeMode = selectedCategory === '間違い復習';

        updateCardPosition(dx, dy, isMistakeMode);
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        
        // アニメーションフレームをキャンセル
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        isDragging = false;
        card.classList.remove('dragging');

        // 表面なら処理しない
        if (!card.classList.contains('flipped')) {
            card.style.transition = '';
            card.style.transform = '';
            card.style.opacity = '';
            return;
        }

        const point = getPoint(e);
        const dx = point.x - startX;
        const dy = point.y - startY;

        const threshold = 60; // 閾値を下げてより敏感に
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        const isVertical = Math.abs(dy) > Math.abs(dx);
        const isMistakeMode = selectedCategory === '間違い復習';

        // トランジションを有効化
        card.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

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
            card.style.transform = '';
            card.style.opacity = '';
        }
    };

    // pointerイベントでタッチ/マウス両方をサポート
    card.addEventListener('pointerdown', handleStart, { passive: false });
    card.addEventListener('pointermove', handleMove, { passive: false });
    card.addEventListener('pointerup', handleEnd);
    card.addEventListener('pointerleave', handleEnd);
    card.addEventListener('pointercancel', handleEnd);
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
    
    // 入力モードの場合もチェックボタンの状態を更新
    if (isInputModeActive) {
        const inputStarBtn = document.getElementById('inputStarBtn');
        if (inputStarBtn) {
            if (reviewWords.has(word.id)) {
                inputStarBtn.classList.add('active');
            } else {
                inputStarBtn.classList.remove('active');
            }
        }
    }
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
    if (!word) return;

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
    
    // カードモードの場合
    if (elements.englishWord) {
        elements.englishWord.style.backgroundImage = image;
        elements.englishWord.style.backgroundSize = image ? '100% 100%' : '';
        elements.englishWord.style.backgroundRepeat = image ? 'no-repeat' : '';
        elements.englishWord.style.backgroundPosition = image ? '0 0' : '';
    }
    
    // 入力モードの場合
    const inputMeaning = document.getElementById('inputMeaning');
    if (inputMeaning) {
        inputMeaning.style.backgroundImage = image;
        inputMeaning.style.backgroundSize = image ? '100% 100%' : '';
        inputMeaning.style.backgroundRepeat = image ? 'no-repeat' : '';
        inputMeaning.style.backgroundPosition = image ? '0 0' : '';
    }
}

// 品詞を一文字に変換する関数
function getPartOfSpeechShort(pos) {
    if (!pos) return '';
    
    const posMap = {
        '動詞': '動',
        '名詞': '名',
        '形容詞': '形',
        '副詞': '副',
        '前置詞': '前',
        '接続詞': '接',
        '冠詞': '冠',
        '代名詞': '代',
        '助動詞': '助',
        '間投詞': '間',
        '形容詞・副詞': '形',
        '動詞・名詞': '動',
        '名詞・動詞': '名',
        '形容詞・名詞': '形',
        '副詞・形容詞': '副'
    };
    
    // 複数の品詞が「・」で区切られている場合は最初のものを使用
    const firstPos = pos.split('・')[0].trim();
    
    // マッピングに存在する場合は変換、存在しない場合は最初の文字を取得
    if (posMap[firstPos]) {
        return posMap[firstPos];
    }
    
    // マッピングにない場合は、品詞名に含まれる文字から推測
    if (firstPos.includes('動')) return '動';
    if (firstPos.includes('名')) return '名';
    if (firstPos.includes('形')) return '形';
    if (firstPos.includes('副')) return '副';
    if (firstPos.includes('前')) return '前';
    if (firstPos.includes('接')) return '接';
    if (firstPos.includes('冠')) return '冠';
    if (firstPos.includes('代')) return '代';
    if (firstPos.includes('助')) return '助';
    
    // それでも見つからない場合は最初の文字を返す
    return firstPos.charAt(0);
}

// 品詞のクラスを取得する関数
function getPartOfSpeechClass(pos) {
    if (!pos) return 'other';
    
    const firstPos = pos.split('・')[0].trim();
    
    if (firstPos.includes('動詞') || firstPos.includes('動')) return 'verb';
    if (firstPos.includes('名詞') || firstPos.includes('名')) return 'noun';
    if (firstPos.includes('形容詞') || firstPos.includes('形')) return 'adjective';
    if (firstPos.includes('副詞') || firstPos.includes('副')) return 'adverb';
    return 'other';
}

// 現在の単語を表示
function displayCurrentWord() {
    if (currentIndex >= currentRangeEnd) {
        // 学習完了時は完了画面を表示
        showCompletion();
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
    
    // 品詞を一文字に変換
    const posShort = getPartOfSpeechShort(word.partOfSpeech || '');
    const posClass = getPartOfSpeechClass(word.partOfSpeech || '');
    
    // 英単語と品詞を一緒に表示（品詞を左横に）
    const englishWordWrapper = elements.englishWord.parentElement;
    let posElementFront = document.getElementById('posInlineFront');
    if (posShort) {
        if (!posElementFront) {
            posElementFront = document.createElement('span');
            posElementFront.id = 'posInlineFront';
            posElementFront.className = `pos-inline part-of-speech ${posClass}`;
            englishWordWrapper.insertBefore(posElementFront, elements.englishWord);
        }
        posElementFront.textContent = posShort;
        posElementFront.className = `pos-inline part-of-speech ${posClass}`;
        posElementFront.style.display = '';
    } else {
        if (posElementFront) {
            posElementFront.style.display = 'none';
        }
    }
    
    elements.englishWord.textContent = word.word;
    applyMarkers(word);
    
    // 裏面の意味と品詞を一緒に表示（品詞を左横に）
    const meaningWrapper = elements.meaning.parentElement;
    let posElementBack = document.getElementById('posInlineBack');
    
    if (posShort) {
        if (!posElementBack) {
            posElementBack = document.createElement('span');
            posElementBack.id = 'posInlineBack';
            posElementBack.className = `pos-inline part-of-speech ${posClass}`;
            meaningWrapper.insertBefore(posElementBack, elements.meaning);
        }
        posElementBack.textContent = posShort;
        posElementBack.className = `pos-inline part-of-speech ${posClass}`;
        posElementBack.style.display = '';
    } else {
        if (posElementBack) {
            posElementBack.style.display = 'none';
        }
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
    if (currentIndex >= currentRangeEnd) return;

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
        // 最後の単語の場合は完了画面を表示
        if (currentIndex >= currentRangeEnd) {
            showCompletion();
        } else {
        displayCurrentWord();
        }
    }, 180);
}

// スワイプまたはボタンで正解/不正解をマーク
function markAnswer(isCorrect) {
    if (currentIndex >= currentRangeEnd) return;

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

    // 入力モードの場合はカードアニメーションをスキップ
    if (isInputModeActive) {
        // 入力モードでは自動で進まない（ユーザーが次へボタンを押すまで待つ）
        return;
    }

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
        // 最後の単語の場合は完了画面を表示
        if (currentIndex >= currentRangeEnd) {
            showCompletion();
        } else {
        displayCurrentWord();
        }
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
            
            // カテゴリーごとの進捗も削除
            const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'Group1 超頻出600', 'Group2 頻出200', 'Group3 ハイレベル100', '基本語彙500'];
            categories.forEach(category => {
                localStorage.removeItem(`correctWords-${category}`);
                localStorage.removeItem(`wrongWords-${category}`);
            });
            
            // すべてのlocalStorageキーを確認して、カテゴリー関連のものを削除
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('correctWords-') || key.startsWith('wrongWords-'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
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

// ホーム画面追加オーバレイを表示（インストールされていない場合のみ毎回表示）
function checkAndShowInstallPrompt() {
    // PWAとして既にインストールされているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return; // インストール済みの場合は表示しない
    }
    
    // 少し遅延して表示（ページ読み込み後）
    setTimeout(() => {
        showInstallOverlay();
    }, 1000);
}

function showInstallOverlay() {
    const overlay = document.getElementById('installOverlay');
    const message = document.getElementById('installMessage');
    const instructions = document.getElementById('installInstructions');
    const closeBtn = document.getElementById('installCloseBtn');
    
    if (!overlay || !message || !instructions || !closeBtn) return;
    
    // iOSかAndroidかを判定
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS用の説明
        message.textContent = 'このアプリをホーム画面に追加すると、より快適に学習できます。';
        const shareImgPath = new URL('share.png', window.location.href).href;
        instructions.innerHTML = `
            <ol>
                <li>画面下部の共有ボタン <img src="${shareImgPath}" alt="共有" style="width: 20px; height: 20px; vertical-align: middle; display: inline-block; margin: 0 4px;"> をタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップ</li>
            </ol>
        `;
    } else if (isAndroid) {
        // Android用の説明
        message.textContent = 'このアプリをホーム画面に追加すると、より快適に学習できます。';
        instructions.innerHTML = `
            <ol>
                <li>ブラウザのメニュー <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle;"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> を開く</li>
                <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
                <li>確認画面で「追加」をタップ</li>
            </ol>
        `;
    } else {
        // その他のデバイス
        message.textContent = 'このアプリをホーム画面に追加すると、より快適に学習できます。';
        instructions.innerHTML = `
            <ol>
                <li>ブラウザのメニューから「ホーム画面に追加」を選択</li>
                <li>確認画面で「追加」をクリック</li>
            </ol>
        `;
    }
    
    // 閉じるボタンのイベント
    closeBtn.onclick = () => {
        closeInstallOverlay();
    };
    
    // オーバレイの背景クリックで閉じる
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeInstallOverlay();
        }
    };
    
    // 表示
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function closeInstallOverlay() {
    const overlay = document.getElementById('installOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

// アプリケーションの起動
init();
