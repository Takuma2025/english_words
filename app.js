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
let questionStatus = []; // 各問題の回答状況を追跡（'correct', 'wrong', null）
let progressBarStartIndex = 0; // 進捗バーの表示開始インデックス（20問ずつ表示）
const PROGRESS_BAR_DISPLAY_COUNT = 20; // 進捗バーに表示する問題数
let isTimeAttackMode = false; // タイムアタックモードかどうか
let timerInterval = null; // タイマーのインターバル
let totalTimeRemaining = 0; // 残り時間（秒）
let wordStartTime = 0; // 現在の単語の開始時間
let wordTimerInterval = null; // 単語あたりのタイマーのインターバル
const TIME_PER_WORD = 2; // 1単語あたりの時間（秒）
let chartPeriod = 'week'; // グラフの表示期間: 'week', 'month', 'year'
let isSentenceModeActive = false; // 厳選例文暗記モードかどうか
let sentenceData = []; // 例文データ
let currentSentenceIndex = 0; // 現在の例文のインデックス
let sentenceBlanks = []; // 空所のデータ [{index: 0, word: 'longer', userInput: ''}, ...]
let sentenceAnswerSubmitted = false; // 回答が送信済みかどうか
let currentSelectedBlankIndex = -1; // 現在選択中の空所のインデックス
let isReorderModeActive = false; // 整序英作文モードかどうか
let reorderData = []; // 整序英作文データ
let currentReorderIndex = 0;
let selectedLearningMode = 'card'; // 学習モード: 'card' (日本語) または 'input' (日本語→英語) // 現在の整序英作文のインデックス
let reorderAnswerSubmitted = false; // 回答が送信済みかどうか
let reorderSelectedWords = []; // 選択された単語の配列
let reorderTouchData = { // タッチドラッグ用のデータ
    sourceElement: null, // 元の要素
    dragClone: null, // ドラッグ中のクローン要素
    offsetX: 0, // タッチ位置のオフセット（要素内の位置）
    offsetY: 0,
    fromBlankIndex: null,
    word: null,
    isDragging: false,
    cloneWidth: 0, // クローンの幅（パフォーマンス最適化用）
    cloneHeight: 0, // クローンの高さ（パフォーマンス最適化用）
    rafId: null // requestAnimationFrameのID
};

 // 0: 曜日, 1: 月

// 学習日を記録する関数（日付と学習量を記録）
function recordStudyDate() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const savedData = localStorage.getItem('studyDates');
    let studyData = savedData ? JSON.parse(savedData) : {};
    
    // 今日の学習量を1増やす
    if (!studyData[dateStr]) {
        studyData[dateStr] = 0;
    }
    studyData[dateStr]++;
    
    localStorage.setItem('studyDates', JSON.stringify(studyData));
}

// 学習日データを読み込む関数
function loadStudyDates() {
    const savedData = localStorage.getItem('studyDates');
    return savedData ? JSON.parse(savedData) : {};
}

// すべてのカテゴリーの正解単語数を集計する関数
function getAllCorrectWordsCount() {
    const categories = [
        '小学生で習った単語とカテゴリー別に覚える単語',
        'LEVEL1 超よくでる400',
        'LEVEL2 よくでる300',
        'LEVEL3 差がつく200',
        'LEVEL4 ハイレベル200',
        '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
        '大阪C問題対策英単語タイムアタック',
        '大阪C問題対策 英作写経ドリル',
        '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】'
    ];
    
    const allCorrectWords = new Set();
    
    categories.forEach(category => {
        const { correctSet } = loadCategoryWords(category);
        correctSet.forEach(wordId => {
            allCorrectWords.add(wordId);
        });
    });
    
    return allCorrectWords.size;
}

// 指定日の覚えた単語数を取得する関数
function getCorrectWordsCountForDate(targetDate) {
    // 日付ごとの覚えた単語数を記録するキー
    const dateKey = `correctWordsCount-${targetDate}`;
    const savedCount = localStorage.getItem(dateKey);
    
    if (savedCount !== null) {
        return parseInt(savedCount, 10);
    }
    
    // 保存されていない場合は0を返す（その日は学習していない）
    return 0;
}

// 日付ごとの覚えた単語数を保存する関数
function saveCorrectWordsCountForDate(dateStr, count) {
    const dateKey = `correctWordsCount-${dateStr}`;
    localStorage.setItem(dateKey, count.toString());
}

// 指定期間のデータを取得する関数
function getChartData(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const data = [];
    
    if (period === 'week') {
        // 直近1週間（7日間）のデータを取得
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = getCorrectWordsCountForDate(dateStr);
            data.push({ date, dateStr, count, label: '', dateLabel: '' });
        }
    } else if (period === 'month') {
        // 直近1か月（31日間）のデータを取得
        for (let i = 30; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = getCorrectWordsCountForDate(dateStr);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            data.push({ 
                date, 
                dateStr, 
                count, 
                label: weekday, 
                dateLabel: `${month}/${day}` 
            });
        }
    } else if (period === 'year') {
        // 直近1年（12か月）のデータを取得（月ごとに集計）
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            date.setDate(1); // 月初めに設定
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            // その月の全データを集計
            let monthCount = 0;
            const lastDay = new Date(year, month, 0).getDate();
            for (let day = 1; day <= lastDay; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                monthCount += getCorrectWordsCountForDate(dateStr);
            }
            
            data.push({ 
                date, 
                dateStr: `${year}-${String(month).padStart(2, '0')}`, 
                count: monthCount, 
                label: `${month}月`, 
                dateLabel: `${month}`,
                year: year
            });
        }
    }
    
    return { data, todayStr };
}

// 縦棒グラフを更新する関数
function updateBarChart() {
    const barChart = document.getElementById('barChart');
    const chartTitle = document.getElementById('chartTitle');
    if (!barChart) {
        console.warn('barChart element not found');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // タイトルを更新
    const periodLabels = {
        'week': '学習記録（直近1週間）',
        'month': '学習記録（直近1か月）',
        'year': '学習記録（直近1年）'
    };
    if (chartTitle) {
        chartTitle.textContent = periodLabels[chartPeriod] || periodLabels['week'];
    }
    
    // 期間に応じたデータを取得
    const { data, todayStr } = getChartData(chartPeriod);
    
    // 最大学習量を取得（グラフの高さを決定するため）
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    // グラフをクリア
    barChart.innerHTML = '';
    
    // 期間属性を設定（CSSでスタイルを調整するため）
    barChart.setAttribute('data-period', chartPeriod);
    
    // 各データを表示
    data.forEach(({ date, dateStr, count, label, dateLabel, year }, index) => {
        const isToday = chartPeriod === 'week' && dateStr === todayStr;
        const isCurrentMonth = chartPeriod === 'year' && 
            date.getFullYear() === today.getFullYear() && 
            date.getMonth() === today.getMonth();
        const isCurrentDay = chartPeriod === 'month' && dateStr === todayStr;
        
        // ラベルを決定
        let displayLabel = label;
        let displayDateLabel = dateLabel;
        let displayYear = '';
        
        if (chartPeriod === 'week') {
            const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            displayLabel = weekday;
            displayDateLabel = `${month}/${day}`;
        } else if (chartPeriod === 'month') {
            // 月表示では、すべての日付を表示（曜日も表示）
            const dayOfMonth = date.getDate();
            const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            displayLabel = weekday;
            displayDateLabel = `${dayOfMonth}`;
        } else if (chartPeriod === 'year') {
            // 1年表示では、月を表示
            const month = date.getMonth() + 1;
            displayLabel = '';
            displayDateLabel = `${month}月`;
            // 1月のときだけ年号を表示
            if (month === 1 && year) {
                displayYear = year;
            }
        }
        
        // バーの高さを計算（最大値に対する割合）
        const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        const barItem = document.createElement('div');
        barItem.className = `bar-item${isToday || isCurrentMonth || isCurrentDay ? ' bar-item-today' : ''}`;
        
        barItem.innerHTML = `
            <div class="bar-value" style="${count === 0 ? 'display: none;' : ''}">${count}</div>
            <div class="bar-wrapper">
                <div class="bar" style="height: ${heightPercent}%; ${count === 0 ? 'display: none;' : ''}"></div>
            </div>
            ${displayLabel ? `<div class="bar-label">${displayLabel}</div>` : ''}
            ${displayDateLabel ? `<div class="bar-date">${displayDateLabel}</div>` : ''}
            <div class="bar-year">${displayYear || ''}</div>
        `;
        
        barChart.appendChild(barItem);
    });
    
    console.log(`Bar chart updated: ${data.length} items displayed for period: ${chartPeriod}`);
}

// カテゴリごとの正解・間違い単語を読み込む（現在のモードのみ）
function loadCategoryWords(category) {
    const mode = selectedLearningMode || 'card';
    const savedCorrectWords = localStorage.getItem(`correctWords-${category}_${mode}`);
    const savedWrongWords = localStorage.getItem(`wrongWords-${category}_${mode}`);
    
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

// ホーム画面の進捗バー用：カード/入力など全モードの結果を合算して読み込む
function loadCategoryWordsForProgress(category) {
    const modes = ['card', 'input'];
    const correctSet = new Set();
    const wrongSet = new Set();
    
    modes.forEach(mode => {
        const savedCorrectWords = localStorage.getItem(`correctWords-${category}_${mode}`);
        const savedWrongWords = localStorage.getItem(`wrongWords-${category}_${mode}`);
        
        if (savedCorrectWords) {
            const parsed = JSON.parse(savedCorrectWords);
            parsed.forEach(id => {
                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                if (!wrongSet.has(numId)) {
                    correctSet.add(numId);
                }
            });
        }
        
        if (savedWrongWords) {
            const parsed = JSON.parse(savedWrongWords);
            parsed.forEach(id => {
                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                wrongSet.add(numId);
                // 間違いを優先するため、正解セットからは削除
                if (correctSet.has(numId)) {
                    correctSet.delete(numId);
                }
            });
        }
    });
    
    return { correctSet, wrongSet };
}

// カテゴリごとの正解・間違い単語を保存（モードごとに分ける）
function saveCategoryWords(category, correctSet, wrongSet) {
    const mode = selectedLearningMode || 'card';
    localStorage.setItem(`correctWords-${category}_${mode}`, JSON.stringify([...correctSet]));
    localStorage.setItem(`wrongWords-${category}_${mode}`, JSON.stringify([...wrongSet]));
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

// 進捗を読み込む（モードごとに分ける）
function loadProgress(category) {
    const mode = selectedLearningMode || 'card';
    const key = `${category}_${mode}`;
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        return progress[key] || 0;
    }
    return 0;
}

// 進捗を保存（モードごとに分ける）
function saveProgress(category, index) {
    const mode = selectedLearningMode || 'card';
    const key = `${category}_${mode}`;
    const savedProgress = localStorage.getItem('learningProgress');
    let progress = savedProgress ? JSON.parse(savedProgress) : {};
    progress[key] = index;
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

// カテゴリーの進捗表示を更新
function updateCategoryStars() {
    // コース名からデータカテゴリー名へのマッピング
    const categoryMapping = {
        'LEVEL1 超よくでる400': 'Group1 超頻出600',
        'LEVEL2 よくでる300': 'Group2 頻出200',
        'LEVEL3 差がつく200': 'Group3 ハイレベル100',
        'LEVEL4 ハイレベル200': 'Group3 ハイレベル100'
    };
    
    const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'LEVEL1 超よくでる400', 'LEVEL2 よくでる300', 'LEVEL3 差がつく200', 'LEVEL4 ハイレベル200', '大阪B問題対策 厳選例文暗記60【和文英訳対策】', '条件英作文特訓コース', '大阪C問題対策英単語タイムアタック', 'PartCディクテーション'];
    
    categories.forEach(category => {
        let categoryWords;
        if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
            // elementaryWordDataが定義されているか確認
            if (typeof elementaryWordData !== 'undefined') {
                categoryWords = elementaryWordData;
            } else {
                categoryWords = [];
            }
        } else if (category === '大阪C問題対策英単語タイムアタック') {
            // タイムアタックモード：Group1 超頻出600の単語を使用
            categoryWords = wordData.filter(word => word.category === 'Group1 超頻出600');
        } else if (category === '大阪B問題対策 厳選例文暗記60【和文英訳対策】') {
            // 大阪B問題対策：例文データを使用（単語データとは別管理）
            // 例文データはsentenceMemorizationDataとして定義されている
            // 進捗計算は例文データで行う
            if (typeof sentenceMemorizationData !== 'undefined') {
                // 例文データの進捗を計算
                const { correctSet, wrongSet } = loadCategoryWords(category);
                let correctCountInCategory = 0;
                let wrongCountInCategory = 0;
                
                sentenceMemorizationData.forEach(sentence => {
                    if (wrongSet.has(sentence.id)) {
                        wrongCountInCategory++;
                    } else if (correctSet.has(sentence.id)) {
                        correctCountInCategory++;
                    }
                });
                
                const total = sentenceMemorizationData.length;
                const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
                const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
                const completedCount = correctCountInCategory + wrongCountInCategory;
                
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
                    text.textContent = `${completedCount}/${total}語`;
                }
            } else {
                // データが未定義の場合は0に設定
                const correctBar = document.getElementById(`progress-correct-${category}`);
                const wrongBar = document.getElementById(`progress-wrong-${category}`);
                const text = document.getElementById(`progress-text-${category}`);
                
                if (correctBar) {
                    correctBar.style.width = '0%';
                }
                if (wrongBar) {
                    wrongBar.style.width = '0%';
                }
                if (text) {
                    text.textContent = '0/0語';
                }
            }
            return; // 例文データの処理が完了したので、以降の単語データ処理をスキップ
        } else {
            // マッピングがある場合はそれを使用、なければそのまま使用
            const dataCategory = categoryMapping[category] || category;
            categoryWords = wordData.filter(word => word.category === dataCategory);
        }
        
        if (categoryWords.length === 0) {
            // 進捗バーとテキストを0に設定
            const correctBar = document.getElementById(`progress-correct-${category}`);
            const wrongBar = document.getElementById(`progress-wrong-${category}`);
            const text = document.getElementById(`progress-text-${category}`);
            
            if (correctBar) {
                correctBar.style.width = '0%';
            }
            if (wrongBar) {
                wrongBar.style.width = '0%';
            }
            if (text) {
                text.textContent = '0/0語';
            }
            return;
        }
        
        // 進捗率を計算（正解数、間違い数）
        let correctCountInCategory = 0;
        let wrongCountInCategory = 0;
        
        // カテゴリごとの進捗を取得（全モード合算）
        const { correctSet, wrongSet } = loadCategoryWordsForProgress(category);
        
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
        const completedCount = correctCountInCategory + wrongCountInCategory;

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
            // 学習済み数（正解+間違い）/ 総数を表示
            text.textContent = `${completedCount}/${total}語`;
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
    // mainContent が hidden = ホーム画面
    if (elements.mainContent && elements.mainContent.classList.contains('hidden')) {
        updateCategoryStars();
    }
}

// 間違えた単語を保存
function saveWrongWords() {
    localStorage.setItem('wrongWords', JSON.stringify([...wrongWords]));
    // ホーム画面にいる場合は進捗を更新
    if (elements.mainContent && elements.mainContent.classList.contains('hidden')) {
        updateCategoryStars();
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
    audioBtn: document.getElementById('audioBtn'),
    inputAudioBtn: document.getElementById('inputAudioBtn'),
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

// TTS機能：英単語を読み上げる
let currentSpeech = null;
let voicesLoaded = false;

// 利用可能な音声を取得（女性のUS音声を優先）
function getNativeVoice() {
    const voices = window.speechSynthesis.getVoices();
    
    // 女性のUS音声を優先的に検索
    const femaleUSVoices = [
        // Google音声（Chrome/Edge）- 女性音声
        'Google US English Female',
        'Google US English',
        // Microsoft音声（Windows）- 女性音声
        'Microsoft Zira - English (United States)',
        'Microsoft Zira',
        // macOS音声（Safari）- 女性音声
        'Samantha',
        'Victoria',
        'Karen',
        'Moira',
        // その他の女性US音声
        'en-US-Female',
        'en-US-Wavenet-F',
        'en-US-Neural2-F'
    ];
    
    // 女性のUS音声を優先的に検索
    for (const preferred of femaleUSVoices) {
        const voice = voices.find(v => 
            (v.name.includes(preferred) || v.name.toLowerCase().includes(preferred.toLowerCase())) &&
            v.lang.startsWith('en-US')
        );
        if (voice) {
            return voice;
        }
    }
    
    // 女性のUS音声を検索（名前指定なし、性別で判定）
    const femaleVoice = voices.find(v => 
        v.lang.startsWith('en-US') &&
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') ||
         v.name.toLowerCase().includes('samantha') ||
         v.name.toLowerCase().includes('victoria') ||
         v.name.toLowerCase().includes('karen') ||
         v.name.toLowerCase().includes('moira') ||
         v.name.toLowerCase().includes('google') ||
         (v.gender && v.gender.toLowerCase() === 'female'))
    );
    
    if (femaleVoice) {
        return femaleVoice;
    }
    
    // 女性音声が見つからない場合、US音声を探す
    const usVoice = voices.find(v => 
        v.lang.startsWith('en-US') &&
        (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Zira'))
    );
    
    if (usVoice) {
        return usVoice;
    }
    
    // デフォルトのUS音声
    return voices.find(v => v.lang.startsWith('en-US')) || null;
}

// 音声リストの読み込みを待つ
function ensureVoicesLoaded(callback) {
    if (voicesLoaded) {
        callback();
        return;
    }
    
    // 音声リストが既に読み込まれている場合
    if (window.speechSynthesis.getVoices().length > 0) {
        voicesLoaded = true;
        callback();
        return;
    }
    
    // 音声リストの読み込みを待つ
    window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = true;
        callback();
    };
    
    // タイムアウト（500ms待っても読み込まれない場合はデフォルトで続行）
    setTimeout(() => {
        if (!voicesLoaded) {
            voicesLoaded = true;
            callback();
        }
    }, 500);
}

function speakWord(word, buttonElement) {
    // 既存の音声を停止
    if (currentSpeech) {
        window.speechSynthesis.cancel();
        currentSpeech = null;
    }

    // Web Speech APIが利用可能か確認
    if (!('speechSynthesis' in window)) {
        showAlert('エラー', 'お使いのブラウザでは音声機能が利用できません。');
        return;
    }

    // 音声リストの読み込みを待つ
    ensureVoicesLoaded(() => {
        // ネイティブ音声を取得
        const voice = getNativeVoice();
        
        // 音声合成の設定
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = voice ? voice.lang : 'en-US';
        
        // より自然な発音のためのパラメータ調整
        utterance.rate = 0.95; // 少しゆっくりめ（自然な速度）
        utterance.pitch = 1.0; // 標準ピッチ
        utterance.volume = 1.0; // 最大音量
        
        // ネイティブ音声を設定
        if (voice) {
            utterance.voice = voice;
        }

        // ボタンに再生中のスタイルを追加
        if (buttonElement) {
            buttonElement.classList.add('playing');
        }

        // 音声再生開始
        utterance.onstart = () => {
            currentSpeech = utterance;
        };

        // 音声再生終了
        utterance.onend = () => {
            currentSpeech = null;
            if (buttonElement) {
                buttonElement.classList.remove('playing');
            }
        };

        // エラー処理
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            currentSpeech = null;
            if (buttonElement) {
                buttonElement.classList.remove('playing');
            }
            // エラー時はアラートを表示しない（ユーザー体験を損なわないため）
        };

        // 音声を再生
        window.speechSynthesis.speak(utterance);
    });
}

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
    try {
        preventZoom();
        assignCategories();
        loadData();
        setupEventListeners();
        
        // スプラッシュ画面を表示
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            // スプラッシュ画面を1.5秒表示してから非表示にする
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    showCategorySelection();
                }, 500);
            }, 1500);
        } else {
            // スプラッシュ画面が見つからない場合は即座にカテゴリー選択画面を表示
            showCategorySelection();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        // エラーが発生した場合でもスプラッシュ画面を非表示にしてカテゴリー選択画面を表示
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.style.display = 'none';
        }
        showCategorySelection();
    }
    
    // 縦棒グラフを初期表示
    setTimeout(() => {
        updateBarChart();
    }, 100);
    
    // ホーム画面に追加されていない場合のみオーバレイを表示
    checkAndShowInstallPrompt();
}

