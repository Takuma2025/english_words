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

// localStorageから復習チェック、間違い、進捗を読み込む
function loadData() {
    const savedReviewWords = localStorage.getItem('reviewWords');
    if (savedReviewWords) {
        const parsed = JSON.parse(savedReviewWords);
        reviewWords = new Set(parsed.map(id => typeof id === 'string' ? parseInt(id, 10) : id));
    }
    
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
    const categories = ['超よく出る600', 'よく出る300', '差がつく200'];
    
    categories.forEach(category => {
        const element = document.getElementById(`stars-${category}`);
        if (!element) return;
        
        const categoryWords = wordData.filter(word => word.category === category);
        const savedIndex = loadProgress(category);
        
        if (categoryWords.length === 0) {
            element.textContent = '☆☆☆☆☆';
            return;
        }
        
        // 進捗率を計算（正解数、間違い数）
        let correctCountInCategory = 0;
        let wrongCountInCategory = 0;
        
        categoryWords.forEach(word => {
            const isCorrect = correctWords.has(word.id);
            const isWrong = wrongWords.has(word.id);
            
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
        
        // デバッグ用（後で削除）
        if (category === '超よく出る600') {
            console.log(`Category: ${category}`);
            console.log(`Correct: ${correctCountInCategory}, Wrong: ${wrongCountInCategory}, Total: ${total}`);
            console.log(`CorrectPercent: ${correctPercent}%, WrongPercent: ${wrongPercent}%`);
            console.log(`CorrectWords Set:`, Array.from(correctWords).slice(0, 10));
            console.log(`WrongWords Set:`, Array.from(wrongWords).slice(0, 10));
        }
        
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
            { text: 'キャンセル', type: 'cancel', onClick: () => resolve(false) },
            { text: 'OK', type: 'confirm', onClick: () => resolve(true) }
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
    selectedCategory = null;
    updateNavState('home');
    elements.headerSubtitle.textContent = '大阪府公立高校対応';
    
    // カテゴリー選択画面ではホームボタンを非表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.add('hidden');
    }
    
    document.body.classList.remove('learning-mode');
    
    // 最新のデータを読み込んでから進捗を更新
    loadData();
    updateCategoryStars(); // 星の表示を更新
}

// カテゴリーを選択して学習開始
function startCategory(category) {
    selectedCategory = category;
    const categoryWords = wordData.filter(word => word.category === category);

    if (categoryWords.length === 0) {
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    // カテゴリーに属する間違い単語を抽出
    const wrongWordsInCategory = categoryWords.filter(word => wrongWords.has(word.id));
    const savedIndex = loadProgress(category);
    const hasProgress = savedIndex > 0 && savedIndex < categoryWords.length;

    const actions = [];

    // はじめから（常に表示）
    actions.push({
        text: 'はじめから',
        type: 'confirm',
        onClick: () => initLearning(category, categoryWords, 0, categoryWords.length, 0)
    });

    // 続きから（保存済みインデックスがある場合のみ）
    if (hasProgress) {
        actions.push({
            text: `つづきから (No.${savedIndex + 1})`,
            type: 'confirm',
            onClick: () => initLearning(category, categoryWords, savedIndex, categoryWords.length, savedIndex)
        });
    }

    // 間違い復習オプション
    if (wrongWordsInCategory.length > 0) {
        actions.push({
            text: `間違えた問題のみ (${wrongWordsInCategory.length}問)`,
            type: 'cancel',
            onClick: () => initLearning('間違い復習', wrongWordsInCategory, 0, wrongWordsInCategory.length, 0)
        });
    }

    showModal(`${category}`, '学習方法を選んでください', actions);
}

// 学習初期化処理（共通化）
// rangeEnd: 学習範囲の終了index（exclusive）
// rangeStartOverride: 進捗計算に用いる開始index（表示開始位置をずらすため）
function initLearning(category, words, startIndex = 0, rangeEnd = undefined, rangeStartOverride = undefined) {
    selectedCategory = category;
    currentWords = words;
    
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
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
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
        elements.starBtn.querySelector('svg').setAttribute('fill', '#fbbf24');
    } else {
        elements.starBtn.classList.remove('active');
        elements.starBtn.querySelector('svg').setAttribute('fill', 'none');
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

    if (reviewWords.has(word.id)) {
        // 黄は蛍光マーカー風（上段、少し広め・明るめ）
        layers.push(band('rgba(253, 253, 112, 0.55)', 0.34, 0.54));
        // 下段は赤優先、なければ青（黄との間に僅かな空白）
        if (wrongWords.has(word.id)) {
            layers.push(band('rgba(239, 68, 68, 0.28)', 0.60, 0.82));
        } else if (correctWords.has(word.id)) {
            layers.push(band('rgba(59, 130, 246, 0.30)', 0.60, 0.82));
        }
    } else if (wrongWords.has(word.id)) {
        layers.push(band('rgba(239, 68, 68, 0.30)', 0.60, 0.82));
    } else if (correctWords.has(word.id)) {
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
        saveCorrectWords();
        // 正解しても間違いリストからは削除しない（要望により変更）
        // if (wrongWords.has(word.id)) {
        //     wrongWords.delete(word.id);
        //     saveWrongWords();
        // }
    } else {
        wrongCount++;
        // 間違えた場合は間違いリストに追加
        wrongWords.add(word.id);
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
    const answered = Math.min(answeredWords.size, total);
    const progressPercent = total > 0 ? (answered / total) * 100 : 0;
    
    elements.progressText.textContent = `${answered} / ${total}`;
    elements.progressFill.style.width = `${progressPercent}%`;
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
