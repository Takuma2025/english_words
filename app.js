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
let wordResponseStartTime = 0; // 単語ごとの解答開始時刻（AI分析用）
const TIME_PER_WORD = 2; // 1単語あたりの時間（秒）
let isSentenceModeActive = false; // 厳選例文暗記モードかどうか
let sentenceData = []; // 例文データ
let currentSentenceIndex = 0; // 現在の例文のインデックス
let sentenceBlanks = []; // 空所のデータ [{index: 0, word: 'longer', userInput: ''}, ...]
let sentenceAnswerSubmitted = false; // 回答が送信済みかどうか
let currentSelectedBlankIndex = -1; // 現在選択中の空所のインデックス
let isReorderModeActive = false; // 整序英作文モードかどうか
let reorderData = []; // 整序英作文データ
let currentReorderIndex = 0;
let selectedLearningMode = 'card'; // 学習モード: 'card' (英語→日本語) または 'input' (日本語→英語) // 現在の整序英作文のインデックス
let filterLearningMode = 'output'; // フィルター画面の学習モード: 'input' または 'output'
let currentLearningMode = 'card'; // 現在学習中のモード: 'card' または 'input'
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
const EXAM_DATE_KEY = 'osakaExamDate';
const EXAM_TITLE_KEY = 'examCountdownTitle';
const EXAM_TITLE_OPTIONS = [
    '大阪府公立入試まで',
    '私立高校入試まで',
    '実力テストまで',
    '定期テストまで',
    '模擬試験まで'
];
let examCountdownTimer = null;

// AI分析（苦手単語）用の設定
const WORD_STATS_KEY = 'wordStatsV1';
const SLOW_RESPONSE_THRESHOLD_MS = 8000;
let wordStats = {};

 // 0: 曜日, 1: 月


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

// 単語の進捗保存用カテゴリーを取得（小学生で習った単語の場合はword.categoryを使用）
function getProgressCategory(word) {
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === 'AI分析 苦手単語') {
        return word.category;
    }
    return selectedCategory;
}