// カテゴリー選択画面を表示
function showCategorySelection() {
    // タイマーを停止
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    stopWordTimer();
    isTimeAttackMode = false;
    document.body.classList.remove('time-attack-mode');
    
    if (!elements.categorySelection) {
        console.error('categorySelection element not found');
        return;
    }
    
    elements.categorySelection.classList.remove('hidden');
    if (elements.mainContent) {
        elements.mainContent.classList.add('hidden');
    }
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    const examInfoView = document.getElementById('examInfoView');
    if (examInfoView) {
        examInfoView.classList.add('hidden');
    }
    selectedCategory = null;
    updateNavState('home');
    elements.headerSubtitle.textContent = '大阪府公立高校入試特化英単語';
    
    // カテゴリー選択画面ではホームボタンを非表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.add('hidden');
    }
    
    // ハンバーガーメニューボタンは常に表示（変更不要）
    
    document.body.classList.remove('learning-mode');
    
    // すべての学習モードを非表示にする
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    
    // モードフラグをリセット
    isInputModeActive = false;
    isSentenceModeActive = false;
    isReorderModeActive = false;
    
    // 進捗ステップボタンを表示
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (progressStepButtons) {
        progressStepButtons.classList.remove('hidden');
    }
    
    // 最新のデータを読み込んでから進捗を更新
    loadData();
    
    // モードトグルボタンの初期状態を設定
    const modeToggleContainer = document.getElementById('masterCourseModeToggle');
    const cardModeToggle = document.getElementById('cardModeToggle');
    const inputModeToggle = document.getElementById('inputModeToggle');
    if (modeToggleContainer && cardModeToggle && inputModeToggle) {
        // 英単語マスターコースのタブがアクティブな場合のみ表示
        const courseMasterSection = document.getElementById('courseMasterSection');
        if (courseMasterSection && !courseMasterSection.classList.contains('hidden')) {
            modeToggleContainer.classList.remove('hidden');
        } else {
            modeToggleContainer.classList.add('hidden');
        }
        // トグルボタンの状態を更新
        if (selectedLearningMode === 'input') {
            inputModeToggle.classList.add('active');
            cardModeToggle.classList.remove('active');
        } else {
            cardModeToggle.classList.add('active');
            inputModeToggle.classList.remove('active');
        }
    }
    
    updateCategoryStars(); // 星の表示を更新
    
    // 今日の覚えた単語数を記録（ホームに戻る時）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const currentCount = getAllCorrectWordsCount();
    saveCorrectWordsCountForDate(todayStr, currentCount);
    
    // 縦棒グラフを更新（少し遅延させてDOMが確実に読み込まれた後に実行）
    setTimeout(() => {
        updateBarChart();
    }, 50);
}

// カテゴリーを選択してコース選択画面を表示
function startCategory(category) {
    // デバッグ用ログ
    console.log('startCategory called with category:', category);
    selectedCategory = category;
    
    // コース名からデータカテゴリー名へのマッピング
    const categoryMapping = {
        'LEVEL1 超よくでる400': 'Group1 超頻出600',
        'LEVEL2 よくでる300': 'Group2 頻出200',
        'LEVEL3 差がつく200': 'Group3 ハイレベル100',
        'LEVEL4 ハイレベル200': 'Group3 ハイレベル100' // LEVEL4もGroup3のデータを使用（要確認）
    };
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、elementaryWordDataを使用
    let categoryWords;
    if (category === '基本語彙500') {
        // 基本語彙500コースは削除されました
        showAlert('エラー', 'このコースは利用できません。');
        return;
    } else if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        // elementaryWordDataが定義されているか確認
        if (typeof elementaryWordData !== 'undefined') {
            categoryWords = elementaryWordData;
        } else {
            showAlert('エラー', '小学生で習った単語データが見つかりません。');
            return;
        }
    } else if (category === '大阪B問題対策 厳選例文暗記60【和文英訳対策】') {
        // 大阪B問題対策：厳選例文暗記モードで開始
        initSentenceModeLearning(category);
        return;
    } else if (category === '条件英作文特訓コース') {
        // 条件英作文特訓コース：整序英作文モードで開始
        initReorderModeLearning(category);
        return;
    } else if (category === '大阪C問題対策英単語タイムアタック') {
        // タイムアタックモード：Group1 超頻出600の単語を使用
        categoryWords = wordData.filter(word => word.category === 'Group1 超頻出600');
        if (categoryWords.length === 0) {
            showAlert('エラー', 'タイムアタック用の単語データが見つかりません。');
            return;
        }
        // タイムアタックモードで直接開始
        initTimeAttackLearning(category, categoryWords);
        return;
    } else if (category === '大阪C問題対策 英作写経ドリル') {
        // 大阪C問題対策 英作写経ドリル：専用データが必要（現在は空）
        showAlert('準備中', '大阪C問題対策 英作写経ドリルのデータを準備中です。');
        return;
    } else if (category === '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】' || 
               (category && category.includes('整序英作文100本ノック'))) {
        // 大阪C問題対策 英文法100本ノック：整序英作文モードで開始
        console.log('整序英作文モードを開始します。カテゴリー:', category);
        console.log('reorderQuestions type:', typeof reorderQuestions);
        console.log('reorderQuestions value:', reorderQuestions);
        // reorderQuestionsが読み込まれているか確認
        if (typeof reorderQuestions === 'undefined') {
            showAlert('エラー', '整序英作文の問題データファイルが読み込まれていません。ページを再読み込みしてください。');
            console.error('reorderQuestions is undefined');
            return;
        }
        if (!reorderQuestions || reorderQuestions.length === 0) {
            showAlert('エラー', '整序英作文の問題データが空です。');
            console.error('reorderQuestions is empty');
            return;
        }
        console.log('initReorderModeLearningを呼び出します');
        initReorderModeLearning(category);
        return;
    } else if (category === 'PartCディクテーション') {
        // PartCディクテーション：専用データが必要（現在は空）
        showAlert('準備中', 'PartCディクテーションのデータを準備中です。');
        return;
    } else {
        // マッピングがある場合はそれを使用、なければそのまま使用
        const dataCategory = categoryMapping[category] || category;
        categoryWords = wordData.filter(word => word.category === dataCategory);
    }

    if (categoryWords.length === 0) {
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    // カテゴリー選択画面を非表示
    elements.categorySelection.classList.add('hidden');
    
    // コース選択画面を表示
    showCourseSelection(category, categoryWords);
}

// 日本語→英語モードで学習を初期化
function initInputModeLearning(category, words, startIndex = 0) {
    selectedCategory = category;
    currentWords = words;
    isInputModeActive = true;
    isSentenceModeActive = false; // 例文モードを無効化
    
    // 全体の範囲を表示できるように、currentRangeStartは常に0
    currentRangeStart = 0;
    currentRangeEnd = words.length;
    // currentIndexだけを続きの位置に設定（前の単語に戻れるように）
    currentIndex = Math.min(startIndex, words.length - 1);
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    const total = words.length;
    questionStatus = new Array(total).fill(null); // 各問題の回答状況を初期化
    
    // 進捗バーの表示開始位置を現在のインデックスが表示される範囲に設定
    const relativeIndex = currentIndex - currentRangeStart;
    // 現在のインデックスが表示される範囲の開始位置を計算（0から始まる相対位置）
    progressBarStartIndex = Math.max(0, Math.floor(relativeIndex / PROGRESS_BAR_DISPLAY_COUNT) * PROGRESS_BAR_DISPLAY_COUNT);
    // ただし、totalを超えないようにする
    progressBarStartIndex = Math.min(progressBarStartIndex, Math.max(0, total - PROGRESS_BAR_DISPLAY_COUNT));
    
    // 前回の回答状況を読み込んで進捗バーに反映
    if (category && category !== '間違い復習' && category !== '復習チェック' && category !== 'チェックした問題') {
        const { correctSet, wrongSet } = loadCategoryWords(category);
        words.forEach((word, index) => {
            // 全体のインデックスで正解・不正解を確認
            if (wrongSet.has(word.id)) {
                questionStatus[index] = 'wrong';
            } else if (correctSet.has(word.id)) {
                questionStatus[index] = 'correct';
            }
        });
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    document.body.classList.add('learning-mode');

    // 学習画面ではホームボタンを表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }

    // カードモード、例文モード、整序英作文モードを非表示、入力モードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.remove('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    // モードフラグをリセット
    isSentenceModeActive = false;
    isReorderModeActive = false;
    if (cardHint) cardHint.classList.add('hidden');
    // 入力モードのときは進捗バーの「前の単語へ・次の単語へ」ボタンを表示
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    updateNavButtons(); // ボタンのテキストと状態を更新
    
    displayInputMode();
    // 進捗バーのセグメントを強制的に生成
    if (total > 0) {
        createProgressSegments(total);
        updateProgressSegments(); // セグメントの色を更新
    }
    updateStats();
    updateNavState('learning');
}

// コース選択画面を表示（100刻み）
function showCourseSelection(category, categoryWords) {
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    
    // カテゴリー名を表示用に調整
    let displayCategory = category;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        displayCategory = 'カテゴリー別に覚える単語';
    }
    courseTitle.textContent = `${displayCategory} - コースを選んでください`;
    courseList.innerHTML = '';
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、固定のサブコースを表示
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 小学生で習った単語グループ
        const elementaryCourses = [
            '身の回りのものに関する単語',
            '家族・家に関する単語',
            '数字に関する単語',
            '暦・曜日・季節・時間に関する単語',
            '乗り物・スポーツに関する単語',
            '食べ物に関する単語',
            '動物に関する単語'
        ];

        // 機能語グループ
        const functionWordCourses = [
            '冠詞',
            '代名詞',
            '前置詞',
            '助動詞',
            '接続詞',
            '関係代名詞',
            '機能型副詞'
        ];

        const { correctSet, wrongSet } = loadCategoryWords(category);

        // 共通でコースカードを追加するヘルパー
        function addCourseGroup(groupTitle, courses) {
            const section = document.createElement('div');
            section.className = 'course-subsection';

            // グループ別にクラスを付与（スタイル用）
            if (groupTitle === '小学生で習った単語') {
                section.classList.add('course-subsection-elementary');
            } else if (groupTitle === '機能語') {
                section.classList.add('course-subsection-function');
            }

            const headerBtn = document.createElement('button');
            headerBtn.type = 'button';
            headerBtn.className = 'course-subsection-header';
            headerBtn.setAttribute('aria-expanded', 'false');
            headerBtn.textContent = groupTitle;

            const arrow = document.createElement('span');
            arrow.className = 'course-subsection-arrow';
            arrow.textContent = '▶';
            headerBtn.appendChild(arrow);

            const body = document.createElement('div');
            body.className = 'course-subsection-body hidden';

            // 「機能語」の場合のみ、説明テキスト（注釈）を先頭に表示
            if (groupTitle === '機能語') {
                const note = document.createElement('p');
                note.className = 'course-group-note';
                note.textContent = '機能語とは、具体的な意味や内容を表す単語ではないが、文の中の単語同士の関係性を示し、文法構造を支えるために、文章の中に何度も登場する重要な単語のことです。';
                body.appendChild(note);
            }

            headerBtn.addEventListener('click', () => {
                const isOpen = body.classList.toggle('hidden') === false;
                section.classList.toggle('open', isOpen);
                headerBtn.setAttribute('aria-expanded', String(isOpen));
            });

            section.appendChild(headerBtn);

            // サブコース番号（1〜10）
            const circledNumbers = ['1','2','3','4','5','6','7','8','9','10'];

            courses.forEach((courseName, index) => {
                // 各コースに対応する単語をフィルタリング（elementary_words.js 側で category をコース名に合わせておく）
                const courseWords = categoryWords.filter(word => word.category === courseName);

                // 進捗を計算（サブコースごと）
                let correctCountInCourse = 0;
                let wrongCountInCourse = 0;

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

                const numberMark = circledNumbers[index] || '';
                const badgeLabel =
                    groupTitle === '小学生で習った単語' && numberMark
                        ? '小学生'
                        : groupTitle === '機能語' && numberMark
                            ? '機能語'
                            : '';

                const courseCard = createCourseCard(
                    courseName,
                    '',
                    correctPercent,
                    wrongPercent,
                    completedCount,
                    total,
                    () => {
                        // コースを選択したら、そのコースの単語で学習方法選択モーダルを表示
                        const wrongWordsInCourse = courseWords.filter(word => wrongSet.has(word.id));
                        const savedIndex = loadProgress(category);
                        const hasProgress = savedIndex > 0;

                        showInputModeMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse);
                    },
                    badgeLabel,
                    numberMark
                );
                body.appendChild(courseCard);
            });

            section.appendChild(body);
            courseList.appendChild(section);
        }

        addCourseGroup('小学生で習った単語', elementaryCourses);
        addCourseGroup('機能語', functionWordCourses);
    } else {
        // その他のカテゴリーは100刻みで表示
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
                '',
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
    }
    
    courseSelection.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    // 「超よくでる」の場合のみ画像を表示
    const courseSelectionImage = document.getElementById('courseSelectionImage');
    if (courseSelectionImage) {
        if (category === 'LEVEL1 超よくでる400') {
            courseSelectionImage.style.display = 'block';
        } else {
            courseSelectionImage.style.display = 'none';
        }
    }
    
    // ハンバーガーメニューボタンは常に表示（変更不要）
}