// 単語リスト全体の進捗を読み込む（小学生で習った単語の場合は各単語のカテゴリーから読み込む）
function loadProgressForWords(words) {
    const mode = selectedLearningMode || 'card';
    const correctSet = new Set();
    const wrongSet = new Set();
    
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 各単語のカテゴリーから進捗を読み込む
        const categoryCache = {};
        words.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
                const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                categoryCache[cat] = {
                    correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                    wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                };
            }
            if (categoryCache[cat].correct.has(word.id)) correctSet.add(word.id);
            if (categoryCache[cat].wrong.has(word.id)) wrongSet.add(word.id);
        });
    } else {
        // 通常のカテゴリー読み込み
        const savedCorrect = localStorage.getItem(`correctWords-${selectedCategory}_${mode}`);
        const savedWrong = localStorage.getItem(`wrongWords-${selectedCategory}_${mode}`);
        if (savedCorrect) {
            JSON.parse(savedCorrect).forEach(id => correctSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
        }
        if (savedWrong) {
            JSON.parse(savedWrong).forEach(id => wrongSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
        }
    }
    
    return { correctSet, wrongSet };
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

// 単語ごとの学習記録を読み込む（AI分析用）
function loadWordStats() {
    try {
        const saved = localStorage.getItem(WORD_STATS_KEY);
        if (!saved) {
            wordStats = {};
            return;
        }
        const parsed = JSON.parse(saved);
        wordStats = parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.error('Failed to load word stats:', error);
        wordStats = {};
    }
}

// 単語ごとの学習記録を保存
function saveWordStats() {
    try {
        localStorage.setItem(WORD_STATS_KEY, JSON.stringify(wordStats));
    } catch (error) {
        console.error('Failed to save word stats:', error);
    }
}

// 全単語データを取得（小学生データを含む）
function getAllWordData() {
    const mainWords = Array.isArray(wordData) ? wordData : [];
    // vocabulary-data.jsから取得（優先）
    const vocabularyWords = (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function')
        ? getAllVocabulary()
        : [];
    // 既存のelementaryWordDataとの互換性（後方互換性のため）
    const elementaryWords = (typeof elementaryWordData !== 'undefined' && Array.isArray(elementaryWordData))
        ? elementaryWordData
        : [];
    // vocabulary-data.jsのデータを優先し、既存データとマージ
    return [...mainWords, ...vocabularyWords, ...elementaryWords];
}

// IDから単語データを取得
function getWordById(wordId) {
    if (wordId === undefined || wordId === null) return null;
    const allWords = getAllWordData();
    for (let i = 0; i < allWords.length; i++) {
        if (allWords[i].id === wordId) return allWords[i];
    }
    return null;
}

// 単語への回答結果を記録（AI分析用）
function recordWordResult(word, isCorrect, { responseMs = null, isTimeout = false } = {}) {
    if (!word || typeof word.id === 'undefined') return;
    
    const now = Date.now();
    const existing = wordStats[word.id] || {};
    const normalized = {
        totalAttempts: Number(existing.totalAttempts) || 0,
        wrongCount: Number(existing.wrongCount) || 0,
        correctCount: Number(existing.correctCount) || 0,
        slowCount: Number(existing.slowCount) || 0,
        consecutiveWrongCount: Number(existing.consecutiveWrongCount) || 0,
        maxConsecutiveWrong: Number(existing.maxConsecutiveWrong) || 0,
        firstWrongAt: typeof existing.firstWrongAt === 'number' ? existing.firstWrongAt : null,
        firstCorrectAfterWrongAt: typeof existing.firstCorrectAfterWrongAt === 'number' ? existing.firstCorrectAfterWrongAt : null,
        lastCorrectAt: typeof existing.lastCorrectAt === 'number' ? existing.lastCorrectAt : null,
        lastReviewedAt: typeof existing.lastReviewedAt === 'number' ? existing.lastReviewedAt : null,
        lastResponseMs: typeof existing.lastResponseMs === 'number' ? existing.lastResponseMs : null,
        maxResponseMs: typeof existing.maxResponseMs === 'number' ? existing.maxResponseMs : 0
    };
    
    normalized.totalAttempts += 1;
    normalized.lastReviewedAt = now;
    
    if (!isCorrect) {
        normalized.wrongCount += 1;
        normalized.consecutiveWrongCount += 1;
        normalized.maxConsecutiveWrong = Math.max(normalized.maxConsecutiveWrong, normalized.consecutiveWrongCount);
        if (!normalized.firstWrongAt) {
            normalized.firstWrongAt = now;
        }
    } else {
        normalized.correctCount += 1;
        normalized.consecutiveWrongCount = 0; // 正解したらリセット
        normalized.lastCorrectAt = now;
        if (normalized.firstWrongAt && !normalized.firstCorrectAfterWrongAt) {
            normalized.firstCorrectAfterWrongAt = now;
        }
    }
    
    if (typeof responseMs === 'number' && !Number.isNaN(responseMs)) {
        normalized.lastResponseMs = responseMs;
        normalized.maxResponseMs = Math.max(normalized.maxResponseMs || 0, responseMs);
        if (responseMs >= SLOW_RESPONSE_THRESHOLD_MS) {
            normalized.slowCount += 1;
        }
    }
    
    // タイムアウトの記録は今後の拡張用（現在はカウントのみ活用）
    if (isTimeout) {
        normalized.wasTimeout = true;
    }
    
    wordStats[word.id] = normalized;
    saveWordStats();
}

// AI分析対象の単語リストを取得
function getAiAnalysisWords() {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 1週間（ミリ秒）
    const now = Date.now();
    
    const summary = {
        needsReview: 0,
        consecutiveWrong: 0,
        manyWrong: 0,
        slow: 0
    };
    
    const reasonMap = new Map();
    const wordMap = new Map();
    getAllWordData().forEach(word => {
        if (word && typeof word.id !== 'undefined') {
            wordMap.set(word.id, word);
        }
    });
    
    Object.entries(wordStats || {}).forEach(([idStr, statRaw]) => {
        const id = parseInt(idStr, 10);
        const word = wordMap.get(id);
        if (!word) return;
        
        const stat = {
            wrongCount: Number(statRaw.wrongCount) || 0,
            consecutiveWrongCount: Number(statRaw.consecutiveWrongCount) || 0,
            maxConsecutiveWrong: Number(statRaw.maxConsecutiveWrong) || 0,
            lastCorrectAt: typeof statRaw.lastCorrectAt === 'number' ? statRaw.lastCorrectAt : null,
            firstWrongAt: typeof statRaw.firstWrongAt === 'number' ? statRaw.firstWrongAt : null,
            maxResponseMs: typeof statRaw.maxResponseMs === 'number' ? statRaw.maxResponseMs : 0,
            totalAttempts: Number(statRaw.totalAttempts) || 0
        };
        
        const reasons = [];
        
        // ①間違えた単語で、正解してから1週間以上が経過した単語
        if (stat.wrongCount > 0 && stat.lastCorrectAt && (now - stat.lastCorrectAt) >= ONE_WEEK_MS) {
            summary.needsReview += 1;
            const days = Math.floor((now - stat.lastCorrectAt) / (24 * 60 * 60 * 1000));
            reasons.push(`${days}日前に正解`);
        }
        
        // ②2回連続間違えた単語（現在または過去に）
        if (stat.consecutiveWrongCount >= 2 || stat.maxConsecutiveWrong >= 2) {
            summary.consecutiveWrong += 1;
            if (stat.consecutiveWrongCount >= 2) {
                reasons.push(`${stat.consecutiveWrongCount}回連続間違え中`);
            } else {
                reasons.push('2回連続間違えあり');
            }
        }
        
        // ③3回以上間違えた単語
        if (stat.wrongCount >= 3) {
            summary.manyWrong += 1;
            reasons.push(`間違え ${stat.wrongCount}回`);
        }
        
        // ④解答時間に8秒以上かかった単語
        if (stat.maxResponseMs >= SLOW_RESPONSE_THRESHOLD_MS) {
            summary.slow += 1;
            const seconds = (stat.maxResponseMs / 1000).toFixed(1);
            reasons.push(`解答 ${seconds}秒`);
        }
        
        if (reasons.length > 0) {
            reasonMap.set(id, reasons);
        }
    });
    
    const words = Array.from(reasonMap.keys())
        .map(id => wordMap.get(id))
        .filter(Boolean)
        .sort((a, b) => {
            const statA = wordStats[a.id] || {};
            const statB = wordStats[b.id] || {};
            // 優先順位: 連続間違え > 間違え回数 > 解答時間
            const consecDiff = (statB.consecutiveWrongCount || 0) - (statA.consecutiveWrongCount || 0);
            if (consecDiff !== 0) return consecDiff;
            const wrongDiff = (statB.wrongCount || 0) - (statA.wrongCount || 0);
            if (wrongDiff !== 0) return wrongDiff;
            const slowDiff = (statB.maxResponseMs || 0) - (statA.maxResponseMs || 0);
            if (slowDiff !== 0) return slowDiff;
            return (statB.totalAttempts || 0) - (statA.totalAttempts || 0);
        });
    
    return { words, summary, reasonMap };
}

// AI分析メニューを開く
function openAiAnalysisMenu() {
    const { words } = getAiAnalysisWords();
    
    if (!words.length) {
        showAlert('通知', 'AI分析の対象となる単語がまだありません。通常の学習を進めてください。');
        return;
    }
    
    // 学習フィルター画面を表示
    showWordFilterView('AI分析 苦手単語', words, 'AI分析 苦手単語');
}

// 大阪府のすべての英単語で学習を開始
function startAllWordsLearning() {
    const allWords = getAllWordData();
    
    if (!allWords || allWords.length === 0) {
        showAlert('エラー', '単語データが見つかりません。');
        return;
    }
    
    // 学習フィルター画面を表示
    showWordFilterView('大阪府のすべての英単語', allWords, '大阪府のすべての英単語');
}

// 入試日関連 ------------------------------
function getDefaultExamDateStr() {
    const today = new Date();
    // 3月10日をデフォルト（今年の3月10日を過ぎていれば翌年）
    const baseMonth = 2; // 0-indexed (March)
    const baseDay = 10;
    const year = (today.getMonth() > baseMonth || (today.getMonth() === baseMonth && today.getDate() > baseDay))
        ? today.getFullYear() + 1
        : today.getFullYear();
    const monthStr = String(baseMonth + 1).padStart(2, '0');
    const dayStr = String(baseDay).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
}

function loadExamDate() {
    const saved = localStorage.getItem(EXAM_DATE_KEY);
    if (saved) return saved;
    const def = getDefaultExamDateStr();
    localStorage.setItem(EXAM_DATE_KEY, def);
    return def;
}

function saveExamDate(dateStr) {
    localStorage.setItem(EXAM_DATE_KEY, dateStr);
}

function loadExamTitle() {
    const saved = localStorage.getItem(EXAM_TITLE_KEY);
    if (saved && EXAM_TITLE_OPTIONS.includes(saved)) {
        return saved;
    }
    const def = EXAM_TITLE_OPTIONS[0];
    localStorage.setItem(EXAM_TITLE_KEY, def);
    return def;
}

function saveExamTitle(titleStr) {
    if (EXAM_TITLE_OPTIONS.includes(titleStr)) {
        localStorage.setItem(EXAM_TITLE_KEY, titleStr);
    }
}

function calcRemainingDays(dateStr) {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
}

function updateExamCountdownDisplay() {
    const dateInput = document.getElementById('examDateInput');
    if (!dateInput) return;
    const dateStr = dateInput.value || loadExamDate();
    const remaining = calcRemainingDays(dateStr);
    if (remaining === null) return;
    
    const clamped = Math.min(remaining, 999);
    const padded = String(clamped).padStart(3, '0');
    const hundredsEl = document.getElementById('examDaysHundreds');
    const tensEl = document.getElementById('examDaysTens');
    const onesEl = document.getElementById('examDaysOnes');
    const textEl = document.getElementById('examDaysText');
    
    if (hundredsEl) hundredsEl.textContent = padded[0];
    if (tensEl) tensEl.textContent = padded[1];
    if (onesEl) onesEl.textContent = padded[2];
    if (textEl) textEl.textContent = remaining.toString();
}

function initExamCountdown() {
    const dateInput = document.getElementById('examDateInput');
    const titleSelect = document.getElementById('examTitleSelect');
    const saved = loadExamDate();
    if (dateInput) {
        dateInput.value = saved;
    }
    if (titleSelect) {
        const savedTitle = loadExamTitle();
        titleSelect.value = savedTitle;
        titleSelect.addEventListener('change', () => {
            saveExamTitle(titleSelect.value);
        });
    }
    updateExamCountdownDisplay();
    
    if (examCountdownTimer) {
        clearInterval(examCountdownTimer);
    }
    // 1時間ごとに残日数を更新
    examCountdownTimer = setInterval(updateExamCountdownDisplay, 60 * 60 * 1000);
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
        'LEVEL1 超重要単語400': 'Group1 超頻出600',
        'LEVEL2 重要単語300': 'Group2 頻出200',
        'LEVEL3 差がつく単語200': 'Group3 ハイレベル100',
        'LEVEL4 私立高校入試レベル': 'Group3 ハイレベル100',
        'LEVEL5 難関私立高校入試レベル': 'Group3 ハイレベル100'
    };
    
    const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'LEVEL1 超重要単語400', 'LEVEL2 重要単語300', 'LEVEL3 差がつく単語200', 'LEVEL4 私立高校入試レベル', 'LEVEL5 難関私立高校入試レベル', '大阪B問題対策 厳選例文暗記60【和文英訳対策】', '条件英作文特訓コース', '大阪C問題対策英単語タイムアタック', 'PartCディクテーション', '大阪府のすべての英単語'];
    
    categories.forEach(category => {
        let categoryWords;
        if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
            // vocabulary-data.jsから取得（優先）
            if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                categoryWords = getElementaryVocabulary();
            } else if (typeof elementaryWordData !== 'undefined') {
                // 既存のelementaryWordDataとの互換性
                categoryWords = elementaryWordData;
            } else {
                categoryWords = [];
            }
            
            // 各単語のカテゴリー（機能語の場合は「冠詞」「代名詞」など）から進捗を読み込む
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            
            // 全モードの進捗を合算
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            
            modes.forEach(mode => {
                categoryWords.forEach(word => {
                    // 各単語のカテゴリー名を使用（機能語の場合は「冠詞」「代名詞」など）
                    const wordCategory = word.category || 'Group1 超頻出600';
                    const savedCorrectWords = localStorage.getItem(`correctWords-${wordCategory}_${mode}`);
                    const savedWrongWords = localStorage.getItem(`wrongWords-${wordCategory}_${mode}`);
                    
                    if (savedCorrectWords) {
                        const parsed = JSON.parse(savedCorrectWords);
                        parsed.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!allWrongSet.has(numId)) {
                                allCorrectSet.add(numId);
                            }
                        });
                    }
                    
                    if (savedWrongWords) {
                        const parsed = JSON.parse(savedWrongWords);
                        parsed.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            allWrongSet.add(numId);
                            if (allCorrectSet.has(numId)) {
                                allCorrectSet.delete(numId);
                            }
                        });
                    }
                });
            });
            
            categoryWords.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCountInCategory++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCountInCategory++;
                }
            });
            
            const total = categoryWords.length;
            const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
            const completedCount = correctCountInCategory + wrongCountInCategory;
            const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
            
            const correctBar = document.getElementById(`progress-correct-${category}`);
            const wrongBar = document.getElementById(`progress-wrong-${category}`);
            const text = document.getElementById(`progress-text-${category}`);
            const barContainer = correctBar ? correctBar.parentElement : null;
            
            if (correctBar) {
                correctBar.style.width = `${correctPercent}%`;
            }
            if (wrongBar) {
                wrongBar.style.width = `${wrongPercent}%`;
            }
            if (barContainer) {
                if (isComplete) {
                    barContainer.classList.add('category-progress-complete');
                } else {
                    barContainer.classList.remove('category-progress-complete');
                }
            }
            if (text) {
                text.textContent = `${completedCount}/${total}語`;
            }
            
            return; // 処理完了
        } else if (category === '大阪府のすべての英単語') {
            // 全単語データを使用
            categoryWords = getAllWordData();
            
            // 全単語の進捗を計算（各単語の元のカテゴリーの進捗を確認）
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            
            // 全モードの進捗を合算
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            
            modes.forEach(mode => {
                categoryWords.forEach(word => {
                    const wordCategory = word.category || 'Group1 超頻出600';
                    const savedCorrectWords = localStorage.getItem(`correctWords-${wordCategory}_${mode}`);
                    const savedWrongWords = localStorage.getItem(`wrongWords-${wordCategory}_${mode}`);
                    
                    if (savedCorrectWords) {
                        const parsed = JSON.parse(savedCorrectWords);
                        parsed.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!allWrongSet.has(numId)) {
                                allCorrectSet.add(numId);
                            }
                        });
                    }
                    
                    if (savedWrongWords) {
                        const parsed = JSON.parse(savedWrongWords);
                        parsed.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            allWrongSet.add(numId);
                            if (allCorrectSet.has(numId)) {
                                allCorrectSet.delete(numId);
                            }
                        });
                    }
                });
            });
            
            categoryWords.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCountInCategory++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCountInCategory++;
                }
            });
            
            const total = categoryWords.length;
            const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
            const completedCount = correctCountInCategory + wrongCountInCategory;
            const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
            
            const correctBar = document.getElementById(`progress-correct-${category}`);
            const wrongBar = document.getElementById(`progress-wrong-${category}`);
            const text = document.getElementById(`progress-text-${category}`);
            const percentElement = document.getElementById(`progress-percent-${category}`);
            const barContainer = correctBar ? correctBar.parentElement : null;
            
            if (correctBar) {
                correctBar.style.width = `${correctPercent}%`;
            }
            if (wrongBar) {
                wrongBar.style.width = `${wrongPercent}%`;
            }
            if (barContainer) {
                if (isComplete) {
                    barContainer.classList.add('category-progress-complete');
                } else {
                    barContainer.classList.remove('category-progress-complete');
                }
            }
            if (text) {
                text.textContent = `${completedCount}/${total}語`;
            }
            // 「すべての英単語」の場合は%表示
            if (percentElement) {
                const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
                percentElement.textContent = percent;
            }
            
            return; // 処理完了
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
                
                // 全部青（間違い0、正解数=総数）のときだけCOMPLETE!!
                const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
                
                // 進捗バーとテキストを更新
                const correctBar = document.getElementById(`progress-correct-${category}`);
                const wrongBar = document.getElementById(`progress-wrong-${category}`);
                const text = document.getElementById(`progress-text-${category}`);
                const barContainer = correctBar ? correctBar.parentElement : null;
                
                if (correctBar) {
                    correctBar.style.width = `${correctPercent}%`;
                }
                if (wrongBar) {
                    wrongBar.style.width = `${wrongPercent}%`;
                }
                if (barContainer) {
                    if (isComplete) {
                        barContainer.classList.add('category-progress-complete');
                    } else {
                        barContainer.classList.remove('category-progress-complete');
                    }
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

        // 全部青（間違い0、正解数=総数）のときだけCOMPLETE!!
        const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;

        // 進捗バーとテキストを更新
        const correctBar = document.getElementById(`progress-correct-${category}`);
        const wrongBar = document.getElementById(`progress-wrong-${category}`);
        const text = document.getElementById(`progress-text-${category}`);
        const barContainer = correctBar ? correctBar.parentElement : null;
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.width = `${wrongPercent}%`;
        }
        if (barContainer) {
            if (isComplete) {
                barContainer.classList.add('category-progress-complete');
            } else {
                barContainer.classList.remove('category-progress-complete');
            }
        }
        if (text) {
            // 学習済み数（正解+間違い）/ 総数を表示
            text.textContent = `${completedCount}/${total}語`;
        }
    });
    
    // AI分析の苦手単語数を更新
    try {
        const { words } = getAiAnalysisWords();
        const aiWordCount = words.length;
        
        // サイドバーのAI分析メニュー項目に表示
        const sidebarAiWordCount = document.getElementById('sidebarAiWordCount');
        if (sidebarAiWordCount) {
            sidebarAiWordCount.textContent = aiWordCount;
        }
        
        // カテゴリーカードのAI分析カードに表示
        const cardAiWordCount = document.getElementById('cardAiWordCount');
        const aiWordNumber = document.querySelector('.ai-word-number');
        const aiAnalyzing = document.getElementById('aiAnalyzing');
        if (cardAiWordCount) {
            cardAiWordCount.textContent = aiWordCount;
        }
        // 0語のときは「分析中」を表示
        if (aiWordNumber && aiAnalyzing) {
            if (aiWordCount === 0) {
                aiWordNumber.style.display = 'none';
                aiAnalyzing.style.display = 'flex';
            } else {
                aiWordNumber.style.display = 'inline';
                aiAnalyzing.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('AI分析単語数の更新エラー:', error);
        // エラーが発生した場合は0を表示
        const sidebarAiWordCount = document.getElementById('sidebarAiWordCount');
        const cardAiWordCount = document.getElementById('cardAiWordCount');
        if (sidebarAiWordCount) sidebarAiWordCount.textContent = '0';
        if (cardAiWordCount) cardAiWordCount.textContent = '0';
    }
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
    unitName: document.getElementById('unitName'),
    unitInterruptBtn: document.getElementById('unitInterruptBtn'),
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
        
        // 表示用の綴りとは別に、発音用テキストを調整
        let speakText = word;
        // 単独の a は「エイ」ではなく短母音「ア」に近づける
        if (word === 'a' || word === 'A') {
            // 英語音声で /ə/ に近づけるために "uh" を使用
            speakText = 'uh';
        }
        // Ms. は「エムズ」ではなく「ミズ」と読ませたい
        if (word === 'Ms.' || word === 'Ms') {
            speakText = 'miz';
        }
        
        // 音声合成の設定
        const utterance = new SpeechSynthesisUtterance(speakText);
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
        loadWordStats();
        initExamCountdown();
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
    
    // ホーム画面に追加されていない場合のみオーバレイを表示
    checkAndShowInstallPrompt();
}

// ヘッダーボタンの表示/非表示を制御
// テーマカラーを更新（即座に変更、フェードなし）
function updateThemeColor(isLearningMode) {
    const color = isLearningMode ? '#ffffff' : '#0055ca';
    
    // 同期的に即座に更新（requestAnimationFrameを使わない）
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const statusBarStyleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    if (themeColorMeta) {
        // 即座に色を変更（setAttributeで直接更新）
        themeColorMeta.setAttribute('content', color);
        
        // さらに確実にするため、メタタグを削除して再作成
        const parent = themeColorMeta.parentNode;
        themeColorMeta.remove();
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = color;
        parent.insertBefore(newMeta, parent.firstChild);
    }
    
    // iOS用のステータスバースタイルも更新
    if (statusBarStyleMeta) {
        // 薄いグレーの場合は黒テキスト、青の場合は白テキスト
        statusBarStyleMeta.setAttribute('content', isLearningMode ? 'default' : 'black-translucent');
    }
}

// フィードバックオーバーレイの位置を更新（タイトルコンテナのボーダーの下から開始）
function updateFeedbackOverlayPosition() {
    if (!document.body.classList.contains('learning-mode')) return;
    
    const unitHeaderContainer = document.querySelector('.unit-header-container');
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    
    if (unitHeaderContainer && feedbackOverlay) {
        const rect = unitHeaderContainer.getBoundingClientRect();
        // ボーダーの下の位置を取得（rect.bottomはボーダーを含む）
        const topPosition = rect.bottom;
        
        feedbackOverlay.style.top = `${topPosition}px`;
        feedbackOverlay.style.height = `calc(100vh - ${topPosition}px)`;
    }
}

// mode: 'home' = ホーム画面（ハンバーガーメニュー表示）、'back' = 戻るボタン表示、'learning' = 両方非表示（中断ボタンは別途表示）
function updateHeaderButtons(mode) {
    const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
    const headerBackBtn = document.getElementById('headerBackBtn');
    const homeBtn = document.getElementById('homeBtn');
    
    if (hamburgerMenuBtn) {
        if (mode === 'home') {
            hamburgerMenuBtn.classList.remove('hidden');
        } else {
            hamburgerMenuBtn.classList.add('hidden');
        }
    }
    
    if (headerBackBtn) {
        if (mode === 'back') {
            headerBackBtn.classList.remove('hidden');
        } else {
            headerBackBtn.classList.add('hidden');
        }
    }
    
    // 中断ボタンは常に非表示（上部コンテナの中断ボタンを使用）
    if (homeBtn) {
        homeBtn.classList.add('hidden');
    }
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
    updateThemeColor(false); // ホーム画面では青に
    
    // ハンバーガーメニューを表示、戻るボタンを非表示
    updateHeaderButtons('home');
    updateExamCountdownDisplay();
    
    // 文法モードのビューを非表示
    const grammarTOCView = document.getElementById('grammarTableOfContentsView');
    if (grammarTOCView) {
        grammarTOCView.classList.add('hidden');
    }
    const grammarChapterView = document.getElementById('grammarChapterView');
    if (grammarChapterView) {
        grammarChapterView.classList.add('hidden');
    }
    
    // 文法モードのキーボードを非表示
    const grammarKeyboard = document.getElementById('grammarExerciseKeyboard');
    if (grammarKeyboard) {
        grammarKeyboard.classList.add('hidden');
    }
    
    // ハンバーガーメニューボタンは常に表示（変更不要）
    
    document.body.classList.remove('learning-mode');
    updateThemeColor(false);
    
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
    updateCategoryStars();
    
    updateCategoryStars(); // 星の表示を更新
    
}

// カテゴリーを選択してコース選択画面を表示
function startCategory(category) {
    // デバッグ用ログ
    console.log('startCategory called with category:', category);
    selectedCategory = category;
    // モード用のボディクラスをいったんリセット
    document.body.classList.remove('sentence-mode-active', 'reorder-mode-active');
    
    // コース名からデータカテゴリー名へのマッピング
    const categoryMapping = {
        'LEVEL1 超重要単語400': 'Group1 超頻出600',
        'LEVEL2 重要単語300': 'Group2 頻出200',
        'LEVEL3 差がつく単語200': 'Group3 ハイレベル100',
        'LEVEL4 私立高校入試レベル': 'Group3 ハイレベル100',
        'LEVEL5 難関私立高校入試レベル': 'Group3 ハイレベル100'
    };
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、elementaryWordDataを使用
    let categoryWords;
    if (category === '基本語彙500') {
        // 基本語彙500コースは削除されました
        showAlert('エラー', 'このコースは利用できません。');
        return;
    } else if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        // vocabulary-data.jsから取得（優先）
        console.log('Loading elementary vocabulary...');
        console.log('getElementaryVocabulary exists?', typeof getElementaryVocabulary !== 'undefined');
        if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
            categoryWords = getElementaryVocabulary();
            console.log('getElementaryVocabulary returned:', categoryWords ? categoryWords.length : 'null/undefined', 'words');
        } else if (typeof elementaryWordData !== 'undefined') {
            // 既存のelementaryWordDataとの互換性
            categoryWords = elementaryWordData;
            console.log('Using elementaryWordData:', categoryWords ? categoryWords.length : 'null/undefined', 'words');
        } else {
            console.error('No elementary vocabulary data available');
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
    } else if (category === '英文法中学３年間の総復習') {
        // 英文法中学３年間の総復習：目次ページを表示
        showGrammarTableOfContents();
        return;
    } else {
        // マッピングがある場合はそれを使用、なければそのまま使用
        const dataCategory = categoryMapping[category] || category;
        categoryWords = wordData.filter(word => word.category === dataCategory);
    }

    console.log('Final categoryWords check:', categoryWords ? categoryWords.length : 'null/undefined');
    if (!categoryWords || categoryWords.length === 0) {
        console.error('categoryWords is empty or undefined');
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    console.log('Hiding category selection and showing course selection...');
    // カテゴリー選択画面を非表示
    elements.categorySelection.classList.add('hidden');
    
    // コース選択画面を表示
    console.log('Calling showCourseSelection with', categoryWords.length, 'words');
    showCourseSelection(category, categoryWords);
    console.log('showCourseSelection completed');
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
        if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
            // 各単語のカテゴリーから進捗を読み込む
            const mode = selectedLearningMode || 'card';
            const categoryCache = {};
            words.forEach((word, index) => {
                const cat = word.category;
                if (!categoryCache[cat]) {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    categoryCache[cat] = {
                        correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                        wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                    };
                }
                if (categoryCache[cat].wrong.has(word.id)) {
                    questionStatus[index] = 'wrong';
                } else if (categoryCache[cat].correct.has(word.id)) {
                    questionStatus[index] = 'correct';
                }
            });
        } else {
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
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    if (elements.unitName) {
        // 入試得点力アップコースの場合はカテゴリー名を直接使用
        const scoreUpCategories = [
            '英文法中学３年間の総復習',
            '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
            '条件英作文特訓コース',
            '大阪C問題対策英単語タイムアタック',
            '大阪C問題対策 英作写経ドリル',
            '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】'
        ];
        let displayTitle;
        if (scoreUpCategories.includes(category)) {
            // 入試得点力アップコースの場合はカテゴリー名をそのまま使用
            displayTitle = category;
        } else {
            // その他の場合はコース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
            displayTitle = currentFilterCourseTitle || category;
        }
        elements.unitName.textContent = displayTitle;
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);

    // ハンバーガーメニューと戻るボタンを非表示、中断ボタンを表示
    updateHeaderButtons('learning');
    
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
    console.log('showCourseSelection called with category:', category, 'words:', categoryWords ? categoryWords.length : 'null');
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    console.log('courseSelection element:', courseSelection);
    console.log('courseList element:', courseList);
    console.log('courseTitle element:', courseTitle);
    
    // カテゴリー名を表示用に調整
    let displayCategory = category;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        displayCategory = 'カテゴリー別に覚える単語';
    }
    courseTitle.textContent = `${displayCategory} - コースを選んでください`;
    courseList.innerHTML = '';
    console.log('Course title set and list cleared');
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、固定のサブコースを表示
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        console.log('Detected elementary category, creating accordion sections...');
        // 小学生で習った単語グループ（身近なもの→基礎概念→社会・環境→グローバルの順）
        const elementaryCourses = [
            '家族・家に関する単語',
            '数字に関する単語',
            '日用品・楽器に関する単語',
            '体に関する単語',
            '色に関する単語',
            '食べ物・飲み物に関する単語',
            '町の施設に関する単語',
            '乗り物に関する単語',
            '職業に関する単語',
            'スポーツに関する単語',
            '曜日・月・季節に関する単語',
            '動物に関する単語',
            '自然・天気に関する単語',
            '学校に関する単語',
            '国名や地域に関する単語'
        ];

        // 機能語グループ
        const functionWordCourses = [
            '冠詞',
            '代名詞',
            '不定代名詞',
            '副詞（否定・程度・焦点）',
            '疑問詞',
            '限定詞（数量）',
            '前置詞',
            '助動詞・助動詞的表現',
            '接続詞',
            '関係代名詞',
            '間投詞'
        ];

        // 各機能語カテゴリーの説明
        const functionWordDescriptions = {
            '冠詞': 'aやtheなど名詞の前に置く冠詞を覚えましょう。',
            '代名詞': 'Iやyouなど名詞の代わりに使う代名詞を覚えましょう。',
            '不定代名詞': 'somethingやanyoneなど不特定の人や物を表す不定代名詞を覚えましょう。',
            '疑問詞': 'whatやwhereなど疑問文を作る疑問詞を覚えましょう。',
            '限定詞（数量）': 'manyやsomeなど数量を表す限定詞を覚えましょう。',
            '前置詞': 'inやonなど名詞の前に置いて位置や関係を表す前置詞を覚えましょう。',
            '助動詞・助動詞的表現': 'canやwillなど動詞の前に置いて意味を加える助動詞とhave toなどの助動詞的表現を覚えましょう。',
            '接続詞': '文や語句をつなぐ、andやbutなどの等位接続詞やwhenやifなどの従属接続詞を覚えましょう。',
            '関係代名詞': 'whichやthatなど名詞を修飾する関係代名詞を覚えましょう。',
            '副詞（否定・程度・焦点）': 'notやveryなど否定や程度を表す副詞を覚えましょう。',
            '間投詞': 'hiやyesなどあいさつや返事を表す間投詞を覚えましょう。'
        };

        // 各サブカテゴリーの進捗をキャッシュ（小学生で習った単語の場合は各単語のカテゴリーで保存されている）
        const progressCache = {};
        const mode = selectedLearningMode || 'card';

        // 共通でコースカードを追加するヘルパー
        function addCourseGroup(groupTitle, courses) {
            console.log('addCourseGroup called with groupTitle:', groupTitle, 'courses:', courses.length);
            const section = document.createElement('div');
            section.className = 'course-subsection';

            // グループ別にクラスを付与（スタイル用）
            if (groupTitle === '小学生で習った単語') {
                section.classList.add('course-subsection-elementary');
            } else if (groupTitle === '英文でよく登場する機能語') {
                section.classList.add('course-subsection-function');
            }

            const headerBtn = document.createElement('button');
            headerBtn.type = 'button';
            headerBtn.className = 'course-subsection-header';
            headerBtn.setAttribute('aria-expanded', 'false');
            headerBtn.textContent = groupTitle;

            const arrow = document.createElement('span');
            arrow.className = 'course-subsection-arrow';
            headerBtn.appendChild(arrow);

            const body = document.createElement('div');
            body.className = 'course-subsection-body hidden';

            // 「小学生で習った単語」の場合のみ、説明テキスト（注釈）を先頭に表示
            if (groupTitle === '小学生で習った単語') {
                const note = document.createElement('p');
                note.className = 'course-group-note';
                note.textContent = '小学生で習った単語のうち、基本的な名詞のみをまとめました。カテゴリー別に覚えましょう。';
                body.appendChild(note);
            }

            // 「英文でよく登場する機能語」の場合のみ、説明テキスト（注釈）を先頭に表示
            if (groupTitle === '英文でよく登場する機能語') {
                const note = document.createElement('p');
                note.className = 'course-group-note';
                note.textContent = '機能語とは、具体的な意味や内容を表す単語ではないが、文の中の単語同士の関係性を示し、文法構造を支えるために、英文中に何度も登場する重要な単語のことです。カテゴリー別に覚えましょう。';
                body.appendChild(note);
            }

            headerBtn.addEventListener('click', () => {
                const isOpen = body.classList.toggle('hidden') === false;
                section.classList.toggle('open', isOpen);
                headerBtn.setAttribute('aria-expanded', String(isOpen));
            });

            section.appendChild(headerBtn);

            // サブコース番号（1〜15）
            const circledNumbers = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];

            courses.forEach((courseName, index) => {
                // 各コースに対応する単語を取得（vocabulary-data.jsから優先的に取得）
                let courseWords = [];
                if (typeof getVocabularyByCategory !== 'undefined' && typeof getVocabularyByCategory === 'function') {
                    courseWords = getVocabularyByCategory(courseName);
                } else {
                    // 既存のcategoryWordsからフィルタリング（後方互換性）
                    courseWords = categoryWords.filter(word => word.category === courseName);
                }

                // 進捗を計算（サブコースごと）- 各単語のカテゴリー（courseName）から読み込む
                let correctCountInCourse = 0;
                let wrongCountInCourse = 0;

                // このコースの進捗をキャッシュから取得、なければ読み込む
                if (!progressCache[courseName]) {
                    const savedCorrect = localStorage.getItem(`correctWords-${courseName}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${courseName}_${mode}`);
                    progressCache[courseName] = {
                        correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                        wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                    };
                }
                const courseProgress = progressCache[courseName];

                courseWords.forEach(word => {
                    const isCorrect = courseProgress.correct.has(word.id);
                    const isWrong = courseProgress.wrong.has(word.id);

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

                // 機能語グループの場合のみ説明を追加
                const description = groupTitle === '英文でよく登場する機能語' && functionWordDescriptions[courseName] 
                    ? functionWordDescriptions[courseName] 
                    : '';

                const courseCard = createCourseCard(
                    courseName,
                    description,
                    correctPercent,
                    wrongPercent,
                    completedCount,
                    total,
                    () => {
                        // コースを選択したら、そのコースの単語で学習方法選択モーダルを表示
                        const wrongWordsInCourse = courseWords.filter(word => courseProgress.wrong.has(word.id));
                        const savedIndex = loadProgress(category);
                        const hasProgress = savedIndex > 0;

                        showInputModeMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, courseName);
                    },
                    badgeLabel,
                    numberMark
                );
                body.appendChild(courseCard);
            });

            section.appendChild(body);
            courseList.appendChild(section);
        }

        console.log('About to add course groups...');
        console.log('elementaryCourses:', elementaryCourses);
        console.log('functionWordCourses:', functionWordCourses);
        addCourseGroup('小学生で習った単語', elementaryCourses);
        addCourseGroup('英文でよく登場する機能語', functionWordCourses);
        console.log('Course groups added to courseList');
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
            
            const courseTitle = `No.${start + 1} - No.${end}`;
            const courseCard = createCourseCard(
                courseTitle,
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
                    
                    showMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, start, end, courseTitle);
                }
            );
            courseList.appendChild(courseCard);
        }
    }
    
    console.log('Making courseSelection visible...');
    courseSelection.classList.remove('hidden');
    console.log('courseSelection classes:', courseSelection.className);
    console.log('courseList children count:', courseList.children.length);
    
    // ハンバーガーメニューを非表示、戻るボタンを表示
    updateHeaderButtons('back');
    console.log('showCourseSelection complete');
    
    // 「超よくでる」の場合のみ画像を表示
    const courseSelectionImage = document.getElementById('courseSelectionImage');
    if (courseSelectionImage) {
        if (category === 'LEVEL1 超重要単語400') {
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

    // 全部青（間違い0、正解数=総数）のときだけCOMPLETE!!
    const isComplete = total > 0 && wrongPercent === 0 && correctPercent === 100;
    const progressBarClass = isComplete ? 'category-progress-bar category-progress-complete' : 'category-progress-bar';
    const progressText = `${completedCount}/${total}語`;

    const descriptionHtml = description ? `<div class="category-meta">${description}</div>` : '';
    
    card.innerHTML = `
        <div class="category-info">
            <div class="category-header">
                <div class="category-name">${badgeHtml}${title}</div>
            </div>
            ${descriptionHtml}
            <div class="category-progress">
                <div class="${progressBarClass}">
                    <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                    <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                </div>
                <div class="category-progress-text">${progressText}</div>
            </div>
        </div>
        <div class="category-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
    `;
    
    return card;
    }

// 学習フィルター画面を表示
let currentFilterWords = [];
let currentFilterCategory = '';
let currentFilterCourseTitle = '';

function showWordFilterView(category, categoryWords, courseTitle) {
    currentFilterCategory = category;
    currentFilterWords = categoryWords;
    currentFilterCourseTitle = courseTitle || category;
    
    // フィルター画面をボトムシートとして表示
    const wordFilterView = document.getElementById('wordFilterView');
    const filterOverlay = document.getElementById('filterOverlay');
    if (wordFilterView) {
        // 初期状態を設定
        wordFilterView.classList.remove('hidden');
        wordFilterView.style.transform = 'translateX(-50%) translateY(100%)';
        wordFilterView.style.transition = 'none';
        
        if (filterOverlay) {
            filterOverlay.classList.remove('hidden');
        }
        
        // リフローを強制してから、なめらかにアニメーション開始
        wordFilterView.offsetHeight;
        
        requestAnimationFrame(() => {
            wordFilterView.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
            wordFilterView.style.transform = 'translateX(-50%) translateY(0)';
            wordFilterView.classList.add('show');
            if (filterOverlay) {
                filterOverlay.classList.add('show');
            }
        });
        
        document.body.style.overflow = 'hidden';
    }
    
    // 初回学習かどうかを判定（そのカテゴリーの単語に対してブックマーク、赤、青がすべてない場合）
    // 小学生で習った単語の場合は各単語のカテゴリーから進捗を読み込む
    let correctSet, wrongSet;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        correctSet = new Set();
        wrongSet = new Set();
        const mode = selectedLearningMode || 'card';
        const categoryCache = {};
        categoryWords.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
                const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                categoryCache[cat] = {
                    correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                    wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                };
            }
            if (categoryCache[cat].correct.has(word.id)) correctSet.add(word.id);
            if (categoryCache[cat].wrong.has(word.id)) wrongSet.add(word.id);
        });
    } else {
        const loaded = loadCategoryWords(category);
        correctSet = loaded.correctSet;
        wrongSet = loaded.wrongSet;
    }
    const savedBookmarks = localStorage.getItem('reviewWords');
    const bookmarks = savedBookmarks ? new Set(JSON.parse(savedBookmarks).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();
    
    // そのカテゴリーの単語でブックマーク、正解、間違い、未学習をカウント
    const bookmarkCount = categoryWords.filter(word => bookmarks.has(word.id)).length;
    const correctCount = categoryWords.filter(word => correctSet.has(word.id)).length;
    const wrongCount = categoryWords.filter(word => wrongSet.has(word.id)).length;
    const unlearnedCount = categoryWords.filter(word => !correctSet.has(word.id) && !wrongSet.has(word.id)).length;
    
    const hasBookmarkInCategory = bookmarkCount > 0;
    const hasCorrectInCategory = correctCount > 0;
    const hasWrongInCategory = wrongCount > 0;
    const hasUnlearnedInCategory = unlearnedCount > 0;
    
    // フィルターチェックボックスの状態を設定
    const filterAll = document.getElementById('filterAll');
    const filterUnlearned = document.getElementById('filterUnlearned');
    const filterWrong = document.getElementById('filterWrong');
    const filterBookmark = document.getElementById('filterBookmark');
    const filterCorrect = document.getElementById('filterCorrect');
    
    // 各フィルターの有効/無効を設定（存在する種類のみ選択可能）
    if (filterUnlearned) {
        filterUnlearned.checked = hasUnlearnedInCategory;
        filterUnlearned.disabled = !hasUnlearnedInCategory;
    }
    if (filterWrong) {
        filterWrong.checked = hasWrongInCategory;
        filterWrong.disabled = !hasWrongInCategory;
    }
    if (filterBookmark) {
        filterBookmark.checked = hasBookmarkInCategory;
        filterBookmark.disabled = !hasBookmarkInCategory;
    }
    if (filterCorrect) {
        filterCorrect.checked = hasCorrectInCategory;
        filterCorrect.disabled = !hasCorrectInCategory;
    }
    
    // 「すべて」をチェック（有効なフィルターがすべてONのときのみ）
    if (filterAll) {
        const enabledFilters = [filterUnlearned, filterWrong, filterBookmark, filterCorrect].filter(cb => cb && !cb.disabled);
        const allEnabledChecked = enabledFilters.every(cb => cb.checked);
        filterAll.disabled = enabledFilters.length === 0;
        filterAll.checked = enabledFilters.length === 0 ? false : allEnabledChecked;
    }
    
    // フィルター情報を更新
    updateFilterInfo();
    
    // 学習モードに応じて出題数選択セクションを表示/非表示
    updateQuestionCountSection();
    
    // カテゴリータイトルと進捗バーを更新
    const filterCategoryTitle = document.getElementById('filterCategoryTitle');
    const filterProgressCorrect = document.getElementById('filterProgressCorrect');
    const filterProgressWrong = document.getElementById('filterProgressWrong');
    const filterProgressText = document.getElementById('filterProgressText');
    
    if (filterCategoryTitle) {
        filterCategoryTitle.textContent = currentFilterCourseTitle;
    }
    
    const total = categoryWords.length;
    const correctPercent = total > 0 ? (correctCount / total) * 100 : 0;
    const wrongPercent = total > 0 ? (wrongCount / total) * 100 : 0;
    const completedCount = correctCount + wrongCount;
    
    if (filterProgressCorrect) {
        filterProgressCorrect.style.width = `${correctPercent}%`;
    }
    if (filterProgressWrong) {
        filterProgressWrong.style.width = `${wrongPercent}%`;
    }
    if (filterProgressText) {
        filterProgressText.textContent = `${completedCount}/${total}語`;
    }
    
    // COMPLETE表示（全部青で間違い0の場合）
    const filterProgressBar = document.querySelector('.filter-category-progress-bar');
    if (filterProgressBar) {
        const isComplete = total > 0 && wrongCount === 0 && correctCount === total;
        if (isComplete) {
            filterProgressBar.classList.add('filter-progress-complete');
        } else {
            filterProgressBar.classList.remove('filter-progress-complete');
        }
    }
    
    // ラジオボタンの状態とfilterLearningModeを同期（カテゴリー選択画面のトグルとは独立）
    const modeInput = document.getElementById('modeInput');
    const modeOutput = document.getElementById('modeOutput');
    if (modeInput && modeOutput) {
        // ラジオボタンの状態を確認してfilterLearningModeを更新
        if (modeInput.checked) {
            filterLearningMode = 'input';
        } else if (modeOutput.checked) {
            filterLearningMode = 'output';
        } else {
            // どちらも選択されていない場合はデフォルトで'output'
            filterLearningMode = 'output';
            modeOutput.checked = true;
        }
    }
    
    // ハンバーガーメニューを非表示、戻るボタンを表示
    updateHeaderButtons('back');
    
    // 出題数選択セクションを更新
    updateQuestionCountSection();
}

// 出題数選択セクションを更新
function updateQuestionCountSection() {
    const questionCountSection = document.getElementById('questionCountSection');
    const modeOutput = document.getElementById('modeOutput');
    
    if (questionCountSection && modeOutput) {
        const filteredWords = getFilteredWords();
        const isOutputMode = modeOutput.checked;
        
        if (isOutputMode) {
            if (filteredWords.length > 10) {
                questionCountSection.style.display = 'flex';
                updateQuestionCountOptions(filteredWords.length);
            } else {
                questionCountSection.style.display = 'none';
            }
        } else {
            questionCountSection.style.display = 'none';
        }
    }
}

// 出題数選択オプションを更新
function updateQuestionCountOptions(wordCount) {
    const questionCountValue = document.getElementById('questionCountValue');
    const questionCountMinus = document.getElementById('questionCountMinus');
    const questionCountPlus = document.getElementById('questionCountPlus');
    
    if (!questionCountValue) return;
    
    // 初期表示は「すべて」
    questionCountValue.textContent = 'すべて';
    questionCountValue.dataset.count = wordCount;
    
    // ボタンの有効/無効を設定
    if (questionCountMinus) {
        questionCountMinus.disabled = false;
    }
    if (questionCountPlus) {
        questionCountPlus.disabled = true; // 最大なので+は無効
    }
}

// フィルター情報を更新
function updateFilterInfo() {
    const filteredWords = getFilteredWords();
    const filteredWordCount = document.getElementById('filteredWordCount');
    if (filteredWordCount) {
        filteredWordCount.textContent = `${filteredWords.length}語`;
    }
    
    // アウトプットモードの場合、出題数選択を更新
    const questionCountSection = document.getElementById('questionCountSection');
    const modeOutput = document.getElementById('modeOutput');
    if (questionCountSection && modeOutput && modeOutput.checked && questionCountSection.style.display !== 'none') {
        updateQuestionCountOptions(filteredWords.length);
    }
}

// フィルター条件に基づいて単語を取得
function getFilteredWords() {
    // 小学生で習った単語の場合は各単語のカテゴリーから進捗を読み込む
    let correctSet, wrongSet;
    if (currentFilterCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        correctSet = new Set();
        wrongSet = new Set();
        const mode = selectedLearningMode || 'card';
        const categoryCache = {};
        currentFilterWords.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
                const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                categoryCache[cat] = {
                    correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                    wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                };
            }
            if (categoryCache[cat].correct.has(word.id)) correctSet.add(word.id);
            if (categoryCache[cat].wrong.has(word.id)) wrongSet.add(word.id);
        });
    } else {
        const loaded = loadCategoryWords(currentFilterCategory);
        correctSet = loaded.correctSet;
        wrongSet = loaded.wrongSet;
    }
    const savedBookmarks = localStorage.getItem('reviewWords');
    const bookmarks = savedBookmarks ? new Set(JSON.parse(savedBookmarks).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();
    
    const filterUnlearned = document.getElementById('filterUnlearned')?.checked ?? true;
    const filterWrong = document.getElementById('filterWrong')?.checked ?? true;
    const filterBookmark = document.getElementById('filterBookmark')?.checked ?? true;
    const filterCorrect = document.getElementById('filterCorrect')?.checked ?? true;
    
    const filtered = currentFilterWords.filter(word => {
        const isCorrect = correctSet.has(word.id);
        const isWrong = wrongSet.has(word.id);
        const isBookmark = bookmarks.has(word.id);
        const isUnlearned = !isCorrect && !isWrong;
        
        // いずれかの選択されたフィルターに該当すれば含める（OR条件）
        if (filterUnlearned && isUnlearned) return true;
        if (filterWrong && isWrong) return true;
        if (filterBookmark && isBookmark) return true;
        if (filterCorrect && isCorrect) return true;
        
        return false;
    });
    
    return filtered;
}

// 入力モード用の学習方法選択モーダルを表示（後方互換性のため残す）
function showInputModeMethodSelectionModal(category, categoryWords, hasProgress, savedIndex, wrongWordsInCategory, courseTitle) {
    // フィルター画面を表示
    showWordFilterView(category, categoryWords, courseTitle);
}