// コースカードを作成
function createCourseCard(title, description, correctPercent, wrongPercent, completedCount, total, onClick, badgeLabel = '', badgeNumber = '') {
    const card = document.createElement('button');
    card.className = 'category-card';
    card.onclick = onClick;
    
    const cardId = `course-${title.replace(/\s+/g, '-')}`;
    
    let badgeHtml = '';
    if (badgeNumber) {
        badgeHtml = `<span class="course-group-badge">${badgeNumber}</span>`;
    }

    card.innerHTML = `
        <div class="category-info">
            <div class="category-header">
                <div class="category-name">${badgeHtml}${title}</div>
            </div>
            <div class="category-meta">${description}</div>
            <div class="category-progress">
                <div class="category-progress-bar">
                    <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                    <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                </div>
                <div class="category-progress-text">${completedCount}/${total}語</div>
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
    
    // 学習するボタンまたは前回の続きから学習するボタン（前回のデータがある場合は前回の続きからのみ表示）
    if (hasProgress && savedIndex > 0 && savedIndex < categoryWords.length) {
        // 前回の続きから学習するボタン
        const continueCard = createMethodCard('前回の続きから', '前回の続きから学習を再開します', () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning(category, categoryWords, savedIndex);
            } else {
                // カードモードで開始
                initLearning(category, categoryWords, savedIndex, categoryWords.length, 0);
            }
        }, 'continue');
        methodList.appendChild(continueCard);
    } else {
        // 学習するボタン
        const startCard = createMethodCard('学習する', '最初から学習を開始します', () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning(category, categoryWords, 0);
            } else {
                // カードモードで開始
                initLearning(category, categoryWords, 0, categoryWords.length, 0);
            }
        }, 'start');
        methodList.appendChild(startCard);
    }

    // まだ覚えていない問題のみ学習するボタン（間違いがある場合のみ）
    if (wrongWordsInCategory.length > 0) {
        const wrongCard = createMethodCard('まだ覚えていない単語のみ', `まだ覚えていない単語${wrongWordsInCategory.length}問だけを復習します`, () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning('間違い復習', wrongWordsInCategory, 0);
            } else {
                // カードモードで開始
                initLearning('間違い復習', wrongWordsInCategory, 0, wrongWordsInCategory.length, 0);
            }
        }, 'wrong');
        methodList.appendChild(wrongCard);
    }

    // シャッフルして学習するボタン（常に表示）
    const shuffleCard = createMethodCard('シャッフル', '単語の順序をランダムにして学習します', () => {
            closeModal();
        const shuffledWords = [...categoryWords].sort(() => Math.random() - 0.5);
        if (selectedLearningMode === 'input') {
            // 入力モードで開始
            initInputModeLearning(category, shuffledWords, 0);
        } else {
            // カードモードで開始
            initLearning(category, shuffledWords, 0, shuffledWords.length, 0);
        }
    }, 'shuffle');
    methodList.appendChild(shuffleCard);
    
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
    
    // 学習するボタンまたは前回の続きから学習するボタン（前回のデータがある場合は前回の続きからのみ表示）
    if (hasProgress && savedIndex >= courseStart && savedIndex < courseEnd) {
        // 前回の続きから学習するボタン
        const relativeIndex = savedIndex - courseStart;
        const continueCard = createMethodCard('前回の続きから', '前回の続きから学習を再開します', () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning(category, courseWords, savedIndex);
            } else {
                // カードモードで開始
                initLearning(category, courseWords, relativeIndex, courseWords.length, courseStart);
            }
        }, 'continue');
        methodList.appendChild(continueCard);
    } else {
        // 学習するボタン
        const startCard = createMethodCard('学習する', '最初から学習を開始します', () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning(category, courseWords, 0);
            } else {
                // カードモードで開始
                initLearning(category, courseWords, 0, courseWords.length, courseStart);
            }
        }, 'start');
        methodList.appendChild(startCard);
    }

    // まだ覚えていない単語のみ学習するボタン（間違いがある場合のみ）
    if (wrongWordsInCourse.length > 0) {
        const wrongCard = createMethodCard('まだ覚えていない単語のみ', `まだ覚えていない単語${wrongWordsInCourse.length}問だけを復習します`, () => {
            closeModal();
            if (selectedLearningMode === 'input') {
                // 入力モードで開始
                initInputModeLearning('間違い復習', wrongWordsInCourse, 0);
            } else {
                // カードモードで開始
            initLearning('間違い復習', wrongWordsInCourse, 0, wrongWordsInCourse.length, 0);
            }
        }, 'wrong');
        methodList.appendChild(wrongCard);
    }

    // シャッフルして学習するボタン（常に表示）
    const shuffleCard = createMethodCard('シャッフル', '単語の順序をランダムにして学習します', () => {
            closeModal();
        const shuffledWords = [...courseWords].sort(() => Math.random() - 0.5);
        if (selectedLearningMode === 'input') {
            // 入力モードで開始
            initInputModeLearning(category, shuffledWords, 0);
        } else {
            // カードモードで開始
            initLearning(category, shuffledWords, 0, shuffledWords.length, courseStart);
        }
    }, 'shuffle');
    methodList.appendChild(shuffleCard);
    
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

// 学習方法ボタンを作成
function createMethodCard(title, description, onClick, buttonType = 'default') {
    const button = document.createElement('button');
    button.className = `method-selection-btn method-selection-btn-${buttonType}`;
    button.onclick = onClick;
    
    // ボタンタイプごとの白アイコン（すべてSVG）
    let iconSvg = '';
    if (buttonType === 'start') {
        // 再生（三角）アイコン
        iconSvg = `
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polygon points="8 5 19 12 8 19" fill="currentColor"></polygon>
            </svg>
        `;
    } else if (buttonType === 'continue') {
        // 右向き二重矢印アイコン
        iconSvg = `
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polyline points="6 4 14 12 6 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <polyline points="12 4 20 12 12 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </svg>
        `;
    } else if (buttonType === 'wrong') {
        // ループ（矢印）アイコン
        iconSvg = `
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polyline points="3 11 3 4 10 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <polyline points="21 13 21 20 14 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <path d="M5 19a9 9 0 0 0 14 -3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M19 5a9 9 0 0 0 -14 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;
    } else if (buttonType === 'shuffle') {
        // シャッフルアイコン
        iconSvg = `
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polyline points="16 3 21 3 21 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <polyline points="8 21 3 21 3 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <path d="M21 3L14.5 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M9.5 14.5L3 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M21 13h-4.5a4 4 0 0 1-3.2-1.6L10.7 9.6A4 4 0 0 0 7.5 8H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;
    }
    
    if (iconSvg) {
        button.innerHTML = `${iconSvg}<span>${title}</span>`;
    } else {
        button.textContent = title;
    }
    
    return button;
}

// タイムアタックモードで学習を初期化
function initTimeAttackLearning(category, words) {
    selectedCategory = category;
    currentWords = words;
    isInputModeActive = false;
    isTimeAttackMode = true;
    
    currentRangeStart = 0;
    currentRangeEnd = words.length;
    currentIndex = 0;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    questionStatus = new Array(words.length).fill(null);
    progressBarStartIndex = 0;
    
    // 合計時間を計算（1単語2秒 × 単語数）
    totalTimeRemaining = words.length * TIME_PER_WORD;
    wordStartTime = Date.now();
    
    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    document.body.classList.add('learning-mode');
    document.body.classList.add('time-attack-mode');
    
    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }
    
    // 進捗ステップボタンを非表示（タイムアタックモード）
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (progressStepButtons) {
        progressStepButtons.classList.add('hidden');
    }
    
    // 入力モード、整序英作文モードを非表示、カードモードを表示（カウントダウン中は非表示）
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const statsBar = document.getElementById('statsBar');
    
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (wordCard) wordCard.classList.add('hidden'); // カウントダウン中は非表示
    if (cardHint) cardHint.classList.add('hidden'); // カウントダウン中は非表示
    // モードフラグをリセット
    isSentenceModeActive = false;
    isReorderModeActive = false;
    if (statsBar) statsBar.classList.add('hidden'); // カウントダウン中は非表示
    
    // 進捗バーのセグメントを生成
    if (words.length > 0) {
        createProgressSegments(words.length);
    }
    
    // カウントダウン中はdisplayCurrentWord()を呼ばない
    // displayCurrentWord();
    // updateStats();
    updateNavState('learning');
    
    // 正解・不正解の表示を非表示（タイムアタックモード時は常に非表示）
    const progressStatsScores = document.querySelector('.progress-stats-scores');
    if (progressStatsScores) {
        progressStatsScores.style.display = 'none'; // タイムアタックモード時は常に非表示
    }
    
    // カウントダウンを開始
    startCountdown();
}

// カウントダウンを開始
function startCountdown() {
    const countdownOverlay = document.getElementById('countdownOverlay');
    const countdownNumber = document.getElementById('countdownNumber');
    
    if (!countdownOverlay || !countdownNumber) return;
    
    // カウントダウンオーバーレイを表示
    countdownOverlay.classList.remove('hidden');
    
    let count = 3;
    countdownNumber.textContent = count;
    countdownNumber.classList.add('pulse');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            countdownNumber.classList.remove('pulse');
            // アニメーションをリセット
            void countdownNumber.offsetWidth;
            countdownNumber.classList.add('pulse');
        } else {
            countdownNumber.textContent = 'GO!';
            countdownNumber.classList.remove('pulse');
            countdownNumber.classList.add('go');
            
            // カウントダウン終了後、学習を開始
            setTimeout(() => {
                countdownOverlay.classList.add('hidden');
                countdownNumber.classList.remove('go');
                
                // 学習画面の要素を表示
                const wordCard = document.getElementById('wordCard');
                const cardHint = document.getElementById('cardHint');
                const statsBar = document.getElementById('statsBar');
                const progressStatsScores = document.querySelector('.progress-stats-scores');
                
                if (wordCard) wordCard.classList.remove('hidden');
                if (cardHint) cardHint.classList.remove('hidden');
                if (statsBar) statsBar.classList.remove('hidden');
                if (progressStatsScores) {
                    progressStatsScores.style.display = 'flex';
                }
                
                // 最初の単語を表示
                displayCurrentWord();
                updateStats();
                
                // タイムアタックモードのボタンテキストを変更
                if (isTimeAttackMode) {
                    const correctBtn = document.getElementById('correctBtn');
                    const wrongBtn = document.getElementById('wrongBtn');
                    const masteredBtn = document.getElementById('masteredBtn');
                    if (correctBtn) {
                        correctBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>正解';
                    }
                    if (wrongBtn) {
                        wrongBtn.innerHTML = '不正解<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
                    }
                    if (masteredBtn) {
                        masteredBtn.style.display = 'none'; // 「もうOK！」ボタンを非表示
                    }
                }
                
                // タイマーを開始
                startTimer();
                
                // 単語あたりのタイマーバーを開始
                startWordTimer();
            }, 500);
            
            clearInterval(countdownInterval);
        }
    }, 1000);
}

// 単語あたりのタイマーバーを開始
function startWordTimer() {
    if (!isTimeAttackMode) return;
    
    // 既存のインターバルをクリア
    if (wordTimerInterval) {
        clearInterval(wordTimerInterval);
    }
    
    const wordTimerBar = document.getElementById('wordTimerBar');
    const wordTimerBarFill = document.getElementById('wordTimerBarFill');
    const wordTimerCountdown = document.getElementById('wordTimerCountdown');
    
    if (!wordTimerBar || !wordTimerBarFill || !wordTimerCountdown) return;
    
    // バーを表示
    wordTimerBar.classList.remove('hidden');
    
    // バーをリセット
    const countdownWidth = 44; // 数字表示の最小幅（「2.0秒」）
    const gap = 8; // gap
    const padding = 8; // 右のパディング
    const maxBarWidth = wordTimerBar.offsetWidth - countdownWidth - gap - padding;
    wordTimerBarFill.style.width = `${maxBarWidth}px`;
    wordTimerBarFill.style.backgroundColor = '#3b82f6';
    
    // カウントダウンをリセット
    wordTimerCountdown.textContent = '2.0秒';
    
    wordStartTime = Date.now();
    let elapsed = 0;
    
    // 100msごとに更新（滑らかなアニメーション）
    wordTimerInterval = setInterval(() => {
        elapsed = (Date.now() - wordStartTime) / 1000;
        const remaining = Math.max(0, TIME_PER_WORD - elapsed);
        const percentage = (remaining / TIME_PER_WORD) * 100;
        
        // バーの幅を更新（数字表示とgapを除いた幅に対するパーセンテージ）
        const countdownWidth = 44; // 「2.0秒」の幅
        const gap = 8;
        const padding = 8;
        const maxBarWidth = wordTimerBar.offsetWidth - countdownWidth - gap - padding;
        wordTimerBarFill.style.width = `${(percentage / 100) * maxBarWidth}px`;
        
        // カウントダウン表示を更新（2.0から0.0まで）
        const displayTime = Math.max(0, remaining);
        wordTimerCountdown.textContent = displayTime.toFixed(1) + '秒';
        
        // 残り時間に応じて色を変更
        if (remaining <= 0.5) {
            wordTimerBarFill.style.backgroundColor = '#ef4444'; // 赤
        } else if (remaining <= 1.0) {
            wordTimerBarFill.style.backgroundColor = '#facc15'; // 黄色
        } else {
            wordTimerBarFill.style.backgroundColor = '#3b82f6'; // 青
        }
        
        // 時間切れの処理
        if (remaining <= 0) {
            clearInterval(wordTimerInterval);
            wordTimerInterval = null;
            wordTimerCountdown.textContent = '0.0秒';
            // 時間切れの場合は自動的に間違いとして扱う（カードがめくられている状態でも）
            if (currentIndex < currentRangeEnd) {
                markAnswer(false, true); // 第2引数で時間切れを指定
            }
        }
    }, 100);
}

// 単語あたりのタイマーバーを停止
function stopWordTimer() {
    if (wordTimerInterval) {
        clearInterval(wordTimerInterval);
        wordTimerInterval = null;
    }
    
    const wordTimerBar = document.getElementById('wordTimerBar');
    if (wordTimerBar) {
        wordTimerBar.classList.add('hidden');
    }
}

// タイマーを開始
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        totalTimeRemaining--;
        updateTimerDisplay();
        
        // 時間切れの処理
        if (totalTimeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            handleTimeUp();
        }
    }, 1000);
}

// タイマー表示を更新（内部処理のみ、表示はしない）
function updateTimerDisplay() {
    // タイマー表示要素は削除されたため、内部処理のみ実行
    // 時間切れチェックなどはここで行う
}

// 時間切れの処理
function handleTimeUp() {
    stopWordTimer();
    const completed = currentIndex;
    const total = currentWords.length;
    
    showAlert('時間切れ', `時間切れです！\n${completed}/${total}問を解きました。\n正解数: ${correctCount}\n間違い数: ${wrongCount}`);
    
    setTimeout(() => {
        showCategorySelection();
    }, 2000);
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
    const rangeStart = typeof rangeStartOverride === 'number' ? rangeStartOverride : 0;

    // 全体の範囲を表示できるように、currentRangeStartは常に0（前の単語に戻れるように）
    currentRangeStart = 0;
    currentRangeEnd = end;
    // currentIndexだけを続きの位置に設定
    currentIndex = rangeStart + start;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    const total = end - start;
    questionStatus = new Array(total).fill(null); // 各問題の回答状況を初期化
    
    // 進捗バーの表示開始位置を現在のインデックスが表示される範囲に設定
    const relativeIndex = currentIndex - currentRangeStart;
    // 現在のインデックスが表示される範囲の開始位置を計算（0から始まる相対位置）
    progressBarStartIndex = Math.max(0, Math.floor(relativeIndex / PROGRESS_BAR_DISPLAY_COUNT) * PROGRESS_BAR_DISPLAY_COUNT);
    // ただし、totalを超えないようにする
    progressBarStartIndex = Math.min(progressBarStartIndex, Math.max(0, total - PROGRESS_BAR_DISPLAY_COUNT));
    
    // 前回の回答状況を読み込んで進捗バーに反映
    if (category && category !== '間違い復習' && category !== '復習チェック' && category !== 'チェックした問題') {
        const { correctSet, wrongSet } = loadCategoryWords(category);
        words.forEach((word, wordIndex) => {
            // 全体のインデックスを計算（rangeStartからの相対位置）
            const globalIndex = rangeStart + wordIndex;
            // questionStatusのインデックス（startからの相対位置）
            const statusIndex = wordIndex;
            
            if (statusIndex >= 0 && statusIndex < questionStatus.length) {
                if (wrongSet.has(word.id)) {
                    questionStatus[statusIndex] = 'wrong';
                } else if (correctSet.has(word.id)) {
                    questionStatus[statusIndex] = 'correct';
                }
            }
        });
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    document.body.classList.add('learning-mode');
    
    // 学習画面ではホームボタンを表示
    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }
    
    // タイマーを停止（タイムアタックモード以外）
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    stopWordTimer();
    isTimeAttackMode = false;
    document.body.classList.remove('time-attack-mode');
    
    // 正解・不正解の表示を非表示
    const progressStatsScores = document.querySelector('.progress-stats-scores');
    if (progressStatsScores) {
        progressStatsScores.style.display = 'none';
    }

    // 間違い復習モードの場合のみCSSクラスを付与
    if (category === '間違い復習') {
        elements.mainContent.classList.add('mode-mistake');
    } else {
        elements.mainContent.classList.remove('mode-mistake');
    }

    // 入力モード、例文モード、整序英作文モードを非表示、カードモードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    const sentenceNavigation = document.getElementById('sentenceNavigation');
    // 進捗ステップボタンを表示（タイムアタックモード以外）
    if (progressStepButtons) {
        progressStepButtons.classList.remove('hidden');
    }
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (wordCard) wordCard.classList.remove('hidden');
    // モードフラグをリセット
    isInputModeActive = false;
    isSentenceModeActive = false;
    isReorderModeActive = false;
    if (cardHint) cardHint.classList.remove('hidden');
    // カードモードのときは進捗バーの「前の単語へ・次の単語へ」ボタンを表示
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    // 例文モード用のナビゲーションボタンを非表示
    if (sentenceNavigation) sentenceNavigation.classList.add('hidden');

    // 進捗バーのセグメントを強制的に生成
    if (total > 0) {
        createProgressSegments(total);
        updateProgressSegments(); // セグメントの色を更新
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
    
    // コースタブ切り替え
    // 大阪府公立入試について知るボタン
    const examInfoBtn = document.getElementById('examInfoBtn');
    const examInfoView = document.getElementById('examInfoView');
    const backToCategoryFromExamInfoBtn = document.getElementById('backToCategoryFromExamInfoBtn');
    
    if (examInfoBtn && examInfoView) {
        examInfoBtn.addEventListener('click', () => {
            // カテゴリー選択画面を非表示
            if (elements.categorySelection) {
                elements.categorySelection.classList.add('hidden');
            }
            // コース選択画面を非表示
            const courseSelection = document.getElementById('courseSelection');
            if (courseSelection) {
                courseSelection.classList.add('hidden');
            }
            // 入試情報画面を表示
            examInfoView.classList.remove('hidden');
            // ヘッダーのサブタイトルを更新
            if (elements.headerSubtitle) {
                elements.headerSubtitle.textContent = '大阪府公立高校入試特化型英単語';
            }
        });
    }
    
    // 入試情報画面から戻るボタン
    if (backToCategoryFromExamInfoBtn && examInfoView) {
        backToCategoryFromExamInfoBtn.addEventListener('click', () => {
            examInfoView.classList.add('hidden');
            if (elements.categorySelection) {
                elements.categorySelection.classList.remove('hidden');
            }
        });
    }
    
    // 入試情報画面のタブ切り替え機能
    if (examInfoView) {
        const examTabs = examInfoView.querySelectorAll('.exam-tab');
        const examTabContents = examInfoView.querySelectorAll('.exam-tab-content');
        
        examTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // すべてのタブとコンテンツからactiveクラスを削除
                examTabs.forEach(t => t.classList.remove('active'));
                examTabContents.forEach(content => content.classList.remove('active'));
                
                // クリックされたタブと対応するコンテンツにactiveクラスを追加
                tab.classList.add('active');
                const targetContent = examInfoView.querySelector(`#${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    const courseTabs = document.querySelectorAll('.course-tab');
    const courseSections = document.querySelectorAll('.course-section');
    const modeToggleContainer = document.getElementById('masterCourseModeToggle');
    if (courseTabs.length && courseSections.length) {
        courseTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                courseTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                courseSections.forEach(section => {
                    if (section.id === targetId) {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                });
                // モードトグルボタンは英単語マスターコースのときのみ表示
                if (modeToggleContainer) {
                    if (targetId === 'courseMasterSection') {
                        modeToggleContainer.classList.remove('hidden');
                    } else {
                        modeToggleContainer.classList.add('hidden');
                    }
                }
            });
        });
    }
    
    // モード切り替えトグルボタン
    const cardModeToggle = document.getElementById('cardModeToggle');
    const inputModeToggle = document.getElementById('inputModeToggle');
    if (cardModeToggle && inputModeToggle) {
        cardModeToggle.addEventListener('click', () => {
            selectedLearningMode = 'card';
            cardModeToggle.classList.add('active');
            inputModeToggle.classList.remove('active');
            updateCategoryStars(); // 進捗表示を更新
        });
        inputModeToggle.addEventListener('click', () => {
            selectedLearningMode = 'input';
            inputModeToggle.classList.add('active');
            cardModeToggle.classList.remove('active');
            updateCategoryStars(); // 進捗表示を更新
        });
    }
    
    // グラフ期間選択タブ切り替え
    const chartPeriodTabs = document.querySelectorAll('.chart-period-tab');
    if (chartPeriodTabs.length) {
        chartPeriodTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                chartPeriodTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const period = tab.getAttribute('data-period');
                if (period && ['week', 'month', 'year'].includes(period)) {
                    chartPeriod = period;
                    updateBarChart();
                }
            });
        });
    }
    
    // SNSシェアボタン
    const lineShareBtn = document.getElementById('lineShareBtn');
    const xShareBtn = document.getElementById('xShareBtn');
    const instagramShareBtn = document.getElementById('instagramShareBtn');
    
    const shareText = '大阪府公立高校入試特化型英単語アプリ「大阪府英単語コンプリート」で英単語を学習しよう！';
    const shareUrl = window.location.href;
    
    if (lineShareBtn) {
        lineShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
            window.open(lineUrl, '_blank', 'width=600,height=400');
        });
    }
    
    if (xShareBtn) {
        xShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(xUrl, '_blank', 'width=600,height=400');
        });
    }
    
    if (instagramShareBtn) {
        instagramShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Instagramは直接シェアできないため、クリップボードにコピー
            const shareTextWithUrl = `${shareText}\n${shareUrl}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareTextWithUrl).then(() => {
                    showAlert('コピーしました', 'Instagramに貼り付けてシェアしてください。');
                }).catch(() => {
                    showAlert('エラー', 'コピーに失敗しました。');
                });
            } else {
                showAlert('情報', 'このブラウザではコピー機能が利用できません。\n' + shareTextWithUrl);
            }
        });
    }
    
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

    // 音声ボタン（カードモード）
    if (elements.audioBtn) {
        elements.audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = currentWords && currentWords[currentIndex] ? currentWords[currentIndex].word : '';
            if (word) {
                speakWord(word, elements.audioBtn);
            }
        });
        elements.audioBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    // 音声ボタン（入力モード）
    if (elements.inputAudioBtn) {
        elements.inputAudioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = currentWords && currentWords[currentIndex] ? currentWords[currentIndex].word : '';
            if (word) {
                speakWord(word, elements.inputAudioBtn);
            }
        });
        elements.inputAudioBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    }


    // カードのタップで答えを表示
    elements.wordCard.addEventListener('click', handleCardTap);

    // スワイプ検知
    setupSwipeDetection(elements.wordCard);

    // elements.showWrongWordsBtn.addEventListener('click', showWrongWords); // 削除
    
    // 正解・不正解・完璧ボタン
    elements.correctBtn.addEventListener('click', () => markAnswer(true));
    elements.wrongBtn.addEventListener('click', () => markAnswer(false));
    if (elements.masteredBtn) {
    elements.masteredBtn.addEventListener('click', () => markMastered());
    }
    
    // ホームボタン
    if (elements.homeBtn) {
        elements.homeBtn.addEventListener('click', async () => {
            if (await showConfirm('学習を中断してホームに戻りますか？')) {
                showCategorySelection();
            }
        });
    }
    
    // 進捗バーの矢印ボタン
    // 進捗バーのスワイプ機能を設定
    setupProgressBarSwipe();
    
    // 進捗バーの1つずつ移動ボタン
    const progressStepLeft = document.getElementById('progressStepLeft');
    const progressStepRight = document.getElementById('progressStepRight');
    if (progressStepLeft) {
        progressStepLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isReorderModeActive) {
                // 整序英作文モードのとき
                moveToPrevReorderQuestion();
            } else if (isSentenceModeActive) {
                // 例文モードのとき
                if (currentSentenceIndex > 0) {
                    currentSentenceIndex--;
                    currentIndex = currentSentenceIndex;
                    displayCurrentSentence();
                }
            } else {
                // 通常モードのとき
                goToPreviousWord();
            }
        });
    }
    if (progressStepRight) {
        progressStepRight.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isReorderModeActive) {
                // 整序英作文モードのとき
                moveToNextReorderQuestion();
            } else if (isSentenceModeActive) {
                // 例文モードのとき
                if (currentSentenceIndex < sentenceData.length - 1) {
                    currentSentenceIndex++;
                    currentIndex = currentSentenceIndex;
                    displayCurrentSentence();
                }
            } else {
                // 通常モードのとき
                goToNextWord();
            }
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
            elements.headerSubtitle.textContent = '大阪府公立高校入試特化型英単語';
        });
    }
    
    // ハンバーガーメニューボタンとサイドバー
    const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const homeFromSidebarBtn = document.getElementById('homeFromSidebarBtn');
    
    // サイドバーを開く
    function openSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('sidebar-open');
            sidebarOverlay.classList.add('sidebar-open');
            document.body.style.overflow = 'hidden'; // スクロールを無効化
        }
    }
    
    // サイドバーを閉じる
    function closeSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('sidebar-open');
            document.body.style.overflow = ''; // スクロールを有効化
        }
    }
    
    if (hamburgerMenuBtn) {
        hamburgerMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSidebar();
        });
    }
    
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
        });
    }
    
    // 学習方法ボタン
    const learningMethodBtn = document.getElementById('learningMethodBtn');
    if (learningMethodBtn) {
        learningMethodBtn.addEventListener('click', () => {
            closeSidebar();
            
            // 現在のカテゴリーに応じて学習方法選択モーダルを表示
            if (selectedCategory) {
                // カテゴリーが選択されている場合
                let categoryWords;
                if (selectedCategory === '基本語彙500') {
                    // 基本語彙500コースは削除されました
                    showAlert('エラー', 'このコースは利用できません。');
                    return;
                } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                    if (typeof elementaryWordData !== 'undefined') {
                        categoryWords = elementaryWordData;
                    } else {
                        showAlert('エラー', '小学生で習った単語データが見つかりません。');
                        return;
                    }
                } else {
                    categoryWords = wordData.filter(word => word.category === selectedCategory);
                }
                
                if (categoryWords.length === 0) {
                    showAlert('エラー', '選択したカテゴリーに単語がありません。');
                    return;
                }
                
                // 小学生で習った単語の場合は入力モード用のモーダルを表示
                if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                    const { wrongSet } = loadCategoryWords(selectedCategory);
                    const wrongWordsInCategory = categoryWords.filter(word => wrongSet.has(word.id));
                    const savedIndex = loadProgress(selectedCategory);
                    const hasProgress = savedIndex > 0;
                    showInputModeMethodSelectionModal(selectedCategory, categoryWords, hasProgress, savedIndex, wrongWordsInCategory);
                } else {
                    // 通常のカードモードの場合、コース選択画面を表示
                    showCourseSelection(selectedCategory, categoryWords);
                }
            } else {
                // カテゴリーが選択されていない場合はカテゴリー選択画面に戻る
                showCategorySelection();
            }
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            closeSidebar();
            clearLearningHistory();
        });
    }
    
    // サイドバーのホームに戻るボタン
    if (homeFromSidebarBtn) {
        homeFromSidebarBtn.addEventListener('click', async () => {
            closeSidebar();
            if (await showConfirm('ホームに戻りますか？')) {
                showCategorySelection();
            }
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
    
    // 整序英作文モードのイベントリスナー
    const reorderResetBtn = document.getElementById('reorderResetBtn');
    const reorderSubmitBtn = document.getElementById('reorderSubmitBtn');
    
    if (reorderResetBtn) {
        reorderResetBtn.addEventListener('click', handleReorderReset);
    }
    
    if (reorderSubmitBtn) {
        reorderSubmitBtn.addEventListener('click', handleReorderSubmit);
    }
    
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
                        // カードをフリップアウト
                        const inputModeContent = document.querySelector('.input-mode-content');
                        if (inputModeContent) {
                            // 現在のカードを回転させて裏返す
                            inputModeContent.classList.add('flip-out');
                            
                            // アニメーションの途中（180度回転した時点）でコンテンツを更新
                            setTimeout(() => {
                                currentIndex++;
                                inputAnswerSubmitted = false;
                                decideBtn.textContent = '解答';
                                const passBtn = document.getElementById('keyboardPass');
                                if (passBtn) passBtn.style.display = '';
                                
                                // コンテンツを更新（アニメーションリセットをスキップ）
                                displayInputMode(true);
                                
                                // flip-outを削除してflip-inを追加（180度から0度に回転）
                                inputModeContent.classList.remove('flip-out', 'active');
                                inputModeContent.classList.add('flip-in');
                                
                                // ブラウザにレンダリングを強制
                                void inputModeContent.offsetHeight;
                                
                                // 次のフレームで0度に回転（表に戻る）
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        inputModeContent.classList.add('active');
                                    });
                                });
                                
                                // アニメーション完了後にクラスをクリア
                                setTimeout(() => {
                                    inputModeContent.classList.remove('flip-in', 'active');
                                }, 400);
                            }, 200); // 180度回転した時点（アニメーションの半分）
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
            inputModeContent.classList.remove('flip-out', 'flip-in', 'active');
        }
    }

    const word = currentWords[currentIndex];
    inputAnswerSubmitted = false;
    
    // No.を更新（カードモードと入力モードの両方）
    if (elements.wordNumber) {
        elements.wordNumber.textContent = `No.${word.id}`;
    }
    const inputWordNumber = document.getElementById('inputWordNumber');
    if (inputWordNumber) {
        inputWordNumber.textContent = `No.${word.id}`;
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
    if (currentIndex > currentRangeStart) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        inputAnswerSubmitted = false;
        if (elements.wordCard) {
            elements.wordCard.classList.remove('flipped');
        }
        
        currentIndex--;
        
        if (isInputModeActive) {
            displayInputMode();
        } else {
            displayCurrentWord();
        }
        updateStats(); // 進捗バーを更新
        updateProgressSegments();
        updateNavButtons(); // ボタン状態を更新
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
    
    // 現在の問題の回答状況を記録
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = isCorrect ? 'correct' : 'wrong';
    }
    
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
    
    // 現在の問題の回答状況を記録（間違い扱い）
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = 'wrong';
    }
    
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
    if (currentIndex > currentRangeStart) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        inputAnswerSubmitted = false;
        if (elements.wordCard) {
            elements.wordCard.classList.remove('flipped');
        }
        
        currentIndex--;
        
        if (isInputModeActive) {
            displayInputMode();
        } else {
            displayCurrentWord();
        }
        updateStats(); // 進捗バーを更新
        updateProgressSegments();
        updateNavButtons(); // ボタン状態を更新
        // 前に戻った場合、進捗保存はしない（進んだときのみ保存するのが一般的）
    }
}

// 次の単語に移動（回答せずに進む場合）
function goToNextWord() {
    if (currentIndex < currentRangeEnd - 1) {
        // 現在のカードの状態をリセット
        isCardRevealed = false;
        inputAnswerSubmitted = false;
        if (elements.wordCard) {
            elements.wordCard.classList.remove('flipped');
        }

        currentIndex++;
        
        updateProgressSegments();
        
        if (isInputModeActive) {
            displayInputMode();
        } else {
            displayCurrentWord();
        }
        updateStats(); // 進捗バーを更新
        updateNavButtons(); // ボタン状態を更新
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
    // タイムアタックモードで時間切れの場合は次へ進む
    if (isTimeAttackMode) {
        const elapsed = (Date.now() - wordStartTime) / 1000;
        if (elapsed >= TIME_PER_WORD) {
            markAnswer(false, true); // 第2引数で時間切れを指定
            return;
        }
    }
    
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
    
    // タイムアタックモードのときはマーカーを表示しない
    if (isTimeAttackMode) {
        // マーカーをクリア
        if (elements.englishWord) {
            elements.englishWord.style.backgroundImage = '';
            elements.englishWord.style.backgroundSize = '';
            elements.englishWord.style.backgroundRepeat = '';
            elements.englishWord.style.backgroundPosition = '';
        }
        const inputMeaning = document.getElementById('inputMeaning');
        if (inputMeaning) {
            inputMeaning.style.backgroundImage = '';
            inputMeaning.style.backgroundSize = '';
            inputMeaning.style.backgroundRepeat = '';
            inputMeaning.style.backgroundPosition = '';
        }
        return;
    }

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
            layers.push(band('rgba(59, 130, 246, 0.32)', 0.60, 0.82));
        }
    } else if (categoryWrongSet.has(word.id)) {
        layers.push(band('rgba(239, 68, 68, 0.30)', 0.60, 0.82));
    } else if (categoryCorrectSet.has(word.id)) {
        layers.push(band('rgba(59, 130, 246, 0.35)', 0.60, 0.82));
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
    
    // タイムアタックモードの場合、単語開始時間をリセット
    if (isTimeAttackMode) {
        stopWordTimer();
        startWordTimer();
        updateTimerDisplay();
        
        // タイムアタックモードのボタンテキストを確認
        const correctBtn = document.getElementById('correctBtn');
        const wrongBtn = document.getElementById('wrongBtn');
        const masteredBtn = document.getElementById('masteredBtn');
        if (correctBtn && !correctBtn.textContent.includes('正解')) {
            correctBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>正解';
        }
        if (wrongBtn && !wrongBtn.textContent.includes('不正解')) {
            wrongBtn.innerHTML = '不正解<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        }
        if (masteredBtn) {
            masteredBtn.style.display = 'none'; // 「もうOK！」ボタンを非表示
        }
    } else {
        // 通常モードの場合はボタンを元に戻す
        const masteredBtn = document.getElementById('masteredBtn');
        if (masteredBtn) {
            masteredBtn.style.display = ''; // 「もうOK！」ボタンを表示
        }
    }
    
    // 日本語モードの場合のみ自動で音声を再生（0.3秒遅延）
    if (!isInputModeActive) {
        setTimeout(() => {
            speakWord(word.word, null);
        }, 300);
    }
}

// ナビゲーションボタンの状態更新
function updateNavButtons() {
    const progressStepLeft = document.getElementById('progressStepLeft');
    const progressStepRight = document.getElementById('progressStepRight');
    if (!progressStepLeft || !progressStepRight) return;
    
    if (isReorderModeActive) {
        // 整序英作文モードのとき
        progressStepLeft.disabled = currentReorderIndex === 0;
        progressStepRight.disabled = currentReorderIndex >= reorderData.length - 1;
        // テキストを更新
        const leftSpan = progressStepLeft.querySelector('span');
        const rightSpan = progressStepRight.querySelector('span');
        if (leftSpan) leftSpan.textContent = '前の問題へ';
        if (rightSpan) rightSpan.textContent = '次の問題へ';
    } else if (isSentenceModeActive) {
        // 例文モードのとき
        progressStepLeft.disabled = currentSentenceIndex === 0;
        progressStepRight.disabled = currentSentenceIndex >= sentenceData.length - 1;
        // テキストを更新
        const leftSpan = progressStepLeft.querySelector('span');
        const rightSpan = progressStepRight.querySelector('span');
        if (leftSpan) leftSpan.textContent = '前の問題へ';
        if (rightSpan) rightSpan.textContent = '次の問題へ';
    } else {
        // 通常モードのとき
        progressStepLeft.disabled = currentIndex <= currentRangeStart;
        progressStepRight.disabled = currentIndex >= currentRangeEnd - 1;
        // テキストを更新
        const leftSpan = progressStepLeft.querySelector('span');
        const rightSpan = progressStepRight.querySelector('span');
        if (leftSpan) leftSpan.textContent = '前の単語へ';
        if (rightSpan) rightSpan.textContent = '次の単語へ';
    }
}

// 完璧としてマーク（上スワイプ）
function markMastered() {
    if (currentIndex >= currentRangeEnd) return;

    const word = currentWords[currentIndex];
    answeredWords.add(word.id);
    
    // 現在の問題の回答状況を記録（正解）
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = 'correct';
    }
    
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
    updateProgressSegments(); // 進捗バーのセグメントを更新

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
        
        // タイムアタックモードの場合、使用時間を減算
        if (isTimeAttackMode) {
            stopWordTimer();
            const elapsed = (Date.now() - wordStartTime) / 1000;
            totalTimeRemaining = Math.max(0, totalTimeRemaining - elapsed);
            if (totalTimeRemaining <= 0) {
                handleTimeUp();
                return;
            }
        }
        
        // 進捗を保存
        if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習' && selectedCategory !== '大阪C問題対策英単語タイムアタック') {
            saveProgress(selectedCategory, currentIndex);
        }
        // 最後の単語の場合は完了画面を表示
        if (currentIndex >= currentRangeEnd) {
            if (isTimeAttackMode) {
                // タイムアタックモードの完了処理
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                stopWordTimer();
                const remainingTime = totalTimeRemaining;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = Math.floor(remainingTime % 60);
                showAlert('クリア！', `全問解ききりました！\n残り時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}\n正解数: ${correctCount}\n間違い数: ${wrongCount}`);
                setTimeout(() => {
                    showCategorySelection();
                }, 2000);
            } else {
                showCompletion();
            }
        } else {
            displayCurrentWord();
        }
    }, 180);
}

// スワイプまたはボタンで正解/不正解をマーク
function markAnswer(isCorrect, isTimeout = false) {
    if (currentIndex >= currentRangeEnd) return;

    const word = currentWords[currentIndex];
    answeredWords.add(word.id);
    
    // 学習日を記録（最初の回答時のみ）
    if (answeredWords.size === 1) {
        recordStudyDate();
    }

    // 現在の問題の回答状況を記録
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = isCorrect ? 'correct' : 'wrong';
    }

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
    updateProgressSegments(); // 進捗バーのセグメントを更新

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
        
        // タイムアタックモードの場合、使用時間を減算
        if (isTimeAttackMode) {
            const elapsed = (Date.now() - wordStartTime) / 1000;
            totalTimeRemaining = Math.max(0, totalTimeRemaining - elapsed);
            if (totalTimeRemaining <= 0) {
                handleTimeUp();
                return;
            }
        }
        
        // 進捗を保存
        if (selectedCategory && selectedCategory !== '復習チェック' && selectedCategory !== '間違い復習' && selectedCategory !== '大阪C問題対策英単語タイムアタック') {
            saveProgress(selectedCategory, currentIndex);
        }
        
        // 進捗バーを更新
        updateProgressSegments();
        updateNavButtons();
        
        // 最後の単語の場合は完了画面を表示
        if (currentIndex >= currentRangeEnd) {
            if (isTimeAttackMode) {
                // タイムアタックモードの完了処理
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                const remainingTime = totalTimeRemaining;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = Math.floor(remainingTime % 60);
                showAlert('クリア！', `全問解ききりました！\n残り時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}\n正解数: ${correctCount}\n間違い数: ${wrongCount}`);
                setTimeout(() => {
                    showCategorySelection();
                }, 2000);
            } else {
                showCompletion();
            }
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

// 進捗バーのセグメントを生成（20問ずつ表示）
function createProgressSegments(total) {
    // 共通のコンテナを使用
    const container = document.getElementById('progressBarContainer');
    
    if (!container) return;
    
    // 表示範囲を計算
    const displayStart = progressBarStartIndex;
    const displayEnd = Math.min(displayStart + PROGRESS_BAR_DISPLAY_COUNT, total);
    
    container.innerHTML = '';
    for (let i = displayStart; i < displayEnd; i++) {
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.dataset.index = i;
        segment.addEventListener('click', () => {
            const targetIndex = parseInt(segment.dataset.index);
            const absoluteIndex = currentRangeStart + targetIndex;
            if (absoluteIndex >= currentRangeStart && absoluteIndex < currentRangeEnd) {
                currentIndex = absoluteIndex;
                
                // 整序英作文モードの場合
                if (isReorderModeActive) {
                    currentReorderIndex = absoluteIndex;
                    reorderAnswerSubmitted = false;
                    displayCurrentReorderQuestion();
                    updateStats();
                    updateNavButtons();
                    return;
                }
                
                // 例文モードの場合
                if (isSentenceModeActive) {
                    currentSentenceIndex = absoluteIndex;
                    sentenceAnswerSubmitted = false;
                    displayCurrentSentence();
                    updateStats();
                    updateNavButtons();
                    return;
                }
                
                // 通常モードの場合
                isCardRevealed = false;
                inputAnswerSubmitted = false;
                if (elements.wordCard) {
                    elements.wordCard.classList.remove('flipped');
                }
                // 入力モードかカードモードかで適切な関数を呼ぶ
                if (isInputModeActive) {
                    displayInputMode();
                } else {
                    displayCurrentWord();
                }
                updateStats();
                updateNavButtons();
            }
        });
        container.appendChild(segment);
    }
    
    // セグメントの色を設定
    let currentQuestionIndex;
    if (isReorderModeActive) {
        currentQuestionIndex = currentReorderIndex - currentRangeStart;
    } else if (isSentenceModeActive) {
        currentQuestionIndex = currentSentenceIndex - currentRangeStart;
    } else {
        currentQuestionIndex = currentIndex - currentRangeStart;
    }
    const segments = container.querySelectorAll('.progress-segment');
    segments.forEach((segment) => {
        const segmentIndex = parseInt(segment.dataset.index);
        segment.classList.remove('correct', 'wrong', 'current');
        
        // 現在の問題をハイライト（タイムアタックモードのときは表示しない）
        if (!isTimeAttackMode && segmentIndex === currentQuestionIndex) {
            segment.classList.add('current');
        }
        
        // 回答状況に応じて色を設定（タイムアタックモードでも色をつける）
        if (questionStatus[segmentIndex] === 'correct') {
            segment.classList.add('correct');
        } else if (questionStatus[segmentIndex] === 'wrong') {
            segment.classList.add('wrong');
        }
    });
    
    // 矢印ボタンの状態を更新
    updateProgressNavButtons(total);
}

// 進捗バーのセグメントを更新
function updateProgressSegments() {
    const total = currentRangeEnd - currentRangeStart;
    let currentQuestionIndex;
    
    // モードに応じて現在のインデックスを取得
    if (isReorderModeActive) {
        currentQuestionIndex = currentReorderIndex - currentRangeStart;
    } else if (isSentenceModeActive) {
        currentQuestionIndex = currentSentenceIndex - currentRangeStart;
    } else {
        currentQuestionIndex = currentIndex - currentRangeStart;
    }
    
    // 共通のコンテナを使用
    const container = document.getElementById('progressBarContainer');
    
    if (!container) return;
    
    const segments = container.querySelectorAll('.progress-segment');
    
    segments.forEach((segment) => {
        const segmentIndex = parseInt(segment.dataset.index);
        segment.classList.remove('correct', 'wrong', 'current');
        
        // 現在の問題をハイライト（タイムアタックモードのときは表示しない）
        if (!isTimeAttackMode && segmentIndex === currentQuestionIndex) {
            segment.classList.add('current');
        }
        
        // 回答状況に応じて色を設定（タイムアタックモードでも色をつける）
        if (questionStatus[segmentIndex] === 'correct') {
            segment.classList.add('correct');
        } else if (questionStatus[segmentIndex] === 'wrong') {
            segment.classList.add('wrong');
        }
    });
    
    // 表示範囲のテキストを更新
    updateProgressRangeText(total);
}

// 進捗バーの表示範囲テキストを更新（ボタン削除に伴い関数名を変更）
function updateProgressNavButtons(total) {
    // 表示範囲のテキストを更新
    updateProgressRangeText(total);
}

// 進捗バーのスワイプ機能を設定
function setupProgressBarSwipe() {
    const progressBarContainer = document.getElementById('progressBarContainer');
    if (!progressBarContainer) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    const minSwipeDistance = 50; // 最小スワイプ距離（ピクセル）
    
    progressBarContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
        progressBarContainer.classList.add('swiping');
    }, { passive: true });
    
    progressBarContainer.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX;
        // スワイプ中の視覚的フィードバック（最大20pxまで移動）
        const maxOffset = 20;
        const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.3));
        progressBarContainer.style.transform = `translateX(${offset}px)`;
    }, { passive: true });
    
    progressBarContainer.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        touchEndX = e.changedTouches[0].clientX;
        progressBarContainer.style.transform = '';
        progressBarContainer.classList.remove('swiping');
        isSwiping = false;
        handleSwipe();
    }, { passive: true });
    
    progressBarContainer.addEventListener('touchcancel', () => {
        progressBarContainer.style.transform = '';
        progressBarContainer.classList.remove('swiping');
        isSwiping = false;
    }, { passive: true });
    
    // マウスドラッグでも対応（デスクトップ用）
    let isDragging = false;
    progressBarContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        isSwiping = true;
        touchStartX = e.clientX;
        progressBarContainer.classList.add('swiping');
        e.preventDefault();
    });
    
    progressBarContainer.addEventListener('mousemove', (e) => {
        if (!isDragging || !isSwiping) return;
        const currentX = e.clientX;
        const deltaX = currentX - touchStartX;
        // スワイプ中の視覚的フィードバック（最大20pxまで移動）
        const maxOffset = 20;
        const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.3));
        progressBarContainer.style.transform = `translateX(${offset}px)`;
    });
    
    progressBarContainer.addEventListener('mouseup', (e) => {
        if (isDragging) {
            touchEndX = e.clientX;
            progressBarContainer.style.transform = '';
            progressBarContainer.classList.remove('swiping');
            isSwiping = false;
            isDragging = false;
            handleSwipe();
        }
    });
    
    progressBarContainer.addEventListener('mouseleave', () => {
        progressBarContainer.style.transform = '';
        progressBarContainer.classList.remove('swiping');
        isSwiping = false;
        isDragging = false;
    });
    
    function handleSwipe() {
        const swipeDistance = touchStartX - touchEndX;
        
        // 左から右にスワイプ（左へ移動：前の20個）
        if (swipeDistance < -minSwipeDistance) {
            scrollProgressBarLeft();
        }
        // 右から左にスワイプ（右へ移動：次の20個）
        else if (swipeDistance > minSwipeDistance) {
            scrollProgressBarRight();
        }
    }
}

// 進捗バーの表示範囲テキストを更新
function updateProgressRangeText(total) {
    const rangeText = document.getElementById('progressRangeText');
    if (!rangeText) return;
    
    const displayStart = progressBarStartIndex + 1; // 1から始まる番号
    const displayEnd = Math.min(progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT, total);
    
    rangeText.textContent = `No.${displayStart}-${displayEnd}`;
}

// 進捗バーを左にスクロール
function scrollProgressBarLeft() {
    const total = currentRangeEnd - currentRangeStart;
    if (progressBarStartIndex > 0) {
        // 20個ずつ前の範囲に移動
        progressBarStartIndex = Math.max(0, progressBarStartIndex - PROGRESS_BAR_DISPLAY_COUNT);
        createProgressSegments(total);
        updateProgressSegments(); // セグメントの色を更新
        updateNavButtons(); // ボタン状態を更新
    }
}

// 進捗バーを右にスクロール
function scrollProgressBarRight() {
    const total = currentRangeEnd - currentRangeStart;
    if (progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT < total) {
        // 20個ずつ次の範囲に移動
        progressBarStartIndex = Math.min(total - PROGRESS_BAR_DISPLAY_COUNT, 
            progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT);
        createProgressSegments(total);
        updateProgressSegments(); // セグメントの色を更新
        updateNavButtons(); // ボタン状態を更新
    }
}

// 統計を更新
function updateStats() {
    const total = currentRangeEnd - currentRangeStart;
    // 現在見ている英単語の位置（1から始まる）
    const currentPosition = currentIndex + 1;
    
    // 共通の進捗テキストを更新
    if (elements.progressText) {
        elements.progressText.textContent = `${currentPosition} / ${total}`;
    }
    
    // 正解数・不正解数・正解率の表示は常に非表示
    const progressStatsScores = document.querySelector('.progress-stats-scores');
    if (progressStatsScores) {
        progressStatsScores.style.display = 'none';
    }
    
    // タイムアタックモードの場合、タイマー表示を更新（内部処理のみ、表示はしない）
    if (isTimeAttackMode) {
        updateTimerDisplay();
    }
    
    // 進捗バーのセグメントを生成（初回のみ）
    const container = document.getElementById('progressBarContainer');
    
    // totalが0より大きい場合、セグメントを生成
    if (total > 0 && container) {
        // セグメント数が合わない場合は生成（表示範囲の20個分のみ）
        const expectedSegmentCount = Math.min(PROGRESS_BAR_DISPLAY_COUNT, total - progressBarStartIndex);
        if (container.children.length !== expectedSegmentCount) {
            createProgressSegments(total);
        }
        
        // セグメントの色を更新
        updateProgressSegments();
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
            const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'LEVEL1 超よくでる400', 'LEVEL2 よくでる300', 'LEVEL3 差がつく200', 'LEVEL4 ハイレベル200'];
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

// 厳選例文暗記モードで学習を初期化
function initSentenceModeLearning(category) {
    selectedCategory = category;
    sentenceData = sentenceMemorizationData;
    isSentenceModeActive = true;
    isInputModeActive = false; // 入力モードを無効化
    currentSentenceIndex = 0;
    sentenceAnswerSubmitted = false;
    
    currentRangeStart = 0;
    currentRangeEnd = sentenceData.length;
    currentIndex = 0;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    questionStatus = new Array(sentenceData.length).fill(null);
    
    // 前回の回答状況を読み込んで進捗バーに反映
    if (category) {
        const { correctSet, wrongSet } = loadCategoryWords(category);
        sentenceData.forEach((sentence, index) => {
            if (wrongSet.has(sentence.id)) {
                questionStatus[index] = 'wrong';
            } else if (correctSet.has(sentence.id)) {
                questionStatus[index] = 'correct';
            }
        });
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    elements.headerSubtitle.textContent = category;
    
    document.body.classList.add('learning-mode');

    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }

    // カードモード、入力モード、整序英作文モードを非表示、例文モードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.remove('hidden');
    // モードフラグをリセット
    isInputModeActive = false;
    isReorderModeActive = false;
    if (cardHint) cardHint.classList.add('hidden');
    // 例文モードのときは進捗バーのボタンを表示（テキストは「前の問題へ・次の問題へ」に変更）
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    updateNavButtons(); // ボタンのテキストと状態を更新
    
    displayCurrentSentence();
    // 進捗バーのセグメントを生成
    const total = currentRangeEnd - currentRangeStart;
    if (total > 0) {
        createProgressSegments(total);
    }
    updateStats();
    updateNavState('learning');
    setupSentenceKeyboard();
    
    // ボタンの状態をリセット
    resetSentenceButtons();
}

// 例文モードのボタンをリセット
function resetSentenceButtons() {
    const decideBtn = document.getElementById('sentenceKeyboardDecide');
    const passBtn = document.getElementById('sentenceKeyboardPass');
    
    if (decideBtn) {
        decideBtn.textContent = '解答';
    }
    
    if (passBtn) {
        passBtn.style.display = '';
    }
}

// 現在の例文を表示
function displayCurrentSentence() {
    if (currentSentenceIndex >= sentenceData.length) {
        showCompletion();
        return;
    }

    const sentence = sentenceData[currentSentenceIndex];
    sentenceAnswerSubmitted = false;
    currentSelectedBlankIndex = -1; // 選択状態をリセット
    
    // ヒントを非表示にリセット
    const hintContent = document.getElementById('sentenceHintContent');
    const hintBtn = document.getElementById('sentenceHintBtn');
    if (hintContent) {
        hintContent.classList.add('hidden');
    }
    // 矢印を▶にリセット
    if (hintBtn) {
        const arrowElement = hintBtn.querySelector('.hint-arrow');
        if (arrowElement) {
            arrowElement.textContent = '▶';
        }
    }
    
    // 日本語訳を表示
    const japaneseEl = document.getElementById('sentenceJapanese');
    if (japaneseEl) {
        japaneseEl.textContent = sentence.japanese;
    }
    
    // 英文を構築（空所を含む）
    const englishEl = document.getElementById('sentenceEnglish');
    if (englishEl) {
        englishEl.innerHTML = '';
        sentenceBlanks = [];
        
        // 英文を単語に分割し、空所の位置を特定
        const words = sentence.english.split(' ');
        
        words.forEach((word, idx) => {
            // 句読点を除去した単語で比較
            const wordWithoutPunct = word.replace(/[.,!?]/g, '');
            // 空所かどうかを判定（blanks配列に含まれているか）
            const blankInfo = sentence.blanks.find(b => b.word.toLowerCase() === wordWithoutPunct.toLowerCase());
            
            if (blankInfo) {
                // 空所を作成
                const blankSpan = document.createElement('span');
                blankSpan.className = 'sentence-blank';
                blankSpan.dataset.blankIndex = blankInfo.index;
                blankSpan.textContent = ' '.repeat(blankInfo.word.length); // 空欄をスペースで埋める
                blankSpan.dataset.correctWord = blankInfo.word;
                
                // 単語の長さに応じて幅を計算（1文字あたり約14px + パディング24px + 余裕8px）
                const charWidth = 14; // フォントサイズとフォントファミリーに基づく概算
                const padding = 24; // 左右のパディング（12px × 2）
                const extraSpace = 8; // 余裕
                const calculatedWidth = Math.max(60, (blankInfo.word.length * charWidth) + padding + extraSpace);
                blankSpan.style.width = `${calculatedWidth}px`;
                
                englishEl.appendChild(blankSpan);
                
                sentenceBlanks.push({
                    index: blankInfo.index,
                    word: blankInfo.word,
                    userInput: '',
                    element: blankSpan
                });
            } else {
                // 通常の単語
                const partSpan = document.createElement('span');
                partSpan.className = 'sentence-part';
                partSpan.textContent = word + (idx < words.length - 1 ? ' ' : '');
                englishEl.appendChild(partSpan);
            }
        });
        
        // 空所をindex順にソート
        sentenceBlanks.sort((a, b) => a.index - b.index);
        
        // 空所にタップイベントを追加し、幅を再計算
        sentenceBlanks.forEach(blank => {
            // モバイル対応の幅計算
            const isMobile = window.innerWidth <= 600;
            const charWidth = isMobile ? 12 : 14; // モバイルでは文字幅が小さい
            const padding = isMobile ? 12 : 24; // モバイルではパディングが小さい（左右各6px or 12px）
            const extraSpace = isMobile ? 4 : 8;
            const calculatedWidth = Math.max(isMobile ? 50 : 60, (blank.word.length * charWidth) + padding + extraSpace);
            blank.element.style.width = `${calculatedWidth}px`;
            
            blank.element.addEventListener('click', () => {
                if (sentenceAnswerSubmitted) return;
                selectSentenceBlank(blank.index);
            });
        });
        
        // 最初の空所を選択
        if (sentenceBlanks.length > 0) {
            selectSentenceBlank(sentenceBlanks[0].index);
        }
    }
    
    // ナビゲーションボタンの状態を更新（進捗バーのボタンを使用）
    updateNavButtons();
    
    // 進捗バーの更新
    if (typeof updateProgressSegments === 'function') {
        updateProgressSegments();
    }
    
    // ボタンの状態をリセット
    resetSentenceButtons();
}

// 例文モード用のキーボード設定
function setupSentenceKeyboard() {
    const keyboard = document.getElementById('sentenceKeyboard');
    if (!keyboard) return;
    
    // 既存のイベントリスナーを削除するために、キーボードをクローンして置き換える
    const keyboardClone = keyboard.cloneNode(true);
    keyboard.parentNode.replaceChild(keyboardClone, keyboard);
    const newKeyboard = document.getElementById('sentenceKeyboard');
    
    // キーボードキーのイベント
    newKeyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const letter = key.dataset.key;
        
        if (letter === ' ') {
            const handleSpace = (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertSentenceLetter(' ');
            };
            key.addEventListener('touchstart', handleSpace, { passive: false });
            key.addEventListener('click', handleSpace);
        } else {
            const handleLetter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertSentenceLetter(letter);
            };
            key.addEventListener('touchstart', handleLetter, { passive: false });
            key.addEventListener('click', handleLetter);
        }
    });
    
    // Shiftキー
    const shiftKey = document.getElementById('sentenceKeyboardShift');
    if (shiftKey) {
        const handleShift = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSentenceShift();
        };
        shiftKey.addEventListener('touchstart', handleShift, { passive: false });
        shiftKey.addEventListener('click', handleShift);
    }
    
    // バックスペースキー
    const backspaceKey = document.getElementById('sentenceKeyboardBackspace');
    if (backspaceKey) {
        const handleBackspace = (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeSentenceLetter();
        };
        backspaceKey.addEventListener('touchstart', handleBackspace, { passive: false });
        backspaceKey.addEventListener('click', handleBackspace);
    }
    
    // パスボタン
    const passBtn = document.getElementById('sentenceKeyboardPass');
    if (passBtn) {
        const handlePass = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSentencePass();
        };
        passBtn.addEventListener('touchstart', handlePass, { passive: false });
        passBtn.addEventListener('click', handlePass);
    }
    
    // 解答ボタン
    const decideBtn = document.getElementById('sentenceKeyboardDecide');
    if (decideBtn) {
        const handleDecide = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSentenceDecide();
        };
        decideBtn.addEventListener('touchstart', handleDecide, { passive: false });
        decideBtn.addEventListener('click', handleDecide);
    }
    
    // ヒントボタン
    const hintBtn = document.getElementById('sentenceHintBtn');
    if (hintBtn) {
        const handleHint = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSentenceHint();
        };
        hintBtn.addEventListener('touchstart', handleHint, { passive: false });
        hintBtn.addEventListener('click', handleHint);
    }
}

// 空所を選択する
function selectSentenceBlank(blankIndex) {
    if (sentenceAnswerSubmitted || !isSentenceModeActive) return;
    
    // すべての空所の選択状態を解除
    sentenceBlanks.forEach(blank => {
        blank.element.classList.remove('selected');
    });
    
    // 指定された空所を選択
    const blank = sentenceBlanks.find(b => b.index === blankIndex);
    if (blank) {
        blank.element.classList.add('selected');
        currentSelectedBlankIndex = blankIndex;
    }
}

// 例文モードで文字を入力
function insertSentenceLetter(letter) {
    if (sentenceAnswerSubmitted || !isSentenceModeActive) return;
    
    // 選択中の空所を取得
    let currentBlank = sentenceBlanks.find(b => b.index === currentSelectedBlankIndex);
    
    // 選択中の空所がない、または入力が完了している場合は次の空所を探す
    if (!currentBlank || currentBlank.userInput.length >= currentBlank.word.length) {
        currentBlank = sentenceBlanks.find(b => !b.userInput || b.userInput.length < b.word.length);
        if (currentBlank) {
            selectSentenceBlank(currentBlank.index);
        } else {
            // すべての空所が埋まっている場合は最初の空所に戻る
            if (sentenceBlanks.length > 0) {
                currentBlank = sentenceBlanks[0];
                selectSentenceBlank(currentBlank.index);
            }
        }
    }
    
    if (currentBlank && currentBlank.userInput.length < currentBlank.word.length) {
        let letterToInsert;
        if (letter === ' ') {
            letterToInsert = ' ';
        } else {
            if (isShiftActive) {
                letterToInsert = String(letter).toUpperCase();
                toggleSentenceShift();
            } else {
                letterToInsert = String(letter).toLowerCase();
            }
        }
        
        currentBlank.userInput += letterToInsert;
        
        // 空所の表示を更新（入力済みの文字 + 残りのスペース）
        const remainingLength = currentBlank.word.length - currentBlank.userInput.length;
        currentBlank.element.textContent = currentBlank.userInput + (remainingLength > 0 ? ' '.repeat(remainingLength) : '');
        
        // 入力が完了したら次の空所を選択
        if (currentBlank.userInput.length >= currentBlank.word.length) {
            const nextBlank = sentenceBlanks.find(b => b.index > currentBlank.index && (!b.userInput || b.userInput.length < b.word.length));
            if (nextBlank) {
                selectSentenceBlank(nextBlank.index);
            }
        }
    }
}

// 例文モードで文字を削除
function removeSentenceLetter() {
    if (sentenceAnswerSubmitted || !isSentenceModeActive) return;
    
    // 選択中の空所から文字を削除
    let currentBlank = sentenceBlanks.find(b => b.index === currentSelectedBlankIndex);
    
    // 選択中の空所がない、または空の場合は最後に入力した空所を探す
    if (!currentBlank || currentBlank.userInput.length === 0) {
        for (let i = sentenceBlanks.length - 1; i >= 0; i--) {
            const blank = sentenceBlanks[i];
            if (blank.userInput.length > 0) {
                currentBlank = blank;
                selectSentenceBlank(blank.index);
                break;
            }
        }
    }
    
    if (currentBlank && currentBlank.userInput.length > 0) {
        currentBlank.userInput = currentBlank.userInput.slice(0, -1);
        const remainingLength = currentBlank.word.length - currentBlank.userInput.length;
        currentBlank.element.textContent = currentBlank.userInput + (remainingLength > 0 ? ' '.repeat(remainingLength) : '');
    }
}

// 例文モードでShiftキーをトグル
function toggleSentenceShift() {
    isShiftActive = !isShiftActive;
    const shiftKey = document.getElementById('sentenceKeyboardShift');
    if (shiftKey) {
        if (isShiftActive) {
            shiftKey.classList.add('active');
        } else {
            shiftKey.classList.remove('active');
        }
    }
}

// 例文モードでパス
function handleSentencePass() {
    if (sentenceAnswerSubmitted || !isSentenceModeActive) return;
    
    const sentence = sentenceData[currentSentenceIndex];
    wrongCount++;
    questionStatus[currentSentenceIndex] = 'wrong';
    
    // 正解を表示
    sentenceBlanks.forEach(blank => {
        blank.element.textContent = blank.word;
        blank.element.classList.add('wrong');
    });
    
    sentenceAnswerSubmitted = true;
    saveSentenceProgress(sentence.id, false);
    updateStats();
    if (typeof updateProgressSegments === 'function') {
        updateProgressSegments();
    }
    
    // 画面全体のフィードバック表示（薄い赤）
    if (elements.feedbackOverlay) {
        elements.feedbackOverlay.className = 'feedback-overlay wrong active';
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 400);
    }
    
    // 「次へ」ボタンを表示
    showSentenceNextButton();
}

// 例文モードで解答
function handleSentenceDecide() {
    if (!isSentenceModeActive) return;
    
    // 既に解答済みの場合は次へ進む
    if (sentenceAnswerSubmitted) {
        goToNextSentence();
        return;
    }
    
    const sentence = sentenceData[currentSentenceIndex];
    let isCorrect = true;
    
    // すべての空所が正しいかチェック
    sentenceBlanks.forEach(blank => {
        if (blank.userInput.toLowerCase().trim() !== blank.word.toLowerCase()) {
            isCorrect = false;
            blank.element.classList.add('wrong');
        } else {
            blank.element.classList.add('correct');
        }
        blank.element.textContent = blank.word;
    });
    
    if (isCorrect) {
        correctCount++;
        questionStatus[currentSentenceIndex] = 'correct';
    } else {
        wrongCount++;
        questionStatus[currentSentenceIndex] = 'wrong';
    }
    
    sentenceAnswerSubmitted = true;
    saveSentenceProgress(sentence.id, isCorrect);
    updateStats();
    if (typeof updateProgressSegments === 'function') {
        updateProgressSegments();
    }
    
    // 画面全体のフィードバック表示（正解は薄い青、不正解は薄い赤）
    if (elements.feedbackOverlay) {
        elements.feedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 400);
    }
    
    // 「次へ」ボタンを表示
    showSentenceNextButton();
}

// 例文モードで次の問題に進む
function goToNextSentence() {
    if (currentSentenceIndex < sentenceData.length - 1) {
        currentSentenceIndex++;
        currentIndex = currentSentenceIndex;
        displayCurrentSentence();
    } else {
        // 最後の問題の場合は完了画面を表示
        showCompletion();
    }
}

// 例文モードで「次へ」ボタンを表示
function showSentenceNextButton() {
    const decideBtn = document.getElementById('sentenceKeyboardDecide');
    const passBtn = document.getElementById('sentenceKeyboardPass');
    
    if (decideBtn) {
        decideBtn.textContent = '次へ';
    }
    
    if (passBtn) {
        passBtn.style.display = 'none';
    }
}

// 例文モードでヒントを表示/非表示
function toggleSentenceHint() {
    const hintContent = document.getElementById('sentenceHintContent');
    const hintBtn = document.getElementById('sentenceHintBtn');
    if (!hintContent || !hintBtn) return;
    
    const arrowElement = hintBtn.querySelector('.hint-arrow');
    
    if (hintContent.classList.contains('hidden')) {
        // ヒントを表示
        const sentence = sentenceData[currentSentenceIndex];
        if (!sentence) return;
        
        // データからヒントを取得
        if (sentence.hint) {
            hintContent.textContent = sentence.hint;
        } else {
            // ヒントがデータにない場合は動的に生成（フォールバック）
            let hintText = 'ヒント：\n';
            sentence.blanks.forEach((blank, index) => {
                if (blank.word && blank.word.length > 0) {
                    const firstLetter = blank.word[0];
                    const remainingLength = blank.word.length - 1;
                    hintText += `${index + 1}. ${firstLetter}${'_'.repeat(remainingLength)} (${blank.word.length}文字)\n`;
                }
            });
            hintContent.textContent = hintText.trim();
        }
        
        hintContent.classList.remove('hidden');
        // 矢印を▼に変更
        if (arrowElement) {
            arrowElement.textContent = '▼';
        }
    } else {
        // ヒントを非表示
        hintContent.classList.add('hidden');
        // 矢印を▶に変更
        if (arrowElement) {
            arrowElement.textContent = '▶';
        }
    }
}

// 例文の進捗を保存
function saveSentenceProgress(sentenceId, isCorrect) {
    if (!selectedCategory) return;
    
    const { correctSet, wrongSet } = loadCategoryWords(selectedCategory);
    
    if (isCorrect) {
        correctSet.add(sentenceId);
        wrongSet.delete(sentenceId);
    } else {
        wrongSet.add(sentenceId);
        correctSet.delete(sentenceId);
    }
    
    saveCategoryWords(selectedCategory, correctSet, wrongSet);
}

// 整序英作文モードで学習を初期化
function initReorderModeLearning(category) {
    // reorderQuestionsが定義されているか確認（念のため再確認）
    if (typeof reorderQuestions === 'undefined') {
        showAlert('エラー', '整序英作文の問題データファイルが読み込まれていません。ページを再読み込みしてください。');
        console.error('reorderQuestions is undefined in initReorderModeLearning');
        return;
    }
    if (!reorderQuestions || reorderQuestions.length === 0) {
        showAlert('エラー', '整序英作文の問題データが空です。');
        console.error('reorderQuestions is empty in initReorderModeLearning');
        return;
    }
    
    selectedCategory = category;
    reorderData = reorderQuestions;
    isReorderModeActive = true;
    isSentenceModeActive = false;
    isInputModeActive = false;
    currentReorderIndex = 0;
    reorderAnswerSubmitted = false;
    
    currentRangeStart = 0;
    currentRangeEnd = reorderData.length;
    currentIndex = 0;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    questionStatus = new Array(reorderData.length).fill(null);
    
    // 前回の回答状況を読み込んで進捗バーに反映
    if (category) {
        const { correctSet, wrongSet } = loadCategoryWords(category);
        reorderData.forEach((question, index) => {
            if (wrongSet.has(question.id)) {
                questionStatus[index] = 'wrong';
            } else if (correctSet.has(question.id)) {
                questionStatus[index] = 'correct';
            }
        });
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    // サブタイトルから【整序英作文(記号選択)対策】を削除
    const displayTitle = category.replace('【整序英作文(記号選択)対策】', '').trim();
    elements.headerSubtitle.textContent = displayTitle;
    
    document.body.classList.add('learning-mode');

    if (elements.homeBtn) {
        elements.homeBtn.classList.remove('hidden');
    }

    // 他のモードを非表示、整序英作文モードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.remove('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    updateNavButtons(); // ボタンのテキストと状態を更新
    
    displayCurrentReorderQuestion();
    // 進捗バーのセグメントを生成
    const total = currentRangeEnd - currentRangeStart;
    if (total > 0) {
        createProgressSegments(total);
    }
    updateStats();
    updateNavState('learning');
}

// 現在の整序英作文問題を表示
function displayCurrentReorderQuestion() {
    if (currentReorderIndex < 0 || currentReorderIndex >= reorderData.length) {
        return;
    }
    
    const question = reorderData[currentReorderIndex];
    const japaneseEl = document.getElementById('reorderJapanese');
    const answerAreaEl = document.getElementById('reorderAnswerArea');
    const wordsAreaEl = document.getElementById('reorderWordsArea');
    const correctAnswerEl = document.getElementById('reorderCorrectAnswer');
    
    if (japaneseEl) japaneseEl.textContent = question.japanese;
    
    // 解答エリアをクリアして空欄を生成
    if (answerAreaEl) {
        answerAreaEl.innerHTML = '';
        // 単語数分の空欄を作成（ピリオドまたは?を除く）
        const lastChar = question.correctOrder[question.correctOrder.length - 1];
        const blankCount = question.correctOrder.length - 1; // 最後の記号を除く
        for (let i = 0; i < blankCount; i++) {
            const blankBox = document.createElement('div');
            blankBox.className = 'reorder-blank-box';
            blankBox.dataset.blankIndex = i;
            blankBox.addEventListener('dragover', handleReorderBlankDragOver);
            blankBox.addEventListener('dragleave', handleReorderBlankDragLeave);
            blankBox.addEventListener('drop', handleReorderBlankDrop);
            // タッチイベントも追加
            blankBox.addEventListener('touchmove', (e) => {
                if (reorderTouchData.draggingElement) {
                    e.preventDefault();
                }
            }, { passive: false });
            answerAreaEl.appendChild(blankBox);
        }
        
        // 最後にピリオドまたは?を表示
        if (lastChar === '.' || lastChar === '?') {
            const punctuationEl = document.createElement('span');
            punctuationEl.className = 'reorder-punctuation';
            punctuationEl.textContent = lastChar;
            answerAreaEl.appendChild(punctuationEl);
        }
    }
    
    // 単語選択エリアをクリアして再生成
    if (wordsAreaEl) {
        wordsAreaEl.innerHTML = '';
        // 単語をシャッフルして表示
        const shuffledWords = [...question.words].sort(() => Math.random() - 0.5);
        shuffledWords.forEach((word, index) => {
            const wordBox = document.createElement('div');
            wordBox.className = 'reorder-word-box';
            wordBox.textContent = word;
            wordBox.draggable = true;
            wordBox.dataset.word = word;
            wordBox.dataset.originalIndex = index;
            wordBox.addEventListener('dragstart', handleReorderDragStart);
            wordBox.addEventListener('dragend', handleReorderDragEnd);
            // タッチイベントを追加
            wordBox.addEventListener('touchstart', handleReorderTouchStart, { passive: false });
            wordBox.addEventListener('touchmove', handleReorderTouchMove, { passive: false });
            wordBox.addEventListener('touchend', handleReorderTouchEnd, { passive: false });
            wordsAreaEl.appendChild(wordBox);
        });
        
        // 単語エリアにドロップイベントを追加（空欄から戻すため）
        wordsAreaEl.addEventListener('dragover', handleReorderWordsAreaDragOver);
        wordsAreaEl.addEventListener('dragleave', handleReorderWordsAreaDragLeave);
        wordsAreaEl.addEventListener('drop', handleReorderWordsAreaDrop);
        // タッチイベントも追加
        wordsAreaEl.addEventListener('touchmove', (e) => {
            if (reorderTouchData.draggingElement) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // 結果表示を非表示
    if (correctAnswerEl) {
        correctAnswerEl.classList.add('hidden');
    }
    
    // 画面背景をリセット
    if (elements.feedbackOverlay) {
        elements.feedbackOverlay.classList.remove('active', 'correct', 'wrong');
    }
    
    // 状態をリセット
    reorderSelectedWords = [];
    reorderAnswerSubmitted = false;
    
    // 進捗バーを更新
    updateProgressSegments();
    updateStats();
    updateNavButtons();
}

// ドラッグ開始
function handleReorderDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.word);
    e.target.classList.add('dragging');
}

// ドラッグ終了
function handleReorderDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 空欄内の単語のドラッグ開始
function handleReorderAnswerDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.word);
    e.dataTransfer.setData('from-blank', e.target.dataset.blankIndex);
    e.target.classList.add('dragging');
    // ドラッグ中フラグを設定（クリックイベントと区別するため）
    e.target.dataset.isDragging = 'true';
}

// 空欄内の単語のドラッグ終了
function handleReorderAnswerDragEnd(e) {
    e.target.classList.remove('dragging');
    delete e.target.dataset.isDragging;
}

// 単語エリアへのドラッグオーバー
function handleReorderWordsAreaDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const wordsArea = document.getElementById('reorderWordsArea');
    if (wordsArea) {
        wordsArea.classList.add('drag-over');
    }
}

// 単語エリアからのドラッグリーブ
function handleReorderWordsAreaDragLeave(e) {
    const wordsArea = document.getElementById('reorderWordsArea');
    if (wordsArea && !wordsArea.contains(e.relatedTarget)) {
        wordsArea.classList.remove('drag-over');
    }
}

// 単語エリアへのドロップ（空欄から戻す）
function handleReorderWordsAreaDrop(e) {
    e.preventDefault();
    const wordsArea = document.getElementById('reorderWordsArea');
    if (wordsArea) {
        wordsArea.classList.remove('drag-over');
    }
    
    const word = e.dataTransfer.getData('text/plain');
    const fromBlankIndex = e.dataTransfer.getData('from-blank');
    if (!word || fromBlankIndex === '') return; // 空欄から来たもののみ処理
    
    // 元の空欄から削除
    const fromBlankBox = document.querySelector(`.reorder-blank-box[data-blank-index="${fromBlankIndex}"]`);
    if (fromBlankBox) {
        const answerBox = fromBlankBox.querySelector('.reorder-answer-box');
        if (answerBox && answerBox.dataset.word === word) {
            answerBox.remove();
            adjustBlankBoxSize(fromBlankBox);
        }
    }
    
    // 単語ボックスを表示
    const wordBoxes = document.querySelectorAll('.reorder-word-box');
    wordBoxes.forEach(box => {
        if (box.dataset.word === word && box.classList.contains('used')) {
            box.classList.remove('used');
            box.style.display = '';
        }
    });
    
    updateReorderSelectedWords();
}

// ドラッグオーバー（空欄）
function handleReorderBlankDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

// ドラッグリーブ（空欄）
function handleReorderBlankDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

// タッチ開始（単語ボックスと空欄内の単語）
function handleReorderTouchStart(e) {
    if (!isReorderModeActive || reorderTouchData.isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    reorderTouchData.sourceElement = element;
    reorderTouchData.word = element.dataset.word;
    reorderTouchData.fromBlankIndex = element.dataset.blankIndex || null;
    reorderTouchData.isDragging = true;
    
    // 元の要素の位置とサイズを取得
    const rect = element.getBoundingClientRect();
    
    // クローンのサイズを保存（パフォーマンス最適化）
    reorderTouchData.cloneWidth = rect.width;
    reorderTouchData.cloneHeight = rect.height;
    
    // クローンを作成
    const clone = element.cloneNode(true);
    clone.className = element.className + ' touch-dragging';
    clone.style.position = 'fixed';
    clone.style.zIndex = '10000';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.9';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.transform = 'translate(' + (touch.clientX - rect.width / 2) + 'px, ' + (touch.clientY - rect.height / 2) + 'px)';
    clone.style.willChange = 'transform'; // パフォーマンス最適化
    
    document.body.appendChild(clone);
    reorderTouchData.dragClone = clone;
    
    // 元の要素を半透明に
    element.style.opacity = '0.3';
}

// タッチ開始（空欄内の単語）
function handleReorderAnswerTouchStart(e) {
    handleReorderTouchStart(e);
}

// タッチ移動
function handleReorderTouchMove(e) {
    if (!reorderTouchData.isDragging || !reorderTouchData.dragClone) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const clone = reorderTouchData.dragClone;
    
    // キャンセル済みのrequestAnimationFrameがあればキャンセル
    if (reorderTouchData.rafId !== null) {
        cancelAnimationFrame(reorderTouchData.rafId);
    }
    
    // requestAnimationFrameを使ってスムーズに更新
    reorderTouchData.rafId = requestAnimationFrame(() => {
        // 指の中心に配置（transformを使用してパフォーマンス向上）
        const x = touch.clientX - reorderTouchData.cloneWidth / 2;
        const y = touch.clientY - reorderTouchData.cloneHeight / 2;
        clone.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        
        // ドロップ先を検出（クローンの下の要素を取得）
        // クローンを一時的に非表示にして、下の要素を正確に取得
        const originalDisplay = clone.style.display;
        clone.style.display = 'none';
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.display = originalDisplay;
        
        // すべてのdrag-overを削除
        document.querySelectorAll('.reorder-blank-box, .reorder-words-area').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        if (elementBelow) {
            // 空欄を検出
            const blankBox = elementBelow.closest('.reorder-blank-box');
            if (blankBox) {
                blankBox.classList.add('drag-over');
            } else {
                // 単語エリアを検出
                const wordsArea = elementBelow.closest('.reorder-words-area');
                if (wordsArea && reorderTouchData.fromBlankIndex !== null) {
                    wordsArea.classList.add('drag-over');
                }
            }
        }
        
        reorderTouchData.rafId = null;
    });
}

// タッチ終了
function handleReorderTouchEnd(e) {
    if (!reorderTouchData.isDragging) return;
    e.preventDefault();
    
    // 進行中のrequestAnimationFrameをキャンセル
    if (reorderTouchData.rafId !== null) {
        cancelAnimationFrame(reorderTouchData.rafId);
        reorderTouchData.rafId = null;
    }
    
    const touch = e.changedTouches[0];
    
    // クローンを一時的に非表示にして、下の要素を正確に取得
    if (reorderTouchData.dragClone) {
        const originalDisplay = reorderTouchData.dragClone.style.display;
        reorderTouchData.dragClone.style.display = 'none';
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        reorderTouchData.dragClone.style.display = originalDisplay;
        
        // すべてのdrag-overを削除
        document.querySelectorAll('.reorder-blank-box, .reorder-words-area').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        let dropped = false;
        
        if (elementBelow) {
            // 空欄にドロップ
            const blankBox = elementBelow.closest('.reorder-blank-box');
            if (blankBox) {
                handleReorderBlankTouchDrop(blankBox, reorderTouchData.word, reorderTouchData.fromBlankIndex);
                dropped = true;
            } else {
                // 単語エリアにドロップ
                const wordsArea = elementBelow.closest('.reorder-words-area');
                if (wordsArea && reorderTouchData.fromBlankIndex !== null) {
                    handleReorderWordsAreaTouchDrop(wordsArea, reorderTouchData.word, reorderTouchData.fromBlankIndex);
                    dropped = true;
                }
            }
        }
    }
    
    // クリーンアップ
    if (reorderTouchData.dragClone) {
        reorderTouchData.dragClone.remove();
        reorderTouchData.dragClone = null;
    }
    
    if (reorderTouchData.sourceElement) {
        reorderTouchData.sourceElement.style.opacity = '';
        reorderTouchData.sourceElement = null;
    }
    
    // リセット
    reorderTouchData.isDragging = false;
    reorderTouchData.offsetX = 0;
    reorderTouchData.offsetY = 0;
    reorderTouchData.fromBlankIndex = null;
    reorderTouchData.word = null;
    reorderTouchData.cloneWidth = 0;
    reorderTouchData.cloneHeight = 0;
    reorderTouchData.rafId = null;
}

// タッチドロップ（空欄）
function handleReorderBlankTouchDrop(blankBox, word, fromBlankIndex) {
    if (!word) return;
    
    // 既に単語が入っている場合は、その単語を元の場所に戻す
    const existingBox = blankBox.querySelector('.reorder-answer-box');
    if (existingBox) {
        const existingWord = existingBox.dataset.word;
        existingBox.remove();
        // 元の単語ボックスを表示
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === existingWord && box.classList.contains('used')) {
                box.classList.remove('used');
                box.style.display = '';
            }
        });
        // 空欄のサイズをリセット
        adjustBlankBoxSize(blankBox);
    }
    
    // 他の空欄から移動してきた場合は、元の空欄から削除
    if (fromBlankIndex !== null && fromBlankIndex !== '') {
        const fromBlankBox = document.querySelector(`.reorder-blank-box[data-blank-index="${fromBlankIndex}"]`);
        if (fromBlankBox) {
            const movingBox = fromBlankBox.querySelector('.reorder-answer-box');
            if (movingBox && movingBox.dataset.word === word) {
                movingBox.remove();
                adjustBlankBoxSize(fromBlankBox);
            }
        }
    } else {
        // 下の単語エリアからドラッグしてきた場合
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === word && !box.classList.contains('used')) {
                box.classList.add('used');
                box.style.display = 'none';
            }
        });
    }
    
    // 空欄に単語を追加
    const answerBox = document.createElement('div');
    answerBox.className = 'reorder-answer-box';
    answerBox.textContent = word;
    answerBox.dataset.word = word;
    answerBox.dataset.blankIndex = blankBox.dataset.blankIndex;
    answerBox.draggable = true;
    
    // ドラッグイベントを設定
    answerBox.addEventListener('dragstart', handleReorderAnswerDragStart);
    answerBox.addEventListener('dragend', handleReorderAnswerDragEnd);
    // タッチイベントを追加
    answerBox.addEventListener('touchstart', handleReorderAnswerTouchStart, { passive: false });
    answerBox.addEventListener('touchmove', handleReorderTouchMove, { passive: false });
    answerBox.addEventListener('touchend', handleReorderTouchEnd, { passive: false });
    
    // クリックで削除して元の場所に戻す
    const handleAnswerBoxClick = (e) => {
        // ドラッグ中でない場合のみ削除
        if (e.target.dataset.isDragging === 'true' || reorderTouchData.draggingElement) {
            return;
        }
        e.stopPropagation();
        const wordToRemove = answerBox.dataset.word;
        answerBox.remove();
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === wordToRemove && box.classList.contains('used')) {
                box.classList.remove('used');
                box.style.display = '';
            }
        });
        updateReorderSelectedWords();
        // 空欄のサイズをリセット
        adjustBlankBoxSize(blankBox);
    };
    
    answerBox.addEventListener('click', handleAnswerBoxClick);
    
    blankBox.appendChild(answerBox);
    // 単語の長さに応じて空欄のサイズを調整
    adjustBlankBoxSize(blankBox, answerBox);
    
    // 選択された単語を更新
    updateReorderSelectedWords();
}

// タッチドロップ（単語エリア）
function handleReorderWordsAreaTouchDrop(wordsArea, word, fromBlankIndex) {
    if (!word || fromBlankIndex === null || fromBlankIndex === '') return;
    
    // 元の空欄から削除
    const fromBlankBox = document.querySelector(`.reorder-blank-box[data-blank-index="${fromBlankIndex}"]`);
    if (fromBlankBox) {
        const answerBox = fromBlankBox.querySelector('.reorder-answer-box');
        if (answerBox && answerBox.dataset.word === word) {
            answerBox.remove();
            adjustBlankBoxSize(fromBlankBox);
        }
    }
    
    // 単語ボックスを表示
    const wordBoxes = document.querySelectorAll('.reorder-word-box');
    wordBoxes.forEach(box => {
        if (box.dataset.word === word && box.classList.contains('used')) {
            box.classList.remove('used');
            box.style.display = '';
        }
    });
    
    updateReorderSelectedWords();
}

// ドロップ（空欄）
function handleReorderBlankDrop(e) {
    e.preventDefault();
    const blankBox = e.currentTarget;
    blankBox.classList.remove('drag-over');
    
    const word = e.dataTransfer.getData('text/plain');
    const fromBlankIndex = e.dataTransfer.getData('from-blank');
    if (!word) return;
    
    // 既に単語が入っている場合は、その単語を元の場所に戻す
    const existingBox = blankBox.querySelector('.reorder-answer-box');
    if (existingBox) {
        const existingWord = existingBox.dataset.word;
        existingBox.remove();
        // 元の単語ボックスを表示
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === existingWord && box.classList.contains('used')) {
                box.classList.remove('used');
                box.style.display = '';
            }
        });
        // 空欄のサイズをリセット
        adjustBlankBoxSize(blankBox);
    }
    
    // 他の空欄から移動してきた場合は、元の空欄から削除
    if (fromBlankIndex !== '') {
        const fromBlankBox = document.querySelector(`.reorder-blank-box[data-blank-index="${fromBlankIndex}"]`);
        if (fromBlankBox) {
            const movingBox = fromBlankBox.querySelector('.reorder-answer-box');
            if (movingBox && movingBox.dataset.word === word) {
                movingBox.remove();
                adjustBlankBoxSize(fromBlankBox);
            }
        }
    } else {
        // 下の単語エリアからドラッグしてきた場合
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === word && !box.classList.contains('used')) {
                box.classList.add('used');
                box.style.display = 'none';
            }
        });
    }
    
    // 空欄に単語を追加
    const answerBox = document.createElement('div');
    answerBox.className = 'reorder-answer-box';
    answerBox.textContent = word;
    answerBox.dataset.word = word;
    answerBox.dataset.blankIndex = blankBox.dataset.blankIndex;
    answerBox.draggable = true;
    
    // ドラッグイベントを設定
    answerBox.addEventListener('dragstart', handleReorderAnswerDragStart);
    answerBox.addEventListener('dragend', handleReorderAnswerDragEnd);
    // タッチイベントを追加
    answerBox.addEventListener('touchstart', handleReorderAnswerTouchStart, { passive: false });
    answerBox.addEventListener('touchmove', handleReorderTouchMove, { passive: false });
    answerBox.addEventListener('touchend', handleReorderTouchEnd, { passive: false });
    
    // クリックで削除して元の場所に戻す
    const handleAnswerBoxClick = (e) => {
        // ドラッグ中でない場合のみ削除
        if (e.target.dataset.isDragging === 'true' || reorderTouchData.draggingElement) {
            return;
        }
        e.stopPropagation();
        const wordToRemove = answerBox.dataset.word;
        answerBox.remove();
        const wordBoxes = document.querySelectorAll('.reorder-word-box');
        wordBoxes.forEach(box => {
            if (box.dataset.word === wordToRemove && box.classList.contains('used')) {
                box.classList.remove('used');
                box.style.display = '';
            }
        });
        updateReorderSelectedWords();
        // 空欄のサイズをリセット
        adjustBlankBoxSize(blankBox);
    };
    
    answerBox.addEventListener('click', handleAnswerBoxClick);
    
    blankBox.appendChild(answerBox);
    // 単語の長さに応じて空欄のサイズを調整
    adjustBlankBoxSize(blankBox, answerBox);
    
    // 選択された単語を更新
    updateReorderSelectedWords();
}

// 空欄のサイズを単語に合わせて調整
function adjustBlankBoxSize(blankBox, answerBox = null) {
    if (!blankBox) return;
    
    if (answerBox) {
        // 単語が入っている場合、単語の幅に合わせて空欄を拡張
        // 一度表示してから幅を測定
        setTimeout(() => {
            const wordWidth = answerBox.scrollWidth;
            const minWidth = 60;
            const padding = 16; // 左右のパディング合計
            const newWidth = Math.max(minWidth, wordWidth + padding);
            blankBox.style.width = newWidth + 'px';
        }, 0);
    } else {
        // 単語が入っていない場合、最小サイズに戻す
        blankBox.style.width = 'auto';
    }
}

// 選択された単語を更新
function updateReorderSelectedWords() {
    const blankBoxes = document.querySelectorAll('.reorder-blank-box');
    reorderSelectedWords = Array.from(blankBoxes).map(blankBox => {
        const answerBox = blankBox.querySelector('.reorder-answer-box');
        return answerBox ? answerBox.dataset.word : null;
    }).filter(word => word !== null);
}

// リセットボタン
function handleReorderReset() {
    const answerArea = document.getElementById('reorderAnswerArea');
    const wordBoxes = document.querySelectorAll('.reorder-word-box');
    
    // すべての空欄から単語を削除
    const blankBoxes = document.querySelectorAll('.reorder-blank-box');
    blankBoxes.forEach(blankBox => {
        const answerBox = blankBox.querySelector('.reorder-answer-box');
        if (answerBox) {
            answerBox.remove();
        }
        // 空欄のサイズをリセット
        adjustBlankBoxSize(blankBox);
    });
    
    // すべての単語ボックスを表示
    wordBoxes.forEach(box => {
        box.classList.remove('used');
        box.style.display = '';
    });
    
    reorderSelectedWords = [];
    reorderAnswerSubmitted = false;
    
    const correctAnswerEl = document.getElementById('reorderCorrectAnswer');
    if (correctAnswerEl) {
        correctAnswerEl.classList.add('hidden');
    }
}

// 解答ボタン
function handleReorderSubmit() {
    if (reorderAnswerSubmitted) {
        // 既に解答済みの場合は次の問題へ
        moveToNextReorderQuestion();
        return;
    }
    
    const question = reorderData[currentReorderIndex];
    const blankBoxes = document.querySelectorAll('.reorder-blank-box');
    const userAnswerWords = Array.from(blankBoxes).map(blankBox => {
        const answerBox = blankBox.querySelector('.reorder-answer-box');
        return answerBox ? answerBox.dataset.word.toLowerCase() : null;
    }).filter(word => word !== null);
    // correctOrderから最後のピリオドを除いて、小文字に変換
    const correctAnswerWords = question.correctOrder.slice(0, -1).map(word => word.toLowerCase());
    
    // 単語の順序を比較
    const isCorrect = userAnswerWords.length === correctAnswerWords.length &&
        userAnswerWords.every((word, index) => word === correctAnswerWords[index]);
    
    // 結果を表示
    const correctAnswerEl = document.getElementById('reorderCorrectAnswer');
    
    if (correctAnswerEl) {
        correctAnswerEl.textContent = question.correctAnswer;
        correctAnswerEl.className = 'reorder-correct-answer';
        correctAnswerEl.classList.remove('hidden');
    }
    
    // 画面背景を変更
    if (elements.feedbackOverlay) {
        elements.feedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 500);
    }
    
    // 統計を更新
    if (isCorrect) {
        correctCount++;
        questionStatus[currentReorderIndex] = 'correct';
    } else {
        wrongCount++;
        questionStatus[currentReorderIndex] = 'wrong';
    }
    
    // 進捗を保存
    saveReorderProgress(question.id, isCorrect);
    
    reorderAnswerSubmitted = true;
    updateStats();
    updateProgressSegments();
    
    // 解答ボタンのテキストを変更
    const submitBtn = document.getElementById('reorderSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = '次の問題へ';
    }
}

// 次の問題へ
function moveToNextReorderQuestion() {
    if (currentReorderIndex < reorderData.length - 1) {
        currentReorderIndex++;
        currentIndex = currentReorderIndex;
        displayCurrentReorderQuestion();
        
        const submitBtn = document.getElementById('reorderSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = '解答';
        }
    }
}

// 前の問題へ
function moveToPrevReorderQuestion() {
    if (currentReorderIndex > 0) {
        currentReorderIndex--;
        currentIndex = currentReorderIndex;
        displayCurrentReorderQuestion();
        
        const submitBtn = document.getElementById('reorderSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = '解答';
        }
    }
}

// 整序英作文の進捗を保存
function saveReorderProgress(questionId, isCorrect) {
    if (!selectedCategory) return;
    
    const { correctSet, wrongSet } = loadCategoryWords(selectedCategory);
    
    if (isCorrect) {
        correctSet.add(questionId);
        wrongSet.delete(questionId);
    } else {
        wrongSet.add(questionId);
        correctSet.delete(questionId);
    }
    
    saveCategoryWords(selectedCategory, correctSet, wrongSet);
}

// キーボードの大文字・小文字を更新
function updateKeyboardCase(keyboard, isShift) {
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const keyValue = key.dataset.key;
        if (keyValue && keyValue.length === 1 && keyValue.match(/[a-z]/)) {
            key.textContent = isShift ? keyValue.toUpperCase() : keyValue;
        }
    });
}

// アプリケーションの起動
// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOMが既に読み込まれている場合は即座に実行
    init();
}