// 学習方法選択モーダルを表示（後方互換性のため残す）
function showMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, courseStart, courseEnd, courseTitle) {
    // フィルター画面を表示
    showWordFilterView(category, courseWords, courseTitle);
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
    if (elements.unitName) {
        // 入試得点力アップコースの場合はカテゴリー名を直接使用
        const scoreUpCategories = [
            '英文法中学３年間の総復習',
            '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
            '条件英作文特訓コース',
            '大阪C問題対策英単語タイムアタック',
            '大阪C問題対策 英作写経ドリル',
            '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】'
        ];
        let displayTitle;
        if (scoreUpCategories.includes(category)) {
            // 入試得点力アップコースの場合はカテゴリー名をそのまま使用
            displayTitle = category;
        } else {
            // その他の場合はコース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
            displayTitle = currentFilterCourseTitle || category;
        }
        elements.unitName.textContent = displayTitle;
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    document.body.classList.add('time-attack-mode');
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);
    
    // ハンバーガーメニューと戻るボタンを非表示、中断ボタンを表示
    updateHeaderButtons('learning');
    
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
                
                // 学習画面の要素を表示（例文モード・整序英作文モード以外のとき）
                const wordCard = document.getElementById('wordCard');
                const cardHint = document.getElementById('cardHint');
                const statsBar = document.getElementById('statsBar');
                const progressStatsScores = document.querySelector('.progress-stats-scores');
                
                // 例文モード・整序英作文モードではカードを表示しない
                if (!isSentenceModeActive && !isReorderModeActive) {
                    if (wordCard) wordCard.classList.remove('hidden');
                    if (cardHint) cardHint.classList.remove('hidden');
                    if (progressStatsScores) {
                        progressStatsScores.style.display = 'flex';
                    }
                }
                if (statsBar) statsBar.classList.remove('hidden');
                
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
        if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
            // 各単語のカテゴリーから進捗を読み込む
            const mode = selectedLearningMode || 'card';
            const categoryCache = {};
            words.forEach((word, wordIndex) => {
                const cat = word.category;
                if (!categoryCache[cat]) {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    categoryCache[cat] = {
                        correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                        wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                    };
                }
                const statusIndex = wordIndex;
                if (statusIndex >= 0 && statusIndex < questionStatus.length) {
                    if (categoryCache[cat].wrong.has(word.id)) {
                        questionStatus[statusIndex] = 'wrong';
                    } else if (categoryCache[cat].correct.has(word.id)) {
                        questionStatus[statusIndex] = 'correct';
                    }
                }
            });
        } else {
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
    }

    elements.categorySelection.classList.add('hidden');
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    elements.mainContent.classList.remove('hidden');
    if (elements.unitName) {
        // 入試得点力アップコースの場合はカテゴリー名を直接使用
        const scoreUpCategories = [
            '英文法中学３年間の総復習',
            '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
            '条件英作文特訓コース',
            '大阪C問題対策英単語タイムアタック',
            '大阪C問題対策 英作写経ドリル',
            '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】'
        ];
        let displayTitle;
        if (scoreUpCategories.includes(category)) {
            // 入試得点力アップコースの場合はカテゴリー名をそのまま使用
            displayTitle = category;
        } else {
            // その他の場合はコース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
            displayTitle = currentFilterCourseTitle || category;
        }
        elements.unitName.textContent = displayTitle;
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);
    
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
    const inputModeNav = document.getElementById('inputModeNav');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const cardTopSection = document.querySelector('.card-top-section');
    const inputListView = document.getElementById('inputListView');
    const progressStepLeft = document.getElementById('progressStepLeft');
    const progressStepRight = document.getElementById('progressStepRight');
    const sentenceNavigation = document.getElementById('sentenceNavigation');
    
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (wordCard) wordCard.classList.remove('hidden');
    if (wordCardContainer) wordCardContainer.classList.remove('hidden');
    if (inputListView) inputListView.classList.add('hidden');
    // モードフラグをリセット
    isInputModeActive = false;
    isSentenceModeActive = false;
    isReorderModeActive = false;
    
    // インプットモード用戻るボタンと中断ボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitInterruptBtn = document.getElementById('unitInterruptBtn');
    
    // currentLearningMode === 'input'の場合は「眺めるだけ」のカードモード
    if (currentLearningMode === 'input') {
        // 判定ボタンを非表示、カード下のナビゲーションボタンを表示
        if (cardHint) cardHint.classList.add('hidden');
        if (inputModeNav) inputModeNav.classList.add('hidden');
        // 上の「前の単語へ」「次の単語へ」ボタンを非表示
        if (progressStepLeft) progressStepLeft.classList.add('hidden');
        if (progressStepRight) progressStepRight.classList.add('hidden');
        if (cardTopSection) cardTopSection.classList.add('hidden');
        if (wordCardContainer) wordCardContainer.classList.add('hidden');
        // 戻るボタン表示、中断ボタン非表示
        if (inputBackBtn) inputBackBtn.classList.remove('hidden');
        if (unitInterruptBtn) unitInterruptBtn.classList.add('hidden');
        renderInputListView(currentWords);
    } else {
        // 通常のカードモード（アウトプット）
        if (cardHint) cardHint.classList.remove('hidden');
        if (inputModeNav) inputModeNav.classList.add('hidden');
        // 上の「前の単語へ」「次の単語へ」ボタンを非表示（アウトプットモードでも非表示）
        if (progressStepLeft) progressStepLeft.classList.add('hidden');
        if (progressStepRight) progressStepRight.classList.add('hidden');
        if (cardTopSection) cardTopSection.classList.remove('hidden');
        if (inputListView) inputListView.classList.add('hidden');
        // 戻るボタン非表示、中断ボタン表示
        if (inputBackBtn) inputBackBtn.classList.add('hidden');
        if (unitInterruptBtn) unitInterruptBtn.classList.remove('hidden');
    }
    
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
    // 学校リストトグル（カテゴリーボタンのイベントより先に登録）
    document.querySelectorAll('.school-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // 親のcategory-cardへのイベント伝播を防止
            e.preventDefault();
            const targetId = toggle.getAttribute('data-target');
            const schoolList = document.getElementById(targetId);
            if (schoolList) {
                schoolList.classList.toggle('hidden');
                toggle.classList.toggle('active');
            }
        });
    });
    
    // カテゴリーボタン (イベント委譲を使用)
    const categorySelectionEl = elements.categorySelection || document.getElementById('categorySelection');
    console.log('Setting up category card listeners, categorySelection:', categorySelectionEl);
    if (categorySelectionEl) {
        categorySelectionEl.addEventListener('click', (e) => {
            console.log('Click detected on categorySelection, target:', e.target);
            // 学校トグルがクリックされた場合は何もしない
            if (e.target.closest('.school-toggle') || e.target.closest('.school-list')) {
                console.log('Ignored: school toggle or list clicked');
                return;
            }
            // クリックされた要素またはその親要素がcategory-cardか確認
            const categoryCard = e.target.closest('.category-card[data-category]');
            console.log('Category card found:', categoryCard);
            if (categoryCard) {
                const category = categoryCard.getAttribute('data-category');
                console.log('Starting category:', category);
                if (category) {
                    startCategory(category);
                }
            }
        });
        console.log('Category card listener added successfully');
    } else {
        console.error('categorySelection element not found!');
    }
    
    // AI分析カードボタン
    const aiAnalysisCardBtn = document.getElementById('aiAnalysisCardBtn');
    if (aiAnalysisCardBtn) {
        aiAnalysisCardBtn.addEventListener('click', () => {
            openAiAnalysisMenu();
        });
    }
    
    // 大阪府のすべての英単語カードボタン
    const allWordsCardBtn = document.getElementById('allWordsCardBtn');
    if (allWordsCardBtn) {
        allWordsCardBtn.addEventListener('click', () => {
            startAllWordsLearning();
        });
    }
    
    // コースタブ切り替え
    // 大阪府公立入試について知るボタン
    const examInfoBtn = document.getElementById('examInfoBtn');
    const examInfoView = document.getElementById('examInfoView');
    
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
            // ハンバーガーメニューを非表示、戻るボタンを表示
            updateHeaderButtons('back');
        });
    }
    
    // 入試情報クイズ機能
    initExamQuiz();
    
    const courseTabs = document.querySelectorAll('.course-tab');
    const courseSections = document.querySelectorAll('.course-section');
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
    
    // 正解・不正解・完璧ボタン（スワイプと同じスライドアウトアニメーション）
    // 途中まで遅く、途中から加速するイージング
    const swipeOutEasing = 'cubic-bezier(0.4, 0, 0.9, 0.4)';
    const swipeOutDuration = 220; // ミリ秒
    
    elements.correctBtn.addEventListener('click', () => {
        // カードが裏返されていない場合は何もしない
        if (!elements.wordCard.classList.contains('flipped')) return;
        // アニメーション中なら処理しない
        if (isCardAnimating) return;
        
        // スワイプと同じように左にスライドアウト
        isCardAnimating = true;
        elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
        elements.wordCard.style.transform = 'translateX(-120%) rotate(-12deg)';
        elements.wordCard.style.opacity = '0';
        
        setTimeout(() => {
            elements.wordCard.style.transition = 'none';
            elements.wordCard.style.transform = '';
            isCardAnimating = false;
            markAnswer(true);
        }, swipeOutDuration);
    });
    elements.wrongBtn.addEventListener('click', () => {
        // カードが裏返されていない場合は何もしない
        if (!elements.wordCard.classList.contains('flipped')) return;
        // アニメーション中なら処理しない
        if (isCardAnimating) return;
        
        // スワイプと同じように右にスライドアウト
        isCardAnimating = true;
        elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
        elements.wordCard.style.transform = 'translateX(120%) rotate(12deg)';
        elements.wordCard.style.opacity = '0';
        
        setTimeout(() => {
            elements.wordCard.style.transition = 'none';
            elements.wordCard.style.transform = '';
            isCardAnimating = false;
            markAnswer(false);
        }, swipeOutDuration);
    });
    if (elements.masteredBtn) {
        elements.masteredBtn.addEventListener('click', () => {
            // カードが裏返されていない場合は何もしない
            if (!elements.wordCard.classList.contains('flipped')) return;
            // アニメーション中なら処理しない
            if (isCardAnimating) return;
            
            // 上にスライドアウト（完璧）
            isCardAnimating = true;
            elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
            elements.wordCard.style.transform = 'translateY(-120%) scale(0.8)';
            elements.wordCard.style.opacity = '0';
            
            setTimeout(() => {
                elements.wordCard.style.transition = 'none';
                elements.wordCard.style.transform = '';
                isCardAnimating = false;
                markMastered();
            }, swipeOutDuration);
        });
    }
    
    // ホームボタン
    if (elements.homeBtn) {
        elements.homeBtn.addEventListener('click', async () => {
            if (await showConfirm('学習を中断してホームに戻りますか？')) {
                showCategorySelection();
            }
        });
    }
    
    // 上部コンテナの中断ボタン
    if (elements.unitInterruptBtn) {
        elements.unitInterruptBtn.addEventListener('click', async () => {
            if (await showConfirm('学習を中断してホームに戻りますか？\n\n中断してもここまでのデータは保存されます。')) {
                showCategorySelection();
            }
        });
    }
    
    // インプットモード用戻るボタン
    const inputBackBtn = document.getElementById('inputBackBtn');
    if (inputBackBtn) {
        inputBackBtn.addEventListener('click', () => {
            // 学習モードをリセット
            document.body.classList.remove('learning-mode');
            updateThemeColor(false);
            
            if (elements.mainContent) {
                elements.mainContent.classList.add('hidden');
            }
            
            // コース選択画面に戻る
            if (selectedCategory) {
                const categoryMapping = {
                    'LEVEL1 超重要単語400': 'Group1 超頻出600',
                    'LEVEL2 重要単語300': 'Group2 頻出200',
                    'LEVEL3 差がつく単語200': 'Group3 ハイレベル100',
                    'LEVEL4 私立高校入試レベル': 'Group3 ハイレベル100',
                    'LEVEL5 難関私立高校入試レベル': 'Group3 ハイレベル100'
                };
                let categoryWords;
                if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                    // vocabulary-data.jsから取得（優先）
                    if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                        categoryWords = getElementaryVocabulary();
                    } else if (typeof elementaryWordData !== 'undefined') {
                        // 既存のelementaryWordDataとの互換性
                        categoryWords = elementaryWordData;
                    } else {
                        showCategorySelection();
                        return;
                    }
                } else {
                    const dataCategory = categoryMapping[selectedCategory] || selectedCategory;
                    categoryWords = wordData.filter(word => word.category === dataCategory);
                }
                if (categoryWords && categoryWords.length > 0) {
                    showCourseSelection(selectedCategory, categoryWords);
                } else {
                    showCategorySelection();
                }
            } else {
                showCategorySelection();
            }
        });
    }
    
    // 進捗バーの左右矢印ボタン
    const progressNavLeft = document.getElementById('progressNavLeft');
    const progressNavRight = document.getElementById('progressNavRight');
    if (progressNavLeft) {
        progressNavLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            scrollProgressBarLeft();
        });
    }
    if (progressNavRight) {
        progressNavRight.addEventListener('click', (e) => {
            e.stopPropagation();
            scrollProgressBarRight();
        });
    }
    
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
    
    // インプットモード用ナビゲーションボタン
    const inputNavLeft = document.getElementById('inputNavLeft');
    const inputNavRight = document.getElementById('inputNavRight');
    if (inputNavLeft) {
        inputNavLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            goToPreviousWord();
        });
    }
    if (inputNavRight) {
        inputNavRight.addEventListener('click', (e) => {
            e.stopPropagation();
            goToNextWord();
        });
    }
    
    // フィルター画面のイベントリスナー
    const filterStartBtn = document.getElementById('filterStartBtn');
    const filterBackBtn = document.getElementById('filterBackBtn');
    const filterAll = document.getElementById('filterAll');
    const filterUnlearned = document.getElementById('filterUnlearned');
    const filterWrong = document.getElementById('filterWrong');
    const filterBookmark = document.getElementById('filterBookmark');
    const filterCorrect = document.getElementById('filterCorrect');
    const examDateInput = document.getElementById('examDateInput');
    const examDateSaveBtn = document.getElementById('examDateSaveBtn');

    // 入試日設定
    if (examDateSaveBtn) {
        examDateSaveBtn.addEventListener('click', () => {
            const value = examDateInput ? examDateInput.value : '';
            if (!value) {
                alert('入試日を選択してください。');
                return;
            }
            saveExamDate(value);
            updateExamCountdownDisplay();
        });
    }
    if (examDateInput) {
        examDateInput.addEventListener('change', () => {
            if (examDateInput.value) {
                saveExamDate(examDateInput.value);
                updateExamCountdownDisplay();
            }
        });
    }
    
    // 「すべて」チェックボックスの変更イベント
    if (filterAll) {
        filterAll.addEventListener('change', () => {
            const isChecked = filterAll.checked;
            if (filterUnlearned && !filterUnlearned.disabled) filterUnlearned.checked = isChecked;
            if (filterWrong && !filterWrong.disabled) filterWrong.checked = isChecked;
            if (filterBookmark && !filterBookmark.disabled) filterBookmark.checked = isChecked;
            if (filterCorrect && !filterCorrect.disabled) filterCorrect.checked = isChecked;
            updateFilterInfo();
        });
    }
    
    // 個別フィルターチェックボックスの変更イベント
    [filterUnlearned, filterWrong, filterBookmark, filterCorrect].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                // 「すべて」の状態を更新
                if (filterAll) {
                    const allChecked = [filterUnlearned, filterWrong, filterBookmark, filterCorrect]
                        .filter(cb => cb && !cb.disabled)
                        .every(cb => cb.checked);
                    filterAll.checked = allChecked;
                }
                updateFilterInfo();
            });
        }
    });
    
    // 学習モードの変更イベント
    // 学習モード変更時のイベントリスナー（イベント委譲）
    document.addEventListener('change', (e) => {
        if (e.target.name === 'learningMode') {
            if (e.target.value === 'input') {
                filterLearningMode = 'input';
            } else if (e.target.value === 'output') {
                filterLearningMode = 'output';
            }
            updateQuestionCountSection();
        }
    });
    
    // プラス・マイナスボタンのイベントリスナー（直接追加で反応を改善）
    const questionCountValue = document.getElementById('questionCountValue');
    const questionCountMinus = document.getElementById('questionCountMinus');
    const questionCountPlus = document.getElementById('questionCountPlus');
    
    function handleQuestionCountChange(isPlus) {
        if (!questionCountValue) return;
        
        const filteredWords = getFilteredWords();
        const maxCount = filteredWords.length;
        
        if (filteredWords.length < 10) return;
        
        let currentCount = parseInt(questionCountValue.dataset.count) || maxCount;
        
        if (isPlus) {
            currentCount = Math.min(maxCount, currentCount + 10);
        } else {
            currentCount = Math.max(10, currentCount - 10);
        }
        
        questionCountValue.dataset.count = currentCount;
        
        // 最大値なら「すべて」と表示
        if (currentCount >= maxCount) {
            questionCountValue.textContent = 'すべて';
        } else {
            questionCountValue.textContent = currentCount + '問';
        }
        
        // ボタンの有効/無効を更新
        if (questionCountMinus) questionCountMinus.disabled = currentCount <= 10;
        if (questionCountPlus) questionCountPlus.disabled = currentCount >= maxCount;
    }
    
    // マイナスボタン
    if (questionCountMinus) {
        questionCountMinus.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuestionCountChange(false);
        });
    }
    
    // プラスボタン
    if (questionCountPlus) {
        questionCountPlus.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuestionCountChange(true);
        });
    }
    
    
    // 学習開始ボタン
    if (filterStartBtn) {
        filterStartBtn.addEventListener('click', () => {
            const filteredWords = getFilteredWords();
            if (filteredWords.length === 0) {
                alert('選択された単語がありません。フィルターを調整してください。');
                return;
            }
            
            // 出題順を取得
            const orderSequential = document.getElementById('orderSequential');
            const isSequential = orderSequential?.checked ?? true;
            
            // 出題順に応じて単語を並び替え
            let wordsToLearn = [...filteredWords];
            if (!isSequential) {
                // ランダム順
                wordsToLearn = wordsToLearn.sort(() => Math.random() - 0.5);
            }
            
            // アウトプットモードの場合、出題数を制限
            if (filterLearningMode === 'output') {
                const questionCountValue = document.getElementById('questionCountValue');
                let questionCount = wordsToLearn.length; // デフォルトはすべて
                if (questionCountValue && questionCountValue.dataset.count) {
                    const count = parseInt(questionCountValue.dataset.count);
                    if (!isNaN(count) && count > 0) {
                        questionCount = Math.min(count, wordsToLearn.length);
                    }
                }
                wordsToLearn = wordsToLearn.slice(0, questionCount);
            }
            
            // 出題数制限後の単語数チェック
            if (wordsToLearn.length === 0) {
                alert('選択された単語がありません。フィルターを調整してください。');
                return;
            }
            
            // フィルター画面を非表示（ボトムシートを閉じる）
            const wordFilterView = document.getElementById('wordFilterView');
            const filterOverlayEl = document.getElementById('filterOverlay');
            if (wordFilterView) {
                wordFilterView.classList.remove('show');
                wordFilterView.classList.add('hidden');
            }
            if (filterOverlayEl) {
                filterOverlayEl.classList.remove('show');
                filterOverlayEl.classList.add('hidden');
            }
            document.body.style.overflow = '';
            
            // 学習を開始
            // filterLearningMode === 'input'の場合は「眺めるだけ」のカードモードとしてinitLearningを呼ぶ
            // filterLearningMode === 'output'または未設定の場合は通常のカードモード
            // ただし、カテゴリー選択画面のselectedLearningModeも考慮する
            currentLearningMode = filterLearningMode === 'input' ? 'input' : (selectedLearningMode === 'input' ? 'input' : 'card');
            initLearning(currentFilterCategory, wordsToLearn, 0, wordsToLearn.length, 0);
        });
    }
    
    // フィルター画面を閉じる関数（下にスライドして閉じる）
    function closeFilterSheet() {
        const wordFilterView = document.getElementById('wordFilterView');
        const filterOverlay = document.getElementById('filterOverlay');
        
        if (wordFilterView) {
            // なめらかに下にスライド
            wordFilterView.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
            wordFilterView.style.transform = 'translateX(-50%) translateY(100%)';
            wordFilterView.classList.remove('show');
        }
        if (filterOverlay) {
            filterOverlay.classList.remove('show');
        }
        document.body.style.overflow = '';
        
        // アニメーション完了後にhiddenを追加してtransformをリセット
        setTimeout(() => {
            if (wordFilterView) {
                wordFilterView.classList.add('hidden');
                wordFilterView.style.transform = '';
                wordFilterView.style.transition = '';
            }
            if (filterOverlay) filterOverlay.classList.add('hidden');
        }, 400);
    }
    
    // 戻るボタン
    if (filterBackBtn) {
        filterBackBtn.addEventListener('click', closeFilterSheet);
    }
    
    // ×ボタン
    const filterCloseBtn = document.getElementById('filterCloseBtn');
    if (filterCloseBtn) {
        filterCloseBtn.addEventListener('click', closeFilterSheet);
    }
    
    // オーバーレイクリックで閉じる
    const filterOverlay = document.getElementById('filterOverlay');
    if (filterOverlay) {
        filterOverlay.addEventListener('click', closeFilterSheet);
    }
    
    
    // ハンバーガーメニューボタンとサイドバー
    const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const homeFromSidebarBtn = document.getElementById('homeFromSidebarBtn');
    const aiAnalysisMenuBtn = document.getElementById('aiAnalysisMenuBtn');
    
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
    
    // 完了画面のボタン
    const completionBackBtn = document.getElementById('completionBackBtn');
    const completionReviewBtn = document.getElementById('completionReviewBtn');
    
    if (completionBackBtn) {
        completionBackBtn.addEventListener('click', () => {
            hideCompletion();
            setTimeout(() => {
                // ホーム画面（カテゴリー選択画面）に戻る
                showCategorySelection();
            }, 350);
        });
    }
    
    if (completionReviewBtn) {
        completionReviewBtn.addEventListener('click', () => {
            reviewWrongWords();
        });
    }
    
    // ヘッダーの戻るボタン
    const headerBackBtn = document.getElementById('headerBackBtn');
    if (headerBackBtn) {
        headerBackBtn.addEventListener('click', () => {
            // 現在の画面に応じて適切な画面に戻る
            const grammarChapterView = document.getElementById('grammarChapterView');
            const grammarTOCView = document.getElementById('grammarTableOfContentsView');
            const courseSelection = document.getElementById('courseSelection');
            const examInfoView = document.getElementById('examInfoView');
            
            const wordFilterView = document.getElementById('wordFilterView');
            
            if (grammarChapterView && !grammarChapterView.classList.contains('hidden')) {
                // 文法解説ページから目次ページに戻る
                grammarChapterView.classList.add('hidden');
                showGrammarTableOfContents();
            } else if (grammarTOCView && !grammarTOCView.classList.contains('hidden')) {
                // 文法目次ページからカテゴリー選択画面に戻る
                grammarTOCView.classList.add('hidden');
                showCategorySelection();
            } else if (examInfoView && !examInfoView.classList.contains('hidden')) {
                // 入試情報画面からカテゴリー選択画面に戻る
                examInfoView.classList.add('hidden');
                showCategorySelection();
            } else if (wordFilterView && !wordFilterView.classList.contains('hidden')) {
                // フィルター画面からコース選択画面に戻る
                wordFilterView.classList.add('hidden');
                if (courseSelection) {
                    courseSelection.classList.remove('hidden');
                }
            } else if (courseSelection && !courseSelection.classList.contains('hidden')) {
                // コース選択画面からカテゴリー選択画面に戻る
                courseSelection.classList.add('hidden');
                showCategorySelection();
            } else if (elements.mainContent && !elements.mainContent.classList.contains('hidden')) {
                // 学習画面からコース選択画面またはカテゴリー選択画面に戻る
                if (selectedCategory) {
                    // コース選択画面に戻る
                    const categoryMapping = {
                        'LEVEL1 大阪府必須400': 'Group1 超頻出600',
                        'LEVEL2 大阪府重要300': 'Group2 頻出200',
                        'LEVEL3 大阪府差がつく200': 'Group3 ハイレベル100',
                        'LEVEL4 私立高校入試レベル': 'Group3 ハイレベル100',
                        'LEVEL5 難関私立高校入試レベル': 'Group3 ハイレベル100'
                    };
                    let categoryWords;
                    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                        if (typeof elementaryWordData !== 'undefined') {
                            categoryWords = elementaryWordData;
                        } else {
                            showCategorySelection();
                            return;
                        }
                    } else {
                        const dataCategory = categoryMapping[selectedCategory] || selectedCategory;
                        categoryWords = wordData.filter(word => word.category === dataCategory);
                    }
                    if (categoryWords.length > 0) {
                        elements.mainContent.classList.add('hidden');
                        showCourseSelection(selectedCategory, categoryWords);
                    } else {
                        showCategorySelection();
                    }
                } else {
                    showCategorySelection();
                }
            } else {
                // その他の場合はカテゴリー選択画面に戻る
                showCategorySelection();
            }
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
                    // vocabulary-data.jsから取得（優先）
                    if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                        categoryWords = getElementaryVocabulary();
                    } else if (typeof elementaryWordData !== 'undefined') {
                        // 既存のelementaryWordDataとの互換性
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
    
    if (aiAnalysisMenuBtn) {
        aiAnalysisMenuBtn.addEventListener('click', () => {
            closeSidebar();
            openAiAnalysisMenu();
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
    
    // 英文法中学３年間の総復習 目次ページのイベントリスナー
    const backToCategoryFromGrammarTOCBtn = document.getElementById('backToCategoryFromGrammarTOCBtn');
    if (backToCategoryFromGrammarTOCBtn) {
        backToCategoryFromGrammarTOCBtn.addEventListener('click', () => {
            const grammarTOCView = document.getElementById('grammarTableOfContentsView');
            if (grammarTOCView) {
                grammarTOCView.classList.add('hidden');
            }
            showCategorySelection();
        });
    }
    
    // 目次から各章をクリックしたときの処理
    document.querySelectorAll('.grammar-chapter-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chapterNumber = parseInt(e.currentTarget.getAttribute('data-chapter'), 10);
            if (chapterNumber) {
                showGrammarChapter(chapterNumber);
            }
        });
    });
    
    // 解説ページから目次に戻るボタン
    const backToGrammarTOCBtn = document.getElementById('backToGrammarTOCBtn');
    if (backToGrammarTOCBtn) {
        backToGrammarTOCBtn.addEventListener('click', () => {
            const grammarChapterView = document.getElementById('grammarChapterView');
            if (grammarChapterView) {
                grammarChapterView.classList.add('hidden');
            }
            showGrammarTableOfContents();
        });
    }
    
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

// インプットモードのスクロール可能性をチェック
function checkInputModeScrollable() {
    const inputModeContent = document.querySelector('.input-mode-content');
    if (!inputModeContent) return;
    
    // 既存のスクロールインジケーターを削除
    const existingIndicator = inputModeContent.querySelector('.scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // 少し遅延してコンテンツが反映された後にチェック
    requestAnimationFrame(() => {
        const isScrollable = inputModeContent.scrollHeight > inputModeContent.clientHeight;
        if (isScrollable) {
            // スクロールインジケーターを追加
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.textContent = 'スクロール';
            inputModeContent.appendChild(indicator);
            
            // スクロールイベントを追加（一度だけ）
            if (!inputModeContent.dataset.scrollListenerAdded) {
                inputModeContent.addEventListener('scroll', handleInputModeScroll);
                inputModeContent.dataset.scrollListenerAdded = 'true';
            }
        }
    });
}

// インプットモードのスクロールを処理
function handleInputModeScroll(e) {
    const element = e.target;
    const indicator = document.querySelector('.scroll-indicator');
    
    if (!indicator) return;
    
    const scrolledToBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 20;
    
    if (scrolledToBottom || element.scrollTop > 10) {
        indicator.classList.add('hidden');
    } else {
        indicator.classList.remove('hidden');
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
            inputModeContent.scrollTop = 0; // スクロール位置をリセット
        }
        // スクロールインジケーターを削除
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.remove();
        }
    }

    const word = currentWords[currentIndex];
    inputAnswerSubmitted = false;
    wordResponseStartTime = Date.now();
    
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
        
        // 入力モード側も意味を整形して表示
        setMeaningContent(inputMeaning, word.meaning);
    }
    
    // 入試登場回数を表示（入力モード）
    const inputAppearanceCountEl = document.getElementById('inputWordAppearanceCount');
    if (inputAppearanceCountEl) {
        const count =
            typeof word.appearanceCount === 'number' && !isNaN(word.appearanceCount)
                ? word.appearanceCount
                : 0;
        const valueSpan = inputAppearanceCountEl.querySelector('.appearance-value');
        if (valueSpan) {
            valueSpan.textContent = ` ${count}回`;
        }
        inputAppearanceCountEl.style.display = 'flex';
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
    
    // スクロール可能性をチェック
    checkInputModeScrollable();
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
    
    // スクロール可能性をチェック
    checkInputModeScrollable();
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
    if (currentIndex > currentRangeStart && !isCardAnimating) {
        isCardAnimating = true;
        isCardRevealed = false;
        inputAnswerSubmitted = false;
        
        const cardInner = elements.wordCard ? elements.wordCard.querySelector('.card-inner') : null;
        
        if (elements.wordCard) {
            // フェードアウト（裏面のままでOK、見えなくなってから裏返す）
            elements.wordCard.classList.add('fade-out');
            
            setTimeout(() => {
                // フェードアウト完了（見えない状態）
                // ここでカードを表面に戻す（見えないので裏返しは見えない）
                if (cardInner) {
                    cardInner.style.transition = 'none';
                    cardInner.style.transform = 'rotateY(0deg)';
                }
                elements.wordCard.classList.remove('flipped');
                elements.wordCard.offsetHeight; // 強制リフロー
                
                currentIndex--;
                updateProgressSegments();
                
                // フェードアウトクラスをリセット
                elements.wordCard.classList.remove('fade-out');
                elements.wordCard.style.opacity = '0'; // 明示的に非表示を維持
                
                // 内容を更新
                if (isInputModeActive && currentLearningMode !== 'input') {
                    displayInputMode();
                } else {
                    displayCurrentWord();
                }
                
                // displayCurrentWord()でopacityがリセットされるので、再度非表示に設定
                elements.wordCard.style.opacity = '0';
                
                // カード内部の回転アニメーションを復元
                if (cardInner) {
                    cardInner.style.transition = '';
                    cardInner.style.transform = '';
                }
                
                // 少し待ってから下からふわっと浮いてくる
                requestAnimationFrame(() => {
                    elements.wordCard.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
                    elements.wordCard.style.opacity = '';
                    elements.wordCard.classList.add('float-up');
                    
                    setTimeout(() => {
                        elements.wordCard.classList.remove('float-up');
                        elements.wordCard.style.transition = '';
                        isCardAnimating = false;
                    }, 450);
                });
                
                updateStats();
                updateNavButtons();
            }, 200);
        } else {
            currentIndex--;
            updateProgressSegments();
            displayCurrentWord();
            updateStats();
            updateNavButtons();
            isCardAnimating = false;
        }
    }
}

// カードアニメーション中かどうか
let isCardAnimating = false;

// 次の単語に移動（回答せずに進む場合）
function goToNextWord() {
    if (currentIndex < currentRangeEnd - 1 && !isCardAnimating) {
        isCardAnimating = true;
        isCardRevealed = false;
        inputAnswerSubmitted = false;
        
        const cardInner = elements.wordCard ? elements.wordCard.querySelector('.card-inner') : null;
        
        if (elements.wordCard) {
            // フェードアウト（裏面のままでOK、見えなくなってから裏返す）
            elements.wordCard.classList.add('fade-out');
            
            setTimeout(() => {
                // フェードアウト完了（見えない状態）
                // ここでカードを表面に戻す（見えないので裏返しは見えない）
                if (cardInner) {
                    cardInner.style.transition = 'none';
                    cardInner.style.transform = 'rotateY(0deg)';
                }
                elements.wordCard.classList.remove('flipped');
                elements.wordCard.offsetHeight; // 強制リフロー
                
                currentIndex++;
                updateProgressSegments();
                
                // フェードアウトクラスをリセット
                elements.wordCard.classList.remove('fade-out');
                elements.wordCard.style.opacity = '0'; // 明示的に非表示を維持
                
                // 内容を更新
                if (isInputModeActive && currentLearningMode !== 'input') {
                    displayInputMode();
                } else {
                    displayCurrentWord();
                }
                
                // displayCurrentWord()でopacityがリセットされるので、再度非表示に設定
                elements.wordCard.style.opacity = '0';
                
                // カード内部の回転アニメーションを復元
                if (cardInner) {
                    cardInner.style.transition = '';
                    cardInner.style.transform = '';
                }
                
                // 少し待ってから下からふわっと浮いてくる
                requestAnimationFrame(() => {
                    elements.wordCard.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
                    elements.wordCard.style.opacity = '';
                    elements.wordCard.classList.add('float-up');
                    
                    setTimeout(() => {
                        elements.wordCard.classList.remove('float-up');
                        elements.wordCard.style.transition = '';
                        isCardAnimating = false;
                    }, 450);
                });
                
                updateStats();
                updateNavButtons();
            }, 200);
        } else {
            currentIndex++;
            updateProgressSegments();
            displayCurrentWord();
            updateStats();
            updateNavButtons();
            isCardAnimating = false;
        }
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
        // インプットモード以外で表面ならスワイプ無効
        if (currentLearningMode !== 'input' && !card.classList.contains('flipped')) return;
        
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
        
        // インプットモード以外で表面ならスワイプ無効
        if (currentLearningMode !== 'input' && !card.classList.contains('flipped')) return;
        
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

        // インプットモードのときはスワイプで次/前に移動（判定なし）
        if (currentLearningMode === 'input') {
            if (isHorizontal && Math.abs(dx) > threshold) {
                // スワイプ判定前にカードのスタイルを即座にリセット
                card.style.transition = 'none';
                card.style.transform = '';
                card.style.opacity = '';
                card.offsetHeight; // 強制リフロー
                
                if (dx < 0) {
                    // 左スワイプ: 次の単語へ
                    goToNextWord();
                } else {
                    // 右スワイプ: 前の単語へ
                    goToPreviousWord();
                }
            } else {
                // 元に戻る
                card.style.transform = '';
                card.style.opacity = '';
            }
            return;
        }

        if (isHorizontal && Math.abs(dx) > threshold) {
            // スワイプ判定前にカードを即座に非表示
            card.style.transition = 'none';
            card.style.transform = '';
            card.style.opacity = '0';
            card.offsetHeight; // 強制リフロー
            
            // 裏面：判定
            if (dx < 0) {
                markAnswer(true);
            } else {
                markAnswer(false);
            }
        } else if (isMistakeMode && isVertical && dy < -threshold) {
            // スワイプ判定前にカードを即座に非表示
            card.style.transition = 'none';
            card.style.transform = '';
            card.style.opacity = '0';
            card.offsetHeight; // 強制リフロー
            
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

// 復習チェックの切り替え（ID指定、一覧用）
function toggleReviewById(wordId, buttonEl) {
    if (wordId === undefined || wordId === null) return;
    
    if (reviewWords.has(wordId)) {
        reviewWords.delete(wordId);
    } else {
        reviewWords.add(wordId);
    }
    
    saveReviewWords();
    
    if (buttonEl) {
        if (reviewWords.has(wordId)) {
            buttonEl.classList.add('active');
        } else {
            buttonEl.classList.remove('active');
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

// マーカーを適用：英単語ではなく「No.」に状態を表示する
function applyMarkers(word) {
    const wordNumberEl = elements.wordNumber;
    const inputWordNumberEl = document.getElementById('inputWordNumber');

    // 以前の英字部分のマーカーを念のためクリア
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

    const clearMarker = (el) => {
        if (!el) return;
        el.classList.remove('marker-review', 'marker-correct', 'marker-wrong');
    };

    const inputModeContent = document.getElementById('inputMode')?.querySelector('.input-mode-content');

    clearMarker(wordNumberEl);
    clearMarker(inputWordNumberEl);
    clearMarker(elements.wordCard);
    clearMarker(inputModeContent);

    if (!word) return;

    // タイムアタックモードのときはマーカーを付けない
    if (isTimeAttackMode) {
        return;
    }

    // カテゴリごとの進捗を取得（カテゴリがある場合）
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory) {
        // 小学生で習った単語の場合は、その単語のカテゴリーから進捗を読み込む
        const categoryKey = (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === 'AI分析 苦手単語') ? word.category : selectedCategory;
        const categoryData = loadCategoryWords(categoryKey);
        categoryCorrectSet = categoryData.correctSet;
        categoryWrongSet = categoryData.wrongSet;
    }

    let markerClass = '';

    // 間違い（赤）を優先、その次に正解（青）
    if (categoryWrongSet.has(word.id)) {
        markerClass = 'marker-wrong';
    } else if (categoryCorrectSet.has(word.id)) {
        markerClass = 'marker-correct';
    }

    if (markerClass) {
        if (wordNumberEl) wordNumberEl.classList.add(markerClass);
        if (inputWordNumberEl) inputWordNumberEl.classList.add(markerClass);
        if (elements.wordCard) elements.wordCard.classList.add(markerClass);
        if (inputModeContent) inputModeContent.classList.add(markerClass);
    }
}

// 品詞を一文字に変換する関数（複数品詞対応）
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
        '限定詞（数量）': '限',
        '代名詞': '代',
        '助動詞': '助',
        '間投詞': '間',
        '関係代名詞': '関'
    };
    
    // 複数の品詞が「・」で区切られている場合は、すべての品詞を変換
    const posParts = pos.split('・').map(p => p.trim());
    
    const shortParts = posParts.map(part => {
        // マッピングに存在する場合は変換
        if (posMap[part]) {
            return posMap[part];
        }
        
        // マッピングにない場合は、品詞名に含まれる文字から推測
        if (part.includes('動')) return '動';
        if (part.includes('名')) return '名';
        if (part.includes('形')) return '形';
        if (part.includes('副')) return '副';
        if (part.includes('前')) return '前';
        if (part.includes('接')) return '接';
        if (part.includes('冠')) return '冠';
        if (part.includes('代')) return '代';
        if (part.includes('助')) return '助';
        if (part.includes('間')) return '間';
        if (part.includes('関')) return '関';
        
        // それでも見つからない場合は最初の文字を返す
        return part.charAt(0);
    });
    
    // 複数の品詞がある場合は「・」で区切って返す
    return shortParts.join('・');
}

// 意味テキストを整形して表示（①②③付きは縦に揃えて表示）
function setMeaningContent(meaningElement, text) {
    if (!meaningElement) return;
    if (!text) {
        meaningElement.textContent = '';
        meaningElement.classList.remove('meaning-multiline-root');
        return;
    }
    
    // ①が含まれていなければ従来どおり一行表示
    if (!text.includes('①')) {
        meaningElement.textContent = text;
        meaningElement.classList.remove('meaning-multiline-root');
        return;
    }
    
    // ①〜の番号付きの場合、番号ごとに行を分けて左揃え表示
    const numerals = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
    const lines = [];
    let currentNum = null;
    let buffer = '';
    
    for (const ch of text) {
        if (numerals.includes(ch)) {
            if (currentNum !== null) {
                lines.push({ num: currentNum, text: buffer.trim() });
            }
            currentNum = ch;
            buffer = '';
        } else {
            buffer += ch;
        }
    }
    if (currentNum !== null) {
        lines.push({ num: currentNum, text: buffer.trim() });
    }
    
    // 行がうまく取れなかった場合はフォールバック
    if (lines.length === 0) {
        meaningElement.textContent = text;
        meaningElement.classList.remove('meaning-multiline-root');
        return;
    }
    
    meaningElement.innerHTML = '';
    meaningElement.classList.add('meaning-multiline-root');
    
    lines.forEach(({ num, text: lineText }) => {
        if (!lineText) return;
        const lineDiv = document.createElement('div');
        lineDiv.className = 'meaning-line';
        
        const numSpan = document.createElement('span');
        numSpan.className = 'meaning-index';
        numSpan.textContent = num;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'meaning-text';
        textSpan.textContent = lineText;
        
        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(textSpan);
        meaningElement.appendChild(lineDiv);
    });
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

// インプットモード（眺める用）の一覧を描画
function renderInputListView(words) {
    const listView = document.getElementById('inputListView');
    const container = document.getElementById('inputListContainer');
    
    if (!listView || !container) return;
    
    container.innerHTML = '';
    
    if (!Array.isArray(words) || words.length === 0) {
        listView.classList.add('hidden');
        return;
    }
    
    listView.classList.remove('hidden');
    
    // 進捗マーカー用のセットを取得（小学生で習った単語の場合は各単語のカテゴリーから読み込む）
    let progressCache = {};
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 各カテゴリーの進捗をキャッシュ
        const mode = selectedLearningMode || 'card';
        words.forEach(word => {
            const cat = word.category;
            if (!progressCache[cat]) {
                const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                progressCache[cat] = {
                    correct: savedCorrect ? new Set(JSON.parse(savedCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set(),
                    wrong: savedWrong ? new Set(JSON.parse(savedWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set()
                };
            }
        });
    }
    
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory && selectedCategory !== '小学生で習った単語とカテゴリー別に覚える単語') {
        const sets = loadCategoryWords(selectedCategory);
        categoryCorrectSet = sets.correctSet;
        categoryWrongSet = sets.wrongSet;
    }
    
    words.forEach((word) => {
        const item = document.createElement('div');
        item.className = 'input-list-item';
        
        const inner = document.createElement('div');
        inner.className = 'input-list-inner';
        
        // 表面
        const front = document.createElement('div');
        front.className = 'input-list-front';
        
        const meta = document.createElement('div');
        meta.className = 'input-list-meta';
        
        const number = document.createElement('span');
        number.className = 'input-list-number';
        number.textContent = `No.${word.id}`;
        
        // 小学生で習った単語の場合は各単語のカテゴリーから進捗を取得
        let isCorrect, isWrong;
        if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
            const cache = progressCache[word.category];
            isCorrect = cache && cache.correct.has(word.id);
            isWrong = cache && cache.wrong.has(word.id);
        } else {
            isCorrect = categoryCorrectSet.has(word.id);
            isWrong = categoryWrongSet.has(word.id);
        }
        
        if (isWrong) {
            number.classList.add('marker-wrong');
            item.classList.add('marker-wrong');
        } else if (isCorrect) {
            number.classList.add('marker-correct');
            item.classList.add('marker-correct');
        }
        meta.appendChild(number);
        
        // ブックマークボタンを作成
        const starBtn = document.createElement('button');
        starBtn.className = 'star-btn input-list-star-btn';
        starBtn.setAttribute('type', 'button');
        if (reviewWords.has(word.id)) {
            starBtn.classList.add('active');
        }
        starBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 4h10a1 1 0 0 1 1 1v14l-6-4-6 4V5a1 1 0 0 1 1-1z"></path></svg>';
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReviewById(word.id, starBtn);
        });
        starBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        
        // 入試登場回数とブックマークを横並びにするラッパー
        const appearanceWrapper = document.createElement('div');
        appearanceWrapper.className = 'input-list-appearance-wrapper';
        
        if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
            const badge = document.createElement('span');
            badge.className = 'input-list-appearance';
            badge.innerHTML = `<span class="appearance-label">入試登場回数</span><span class="appearance-count">${word.appearanceCount}回</span>`;
            appearanceWrapper.appendChild(badge);
        }
        appearanceWrapper.appendChild(starBtn);
        meta.appendChild(appearanceWrapper);
        
        const row = document.createElement('div');
        row.className = 'input-list-row';
        
        const pos = document.createElement('span');
        pos.className = 'pos-inline part-of-speech input-list-pos';
        pos.textContent = getPartOfSpeechShort(word.partOfSpeech || '') || '—';
        row.appendChild(pos);
        
        const wordEl = document.createElement('span');
        wordEl.className = 'input-list-word';
        wordEl.textContent = word.word;
        row.appendChild(wordEl);
        
        const audioBtn = document.createElement('button');
        audioBtn.className = 'audio-btn';
        audioBtn.setAttribute('type', 'button');
        audioBtn.setAttribute('aria-label', `${word.word}の音声を再生`);
        audioBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speakWord(word.word, audioBtn);
        });
        row.appendChild(audioBtn);
        
        front.appendChild(meta);
        front.appendChild(row);
        
        // 裏面
        const back = document.createElement('div');
        back.className = 'input-list-back';
        
        const meaningEl = document.createElement('div');
        meaningEl.className = 'input-list-meaning';
        
        // 品詞と意味を横並びで表示
        const meaningWrapper = document.createElement('div');
        meaningWrapper.className = 'input-list-meaning-wrapper';
        const meaningPos = document.createElement('span');
        meaningPos.className = 'pos-inline part-of-speech input-list-meaning-pos';
        meaningPos.textContent = getPartOfSpeechShort(word.partOfSpeech || '') || '—';
        meaningWrapper.appendChild(meaningPos);
        const meaningText = document.createElement('span');
        meaningText.textContent = word.meaning || '';
        meaningWrapper.appendChild(meaningText);
        meaningEl.appendChild(meaningWrapper);
        back.appendChild(meaningEl);
        
        if (word.example && (word.example.english || word.example.japanese)) {
            const exampleBox = document.createElement('div');
            exampleBox.className = 'example-container input-list-example';
            
            const exampleLabel = document.createElement('span');
            exampleLabel.className = 'example-label';
            exampleLabel.textContent = '用例';
            exampleBox.appendChild(exampleLabel);
            
            const exampleText = document.createElement('div');
            exampleText.className = 'example-text';
            
            if (word.example.english) {
                const exEn = document.createElement('div');
                exEn.className = 'example-english';
                // 単語を太字にする
                const exampleEn = word.example.english;
                if (exampleEn && word.word) {
                    const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
                    const highlighted = exampleEn.replace(regex, `<strong>${word.word}</strong>`);
                    let finalText = highlighted;
                    if (/[.!?]\s*$/.test(exampleEn)) {
                        finalText = highlighted.replace(/^(\s*(?:<[^>]+>\s*)*)([a-z])/, (_m, prefix, first) => `${prefix}${first.toUpperCase()}`);
                    }
                    exEn.innerHTML = finalText;
                } else {
                    exEn.textContent = exampleEn;
                }
                exampleText.appendChild(exEn);
            }
            
            if (word.example.japanese) {
                const exJa = document.createElement('div');
                exJa.className = 'example-japanese';
                exJa.textContent = word.example.japanese;
                exampleText.appendChild(exJa);
            }
            
            exampleBox.appendChild(exampleText);
            back.appendChild(exampleBox);
        }
        
        inner.appendChild(front);
        inner.appendChild(back);
        
        item.addEventListener('click', () => {
            // 音声再生中は停止してからカードをめくる
            if (currentSpeech) {
                window.speechSynthesis.cancel();
                currentSpeech = null;
                // 再生中のボタンのスタイルをリセット
                const playingButtons = document.querySelectorAll('.audio-btn.playing');
                playingButtons.forEach(btn => btn.classList.remove('playing'));
            }
            item.classList.toggle('flipped');
        });
        
        item.appendChild(inner);
        container.appendChild(item);
    });
}

// 現在の単語を表示
function displayCurrentWord() {
    if (currentIndex >= currentRangeEnd) {
        // 学習完了時は完了画面を表示
        showCompletion();
        return;
    }

    const word = currentWords[currentIndex];
    wordResponseStartTime = Date.now();
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
    
    // 入試登場回数を表示（カードモード）
    const appearanceCountEl = document.getElementById('wordAppearanceCount');
    if (appearanceCountEl) {
        const count =
            typeof word.appearanceCount === 'number' && !isNaN(word.appearanceCount)
                ? word.appearanceCount
                : 0;
        const valueSpan = appearanceCountEl.querySelector('.appearance-value');
        if (valueSpan) {
            valueSpan.textContent = ` ${count}回`;
        }
        appearanceCountEl.style.display = 'flex';
    }
    
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

    // 意味を表示（①②③があれば行ごとに整形）
    setMeaningContent(elements.meaning, word.meaning);
    
    // 用例を表示（あれば）※アウトプットモードでは非表示
    const exampleContainer = document.getElementById('exampleContainer');
    const exampleEnglishEl = document.getElementById('exampleEnglish');
    const exampleJapaneseEl = document.getElementById('exampleJapanese');
    const exampleLabel = exampleContainer ? exampleContainer.querySelector('.example-label') : null;
    const exampleText = exampleContainer ? exampleContainer.querySelector('.example-text') : null;
    if (exampleContainer && exampleEnglishEl && exampleJapaneseEl) {
        // アウトプットモードでは用例を表示しない
        if (currentLearningMode !== 'input' && word.example && (word.example.english || word.example.japanese)) {
            exampleContainer.style.display = 'none';
        } else if (currentLearningMode === 'input' && word.example && (word.example.english || word.example.japanese)) {
            exampleContainer.style.display = '';

            const exampleEn = word.example.english || '';
            // 用例中の今回の単語を太字にする（英語のみ）
            if (exampleEn && word.word) {
                const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
                const highlighted = exampleEn.replace(regex, `<strong>${word.word}</strong>`);
                
                // 例文が文（. ! ? で終わる）かつ先頭が小文字なら大文字化（strongなどのタグはスキップ）
                let finalText = highlighted;
                if (/[.!?]\s*$/.test(exampleEn)) {
                    finalText = highlighted.replace(/^(\s*(?:<[^>]+>\s*)*)([a-z])/, (_m, prefix, first) => `${prefix}${first.toUpperCase()}`);
                }
                exampleEnglishEl.innerHTML = finalText;
            } else {
                exampleEnglishEl.textContent = exampleEn;
            }

            exampleJapaneseEl.textContent = word.example.japanese || '';
            
            // 用例テキストを初期状態で非表示にする
            if (exampleText) {
                exampleText.style.display = 'none';
            }
            
            // 用例ラベルのクリックイベントを設定（一度だけ）
            if (exampleLabel && exampleText && !exampleLabel.dataset.listenerAdded) {
                exampleLabel.dataset.listenerAdded = 'true';
                exampleLabel.addEventListener('click', (e) => {
                    e.stopPropagation(); // カードのフリップを防ぐ
                    const textEl = exampleContainer.querySelector('.example-text');
                    if (textEl) {
                        if (textEl.style.display === 'none') {
                            textEl.style.display = 'flex';
                            exampleLabel.textContent = '用例を閉じる';
                        } else {
                            textEl.style.display = 'none';
                            exampleLabel.textContent = '用例を見る';
                        }
                    }
                });
            }
            
            // 初期状態のラベルテキストを設定
            if (exampleLabel && exampleText) {
                if (exampleText.style.display === 'none' || !exampleText.style.display) {
                    exampleLabel.textContent = '用例を見る';
                } else {
                    exampleLabel.textContent = '用例を閉じる';
                }
            }
        } else {
            exampleContainer.style.display = 'none';
            exampleEnglishEl.textContent = '';
            exampleJapaneseEl.textContent = '';
        }
    }

    // elements.cardHint.textContent = 'タップでカードをひっくり返す'; // ヒントはCSSで固定表示に変更したためJS制御不要
    updateStarButton();
    updateStats();
    updateNavButtons(); // ボタン状態更新
    updateCardStack(); // カードスタック表示更新
    
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
    // インプットモード（眺める用）の場合は自動再生しない
    if (!isInputModeActive && selectedLearningMode !== 'input' && currentLearningMode !== 'input') {
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
        if (
            selectedCategory &&
            selectedCategory !== '復習チェック' &&
            selectedCategory !== '間違い復習' &&
            selectedCategory !== '大阪C問題対策英単語タイムアタック' &&
            selectedCategory !== 'AI分析 苦手単語'
        ) {
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
    const responseMs = wordResponseStartTime ? (Date.now() - wordResponseStartTime) : null;
    recordWordResult(word, isCorrect, { responseMs, isTimeout });
    

    // 現在の問題の回答状況を記録
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = isCorrect ? 'correct' : 'wrong';
    }

    if (isCorrect) {
        correctCount++;
        correctWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        // AI分析または小学生で習った単語の場合は、各単語のカテゴリー（機能語の場合は「冠詞」「代名詞」など）を使用
        const categoryKey = (selectedCategory === 'AI分析 苦手単語' || selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') ? word.category : selectedCategory;
        if (categoryKey) {
            const { correctSet, wrongSet } = loadCategoryWords(categoryKey);
            correctSet.add(word.id);
            // 正解した場合は間違いリストから削除
            wrongSet.delete(word.id);
            saveCategoryWords(categoryKey, correctSet, wrongSet);
        }
        
        saveCorrectWords();
        
    } else {
        wrongCount++;
        // 間違えた場合は間違いリストに追加
        wrongWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        // AI分析または小学生で習った単語の場合は、各単語のカテゴリー（機能語の場合は「冠詞」「代名詞」など）を使用
        const categoryKeyWrong = (selectedCategory === 'AI分析 苦手単語' || selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') ? word.category : selectedCategory;
        if (categoryKeyWrong) {
            const { correctSet, wrongSet } = loadCategoryWords(categoryKeyWrong);
            wrongSet.add(word.id);
            // 間違えた場合は正解リストから削除
            correctSet.delete(word.id);
            saveCategoryWords(categoryKeyWrong, correctSet, wrongSet);
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

    // アニメーション中なら処理しない
    if (isCardAnimating) return;
    isCardAnimating = true;

    const cardInner = elements.wordCard ? elements.wordCard.querySelector('.card-inner') : null;
    
    // 既にカードが非表示（スワイプで即座に消された場合）かどうか確認
    const isAlreadyHidden = elements.wordCard.style.opacity === '0';
    
    // スワイプと同じ方向にスライドアウト（覚えた=左、覚えていない=右）
    if (!isAlreadyHidden) {
        const slideDirection = isCorrect ? -1 : 1; // 左=-1, 右=1
        elements.wordCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        elements.wordCard.style.transform = `translateX(${slideDirection * 120}%) scale(0.8)`;
        elements.wordCard.style.opacity = '0.2';
    }

    setTimeout(() => {
        // カードを表面に戻す（非表示状態で）
        elements.wordCard.style.transition = 'none';
        if (cardInner) {
            cardInner.style.transition = 'none';
            cardInner.style.transform = 'rotateY(0deg)';
        }
        elements.wordCard.classList.remove('flipped');
        elements.wordCard.style.transform = '';
        elements.wordCard.style.opacity = '0';
        elements.wordCard.offsetHeight; // 強制リフロー
        
        currentIndex++;
        
        // タイムアタックモードの場合、使用時間を減算
        if (isTimeAttackMode) {
            const elapsed = (Date.now() - wordStartTime) / 1000;
            totalTimeRemaining = Math.max(0, totalTimeRemaining - elapsed);
            if (totalTimeRemaining <= 0) {
                handleTimeUp();
                isCardAnimating = false;
                return;
            }
        }
        
        // 進捗を保存
        if (
            selectedCategory &&
            selectedCategory !== '復習チェック' &&
            selectedCategory !== '間違い復習' &&
            selectedCategory !== '大阪C問題対策英単語タイムアタック' &&
            selectedCategory !== 'AI分析 苦手単語'
        ) {
            saveProgress(selectedCategory, currentIndex);
        }
        
        // 進捗バーを更新
        updateProgressSegments();
        updateNavButtons();
        
        // 最後の単語の場合は完了画面を表示
        if (currentIndex >= currentRangeEnd) {
            elements.wordCard.style.opacity = '';
            elements.wordCard.style.transition = '';
            if (cardInner) {
                cardInner.style.transition = '';
                cardInner.style.transform = '';
            }
            isCardAnimating = false;
            
            if (isTimeAttackMode) {
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
            // 内容を更新
            displayCurrentWord();
            
            // displayCurrentWord()でopacityがリセットされるので、再度非表示に設定
            elements.wordCard.style.opacity = '0';
            
            // カード内部の回転アニメーションを復元
            if (cardInner) {
                cardInner.style.transition = '';
                cardInner.style.transform = '';
            }
            
            // 下からふわっと浮いてくる
            requestAnimationFrame(() => {
                elements.wordCard.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
                elements.wordCard.style.opacity = '';
                elements.wordCard.classList.add('float-up');
                
                setTimeout(() => {
                    elements.wordCard.classList.remove('float-up');
                    elements.wordCard.style.transition = '';
                    isCardAnimating = false;
                }, 450);
            });
        }
    }, isAlreadyHidden ? 0 : 400);
}

// 完了画面を表示
function showCompletion() {
    const completionOverlay = document.getElementById('completionOverlay');
    if (!completionOverlay) {
        // フォールバック：旧方式
        showCategorySelection();
        return;
    }
    
    // 前回のアニメーション状態を完全にリセット
    const completionProgressBar = document.querySelector('.completion-progress-bar');
    if (completionProgressBar) {
        // クラスを確実に削除
        completionProgressBar.classList.remove('completion-progress-complete');
        // 強制リフローで確実に反映
        completionProgressBar.offsetHeight;
    }
    
    // オーバーレイを非表示にして、アニメーションをリセット
    completionOverlay.classList.remove('show');
    completionOverlay.classList.add('hidden');
    // 強制リフロー
    completionOverlay.offsetHeight;
    
    // カテゴリー名を設定
    const completionCourseTitle = document.getElementById('completionCourseTitle');
    if (completionCourseTitle) {
        completionCourseTitle.textContent = currentFilterCourseTitle || selectedCategory || '';
    }
    
    // 統計を設定
    const completionCorrectCount = document.getElementById('completionCorrectCount');
    const completionWrongCount = document.getElementById('completionWrongCount');
    if (completionCorrectCount) completionCorrectCount.textContent = correctCount;
    if (completionWrongCount) completionWrongCount.textContent = wrongCount;
    
    // 今回の学習範囲の総数
    const total = currentWords.length;
    
    // +◯語覚えた表示
    const completionGained = document.getElementById('completionGained');
    if (completionGained) {
        if (correctCount > 0) {
            completionGained.textContent = `+${correctCount}語 覚えた！`;
            completionGained.classList.remove('hidden');
        } else {
            completionGained.classList.add('hidden');
        }
    }
    
    // コンプリート判定（今回の学習範囲で全問正解したか）
    const confettiContainer = document.getElementById('confettiContainer');
    
    // 今回の学習で間違いがなく、全問正解した場合にコンプリート
    const isComplete = total > 0 && correctCount === total && wrongCount === 0;
    
    // 紙吹雪をクリア
    if (confettiContainer) {
        confettiContainer.innerHTML = '';
    }
    
    // 進捗テキストを設定
    const completionProgressText = document.getElementById('completionProgressText');
    if (completionProgressText) {
        completionProgressText.textContent = `${correctCount + wrongCount}/${total}語`;
    }
    
    // 進捗バーを初期化（0%）
    const completionProgressCorrect = document.getElementById('completionProgressCorrect');
    const completionProgressWrong = document.getElementById('completionProgressWrong');
    if (completionProgressCorrect) completionProgressCorrect.style.width = '0%';
    if (completionProgressWrong) completionProgressWrong.style.width = '0%';
    
    // 復習ボタンの表示/非表示
    const completionReviewBtn = document.getElementById('completionReviewBtn');
    if (completionReviewBtn) {
        if (wrongCount > 0) {
            completionReviewBtn.classList.remove('hidden');
            completionReviewBtn.innerHTML = `<svg class="completion-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> 覚えていない単語を復習（${wrongCount}語）`;
        } else {
            completionReviewBtn.classList.add('hidden');
        }
    }
    
    // オーバーレイを表示
    completionOverlay.classList.remove('hidden');
    
    // アニメーション開始
    requestAnimationFrame(() => {
        completionOverlay.classList.add('show');
        
        // 少し遅れて進捗バーをアニメーション
        setTimeout(() => {
            const correctPercent = total > 0 ? (correctCount / total) * 100 : 0;
            const wrongPercent = total > 0 ? (wrongCount / total) * 100 : 0;
            
            if (completionProgressCorrect) {
                completionProgressCorrect.style.width = `${correctPercent}%`;
            }
            if (completionProgressWrong) {
                completionProgressWrong.style.width = `${wrongPercent}%`;
            }
            
            // 進捗バーのアニメーション完了後にCOMPLETEを表示
            if (isComplete && completionProgressBar) {
                // 進捗バーのアニメーションが完了するのを待つ
                // correctアニメーション: 1秒、wrongアニメーション: 1秒（0.3秒遅延）
                // COMPLETEの場合はwrongがないので、correctのみで1秒
                const animationTime = 1000; // correctアニメーションの時間
                setTimeout(() => {
                    // クラスを確実に削除（念のため）
                    completionProgressBar.classList.remove('completion-progress-complete');
                    // 強制リフローで確実に反映
                    void completionProgressBar.offsetHeight;
                    // 少し待ってからクラスを再追加（アニメーションを確実に再実行）
                    requestAnimationFrame(() => {
                        completionProgressBar.classList.add('completion-progress-complete');
                    });
                }, animationTime + 100); // 少し余裕を持たせる
            }
        }, 300);
        
        // コンプリート時は紙吹雪を表示
        if (isComplete && confettiContainer) {
            createConfetti(confettiContainer);
        }
    });
}

// 紙吹雪を生成
function createConfetti(container) {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // 細長い長方形の紙吹雪
            const width = Math.random() * 6 + 4;
            const height = Math.random() * 12 + 8;
            confetti.style.width = width + 'px';
            confetti.style.height = height + 'px';
            confetti.style.borderRadius = '1px';
            
            // アニメーション時間
            const duration = Math.random() * 2 + 3;
            confetti.style.animationDuration = duration + 's';
            confetti.style.animationDelay = (Math.random() * 0.3) + 's';
            
            // 横揺れの強さ（左右ランダム）
            const swayDirection = Math.random() > 0.5 ? 1 : -1;
            const swayAmount1 = (Math.random() * 30 + 15) * swayDirection;
            const swayAmount2 = (Math.random() * 25 + 10) * -swayDirection;
            const swayAmount3 = (Math.random() * 20 + 10) * swayDirection;
            
            // 回転角度
            const rotateStart = Math.random() * 360;
            const rotateEnd = rotateStart + (Math.random() * 720 + 360) * (Math.random() > 0.5 ? 1 : -1);
            
            // 個別のキーフレームアニメーション
            const keyframes = `
                @keyframes confettiFall${i} {
                    0% {
                        transform: translateY(0) translateX(0) rotate(${rotateStart}deg) rotateX(0deg);
                        opacity: 1;
                    }
                    20% {
                        transform: translateY(20vh) translateX(${swayAmount1}px) rotate(${rotateStart + (rotateEnd - rotateStart) * 0.2}deg) rotateX(90deg);
                    }
                    40% {
                        transform: translateY(40vh) translateX(${swayAmount2}px) rotate(${rotateStart + (rotateEnd - rotateStart) * 0.4}deg) rotateX(180deg);
                    }
                    60% {
                        transform: translateY(60vh) translateX(${swayAmount3}px) rotate(${rotateStart + (rotateEnd - rotateStart) * 0.6}deg) rotateX(270deg);
                    }
                    80% {
                        transform: translateY(80vh) translateX(${swayAmount1 * 0.5}px) rotate(${rotateStart + (rotateEnd - rotateStart) * 0.8}deg) rotateX(360deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) translateX(${swayAmount2 * 0.3}px) rotate(${rotateEnd}deg) rotateX(450deg);
                        opacity: 0;
                    }
                }
            `;
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            confetti.style.animationName = `confettiFall${i}`;
            container.appendChild(confetti);
            
            // アニメーション終了後に削除
            setTimeout(() => {
                confetti.remove();
                style.remove();
            }, (duration + 0.5) * 1000);
        }, i * 25);
    }
}

// 完了画面を閉じる
function hideCompletion() {
    const completionOverlay = document.getElementById('completionOverlay');
    if (completionOverlay) {
        completionOverlay.classList.remove('show');
        setTimeout(() => {
            completionOverlay.classList.add('hidden');
            // アニメーション関連のクラスを削除して、次回の表示時に確実に再実行されるようにする
            const completionProgressBar = document.querySelector('.completion-progress-bar');
            if (completionProgressBar) {
                completionProgressBar.classList.remove('completion-progress-complete');
            }
        }, 300);
    }
}

// 単元メニュー（コース選択画面）に戻る
function returnToCourseSelection() {
    const category = selectedCategory;
    
    // 学習モードをリセット
    document.body.classList.remove('learning-mode');
    updateThemeColor(false);
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.classList.add('hidden');
    }
    
    // コース名からデータカテゴリー名へのマッピング
    const categoryMapping = {
        'LEVEL1 超重要単語400': 'Group1 超頻出600',
        'LEVEL2 重要単語300': 'Group2 頻出200',
        'LEVEL3 差がつく単語200': 'Group3 ハイレベル100',
        'LEVEL4 私立高校入試レベル': 'Group3 ハイレベル100',
        'LEVEL5 難関私立高校入試レベル': 'Group3 ハイレベル100'
    };
    
    // カテゴリーに応じて単語データを取得
    let categoryWords;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        // vocabulary-data.jsから取得（優先）
        if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
            categoryWords = getElementaryVocabulary();
        } else if (typeof elementaryWordData !== 'undefined') {
            // 既存のelementaryWordDataとの互換性
            categoryWords = elementaryWordData;
        } else {
            showCategorySelection();
            return;
        }
    } else {
        const dataCategory = categoryMapping[category] || category;
        categoryWords = wordData.filter(word => word.category === dataCategory);
    }
    
    if (!categoryWords || categoryWords.length === 0) {
        showCategorySelection();
        return;
    }
    
    // コース選択画面を表示
    showCourseSelection(category, categoryWords);
}

// 覚えていない単語を復習
function reviewWrongWords() {
    hideCompletion();
    
    // 今回の学習で間違えた単語を取得
    const wrongWordsInSession = currentWords.filter(word => {
        if (selectedCategory === 'AI分析 苦手単語') {
            const { wrongSet } = loadCategoryWords(word.category);
            return wrongSet.has(word.id);
        }
        const { wrongSet } = loadCategoryWords(selectedCategory);
        return wrongSet.has(word.id);
    });
    
    if (wrongWordsInSession.length === 0) {
        showAlert('通知', '覚えていない単語はありません');
        showCategorySelection();
        return;
    }
    
    // 間違えた単語で学習を開始
    // selectedLearningMode === 'input'の場合は「眺めるだけ」のカードモードとしてinitLearningを呼ぶ
    setTimeout(() => {
        initLearning(selectedCategory, wrongWordsInSession, 0, wrongWordsInSession.length, 0);
    }, 350);
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
        
        // アウトプットモード（カードモード）のときはクリック不可
        if (currentLearningMode !== 'input') {
            segment.classList.add('progress-segment-disabled');
        }
        
        // 最後のセグメントの場合はフラッグマークを追加
        if (i === total - 1) {
            const flagSpan = document.createElement('span');
            flagSpan.className = 'progress-segment-number progress-segment-flag';
            flagSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="#ffffff"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>';
            segment.appendChild(flagSpan);
        }
        
        segment.addEventListener('click', () => {
            // アウトプットモード（カードモード）のときは移動できない
            if (currentLearningMode !== 'input') {
                return;
            }
            
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
                // currentLearningMode === 'input'の場合はカードモードとして表示
                if (isInputModeActive && currentLearningMode !== 'input') {
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
        
        // 回答状況に応じて色を設定（タイムアタックモードでも色をつける）
        if (questionStatus[segmentIndex] === 'correct') {
            segment.classList.add('correct');
        } else if (questionStatus[segmentIndex] === 'wrong') {
            segment.classList.add('wrong');
        }
        
        // 現在の問題をハイライト（タイムアタックモードのときは表示しない）
        // currentクラスを最後に追加して、correct/wrongと併用できるようにする
        if (!isTimeAttackMode && segmentIndex === currentQuestionIndex) {
            segment.classList.add('current');
        }
    });
    
    // 表示範囲のテキストを更新
    updateProgressRangeText(total);
}

// 進捗バーの表示範囲テキストと矢印ボタンの状態を更新
function updateProgressNavButtons(total) {
    // 表示範囲のテキストを更新
    updateProgressRangeText(total);
    
    // 矢印ボタンの表示/非表示と状態を更新
    const progressNavLeft = document.getElementById('progressNavLeft');
    const progressNavRight = document.getElementById('progressNavRight');
    
    if (progressNavLeft) {
        const canGoLeft = progressBarStartIndex > 0;
        progressNavLeft.style.display = canGoLeft ? 'flex' : 'none';
        progressNavLeft.disabled = !canGoLeft;
    }
    
    if (progressNavRight) {
        const canGoRight = progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT < total;
        progressNavRight.style.display = canGoRight ? 'flex' : 'none';
        progressNavRight.disabled = !canGoRight;
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

// 進捗バーを右にスクロール（次の20個へ）
function scrollProgressBarRight() {
    const total = currentRangeEnd - currentRangeStart;
    if (progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT < total) {
        // 20個ずつ次の範囲に移動
        progressBarStartIndex = progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT;
        createProgressSegments(total);
        updateProgressSegments(); // セグメントの色を更新
        updateNavButtons(); // ボタン状態を更新
    }
}

// カードスタックを更新（残り枚数に応じて表示）
function updateCardStack() {
    const remainingCards = currentRangeEnd - currentIndex;
    
    const stack1 = document.getElementById('cardStack1');
    const stack2 = document.getElementById('cardStack2');
    const stack3 = document.getElementById('cardStack3');
    const stack4 = document.getElementById('cardStack4');
    const stack5 = document.getElementById('cardStack5');
    
    if (stack1) {
        stack1.classList.toggle('hidden', remainingCards <= 1);
    }
    if (stack2) {
        stack2.classList.toggle('hidden', remainingCards <= 2);
    }
    if (stack3) {
        stack3.classList.toggle('hidden', remainingCards <= 3);
    }
    if (stack4) {
        stack4.classList.toggle('hidden', remainingCards <= 4);
    }
    if (stack5) {
        stack5.classList.toggle('hidden', remainingCards <= 5);
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
    
    // 進捗バーのセグメントを生成
    const container = document.getElementById('progressBarContainer');
    
    // totalが0より大きい場合、セグメントを生成
    if (total > 0 && container) {
        // 現在のインデックス（相対位置）
        const relativeIndex = currentIndex - currentRangeStart;
        
        // 現在のインデックスが表示範囲外に出たか確認
        const displayStart = progressBarStartIndex;
        const displayEnd = progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT;
        
        if (relativeIndex < displayStart || relativeIndex >= displayEnd) {
            // 現在のインデックスが含まれる範囲に切り替え
            progressBarStartIndex = Math.floor(relativeIndex / PROGRESS_BAR_DISPLAY_COUNT) * PROGRESS_BAR_DISPLAY_COUNT;
            // totalを超えないようにする
            progressBarStartIndex = Math.min(progressBarStartIndex, Math.max(0, total - 1));
            createProgressSegments(total);
        }
        
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
            const categories = ['小学生で習った単語とカテゴリー別に覚える単語', 'LEVEL1 超重要単語400', 'LEVEL2 重要単語300', 'LEVEL3 差がつく単語200', 'LEVEL4 私立高校入試レベル', 'LEVEL5 難関私立高校入試レベル'];
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
            
            // AI分析データ（苦手・要復習）もリセット
            wordStats = {};
            localStorage.removeItem(WORD_STATS_KEY);
            
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
    document.body.classList.add('sentence-mode-active');
    document.body.classList.remove('reorder-mode-active');
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
    if (elements.unitName) {
        // 入試得点力アップコースの場合はカテゴリー名を直接使用
        const scoreUpCategories = [
            '英文法中学３年間の総復習',
            '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
            '条件英作文特訓コース',
            '大阪C問題対策英単語タイムアタック',
            '大阪C問題対策 英作写経ドリル',
            '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】'
        ];
        let displayTitle;
        if (scoreUpCategories.includes(category)) {
            // 入試得点力アップコースの場合はカテゴリー名をそのまま使用
            displayTitle = category;
        } else {
            // その他の場合はコース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
            displayTitle = currentFilterCourseTitle || category;
        }
        elements.unitName.textContent = displayTitle;
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    
    // ハンバーガーメニューと戻るボタンを非表示、中断ボタンを表示
    updateHeaderButtons('learning');

    // インプットモード用戻るボタンと中断ボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitInterruptBtn = document.getElementById('unitInterruptBtn');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');
    if (unitInterruptBtn) unitInterruptBtn.classList.remove('hidden');

    // カードモード、入力モード、整序英作文モードを非表示、例文モードを表示
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const inputMode = document.getElementById('inputMode');
    const inputListView = document.getElementById('inputListView');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (inputListView) inputListView.classList.add('hidden');
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
    document.body.classList.add('reorder-mode-active');
    document.body.classList.remove('sentence-mode-active');
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
    if (elements.unitName) {
        // コース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
        const unitDisplayTitle = currentFilterCourseTitle || displayTitle;
        elements.unitName.textContent = unitDisplayTitle;
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    
    // ハンバーガーメニューと戻るボタンを非表示、中断ボタンを表示
    updateHeaderButtons('learning');

    // インプットモード用戻るボタンと中断ボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitInterruptBtn = document.getElementById('unitInterruptBtn');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');
    if (unitInterruptBtn) unitInterruptBtn.classList.remove('hidden');

    // 他のモードを非表示、整序英作文モードを表示
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const inputMode = document.getElementById('inputMode');
    const inputListView = document.getElementById('inputListView');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (inputListView) inputListView.classList.add('hidden');
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
    const targetIndex = blankBox.dataset.blankIndex;
    
    // 同じ空欄に同じ語をタップ/ドロップしただけなら何もしない（重複生成を防ぐ）
    if ((fromBlankIndex !== null && fromBlankIndex !== '' && fromBlankIndex === targetIndex)) {
        return;
    }
    
    // 既に単語が入っている場合は、その単語を元の場所に戻す
    const existingBox = blankBox.querySelector('.reorder-answer-box');
    if (existingBox) {
        if (existingBox.dataset.word === word) {
            // 同一語を同じ空欄に重ねる場合は変更なし
            return;
        }
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
    const targetIndex = blankBox.dataset.blankIndex;
    if (!word) return;
    
    // 同じ空欄に同じ語をドロップしただけなら何もしない（重複生成を防ぐ）
    if (fromBlankIndex && fromBlankIndex === targetIndex) {
        return;
    }
    
    // 既に単語が入っている場合は、その単語を元の場所に戻す
    const existingBox = blankBox.querySelector('.reorder-answer-box');
    if (existingBox) {
        if (existingBox.dataset.word === word) {
            // 同一語を同じ空欄に重ねる場合は変更なし
            return;
        }
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

// 英文法中学３年間の総復習 目次ページを表示
function showGrammarTableOfContents() {
    // カテゴリー選択画面を非表示
    if (elements.categorySelection) {
        elements.categorySelection.classList.add('hidden');
    }
    
    // コース選択画面を非表示
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    
    // 目次ページを表示
    const grammarTOCView = document.getElementById('grammarTableOfContentsView');
    if (grammarTOCView) {
        grammarTOCView.classList.remove('hidden');
    }
    
    // スクロール位置をトップに戻す
    window.scrollTo(0, 0);
    
    
    // 左上のタイトルを更新
    if (elements.unitName) {
        elements.unitName.textContent = '中学３年間の英文法';
    }
    
    // ハンバーガーメニューを非表示、戻るボタンを表示、中断ボタンを非表示
    updateHeaderButtons('back');
    
    // 各章のチェックボタンの状態を更新
    updateGrammarChapterCheckboxes();
}

// 各章のチェックボタンの状態を更新
function updateGrammarChapterCheckboxes() {
    // すべての章のチェックボタンを取得
    document.querySelectorAll('.chapter-checkbox').forEach(checkbox => {
        const chapterNumber = parseInt(checkbox.dataset.chapter, 10);
        if (isGrammarChapterCompleted(chapterNumber)) {
            checkbox.classList.add('completed');
        } else {
            checkbox.classList.remove('completed');
        }
    });
}

// 章が完了しているかチェック
function isGrammarChapterCompleted(chapterNumber) {
    // localStorageから進捗を取得
    const progressKey = `grammar-chapter-${chapterNumber}-progress`;
    const progress = localStorage.getItem(progressKey);
    if (!progress) return false;
    
    try {
        const progressData = JSON.parse(progress);
        // 章のデータを取得
        let chapterData = null;
        if (typeof grammarData !== 'undefined' && grammarData) {
            chapterData = grammarData.find(data => data.chapter === chapterNumber);
        }
        if (!chapterData) return false;
        
        // セクション構造がある場合
        if (chapterData.sections && chapterData.sections.length > 0) {
            // すべてのセクションのすべての問題が正解しているかチェック
            for (let sectionIndex = 0; sectionIndex < chapterData.sections.length; sectionIndex++) {
                const section = chapterData.sections[sectionIndex];
                if (section.exercises && section.exercises.length > 0) {
                    for (let exerciseIndex = 0; exerciseIndex < section.exercises.length; exerciseIndex++) {
                        const exerciseKey = `${chapterNumber}-section${sectionIndex}-ex${exerciseIndex}`;
                        if (!progressData[exerciseKey] || !progressData[exerciseKey].allCorrect) {
                            return false;
                        }
                    }
                }
            }
            return true;
        } else {
            // 従来の構造の場合
            if (chapterData.exercises && chapterData.exercises.length > 0) {
                for (let exerciseIndex = 0; exerciseIndex < chapterData.exercises.length; exerciseIndex++) {
                    const exerciseKey = `${chapterNumber}-${exerciseIndex}`;
                    if (!progressData[exerciseKey] || !progressData[exerciseKey].allCorrect) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

// 英文法解説ページを表示
function showGrammarChapter(chapterNumber) {
    // 現在の章番号を設定
    currentGrammarChapterNumber = chapterNumber;
    
    // 状態変数をリセット
    grammarExerciseBlanks = [];
    grammarExerciseAnswerSubmitted = {};
    grammarRedoButtons = {};
    currentGrammarSelectedBlankIndex = -1;
    currentGrammarSelectedExerciseIndex = -1;
    currentGrammarExerciseIndex = -1;
    currentGrammarExercises = [];
    
    // 目次ページを非表示
    const grammarTOCView = document.getElementById('grammarTableOfContentsView');
    if (grammarTOCView) {
        grammarTOCView.classList.add('hidden');
    }
    
    // 解説ページを表示
    const grammarChapterView = document.getElementById('grammarChapterView');
    if (grammarChapterView) {
        grammarChapterView.classList.remove('hidden');
    }
    
    // スクロール位置をトップに戻す
    window.scrollTo(0, 0);
    
    // キーボードを非表示に
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        keyboard.classList.add('hidden');
    }
    
    // grammarDataから該当する章のデータを取得
    let chapterData = null;
    if (typeof grammarData !== 'undefined' && grammarData) {
        chapterData = grammarData.find(data => data.chapter === chapterNumber);
    }
    
    
    // 左上のタイトルを更新
    if (elements.unitName) {
        if (chapterData && chapterData.title) {
            elements.unitName.textContent = chapterData.title;
        } else {
            elements.unitName.textContent = `第${chapterNumber}章`;
        }
    }
    
    // ハンバーガーメニューを非表示、戻るボタンを表示、中断ボタンを非表示
    updateHeaderButtons('back');
    
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);
    
    // 章のタイトルを設定
    const chapterTitleEl = document.getElementById('grammarChapterTitle');
    if (chapterTitleEl) {
        if (chapterData && chapterData.title) {
            chapterTitleEl.textContent = chapterData.title;
        } else {
            chapterTitleEl.textContent = `第${chapterNumber}章`;
        }
    }
    
    // 解説内容を設定
    const chapterContentEl = document.getElementById('grammarChapterContent');
    if (chapterContentEl) {
        if (chapterData && chapterData.explanation) {
            // HTML形式で保存されている場合はそのまま、テキストの場合は段落タグで囲む
            chapterContentEl.innerHTML = chapterData.explanation || '<p>解説を準備中です。</p>';
        } else {
            chapterContentEl.innerHTML = '<p>解説を準備中です。</p>';
        }
    }
    
    // セクション構造がある場合はセクションを表示、ない場合は従来の表示
    const sectionsContainer = document.getElementById('grammarSectionsContainer');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = '';
        
        if (chapterData && chapterData.sections && chapterData.sections.length > 0) {
            // セクション構造で表示
            chapterData.sections.forEach((section, sectionIndex) => {
                displayGrammarSection(section, sectionIndex);
            });
            // すべてのセクションを表示した後、キーボードを設定（最後に1回だけ）
            setupGrammarExerciseKeyboard();
            // キーボードを初期状態で非表示
            const keyboard = document.getElementById('grammarExerciseKeyboard');
            if (keyboard) {
                keyboard.classList.add('hidden');
            }
        } else {
            // 従来の構造（POINTと演習問題を1つずつ表示）
            const grammarExerciseSection = document.getElementById('grammarExerciseSection');
            if (grammarExerciseSection) {
                grammarExerciseSection.style.display = 'block';
            }
            
            // POINTボックスを設定
            const pointContentEl = document.getElementById('grammarPointContent');
            if (pointContentEl) {
                if (chapterData && chapterData.point) {
                    pointContentEl.innerHTML = chapterData.point || '<p>POINTを準備中です。</p>';
                } else {
                    pointContentEl.innerHTML = '<p>POINTを準備中です。</p>';
                }
            }
            
            // 演習問題を設定
            if (chapterData && chapterData.exercises && chapterData.exercises.length > 0) {
                currentGrammarExercises = chapterData.exercises;
                displayAllGrammarExercises(chapterData.exercises);
            } else {
                currentGrammarExercises = [];
                const exerciseContentEl = document.getElementById('grammarExerciseContent');
                if (exerciseContentEl) {
                    exerciseContentEl.innerHTML = '<p>演習問題を準備中です。</p>';
                }
            }
        }
    }
}

// 文法セクションを表示
function displayGrammarSection(section, sectionIndex) {
    const sectionsContainer = document.getElementById('grammarSectionsContainer');
    if (!sectionsContainer) return;
    
    // セクションコンテナを作成
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'grammar-section';
    sectionDiv.dataset.sectionIndex = sectionIndex;
    
    // セクションタイトル（青背景の四角に数字、その横にタイトル）
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'grammar-section-title';
    const sectionNumber = document.createElement('span');
    sectionNumber.className = 'grammar-section-number';
    sectionNumber.textContent = sectionIndex + 1;
    sectionTitle.appendChild(sectionNumber);
    const sectionTitleText = document.createElement('span');
    sectionTitleText.className = 'grammar-section-title-text';
    sectionTitleText.textContent = section.title || '';
    sectionTitle.appendChild(sectionTitleText);
    sectionDiv.appendChild(sectionTitle);
    
    // POINTボックス
    if (section.point) {
        const pointBox = document.createElement('div');
        pointBox.className = 'grammar-point-box';
        const pointLabel = document.createElement('div');
        pointLabel.className = 'grammar-point-label';
        pointLabel.textContent = 'POINT';
        pointBox.appendChild(pointLabel);
        const pointContent = document.createElement('div');
        pointContent.className = 'grammar-point-content';
        pointContent.innerHTML = section.point;
        pointBox.appendChild(pointContent);
        sectionDiv.appendChild(pointBox);
    }
    
    // 演習問題セクション
    if (section.exercises && section.exercises.length > 0) {
        const exerciseSection = document.createElement('div');
        exerciseSection.className = 'grammar-exercise-section';
        const exerciseTitle = document.createElement('h3');
        exerciseTitle.className = 'grammar-exercise-title';
        exerciseTitle.textContent = '演習問題';
        exerciseSection.appendChild(exerciseTitle);
        const exerciseContent = document.createElement('div');
        exerciseContent.className = 'grammar-exercise-content';
        exerciseContent.dataset.sectionIndex = sectionIndex;
        exerciseSection.appendChild(exerciseContent);
        sectionDiv.appendChild(exerciseSection);
        
        // 演習問題を表示
        displayGrammarSectionExercises(section.exercises, sectionIndex, exerciseContent);
    }
    
    sectionsContainer.appendChild(sectionDiv);
}

// セクションの演習問題を表示
function displayGrammarSectionExercises(exercises, sectionIndex, exerciseContentEl) {
    if (!exerciseContentEl) return;
    
    // このセクション用の状態をクリア（念のため）
    // 注意: showGrammarChapterの最初で全体をリセットしているので、これは冗長だが安全のため
    
    exercises.forEach((exercise, exerciseIndex) => {
        // グローバルなインデックスを計算（セクションごとに連番を振る）
        const globalExerciseIndex = `${sectionIndex}-${exerciseIndex}`;
        
        // 問題のコンテナを作成
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'grammar-exercise-item';
        exerciseItem.dataset.exerciseIndex = globalExerciseIndex;
        exerciseItem.dataset.sectionIndex = sectionIndex;
        exerciseItem.dataset.localIndex = exerciseIndex;
        exerciseItem.dataset.exerciseData = JSON.stringify(exercise); // 問題データを保持
        
        // 問題番号
        const exerciseNumber = document.createElement('div');
        exerciseNumber.className = 'grammar-exercise-item-number';
        exerciseNumber.textContent = `問題 ${exerciseIndex + 1}`;
        exerciseItem.appendChild(exerciseNumber);
        
        // 日本語訳
        const japaneseEl = document.createElement('div');
        japaneseEl.className = 'sentence-japanese';
        japaneseEl.textContent = exercise.japanese;
        exerciseItem.appendChild(japaneseEl);
        
        // 英文を構築（空所を含む）
        const englishEl = document.createElement('div');
        englishEl.className = 'sentence-english';
        englishEl.dataset.exerciseIndex = globalExerciseIndex;
        englishEl.dataset.sectionIndex = sectionIndex;
        englishEl.dataset.localIndex = exerciseIndex;
        
        const exerciseBlanks = [];
        const words = exercise.english.split(' ');
        
        words.forEach((word, idx) => {
            const wordWithoutPunct = word.replace(/[.,!?]/g, '');
            const blankInfo = exercise.blanks.find(b => b.word.toLowerCase() === wordWithoutPunct.toLowerCase());
            
            if (blankInfo) {
                const blankSpan = document.createElement('span');
                blankSpan.className = 'sentence-blank';
                blankSpan.dataset.blankIndex = blankInfo.index;
                blankSpan.dataset.exerciseIndex = globalExerciseIndex;
                blankSpan.dataset.sectionIndex = sectionIndex;
                blankSpan.dataset.localIndex = exerciseIndex;
                blankSpan.textContent = ' '.repeat(blankInfo.word.length);
                blankSpan.dataset.correctWord = blankInfo.word;
                
                const charWidth = 14;
                const padding = 24;
                const extraSpace = 8;
                const calculatedWidth = Math.max(60, (blankInfo.word.length * charWidth) + padding + extraSpace);
                blankSpan.style.width = `${calculatedWidth}px`;
                
                englishEl.appendChild(blankSpan);
                
                exerciseBlanks.push({
                    index: blankInfo.index,
                    word: blankInfo.word,
                    userInput: '',
                    element: blankSpan,
                    exerciseIndex: globalExerciseIndex,
                    sectionIndex: sectionIndex,
                    localIndex: exerciseIndex
                });
            } else {
                const partSpan = document.createElement('span');
                partSpan.className = 'sentence-part';
                partSpan.textContent = word + (idx < words.length - 1 ? ' ' : '');
                englishEl.appendChild(partSpan);
            }
        });
        
        exerciseBlanks.sort((a, b) => a.index - b.index);
        
        // 空所にタップイベントを追加
        exerciseBlanks.forEach(blank => {
            const isMobile = window.innerWidth <= 600;
            const charWidth = isMobile ? 12 : 14;
            const padding = isMobile ? 12 : 24;
            const extraSpace = isMobile ? 4 : 8;
            const calculatedWidth = Math.max(isMobile ? 50 : 60, (blank.word.length * charWidth) + padding + extraSpace);
            blank.element.style.width = `${calculatedWidth}px`;
            
            blank.element.addEventListener('click', () => {
                if (grammarExerciseAnswerSubmitted[globalExerciseIndex]) return;
                selectGrammarExerciseBlank(blank.index, globalExerciseIndex);
                // キーボードを表示
                const keyboard = document.getElementById('grammarExerciseKeyboard');
                if (keyboard) {
                    keyboard.classList.remove('hidden');
                }
            });
        });
        
        grammarExerciseBlanks.push({
            exerciseIndex: globalExerciseIndex,
            sectionIndex: sectionIndex,
            localIndex: exerciseIndex,
            blanks: exerciseBlanks
        });
        
        exerciseItem.appendChild(englishEl);
        
        // 解きなおすボタン（初期は非表示）
        const redoBtn = document.createElement('button');
        redoBtn.className = 'grammar-exercise-redo-btn hidden';
        redoBtn.textContent = '解きなおす';
        redoBtn.dataset.exerciseIndex = globalExerciseIndex;
        redoBtn.addEventListener('click', () => resetGrammarExercise(globalExerciseIndex));
        exerciseItem.appendChild(redoBtn);
        grammarRedoButtons[globalExerciseIndex] = redoBtn;
        
        exerciseContentEl.appendChild(exerciseItem);
    });
    
    // キーボードを初期状態で非表示（空欄タップ時に表示）
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        keyboard.classList.add('hidden');
    }
}

// 英文法演習問題を表示（すべての問題を縦に並べて表示）
let currentGrammarExerciseIndex = -1; // 現在選択中の問題のインデックス
let currentGrammarExercises = [];
let grammarExerciseBlanks = []; // 各問題の空所データを保持 {exerciseIndex: 0, blanks: [...]}
let grammarExerciseAnswerSubmitted = {}; // 各問題の採点済みフラグ {exerciseIndex: true/false}
let currentGrammarSelectedBlankIndex = -1;
let currentGrammarSelectedExerciseIndex = -1; // 現在選択中の問題のインデックス
let grammarKeyboardOutsideHandlerAttached = false;
let grammarRedoButtons = {}; // 各問題の解きなおすボタンを保持
let currentGrammarChapterNumber = -1; // 現在表示中の章番号

// すべての問題を表示
function displayAllGrammarExercises(exercises) {
    const exerciseContentEl = document.getElementById('grammarExerciseContent');
    if (!exerciseContentEl) return;
    
    exerciseContentEl.innerHTML = '';
    grammarExerciseBlanks = [];
    grammarExerciseAnswerSubmitted = {};
    currentGrammarSelectedBlankIndex = -1;
    currentGrammarSelectedExerciseIndex = -1;
    grammarRedoButtons = {};
    
    exercises.forEach((exercise, exerciseIndex) => {
        // 問題のコンテナを作成
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'grammar-exercise-item';
        exerciseItem.dataset.exerciseIndex = exerciseIndex;
        exerciseItem.dataset.exerciseData = JSON.stringify(exercise); // 問題データを保持
        
        // 問題番号
        const exerciseNumber = document.createElement('div');
        exerciseNumber.className = 'grammar-exercise-item-number';
        exerciseNumber.textContent = `問題 ${exerciseIndex + 1}`;
        exerciseItem.appendChild(exerciseNumber);
        
        // 日本語訳
        const japaneseEl = document.createElement('div');
        japaneseEl.className = 'sentence-japanese';
        japaneseEl.textContent = exercise.japanese;
        exerciseItem.appendChild(japaneseEl);
        
        // 英文を構築（空所を含む）
        const englishEl = document.createElement('div');
        englishEl.className = 'sentence-english';
        englishEl.dataset.exerciseIndex = exerciseIndex;
        
        const exerciseBlanks = [];
        const words = exercise.english.split(' ');
        
        words.forEach((word, idx) => {
            const wordWithoutPunct = word.replace(/[.,!?]/g, '');
            const blankInfo = exercise.blanks.find(b => b.word.toLowerCase() === wordWithoutPunct.toLowerCase());
            
            if (blankInfo) {
                const blankSpan = document.createElement('span');
                blankSpan.className = 'sentence-blank';
                blankSpan.dataset.blankIndex = blankInfo.index;
                blankSpan.dataset.exerciseIndex = exerciseIndex;
                blankSpan.textContent = ' '.repeat(blankInfo.word.length);
                blankSpan.dataset.correctWord = blankInfo.word;
                
                const charWidth = 14;
                const padding = 24;
                const extraSpace = 8;
                const calculatedWidth = Math.max(60, (blankInfo.word.length * charWidth) + padding + extraSpace);
                blankSpan.style.width = `${calculatedWidth}px`;
                
                englishEl.appendChild(blankSpan);
                
                exerciseBlanks.push({
                    index: blankInfo.index,
                    word: blankInfo.word,
                    userInput: '',
                    element: blankSpan,
                    exerciseIndex: exerciseIndex
                });
            } else {
                const partSpan = document.createElement('span');
                partSpan.className = 'sentence-part';
                partSpan.textContent = word + (idx < words.length - 1 ? ' ' : '');
                englishEl.appendChild(partSpan);
            }
        });
        
        exerciseBlanks.sort((a, b) => a.index - b.index);
        
        // 空所にタップイベントを追加
        exerciseBlanks.forEach(blank => {
            const isMobile = window.innerWidth <= 600;
            const charWidth = isMobile ? 12 : 14;
            const padding = isMobile ? 12 : 24;
            const extraSpace = isMobile ? 4 : 8;
            const calculatedWidth = Math.max(isMobile ? 50 : 60, (blank.word.length * charWidth) + padding + extraSpace);
            blank.element.style.width = `${calculatedWidth}px`;
            
            blank.element.addEventListener('click', () => {
                if (grammarExerciseAnswerSubmitted[exerciseIndex]) return;
                selectGrammarExerciseBlank(blank.index, exerciseIndex);
                // キーボードを表示
                const keyboard = document.getElementById('grammarExerciseKeyboard');
                if (keyboard) {
                    keyboard.classList.remove('hidden');
                }
            });
        });
        
        grammarExerciseBlanks.push({
            exerciseIndex: exerciseIndex,
            blanks: exerciseBlanks
        });
        
        exerciseItem.appendChild(englishEl);
        
        // 解きなおすボタン（初期は非表示）
        const redoBtn = document.createElement('button');
        redoBtn.className = 'keyboard-action-btn grammar-exercise-redo-btn hidden';
        redoBtn.textContent = '解きなおす';
        redoBtn.dataset.exerciseIndex = exerciseIndex;
        redoBtn.addEventListener('click', () => resetGrammarExercise(exerciseIndex));
        exerciseItem.appendChild(redoBtn);
        grammarRedoButtons[exerciseIndex] = redoBtn;
        
        exerciseContentEl.appendChild(exerciseItem);
    });
    
    // キーボードを初期状態で非表示（空欄タップ時に表示）
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        keyboard.classList.add('hidden');
    }
    
    // キーボードを設定
    setupGrammarExerciseKeyboard();
}

// 旧関数（互換性のため残すが使用しない）
function displayGrammarExercise(exercise, index, total) {
    if (!exercise) return;
    
    grammarExerciseAnswerSubmitted = false;
    currentGrammarSelectedBlankIndex = -1;
    currentGrammarExerciseIndex = index;
    
    // ヒントを非表示にリセット
    const hintContent = document.getElementById('grammarExerciseHintContent');
    const hintBtn = document.getElementById('grammarExerciseHintBtn');
    if (hintContent) {
        hintContent.classList.add('hidden');
    }
    if (hintBtn) {
        const arrowElement = hintBtn.querySelector('.hint-arrow');
        if (arrowElement) {
            arrowElement.textContent = '▶';
        }
    }
    
    // 日本語訳を表示
    const japaneseEl = document.getElementById('grammarExerciseJapanese');
    if (japaneseEl) {
        japaneseEl.textContent = exercise.japanese;
    }
    
    // 英文を構築（空所を含む）
    const englishEl = document.getElementById('grammarExerciseEnglish');
    if (englishEl) {
        englishEl.innerHTML = '';
        grammarExerciseBlanks = [];
        
        // 英文を単語に分割し、空所の位置を特定
        const words = exercise.english.split(' ');
        
        words.forEach((word, idx) => {
            // 句読点を除去した単語で比較
            const wordWithoutPunct = word.replace(/[.,!?]/g, '');
            // 空所かどうかを判定（blanks配列に含まれているか）
            const blankInfo = exercise.blanks.find(b => b.word.toLowerCase() === wordWithoutPunct.toLowerCase());
            
            if (blankInfo) {
                // 空所を作成
                const blankSpan = document.createElement('span');
                blankSpan.className = 'sentence-blank';
                blankSpan.dataset.blankIndex = blankInfo.index;
                blankSpan.textContent = ' '.repeat(blankInfo.word.length);
                blankSpan.dataset.correctWord = blankInfo.word;
                
                // 単語の長さに応じて幅を計算
                const charWidth = 14;
                const padding = 24;
                const extraSpace = 8;
                const calculatedWidth = Math.max(60, (blankInfo.word.length * charWidth) + padding + extraSpace);
                blankSpan.style.width = `${calculatedWidth}px`;
                
                englishEl.appendChild(blankSpan);
                
                grammarExerciseBlanks.push({
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
        grammarExerciseBlanks.sort((a, b) => a.index - b.index);
        
        // 空所にタップイベントを追加
        grammarExerciseBlanks.forEach(blank => {
            const isMobile = window.innerWidth <= 600;
            const charWidth = isMobile ? 12 : 14;
            const padding = isMobile ? 12 : 24;
            const extraSpace = isMobile ? 4 : 8;
            const calculatedWidth = Math.max(isMobile ? 50 : 60, (blank.word.length * charWidth) + padding + extraSpace);
            blank.element.style.width = `${calculatedWidth}px`;
            
            blank.element.addEventListener('click', () => {
                if (grammarExerciseAnswerSubmitted) return;
                selectGrammarExerciseBlank(blank.index);
                // キーボードを表示
                const keyboard = document.getElementById('grammarExerciseKeyboard');
                if (keyboard) {
                    keyboard.classList.remove('hidden');
                }
            });
        });
    }
    
    // ヒントを設定
    if (exercise.hint && hintContent) {
        hintContent.textContent = exercise.hint;
    }
    
    // キーボードを初期状態で非表示にする
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        keyboard.classList.add('hidden');
    }
    
    // キーボードを設定
    setupGrammarExerciseKeyboard();
}

// 演習問題の空所を選択
function selectGrammarExerciseBlank(blankIndex, exerciseIndex) {
    currentGrammarSelectedBlankIndex = blankIndex;
    currentGrammarSelectedExerciseIndex = exerciseIndex;
    
    // すべての空所から選択状態を削除
    grammarExerciseBlanks.forEach(exerciseData => {
        exerciseData.blanks.forEach(blank => {
            blank.element.classList.remove('selected');
        });
    });
    
    // 選択された空所にクラスを追加
    const exerciseData = grammarExerciseBlanks.find(e => e.exerciseIndex === exerciseIndex);
    if (exerciseData) {
        const selectedBlank = exerciseData.blanks.find(b => b.index === blankIndex);
        if (selectedBlank) {
            selectedBlank.element.classList.add('selected');
        }
    }
}

// 演習問題に文字を入力
function insertGrammarExerciseLetter(letter) {
    if (currentGrammarSelectedBlankIndex === -1 || currentGrammarSelectedExerciseIndex === -1) return;
    
    const exerciseData = grammarExerciseBlanks.find(e => e.exerciseIndex === currentGrammarSelectedExerciseIndex);
    if (!exerciseData) return;
    
    const selectedBlank = exerciseData.blanks.find(b => b.index === currentGrammarSelectedBlankIndex);
    if (!selectedBlank) return;
    
    selectedBlank.userInput += letter;
    selectedBlank.element.textContent = selectedBlank.userInput + ' '.repeat(Math.max(0, selectedBlank.word.length - selectedBlank.userInput.length));
}

// 演習問題のバックスペース
function handleGrammarExerciseBackspace() {
    if (currentGrammarSelectedBlankIndex === -1 || currentGrammarSelectedExerciseIndex === -1) return;
    
    const exerciseData = grammarExerciseBlanks.find(e => e.exerciseIndex === currentGrammarSelectedExerciseIndex);
    if (!exerciseData) return;
    
    const selectedBlank = exerciseData.blanks.find(b => b.index === currentGrammarSelectedBlankIndex);
    if (!selectedBlank || selectedBlank.userInput.length === 0) return;
    
    selectedBlank.userInput = selectedBlank.userInput.slice(0, -1);
    selectedBlank.element.textContent = selectedBlank.userInput + ' '.repeat(Math.max(0, selectedBlank.word.length - selectedBlank.userInput.length));
}

// 解きなおす：入力と状態をリセット
function resetGrammarExercise(exerciseIndex) {
    const exerciseData = grammarExerciseBlanks.find(e => e.exerciseIndex === exerciseIndex);
    if (!exerciseData) return;
    const exerciseItem = document.querySelector(`.grammar-exercise-item[data-exercise-index="${exerciseIndex}"]`);
    const redoBtn = grammarRedoButtons[exerciseIndex];

    // 状態リセット
    grammarExerciseAnswerSubmitted[exerciseIndex] = false;
    currentGrammarSelectedBlankIndex = -1;
    currentGrammarSelectedExerciseIndex = -1;

    // 入力と表示リセット
    exerciseData.blanks.forEach(blank => {
        blank.userInput = '';
        blank.element.textContent = ' '.repeat(blank.word.length);
        blank.element.classList.remove('correct', 'wrong', 'selected');
    });

    // 解説を非表示に戻す
    if (exerciseItem) {
        const explanationEl = exerciseItem.querySelector('.exercise-explanation');
        if (explanationEl) {
            explanationEl.remove();
        }
    }

    // 解きなおすボタンを隠す
    if (redoBtn) {
        redoBtn.classList.add('hidden');
    }

    // キーボードを閉じる
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        keyboard.classList.add('hidden');
    }
}

// 演習問題用キーボード設定
function setupGrammarExerciseKeyboard() {
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (!keyboard) return;
    
    // 既存のイベントリスナーを削除するために、キーボードをクローンして置き換える
    const keyboardClone = keyboard.cloneNode(true);
    keyboard.parentNode.replaceChild(keyboardClone, keyboard);
    const newKeyboard = document.getElementById('grammarExerciseKeyboard');
    
    // Shift状態を保持する変数
    let isShift = false;
    
    // Shiftキー
    const shiftKey = document.getElementById('grammarExerciseKeyboardShift');
    if (shiftKey) {
        const handleShift = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isShift = !isShift;
            shiftKey.dataset.shift = isShift.toString();
            updateGrammarExerciseKeyboardCase(newKeyboard, isShift);
        };
        shiftKey.addEventListener('touchstart', handleShift, { passive: false });
        shiftKey.addEventListener('click', handleShift);
    }
    
    // Shift状態を解除する関数
    const resetShiftState = () => {
        if (isShift) {
            isShift = false;
            if (shiftKey) {
                shiftKey.dataset.shift = 'false';
                updateGrammarExerciseKeyboardCase(newKeyboard, false);
            }
        }
    };
    
    // キーボードキーのイベント
    newKeyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const letter = key.dataset.key;
        
        if (letter === ' ') {
            const handleSpace = (e) => {
                e.preventDefault();
                e.stopPropagation();
                insertGrammarExerciseLetter(' ');
            };
            key.addEventListener('touchstart', handleSpace, { passive: false });
            key.addEventListener('click', handleSpace);
        } else if (key.dataset.shiftKey) {
            // アポストロフィ/アンダーバーキー
            const handleApostrophe = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Shift状態を再確認
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = currentShift ? key.dataset.shiftKey : letter;
                insertGrammarExerciseLetter(charToInsert);
            };
            key.addEventListener('touchstart', handleApostrophe, { passive: false });
            key.addEventListener('click', handleApostrophe);
        } else {
            const handleLetter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Shift状態を再確認して大文字・小文字を切り替え
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = (currentShift && letter.match(/[a-z]/)) ? letter.toUpperCase() : letter;
                insertGrammarExerciseLetter(charToInsert);
                // 大文字を入力した場合は、自動的にShift状態を解除
                if (currentShift && letter.match(/[a-z]/) && charToInsert === letter.toUpperCase()) {
                    resetShiftState();
                }
            };
            key.addEventListener('touchstart', handleLetter, { passive: false });
            key.addEventListener('click', handleLetter);
        }
    });
    
    // バックスペースキー
    const backspaceKey = document.getElementById('grammarExerciseKeyboardBackspace');
    if (backspaceKey) {
        const handleBackspace = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGrammarExerciseBackspace();
        };
        backspaceKey.addEventListener('touchstart', handleBackspace, { passive: false });
        backspaceKey.addEventListener('click', handleBackspace);
    }
    
    // 採点キー（キーボード内）
    const decideKey = document.getElementById('grammarExerciseKeyboardDecide');
    if (decideKey) {
        const handleDecide = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentGrammarSelectedExerciseIndex !== -1) {
                submitGrammarExerciseAnswer(currentGrammarSelectedExerciseIndex);
            }
        };
        decideKey.addEventListener('touchstart', handleDecide, { passive: false });
        decideKey.addEventListener('click', handleDecide);
    }

    // キーボード外クリックで閉じる（1回だけ登録）
    if (!grammarKeyboardOutsideHandlerAttached) {
        document.addEventListener('click', (e) => {
            const kb = document.getElementById('grammarExerciseKeyboard');
            if (!kb || kb.classList.contains('hidden')) return;
            const isKeyboard = kb.contains(e.target);
            const isBlank = e.target.classList && e.target.classList.contains('sentence-blank');
            if (!isKeyboard && !isBlank) {
                kb.classList.add('hidden');
                currentGrammarSelectedBlankIndex = -1;
                currentGrammarSelectedExerciseIndex = -1;
            }
        });
        grammarKeyboardOutsideHandlerAttached = true;
    }
}

// 演習問題のキーボードの大文字・小文字を更新
function updateGrammarExerciseKeyboardCase(keyboard, isShift) {
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const keyValue = key.dataset.key;
        if (keyValue && keyValue.length === 1 && keyValue.match(/[a-z]/)) {
            key.textContent = isShift ? keyValue.toUpperCase() : keyValue;
        }
        // アポストロフィ/アンダーバーの切り替え
        if (key.dataset.shiftKey) {
            key.textContent = isShift ? key.dataset.shiftKey : key.dataset.key;
        }
    });
}

// 演習問題の解答を提出
function submitGrammarExerciseAnswer(exerciseIndex) {
    if (grammarExerciseAnswerSubmitted[exerciseIndex]) return;
    
    const exerciseData = grammarExerciseBlanks.find(e => e.exerciseIndex === exerciseIndex);
    if (!exerciseData) return;
    const exerciseItem = document.querySelector(`.grammar-exercise-item[data-exercise-index="${exerciseIndex}"]`);
    
    // 問題データを取得（セクション構造の場合はdata-exercise-dataから、従来の場合はcurrentGrammarExercisesから）
    let exercise = null;
    if (exerciseItem && exerciseItem.dataset.exerciseData) {
        exercise = JSON.parse(exerciseItem.dataset.exerciseData);
    } else if (currentGrammarExercises && currentGrammarExercises[exerciseIndex]) {
        exercise = currentGrammarExercises[exerciseIndex];
    }
    
    const redoBtn = grammarRedoButtons[exerciseIndex];
    
    let allCorrect = true;
    exerciseData.blanks.forEach(blank => {
        // 大文字・小文字を区別して比較
        const isCorrect = blank.userInput.trim() === blank.word;
        if (isCorrect) {
            blank.element.classList.add('correct');
            blank.element.classList.remove('wrong', 'selected');
        } else {
            blank.element.classList.add('wrong');
            blank.element.classList.remove('correct', 'selected');
            allCorrect = false;
        }
    });
    
    grammarExerciseAnswerSubmitted[exerciseIndex] = true;
    
    // キーボードを非表示にする
    const keyboard = document.getElementById('grammarExerciseKeyboard');
    if (keyboard) {
        // 常時表示とするため非表示にはしない
        keyboard.classList.remove('hidden');
    }
    
    // 選択状態をリセット
    currentGrammarSelectedBlankIndex = -1;
    currentGrammarSelectedExerciseIndex = -1;
    
    // 解説の表示
    if (exerciseItem) {
        let explanationEl = exerciseItem.querySelector('.exercise-explanation');
        if (!explanationEl) {
            explanationEl = document.createElement('div');
            explanationEl.className = 'exercise-explanation';
            exerciseItem.appendChild(explanationEl);
        }
        const explanationText = exercise && exercise.explanation ? exercise.explanation : '解説を準備中です。';
        explanationEl.textContent = explanationText;

        // 解説の直下に「解きなおす」を移動
        if (redoBtn) {
            explanationEl.insertAdjacentElement('afterend', redoBtn);
        }
    }

    // 間違いがあれば「解きなおす」を表示
    if (!allCorrect && redoBtn) {
        redoBtn.classList.remove('hidden');
    }
    
    // 進捗を保存
    if (currentGrammarChapterNumber > 0) {
        saveGrammarExerciseProgress(currentGrammarChapterNumber, exerciseIndex, allCorrect, exerciseItem);
    }
}

// 文法問題の進捗を保存
function saveGrammarExerciseProgress(chapterNumber, exerciseIndex, allCorrect, exerciseItem) {
    const progressKey = `grammar-chapter-${chapterNumber}-progress`;
    let progress = {};
    try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            progress = JSON.parse(saved);
        }
    } catch (e) {
        progress = {};
    }
    
    // 問題のキーを生成（セクション構造の場合はsectionIndexとexerciseIndexを含む）
    let exerciseKey = '';
    if (exerciseItem && exerciseItem.dataset.sectionIndex !== undefined) {
        const sectionIndex = exerciseItem.dataset.sectionIndex;
        const localIndex = exerciseItem.dataset.localIndex;
        exerciseKey = `${chapterNumber}-section${sectionIndex}-ex${localIndex}`;
    } else {
        // 従来の構造の場合
        exerciseKey = `${chapterNumber}-${exerciseIndex}`;
    }
    
    // 進捗を保存
    progress[exerciseKey] = {
        allCorrect: allCorrect,
        timestamp: Date.now()
    };
    
    localStorage.setItem(progressKey, JSON.stringify(progress));
    
    // 章が完了したかチェックして、目次ページのチェックボタンを更新
    if (isGrammarChapterCompleted(chapterNumber)) {
        // 目次ページが表示されている場合は、チェックボタンを更新
        const grammarTOCView = document.getElementById('grammarTableOfContentsView');
        if (grammarTOCView && !grammarTOCView.classList.contains('hidden')) {
            updateGrammarChapterCheckboxes();
        }
    }
}

// 大阪府公立入試クイズ機能
const EXAM_QUIZ_QUESTIONS = [
    {
        question: "大阪府公立高校入試の英語には、何種類の問題がありますか？",
        choices: ["1種類","2種類", "3種類", "4種類"],
        correct: 1,
        explanation: "大阪府公立高校入試の英語には、A問題（基礎的問題）、B問題（標準的問題）、C問題（発展的問題）の3種類があります。"
    },
    {
        question: "B問題（標準的問題）の筆記試験の出題傾向について、正しいものはどれですか？",
        choices: ["文法と長文をバランスよく問う", "長文の出題がメインであり、文法問題だけの独立した大問はない。"],
        correct: 1,
        explanation: "どの問題を実施するかは、各高等学校の校長が選択します。志望校がどの問題を採用しているか確認しましょう。"
    },
    {
        question: "A問題の特徴として正しいものはどれですか？",
        choices: ["長文読解が中心", "基礎的な英語力を問う", "英作文が多い", "リスニングのみ"],
        correct: 1,
        explanation: "A問題は基礎的問題で、基本的な語彙力と文法知識を問う問題が出題されます。"
    },
    {
        question: "B問題で毎年必ず出題される問題形式は何ですか？",
        choices: ["長文読解", "整序英作文", "リスニング", "自由英作文"],
        correct: 1,
        explanation: "B問題では整序英作文が毎年必ず出題されます。与えられた語句を並び替えて正しい英文を作る問題です。"
    },
    {
        question: "C問題の長文読解問題は何問出題されますか？",
        choices: ["2問", "3問", "4問", "5問"],
        correct: 2,
        explanation: "C問題では大問2から大問5まで、計4つの長文読解問題が出題されます。"
    },
    {
        question: "長文を素早く読むために最も重要なことは何ですか？",
        choices: ["文法力", "単語の即答力", "発音力", "筆記力"],
        correct: 1,
        explanation: "長文を素早く読むためには、単語を瞬時に理解できる即答力が重要です。タイムアタック形式の練習が効果的です。"
    },
    {
        question: "C問題で求められる力として最も適切なものはどれですか？",
        choices: ["基礎的な文法力", "総合的な読解力", "会話力", "暗記力"],
        correct: 1,
        explanation: "C問題は長文読解が中心で、内容理解、語句の意味、文脈に合う表現の選択など、総合的な読解力が試されます。"
    },
    {
        question: "入試対策として効果的な学習法はどれですか？",
        choices: ["テスト前だけ勉強する", "頻出単語を確実に覚える", "難しい単語だけ覚える", "文法だけ勉強する"],
        correct: 1,
        explanation: "頻出単語が毎年繰り返し出題されるため、頻出単語を確実に覚えることが得点アップの鍵となります。"
    },
    {
        question: "B問題の対策として効果的なものはどれですか？",
        choices: ["長文だけ読む", "文法パターンを覚える", "リスニングだけ練習", "単語帳を眺める"],
        correct: 1,
        explanation: "B問題の整序英作文では、基本的な文法パターンを覚えることが有効です。語順の理解も重要です。"
    },
    {
        question: "志望校を決める際に確認すべきことは何ですか？",
        choices: ["制服のデザイン", "採用している問題の種類", "部活動の種類", "通学時間"],
        correct: 1,
        explanation: "志望校がA・B・C問題のどれを採用しているかを確認し、適切な対策を行うことが重要です。"
    }
];

let examQuizState = {
    currentIndex: 0,
    correctCount: 0,
    shuffledQuestions: [],
    answered: false,
    selectedAnswer: null
};

function initExamQuiz() {
    const startBtn = document.getElementById('examQuizStartBtn');
    const nextBtn = document.getElementById('examQuizNextBtn');
    const retryBtn = document.getElementById('examQuizRetryBtn');
    const backBtn = document.getElementById('examQuizBackBtn');
    const submitBtn = document.getElementById('examQuizSubmitBtn');
    const radioButtons = document.querySelectorAll('input[name="examQuizChoice"]');
    
    if (startBtn) {
        startBtn.addEventListener('click', startExamQuiz);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', showNextExamQuestion);
    }
    
    if (retryBtn) {
        retryBtn.addEventListener('click', startExamQuiz);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            resetExamQuizView();
            showCategorySelection();
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleExamQuizSubmit);
    }
    
    if (radioButtons.length > 0) {
        radioButtons.forEach((radio) => {
            radio.addEventListener('change', handleExamQuizRadioChange);
        });
    }
}

function handleExamQuizRadioChange() {
    const submitBtn = document.getElementById('examQuizSubmitBtn');
    const selectedRadio = document.querySelector('input[name="examQuizChoice"]:checked');
    if (selectedRadio) {
        examQuizState.selectedAnswer = parseInt(selectedRadio.value);
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
}

function handleExamQuizSubmit() {
    if (examQuizState.answered || examQuizState.selectedAnswer === null) return;
    selectExamQuizAnswer(examQuizState.selectedAnswer);
}

function startExamQuiz() {
    examQuizState.currentIndex = 0;
    examQuizState.correctCount = 0;
    examQuizState.answered = false;
    examQuizState.shuffledQuestions = [...EXAM_QUIZ_QUESTIONS];
    
    document.getElementById('examQuizStart').classList.add('hidden');
    document.getElementById('examQuizResult').classList.add('hidden');
    document.getElementById('examQuizMain').classList.remove('hidden');
    document.getElementById('examQuizFeedback').classList.add('hidden');
    
    document.getElementById('examQuizTotalNum').textContent = examQuizState.shuffledQuestions.length;
    document.getElementById('examQuizTotalCount').textContent = examQuizState.shuffledQuestions.length;
    
    showExamQuizQuestion();
}

function showExamQuizQuestion() {
    const question = examQuizState.shuffledQuestions[examQuizState.currentIndex];
    examQuizState.answered = false;
    examQuizState.selectedAnswer = null;
    
    document.getElementById('examQuizCurrentNum').textContent = `問題${examQuizState.currentIndex + 1}`;
    document.getElementById('examQuizQuestion').textContent = question.question;
    
    // プログレスバー更新
    const progress = ((examQuizState.currentIndex) / examQuizState.shuffledQuestions.length) * 100;
    document.getElementById('examQuizProgressFill').style.width = progress + '%';
    
    // 選択肢を更新
    const choiceLabels = document.querySelectorAll('.exam-quiz-choice-label');
    const choiceTexts = document.querySelectorAll('.exam-quiz-choice-text');
    const radioButtons = document.querySelectorAll('input[name="examQuizChoice"]');
    
    choiceLabels.forEach((label, index) => {
        label.classList.remove('correct', 'wrong', 'disabled');
    });
    
    choiceTexts.forEach((text, index) => {
        text.textContent = question.choices[index];
    });
    
    radioButtons.forEach((radio, index) => {
        radio.checked = false;
        radio.disabled = false;
    });
    
    // 解答ボタンを無効化
    const submitBtn = document.getElementById('examQuizSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // フィードバックを非表示
    document.getElementById('examQuizFeedback').classList.add('hidden');
    document.querySelector('.exam-quiz-submit-container').classList.remove('hidden');
}

function selectExamQuizAnswer(selectedIndex) {
    if (examQuizState.answered) return;
    examQuizState.answered = true;
    
    const question = examQuizState.shuffledQuestions[examQuizState.currentIndex];
    const isCorrect = selectedIndex === question.correct;
    
    if (isCorrect) {
        examQuizState.correctCount++;
    }
    
    // 選択肢のスタイルを更新
    const choiceLabels = document.querySelectorAll('.exam-quiz-choice-label');
    const radioButtons = document.querySelectorAll('input[name="examQuizChoice"]');
    
    choiceLabels.forEach((label, index) => {
        label.classList.add('disabled');
        if (index === question.correct) {
            label.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            label.classList.add('wrong');
        }
    });
    
    radioButtons.forEach((radio) => {
        radio.disabled = true;
    });
    
    // 解答ボタンを非表示
    document.querySelector('.exam-quiz-submit-container').classList.add('hidden');
    
    // フィードバックを表示
    const feedback = document.getElementById('examQuizFeedback');
    const feedbackIcon = document.getElementById('examQuizFeedbackIcon');
    const feedbackText = document.getElementById('examQuizFeedbackText');
    const explanation = document.getElementById('examQuizExplanation');
    const nextBtn = document.getElementById('examQuizNextBtn');
    
    if (isCorrect) {
        feedbackIcon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 3 4-6"/></svg>';
        feedbackText.textContent = '正解！';
        feedbackText.className = 'exam-quiz-feedback-text correct';
    } else {
        feedbackIcon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
        feedbackText.textContent = '不正解...';
        feedbackText.className = 'exam-quiz-feedback-text wrong';
    }
    
    explanation.textContent = question.explanation;
    
    // 最後の問題かどうか
    if (examQuizState.currentIndex >= examQuizState.shuffledQuestions.length - 1) {
        nextBtn.textContent = '結果を見る';
    } else {
        nextBtn.textContent = '次の問題へ';
    }
    
    feedback.classList.remove('hidden');
}

function showNextExamQuestion() {
    if (examQuizState.currentIndex >= examQuizState.shuffledQuestions.length - 1) {
        showExamQuizResult();
    } else {
        examQuizState.currentIndex++;
        showExamQuizQuestion();
    }
}

function showExamQuizResult() {
    document.getElementById('examQuizMain').classList.add('hidden');
    document.getElementById('examQuizResult').classList.remove('hidden');
    
    const correctCount = examQuizState.correctCount;
    const total = examQuizState.shuffledQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    
    document.getElementById('examQuizCorrectCount').textContent = correctCount;
    document.getElementById('examQuizTotalCount').textContent = total;
    
    // プログレスバーを100%に
    document.getElementById('examQuizProgressFill').style.width = '100%';
    
    // メッセージを設定
    const messageEl = document.getElementById('examQuizResultMessage');
    if (percentage === 100) {
        messageEl.textContent = '完璧です！入試について詳しくなりましたね！';
    } else if (percentage >= 80) {
        messageEl.textContent = '素晴らしい！よく理解できています！';
    } else if (percentage >= 60) {
        messageEl.textContent = 'いい調子です！もう一度挑戦してみましょう！';
    } else {
        messageEl.textContent = 'もう一度挑戦して、入試について学びましょう！';
    }
}

function resetExamQuizView() {
    document.getElementById('examQuizStart').classList.remove('hidden');
    document.getElementById('examQuizMain').classList.add('hidden');
    document.getElementById('examQuizResult').classList.add('hidden');
}

// アプリケーションの起動
// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOMが既に読み込まれている場合は即座に実行
    init();
}
