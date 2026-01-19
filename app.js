// アプリケーションの状態管理
let currentWords = [];
let currentIndex = 0;
let hasReachedGoalBefore = false; // 目標達成済みフラグ（演出重複防止）
let pendingGoalCelebration = false; // 学習完了後に目標達成画面を表示するフラグ
let selectedStudyMode = 'input'; // 'input' or 'output' - インプット/アウトプットモード選択
let currentInputFilter = 'all'; // インプットモードのフィルター状態: 'all', 'wrong', 'unlearned', 'bookmark', 'correct'
let isInputShuffled = false; // インプットモードのシャッフル状態
let learnedWordsAtStart = 0; // 進捗アニメーション用：学習開始時の覚えた語彙数
let lastLearningCategory = null; // 最後に学習していたカテゴリ
let isAnimatingProgress = false; // アニメーション重複防止フラグ

// アプリ起動時に現在の語彙数を初期化（1回目から正確に判定するため）
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        learnedWordsAtStart = calculateTotalLearnedWords();
        console.log('初期語彙数を保存:', learnedWordsAtStart);
    }, 1000); // データの読み込み完了を待つ
});

// 効果音システム
const SoundEffects = {
    audioContext: null,
    enabled: true,
    volume: 0.5, // 0.0 ~ 1.0
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // 保存された音量を読み込む
            const savedVolume = localStorage.getItem('soundEffectsVolume');
            if (savedVolume !== null) {
                this.volume = parseFloat(savedVolume);
            }
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    },
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        localStorage.setItem('soundEffectsVolume', this.volume.toString());
    },
    
    getVolume() {
        return this.volume;
    },
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // タップ音（軽いクリック音）
    playTap() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialDecayTo = 0.01;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    },
    
    // 正解音（明るい音）
    playCorrect() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            const startTime = this.audioContext.currentTime + i * 0.08;
            gainNode.gain.setValueAtTime(0.15 * this.volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        });
    },
    
    // 不正解音（低めの音）
    playWrong() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    },
    
    // 完了音（お祝い音）
    playComplete() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            const startTime = this.audioContext.currentTime + i * 0.12;
            gainNode.gain.setValueAtTime(0.12 * this.volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    },
    
    // カードめくり音
    playFlip() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.08);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.08 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.08);
    },
    
    // ボタン押下音（カチッ）
    playClick() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.05 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.03);
    },
    
    // 閉じる音（×ボタンなど）
    playClose() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },
    
    // メニュー選択音（軽いクリック）
    playMenuSelect() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.08 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.06);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.06);
    },
    
    // 紙のページめくり音（本のページをめくるパラッという音）
    playPageTurn() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const now = this.audioContext.currentTime;
        const duration = 0.12; // 少し長めにして「パラッ」と鳴らす

        // 1st ノイズバースト（高め：紙が擦れる音）
        const bufferSizeHi = Math.floor(this.audioContext.sampleRate * duration);
        const noiseBufferHi = this.audioContext.createBuffer(1, bufferSizeHi, this.audioContext.sampleRate);
        const outputHi = noiseBufferHi.getChannelData(0);
        for (let i = 0; i < bufferSizeHi; i++) {
            outputHi[i] = Math.random() * 2 - 1;
        }
        const noiseSourceHi = this.audioContext.createBufferSource();
        noiseSourceHi.buffer = noiseBufferHi;

        const bandpassHi = this.audioContext.createBiquadFilter();
        bandpassHi.type = 'bandpass';
        bandpassHi.frequency.value = 3200;
        bandpassHi.Q.value = 1.1;

        const gainHi = this.audioContext.createGain();
        gainHi.gain.setValueAtTime(0.22 * this.volume, now);
        gainHi.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseSourceHi.connect(bandpassHi);
        bandpassHi.connect(gainHi);
        gainHi.connect(this.audioContext.destination);

        // 2nd ノイズバースト（中低域：ページの動きの「ボワッ」）
        const bufferSizeLo = Math.floor(this.audioContext.sampleRate * (duration * 0.8));
        const noiseBufferLo = this.audioContext.createBuffer(1, bufferSizeLo, this.audioContext.sampleRate);
        const outputLo = noiseBufferLo.getChannelData(0);
        for (let i = 0; i < bufferSizeLo; i++) {
            outputLo[i] = Math.random() * 2 - 1;
        }
        const noiseSourceLo = this.audioContext.createBufferSource();
        noiseSourceLo.buffer = noiseBufferLo;

        const bandpassLo = this.audioContext.createBiquadFilter();
        bandpassLo.type = 'bandpass';
        bandpassLo.frequency.value = 900;
        bandpassLo.Q.value = 0.7;

        const gainLo = this.audioContext.createGain();
        gainLo.gain.setValueAtTime(0.12 * this.volume, now + 0.01); // 少し遅らせて重ねる
        gainLo.gain.exponentialRampToValueAtTime(0.008, now + duration);

        noiseSourceLo.connect(bandpassLo);
        bandpassLo.connect(gainLo);
        gainLo.connect(this.audioContext.destination);

        noiseSourceHi.start(now);
        noiseSourceHi.stop(now + duration);

        noiseSourceLo.start(now + 0.01);
        noiseSourceLo.stop(now + duration);
    },
    
    // 決定音（上昇する成功音）
    playConfirm() {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        this.resume();
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.12 * this.volume, now);
        gainNode.gain.setValueAtTime(0.12 * this.volume, now + 0.25);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
};
let answeredWords = new Set();
let correctCount = 0;
let wrongCount = 0;
let consecutiveCorrect = 0; // 連続正解数
let selectedCategory = null;
let reviewWords = new Set(); // 復習用チェック（★）
// 志望校データは school-data.js で管理
const SCHOOL_STORAGE_KEY = 'preferredSchoolOsaka';
let tempSelectedSchool = undefined; // 一時的に選択した学校（undefined=未選択、null=未定、オブジェクト=学校選択）

// 志望校決定ボタンの活性/非活性を切り替える
function setSchoolConfirmEnabled(enabled) {
    const confirmWrapper = document.getElementById('schoolConfirmWrapper');
    const confirmBtn = document.getElementById('schoolConfirmBtn');
    if (confirmWrapper) confirmWrapper.classList.remove('hidden');
    if (!confirmBtn) return;
    confirmBtn.disabled = !enabled;
    confirmBtn.classList.toggle('disabled', !enabled);
}

function normalizeSchoolText(str) {
    return (str || '').toLowerCase();
}

// 入試頻出度を★マークに変換
function getAppearanceStars(count) {
    if (typeof count !== 'number' || isNaN(count) || count < 0) {
        return '★';
    }
    if (count >= 50) {
        return '★★★★★';
    } else if (count >= 20) {
        return '★★★★';
    } else if (count >= 5) {
        return '★★★';
    } else if (count >= 1) {
        return '★★';
    } else {
        return '★';
    }
}

function filterSchools(query) {
    const q = normalizeSchoolText(query);
    if (!q) return osakaSchools.slice(0, 8);
    return osakaSchools.filter((s) => {
        const haystack = normalizeSchoolText(`${s.name} ${s.type} ${s.course}`);
        return haystack.includes(q);
    }).slice(0, 12);
}

// 偏差値から必須単語数を計算（偏差値が高いほど必要語彙数が多くなる）
function calculateRequiredWords(hensachi, schoolName) {
    if (!hensachi) return 0;
    
    // おばか高等学校の場合は10語
    if (schoolName && schoolName.includes('おばか')) {
        return 10;
    }
    
    // 偏差値34=300語、偏差値40=450語、偏差値50=700語、偏差値60=1000語、偏差値70=1400語、偏差値75=1700語
    // 偏差値が高いほど急激に増えるように、二次関数を使用
    const minHensachi = 34;
    const maxHensachi = 75;
    const minWords = 300;
    const maxWords = 1700;
    
    const clampedHensachi = Math.max(minHensachi, Math.min(maxHensachi, hensachi));
    // 線形補間ではなく、偏差値が高いほど急激に増えるように調整
    // 正規化された偏差値（0-1）を2乗して、より急激な増加を実現
    const normalized = (clampedHensachi - minHensachi) / (maxHensachi - minHensachi);
    const adjustedRatio = Math.pow(normalized, 1.5); // 1.5乗で中程度の急激さ
    return Math.round(minWords + adjustedRatio * (maxWords - minWords));
}

// 全カテゴリの覚えた単語数を計算
function calculateTotalLearnedWords() {
    const totalLearnedSet = new Set();
    const modes = ['card', 'input'];
    
    // localStorageの全キーを走査して、学習済みの単語IDを収集
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('correctWords-')) {
            // 学習モード（card, input）のいずれかで正解したものをカウント
            if (modes.some(mode => key.endsWith(`_${mode}`))) {
                try {
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(id => {
                                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                                if (!isNaN(numId)) totalLearnedSet.add(numId);
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Error parsing learned words for key:', key);
                }
            }
        }
    }
    
    return totalLearnedSet.size;
}

// 全単語数を計算
function calculateTotalWords() {
    // vocabulary-data.jsから全単語を取得して合計
    if (typeof getAllVocabulary === 'function') {
        return getAllVocabulary().length;
    }
    return 1800; // デフォルト値
}

// 進捗アニメーション: LEVELカードから志望校進捗バーへ飛ばす
function animateProgressToGoal() {
    if (isAnimatingProgress) return;
    
    // 現在の状況を正確に把握
    const currentLearnedWords = calculateTotalLearnedWords();
    const learnedCount = currentLearnedWords - learnedWordsAtStart;
    
    console.log('animateProgressToGoal 判定:', {
        lastLearningCategory,
        learnedWordsAtStart,
        currentLearnedWords,
        learnedCount
    });
    
    // 志望校が設定されていない、または語彙が増えていない場合は中止
    const selectedSchool = loadSelectedSchool();
    if (!selectedSchool || learnedCount <= 0) {
        lastLearningCategory = null;
        return;
    }
    
    // ソース要素（飛ばし元）を特定
    let sourceElement = null;
    const category = lastLearningCategory || '';
    const parentCategory = window.currentSubcategoryParent || '';
    const checkCategory = category + ' ' + parentCategory;
    
    console.log('カテゴリ判定:', { category, parentCategory, checkCategory });
    
    // LEVEL1〜5の判定
    if (checkCategory.includes('レベル１') || checkCategory.includes('LEVEL1') || checkCategory.includes('超重要')) {
        sourceElement = document.getElementById('level1CardBtn');
    } else if (checkCategory.includes('レベル２') || checkCategory.includes('LEVEL2') || checkCategory.includes('重要500')) {
        sourceElement = document.getElementById('level2CardBtn');
    } else if (checkCategory.includes('レベル３') || checkCategory.includes('LEVEL3') || checkCategory.includes('ハイレベル')) {
        sourceElement = document.getElementById('level3CardBtn');
    } else if (checkCategory.includes('LEVEL4') || checkCategory.includes('私立高校入試')) {
        sourceElement = document.querySelector('[data-category*="LEVEL4"]');
    } else if (checkCategory.includes('LEVEL5') || checkCategory.includes('難関私立')) {
        sourceElement = document.querySelector('[data-category*="LEVEL5"]');
    } else if (checkCategory.includes('カテゴリー別') || parentCategory.includes('カテゴリー別') || 
               ['家族', '体', '食べ物', '動物', '自然', '場所', '時間', '数', '色', '形容詞', '動詞', '副詞', '前置詞', '接続詞'].some(cat => category.includes(cat))) {
        // カテゴリー別単語の場合
        sourceElement = document.querySelector('[data-category*="カテゴリー別"]') || 
                       document.querySelector('[data-category*="小学生"]') ||
                       document.getElementById('level1CardBtn'); // フォールバック
    }
    
    // それでも見つからない場合、学習していたカテゴリに最も近いカードを探す
    if (!sourceElement) {
        // 任意のLEVELカードをフォールバックとして使用
        sourceElement = document.getElementById('level1CardBtn') || 
                       document.getElementById('level2CardBtn') ||
                       document.getElementById('level3CardBtn');
    }
    
    const targetElement = document.getElementById('schoolProgressBar');
    const progressWrapper = document.querySelector('.school-card-progress-bar-wrapper');
    if (!sourceElement || !targetElement) {
        console.log('アニメーション中止: 要素が見つかりません', { sourceElement, targetElement });
        lastLearningCategory = null;
        return;
    }

    isAnimatingProgress = true;
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // アニメーション中はタップを無効化するオーバーレイを追加
    const blockingOverlay = document.createElement('div');
    blockingOverlay.id = 'progressAnimationBlocker';
    blockingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        background: transparent;
        pointer-events: auto;
    `;
    document.body.appendChild(blockingOverlay);
    
    // 白い★（シアンの光）の数（覚えた語数に比例、最小3個、最大30個）
    const starCount = Math.min(Math.max(3, learnedCount), 30);
    const staggerDelay = 80;
    let completedCount = 0;
    
    // 進捗バーの現在値を保存（アニメーション前の値）
    const schoolProgressCurrentEl = document.getElementById('schoolProgressCurrent');
    const schoolProgressBarEl = document.getElementById('schoolProgressBar');
    const schoolProgressPercentEl = document.getElementById('schoolProgressPercent');
    
    // 現在の表示値を取得
    const oldLearnedWords = parseInt(schoolProgressCurrentEl?.textContent || '0', 10);
    const oldBarWidth = parseFloat(schoolProgressBarEl?.style.width || '0');
    const oldPercent = parseInt(schoolProgressPercentEl?.textContent || '0', 10);
    
    // 新しい値を計算（selectedSchoolは上で既に取得済み）
    const newLearnedWords = calculateTotalLearnedWords();
    const requiredWords = selectedSchool ? calculateRequiredWords(selectedSchool.hensachi, selectedSchool.name) : 0;
    const newPercent = requiredWords > 0 ? Math.min(100, Math.round((newLearnedWords / requiredWords) * 100)) : 0;
    
    for (let i = 0; i < starCount; i++) {
        setTimeout(() => {
            createFloatingStar(sourceRect, targetRect, () => {
                completedCount++;
                // 最初の★が到達したらバーのアニメーション開始
                if (completedCount === 1) {
                    animateProgressBarGlow(targetElement, progressWrapper);
                }
                // 全て完了したら進捗バーを更新
                if (completedCount === starCount) {
                    setTimeout(() => {
                        // 進捗バーの値をアニメーションで更新
                        animateProgressValues(
                            oldLearnedWords, newLearnedWords,
                            oldPercent, newPercent,
                            schoolProgressCurrentEl, schoolProgressBarEl, schoolProgressPercentEl
                        );
                        
                        // +○語のフローティングテキストを表示
                        const addedWords = newLearnedWords - oldLearnedWords;
                        if (addedWords > 0) {
                            showFloatingAddedWords(addedWords, targetRect);
                        }
                        
                        // タップブロックオーバーレイを削除（フローティングテキスト表示後に遅延）
                        setTimeout(() => {
                            const blocker = document.getElementById('progressAnimationBlocker');
                            if (blocker) blocker.remove();
                        }, 800);
                        
                        isAnimatingProgress = false;
                        lastLearningCategory = null;
                    }, 200);
                }
            });
        }, i * staggerDelay);
    }
    
    // 進捗の数値をアニメーションで更新
    function animateProgressValues(oldWords, newWords, oldPct, newPct, wordEl, barEl, pctEl) {
        const duration = 600; // ms
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング（easeOutCubic）
            const t = 1 - Math.pow(1 - progress, 3);
            
            // 現在の値を計算
            const currentWords = Math.round(oldWords + (newWords - oldWords) * t);
            const currentPct = Math.round(oldPct + (newPct - oldPct) * t);
            
            // DOM更新
            if (wordEl) wordEl.textContent = currentWords;
            if (barEl) barEl.style.width = `${currentPct}%`;
            if (pctEl) pctEl.textContent = currentPct;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // アニメーション完了時、100%なら進捗バーをキラキラに
                if (barEl && newPct >= 100) {
                    barEl.classList.add('complete');
                    const completeText = document.getElementById('schoolCompleteText');
                    const completeStars = document.getElementById('schoolCompleteStars');
                    if (completeText) completeText.classList.remove('hidden');
                    if (completeStars) completeStars.classList.remove('hidden');
                }
            }
        }
        requestAnimationFrame(animate);
    }

    // 白い★（シアンの光）を生成してふわっと飛ばす
    function createFloatingStar(sourceRect, targetRect, onComplete) {
        const star = document.createElement('div');
        const size = 22 + Math.random() * 16; // 22〜38px
        
        const sX = sourceRect.left + sourceRect.width / 2 + (Math.random() - 0.5) * 80;
        const sY = sourceRect.top + sourceRect.height / 2 + (Math.random() - 0.5) * 40;
        const eX = targetRect.left + Math.random() * targetRect.width;
        const eY = targetRect.top + targetRect.height / 2;
        
        // ★のデザイン（白い星＋シアンの光）- ランダムで形を選択
        const starShapes = ['★', '✦'];
        star.innerHTML = starShapes[Math.floor(Math.random() * starShapes.length)];
        star.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${sX}px;
            top: ${sY}px;
            font-size: ${size}px;
            line-height: 1;
            color: #ffffff;
            text-shadow: 
                0 0 4px #22d3ee,
                0 0 8px #22d3ee,
                0 0 12px #67e8f9,
                0 0 20px #67e8f9;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            will-change: transform, opacity;
        `;
        document.body.appendChild(star);
        
        const duration = 1500 + Math.random() * 800; // 1500〜2300ms（ふわっと）
        const startTime = performance.now();
        
        // ランダムな浮遊パラメータ
        const wobbleX = (Math.random() - 0.5) * 200; // 横揺れ
        const wobbleY = -80 - Math.random() * 120; // 上に浮く
        const wobbleFreqX = 2 + Math.random() * 2; // 揺れの頻度
        const wobbleFreqY = 1.5 + Math.random() * 1.5;
        const rotationSpeed = (Math.random() - 0.5) * 720; // 回転
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // ふわっとしたイージング
            const t = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // ランダムな浮遊軌跡
            const floatPhase = progress * Math.PI;
            const randomX = Math.sin(progress * wobbleFreqX * Math.PI) * wobbleX * (1 - t);
            const randomY = Math.sin(progress * wobbleFreqY * Math.PI) * wobbleY * (1 - t);
            
            // 基本軌跡 + 浮遊
            const x = sX + (eX - sX) * t + randomX;
            const y = sY + (eY - sY) * t + randomY;
            
            // 回転
            const rotation = progress * rotationSpeed;
            
            // フェードイン・アウト + スケール
            let opacity = 1;
            let scale = 1;
            if (progress < 0.15) {
                opacity = progress / 0.15;
                scale = 0.5 + (progress / 0.15) * 0.5;
            } else if (progress > 0.8) {
                opacity = (1 - progress) / 0.2;
                scale = 1 - (progress - 0.8) * 2;
            }
            
            star.style.left = `${x - size/2}px`;
            star.style.top = `${y - size/2}px`;
            star.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            star.style.opacity = opacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                star.remove();
                onComplete();
            }
        }
        requestAnimationFrame(animate);
    }
    
    // 進捗バーのグロー演出
    function animateProgressBarGlow(bar, wrapper) {
        if (!bar || !wrapper) return;
        
        // バーにグロー効果を追加
        bar.style.transition = 'box-shadow 0.3s ease-out';
        bar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)';
        
        // ラッパーに微細な発光
        wrapper.style.transition = 'box-shadow 0.3s ease-out';
        wrapper.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.4)';
        
        // 0.8秒後にリセット
        setTimeout(() => {
            bar.style.transition = 'box-shadow 0.5s ease-out';
            bar.style.boxShadow = '';
            wrapper.style.transition = 'box-shadow 0.5s ease-out';
            wrapper.style.boxShadow = '';
        }, 800);
    }
    
    // +○語のフローティングテキストを表示
    function showFloatingAddedWords(count, targetRect) {
        const floatingText = document.createElement('div');
        floatingText.textContent = `+${count}語`;
        floatingText.style.cssText = `
            position: fixed;
            left: ${targetRect.left + targetRect.width / 2}px;
            top: ${targetRect.top - 10}px;
            transform: translateX(-50%);
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            text-shadow: 
                -2px -2px 0 #fff,
                2px -2px 0 #fff,
                -2px 2px 0 #fff,
                2px 2px 0 #fff,
                -2px 0 0 #fff,
                2px 0 0 #fff,
                0 -2px 0 #fff,
                0 2px 0 #fff;
            z-index: 10001;
            pointer-events: none;
            opacity: 1;
            transition: transform 2s ease-out, opacity 2s ease-out;
        `;
        document.body.appendChild(floatingText);
        
        // アニメーション開始（上に上がりながらフェードアウト）
        requestAnimationFrame(() => {
            floatingText.style.transform = 'translateX(-50%) translateY(-60px)';
            floatingText.style.opacity = '0';
        });
        
        // 削除
        setTimeout(() => {
            floatingText.remove();
        }, 2100);
    }
}

// 英単語進捗バーを更新
function updateVocabProgressBar() {
    const container = document.getElementById('vocabProgressContainer');
    if (!container) return;
    
    const learnedWords = calculateTotalLearnedWords();
    const totalWords = calculateTotalWords();
    const progressPercent = Math.min(100, Math.round((learnedWords / totalWords) * 100));
    
    // 300語ごとのマーカーを生成
    const markersContainer = document.getElementById('vocabProgressMarkers');
    if (markersContainer) {
        markersContainer.innerHTML = '';
        // 300語ごとにマーカーを配置
        for (let i = 300; i < totalWords; i += 300) {
            const markerPercent = (i / totalWords) * 100;
            if (markerPercent > 100) break;
            
            const marker = document.createElement('div');
            marker.className = 'vocab-progress-marker';
            marker.style.left = `${markerPercent}%`;
            
            const label = document.createElement('div');
            label.className = 'vocab-progress-marker-label';
            label.textContent = `${i}`;
            marker.appendChild(label);
            
            markersContainer.appendChild(marker);
        }
    }
    
    // 志望校データを取得
    const selectedSchool = loadSelectedSchool();
    const requiredWords = selectedSchool ? calculateRequiredWords(selectedSchool.hensachi, selectedSchool.name) : 0;
    const requiredPercent = requiredWords > 0 ? Math.min(100, Math.round((requiredWords / totalWords) * 100)) : 0;
    
    // 必須ラインを超えているか判定
    const isInsufficient = requiredWords > 0 && learnedWords < requiredWords;
    const hasSchool = selectedSchool !== null;
    
    // DOM要素を更新
    const progressRate = document.getElementById('vocabProgressRate');
    const progressFill = document.getElementById('vocabProgressFill');
    const progressBike = document.getElementById('vocabProgressBike');
    const bikeImg = document.getElementById('vocabBikeImg');
    const progressRequirement = document.getElementById('vocabProgressRequirement');
    const requirementLabel = document.getElementById('vocabRequirementLabel');
    const learnedCountEl = document.getElementById('vocabLearnedCount');
    const requiredProgressEl = document.getElementById('vocabRequiredProgress');
    const requiredCountEl = document.getElementById('vocabRequiredCount');
    const progressPercentEl = document.getElementById('vocabProgressPercent');
    const countBikeEl = document.querySelector('.vocab-progress-count-bike');
    
    if (progressPercentEl) progressPercentEl.textContent = progressPercent;
    if (learnedCountEl) learnedCountEl.textContent = learnedWords;
    // 志望校必須ラインの語数を表示（未設定の場合は全単語数）
    if (requiredCountEl) requiredCountEl.textContent = requiredWords > 0 ? requiredWords : totalWords;
    
    // 必須ラインに対する進捗率を計算
    // 志望校を設定している場合は必須単語数を分母、設定していない場合は全単語数を分母にする
    const denominator = requiredWords > 0 ? requiredWords : totalWords;
    const requiredProgress = denominator > 0 ? Math.round((learnedWords / denominator) * 100) : 0;
    if (requiredProgressEl) requiredProgressEl.textContent = requiredProgress;
    
    // 志望校カード内の進捗バーを更新
    // ただし、進捗アニメーションが予定されている場合はスキップ（アニメーション後に更新）
    const schoolProgressCurrentEl = document.getElementById('schoolProgressCurrent');
    const schoolProgressTotalEl = document.getElementById('schoolProgressTotal');
    const schoolProgressBarEl = document.getElementById('schoolProgressBar');
    const schoolProgressPercentEl = document.getElementById('schoolProgressPercent');
    
    if (requiredWords > 0 && !lastLearningCategory) {
        const schoolProgress = Math.min(100, Math.round((learnedWords / requiredWords) * 100));
        if (schoolProgressCurrentEl) schoolProgressCurrentEl.textContent = learnedWords;
        if (schoolProgressTotalEl) schoolProgressTotalEl.textContent = requiredWords;
        if (schoolProgressBarEl) schoolProgressBarEl.style.width = `${schoolProgress}%`;
        if (schoolProgressPercentEl) schoolProgressPercentEl.textContent = schoolProgress;
        
        // 100%達成時の進捗バーキラキラ表示
        const completeText = document.getElementById('schoolCompleteText');
        const completeStars = document.getElementById('schoolCompleteStars');
        if (schoolProgressBarEl) {
            if (schoolProgress >= 100) {
                schoolProgressBarEl.classList.add('complete');
                if (completeText) completeText.classList.remove('hidden');
                if (completeStars) completeStars.classList.remove('hidden');
            } else {
                schoolProgressBarEl.classList.remove('complete');
                if (completeText) completeText.classList.add('hidden');
                if (completeStars) completeStars.classList.add('hidden');
            }
        }
    } else if (requiredWords > 0 && lastLearningCategory) {
        // アニメーション予定あり：必須語数だけ更新（語彙数・バー・%はアニメーション後）
        if (schoolProgressTotalEl) schoolProgressTotalEl.textContent = requiredWords;
    }
    
    // 必須ラインに達したかどうかを判定
    const hasReachedRequired = requiredWords > 0 && learnedWords >= requiredWords;
    if (countBikeEl) {
        countBikeEl.classList.toggle('reached', hasReachedRequired);
    }
    
    // 色を設定（志望校未設定=グレー、足りない=オレンジ、足りている=水色）
    if (progressRate) {
        progressRate.classList.toggle('insufficient', isInsufficient);
        progressRate.classList.toggle('no-school', !hasSchool);
    }
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
        progressFill.classList.toggle('insufficient', isInsufficient);
        progressFill.classList.toggle('no-school', !hasSchool);
        progressFill.classList.toggle('full', progressPercent >= 100);
    }
    // 自転車アイコンの位置と画像を更新
    if (progressBike) {
        // 進捗に応じて移動（0%から開始）
        progressBike.style.left = `${progressPercent}%`;
        
        // テキストが左端を超えないように調整
        const labelBike = progressBike.querySelector('.vocab-progress-label-bike');
        if (labelBike) {
            const bikeContainer = progressBike.closest('.vocab-progress-bike-container');
            if (bikeContainer) {
                const containerWidth = bikeContainer.offsetWidth;
                const bikeLeftPx = (progressPercent / 100) * containerWidth;
                const textWidth = labelBike.offsetWidth || 100;
                const textHalfWidth = textWidth / 2;
                
                // 左端から5pxの余白を確保
                const minLeftPx = 5 + textHalfWidth;
                
                if (bikeLeftPx < minLeftPx) {
                    // 左端に近い場合は、テキストを右にずらす
                    const offset = minLeftPx - bikeLeftPx;
                    labelBike.style.transform = `translateX(calc(-50% + ${offset}px))`;
                } else {
                    // 通常は中央配置
                    labelBike.style.transform = 'translateX(-50%)';
                }
            }
        }
    }
    if (bikeImg) {
        // 常にbike_b.pngを使用
        bikeImg.src = 'bike_b.png';
    }
    
    // 合格必須ラインの表示
    if (progressRequirement && requiredWords > 0) {
        progressRequirement.classList.remove('hidden');
        progressRequirement.style.left = `${requiredPercent}%`;
        
        // ラベルのテキストを設定
        if (requirementLabel) {
            requirementLabel.textContent = `志望校合格必須ライン ${requiredWords}語`;
            
            // 位置調整（画面からはみ出さないように）
            // requestAnimationFrameで確実にDOM更新後に計算
            requestAnimationFrame(() => {
            const progressBarWrapper = progressRequirement.closest('.vocab-progress-bar-wrapper');
                if (!progressBarWrapper) return;
                
                const wrapperRect = progressBarWrapper.getBoundingClientRect();
                const labelRect = requirementLabel.getBoundingClientRect();
                
                // ラベルが右端からはみ出ている場合
                const rightOverflow = labelRect.right - wrapperRect.right;
                if (rightOverflow > 0) {
                    // はみ出した分だけ左に移動
                    const currentTransform = window.getComputedStyle(requirementLabel).transform;
                    requirementLabel.style.transform = `translateX(calc(-50% - ${rightOverflow + 10}px))`;
                } else {
                    // 左端からはみ出ている場合
                    const leftOverflow = wrapperRect.left - labelRect.left;
                    if (leftOverflow > 0) {
                        requirementLabel.style.transform = `translateX(calc(-50% + ${leftOverflow + 10}px))`;
                    } else {
                        // 通常の中央配置
                    requirementLabel.style.transform = 'translateX(-50%)';
                }
            }
            });
        }
    } else if (progressRequirement) {
        progressRequirement.classList.add('hidden');
    }
    
    // 志望校を表示
    updateVocabSelectedSchool(selectedSchool);
}

// 志望校をヘッダーに表示
function updateVocabSelectedSchool(school) {
    const vocabSchoolSelector = document.getElementById('vocabSchoolSelector');
    const vocabSchoolSelected = document.getElementById('vocabSchoolSelected');
    const vocabSchoolName = document.getElementById('vocabSchoolName');
    const vocabSchoolCourse = document.getElementById('vocabSchoolCourse');
    const vocabSchoolChangeBtn = document.getElementById('vocabSchoolChangeBtn');
    const openSchoolSettings = document.getElementById('openSchoolSettings');
    
    if (!vocabSchoolSelector || !vocabSchoolSelected || !vocabSchoolName) return;
    
    if (school) {
        // 志望校が設定されている場合
        vocabSchoolName.textContent = school.name;
        if (vocabSchoolCourse) {
            vocabSchoolCourse.textContent = `${school.type} / ${school.course}`;
        }
        vocabSchoolSelector.classList.add('hidden');
        vocabSchoolSelected.classList.remove('hidden');
        
        // アイコンの色を学校種別に応じて変更
        const iconSet = document.querySelector('.school-card-icon-set');
        if (iconSet) {
            iconSet.classList.remove('school-card-icon-public', 'school-card-icon-private', 'school-card-icon-national');
            if (school.type === '公立') {
                iconSet.classList.add('school-card-icon-public');
            } else if (school.type === '私立') {
                iconSet.classList.add('school-card-icon-private');
            } else if (school.type === '国立') {
                iconSet.classList.add('school-card-icon-national');
            }
        }
        
        // 説明文を非表示にする
        const vocabProgressDescription = document.querySelector('.vocab-progress-description');
        if (vocabProgressDescription) {
            vocabProgressDescription.classList.add('hidden');
        }
        
        // 変更ボタンのイベントリスナーを設定（直接高校一覧を表示）
        const openSchoolModal = () => {
            // ボトムシートモーダルを表示（検索モードで開く）
            if (typeof window.showSchoolModal === 'function') {
                window.showSchoolModal(true);
            } else {
                const modal = document.getElementById('schoolModal');
                if (modal) modal.classList.remove('hidden');
            }
            // 検索モードで表示（高校一覧を表示）
            updateSelectedSchoolUI(school, true);
            tempSelectedSchool = undefined;
            // すべてボタンをアクティブにして全学校を表示
            const typeButtons = document.querySelectorAll('.school-filter-tab');
            typeButtons.forEach(b => b.classList.remove('active'));
            const allBtn = document.getElementById('schoolTypeAll');
            if (allBtn) allBtn.classList.add('active');
            // 検索入力をクリア
            const searchInput = document.getElementById('schoolSearchInput');
            if (searchInput) searchInput.value = '';
            renderSchoolList('all', '');
        };
        
        if (vocabSchoolChangeBtn) {
            vocabSchoolChangeBtn.onclick = (e) => {
                e.stopPropagation();
                openSchoolModal();
            };
        }
        
        // カード全体にもクリックイベントを設定
        vocabSchoolSelected.onclick = openSchoolModal;
    } else {
        // 志望校が未設定の場合
        vocabSchoolSelector.classList.remove('hidden');
        vocabSchoolSelected.classList.add('hidden');
        
        // 志望校が設定されていないときは光らせる
        vocabSchoolSelector.classList.add('glow-pulse');
        
        // カード全体にクリックイベントを設定
        vocabSchoolSelector.onclick = () => {
            if (typeof window.showSchoolModal === 'function') {
                window.showSchoolModal(false);
            } else {
                const modal = document.getElementById('schoolModal');
                if (modal) modal.classList.remove('hidden');
            }
        };
        
        // 説明文を表示する
        const vocabProgressDescription = document.querySelector('.vocab-progress-description');
        if (vocabProgressDescription) {
            vocabProgressDescription.classList.remove('hidden');
        }
    }
}

// 学校一覧を表示する関数
function renderSchoolList(typeFilter = 'all', searchQuery = '') {
    const listEl = document.getElementById('schoolList');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    setSchoolConfirmEnabled(false);
    
    // フィルタリング
    let filteredSchools = osakaSchools;
    
    // タイプでフィルタリング
    if (typeFilter !== 'all') {
        filteredSchools = filteredSchools.filter(school => school.type === typeFilter);
    }
    
    // 検索クエリでフィルタリング
    if (searchQuery) {
        const query = normalizeSchoolText(searchQuery);
        filteredSchools = filteredSchools.filter(school => {
            const haystack = normalizeSchoolText(`${school.name} ${school.type} ${school.course}`);
            return haystack.includes(query);
        });
    }
    
    // 偏差値でソート（高い順）
    filteredSchools.sort((a, b) => (b.hensachi || 0) - (a.hensachi || 0));
    
    // 学校一覧を表示（交互の色を適用）
    filteredSchools.forEach((school, index) => {
        const item = document.createElement('div');
        item.className = 'school-list-item';
        // 交互の色を適用
        if (index % 2 === 0) {
            item.classList.add('school-list-item-even');
        } else {
            item.classList.add('school-list-item-odd');
        }
        
        // 学校名とバッジのコンテナ
        const nameContainer = document.createElement('div');
        nameContainer.className = 'school-list-name-container';
        
        // 学校種別バッジ
        const typeBadge = document.createElement('span');
        typeBadge.className = 'school-type-badge';
        if (school.type === '公立') {
            typeBadge.classList.add('school-type-badge-public');
        } else if (school.type === '私立') {
            typeBadge.classList.add('school-type-badge-private');
        } else if (school.type === '国立') {
            typeBadge.classList.add('school-type-badge-national');
        }
        typeBadge.textContent = school.type;
        
        // 学校名
        const name = document.createElement('div');
        name.className = 'school-list-name';
        name.textContent = school.name;
        
        nameContainer.appendChild(typeBadge);
        nameContainer.appendChild(name);
        
        const meta = document.createElement('div');
        meta.className = 'school-list-meta';
        const henText = school.hensachi ? `偏差値${school.hensachi}` : '';
        meta.textContent = `${school.course}${henText ? ' / ' + henText : ''}`;
        item.appendChild(nameContainer);
        item.appendChild(meta);
        item.addEventListener('click', () => {
            // 効果音を再生
            SoundEffects.playMenuSelect();
            // 一時的に選択した学校を保持
            tempSelectedSchool = school;
            // 選択中のアイテムをハイライト
            document.querySelectorAll('.school-list-item').forEach(el => el.classList.remove('school-list-item-selected'));
            item.classList.add('school-list-item-selected');
            // 決定ボタンを有効化
            setSchoolConfirmEnabled(true);
        });
        listEl.appendChild(item);
    });
    
}

function updateSelectedSchoolUI(school, showSearchMode = false) {
    const container = document.getElementById('selectedSchoolContainer');
    const textEl = document.getElementById('selectedSchoolText');
    const controlsEl = document.getElementById('schoolSelectorControls');
    const resetBtn = document.getElementById('selectedSchoolReset');
    if (!container || !textEl) return;
    
    if (school && !showSearchMode) {
        // 志望校が設定されていて、検索モードでない場合は志望校のみ表示
        const henText = school.hensachi ? ` / 偏差値${school.hensachi}` : '';
        textEl.textContent = `${school.name}（${school.type} / ${school.course}${henText}）`;
        container.classList.remove('hidden');
        if (controlsEl) controlsEl.classList.add('hidden');
        if (resetBtn) resetBtn.classList.remove('hidden');
    } else if (showSearchMode || !school) {
        // 検索モード、または志望校が未設定の場合は検索コントロールを表示
        container.classList.add('hidden');
        if (controlsEl) controlsEl.classList.remove('hidden');
        if (resetBtn) resetBtn.classList.add('hidden');
    }
}

function saveSelectedSchool(school) {
    try {
        localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(school));
        // 志望校が変わったら目標達成フラグをリセット
        hasReachedGoalBefore = false;
        localStorage.removeItem('goalAchieved');
        localStorage.removeItem('goalAchievedSchool');
        // 進捗バーを更新
        updateVocabProgressBar();
    } catch (e) {
        console.warn('Failed to save school selection', e);
    }
}

function loadSelectedSchool() {
    try {
        const raw = localStorage.getItem(SCHOOL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('Failed to load school selection', e);
        return null;
    }
}

function initSchoolSelector() {
    const resetBtn = document.getElementById('selectedSchoolReset');
    const openBtn = document.getElementById('openSchoolSettings');
    const closeBtn = document.getElementById('closeSchoolSettings');
    const deleteBtn = document.getElementById('vocabSchoolDeleteBtn');
    const modal = document.getElementById('schoolModal');
    const backdrop = document.querySelector('#schoolModal .school-modal-backdrop');
    const typeButtons = document.querySelectorAll('.school-filter-tab');
    const searchInput = document.getElementById('schoolSearchInput');
    
    // 削除ボタンのイベントリスナー
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            SoundEffects.playTap();
            // 志望校を削除
            localStorage.removeItem(SCHOOL_STORAGE_KEY);
            // 目標達成フラグをリセット
            hasReachedGoalBefore = false;
            localStorage.removeItem('goalAchieved');
            // UIを更新
            updateSelectedSchoolUI(null, false);
            updateVocabProgressBar();
        });
    }

    const saved = loadSelectedSchool();
    if (saved) updateSelectedSchoolUI(saved);

    // 現在のタイプフィルタと検索クエリを取得する関数
    const getCurrentTypeFilter = () => {
        const activeBtn = document.querySelector('.school-filter-tab.active');
        return activeBtn ? (activeBtn.dataset.type || 'all') : 'all';
    };

    // 学校一覧を更新する関数
    const updateSchoolList = () => {
        const type = getCurrentTypeFilter();
        const query = searchInput ? searchInput.value : '';
        renderSchoolList(type, query);
        
        tempSelectedSchool = undefined;
        setSchoolConfirmEnabled(false);
    };

    // タイプボタンのクリックイベント
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // アクティブ状態を更新
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // フィルタリングして表示
            updateSchoolList();
        });
    });

    // 検索入力のイベントリスナー
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateSchoolList();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 検索モードに切り替え（志望校を解除せず、検索画面を表示）
            const currentSchool = loadSelectedSchool();
            updateSelectedSchoolUI(currentSchool, true);
            // すべてボタンをアクティブにして全学校を表示
            typeButtons.forEach(b => b.classList.remove('active'));
            const allBtn = document.getElementById('schoolTypeAll');
            if (allBtn) allBtn.classList.add('active');
            // 検索入力をクリア
            if (searchInput) searchInput.value = '';
            updateSchoolList();
            setSchoolConfirmEnabled(false);
        });
    }

    const openModal = (forceSearchMode = false) => {
        if (!modal) return;

        // 表示用クラスを付与してボトムシート風に表示
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.add('show');
            if (backdrop) backdrop.classList.add('show');
        });

        // スクロール位置をリセット（2回目以降のスクロール位置保持を防ぐ）
        const schoolList = document.getElementById('schoolList');
        if (schoolList) {
            schoolList.scrollTop = 0;
        }

        setSchoolConfirmEnabled(false);
        
        const saved = loadSelectedSchool();
        const shouldShowSearch = forceSearchMode || !saved;
        // 志望校が設定されている場合は志望校表示、未設定またはforce時は検索モード
        updateSelectedSchoolUI(saved, shouldShowSearch);
        tempSelectedSchool = undefined;
        if (shouldShowSearch) {
            // すべてボタンをアクティブにして全学校を表示
            typeButtons.forEach(b => b.classList.remove('active'));
            const allBtn = document.getElementById('schoolTypeAll');
            if (allBtn) allBtn.classList.add('active');
            // 検索入力をクリア
            if (searchInput) searchInput.value = '';
            updateSchoolList();
        }
    };

    let isClosing = false; // 閉じる処理中フラグ
    
    const closeModal = (skipSound = false) => {
        // 既に閉じる処理中の場合は何もしない
        if (isClosing) return;
        isClosing = true;
        
        if (!skipSound) {
            SoundEffects.playClose();
        }
        if (modal) modal.classList.remove('show');
        if (backdrop) backdrop.classList.remove('show');
        tempSelectedSchool = undefined;
        // 決定ボタンを非表示
        const confirmWrapper = document.getElementById('schoolConfirmWrapper');
        if (confirmWrapper) confirmWrapper.classList.add('hidden');
        // モーダルを閉じるときは志望校表示に戻す
        const saved = loadSelectedSchool();
        if (saved) updateSelectedSchoolUI(saved, false);
        setSchoolConfirmEnabled(false);
        
        // フラグをリセット（少し遅延させて確実に処理が完了するように）
        setTimeout(() => {
            if (modal) modal.classList.add('hidden');
            isClosing = false;
        }, 320);
    };

    const confirmBtn = document.getElementById('schoolConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (tempSelectedSchool !== undefined) {
                SoundEffects.playTap();
                if (tempSelectedSchool === null) {
                    // 未定を選択した場合
                    localStorage.removeItem(SCHOOL_STORAGE_KEY);
                    // 目標達成フラグをリセット
                    hasReachedGoalBefore = false;
                    localStorage.removeItem('goalAchieved');
                    updateSelectedSchoolUI(null, false);
                } else {
                    // 学校を選択した場合
                    saveSelectedSchool(tempSelectedSchool);
                    updateSelectedSchoolUI(tempSelectedSchool, false);
                }
                updateVocabProgressBar();
                tempSelectedSchool = undefined;
                // モーダルを閉じる
                closeModal(true);
            }
        });
    }

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(false);
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
        });
    }
    if (backdrop) backdrop.addEventListener('click', closeModal);
    
    // ドラッグハンドルでスワイプダウンで閉じる
    const schoolHandle = document.querySelector('.school-modal-handle');
    const schoolSheet = document.querySelector('.school-modal-sheet');
    if (schoolHandle && schoolSheet) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        schoolHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            currentY = startY;
            isDragging = true;
            schoolSheet.style.transition = 'none';
        }, { passive: true });
        
        schoolHandle.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // 下方向のみドラッグ可能（上方向は無視）
            if (deltaY > 0) {
                schoolSheet.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });
        
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            
            const deltaY = currentY - startY;
            
            // 80px以上下にドラッグしたら閉じる
            if (deltaY > 80) {
                // インラインスタイルをクリアしてからcloseModalを呼ぶ
                schoolSheet.style.transition = '';
                schoolSheet.style.transform = '';
                closeModal();
            } else {
                // 元に戻す
                schoolSheet.style.transition = 'transform 0.2s ease-out';
                schoolSheet.style.transform = 'translateY(0)';
                // トランジション完了後にインラインスタイルをクリア
                setTimeout(() => {
                    schoolSheet.style.transition = '';
                    schoolSheet.style.transform = '';
                }, 200);
            }
        };
        
        schoolHandle.addEventListener('touchend', endDrag);
        schoolHandle.addEventListener('touchcancel', endDrag);
    }
    
    // 他の箇所から呼び出せるようにグローバル公開
    window.showSchoolModal = openModal;
    window.closeSchoolModal = closeModal;
}

// スライディングバナーの初期化
function initAdBannerSlider() {
    const slider = document.querySelector('.ad-banner-slider');
    const slides = document.querySelectorAll('.ad-banner-slide');
    const dots = document.querySelectorAll('.ad-dot');
    const container = document.querySelector('.ad-banner-slider-container');
    
    if (!slider || slides.length === 0 || !container) return;
    
    let currentIndex = 0;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let autoSlideInterval;
    
    // スライド更新関数
    function updateSlider(animate = true) {
        slider.style.transition = animate ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        slider.style.transform = `translateX(-${currentIndex * (100 / slides.length)}%)`;
        
        // ドットの更新
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
        
        // 次回のドラッグ開始用に現在の位置（ピクセル）を保持
        prevTranslate = -currentIndex * container.offsetWidth;
    }
    
    // 次のスライドへ
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
    }
    
    // 自動スライド開始
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 5000);
    }
    
    // 自動スライド停止
    function stopAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
    }
    
    // ドラッグ・スワイプイベント
    function handleStart(e) {
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        isDragging = true;
        stopAutoSlide();
        slider.style.transition = 'none';
    }
    
    function handleMove(e) {
        if (!isDragging) return;
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentX - startX;
        currentTranslate = prevTranslate + diff;
        
        // 範囲制限（端で引っ張れる感じを出す）
        const maxScroll = -(slides.length - 1) * container.offsetWidth;
        if (currentTranslate > 0) currentTranslate /= 3;
        if (currentTranslate < maxScroll) currentTranslate = maxScroll + (currentTranslate - maxScroll) / 3;
        
        slider.style.transform = `translateX(${currentTranslate}px)`;
    }
    
    function handleEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.type.includes('mouse') ? e.pageX : (e.changedTouches ? e.changedTouches[0].clientX : startX);
        const diff = endX - startX;
        
        // 50px以上動かしたらスライド
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentIndex > 0) {
                currentIndex--;
            } else if (diff < 0 && currentIndex < slides.length - 1) {
                currentIndex++;
            }
        }
        
        updateSlider();
        startAutoSlide();
    }
    
    // タッチイベント
    container.addEventListener('touchstart', handleStart, { passive: true });
    container.addEventListener('touchmove', handleMove, { passive: true });
    container.addEventListener('touchend', handleEnd);
    
    // マウスイベント（PCブラウザ用）
    container.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    
    // リサイズ対応
    window.addEventListener('resize', () => {
        updateSlider(false);
    });
    
    // 初期状態
    updateSlider(false);
    startAutoSlide();
}

// 音量調整のセットアップ
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const volumeIcon = document.getElementById('volumeIcon');
    
    const updateVolumeIcon = (volume) => {
        if (!volumeIcon) return;
        const waves = volumeIcon.querySelectorAll('.volume-wave');
        const mutes = volumeIcon.querySelectorAll('.volume-mute');
        
        if (volume === 0) {
            // ミュート状態
            waves.forEach(w => w.style.display = 'none');
            mutes.forEach(m => m.style.display = 'block');
        } else {
            // 音量あり
            waves.forEach(w => w.style.display = 'block');
            mutes.forEach(m => m.style.display = 'none');
        }
    };
    
    if (volumeSlider && volumeValue) {
        // 保存された音量を読み込み
        const savedVolume = SoundEffects.getVolume();
        volumeSlider.value = Math.round(savedVolume * 100);
        volumeValue.textContent = `${Math.round(savedVolume * 100)}%`;
        updateVolumeIcon(Math.round(savedVolume * 100));
        
        // スライダーの変更イベント
        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            SoundEffects.setVolume(value);
            volumeValue.textContent = `${e.target.value}%`;
            updateVolumeIcon(parseInt(e.target.value));
        });
        
        // スライダーを離したときにテスト音を再生
        volumeSlider.addEventListener('change', () => {
            SoundEffects.playTap();
        });
    }
}

let correctWords = new Set(); // 正解済み（青マーカー用）
let wrongWords = new Set();
let isCardRevealed = false;
let currentRangeStart = 0; // 現在の学習範囲（開始index）
let currentRangeEnd = 0;   // 現在の学習範囲（終了index、exclusive）
let isInputModeActive = false; // 日本語→英語入力モードかどうか
let inputAnswerSubmitted = false; // 入力回答が送信済みかどうか
let isShiftActive = false; // Shiftキーがアクティブかどうか（大文字入力モード）
let isHandwritingMode = false; // 手書き入力モードかどうか（日本語→英語で使用）
let handwritingUIInitialized = false; // 手書きUI初期化済みかどうか
let selectedQuizDirection = 'eng-to-jpn'; // 学習方向: 'eng-to-jpn' または 'jpn-to-eng'
let questionStatus = []; // 各問題の回答状況を追跡（'correct', 'wrong', null）
let progressBarStartIndex = 0; // 進捗バーの表示開始インデックス（20問ずつ表示）
const PROGRESS_BAR_DISPLAY_COUNT = 20; // 進捗バーに表示する問題数
let isTimeAttackMode = false; // タイムアタックモードかどうか
let timerInterval = null; // タイマーのインターバル
let totalTimeRemaining = 0; // 残り時間（秒）
let wordStartTime = 0; // 現在の単語の開始時間
let wordTimerInterval = null; // 単語あたりのタイマーのインターバル
let wordResponseStartTime = 0;
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
let inputListViewMode = 'expand'; // 単語一覧の表示モード: 'flip' (フリップ) または 'expand' (展開)
let reorderAnswerSubmitted = false; // 回答が送信済みかどうか
let reorderSelectedWords = []; // 選択された単語の配列

// 四択問題モード用変数
let isChoiceQuestionModeActive = false; // 四択問題モードかどうか
let choiceQuestionData = []; // 四択問題データ
let currentChoiceQuestionIndex = 0; // 現在の四択問題のインデックス
let choiceAnswerSubmitted = false; // 四択回答が送信済みかどうか
let selectedChoiceIndex = -1; // 選択された選択肢のインデックス

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

// 出た度（appearanceCount）を★の数（1-5）に変換
function getStarRating(count) {
    if (count >= 100) return 5;
    if (count >= 50) return 4;
    if (count >= 20) return 3;
    if (count >= 5) return 2;
    return 1;
}

// 単語の進捗保存用カテゴリーを取得（小学生で習った単語、すべての単語の場合はword.categoryを使用）
function getProgressCategory(word) {
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === '大阪府のすべての英単語') {
        return word.category;
    }
    return selectedCategory;
}

// 単語の進捗を手動で切り替える（青→赤→未学習→青...）
function cycleWordProgress(word, numberEl, itemEl) {
    const categoryKey = word.category; // すべての単語の場合は単語自身のカテゴリーを使用
    const modes = ['card', 'input'];
    
    // 現在の状態を判定
    const isCorrect = numberEl.classList.contains('marker-correct');
    const isWrong = numberEl.classList.contains('marker-wrong');
    
    // 全モードの進捗を更新
    modes.forEach(mode => {
        const correctKey = `correctWords-${categoryKey}_${mode}`;
        const wrongKey = `wrongWords-${categoryKey}_${mode}`;
        
        let correctSet = new Set();
        let wrongSet = new Set();
        
        const savedCorrect = localStorage.getItem(correctKey);
        const savedWrong = localStorage.getItem(wrongKey);
        
        if (savedCorrect) {
            JSON.parse(savedCorrect).forEach(id => correctSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
        }
        if (savedWrong) {
            JSON.parse(savedWrong).forEach(id => wrongSet.add(typeof id === 'string' ? parseInt(id, 10) : id));
        }
        
        if (isCorrect) {
            // 青→赤
            correctSet.delete(word.id);
            wrongSet.add(word.id);
        } else if (isWrong) {
            // 赤→未学習
            wrongSet.delete(word.id);
        } else {
            // 未学習→青
            correctSet.add(word.id);
        }
        
        localStorage.setItem(correctKey, JSON.stringify([...correctSet]));
        localStorage.setItem(wrongKey, JSON.stringify([...wrongSet]));
    });
    
    // UIを更新
    numberEl.classList.remove('marker-correct', 'marker-wrong');
    itemEl.classList.remove('marker-correct', 'marker-wrong');
    
    if (isCorrect) {
        // 青→赤
        numberEl.classList.add('marker-wrong');
        itemEl.classList.add('marker-wrong');
    } else if (isWrong) {
        // 赤→未学習（何もつけない）
    } else {
        // 未学習→青
        numberEl.classList.add('marker-correct');
        itemEl.classList.add('marker-correct');
    }
    
    // progressCacheを更新
    if (progressCache['__all__']) {
        if (isCorrect) {
            progressCache['__all__'].correct.delete(word.id);
            progressCache['__all__'].wrong.add(word.id);
        } else if (isWrong) {
            progressCache['__all__'].wrong.delete(word.id);
        } else {
            progressCache['__all__'].correct.add(word.id);
        }
    }
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



// 大阪府のすべての英単語で学習を開始
function startAllWordsLearning() {
    try {
        let allWords = [];
        
        // getVocabularyByCategory を使ってサブカテゴリーから取得（確実な方法）
        if (typeof getVocabularyByCategory !== 'undefined') {
            const seenIds = new Set();
            
            // カテゴリ別単語のサブカテゴリー
            const elementarySubcategories = [
                '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
                '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
                '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
            ];
            
            // レベル別サブカテゴリー
            const level1Subcategories = ['冠詞', '代名詞', '名詞', '動詞', '形容詞', '副詞', '前置詞', '疑問詞', '間投詞'];
            const level2Subcategories = ['名詞', '動詞', '形容詞', '副詞', '前置詞', '助動詞', '接続詞', '数や量を表す詞', '代名詞'];
            const level3Subcategories = ['名詞', '動詞', '形容詞', '副詞', '前置詞', '接続詞', '再帰代名詞', '関係代名詞'];
            
            // カテゴリ別単語を取得
            elementarySubcategories.forEach(subcat => {
                const words = getVocabularyByCategory(subcat) || [];
                words.forEach(word => {
                    if (word && word.id && !seenIds.has(word.id)) {
                        seenIds.add(word.id);
                        allWords.push(word);
                    }
                });
            });
            
            // レベル1単語を取得
            level1Subcategories.forEach(subcat => {
                const words = getVocabularyByCategory(`LEVEL1 ${subcat}`) || [];
                words.forEach(word => {
                    if (word && word.id && !seenIds.has(word.id)) {
                        seenIds.add(word.id);
                        allWords.push(word);
                    }
                });
            });
            
            // レベル2単語を取得
            level2Subcategories.forEach(subcat => {
                const words = getVocabularyByCategory(`LEVEL2 ${subcat}`) || [];
                words.forEach(word => {
                    if (word && word.id && !seenIds.has(word.id)) {
                        seenIds.add(word.id);
                        allWords.push(word);
                    }
                });
            });
            
            // レベル3単語を取得
            level3Subcategories.forEach(subcat => {
                const words = getVocabularyByCategory(`LEVEL3 ${subcat}`) || [];
                words.forEach(word => {
                    if (word && word.id && !seenIds.has(word.id)) {
                        seenIds.add(word.id);
                        allWords.push(word);
                    }
                });
            });
        }
        
        // フォールバック
        if (allWords.length === 0) {
            allWords = getAllWordData();
        }
        
        if (!allWords || allWords.length === 0) {
            showAlert('エラー', '単語データが見つかりません。');
            return;
        }
        
        // 直接単語一覧を表示（学習方法選択なし）
        showInputModeDirectly('大阪府のすべての英単語', allWords, 'すべての単語');
    } catch (error) {
        console.error('startAllWordsLearning error:', error);
        showAlert('エラー', '単語データの読み込みに失敗しました。');
    }
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
    // HTMLのIDに合わせたカテゴリー名を使用
    const categories = [
        { displayName: 'カテゴリー別', dataName: '小学生で習った単語とカテゴリー別に覚える単語' },
        { displayName: '超重要500語', dataName: 'LEVEL1 超重要単語400' },
        { displayName: '重要500語', dataName: 'LEVEL2 重要単語300' },
        { displayName: 'ハイレベル300語', dataName: 'LEVEL3 差がつく単語200' },
        { displayName: 'LEVEL4 私立高校入試レベル', dataName: 'LEVEL4 私立高校入試レベル' },
        { displayName: 'LEVEL5 難関私立高校入試レベル', dataName: 'LEVEL5 難関私立高校入試レベル' },
        { displayName: '大阪B問題対策 厳選例文暗記60【和文英訳対策】', dataName: '大阪B問題対策 厳選例文暗記60【和文英訳対策】' },
        { displayName: '条件英作文特訓コース', dataName: '条件英作文特訓コース' },
        { displayName: '大阪C問題対策英単語タイムアタック', dataName: '大阪C問題対策英単語タイムアタック' },
        { displayName: 'PartCディクテーション', dataName: 'PartCディクテーション' },
        { displayName: '大阪府のすべての英単語', dataName: '大阪府のすべての英単語' }
    ];
    
    categories.forEach(({ displayName, dataName }) => {
        const category = displayName; // HTMLのIDに使用する名前
        const categoryDataName = dataName; // データ取得に使用する名前
        let categoryWords;
        
        if (categoryDataName === '小学生で習った単語とカテゴリー別に覚える単語') {
            // サブカテゴリーベースで計算（updateSubcategoryProgressBarsと同じロジック）
            const elementarySubcategories = [
                '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
                '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
                '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
            ];
            
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            let totalWordsCount = 0;
            // 入力モード用のカウンター
            let inputModeCorrectCount = 0;
            let inputModeWrongCount = 0;
            
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            // 入力モード専用のセット
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            
            // 各サブカテゴリーの単語を取得して進捗を計算
            elementarySubcategories.forEach(subcat => {
                let words = [];
                if (typeof getVocabularyByCategory !== 'undefined') {
                    words = getVocabularyByCategory(subcat) || [];
                }
                
                totalWordsCount += words.length;
                
                // 各モードの進捗を合算
                modes.forEach(mode => {
                    const savedCorrectWords = localStorage.getItem(`correctWords-${subcat}_${mode}`);
                    const savedWrongWords = localStorage.getItem(`wrongWords-${subcat}_${mode}`);
                    
                    if (savedCorrectWords) {
                        JSON.parse(savedCorrectWords).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!allWrongSet.has(numId)) {
                                allCorrectSet.add(numId);
                            }
                            // 入力モードの場合は別途記録
                            if (mode === 'input' && !inputWrongSet.has(numId)) {
                                inputCorrectSet.add(numId);
                            }
                        });
                    }
                    
                    if (savedWrongWords) {
                        JSON.parse(savedWrongWords).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            allWrongSet.add(numId);
                            allCorrectSet.delete(numId);
                            // 入力モードの場合は別途記録
                            if (mode === 'input') {
                                inputWrongSet.add(numId);
                                inputCorrectSet.delete(numId);
                            }
                        });
                    }
                });
            });
            
            // 各サブカテゴリーの単語をチェック
            elementarySubcategories.forEach(subcat => {
                let words = [];
                if (typeof getVocabularyByCategory !== 'undefined') {
                    words = getVocabularyByCategory(subcat) || [];
                }
                
                words.forEach(word => {
                    if (allWrongSet.has(word.id)) {
                        wrongCountInCategory++;
                    } else if (allCorrectSet.has(word.id)) {
                        correctCountInCategory++;
                    }
                    // 入力モードの進捗を別途カウント
                    if (inputWrongSet.has(word.id)) {
                        inputModeWrongCount++;
                    } else if (inputCorrectSet.has(word.id)) {
                        inputModeCorrectCount++;
                    }
                });
            });
            
            const total = totalWordsCount;
            const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
            const completedCount = correctCountInCategory + wrongCountInCategory;
            const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
            // 入力モードで全問正解しているかを判定
            const isInputModeComplete = total > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === total;
            
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
                // 両方のCOMPLETEクラスを削除
                barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
                if (isInputModeComplete) {
                    // 入力モード（日本語→英語）で全問正解: 金色
                    barContainer.classList.add('category-progress-complete-input');
                } else if (isComplete) {
                    // カードモード（英語→日本語）で全問正解: 青色
                    barContainer.classList.add('category-progress-complete');
                }
            }
            if (text) {
                text.textContent = `${completedCount}/${total}語`;
            }
            
            return; // 処理完了
        } else if (categoryDataName === '大阪府のすべての英単語') {
            // 全単語データを使用
            categoryWords = getAllWordData();
            
            // 全単語の進捗を計算（各単語の元のカテゴリーの進捗を確認）
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            // 入力モード用のカウンター
            let inputModeCorrectCount = 0;
            let inputModeWrongCount = 0;
            
            // 全モードの進捗を合算
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            // 入力モード専用のセット
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            
            modes.forEach(mode => {
                categoryWords.forEach(word => {
                    const wordCategory = word.category || 'LEVEL1 超重要単語400';
                    const savedCorrectWords = localStorage.getItem(`correctWords-${wordCategory}_${mode}`);
                    const savedWrongWords = localStorage.getItem(`wrongWords-${wordCategory}_${mode}`);
                    
                    if (savedCorrectWords) {
                        const parsed = JSON.parse(savedCorrectWords);
                        parsed.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!allWrongSet.has(numId)) {
                                allCorrectSet.add(numId);
                            }
                            // 入力モードの場合は別途記録
                            if (mode === 'input' && !inputWrongSet.has(numId)) {
                                inputCorrectSet.add(numId);
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
                            // 入力モードの場合は別途記録
                            if (mode === 'input') {
                                inputWrongSet.add(numId);
                                inputCorrectSet.delete(numId);
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
                // 入力モードの進捗を別途カウント
                if (inputWrongSet.has(word.id)) {
                    inputModeWrongCount++;
                } else if (inputCorrectSet.has(word.id)) {
                    inputModeCorrectCount++;
                }
            });
            
            const total = categoryWords.length;
            const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
            const completedCount = correctCountInCategory + wrongCountInCategory;
            const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
            // 入力モードで全問正解しているかを判定
            const isInputModeComplete = total > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === total;
            
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
                // 両方のCOMPLETEクラスを削除
                barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
                if (isInputModeComplete) {
                    // 入力モード（日本語→英語）で全問正解: 金色
                    barContainer.classList.add('category-progress-complete-input');
                } else if (isComplete) {
                    // カードモード（英語→日本語）で全問正解: 青色
                    barContainer.classList.add('category-progress-complete');
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
        } else if (categoryDataName === '大阪C問題対策英単語タイムアタック') {
            // タイムアタックモード：LEVEL1 超重要単語400の単語を使用
            if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                const allWords = getAllVocabulary();
                categoryWords = allWords.filter(word => word.category === 'LEVEL1 超重要単語400');
            } else {
                categoryWords = wordData.filter(word => word.category === 'LEVEL1 超重要単語400');
            }
        } else if (categoryDataName === '大阪B問題対策 厳選例文暗記60【和文英訳対策】') {
            // 大阪B問題対策：例文データを使用（単語データとは別管理）
            // 例文データはsentenceMemorizationDataとして定義されている
            // 進捗計算は例文データで行う
            if (typeof sentenceMemorizationData !== 'undefined') {
                // 例文データの進捗を計算
                const { correctSet, wrongSet } = loadCategoryWords(categoryDataName);
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
                    // 両方のCOMPLETEクラスを削除してから条件に応じて追加
                    barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
                    if (isComplete) {
                        barContainer.classList.add('category-progress-complete');
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
        } else if (categoryDataName === 'LEVEL1 超重要単語400' || categoryDataName === 'LEVEL2 重要単語300' || categoryDataName === 'LEVEL3 差がつく単語200' || 
                   categoryDataName === 'LEVEL4 私立高校入試レベル' || categoryDataName === 'LEVEL5 難関私立高校入試レベル') {
            // レベル別単語：vocabulary-data.jsから取得（最適化）
            const levelMap = {
                'LEVEL1 超重要単語400': 1,
                'LEVEL2 重要単語300': 2,
                'LEVEL3 差がつく単語200': 3,
                'LEVEL4 私立高校入試レベル': 4,
                'LEVEL5 難関私立高校入試レベル': 5
            };
            const level = levelMap[categoryDataName];
            if (level && typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
                categoryWords = getVocabularyByLevel(level);
            } else if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                const allWords = getAllVocabulary();
                categoryWords = allWords.filter(word => word.category === categoryDataName);
            } else {
                categoryWords = wordData.filter(word => word.category === categoryDataName);
            }
        } else {
            // その他のカテゴリー：vocabulary-data.jsから取得を試みる
            if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                const allWords = getAllVocabulary();
                categoryWords = allWords.filter(word => word.category === categoryDataName);
            } else {
                categoryWords = wordData.filter(word => word.category === categoryDataName);
            }
        }
        
        // レベル別単語の場合は、サブカテゴリーから直接取得して計算（categoryWordsが空でも処理を続行）
        if (categoryDataName === 'LEVEL1 超重要単語400' || categoryDataName === 'LEVEL2 重要単語300' || categoryDataName === 'LEVEL3 差がつく単語200') {
            // 進捗率を計算（正解数、間違い数）
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            // 入力モード用のカウンター
            let inputModeCorrectCount = 0;
            let inputModeWrongCount = 0;
            
            // レベル番号を取得
            const levelMap = {
                'LEVEL1 超重要単語400': 1,
                'LEVEL2 重要単語300': 2,
                'LEVEL3 差がつく単語200': 3
            };
            const level = levelMap[categoryDataName];
            
            // サブカテゴリーを定義
            const subcategoryMap = {
                1: ['冠詞', '代名詞', '名詞', '動詞', '形容詞', '副詞', '前置詞', '疑問詞', '間投詞'],
                2: ['名詞', '動詞', '形容詞', '副詞', '前置詞', '助動詞', '接続詞', '数や量を表す詞', '代名詞'],
                3: ['名詞', '動詞', '形容詞', '副詞', '前置詞', '接続詞', '関係代名詞', '再帰代名詞']
            };
            const subcategories = subcategoryMap[level] || [];
            
            // サブカテゴリ名をLEVEL形式に変換（例：'冠詞' → 'LEVEL1 冠詞'）
            const levelSubcategories = subcategories.map(subcat => `LEVEL${level} ${subcat}`);
            
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            // 入力モード専用のセット
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            let totalWordsCount = 0;
            
            // 各サブカテゴリーの単語を取得して進捗を計算
            levelSubcategories.forEach(subcat => {
                let words = [];
                if (typeof getVocabularyByCategory !== 'undefined') {
                    words = getVocabularyByCategory(subcat) || [];
                }
                
                totalWordsCount += words.length;
                
                // 各モードの進捗を合算
                modes.forEach(mode => {
                    const savedCorrectWords = localStorage.getItem(`correctWords-${subcat}_${mode}`);
                    const savedWrongWords = localStorage.getItem(`wrongWords-${subcat}_${mode}`);
                    
                    if (savedCorrectWords) {
                        JSON.parse(savedCorrectWords).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!allWrongSet.has(numId)) {
                                allCorrectSet.add(numId);
                            }
                            // 入力モードの場合は別途記録
                            if (mode === 'input' && !inputWrongSet.has(numId)) {
                                inputCorrectSet.add(numId);
                            }
                        });
                    }
                    
                    if (savedWrongWords) {
                        JSON.parse(savedWrongWords).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            allWrongSet.add(numId);
                            allCorrectSet.delete(numId);
                            // 入力モードの場合は別途記録
                            if (mode === 'input') {
                                inputWrongSet.add(numId);
                                inputCorrectSet.delete(numId);
                            }
                        });
                    }
                });
            });
            
            // 各サブカテゴリーの単語をチェック
            levelSubcategories.forEach(subcat => {
                let words = [];
                if (typeof getVocabularyByCategory !== 'undefined') {
                    words = getVocabularyByCategory(subcat) || [];
                }
                
                words.forEach(word => {
                    if (allWrongSet.has(word.id)) {
                        wrongCountInCategory++;
                    } else if (allCorrectSet.has(word.id)) {
                        correctCountInCategory++;
                    }
                    // 入力モードの進捗を別途カウント
                    if (inputWrongSet.has(word.id)) {
                        inputModeWrongCount++;
                    } else if (inputCorrectSet.has(word.id)) {
                        inputModeCorrectCount++;
                    }
                });
            });
            
            // 進捗を計算して更新
            const total = totalWordsCount;
            const correctPercent = total === 0 ? 0 : (correctCountInCategory / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCategory / total) * 100;
            const completedCount = correctCountInCategory + wrongCountInCategory;
            const isComplete = total > 0 && wrongCountInCategory === 0 && correctCountInCategory === total;
            // 入力モードで全問正解しているかを判定
            const isInputModeComplete = total > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === total;

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
                // 両方のCOMPLETEクラスを削除
                barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
                if (isInputModeComplete) {
                    // 入力モード（日本語→英語）で全問正解: 金色
                    barContainer.classList.add('category-progress-complete-input');
                } else if (isComplete) {
                    // カードモード（英語→日本語）で全問正解: 青色
                    barContainer.classList.add('category-progress-complete');
                }
            }
            if (text) {
                text.textContent = `${completedCount}/${total}語`;
            }
            
            return; // 処理完了、次のカテゴリーへ
        }
        
        // その他のカテゴリー用：categoryWordsが空の場合は0/0語を表示
        if (!categoryWords || categoryWords.length === 0) {
            const correctBar = document.getElementById(`progress-correct-${category}`);
            const wrongBar = document.getElementById(`progress-wrong-${category}`);
            const text = document.getElementById(`progress-text-${category}`);
            
            if (correctBar) correctBar.style.width = '0%';
            if (wrongBar) wrongBar.style.width = '0%';
            if (text) text.textContent = '0/0語';
            return;
        }
        
        // その他のカテゴリー：カテゴリごとの進捗を取得（全モード合算）
        let correctCountInCategory = 0;
        let wrongCountInCategory = 0;
        const { correctSet, wrongSet } = loadCategoryWordsForProgress(categoryDataName);
        
        categoryWords.forEach(word => {
            const isCorrect = correctSet.has(word.id);
            const isWrong = wrongSet.has(word.id);
            
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
            // 両方のCOMPLETEクラスを削除してから条件に応じて追加
            barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
            if (isComplete) {
                barContainer.classList.add('category-progress-complete');
            }
        }
        if (text) {
            text.textContent = `${completedCount}/${total}語`;
        }
    });
    
    // 不規則変化の単語の進捗バーを更新
    updateIrregularVerbsProgressBar();
    
    // 細分化メニューの進捗バーを更新
    updateSubcategoryProgressBars();
    
}

// 不規則変化の単語の進捗バーを更新
function updateIrregularVerbsProgressBar() {
    // 不規則変化のカテゴリー一覧とデータの対応
    const irregularCategoriesData = [
        { key: 'verbs-beginner', data: typeof irregularVerbsBeginner !== 'undefined' ? irregularVerbsBeginner : [] },
        { key: 'verbs-intermediate', data: typeof irregularVerbsIntermediate !== 'undefined' ? irregularVerbsIntermediate : [] },
        { key: 'verbs-advanced', data: typeof irregularVerbsAdvanced !== 'undefined' ? irregularVerbsAdvanced : [] },
        { key: 'comparatives', data: typeof irregularComparatives !== 'undefined' ? irregularComparatives : [] },
        { key: 'plurals', data: typeof irregularPlurals !== 'undefined' ? irregularPlurals : [] }
    ];
    
    // 全体の集計用
    let totalWordsAll = 0;
    let correctCountAll = 0;
    let wrongCountAll = 0;
    
    // 各サブカテゴリーの進捗を計算・更新
    irregularCategoriesData.forEach(({ key, data }) => {
        const categoryTotal = data.length;
        totalWordsAll += categoryTotal;
        
        let correctCount = 0;
        let wrongCount = 0;
        
        const savedCorrect = localStorage.getItem(`ivCorrect-${key}`);
        const savedWrong = localStorage.getItem(`ivWrong-${key}`);
        
        if (savedCorrect) {
            try {
                const correctSet = new Set(JSON.parse(savedCorrect));
                correctCount = correctSet.size;
            } catch (e) {}
        }
        if (savedWrong) {
            try {
                const wrongSet = new Set(JSON.parse(savedWrong));
                wrongCount = wrongSet.size;
            } catch (e) {}
        }
        
        correctCountAll += correctCount;
        wrongCountAll += wrongCount;
        
        // サブカテゴリーの進捗バーを更新
        const completedCount = correctCount + wrongCount;
        const correctPercent = categoryTotal === 0 ? 0 : (correctCount / categoryTotal) * 100;
        const wrongPercent = categoryTotal === 0 ? 0 : (wrongCount / categoryTotal) * 100;
        const isComplete = categoryTotal > 0 && wrongCount === 0 && correctCount === categoryTotal;
        
        const correctBar = document.getElementById(`progress-correct-${key}`);
        const wrongBar = document.getElementById(`progress-wrong-${key}`);
        const text = document.getElementById(`progress-text-${key}`);
        const barContainer = correctBar ? correctBar.parentElement : null;
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.width = `${wrongPercent}%`;
        }
        if (barContainer) {
            barContainer.classList.remove('category-progress-complete', 'category-progress-complete-input');
            if (isComplete) {
                barContainer.classList.add('category-progress-complete');
            }
        }
        if (text) {
            text.textContent = `${completedCount}/${categoryTotal}語`;
        }
    });
    
    // ホーム画面の全体進捗バーを更新
    const completedCountAll = correctCountAll + wrongCountAll;
    const correctPercentAll = totalWordsAll === 0 ? 0 : (correctCountAll / totalWordsAll) * 100;
    const wrongPercentAll = totalWordsAll === 0 ? 0 : (wrongCountAll / totalWordsAll) * 100;
    const isCompleteAll = totalWordsAll > 0 && wrongCountAll === 0 && correctCountAll === totalWordsAll;
    
    const correctBarAll = document.getElementById('progress-correct-irregular-verbs');
    const wrongBarAll = document.getElementById('progress-wrong-irregular-verbs');
    const textAll = document.getElementById('progress-text-irregular-verbs');
    const barContainerAll = correctBarAll ? correctBarAll.parentElement : null;
    
    if (correctBarAll) {
        correctBarAll.style.width = `${correctPercentAll}%`;
    }
    if (wrongBarAll) {
        wrongBarAll.style.width = `${wrongPercentAll}%`;
    }
    if (barContainerAll) {
        barContainerAll.classList.remove('category-progress-complete', 'category-progress-complete-input');
        if (isCompleteAll) {
            barContainerAll.classList.add('category-progress-complete');
        }
    }
    if (textAll) {
        textAll.textContent = `${completedCountAll}/${totalWordsAll}語`;
    }
}

// 不規則変化の進捗を保存
function saveIvProgress(category, index, isCorrect) {
    const correctKey = `ivCorrect-${category}`;
    const wrongKey = `ivWrong-${category}`;
    
    // 既存のデータを取得
    let correctSet = new Set();
    let wrongSet = new Set();
    
    try {
        const savedCorrect = localStorage.getItem(correctKey);
        const savedWrong = localStorage.getItem(wrongKey);
        if (savedCorrect) correctSet = new Set(JSON.parse(savedCorrect));
        if (savedWrong) wrongSet = new Set(JSON.parse(savedWrong));
    } catch (e) {}
    
    if (isCorrect) {
        // 正解の場合：間違いから削除し、正解に追加
        wrongSet.delete(index);
        correctSet.add(index);
    } else {
        // 不正解の場合：正解から削除し、間違いに追加
        correctSet.delete(index);
        wrongSet.add(index);
    }
    
    // 保存
    localStorage.setItem(correctKey, JSON.stringify([...correctSet]));
    localStorage.setItem(wrongKey, JSON.stringify([...wrongSet]));
    
    // 進捗バーを更新
    updateIrregularVerbsProgressBar();
}

// 細分化メニューの進捗バーを更新
function updateSubcategoryProgressBars() {
    // カテゴリー別のサブカテゴリー
    const elementarySubcategories = [
        '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
        '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
        '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
    ];
    
    // 共通の進捗バー更新関数
    function updateProgressBar(categoryName, subcategories) {
        let totalWords = 0;
        let correctCount = 0;
        let wrongCount = 0;
        
        const modes = ['card', 'input'];
        const allCorrectSet = new Set();
        const allWrongSet = new Set();
        
        // 各サブカテゴリーの単語を取得して進捗を計算
        subcategories.forEach(subcat => {
            let words = [];
            if (typeof getVocabularyByCategory !== 'undefined') {
                words = getVocabularyByCategory(subcat) || [];
            }
            
            totalWords += words.length;
            
            // 各モードの進捗を合算
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${subcat}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${subcat}_${mode}`);
                
                if (savedCorrectWords) {
                    JSON.parse(savedCorrectWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        if (!allWrongSet.has(numId)) {
                            allCorrectSet.add(numId);
                        }
                    });
                }
                
                if (savedWrongWords) {
                    JSON.parse(savedWrongWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allWrongSet.add(numId);
                        allCorrectSet.delete(numId);
                    });
                }
            });
        });
        
        // 各サブカテゴリーの単語をチェック
        subcategories.forEach(subcat => {
            let words = [];
            if (typeof getVocabularyByCategory !== 'undefined') {
                words = getVocabularyByCategory(subcat) || [];
            }
            
            words.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCount++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCount++;
                }
            });
        });
        
        const correctPercent = totalWords === 0 ? 0 : (correctCount / totalWords) * 100;
        const wrongPercent = totalWords === 0 ? 0 : (wrongCount / totalWords) * 100;
        const completedCount = correctCount + wrongCount;
        const isComplete = totalWords > 0 && wrongCount === 0 && correctCount === totalWords;
        
        // DOM要素を更新
        const correctBar = document.getElementById(`progress-correct-${categoryName}`);
        const wrongBar = document.getElementById(`progress-wrong-${categoryName}`);
        const text = document.getElementById(`progress-text-${categoryName}`);
        const barContainer = correctBar ? correctBar.closest('.accordion-progress-bar') : null;
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.left = `${correctPercent}%`;
            wrongBar.style.width = `${wrongPercent}%`;
        }
        if (barContainer) {
            if (isComplete) {
                barContainer.classList.add('accordion-progress-complete');
            } else {
                barContainer.classList.remove('accordion-progress-complete');
            }
        }
        if (text) {
            text.textContent = `${completedCount}/${totalWords}語`;
        }
    }
    
    // カテゴリー別の進捗バーを更新
    updateProgressBar('カテゴリー別', elementarySubcategories);
    
    // レベル別進捗バー更新関数（LEVEL1〜3用）
    function updateLevelProgressBar(categoryName, level, subcategories) {
        let totalWords = 0;
        let correctCount = 0;
        let wrongCount = 0;
        
        const modes = ['card', 'input'];
        const allCorrectSet = new Set();
        const allWrongSet = new Set();
        
        // サブカテゴリ名をLEVEL形式に変換（例：'冠詞' → 'LEVEL1 冠詞'）
        const levelSubcategories = subcategories.map(subcat => `LEVEL${level} ${subcat}`);
        
        // 各サブカテゴリーの単語を取得して進捗を計算
        levelSubcategories.forEach(subcat => {
            let words = [];
            if (typeof getVocabularyByCategory !== 'undefined') {
                words = getVocabularyByCategory(subcat) || [];
            }
            
            totalWords += words.length;
            
            // 各モードの進捗を合算
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${subcat}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${subcat}_${mode}`);
                
                if (savedCorrectWords) {
                    JSON.parse(savedCorrectWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        if (!allWrongSet.has(numId)) {
                            allCorrectSet.add(numId);
                        }
                    });
                }
                
                if (savedWrongWords) {
                    JSON.parse(savedWrongWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allWrongSet.add(numId);
                        allCorrectSet.delete(numId);
                    });
                }
            });
        });
        
        // 各サブカテゴリーの単語をチェック
        levelSubcategories.forEach(subcat => {
            let words = [];
            if (typeof getVocabularyByCategory !== 'undefined') {
                words = getVocabularyByCategory(subcat) || [];
            }
            
            words.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCount++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCount++;
                }
            });
        });
        
        const correctPercent = totalWords === 0 ? 0 : (correctCount / totalWords) * 100;
        const wrongPercent = totalWords === 0 ? 0 : (wrongCount / totalWords) * 100;
        const completedCount = correctCount + wrongCount;
        const isComplete = totalWords > 0 && wrongCount === 0 && correctCount === totalWords;
        
        // DOM要素を更新
        const correctBar = document.getElementById(`progress-correct-${categoryName}`);
        const wrongBar = document.getElementById(`progress-wrong-${categoryName}`);
        const text = document.getElementById(`progress-text-${categoryName}`);
        const barContainer = correctBar ? correctBar.closest('.accordion-progress-bar') : null;
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.left = `${correctPercent}%`;
            wrongBar.style.width = `${wrongPercent}%`;
        }
        if (barContainer) {
            if (isComplete) {
                barContainer.classList.add('accordion-progress-complete');
            } else {
                barContainer.classList.remove('accordion-progress-complete');
            }
        }
        if (text) {
            text.textContent = `${completedCount}/${totalWords}語`;
        }
    }
    
    // レベル1〜3のサブカテゴリ
    const level1Subcategories = ['冠詞', '代名詞', '名詞', '動詞', '形容詞', '副詞', '前置詞', '疑問詞', '間投詞'];
    const level2Subcategories = ['名詞', '動詞', '形容詞', '副詞', '前置詞', '助動詞', '接続詞', '数や量を表す詞', '代名詞'];
    const level3Subcategories = ['名詞', '動詞', '形容詞', '副詞', '前置詞', '接続詞', '関係代名詞', '再帰代名詞'];
    
    // レベル1〜3の進捗バーを更新
    updateLevelProgressBar('レベル１ 超重要500語', 1, level1Subcategories);
    updateLevelProgressBar('レベル２ 重要500語', 2, level2Subcategories);
    updateLevelProgressBar('レベル３ ハイレベル300語', 3, level3Subcategories);
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
    wordCheckbox: document.getElementById('wordCheckbox'),
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
    cardFeedbackOverlay: document.getElementById('cardFeedbackOverlay'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalActions: document.getElementById('modalActions'),
    unitName: document.getElementById('unitName'),
    unitPauseBtn: document.getElementById('unitPauseBtn'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    pauseContinueBtn: document.getElementById('pauseContinueBtn'),
    pauseQuitBtn: document.getElementById('pauseQuitBtn'),
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
// アプリ起動時に音声合成を事前に初期化
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) return;
    
    // 音声リストを事前に読み込む
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        voicesLoaded = true;
        console.log('[Speech] Voices pre-loaded:', voices.length);
    }
    
    // onvoiceschangedイベントを設定
    window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = true;
        console.log('[Speech] Voices loaded via event:', window.speechSynthesis.getVoices().length);
    };
    
    // iOSでの音声合成を有効にするため、ユーザーインタラクション時に初期化
    const initOnInteraction = () => {
        if (!voicesLoaded) {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesLoaded = true;
            }
        }
        // 無音の発話を実行して音声合成を初期化（iOSで必要）
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.cancel();
        
        // イベントリスナーを削除
        document.removeEventListener('touchstart', initOnInteraction);
        document.removeEventListener('click', initOnInteraction);
        console.log('[Speech] Initialized on user interaction');
    };
    
    document.addEventListener('touchstart', initOnInteraction, { once: true, passive: true });
    document.addEventListener('click', initOnInteraction, { once: true });
}

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
    
    // 音声リストの読み込みを待つ（既存のハンドラを上書きしないようにする）
    const checkVoices = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
        voicesLoaded = true;
        callback();
            return true;
        }
        return false;
    };
    
    // まず即座にチェック
    if (checkVoices()) return;
    
    // 少し待ってから再チェック
    const intervalId = setInterval(() => {
        if (checkVoices()) {
            clearInterval(intervalId);
        }
    }, 100);
    
    // タイムアウト（500ms待っても読み込まれない場合はデフォルトで続行）
    setTimeout(() => {
        clearInterval(intervalId);
        if (!voicesLoaded) {
            voicesLoaded = true;
            callback();
        }
    }, 500);
}

function speakWord(word, buttonElement) {
    console.log('[speakWord] Called with word:', word);
    
    // 既存の音声を停止
    if (currentSpeech) {
        window.speechSynthesis.cancel();
        currentSpeech = null;
    }
    
    // 既存のplayingクラスを全て削除
    document.querySelectorAll('.audio-btn.playing').forEach(btn => {
        btn.classList.remove('playing');
    });
    
    // ボタンに再生中のスタイルを即座に追加
    if (buttonElement) {
        buttonElement.classList.add('playing');
    }

    // Web Speech APIが利用可能か確認
    if (!('speechSynthesis' in window)) {
        console.log('[speakWord] speechSynthesis not available');
        if (buttonElement) buttonElement.classList.remove('playing');
        showAlert('エラー', 'お使いのブラウザでは音声機能が利用できません。');
        return;
    }

    console.log('[speakWord] speechSynthesis available, loading voices...');
    // 音声リストの読み込みを待つ
    ensureVoicesLoaded(() => {
        console.log('[speakWord] Voices loaded, creating utterance...');
        // ネイティブ音声を取得
        const voice = getNativeVoice();
        
        // 表示用の綴りとは別に、発音用テキストを調整
        let speakText = word;
        // 単独の a は「エイ」ではなく短母音「ア」に近づける
        if (word === 'a' || word === 'A') {
            // 英語音声で /ə/ に近づけるために "uh" を使用
            speakText = 'uh';
        }
        // I は「アイ」と発音させる
        if (word === 'I' || word === 'i') {
            // "eye" を使用して「アイ」と発音させる
            speakText = 'eye';
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
        };

        // 音声を再生
        console.log('[speakWord] Speaking:', speakText);
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
            // その後、LEVEL1 超重要単語400、LEVEL2 重要単語300、LEVEL3 差がつく単語200に分割
            // 注意: 実際のデータ構造に応じて調整が必要
            if (index < 600) {
                word.category = 'LEVEL1 超重要単語400';
            } else if (index < 800) {
                word.category = 'LEVEL2 重要単語300';
            } else if (index < 900) {
                word.category = 'LEVEL3 差がつく単語200';
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
        // 効果音システムを初期化
        SoundEffects.init();
        
        // 目標達成済みフラグをリセット（ページロード時は常にリセット）
        // 目標達成画面は学習完了後にホーム画面に戻った時に表示する
        hasReachedGoalBefore = false;
        pendingGoalCelebration = false;
        
        preventZoom();
        assignCategories();
        loadData();
        initExamCountdown();
        setupEventListeners();
        initSchoolSelector();
        setupVolumeControl();
        initSpeechSynthesis(); // 音声合成を事前に初期化
        setupInputListModeToggle();
        setupInputListSettings();
        setupInputListFilter();
        setupRedSheetStickyScroll();
        updateVocabProgressBar();
        initMemoPad();
        initAdBannerSlider();
        
        // タップ後にフォーカスを外す（スマホでのアクティブ状態残り防止）
        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('.category-card, .category-accordion-header, .category-accordion-item, .category-accordion-item-green, .category-accordion-item-purple, .learning-menu-category-btn, .learning-menu-subcategory-btn');
            if (target) {
                setTimeout(() => {
                    target.blur();
                }, 100);
            }
        }, { passive: true });
        
        // スプラッシュ画面を表示
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            // スプラッシュ画面を3秒表示してから非表示にする
            setTimeout(() => {
                // スプラッシュ終了時にテーマカラーを#0055caに更新
                updateThemeColor(false);
                splashScreen.classList.add('hidden');
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    showCategorySelection();
                }, 500);
            }, 3000);
        } else {
            // スプラッシュ画面が見つからない場合は即座にカテゴリー選択画面を表示
            updateThemeColor(false);
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
    
    // 入試対策フィルタのイベントリスナーを追加
    const examTypeFilter = document.getElementById('examTypeFilter');
    if (examTypeFilter) {
        examTypeFilter.addEventListener('change', function() {
            const selectedType = this.value;
            const courseScoreSection = document.getElementById('courseScoreSection');
            if (!courseScoreSection) return;
            
            const cards = courseScoreSection.querySelectorAll('.category-card[data-exam-type]');
            cards.forEach(card => {
                const cardType = card.getAttribute('data-exam-type');
                if (selectedType === 'all') {
                    card.style.display = '';
                } else if (cardType === 'all' || cardType === selectedType) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// ヘッダーボタンの表示/非表示を制御
// テーマカラーを更新（スプラッシュ以外は常に#0055ca）
function updateThemeColor(isLearningMode) {
    const color = '#0055ca';
    
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
    
    // iOS用のステータスバースタイルも更新（常に白テキスト）
    if (statusBarStyleMeta) {
        statusBarStyleMeta.setAttribute('content', 'black-translucent');
    }
}

// テストモード用のテーマカラーを更新（白背景）
function updateThemeColorForTest(isTestMode) {
    const color = isTestMode ? '#ffffff' : '#0055ca';
    
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const statusBarStyleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', color);
        
        const parent = themeColorMeta.parentNode;
        themeColorMeta.remove();
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = color;
        parent.insertBefore(newMeta, parent.firstChild);
    }
    
    // iOS用のステータスバースタイルも更新
    if (statusBarStyleMeta) {
        statusBarStyleMeta.setAttribute('content', isTestMode ? 'default' : 'black-translucent');
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
        feedbackOverlay.style.bottom = '0';
        feedbackOverlay.style.height = 'auto';
    }
}

// タイトルにレベルバッジを追加するヘルパー関数
function formatTitleWithLevelBadge(title) {
    if (!title) return title;
    // タイトルからレベル表記を削除する共通処理
    const cleanTitle = title.replace(/レベル[０-９0-9１-９]+\s*/g, '').replace(/LEVEL[0-9]+\s*/g, '');
    
    // カテゴリー別のサブカテゴリ一覧（指定順）
    const elementarySubcategories = [
        '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
        '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
        '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
    ];
    
    // カテゴリ別のサブカテゴリかどうかチェック
    const isElementarySubcategory = elementarySubcategories.some(sub => title.includes(sub));
    
    if (title.includes('LEVEL1') || title.includes('超重要') || title.includes('レベル１') || title.includes('レベル1')) {
        return '<span class="level-badge level-badge-header level-badge-red">Level<b>1</b></span> ' + cleanTitle.replace(/超重要単語400/g, '超重要500語');
    } else if (title.includes('LEVEL2') || title.includes('重要500語') || title.includes('レベル２') || title.includes('レベル2')) {
        return '<span class="level-badge level-badge-header level-badge-orange">Level<b>2</b></span> ' + cleanTitle.replace(/重要単語300/g, '重要500語');
    } else if (title.includes('LEVEL3') || title.includes('差がつく') || title.includes('レベル３') || title.includes('レベル3')) {
        return '<span class="level-badge level-badge-header level-badge-blue">Level<b>3</b></span> ' + cleanTitle.replace(/差がつく単語200/g, 'ハイレベル300語');
    } else if (title.includes('LEVEL4') || title.includes('私立高校入試レベル') || title.includes('レベル４') || title.includes('レベル4')) {
        return '<span class="level-badge level-badge-header level-badge-purple">Level<b>4</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL5') || title.includes('難関私立高校入試レベル') || title.includes('レベル５') || title.includes('レベル5')) {
        return '<span class="level-badge level-badge-header level-badge-dark">Level<b>5</b></span> ' + cleanTitle;
    } else if (title.includes('カテゴリ別') || title.includes('レベル０') || title.includes('レベル0')) {
        // カテゴリー別のメインカテゴリ
        if (title.includes('カテゴリー別') || title.includes('カテゴリー別に覚える単語') || title.includes('カテゴリー別')) {
            return '<span class="level-badge level-badge-header level-badge-green">Level<b>0</b></span> カテゴリー別';
        } else {
            return cleanTitle;
        }
    } else if (isElementarySubcategory) {
        return '<span class="level-badge level-badge-header level-badge-green">Level<b>0</b></span> ' + cleanTitle;
    }
    return title;
}

// mode: 'home' = ホーム画面、'course' = コース選択画面、'back' = その他（戻るボタン表示）、'learning' = 学習画面
// title: コース選択画面で表示するタイトル（オプション）
// isTestMode: テストモード（アウトプットモード）かどうか
function updateHeaderButtons(mode, title = '', isTestMode = false) {
    const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
    const headerBackBtn = document.getElementById('headerBackBtn');
    const homeBtn = document.getElementById('homeBtn');
    const headerTitleLogo = document.querySelector('.header-title-logo');
    const headerTitleText = document.getElementById('headerTitleText');
    const headerTitleImage = document.getElementById('headerTitleImage');
    const headerContent = document.querySelector('.header-content');
    const headerLearningContent = document.getElementById('headerLearningContent');
    const headerLearningActions = document.getElementById('headerLearningActions');
    const headerPauseBtn = document.getElementById('headerPauseBtn');
    const appHeader = document.querySelector('.app-header');
    
    // ヘッダー全体は常に表示
    if (appHeader) {
        appHeader.classList.remove('hidden');
    }
    
    // 学習モード用ヘッダー要素の制御
    const headerTestBtn = document.getElementById('headerTestBtn');
    if (mode === 'learning') {
        // 学習モード時
        if (headerContent) headerContent.classList.add('hidden');
        if (headerLearningContent) headerLearningContent.classList.remove('hidden');
        if (hamburgerMenuBtn) hamburgerMenuBtn.classList.add('hidden');
        
        if (isTestMode) {
            // テストモード：×ボタンのみ表示、戻るボタンとテストボタンは非表示
            if (headerBackBtn) headerBackBtn.classList.add('hidden');
            if (headerTestBtn) headerTestBtn.classList.add('hidden');
            if (headerPauseBtn) headerPauseBtn.classList.remove('hidden');
            if (headerLearningActions) headerLearningActions.classList.remove('hidden');
        } else {
            // 学習モード（インプット）：戻るボタンとテストボタンを表示、×ボタンは非表示
            if (headerBackBtn) headerBackBtn.classList.remove('hidden');
            if (headerTestBtn) headerTestBtn.classList.remove('hidden');
            if (headerPauseBtn) headerPauseBtn.classList.add('hidden');
            if (headerLearningActions) headerLearningActions.classList.remove('hidden');
        }
    } else {
        // 通常モード時
        if (headerContent) headerContent.classList.remove('hidden');
        if (headerLearningContent) headerLearningContent.classList.add('hidden');
        if (headerLearningActions) headerLearningActions.classList.add('hidden');
    }
    
    // タイトルロゴの表示/非表示（ホーム画面のみ表示）
    if (headerTitleLogo) {
        if (mode === 'home') {
            headerTitleLogo.classList.remove('hidden');
        } else {
            headerTitleLogo.classList.add('hidden');
        }
    }
    
    // タイトル画像とテキストの表示/非表示
    if (headerTitleImage && headerTitleText) {
        if (mode === 'course' && title) {
            // コース選択時：テキストを表示、画像を非表示
            if (title === 'カテゴリー別') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-green">Level<b>0</b></span> カテゴリー別';
            } else if (title === 'レベル１ 超重要500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-red">Level<b>1</b></span> 超重要500語';
            } else if (title === 'レベル２ 重要500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-orange">Level<b>2</b></span> 重要500語';
            } else if (title === 'レベル３ ハイレベル300語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-blue">Level<b>3</b></span> ハイレベル300語';
            } else {
                headerTitleText.textContent = title;
            }
            headerTitleImage.classList.add('hidden');
            headerTitleText.classList.remove('hidden');
        } else if (mode === 'home') {
            // ホーム画面：画像を表示、テキストを非表示
            headerTitleImage.classList.remove('hidden');
            headerTitleText.classList.add('hidden');
        } else {
            // その他：両方非表示
            headerTitleImage.classList.add('hidden');
            headerTitleText.classList.add('hidden');
        }
    }
    
    if (hamburgerMenuBtn) {
        if (mode === 'home') {
            hamburgerMenuBtn.classList.remove('hidden');
        } else {
            hamburgerMenuBtn.classList.add('hidden');
        }
    }
    
    if (headerBackBtn) {
        if (mode === 'course' || mode === 'learning') {
            headerBackBtn.classList.remove('hidden');
        } else {
            headerBackBtn.classList.add('hidden');
        }
    }
    
    // 中断ボタンは常に非表示
    if (homeBtn) {
        homeBtn.classList.add('hidden');
    }
}

// ヘッダーの単元名を更新
function updateHeaderUnitName(unitName) {
    const headerUnitName = document.getElementById('headerUnitName');
    if (headerUnitName) {
        headerUnitName.textContent = unitName;
    }
}

// カテゴリー選択画面を表示
function showCategorySelection(slideIn = false) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 復習モードのタイトルとクラスをリセット
    resetReviewWrongWordsTitle();
    
    // 赤シートをリセット
    resetRedSheet();
    
    // テストモードのクラスをリセット
    document.body.classList.remove('quiz-test-mode');
    updateThemeColorForTest(false);
    
    // テストモード用の進捗表示を非表示
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress) testModeProgress.classList.add('hidden');
    const hwTestModeProgress = document.getElementById('hwTestModeProgress');
    if (hwTestModeProgress) hwTestModeProgress.classList.add('hidden');
    
    // 手書きクイズ画面を非表示
    const hwQuizView = document.getElementById('handwritingQuizView');
    if (hwQuizView) hwQuizView.classList.add('hidden');
    
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
    if (slideIn) {
        elements.categorySelection.classList.add('slide-in-left');
        setTimeout(() => {
            elements.categorySelection.classList.remove('slide-in-left');
        }, 300);
    }
    if (elements.mainContent) {
        elements.mainContent.classList.add('hidden');
    }
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
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
    const handwritingQuizView = document.getElementById('handwritingQuizView');
    const cardTopSection = document.querySelector('.card-top-section');
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    if (handwritingQuizView) handwritingQuizView.classList.add('hidden');
    if (cardTopSection) cardTopSection.classList.add('hidden');
    
    // モードフラグをリセット
    isInputModeActive = false;
    isSentenceModeActive = false;
    isReorderModeActive = false;
    isChoiceQuestionModeActive = false;
    document.body.classList.remove('choice-question-mode-active');
    
    // カードモード専用オーバーレイをリセット
    if (elements.cardFeedbackOverlay) {
        elements.cardFeedbackOverlay.classList.remove('active', 'correct', 'wrong', 'mastered');
    }
    
    // 進捗ステップボタンを表示
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    if (progressStepButtons) {
        progressStepButtons.classList.remove('hidden');
    }
    
    // 最新のデータを読み込んでから進捗を更新
    loadData();
    
    // 進捗バーを更新（データ読み込み後に実行）
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // 進捗バーを更新
            updateCategoryStars();
            updateVocabProgressBar();
            
            // 学習後にホームに戻った時、進捗アニメーションを実行
            if (lastLearningCategory) {
                setTimeout(() => {
                    animateProgressToGoal();
                    // アニメーション後にカテゴリをリセット
                    lastLearningCategory = null;
                }, 100);
            }
            
            // 目標達成のチェック（ホーム画面に戻った時）
            // データが確実に読み込まれるように少し遅延させる
            setTimeout(() => {
                // 進捗バーを再度更新（念のため）
                updateCategoryStars();
                // 学習中断時も目標達成をチェック
                checkGoalAchievementOnReturn();
            }, 300);
        });
    });
}

// ホーム画面に戻った時の目標達成チェック（学習完了・中断問わず）
function checkGoalAchievementOnReturn() {
    console.log('checkGoalAchievementOnReturn 呼び出し', {
        pendingGoalCelebration,
        hasReachedGoalBefore
    });
    
    // 既に表示待ちの場合はそのまま表示
    if (pendingGoalCelebration) {
        pendingGoalCelebration = false;
        hasReachedGoalBefore = true;
        const selectedSchool = loadSelectedSchool();
        if (selectedSchool) {
            setTimeout(() => {
                showGoalAchievedCelebration(selectedSchool);
            }, 300);
        }
        return;
    }
    
    // 既に達成済みの場合は何もしない
    if (hasReachedGoalBefore) {
        console.log('既に目標達成済みです');
        return;
    }
    
    // 目標達成をチェック
    const selectedSchool = loadSelectedSchool();
    if (!selectedSchool) {
        console.log('目標達成チェック: 志望校が設定されていません');
        return;
    }
    
    const learnedWords = calculateTotalLearnedWords();
    const requiredWords = calculateRequiredWords(selectedSchool.hensachi, selectedSchool.name);
    const hasReachedRequired = requiredWords > 0 && learnedWords >= requiredWords;
    
    console.log('ホーム画面戻り時の目標達成チェック:', {
        learnedWords,
        requiredWords,
        hasReachedRequired,
        hasReachedGoalBefore
    });
    
    if (hasReachedRequired) {
        console.log('目標達成を検出！花火を表示します');
        hasReachedGoalBefore = true;
        setTimeout(() => {
            showGoalAchievedCelebration(selectedSchool);
        }, 300);
    }
}

// 目標達成チェック関数（分離して確実に実行されるように）
function checkAndShowGoalAchievement() {
    console.log('checkAndShowGoalAchievement 呼び出し', {
        pendingGoalCelebration,
        hasReachedGoalBefore
    });
    
    const selectedSchool = loadSelectedSchool();
    if (!selectedSchool) {
        console.log('目標達成チェック: 志望校が設定されていません');
        return;
    }
    
    // 学習完了後に目標達成した場合（pendingGoalCelebrationフラグがtrue）
    if (pendingGoalCelebration) {
        console.log('目標達成画面を表示します！');
        pendingGoalCelebration = false;
        hasReachedGoalBefore = true;
        // 少し遅延させて演出を発動
        setTimeout(() => {
            showGoalAchievedCelebration(selectedSchool);
        }, 300);
    }
}

// カテゴリーを選択してコース選択画面を表示
function startCategory(category) {
    // デバッグ用ログ
    console.log('startCategory called with category:', category);
    selectedCategory = category;
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    learnedWordsAtStart = calculateTotalLearnedWords();
    lastLearningCategory = category;
    // モード用のボディクラスをいったんリセット
    document.body.classList.remove('sentence-mode-active', 'reorder-mode-active', 'choice-question-mode-active');
    isChoiceQuestionModeActive = false;
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、elementaryWordDataを使用
    let categoryWords;
    if (category === '基本語彙500') {
        // 基本語彙500コースは削除されました
        showAlert('エラー', 'このコースは利用できません。');
        return;
    } else if (category === 'LEVEL1 超重要単語400' || category === 'LEVEL2 重要単語300' || category === 'LEVEL3 差がつく単語200' || 
               category === 'LEVEL4 私立高校入試レベル' || category === 'LEVEL5 難関私立高校入試レベル') {
        // レベル別単語：vocabulary-data.jsから取得（最適化）
        console.log('Loading level vocabulary:', category);
        const levelMap = {
            'LEVEL1 超重要単語400': 1,
            'LEVEL2 重要単語300': 2,
            'LEVEL3 差がつく単語200': 3,
            'LEVEL4 私立高校入試レベル': 4,
            'LEVEL5 難関私立高校入試レベル': 5
        };
        const level = levelMap[category];
        if (level && typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
            categoryWords = getVocabularyByLevel(level);
            console.log('getVocabularyByLevel returned:', categoryWords.length, 'words');
        } else if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === category);
            console.log('Filtered by category:', categoryWords.length, 'words');
        } else {
            console.error('getAllVocabulary function not available');
            showAlert('エラー', '単語データが見つかりません。');
            return;
        }
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
        // タイムアタックモード：LEVEL1 超重要単語400の単語を使用
        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === 'LEVEL1 超重要単語400');
        } else {
            categoryWords = wordData.filter(word => word.category === 'LEVEL1 超重要単語400');
        }
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
    } else if (category === 'C問題対策 大問1整序英作文【四択問題】') {
        // C問題対策 大問1整序英作文【四択問題】：四択問題モードで開始
        console.log('四択問題モードを開始します。カテゴリー:', category);
        // choiceQuestionsが読み込まれているか確認
        if (typeof choiceQuestions === 'undefined') {
            showAlert('エラー', '四択問題のデータファイルが読み込まれていません。ページを再読み込みしてください。');
            console.error('choiceQuestions is undefined');
            return;
        }
        if (!choiceQuestions || choiceQuestions.length === 0) {
            showAlert('エラー', '四択問題のデータが空です。');
            console.error('choiceQuestions is empty');
            return;
        }
        console.log('initChoiceQuestionLearningを呼び出します');
        initChoiceQuestionLearning(category);
        return;
    } else if (category === 'PartCディクテーション') {
        // PartCディクテーション：専用データが必要（現在は空）
        showAlert('準備中', 'PartCディクテーションのデータを準備中です。');
        return;
    } else if (category === '英文法中学３年間の総復習') {
        // 英文法中学３年間の総復習：目次ページを表示
        showGrammarTableOfContents();
        return;
    } else if (typeof getVocabularyByCategory !== 'undefined' && getVocabularyByCategory(category).length > 0) {
        // vocabulary-data.jsのサブカテゴリー（家族・家に関する単語、冠詞など）
        console.log('Loading vocabulary subcategory:', category);
        categoryWords = getVocabularyByCategory(category);
        console.log('getVocabularyByCategory returned:', categoryWords.length, 'words');
    } else {
        // vocabulary-data.jsから取得を試みる
        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === category);
            console.log('Filtered by category from getAllVocabulary:', categoryWords.length, 'words');
        } else {
            // フォールバック：wordDataから検索
            categoryWords = wordData.filter(word => word.category === category);
        }
    }

    console.log('Final categoryWords check:', categoryWords ? categoryWords.length : 'null/undefined');
    if (!categoryWords || categoryWords.length === 0) {
        console.error('categoryWords is empty or undefined');
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }

    // サブカテゴリー（vocabulary-data.jsのカテゴリー）かどうかを判定
    const vocabularySubcategories = [
        '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
        '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
        '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向',
        '冠詞', '代名詞', '疑問詞',
        '限定詞（数量）', '前置詞', '助動詞・助動詞的表現', '接続詞', '関係代名詞', '間投詞'
    ];
    
    const isVocabularySubcategory = vocabularySubcategories.includes(category);
    
    if (isVocabularySubcategory) {
        // サブカテゴリーの場合は直接フィルター画面を表示
        console.log('Vocabulary subcategory detected, showing filter view directly');
        currentCourseWords = categoryWords;
        // カテゴリー選択画面を非表示、コース選択画面を表示してからフィルター画面を表示
        elements.categorySelection.classList.add('hidden');
        const courseSelection = document.getElementById('courseSelection');
        if (courseSelection) {
            courseSelection.classList.remove('hidden');
        }
        showWordFilterView(category, categoryWords, category);
    } else {
        console.log('Hiding category selection and showing course selection...');
        // カテゴリー選択画面を非表示（showCourseSelection内でスライドアニメーションと一緒に処理される）
        
        // コース選択画面を表示（右からスライドイン）
        console.log('Calling showCourseSelection with', categoryWords.length, 'words');
        showCourseSelection(category, categoryWords);
        console.log('showCourseSelection completed');
    }
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
    
    // 単元名を設定
    const scoreUpCategories = [
        '英文法中学３年間の総復習',
        '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
        '条件英作文特訓コース',
        '大阪C問題対策英単語タイムアタック',
        '大阪C問題対策 英作写経ドリル',
        '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】',
        'C問題対策 大問1整序英作文【四択問題】'
    ];
    let displayTitle;
    if (scoreUpCategories.includes(category)) {
        displayTitle = category;
    } else {
        displayTitle = currentFilterCourseTitle || category;
    }
    
    if (elements.unitName) {
        const formattedTitle = formatTitleWithLevelBadge(displayTitle);
        if (formattedTitle !== displayTitle) {
            elements.unitName.innerHTML = formattedTitle;
        } else {
            elements.unitName.textContent = displayTitle;
        }
    }
    
    // ヘッダーの単元名も更新
    updateHeaderUnitName(displayTitle);
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);

    // ヘッダーを学習モードに更新
    updateHeaderButtons('learning');
    
    // カードモード、例文モード、整序英作文モードを非表示、入力モードを表示
    const wordCard = document.getElementById('wordCard');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (wordCard) wordCard.classList.add('hidden');
    if (inputMode) inputMode.classList.remove('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    // モードフラグをリセット
    isSentenceModeActive = false;
    isReorderModeActive = false;
    isChoiceQuestionModeActive = false;
    document.body.classList.remove('choice-question-mode-active');
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

// カテゴリー別の画面を表示
function showElementaryCategorySelection(skipAnimation = false) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 学習画面から戻る場合、mainContentを非表示にする
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.classList.add('hidden');
    }
    
    // 学習モードをリセット
    document.body.classList.remove('learning-mode');
    updateThemeColor(false);
    
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    const courseSelectionImage = document.getElementById('courseSelectionImage');
    const courseSelectionDescription = document.getElementById('courseSelectionDescription');
    
    // タイトルを設定
    const formattedTitle = formatTitleWithLevelBadge('カテゴリー別');
    courseTitle.innerHTML = formattedTitle;
    courseList.innerHTML = '';
    
    // 画像を非表示
    if (courseSelectionImage) {
        courseSelectionImage.style.display = 'none';
    }
    
    // 説明文を設定
    if (courseSelectionDescription) {
        courseSelectionDescription.textContent = 'カテゴリー別に基本単語を覚えよう';
        courseSelectionDescription.style.display = 'block';
    }
    
    // 細分化メニューのサブカテゴリー（指定順）
    const elementarySubcategories = [
        '家族',
        '曜日・月・季節',
        '時間・時間帯',
        '数字',
        '色',
        '体',
        '文房具',
        '楽器',
        '衣類',
        '単位',
        '食べ物・飲み物',
        'スポーツ',
        '動物',
        '教科',
        '学校（の種類）',
        '乗り物',
        '町の施設',
        '職業',
        '国や地域',
        '自然',
        '天気',
        '方角・方向'
    ];
    
    // サブカテゴリーカードを生成
    elementarySubcategories.forEach((subcat, index) => {
        const words = getVocabularyByCategory(subcat);
        const wordCount = words ? words.length : 0;
        
        // 進捗を計算
        let correctCount = 0;
        let wrongCount = 0;
        // 入力モード（日本語→英語）での完了状態を確認
        let inputModeCorrectCount = 0;
        let inputModeWrongCount = 0;
        
        if (words && words.length > 0) {
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            
            // 入力モード専用のセット
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${subcat}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${subcat}_${mode}`);
                
                if (savedCorrectWords) {
                    JSON.parse(savedCorrectWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        if (!allWrongSet.has(numId)) {
                            allCorrectSet.add(numId);
                        }
                        // 入力モードの場合は別途記録
                        if (mode === 'input' && !inputWrongSet.has(numId)) {
                            inputCorrectSet.add(numId);
                        }
                    });
                }
                
                if (savedWrongWords) {
                    JSON.parse(savedWrongWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allWrongSet.add(numId);
                        allCorrectSet.delete(numId);
                        // 入力モードの場合は別途記録
                        if (mode === 'input') {
                            inputWrongSet.add(numId);
                            inputCorrectSet.delete(numId);
                        }
                    });
                }
            });
            
            words.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCount++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCount++;
                }
                // 入力モードの進捗を別途カウント
                if (inputWrongSet.has(word.id)) {
                    inputModeWrongCount++;
                } else if (inputCorrectSet.has(word.id)) {
                    inputModeCorrectCount++;
                }
            });
        }
        const correctPercent = wordCount > 0 ? (correctCount / wordCount) * 100 : 0;
        const wrongPercent = wordCount > 0 ? (wrongCount / wordCount) * 100 : 0;
        
        // COMPLETE!!の判定（間違いが0で正解数が総数と等しい場合）
        const isComplete = wordCount > 0 && wrongCount === 0 && correctCount === wordCount;
        // 入力モードで全問正解しているかを判定
        const isInputModeComplete = wordCount > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === wordCount;
        
        // モードに応じて異なるCOMPLETEクラスを適用
        // 入力モードで全問正解している場合は金色を優先表示
        let progressBarClass = 'category-progress-bar';
        if (isInputModeComplete) {
            // 入力モード（日本語→英語）で全問正解: 金色
            progressBarClass = 'category-progress-bar category-progress-complete-input';
        } else if (isComplete) {
            // カードモードでのみ全問正解: 青色
            progressBarClass = 'category-progress-bar category-progress-complete';
        }
        
        // 番号を取得（1から始まる）
        const number = index + 1;
        
        const card = document.createElement('div');
        card.className = 'category-card category-card-with-actions';
        
        card.innerHTML = `
            <div class="category-info">
                <div class="category-header">
                    <div class="category-name">
                        <svg class="file-icon-with-number" width="32" height="32" viewBox="0 0 24 24" fill="#dbeafe" stroke="none" style="margin-right: 8px;">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <text x="12" y="13" text-anchor="middle" fill="#2563eb" font-size="11" font-weight="bold" stroke="none" style="font-family: Arial, sans-serif; dominant-baseline: central;">${number}</text>
                        </svg>
                        ${subcat}
                    </div>
                </div>
                <div class="category-progress">
                    <div class="${progressBarClass}">
                        <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                        <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                    </div>
                    <div class="category-progress-text">${correctCount}/${wordCount}語</div>
                </div>
            </div>
            <div class="course-card-side-actions">
                <button type="button" class="course-side-btn input-btn">学習</button>
                <button type="button" class="course-side-btn output-btn">テスト</button>
            </div>
        `;
        
        // ボタンにイベントリスナーを追加
        const inputBtn = card.querySelector('.input-btn');
        const outputBtn = card.querySelector('.output-btn');
        const categoryInfo = card.querySelector('.category-info');
        
        if (inputBtn) {
            inputBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showInputModeDirectly(subcat, words, subcat);
            });
        }
        
        if (outputBtn) {
            outputBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWordFilterView(subcat, words, subcat);
            });
        }
        
        if (categoryInfo) {
            categoryInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseActionModal(subcat, words, subcat);
            });
        }
        
        courseList.appendChild(card);
    });
    
    // 一番下に大阪の画像を追加
    const osakaFooterImg = document.createElement('div');
    osakaFooterImg.className = 'osaka-footer-container';
    osakaFooterImg.innerHTML = `<img src="osaka_5_nashi_b.png" alt="大阪" class="osaka-footer-img">`;
    courseList.appendChild(osakaFooterImg);
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', 'カテゴリー別');
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
        
        // skipAnimationがtrueの場合は左からスライドイン（学習画面から戻るとき）
        // falseの場合は右からスライドイン（ホームから進むとき）
        if (skipAnimation) {
            courseSelection.classList.add('slide-in-left');
            setTimeout(() => {
                courseSelection.classList.remove('slide-in-left');
            }, 300);
        } else {
            courseSelection.classList.add('slide-in-right');
            setTimeout(() => {
                courseSelection.classList.remove('slide-in-right');
            }, 300);
        }
    }
    
    // ナビゲーション状態を更新
    updateNavState('courseSelection');

    // 戻るボタン用にparentCategoryを保存
    window.currentSubcategoryParent = 'カテゴリー別';
}

// レベル別細分化メニューを表示
function showLevelSubcategorySelection(parentCategory, skipAnimation = false) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    console.log('showLevelSubcategorySelection called with:', parentCategory, 'skipAnimation:', skipAnimation);
    
    // 学習画面から戻る場合、mainContentを非表示にする
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.classList.add('hidden');
    }
    
    // 学習モードをリセット
    document.body.classList.remove('learning-mode');
    updateThemeColor(false);
    
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    console.log('courseSelection:', courseSelection, 'courseList:', courseList, 'courseTitle:', courseTitle);
    const courseSelectionImage = document.getElementById('courseSelectionImage');
    const courseSelectionDescription = document.getElementById('courseSelectionDescription');
    
    // タイトルを設定（バッジ付き）
    if (parentCategory === 'レベル１ 超重要500語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-red">Level<b>1</b></span> 超重要500語';
    } else if (parentCategory === 'レベル２ 重要500語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-orange">Level<b>2</b></span> 重要500語';
    } else if (parentCategory === 'レベル３ ハイレベル300語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-blue">Level<b>3</b></span> ハイレベル300語';
    } else {
        courseTitle.textContent = parentCategory;
    }
    courseList.innerHTML = '';
    
    // 画像を非表示
    if (courseSelectionImage) {
        courseSelectionImage.style.display = 'none';
    }
    
    // 説明文を設定
    if (courseSelectionDescription) {
        if (parentCategory === 'レベル１ 超重要500語') {
            courseSelectionDescription.textContent = '中1レベルの入試頻出度の高い単語を覚えよう';
            courseSelectionDescription.style.display = 'block';
        } else if (parentCategory === 'レベル２ 重要500語') {
            courseSelectionDescription.textContent = '中2～3レベルの入試頻出度の高い単語を覚えよう';
            courseSelectionDescription.style.display = 'block';
        } else if (parentCategory === 'レベル３ ハイレベル300語') {
            courseSelectionDescription.textContent = '差がつくハイレベルな単語を覚えよう';
            courseSelectionDescription.style.display = 'block';
        } else {
            courseSelectionDescription.style.display = 'none';
        }
    }
    
    // サブカテゴリーの定義
    let subcategories = [];
    let levelCategory = '';
    let badgeColor = '';
    let badgeBgColor = '';
    
    if (parentCategory === 'レベル１ 超重要500語') {
        subcategories = [
            '冠詞',
            '代名詞',
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '疑問詞',
            '間投詞'
        ];
        levelCategory = 'LEVEL1 超重要単語400';
        badgeColor = '#2563eb'; // 青
        badgeBgColor = '#eff6ff'; // 薄い青
    } else if (parentCategory === 'レベル２ 重要500語') {
        subcategories = [
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '助動詞',
            '接続詞',
            '数や量を表す詞',
            '代名詞'
        ];
        levelCategory = 'LEVEL2 重要単語300';
        badgeColor = '#2563eb'; // 青
        badgeBgColor = '#eff6ff'; // 薄い青
    } else if (parentCategory === 'レベル３ ハイレベル300語') {
        subcategories = [
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '接続詞',
            '関係代名詞'
        ];
        levelCategory = 'LEVEL3 差がつく単語200';
        badgeColor = '#2563eb'; // 青
        badgeBgColor = '#eff6ff'; // 薄い青
    }
    
    // サブカテゴリーカードを生成
    subcategories.forEach((subcat, index) => {
        // 単語を取得（レベル別に取得）
        let levelWords = [];
        if (parentCategory === 'レベル１ 超重要500語') {
            const level = 1;
            if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
                levelWords = getVocabularyByLevel(level);
            } else if (typeof getAllVocabulary !== 'undefined') {
                const allWords = getAllVocabulary();
                levelWords = allWords.filter(word => word.category && word.category.startsWith('LEVEL1 '));
            }
        } else if (parentCategory === 'レベル２ 重要500語') {
            const level = 2;
            if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
                levelWords = getVocabularyByLevel(level);
            } else if (typeof getAllVocabulary !== 'undefined') {
                const allWords = getAllVocabulary();
                levelWords = allWords.filter(word => word.category && word.category.startsWith('LEVEL2 '));
            }
        } else if (parentCategory === 'レベル３ ハイレベル300語') {
            const level = 3;
            if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
                levelWords = getVocabularyByLevel(level);
            } else if (typeof getAllVocabulary !== 'undefined') {
                const allWords = getAllVocabulary();
                levelWords = allWords.filter(word => word.category && word.category.startsWith('LEVEL3 '));
            }
        }
        // サブカテゴリ名からカテゴリ名にマッピング
        let categoryName = '';
        if (parentCategory === 'レベル１ 超重要500語') {
            if (subcat === '冠詞') categoryName = 'LEVEL1 冠詞';
            else if (subcat === '代名詞') categoryName = 'LEVEL1 代名詞';
            else if (subcat === '名詞') categoryName = 'LEVEL1 名詞';
            else if (subcat === '動詞') categoryName = 'LEVEL1 動詞';
            else if (subcat === '形容詞') categoryName = 'LEVEL1 形容詞';
            else if (subcat === '副詞') categoryName = 'LEVEL1 副詞';
            else if (subcat === '前置詞') categoryName = 'LEVEL1 前置詞';
            else if (subcat === '疑問詞') categoryName = 'LEVEL1 疑問詞';
            else if (subcat === '間投詞') categoryName = 'LEVEL1 間投詞';
        } else if (parentCategory === 'レベル２ 重要500語') {
            if (subcat === '名詞') categoryName = 'LEVEL2 名詞';
            else if (subcat === '動詞') categoryName = 'LEVEL2 動詞';
            else if (subcat === '形容詞') categoryName = 'LEVEL2 形容詞';
            else if (subcat === '副詞') categoryName = 'LEVEL2 副詞';
            else if (subcat === '前置詞') categoryName = 'LEVEL2 前置詞';
            else if (subcat === '助動詞') categoryName = 'LEVEL2 助動詞';
            else if (subcat === '接続詞') categoryName = 'LEVEL2 接続詞';
            else if (subcat === '数や量を表す詞') categoryName = 'LEVEL2 限定詞（数量）';
            else if (subcat === '代名詞') categoryName = 'LEVEL2 代名詞';
        } else if (parentCategory === 'レベル３ ハイレベル300語') {
            if (subcat === '名詞') categoryName = 'LEVEL3 名詞';
            else if (subcat === '動詞') categoryName = 'LEVEL3 動詞';
            else if (subcat === '形容詞') categoryName = 'LEVEL3 形容詞';
            else if (subcat === '副詞') categoryName = 'LEVEL3 副詞';
            else if (subcat === '前置詞') categoryName = 'LEVEL3 前置詞';
            else if (subcat === '接続詞') categoryName = 'LEVEL3 接続詞';
            else if (subcat === '関係代名詞') categoryName = 'LEVEL3 関係代名詞';
        }
        
        // カテゴリ名でフィルタリング
        const words = levelWords.filter(word => {
            return word.category === categoryName;
        });
        
        const wordCount = words ? words.length : 0;
        const categoryKey = `${parentCategory}-${subcat}`;
        // カテゴリ名を保存（startCategory関数で使用）
        const actualCategoryName = categoryName || categoryKey;
        
        // 進捗を計算（actualCategoryNameで保存されているので、それで取得）
        let correctCount = 0;
        let wrongCount = 0;
        // 入力モード（日本語→英語）での完了状態を確認
        let inputModeCorrectCount = 0;
        let inputModeWrongCount = 0;
        
        if (words && words.length > 0) {
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            
            // 入力モード専用のセット
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${actualCategoryName}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${actualCategoryName}_${mode}`);
                
                if (savedCorrectWords) {
                    JSON.parse(savedCorrectWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        if (!allWrongSet.has(numId)) {
                            allCorrectSet.add(numId);
                        }
                        // 入力モードの場合は別途記録
                        if (mode === 'input' && !inputWrongSet.has(numId)) {
                            inputCorrectSet.add(numId);
                        }
                    });
                }
                
                if (savedWrongWords) {
                    JSON.parse(savedWrongWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allWrongSet.add(numId);
                        allCorrectSet.delete(numId);
                        // 入力モードの場合は別途記録
                        if (mode === 'input') {
                            inputWrongSet.add(numId);
                            inputCorrectSet.delete(numId);
                        }
                    });
                }
            });
            
            words.forEach(word => {
                if (allWrongSet.has(word.id)) {
                    wrongCount++;
                } else if (allCorrectSet.has(word.id)) {
                    correctCount++;
                }
                // 入力モードの進捗を別途カウント
                if (inputWrongSet.has(word.id)) {
                    inputModeWrongCount++;
                } else if (inputCorrectSet.has(word.id)) {
                    inputModeCorrectCount++;
                }
            });
        }
        const correctPercent = wordCount > 0 ? (correctCount / wordCount) * 100 : 0;
        const wrongPercent = wordCount > 0 ? (wrongCount / wordCount) * 100 : 0;
        
        // COMPLETE!!の判定（間違いが0で正解数が総数と等しい場合）
        const isComplete = wordCount > 0 && wrongCount === 0 && correctCount === wordCount;
        // 入力モードで全問正解しているかを判定
        const isInputModeComplete = wordCount > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === wordCount;
        
        // モードに応じて異なるCOMPLETEクラスを適用
        // 入力モードで全問正解している場合は金色を優先表示
        let progressBarClass = 'category-progress-bar';
        if (isInputModeComplete) {
            // 入力モード（日本語→英語）で全問正解: 金色
            progressBarClass = 'category-progress-bar category-progress-complete-input';
        } else if (isComplete) {
            // カードモードでのみ全問正解: 青色
            progressBarClass = 'category-progress-bar category-progress-complete';
        }
        
        // 番号を取得（1から始まる）
        const number = index + 1;
        
        const card = document.createElement('div');
        card.className = 'category-card category-card-with-actions';
        
        card.innerHTML = `
            <div class="category-info">
                <div class="category-header">
                    <div class="category-name">
                        <svg class="file-icon-with-number" width="32" height="32" viewBox="0 0 24 24" fill="#dbeafe" stroke="none" style="margin-right: 8px;">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <text x="12" y="13" text-anchor="middle" fill="#2563eb" font-size="11" font-weight="bold" stroke="none" style="font-family: Arial, sans-serif; dominant-baseline: central;">${number}</text>
                        </svg>
                        ${subcat}
                    </div>
                </div>
                <div class="category-progress">
                    <div class="${progressBarClass}">
                        <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                        <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                    </div>
                    <div class="category-progress-text">${correctCount}/${wordCount}語</div>
                </div>
            </div>
            <div class="course-card-side-actions">
                <button type="button" class="course-side-btn input-btn">学習</button>
                <button type="button" class="course-side-btn output-btn">テスト</button>
            </div>
        `;
        
        // ボタンにイベントリスナーを追加
        const inputBtn = card.querySelector('.input-btn');
        const outputBtn = card.querySelector('.output-btn');
        const categoryInfo = card.querySelector('.category-info');
        
        if (inputBtn) {
            inputBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showInputModeDirectly(actualCategoryName, words, categoryKey);
            });
        }
        
        if (outputBtn) {
            outputBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWordFilterView(actualCategoryName, words, categoryKey);
            });
        }
        
        if (categoryInfo) {
            categoryInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseActionModal(actualCategoryName, words, categoryKey);
            });
        }
        
        courseList.appendChild(card);
    });
    
    // 一番下に大阪の画像を追加
    const osakaFooterImg = document.createElement('div');
    osakaFooterImg.className = 'osaka-footer-container';
    osakaFooterImg.innerHTML = `<img src="osaka_5_nashi_b.png" alt="大阪" class="osaka-footer-img">`;
    courseList.appendChild(osakaFooterImg);
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', parentCategory);
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
        
        // skipAnimationがtrueの場合は左からスライドイン（学習画面から戻るとき）
        // falseの場合は右からスライドイン（ホームから進むとき）
        if (skipAnimation) {
            courseSelection.classList.add('slide-in-left');
            setTimeout(() => {
                courseSelection.classList.remove('slide-in-left');
            }, 300);
        } else {
            courseSelection.classList.add('slide-in-right');
            setTimeout(() => {
                courseSelection.classList.remove('slide-in-right');
            }, 300);
        }
    }
    
    // ナビゲーション状態を更新
    updateNavState('courseSelection');
    
    // 戻るボタン用にparentCategoryを保存
    window.currentSubcategoryParent = parentCategory;
}

// コース選択画面を表示（100刻み）
function showCourseSelection(category, categoryWords, slideIn = false) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 復習モードのタイトルとクラスをリセット
    resetReviewWrongWordsTitle();
    
    console.log('showCourseSelection called with category:', category, 'words:', categoryWords ? categoryWords.length : 'null');
    const courseSelection = document.getElementById('courseSelection');
    const courseList = document.getElementById('courseList');
    const courseTitle = document.getElementById('courseSelectionTitle');
    const courseSelectionDescription = document.getElementById('courseSelectionDescription');
    console.log('courseSelection element:', courseSelection);
    console.log('courseList element:', courseList);
    console.log('courseTitle element:', courseTitle);
    
    // カテゴリー名を表示用に調整
    let displayCategory = category;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        displayCategory = 'カテゴリー別に覚える単語';
    } else if (category === 'LEVEL1 超重要単語400') {
        displayCategory = 'レベル１ 超重要単語400';
    } else if (category === 'LEVEL2 重要単語300') {
        displayCategory = 'レベル２ 重要単語300';
    } else if (category === 'LEVEL3 差がつく単語200') {
        displayCategory = 'レベル３ 差がつく単語200';
    } else if (category === 'LEVEL4 私立高校入試レベル') {
        displayCategory = 'レベル４ 私立高校入試レベル';
    } else if (category === 'LEVEL5 難関私立高校入試レベル') {
        displayCategory = 'レベル５ 難関私立高校入試レベル';
    }
    courseTitle.textContent = `${displayCategory} - コースを選んでください`;
    courseList.innerHTML = '';
    
    // 説明文を非表示（通常のコース選択画面では説明文は表示しない）
    if (courseSelectionDescription) {
        courseSelectionDescription.style.display = 'none';
    }
    
    console.log('Course title set and list cleared');
    
    // 小学生で習った単語とカテゴリー別に覚える単語の場合は、固定のサブコースを表示
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        console.log('Detected elementary category, creating accordion sections...');
        // カテゴリー別に覚える基本単語グループ（指定順）
        const elementaryCourses = [
            '家族',
            '曜日・月・季節',
            '時間・時間帯',
            '数字',
            '色',
            '体',
            '文房具',
            '楽器',
            '衣類',
            '単位',
            '食べ物・飲み物',
            'スポーツ',
            '動物',
            '教科',
            '学校（の種類）',
            '乗り物',
            '町の施設',
            '職業',
            '国や地域',
            '自然',
            '天気',
            '方角・方向'
        ];

        // 各サブカテゴリーの進捗をキャッシュ（小学生で習った単語の場合は各単語のカテゴリーで保存されている）
        const progressCache = {};
        const mode = selectedLearningMode || 'card';

        // 共通でコースカードを追加するヘルパー
        function addCourseGroup(groupTitle, courses) {
            console.log('addCourseGroup called with groupTitle:', groupTitle, 'courses:', courses.length);
            const section = document.createElement('div');
            section.className = 'course-subsection';

            // グループ別にクラスを付与（スタイル用）
            if (groupTitle === 'カテゴリー別に覚える基本単語') {
                section.classList.add('course-subsection-elementary');
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

            // 「カテゴリー別に覚える基本単語」の場合のみ、説明テキスト（注釈）を先頭に表示
            if (groupTitle === 'カテゴリー別に覚える基本単語') {
                const note = document.createElement('p');
                note.className = 'course-group-note';
                note.textContent = '基礎からカテゴリー別に覚える単語をまとめています。';
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
                // 入力モード（日本語→英語）での完了状態を確認
                let inputModeCorrectCount = 0;
                let inputModeWrongCount = 0;

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
                
                // 入力モード専用の進捗を取得
                const savedInputCorrect = localStorage.getItem(`correctWords-${courseName}_input`);
                const savedInputWrong = localStorage.getItem(`wrongWords-${courseName}_input`);
                const inputCorrectSet = savedInputCorrect ? new Set(JSON.parse(savedInputCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();
                const inputWrongSet = savedInputWrong ? new Set(JSON.parse(savedInputWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();

                courseWords.forEach(word => {
                    const isCorrect = courseProgress.correct.has(word.id);
                    const isWrong = courseProgress.wrong.has(word.id);

                    // 優先順位変更: 間違い(赤) > 正解(青)
                    if (isWrong) {
                        wrongCountInCourse++;
                    } else if (isCorrect) {
                        correctCountInCourse++;
                    }
                    
                    // 入力モードの進捗を別途カウント
                    if (inputWrongSet.has(word.id)) {
                        inputModeWrongCount++;
                    } else if (inputCorrectSet.has(word.id)) {
                        inputModeCorrectCount++;
                    }
                });

                const total = courseWords.length;
                const correctPercent = total === 0 ? 0 : (correctCountInCourse / total) * 100;
                const wrongPercent = total === 0 ? 0 : (wrongCountInCourse / total) * 100;
                const completedCount = correctCountInCourse + wrongCountInCourse;
                
                // 入力モードで全問正解しているかを判定
                const isInputModeComplete = total > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === total;

                const numberMark = circledNumbers[index] || '';
                const badgeLabel = '';
                const description = '';

                const courseCard = createCourseCard(
                    courseName,
                    description,
                    correctPercent,
                    wrongPercent,
                    completedCount,
                    total,
                    () => {
                        // インプット：直接単語一覧を表示
                        showInputModeDirectly(courseName, courseWords, courseName);
                    },
                    () => {
                        // アウトプット：フィルター画面を表示
                        showWordFilterView(courseName, courseWords, courseName);
                    },
                    badgeLabel,
                    numberMark,
                    isInputModeComplete
                );
                body.appendChild(courseCard);
            });

            section.appendChild(body);
            courseList.appendChild(section);
        }

        console.log('About to add course groups...');
        console.log('elementaryCourses:', elementaryCourses);
        addCourseGroup('カテゴリー別に覚える基本単語', elementaryCourses);
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
            // 入力モード（日本語→英語）での完了状態を確認
            let inputModeCorrectCount = 0;
            let inputModeWrongCount = 0;
            
            const { correctSet, wrongSet } = loadCategoryWords(category);
            
            // 入力モード専用の進捗を取得
            const savedInputCorrect = localStorage.getItem(`correctWords-${category}_input`);
            const savedInputWrong = localStorage.getItem(`wrongWords-${category}_input`);
            const inputCorrectSet = savedInputCorrect ? new Set(JSON.parse(savedInputCorrect).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();
            const inputWrongSet = savedInputWrong ? new Set(JSON.parse(savedInputWrong).map(id => typeof id === 'string' ? parseInt(id, 10) : id)) : new Set();
            
            courseWords.forEach(word => {
                const isCorrect = correctSet.has(word.id);
                const isWrong = wrongSet.has(word.id);
                
                // 優先順位変更: 間違い(赤) > 正解(青)
                if (isWrong) {
                    wrongCountInCourse++;
                } else if (isCorrect) {
                    correctCountInCourse++;
                }
                
                // 入力モードの進捗を別途カウント
                if (inputWrongSet.has(word.id)) {
                    inputModeWrongCount++;
                } else if (inputCorrectSet.has(word.id)) {
                    inputModeCorrectCount++;
                }
            });
            
            const total = courseWords.length;
            const correctPercent = total === 0 ? 0 : (correctCountInCourse / total) * 100;
            const wrongPercent = total === 0 ? 0 : (wrongCountInCourse / total) * 100;
            const completedCount = correctCountInCourse + wrongCountInCourse;
            
            // 入力モードで全問正解しているかを判定
            const isInputModeComplete = total > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === total;
            
            const courseTitle = `${start + 1}～${end}語`;
            const courseCard = createCourseCard(
                courseTitle,
                '',
                correctPercent,
                wrongPercent,
                completedCount,
                total,
                () => {
                    // インプット：直接単語一覧を表示
                    showInputModeDirectly(category, courseWords, courseTitle);
                },
                () => {
                    // アウトプット：フィルター画面を表示
                    showWordFilterView(category, courseWords, courseTitle);
                },
                '',
                '',
                isInputModeComplete
            );
            courseList.appendChild(courseCard);
        }
    }
    
    console.log('Making courseSelection visible...');
    
    // 画面遷移（スライドイン）
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        // カテゴリー選択画面を即座に非表示
        categorySelection.classList.add('hidden');
        
        // コース選択画面をスライドイン（slideInがtrueなら左から、falseなら右から）
        courseSelection.classList.remove('hidden');
        const slideClass = slideIn ? 'slide-in-left' : 'slide-in-right';
        courseSelection.classList.add(slideClass);
        
        // アニメーション完了後にクラスをクリーンアップ
        setTimeout(() => {
            courseSelection.classList.remove(slideClass);
        }, 300);
    } else {
        // フォールバック：通常の表示
        courseSelection.classList.remove('hidden');
    }
    
    console.log('courseSelection classes:', courseSelection.className);
    console.log('courseList children count:', courseList.children.length);
    
    // コース選択画面：ヘッダー表示、戻るボタン表示、タイトルを設定
    updateHeaderButtons('course', displayCategory);
    console.log('showCourseSelection complete');
    
    // 「超よくでる」の場合のみ画像を表示
    const courseSelectionImage = document.getElementById('courseSelectionImage');
    if (courseSelectionImage) {
        // LEVEL1の画像は非表示
        courseSelectionImage.style.display = 'none';
    }
    
    // 戻るボタン用にcategoryを保存（スライドアニメーション用）
    window.currentSubcategoryParent = category;
    
    // ハンバーガーメニューボタンは常に表示（変更不要）
}

// コースカードを作成
function createCourseCard(title, description, correctPercent, wrongPercent, completedCount, total, onInput, onOutput, badgeLabel = '', badgeNumber = '', isInputModeComplete = false) {
    const card = document.createElement('div');
    card.className = 'category-card category-card-with-actions';
    
    const cardId = `course-${title.replace(/\s+/g, '-')}`;
    
    let badgeHtml = '';
    if (badgeNumber) {
        badgeHtml = `<span class="course-group-badge">${badgeNumber}</span>`;
    }

    // 全部青（間違い0、正解数=総数）のときだけCOMPLETE!!
    const isComplete = total > 0 && wrongPercent === 0 && correctPercent === 100;
    // モードに応じて異なるCOMPLETEクラスを適用
    // 入力モードで全問正解している場合は金色を優先表示
    let progressBarClass = 'category-progress-bar';
    if (isInputModeComplete) {
        // 入力モード（日本語→英語）で全問正解: 金色
        progressBarClass = 'category-progress-bar category-progress-complete-input';
    } else if (isComplete) {
        // カードモードでのみ全問正解: 青色
        progressBarClass = 'category-progress-bar category-progress-complete';
    }
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
        <div class="course-card-side-actions">
            <button type="button" class="course-side-btn input-btn">学習</button>
            <button type="button" class="course-side-btn output-btn">テスト</button>
        </div>
    `;
    
    // ボタンにイベントリスナーを追加
    const inputBtn = card.querySelector('.input-btn');
    const outputBtn = card.querySelector('.output-btn');
    const categoryInfo = card.querySelector('.category-info');
    
    if (inputBtn && onInput) {
        inputBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onInput();
        });
    }
    
    if (outputBtn && onOutput) {
        outputBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onOutput();
        });
    }
    
    // 左側の情報部分をクリックした時にモード選択モーダルを表示
    if (categoryInfo && onInput && onOutput) {
        categoryInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            showCourseActionModalWithCallbacks(onInput, onOutput, title);
        });
    }
    
    return card;
    }

// 学習フィルター画面を表示
let currentFilterWords = [];
let currentFilterCategory = '';
let currentFilterCourseTitle = '';

function showWordFilterView(category, categoryWords, courseTitle) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    learnedWordsAtStart = calculateTotalLearnedWords();
    lastLearningCategory = category;
    console.log('showWordFilterView: 学習開始', { category, learnedWordsAtStart });
    
    currentFilterCategory = category;
    currentFilterWords = categoryWords;
    currentFilterCourseTitle = courseTitle || category;
    
    // フィルター画面の学習モードを初期化（常にoutputにリセット）
    filterLearningMode = 'output';
    
    // 学習モード（日本語→英語 / 英語→日本語）をデフォルトにリセット
    selectedQuizDirection = 'eng-to-jpn';
    isHandwritingMode = false;
    const modeEngToJpn = document.getElementById('modeEngToJpn');
    const modeJpnToEng = document.getElementById('modeJpnToEng');
    if (modeEngToJpn) modeEngToJpn.checked = true;
    if (modeJpnToEng) modeJpnToEng.checked = false;
    
    // フィルター設定をデフォルトにリセット
    const resetFilterAll = document.getElementById('filterAll');
    const resetFilterUnlearned = document.getElementById('filterUnlearned');
    const resetFilterWrong = document.getElementById('filterWrong');
    const resetFilterBookmark = document.getElementById('filterBookmark');
    const resetFilterCorrect = document.getElementById('filterCorrect');
    const resetOrderSequential = document.getElementById('orderSequential');
    const resetOrderRandom = document.getElementById('orderRandom');
    
    if (resetFilterAll) resetFilterAll.checked = true;
    if (resetFilterUnlearned) resetFilterUnlearned.checked = true;
    if (resetFilterWrong) resetFilterWrong.checked = true;
    if (resetFilterBookmark) resetFilterBookmark.checked = true;
    if (resetFilterCorrect) resetFilterCorrect.checked = true;
    if (resetOrderSequential) resetOrderSequential.checked = true;
    if (resetOrderRandom) resetOrderRandom.checked = false;
    
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
    // テスト設定モーダルではすべてのモード（card + input）の進捗を合算して読み込む
    let correctSet, wrongSet;
    if (category === '小学生で習った単語とカテゴリー別に覚える単語') {
        correctSet = new Set();
        wrongSet = new Set();
        const modes = ['card', 'input'];
        const categoryCache = {};
        categoryWords.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
                categoryCache[cat] = { correct: new Set(), wrong: new Set() };
                modes.forEach(mode => {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    if (savedCorrect) {
                        JSON.parse(savedCorrect).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!categoryCache[cat].wrong.has(numId)) {
                                categoryCache[cat].correct.add(numId);
                            }
                        });
                    }
                    if (savedWrong) {
                        JSON.parse(savedWrong).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            categoryCache[cat].wrong.add(numId);
                            categoryCache[cat].correct.delete(numId);
                        });
                    }
                });
            }
            if (categoryCache[cat].correct.has(word.id)) correctSet.add(word.id);
            if (categoryCache[cat].wrong.has(word.id)) wrongSet.add(word.id);
        });
    } else {
        // すべてのモードの進捗を合算して読み込む
        const loaded = loadCategoryWordsForProgress(category);
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
    
    // 出題数選択セクションを更新
    updateQuestionCountSection();
}

// 出題数選択セクションを更新
function updateQuestionCountSection() {
    const questionCountSection = document.getElementById('questionCountSection');
    
    if (questionCountSection) {
        const filteredWords = getFilteredWords();
        const parentSection = questionCountSection.closest('.filter-section');
        
        const hasWords = filteredWords.length > 0;
        if (parentSection) {
            parentSection.style.display = hasWords ? '' : 'none';
        } else {
            questionCountSection.style.display = hasWords ? '' : 'none';
        }
        
        // 出題数オプションのスライダーを更新
        if (hasWords) {
            updateQuestionCountOptions(filteredWords.length);
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
    
    // ボタンの有効/無効状態を更新
    if (questionCountMinus) {
        questionCountMinus.disabled = wordCount <= 10;
    }
    if (questionCountPlus) {
        questionCountPlus.disabled = true; // 最大値なので+は無効
    }
}

// フィルター情報を更新
function updateFilterInfo() {
    const filteredWords = getFilteredWords();
    const filteredWordCount = document.getElementById('filteredWordCount');
    if (filteredWordCount) {
        filteredWordCount.textContent = `${filteredWords.length}語`;
    }
    // 出題数選択セクションを表示/非表示に反映
    updateQuestionCountSection();
}

// フィルター条件に基づいて単語を取得
function getFilteredWords() {
    // テスト設定モーダルではすべてのモード（card + input）の進捗を合算して読み込む
    let correctSet, wrongSet;
    if (currentFilterCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        correctSet = new Set();
        wrongSet = new Set();
        const modes = ['card', 'input'];
        const categoryCache = {};
        currentFilterWords.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
                categoryCache[cat] = { correct: new Set(), wrong: new Set() };
                modes.forEach(mode => {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    if (savedCorrect) {
                        JSON.parse(savedCorrect).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!categoryCache[cat].wrong.has(numId)) {
                                categoryCache[cat].correct.add(numId);
                            }
                        });
                    }
                    if (savedWrong) {
                        JSON.parse(savedWrong).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            categoryCache[cat].wrong.add(numId);
                            categoryCache[cat].correct.delete(numId);
                        });
                    }
                });
            }
            if (categoryCache[cat].correct.has(word.id)) correctSet.add(word.id);
            if (categoryCache[cat].wrong.has(word.id)) wrongSet.add(word.id);
        });
    } else {
        // すべてのモードの進捗を合算して読み込む
        const loaded = loadCategoryWordsForProgress(currentFilterCategory);
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

// インプットモードで直接単語一覧を表示
function showInputModeDirectly(category, words, courseTitle) {
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // コンパクトモードをデフォルト（オフ）にリセット
    const compactModeCheckbox = document.getElementById('settingCompactMode');
    const showExamplesCheckbox = document.getElementById('settingShowExamples');
    const inputListContainer = document.getElementById('inputListContainer');
    if (compactModeCheckbox) {
        compactModeCheckbox.checked = false;
    }
    if (showExamplesCheckbox) {
        showExamplesCheckbox.checked = true;
    }
    if (inputListContainer) {
        inputListContainer.classList.remove('compact-mode');
        inputListContainer.classList.remove('hide-examples');
        inputListContainer.classList.remove('all-words-mode');
    }
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    learnedWordsAtStart = calculateTotalLearnedWords();
    lastLearningCategory = category;
    console.log('showInputModeDirectly: 学習開始', { category, learnedWordsAtStart });
    
    // インプットモードに設定
    currentLearningMode = 'input';
    
    selectedCategory = category;
    currentCourseWords = words;
    currentFilterCourseTitle = courseTitle;
    currentFilterWords = words;
    currentFilterCategory = category;
    
    // 「すべての単語」モードの場合、頻度フィルターと検索を表示
    const isAllWords = category === '大阪府のすべての英単語';
    const freqSection = document.getElementById('filterFrequencySection');
    const wordSearchContainer = document.getElementById('wordSearchContainer');
    const settingsBtn = document.getElementById('inputListSettingsBtn');
    
    if (isAllWords) {
        if (freqSection) freqSection.classList.remove('hidden');
        if (wordSearchContainer) wordSearchContainer.classList.remove('hidden');
        // 設定ボタンは表示する
        if (settingsBtn) settingsBtn.style.display = '';
    } else {
        if (freqSection) freqSection.classList.add('hidden');
        if (wordSearchContainer) wordSearchContainer.classList.add('hidden');
        if (settingsBtn) settingsBtn.style.display = '';
    }
    
    // コース選択画面を即座に非表示
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    
    // カテゴリー選択画面を即座に非表示
    elements.categorySelection.classList.add('hidden');
    
    // メインコンテンツを右からスライドイン
    elements.mainContent.classList.remove('hidden');
    elements.mainContent.classList.add('slide-in-right');
    setTimeout(() => {
        elements.mainContent.classList.remove('slide-in-right');
    }, 300);
    
    // テストへボタンを表示（インプットモードなので常に表示、ただし「すべての単語」では非表示）
    const unitTestBtn = document.getElementById('unitTestBtn');
    if (unitTestBtn) {
        if (category === '大阪府のすべての英単語') {
            unitTestBtn.classList.add('hidden');
        } else {
            unitTestBtn.classList.remove('hidden');
        }
    }
    
    // ヘッダーのメモボタンは非表示（インラインのメモボタンを使用）
    const memoPadBtn = document.getElementById('memoPadBtn');
    if (memoPadBtn) {
        memoPadBtn.classList.add('hidden');
    }
    
    // インラインメモボタンを表示
    const memoPadBtnInline = document.getElementById('memoPadBtnInline');
    if (memoPadBtnInline) {
        memoPadBtnInline.classList.remove('hidden');
    }
    
    // ヘッダー更新
    updateHeaderButtons('learning');
    const title = courseTitle || category;
    if (elements.unitName) {
        const formattedTitle = formatTitleWithLevelBadge(title);
        if (formattedTitle !== title) {
            elements.unitName.innerHTML = formattedTitle;
        } else {
            elements.unitName.textContent = title;
        }
    }
    // ヘッダーの単元名も更新
    updateHeaderUnitName(title);
    
    // テーマカラーを更新
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    
    // カード関連を非表示
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const cardTopSection = document.querySelector('.card-top-section');
    const inputListView = document.getElementById('inputListView');
    const cardHint = document.getElementById('cardHint');
    
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (cardTopSection) cardTopSection.classList.add('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    
    // インプットモード用戻るボタンとポーズボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    if (inputBackBtn) inputBackBtn.classList.remove('hidden');
    if (unitPauseBtn) unitPauseBtn.classList.add('hidden');
    
    // 復習モードのタイトルとクラスをリセット
    resetReviewWrongWordsTitle();
    
    // フィルターをリセット
    resetInputFilter();
    
    // シャッフル状態をリセット（通常の展開モードと同じ初期状態に）
    isInputShuffled = false;
    const shuffleBtn = document.getElementById('inputShuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.classList.remove('active');
    }
    
    // 単語一覧の表示モードを展開モードにリセット
    inputListViewMode = 'expand';
    const flipBtn = document.getElementById('inputListModeFlip');
    const expandBtn = document.getElementById('inputListModeExpand');
    const flipAllBtn = document.getElementById('inputFlipAllBtn');
    if (flipBtn) flipBtn.classList.remove('active');
    if (expandBtn) expandBtn.classList.add('active');
    if (flipAllBtn) flipAllBtn.classList.add('hidden');
    
    // input-list-headerの表示を通常モードと同じにする
    const inputListHeader = document.querySelector('.input-list-header');
    if (inputListHeader) {
        // review-wrong-wordsクラスを削除
        inputListHeader.classList.remove('review-wrong-words');
        // ヘッダーを表示
        inputListHeader.style.display = '';
    }
    
    // input-list-header-rowを表示（モードトグルボタン等）
    const inputListHeaderRow = document.querySelector('.input-list-header-row');
    if (inputListHeaderRow) {
        inputListHeaderRow.style.display = '';
    }
    
    // input-list-controls-rowを表示（シャッフル、フィルターボタン等）
    const inputListControlsRow = document.querySelector('.input-list-controls-row');
    if (inputListControlsRow) {
        inputListControlsRow.style.display = '';
    }
    
    // 単語一覧を描画（大量の単語の場合はページネーションで処理）
    if (words.length > 500) {
        renderInputListViewPaginated(words);
    } else {
        renderInputListView(words);
    }
    
    // 「すべての単語」モードでもチェックボックスの設定を適用
    applyInputListSettings();
}

// コースカード左側クリック時のモード選択モーダル（直接関数版）
function showCourseActionModal(category, words, courseTitle) {
    showStudyModeOverlay(
        () => showInputModeDirectly(category, words, courseTitle),
        () => showWordFilterView(category, words, courseTitle)
    );
}

// コースカード左側クリック時のモード選択モーダル（コールバック版）
function showCourseActionModalWithCallbacks(onInput, onOutput, title) {
    showStudyModeOverlay(onInput, onOutput);
}

// 学習メニュー選択画面を表示
function showLearningMenuSelection() {
    // 既存のオーバーレイがあれば削除
    const existingOverlay = document.getElementById('learningMenuOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.id = 'learningMenuOverlay';
    overlay.className = 'study-mode-overlay';
    
    overlay.innerHTML = `
        <div class="study-mode-container" style="width: calc(100% - 16px); max-width: 600px; margin: 0 auto;">
            <div class="study-mode-title">学習メニュー</div>
            <div class="learning-menu-categories">
                <button type="button" class="learning-menu-category-btn" data-category="超重要500語">
                    <span class="learning-menu-category-title">超重要500語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="重要500語">
                    <span class="learning-menu-category-title">重要500語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="ハイレベル300語">
                    <span class="learning-menu-category-title">ハイレベル300語</span>
                </button>
            </div>
            <button type="button" class="study-mode-cancel-btn">キャンセル</button>
        </div>
    `;
    
    // オーバーレイをクリックで閉じる
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // カテゴリーボタンにイベントリスナーを追加
    const categoryBtns = overlay.querySelectorAll('.learning-menu-category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            overlay.remove();
            showLearningSubcategoryMenu(category);
        });
    });
    
    // キャンセルボタン
    const cancelBtn = overlay.querySelector('.study-mode-cancel-btn');
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

// 学習サブカテゴリーメニューを表示
function showLearningSubcategoryMenu(category) {
    // 既存のオーバーレイがあれば削除
    const existingOverlay = document.getElementById('learningMenuOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // サブカテゴリーを定義
    let subcategories = [];
    if (category === '超重要500語') {
        subcategories = [
            'カテゴリー別',
            '冠詞',
            '代名詞',
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '疑問詞',
            '間投詞'
        ];
    } else if (category === '重要500語') {
        subcategories = [
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '助動詞',
            '接続詞',
            '数や量を表す詞',
            '代名詞'
        ];
    } else if (category === 'ハイレベル300語') {
        subcategories = [
            '名詞',
            '動詞',
            '形容詞',
            '副詞',
            '前置詞',
            '接続詞',
            '関係代名詞'
        ];
    }
    
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.id = 'learningMenuOverlay';
    overlay.className = 'study-mode-overlay';
    
    const subcategoryButtons = subcategories.map(subcat => 
        `<button type="button" class="learning-menu-subcategory-btn" data-subcategory="${subcat}">
            <span class="learning-menu-subcategory-title">${subcat}</span>
        </button>`
    ).join('');
    
    overlay.innerHTML = `
        <div class="study-mode-container" style="width: calc(100% - 16px); max-width: 480px; margin: 0 auto;">
            <div class="study-mode-title">${category}</div>
            <div class="learning-menu-subcategories">
                ${subcategoryButtons}
            </div>
            <button type="button" class="study-mode-cancel-btn">キャンセル</button>
        </div>
    `;
    
    // オーバーレイをクリックで閉じる
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // サブカテゴリーボタンにイベントリスナーを追加
    const subcategoryBtns = overlay.querySelectorAll('.learning-menu-subcategory-btn');
    subcategoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const subcategory = btn.dataset.subcategory;
            overlay.remove();
            startLearningFromMenu(category, subcategory);
        });
    });
    
    // キャンセルボタン
    const cancelBtn = overlay.querySelector('.study-mode-cancel-btn');
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
        showLearningMenuSelection();
    });
    
    document.body.appendChild(overlay);
}

// 学習メニューから学習を開始
function startLearningFromMenu(category, subcategory) {
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    learnedWordsAtStart = calculateTotalLearnedWords();
    lastLearningCategory = category;
    console.log('startLearningFromMenu: 学習開始', { category, learnedWordsAtStart });
    
    let words = [];
    
    // カテゴリーに応じてレベルを決定
    let levelCategory = '';
    if (category === '超重要500語') {
        levelCategory = 'LEVEL1 超重要単語400';
    } else if (category === '重要500語') {
        levelCategory = 'LEVEL2 重要単語300';
    } else if (category === 'ハイレベル300語') {
        levelCategory = 'LEVEL3 差がつく単語200';
    }
    
    // 単語を取得
    if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
        const allWords = getAllVocabulary();
        
        // まずレベルでフィルタリング
        let levelWords = [];
        if (levelCategory) {
            levelWords = allWords.filter(word => word.category === levelCategory);
        }
        
        // サブカテゴリーでフィルタリング
        if (subcategory === 'カテゴリー別') {
            // 小学生で習った単語を取得
            if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                words = getElementaryVocabulary();
            } else if (typeof elementaryWordData !== 'undefined') {
                words = elementaryWordData;
            }
        } else {
            // 品詞でフィルタリング
            words = levelWords.filter(word => {
                const partOfSpeech = word.partOfSpeech || '';
                if (subcategory === '冠詞') return partOfSpeech.includes('冠詞');
                if (subcategory === '代名詞') return partOfSpeech.includes('代名詞') && !partOfSpeech.includes('不定') && !partOfSpeech.includes('関係');
                if (subcategory === '名詞') return partOfSpeech.includes('名詞') && !partOfSpeech.includes('代名詞');
                if (subcategory === '動詞') return partOfSpeech.includes('動詞');
                if (subcategory === '形容詞') return partOfSpeech.includes('形容詞');
                if (subcategory === '副詞') return partOfSpeech.includes('副詞');
                if (subcategory === '前置詞') return partOfSpeech.includes('前置詞');
                if (subcategory === '疑問詞') return partOfSpeech.includes('疑問詞');
                if (subcategory === '間投詞') return partOfSpeech.includes('間投詞');
                if (subcategory === '助動詞') return partOfSpeech.includes('助動詞');
                if (subcategory === '接続詞') return partOfSpeech.includes('接続詞');
                if (subcategory === '数や量を表す詞') return partOfSpeech.includes('限定詞');
                if (subcategory === '代名詞') return partOfSpeech.includes('代名詞');
                if (subcategory === '関係代名詞') return partOfSpeech.includes('関係代名詞');
                return false;
            });
        }
    }
    
    if (words.length === 0) {
        showAlert('エラー', '選択したカテゴリーに単語がありません。');
        return;
    }
    
    // 学習方法を選択するオーバーレイを表示
    const categoryName = `${category} - ${subcategory}`;
    showStudyModeOverlay(
        () => showInputModeDirectly(categoryName, words, categoryName),
        () => showWordFilterView(categoryName, words, categoryName)
    );
}

// 学習モード選択オーバーレイを表示
function showStudyModeOverlay(onInput, onOutput, options = {}) {
    console.log('showStudyModeOverlay called', { onInput: !!onInput, onOutput: !!onOutput });
    // 既存のオーバーレイがあれば削除
    const existingOverlay = document.getElementById('studyModeOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const hideTest = options.hideTest || false;
    
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.id = 'studyModeOverlay';
    overlay.className = 'study-mode-overlay';
    console.log('Overlay element created');
    
    const testButtonHtml = hideTest ? '' : `
                <button type="button" class="study-mode-choice-btn study-mode-output-btn">
                    <span class="study-mode-choice-main">テスト</span>
                    <span class="study-mode-choice-sub">覚えたかどうか<br>確認する</span>
                </button>`;
    
    overlay.innerHTML = `
        <div class="study-mode-container" style="width: calc(100% - 16px); max-width: 600px; margin: 0 auto;">
            <div class="study-mode-title">学習方法を選択</div>
            <div class="study-mode-buttons${hideTest ? ' single-button' : ''}">
                <button type="button" class="study-mode-choice-btn study-mode-input-btn">
                    <span class="study-mode-choice-main">学習</span>
                    <span class="study-mode-choice-sub">単語一覧を見て<br>学習する</span>
                </button>${testButtonHtml}
            </div>
            <button type="button" class="study-mode-cancel-btn">キャンセル</button>
        </div>
    `;
    
    // オーバーレイをクリックで閉じる
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // 学習ボタン
    const inputBtn = overlay.querySelector('.study-mode-input-btn');
    inputBtn.addEventListener('click', () => {
        overlay.remove();
        if (onInput) onInput();
    });
    
    // テストボタン
    const outputBtn = overlay.querySelector('.study-mode-output-btn');
    if (outputBtn) {
        outputBtn.addEventListener('click', () => {
            overlay.remove();
            if (onOutput) onOutput();
        });
    }
    
    // キャンセルボタン
    const cancelBtn = overlay.querySelector('.study-mode-cancel-btn');
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

// 入力モード用の学習方法選択モーダルを表示（後方互換性のため残す）
function showInputModeMethodSelectionModal(category, categoryWords, hasProgress, savedIndex, wrongWordsInCategory, courseTitle) {
    // モードに応じて分岐
    if (selectedStudyMode === 'input') {
        // インプットモード：直接単語一覧を表示
        showInputModeDirectly(category, categoryWords, courseTitle);
    } else {
        // アウトプットモード：フィルター画面を表示
    showWordFilterView(category, categoryWords, courseTitle);
    }
}

// 学習方法選択モーダルを表示（後方互換性のため残す）
function showMethodSelectionModal(category, courseWords, hasProgress, savedIndex, wrongWordsInCourse, courseStart, courseEnd, courseTitle) {
    // モードに応じて分岐
    if (selectedStudyMode === 'input') {
        // インプットモード：直接単語一覧を表示
        showInputModeDirectly(category, courseWords, courseTitle);
    } else {
        // アウトプットモード：フィルター画面を表示
    showWordFilterView(category, courseWords, courseTitle);
    }
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
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    learnedWordsAtStart = calculateTotalLearnedWords();
    lastLearningCategory = category;
    console.log('initTimeAttackLearning: 学習開始', { category, learnedWordsAtStart });
    
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
    
    // 単元名を設定
    const scoreUpCategoriesTA = [
        '英文法中学３年間の総復習',
        '大阪B問題対策 厳選例文暗記60【和文英訳対策】',
        '条件英作文特訓コース',
        '大阪C問題対策英単語タイムアタック',
        '大阪C問題対策 英作写経ドリル',
        '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】',
        'C問題対策 大問1整序英作文【四択問題】'
    ];
    let displayTitleTA;
    if (scoreUpCategoriesTA.includes(category)) {
        displayTitleTA = category;
    } else {
        displayTitleTA = currentFilterCourseTitle || category;
    }
    
    if (elements.unitName) {
        const formattedTitle = formatTitleWithLevelBadge(displayTitleTA);
        if (formattedTitle !== displayTitleTA) {
            elements.unitName.innerHTML = formattedTitle;
        } else {
            elements.unitName.textContent = displayTitleTA;
        }
    }
    
    // ヘッダーの単元名も更新
    updateHeaderUnitName(displayTitleTA);
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    document.body.classList.add('time-attack-mode');
    // フィードバックオーバーレイの位置を更新（少し遅延させてDOMが更新されるのを待つ）
    setTimeout(() => {
        updateFeedbackOverlayPosition();
    }, 0);
    
    // ヘッダーを学習モードに更新（テストモード）
    updateHeaderButtons('learning', '', true);
    
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
    
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (wordCard) wordCard.classList.add('hidden'); // カウントダウン中は非表示
    if (cardHint) cardHint.classList.add('hidden'); // カウントダウン中は非表示
    // モードフラグをリセット
    isSentenceModeActive = false;
    isReorderModeActive = false;
    isChoiceQuestionModeActive = false;
    document.body.classList.remove('choice-question-mode-active');
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
    // 英語→日本語モード（カードモード）なので、selectedLearningModeを'card'に設定
    // これにより、進捗が_cardキーで保存される
    selectedLearningMode = 'card';
    // インプットモード（眺めるモード）の場合は、currentCourseWordsも設定
    if (currentLearningMode === 'input') {
        currentCourseWords = words;
    }
    isInputModeActive = false; // 通常のカードモードにリセット
    
    // テストボタンの表示制御（インプットモードのみ表示、アウトプットモードでは非表示）
    const unitTestBtn = document.getElementById('unitTestBtn');
    if (unitTestBtn) {
        if (currentLearningMode === 'input') {
            unitTestBtn.classList.remove('hidden');
        } else {
            unitTestBtn.classList.add('hidden');
        }
    }
    
    // メモボタンの表示制御（インプットモードのみ表示、アウトプットモードでは非表示）
    // ヘッダーのメモボタンは常に非表示（インラインボタンを使用）
    const memoPadBtn = document.getElementById('memoPadBtn');
    if (memoPadBtn) {
        memoPadBtn.classList.add('hidden');
    }
    
    // インラインメモボタン（トグル横）はインプットモードのみ表示
    const memoPadBtnInline = document.getElementById('memoPadBtnInline');
    if (memoPadBtnInline) {
        if (currentLearningMode === 'input') {
            memoPadBtnInline.classList.remove('hidden');
        } else {
            memoPadBtnInline.classList.add('hidden');
        }
    }
    
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
    consecutiveCorrect = 0; // 連続正解数をリセット
    const total = end - start;
    questionStatus = new Array(total).fill(null); // 各問題の回答状況を初期化
    
    // 進捗バーの表示開始位置を現在のインデックスが表示される範囲に設定
    const relativeIndex = currentIndex - currentRangeStart;
    // 現在のインデックスが表示される範囲の開始位置を計算（0から始まる相対位置）
    progressBarStartIndex = Math.max(0, Math.floor(relativeIndex / PROGRESS_BAR_DISPLAY_COUNT) * PROGRESS_BAR_DISPLAY_COUNT);
    // ただし、totalを超えないようにする
    progressBarStartIndex = Math.min(progressBarStartIndex, Math.max(0, total - PROGRESS_BAR_DISPLAY_COUNT));
    
    // 前回の回答状況を読み込んで進捗バーに反映
    // テストモード（アウトプットモード）では常に新しい状態で開始するため、読み込まない
    if (currentLearningMode === 'input' && category && category !== '間違い復習' && category !== '復習チェック' && category !== 'チェックした問題') {
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
            '大阪C問題対策 英文法100本ノック【整序英作文(記号選択)対策】',
            'C問題対策 大問1整序英作文【四択問題】'
        ];
        let displayTitle;
        if (scoreUpCategories.includes(category)) {
            // 入試得点力アップコースの場合はカテゴリー名をそのまま使用
            displayTitle = category;
        } else {
            // その他の場合はコース名（細かいタイトル）があればそれを使用、なければカテゴリー名を使用
            displayTitle = currentFilterCourseTitle || category;
        }
        const formattedTitle = formatTitleWithLevelBadge(displayTitle);
        if (formattedTitle !== displayTitle) {
            elements.unitName.innerHTML = formattedTitle;
        } else {
        elements.unitName.textContent = displayTitle;
        }
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
    
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (wordCard) wordCard.classList.remove('hidden');
    if (wordCardContainer) wordCardContainer.classList.remove('hidden');
    if (inputListView) inputListView.classList.add('hidden');
    // モードフラグをリセット
    isInputModeActive = false;
    isSentenceModeActive = false;
    isReorderModeActive = false;
    isChoiceQuestionModeActive = false;
    // 厳選例文・整序英作文・四択問題モードのbodyクラスを削除（CSSでカードが非表示になるのを防ぐ）
    document.body.classList.remove('sentence-mode-active');
    document.body.classList.remove('reorder-mode-active');
    document.body.classList.remove('choice-question-mode-active');
    
    // インプットモード用戻るボタンとポーズボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    
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
        // 戻るボタン表示、ポーズボタン非表示
        if (inputBackBtn) inputBackBtn.classList.remove('hidden');
        if (unitPauseBtn) unitPauseBtn.classList.add('hidden');
        // ヘッダー更新（インプットモード：×ボタン非表示）
        updateHeaderButtons('learning', '', false);
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
        // 戻るボタン非表示、ポーズボタン表示
        if (inputBackBtn) inputBackBtn.classList.add('hidden');
        if (unitPauseBtn) unitPauseBtn.classList.remove('hidden');
        // ヘッダー更新（テストモード：×ボタン表示）
        updateHeaderButtons('learning', '', true);
        
        // テストモード用のUIを有効化（白背景ヘッダー、中央に進捗表示）
        document.body.classList.add('quiz-test-mode');
        const testModeProgress = document.getElementById('testModeProgress');
        if (testModeProgress) {
            testModeProgress.classList.remove('hidden');
            testModeProgress.textContent = `1/${currentWords.length}`;
        }
        // ステータスバーを白に
        updateThemeColorForTest(true);
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
    
    // カテゴリー別カード
    const elementaryCategoryCardBtn = document.getElementById('elementaryCategoryCardBtn');
    if (elementaryCategoryCardBtn) {
        elementaryCategoryCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showElementaryCategorySelection();
        });
    }
    
    // レベル１ 超重要500語カード
    const level1CardBtn = document.getElementById('level1CardBtn');
    if (level1CardBtn) {
        level1CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLevelSubcategorySelection('レベル１ 超重要500語');
        });
    }
    
    // レベル２ 重要500語カード
    const level2CardBtn = document.getElementById('level2CardBtn');
    if (level2CardBtn) {
        level2CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLevelSubcategorySelection('レベル２ 重要500語');
        });
    }
    
    // レベル３ ハイレベル300語カード
    const level3CardBtn = document.getElementById('level3CardBtn');
    if (level3CardBtn) {
        level3CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLevelSubcategorySelection('レベル３ ハイレベル300語');
        });
    }
    
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
            // アコーディオンがクリックされた場合は何もしない
            if (e.target.closest('.category-accordion')) {
                console.log('Ignored: accordion clicked');
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
    
    // 大阪府のすべての英単語カードボタン
    const allWordsCardBtn = document.getElementById('allWordsCardBtn');
    if (allWordsCardBtn) {
        allWordsCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startAllWordsLearning();
        });
    }
    
    // 不規則変化の単語カードボタン → サブカテゴリーメニューを表示
    const irregularVerbsCardBtn = document.getElementById('irregularVerbsCardBtn');
    if (irregularVerbsCardBtn) {
        irregularVerbsCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showIvMenuView();
        });
    }
    
    // 不規則変化サブカテゴリーのアクションボタン（学習・テスト）
    const ivMenuView = document.getElementById('ivMenuView');
    if (ivMenuView) {
        ivMenuView.querySelectorAll('.course-side-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                const mode = btn.dataset.mode;
                if (mode === 'study') {
                    showIvStudyView(category);
                } else if (mode === 'test') {
                    showIvTestView(category);
                }
            });
        });
        // カードの白い部分（category-info）クリックでモード選択
        ivMenuView.querySelectorAll('.category-card-with-actions .category-info').forEach(info => {
            info.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = info.closest('.category-card-with-actions');
                const category = card?.dataset.category;
                if (category) {
                    showIvModeSelection(category);
                }
            });
        });
    }
    
    // 学習モード画面の戻るボタン
    const ivStudyBackBtn = document.getElementById('ivStudyBackBtn');
    if (ivStudyBackBtn) {
        ivStudyBackBtn.addEventListener('click', () => {
            hideIvStudyView();
        });
    }
    
    // 学習モードの赤シートチェックボックス
    const ivRedsheetCheckbox = document.getElementById('ivRedsheetCheckbox');
    if (ivRedsheetCheckbox) {
        ivRedsheetCheckbox.addEventListener('change', () => {
            toggleIvRedsheet();
        });
    }
    
    // 学習モード画面のテストボタン
    const ivStudyTestBtn = document.getElementById('ivStudyTestBtn');
    if (ivStudyTestBtn) {
        ivStudyTestBtn.addEventListener('click', () => {
            if (currentIvCategory) {
                // 学習モードを閉じてテストモードを開く
                const studyView = document.getElementById('ivStudyView');
                if (studyView) {
                    studyView.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                showIvTestView(currentIvCategory);
            }
        });
    }
    
    // 学習モードのメモボタン
    const ivMemoPadBtn = document.getElementById('ivMemoPadBtn');
    if (ivMemoPadBtn) {
        ivMemoPadBtn.addEventListener('click', () => {
            const overlay = document.getElementById('ivMemoPadOverlay');
            const canvas = document.getElementById('ivMemoPadCanvas');
            if (overlay && canvas) {
                if (!overlay.classList.contains('hidden') && !overlay.classList.contains('closing')) {
                    // 開いている場合は閉じる
                    overlay.classList.add('closing');
                    overlay.classList.remove('opening');
                    ivMemoPadBtn.classList.remove('active');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('closing');
                    }, 300);
                } else if (overlay.classList.contains('hidden')) {
                    // 閉じている場合は開く
                    overlay.classList.remove('hidden');
                    overlay.classList.remove('closing');
                    overlay.classList.add('opening');
                    ivMemoPadBtn.classList.add('active');
                    memoPadCanvas = canvas;
                    initMemoPadCanvas();
                }
            }
        });
    }
    
    // 学習モードのメモパッド閉じるボタン
    const ivMemoPadCloseBtn = document.getElementById('ivMemoPadCloseBtn');
    if (ivMemoPadCloseBtn) {
        ivMemoPadCloseBtn.addEventListener('click', () => {
            const overlay = document.getElementById('ivMemoPadOverlay');
            const ivMemoPadBtn = document.getElementById('ivMemoPadBtn');
            if (overlay) {
                overlay.classList.add('closing');
                overlay.classList.remove('opening');
                if (ivMemoPadBtn) ivMemoPadBtn.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('closing');
                }, 300);
            }
        });
    }
    
    // 学習モードのメモパッドクリアボタン
    const ivMemoPadClearBtn = document.getElementById('ivMemoPadClearBtn');
    if (ivMemoPadClearBtn) {
        ivMemoPadClearBtn.addEventListener('click', () => {
            const canvas = document.getElementById('ivMemoPadCanvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        });
    }
    
    // 学習モードのメモパッド太さボタン
    const ivMemoPadOverlay = document.getElementById('ivMemoPadOverlay');
    if (ivMemoPadOverlay) {
        const thicknessBtns = ivMemoPadOverlay.querySelectorAll('.memo-pad-thickness-btn');
        thicknessBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                thicknessBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                memoPadLineWidth = parseInt(btn.dataset.width);
            });
        });
    }
    
    // 学習モードの赤シート下矢印ボタン
    const ivRedsheetNextBtn = document.getElementById('ivRedsheetNextBtn');
    if (ivRedsheetNextBtn) {
        ivRedsheetNextBtn.addEventListener('click', () => {
            moveIvRedsheetToNext();
        });
    }
    
    // 不規則変化の単語画面（テストモード）の×ボタン
    const ivTestCloseBtn = document.getElementById('ivTestCloseBtn');
    if (ivTestCloseBtn) {
        ivTestCloseBtn.addEventListener('click', () => {
            const pauseOverlay = document.getElementById('ivTestPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.remove('hidden');
            }
        });
    }
    
    // 不規則変化テストモードのポーズ：テストを続ける
    const ivTestPauseContinueBtn = document.getElementById('ivTestPauseContinueBtn');
    if (ivTestPauseContinueBtn) {
        ivTestPauseContinueBtn.addEventListener('click', () => {
            const pauseOverlay = document.getElementById('ivTestPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
        });
    }
    
    // 不規則変化テストモードのポーズ：中断する
    const ivTestPauseQuitBtn = document.getElementById('ivTestPauseQuitBtn');
    if (ivTestPauseQuitBtn) {
        ivTestPauseQuitBtn.addEventListener('click', () => {
            const pauseOverlay = document.getElementById('ivTestPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
            hideIrregularVerbsView();
        });
    }
    
    // 不規則変化テストモードのポーズオーバーレイの背景クリックで閉じる
    const ivTestPauseOverlay = document.getElementById('ivTestPauseOverlay');
    if (ivTestPauseOverlay) {
        ivTestPauseOverlay.addEventListener('click', (e) => {
            if (e.target === ivTestPauseOverlay) {
                ivTestPauseOverlay.classList.add('hidden');
            }
        });
    }
    
    // コースタブ切り替え
    
    const courseTabs = document.querySelectorAll('.course-tab');
    const courseSections = document.querySelectorAll('.course-section');
    const courseTabsContainer = document.getElementById('courseTabs');
    if (courseTabs.length && courseSections.length) {
        // 初期状態でアクティブなタブに対応するセクションを表示
        const activeTab = document.querySelector('.course-tab.active');
        if (activeTab) {
            const targetId = activeTab.getAttribute('data-target');
            courseSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
            // 初期状態のボーダー色を設定
            if (courseTabsContainer) {
                if (targetId === 'courseScoreSection') {
                    courseTabsContainer.classList.add('score-active');
                } else {
                    courseTabsContainer.classList.remove('score-active');
                }
            }
        }
        
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
                // ボーダー色を切り替え
                if (courseTabsContainer) {
                    if (targetId === 'courseScoreSection') {
                        courseTabsContainer.classList.add('score-active');
                    } else {
                        courseTabsContainer.classList.remove('score-active');
                    }
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

    // チェックボックス（アウトプットモード用）
    if (elements.wordCheckbox) {
        elements.wordCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReview();
        });
        elements.wordCheckbox.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    
    // チェックボックス（アウトプットモード裏面用）
    const wordCheckboxBack = document.getElementById('wordCheckboxBack');
    if (wordCheckboxBack) {
        wordCheckboxBack.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReview();
        });
        wordCheckboxBack.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    
    // チェックボックス（インプットモード用）
    const inputWordCheckbox = document.getElementById('inputWordCheckbox');
    if (inputWordCheckbox) {
        inputWordCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReview();
        });
        inputWordCheckbox.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

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
        
        // スワイプと同じように右にスライドアウト
        isCardAnimating = true;
        elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
        elements.wordCard.style.transform = 'translateX(120%) rotate(12deg)';
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
        
        // スワイプと同じように左にスライドアウト
        isCardAnimating = true;
        elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
        elements.wordCard.style.transform = 'translateX(-120%) rotate(-12deg)';
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
    
    // 上部コンテナのテストへボタン
    const unitTestBtn = document.getElementById('unitTestBtn');
    if (unitTestBtn) {
        unitTestBtn.addEventListener('click', () => {
            // 現在のカテゴリと単語を使用してテストモードに切り替え
            if (currentFilterCategory && currentFilterWords && currentFilterWords.length > 0) {
                showWordFilterView(currentFilterCategory, currentFilterWords, currentFilterCourseTitle || currentFilterCategory);
            } else if (selectedCategory && currentCourseWords && currentCourseWords.length > 0) {
                showWordFilterView(selectedCategory, currentCourseWords, currentFilterCourseTitle || selectedCategory);
            }
        });
    }
    
    // ヘッダーのテストボタン
    const headerTestBtn = document.getElementById('headerTestBtn');
    if (headerTestBtn) {
        headerTestBtn.addEventListener('click', () => {
            if (currentFilterCategory && currentFilterWords && currentFilterWords.length > 0) {
                showWordFilterView(currentFilterCategory, currentFilterWords, currentFilterCourseTitle || currentFilterCategory);
            } else if (selectedCategory && currentCourseWords && currentCourseWords.length > 0) {
                showWordFilterView(selectedCategory, currentCourseWords, currentFilterCourseTitle || selectedCategory);
            }
        });
    }
    
    // ポーズボタン（×ボタン）
    if (elements.unitPauseBtn) {
        elements.unitPauseBtn.addEventListener('click', () => {
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.remove('hidden');
            }
        });
    }
    
    // ヘッダーのポーズボタン（×ボタン）
    const headerPauseBtn = document.getElementById('headerPauseBtn');
    if (headerPauseBtn) {
        headerPauseBtn.addEventListener('click', () => {
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.remove('hidden');
            }
        });
    }
    
    // ポーズメニュー：テストを続ける
    if (elements.pauseContinueBtn) {
        elements.pauseContinueBtn.addEventListener('click', () => {
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.add('hidden');
            }
        });
    }
    
    // ポーズメニュー：中断する
    if (elements.pauseQuitBtn) {
        elements.pauseQuitBtn.addEventListener('click', () => {
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.add('hidden');
            }
            showCategorySelection();
        });
    }
    
    // ポーズオーバーレイの背景クリックで閉じる
    if (elements.pauseOverlay) {
        elements.pauseOverlay.addEventListener('click', (e) => {
            if (e.target === elements.pauseOverlay) {
                elements.pauseOverlay.classList.add('hidden');
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
            
            // シャッフル状態をリセット
            isInputShuffled = false;
            const shuffleBtn = document.getElementById('inputShuffleBtn');
            if (shuffleBtn) {
                shuffleBtn.classList.remove('active');
            }
            
            // 単語一覧の表示モードを展開モードにリセット
            inputListViewMode = 'expand';
            const flipBtn = document.getElementById('inputListModeFlip');
            const expandBtn = document.getElementById('inputListModeExpand');
            const flipAllBtn = document.getElementById('inputFlipAllBtn');
            if (flipBtn) flipBtn.classList.remove('active');
            if (expandBtn) expandBtn.classList.add('active');
            if (flipAllBtn) flipAllBtn.classList.add('hidden');
            
            // フリップモードでヘッダーがコンテナ内にある場合は元の位置に戻す
            const inputListHeader = document.querySelector('.input-list-header');
            const inputListView = document.getElementById('inputListView');
            const inputListContainer = document.getElementById('inputListContainer');
            if (inputListHeader && inputListView && inputListContainer && inputListContainer.contains(inputListHeader)) {
                inputListView.insertBefore(inputListHeader, inputListContainer);
            }
            
            // カテゴリー別のサブカテゴリー
            const elementarySubcategories = [
                '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
                '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
                '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
            ];
            
            // メインコンテンツを右へスライドアウト
            if (elements.mainContent) {
                elements.mainContent.style.transition = 'transform 0.3s ease-out';
                elements.mainContent.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    elements.mainContent.style.transition = '';
                    elements.mainContent.style.transform = '';
                    elements.mainContent.classList.add('hidden');
                }, 300);
            }
            
            // レベル別の細分化メニューから来た場合は、レベル別の細分化メニューに戻る
            console.log('inputBackBtn clicked, currentSubcategoryParent:', window.currentSubcategoryParent);
            if (window.currentSubcategoryParent && (window.currentSubcategoryParent === 'レベル１ 超重要500語' || 
                window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                window.currentSubcategoryParent === 'レベル３ ハイレベル300語')) {
                console.log('Returning to level subcategory selection:', window.currentSubcategoryParent);
                showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                return;
            }
            
            // カテゴリー別から来た場合は、その画面に戻る
            if (window.currentSubcategoryParent === 'カテゴリー別') {
                showElementaryCategorySelection(true);
                return;
            }
            
            // カテゴリー別に覚える単語のサブカテゴリーの場合はカテゴリー別の画面に戻る
            if (selectedCategory && elementarySubcategories.includes(selectedCategory)) {
                showElementaryCategorySelection(true);
                return;
            }
            
            // コース選択画面に戻る
            if (selectedCategory) {
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
                } else if (selectedCategory === 'LEVEL1 超重要単語400' || selectedCategory === 'LEVEL2 重要単語300' || selectedCategory === 'LEVEL3 差がつく単語200' || 
                           selectedCategory === 'LEVEL4 私立高校入試レベル' || selectedCategory === 'LEVEL5 難関私立高校入試レベル') {
                    // レベル別単語：vocabulary-data.jsから取得（最適化）
                    const levelMap = {
                        'LEVEL1 超重要単語400': 1,
                        'LEVEL2 重要単語300': 2,
                        'LEVEL3 差がつく単語200': 3,
                        'LEVEL4 私立高校入試レベル': 4,
                        'LEVEL5 難関私立高校入試レベル': 5
                    };
                    const level = levelMap[selectedCategory];
                    if (level && typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
                        categoryWords = getVocabularyByLevel(level);
                    } else if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                        const allWords = getAllVocabulary();
                        categoryWords = allWords.filter(word => word.category === selectedCategory);
                } else {
                        categoryWords = wordData.filter(word => word.category === selectedCategory);
                    }
                } else {
                    // vocabulary-data.jsから取得を試みる
                    if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                        const allWords = getAllVocabulary();
                        categoryWords = allWords.filter(word => word.category === selectedCategory);
                    } else {
                        categoryWords = wordData.filter(word => word.category === selectedCategory);
                    }
                }
                if (categoryWords && categoryWords.length > 0) {
                    showCourseSelection(selectedCategory, categoryWords, true);
                } else {
                    showCategorySelection(true);
                }
            } else {
                showCategorySelection(true);
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
            if (isChoiceQuestionModeActive) {
                // 四択問題モードのとき
                moveToPrevChoiceQuestion();
            } else if (isReorderModeActive) {
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
            if (isChoiceQuestionModeActive) {
                // 四択問題モードのとき
                moveToNextChoiceQuestion();
            } else if (isReorderModeActive) {
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
    
    // 学習方向（日本語→英語 / 英語→日本語）のラジオボタン
    const modeEngToJpn = document.getElementById('modeEngToJpn');
    const modeJpnToEng = document.getElementById('modeJpnToEng');
    
    if (modeEngToJpn) {
        modeEngToJpn.addEventListener('change', () => {
            if (modeEngToJpn.checked) {
                selectedQuizDirection = 'eng-to-jpn';
                isHandwritingMode = false;
                console.log('[Filter] Quiz direction: 英語→日本語');
            }
        });
    }
    
    if (modeJpnToEng) {
        modeJpnToEng.addEventListener('change', () => {
            if (modeJpnToEng.checked) {
                selectedQuizDirection = 'jpn-to-eng';
                isHandwritingMode = true;
                console.log('[Filter] Quiz direction: 日本語→英語 (手書きモード)');
                
                // モデルを事前ロード
                if (window.handwritingRecognition && !window.handwritingRecognition.isModelLoaded) {
                    console.log('[Filter] Pre-loading EMNIST model...');
                    window.handwritingRecognition.loadModel();
                }
            }
        });
    }

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
    
    // 出題数ボタンのイベントリスナー
    const questionCountValue = document.getElementById('questionCountValue');
    const questionCountMinus = document.getElementById('questionCountMinus');
    const questionCountPlus = document.getElementById('questionCountPlus');
    
    function updateQuestionCountDisplay(count, maxCount) {
        if (!questionCountValue) return;
        
        questionCountValue.dataset.count = count;
        
        // 最大値なら「すべて」と表示
        if (count >= maxCount) {
            questionCountValue.textContent = 'すべて';
        } else {
            questionCountValue.textContent = count + '問';
        }
        
        // ボタンの有効/無効状態を更新
        if (questionCountMinus) {
            questionCountMinus.disabled = count <= 10;
        }
        if (questionCountPlus) {
            questionCountPlus.disabled = count >= maxCount;
        }
    }
    
    function initQuestionCountButtons() {
        const filteredWords = getFilteredWords();
        const maxCount = filteredWords.length;
        
        if (maxCount < 1) {
            return;
        }
        
        let currentCount = parseInt(questionCountValue?.dataset.count) || maxCount;
        currentCount = Math.max(10, Math.min(maxCount, currentCount));
        
        updateQuestionCountDisplay(currentCount, maxCount);
    }
    
    // 初期化を実行
    initQuestionCountButtons();
    
    // -ボタンのクリックイベント
    if (questionCountMinus) {
        questionCountMinus.addEventListener('click', () => {
            const filteredWords = getFilteredWords();
            const maxCount = filteredWords.length;
            if (maxCount < 1) return;
            
            let currentCount = parseInt(questionCountValue?.dataset.count) || maxCount;
            
            // 10の倍数のキリの良い数字に調整
            if (currentCount >= maxCount) {
                // 「すべて」から押した場合は、10の倍数に切り捨て
                currentCount = Math.floor(maxCount / 10) * 10;
            } else if (currentCount % 10 === 0) {
                // 既に10の倍数なら-10
                currentCount = currentCount - 10;
            } else {
                // 10の倍数でなければ切り捨て
                currentCount = Math.floor(currentCount / 10) * 10;
            }
            
            currentCount = Math.max(10, currentCount);
            
            updateQuestionCountDisplay(currentCount, maxCount);
        });
    }
    
    // +ボタンのクリックイベント
    if (questionCountPlus) {
        questionCountPlus.addEventListener('click', () => {
            const filteredWords = getFilteredWords();
            const maxCount = filteredWords.length;
            if (maxCount < 1) return;
            
            let currentCount = parseInt(questionCountValue?.dataset.count) || maxCount;
            
            // 10の倍数のキリの良い数字に調整
            if (currentCount % 10 === 0) {
                // 既に10の倍数なら+10
                currentCount = currentCount + 10;
            } else {
                // 10の倍数でなければ切り上げ
                currentCount = Math.ceil(currentCount / 10) * 10;
            }
            
            // 最大値を超えたら「すべて」に
            if (currentCount >= maxCount) {
                currentCount = maxCount;
            }
            
            updateQuestionCountDisplay(currentCount, maxCount);
        });
    }
    
    // フィルター変更時に再初期化
    const originalUpdateFilterInfo = updateFilterInfo;
    updateFilterInfo = function() {
        originalUpdateFilterInfo();
        initQuestionCountButtons();
    };
    
    // 学習開始ボタン
    if (filterStartBtn) {
        filterStartBtn.addEventListener('click', () => {
            const filteredWords = getFilteredWords();
            if (filteredWords.length === 0) {
                alert('選択された単語がありません。フィルターを調整してください。');
                return;
            }
            
            // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
            learnedWordsAtStart = calculateTotalLearnedWords();
            lastLearningCategory = currentFilterCategory;
            console.log('filterStartBtn: 学習開始', { category: currentFilterCategory, learnedWordsAtStart });
            
            // 出題順を取得
            const orderSequential = document.getElementById('orderSequential');
            const isSequential = orderSequential?.checked ?? true;
            
            // 出題順に応じて単語を並び替え
            let wordsToLearn = [...filteredWords];
            if (!isSequential) {
                // ランダム順
                wordsToLearn = wordsToLearn.sort(() => Math.random() - 0.5);
            }
            
            // アウトプットモードまたはテストモードの場合、出題数を制限
            if (filterLearningMode === 'output' || filterLearningMode === 'test') {
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
            
            // 日本語→英語モード（手書き入力）の場合
            if (isHandwritingMode) {
                console.log('[Filter] Starting handwriting quiz mode');
                startHandwritingQuiz(currentFilterCategory, wordsToLearn, currentFilterCourseTitle);
                return;
            }
            
            // 英語→日本語モード（カードモード）の場合は常にカードモードで開始
            // selectedQuizDirection === 'eng-to-jpn'ならカードモード確定
            if (selectedQuizDirection === 'eng-to-jpn') {
                console.log('[Filter] Starting card mode (eng-to-jpn)');
                currentLearningMode = 'card';
                selectedLearningMode = 'card';
                initLearning(currentFilterCategory, wordsToLearn, 0, wordsToLearn.length, 0);
            } else if (filterLearningMode === 'input') {
                // 単語帳（展開）モードで開始
                showInputModeDirectly(currentFilterCategory, wordsToLearn, currentFilterCourseTitle);
            } else {
                // 単語カードモードで開始
                currentLearningMode = selectedLearningMode === 'input' ? 'input' : 'card';
                initLearning(currentFilterCategory, wordsToLearn, 0, wordsToLearn.length, 0);
            }
        });
    }
    
    // フィルター画面を閉じる関数（下にスライドして閉じる）
    function closeFilterSheet() {
        // 閉じる音を再生
        SoundEffects.playClose();
        
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
    
    // ヘッダーバナーを下にスワイプして閉じる機能
    const filterHeaderBanner = document.querySelector('.filter-header-banner');
    if (filterHeaderBanner) {
        let swipeStartY = 0;
        let swipeStartTime = 0;
        let isDragging = false;
        let currentTranslateY = 0;
        
        const handleTouchStart = (e) => {
            swipeStartY = e.touches ? e.touches[0].clientY : e.clientY;
            swipeStartTime = Date.now();
            isDragging = true;
            currentTranslateY = 0;
            
            const wordFilterView = document.getElementById('wordFilterView');
            if (wordFilterView) {
                wordFilterView.style.transition = 'none';
            }
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            const currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - swipeStartY;
            
            // 下方向へのスワイプのみ許可
            if (deltaY > 0) {
                currentTranslateY = deltaY;
                const wordFilterView = document.getElementById('wordFilterView');
                if (wordFilterView) {
                    wordFilterView.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
                }
            }
        };
        
        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            const swipeEndTime = Date.now();
            const swipeDuration = swipeEndTime - swipeStartTime;
            const currentY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            const deltaY = currentY - swipeStartY;
            
            const wordFilterView = document.getElementById('wordFilterView');
            const threshold = 80; // 80px以上下にスワイプしたら閉じる
            const minVelocity = 0.3; // 最小速度（px/ms）
            const velocity = Math.abs(deltaY) / swipeDuration;
            
            if (wordFilterView) {
                wordFilterView.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
                
                // 閾値を超えた、または十分な速度で下にスワイプした場合
                if (deltaY > threshold || (deltaY > 30 && velocity > minVelocity)) {
                    closeFilterSheet();
                } else {
                    // 元の位置に戻す
                    wordFilterView.style.transform = 'translateX(-50%) translateY(0)';
                }
            }
        };
        
        filterHeaderBanner.addEventListener('touchstart', handleTouchStart, { passive: false });
        filterHeaderBanner.addEventListener('touchmove', handleTouchMove, { passive: false });
        filterHeaderBanner.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // マウスイベントもサポート（デスクトップ用）
        filterHeaderBanner.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleTouchStart(e);
            const handleMouseMove = (e) => {
                handleTouchMove(e);
            };
            const handleMouseUp = (e) => {
                handleTouchEnd(e);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }
    
    // オーバーレイクリックで閉じる
    const filterOverlay = document.getElementById('filterOverlay');
    if (filterOverlay) {
        filterOverlay.addEventListener('click', closeFilterSheet);
    }
    
    // ドラッグハンドルでスワイプダウンで閉じる
    const filterHandle = document.querySelector('.filter-handle');
    const filterSheet = document.getElementById('wordFilterView');
    if (filterHandle && filterSheet) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        filterHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            filterSheet.style.transition = 'none';
        }, { passive: true });
        
        filterHandle.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // 下方向のみドラッグ可能
            if (deltaY > 0) {
                filterSheet.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
            }
        }, { passive: true });
        
        filterHandle.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const deltaY = currentY - startY;
            filterSheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
            
            // 80px以上下にドラッグしたら閉じる
            if (deltaY > 80) {
                closeFilterSheet();
            } else {
                // 元に戻す
                filterSheet.style.transform = 'translateX(-50%) translateY(0)';
            }
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
        SoundEffects.playClose();
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
    
    // 戻る処理を共通関数化
    function handleBackButton() {
            // スクロール位置を一番上にリセット
            window.scrollTo(0, 0);
            const appMain = document.querySelector('.app-main');
            if (appMain) appMain.scrollTop = 0;
            
            // 現在の画面に応じて適切な画面に戻る
            const grammarChapterView = document.getElementById('grammarChapterView');
            const grammarTOCView = document.getElementById('grammarTableOfContentsView');
            const courseSelection = document.getElementById('courseSelection');
            const ivMenuView = document.getElementById('ivMenuView');
            
            const wordFilterView = document.getElementById('wordFilterView');
            
            // 不規則変化のサブカテゴリーメニューからホームに戻る
            if (ivMenuView && !ivMenuView.classList.contains('hidden')) {
                hideIvMenuView();
                return;
            }
            
            if (grammarChapterView && !grammarChapterView.classList.contains('hidden')) {
                // 文法解説ページから目次ページに戻る
                grammarChapterView.classList.add('hidden');
                showGrammarTableOfContents();
            } else if (grammarTOCView && !grammarTOCView.classList.contains('hidden')) {
                // 文法目次ページからカテゴリー選択画面に戻る
                grammarTOCView.classList.add('hidden');
                showCategorySelection();
            } else if (wordFilterView && !wordFilterView.classList.contains('hidden')) {
                // フィルター画面からコース選択画面に戻る
                wordFilterView.classList.add('hidden');
                
                // サブカテゴリー画面を再生成して進捗バーを更新
                if (window.currentSubcategoryParent) {
                    if (window.currentSubcategoryParent === 'レベル１ 超重要500語' || 
                        window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                        window.currentSubcategoryParent === 'レベル３ ハイレベル300語') {
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    } else if (window.currentSubcategoryParent === 'カテゴリー別') {
                        showElementaryCategorySelection(true);
                        return;
                    }
                }
                
                // その他の場合は従来の処理
                if (courseSelection) {
                    courseSelection.classList.remove('hidden');
                    // ヘッダーのタイトルを更新
                    let displayCategory = selectedCategory;
                    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                        displayCategory = 'カテゴリー別に覚える単語';
                    }
                    updateHeaderButtons('course', displayCategory);
                }
            } else if (courseSelection && !courseSelection.classList.contains('hidden')) {
                // コース選択画面からカテゴリー選択画面に戻る（スライドイン）
                const categorySelection = elements.categorySelection;
                
                // サブカテゴリー画面からの戻りの場合はスライドインを使用
                if (window.currentSubcategoryParent) {
                    // コース選択画面を右へスライドアウト
                    courseSelection.classList.add('slide-out-right');
                    
                    // カテゴリー選択画面を左からスライドイン
                    categorySelection.classList.remove('hidden');
                    categorySelection.classList.add('slide-in-left');
                    
                    // 進捗バーを更新してアニメーションを実行
                    updateCategoryStars();
                    updateVocabProgressBar();
                    if (lastLearningCategory) {
                        setTimeout(() => {
                            animateProgressToGoal();
                            lastLearningCategory = null;
                        }, 100);
                    }
                    
                    setTimeout(() => {
                        courseSelection.classList.remove('slide-out-right');
                        courseSelection.classList.add('hidden');
                        categorySelection.classList.remove('slide-in-left');
                        window.currentSubcategoryParent = null;
                    }, 300);
                    
                    updateHeaderButtons('home');
                } else {
                    courseSelection.classList.add('hidden');
                    showCategorySelection();
                }
            } else if (elements.mainContent && !elements.mainContent.classList.contains('hidden')) {
                // 学習画面からコース選択画面またはカテゴリー選択画面に戻る
                if (selectedCategory) {
                    // レベル別の細分化メニューから来た場合は、細分化メニューに戻る
                    if (window.currentSubcategoryParent && (window.currentSubcategoryParent === 'レベル１ 超重要500語' || 
                        window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                        window.currentSubcategoryParent === 'レベル３ ハイレベル300語')) {
                        elements.mainContent.classList.add('hidden');
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    }
                    
                    // カテゴリー別から来た場合は、細分化メニューに戻る
                    if (window.currentSubcategoryParent && window.currentSubcategoryParent === 'カテゴリー別') {
                        elements.mainContent.classList.add('hidden');
                        showElementaryCategorySelection(true);
                        return;
                    }
                    
                    // コース選択画面に戻る
                    let categoryWords;
                    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                        if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                            categoryWords = getElementaryVocabulary();
                        } else if (typeof elementaryWordData !== 'undefined') {
                            categoryWords = elementaryWordData;
                        } else {
                            showCategorySelection();
                            return;
                        }
                    } else if (selectedCategory === 'LEVEL1 超重要単語400' || selectedCategory === 'LEVEL2 重要単語300' || selectedCategory === 'LEVEL3 差がつく単語200' || 
                               selectedCategory === 'LEVEL4 私立高校入試レベル' || selectedCategory === 'LEVEL5 難関私立高校入試レベル') {
                        // レベル別単語：vocabulary-data.jsから取得
                        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                            const allWords = getAllVocabulary();
                            categoryWords = allWords.filter(word => word.category === selectedCategory);
                    } else {
                            categoryWords = wordData.filter(word => word.category === selectedCategory);
                        }
                    } else {
                        // vocabulary-data.jsから取得を試みる
                        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                            const allWords = getAllVocabulary();
                            categoryWords = allWords.filter(word => word.category === selectedCategory);
                        } else {
                            categoryWords = wordData.filter(word => word.category === selectedCategory);
                        }
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
    }
    
    // ヘッダー/文法用戻るボタン
    const headerBackBtn = document.getElementById('headerBackBtn');
    if (headerBackBtn) {
        headerBackBtn.addEventListener('click', handleBackButton);
    }
    const grammarTocBackBtn = document.getElementById('grammarTocBackBtn');
    if (grammarTocBackBtn) {
        grammarTocBackBtn.addEventListener('click', handleBackButton);
    }
    const grammarChapterBackBtn = document.getElementById('grammarChapterBackBtn');
    if (grammarChapterBackBtn) {
        grammarChapterBackBtn.addEventListener('click', handleBackButton);
    }
    
    // 学習方法ボタン
    const learningMethodBtn = document.getElementById('learningMethodBtn');
    if (learningMethodBtn) {
        learningMethodBtn.addEventListener('click', () => {
            closeSidebar();
            showLearningMenuSelection();
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
    
    // すべてのボタンに適切な効果音を追加
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .category-card, .course-btn, .study-btn, .mode-radio, .order-radio, .filter-checkbox, .menu-item, .main-menu-btn, .start-learning-btn');
        if (!target) return;
        
        // ×ボタンや閉じるボタンは閉じる音（各close関数内で既に再生されるのでここでは何もしない）
        // ボタン内のSVG要素なども考慮して、親要素もチェック
        const isCloseButton = target.classList.contains('filter-close-btn') || 
            target.classList.contains('school-modal-close') ||
            target.classList.contains('school-confirm-btn') ||
            target.classList.contains('sidebar-close-btn') ||
            target.classList.contains('install-close-btn') ||
            target.classList.contains('close-btn') ||
            target.id === 'filterCloseBtn' || 
            target.id === 'filterBackBtn' ||
            target.id === 'closeSchoolSettings' ||
            target.id === 'sidebarCloseBtn' ||
            target.id === 'installCloseBtn' ||
            target.closest('.filter-close-btn, .school-modal-close, .school-confirm-btn, .sidebar-close-btn, .install-close-btn, .close-btn') ||
            target.closest('#filterCloseBtn, #filterBackBtn, #closeSchoolSettings, #sidebarCloseBtn, #installCloseBtn');
        
        if (isCloseButton) {
            return;
        }
        
        // 正解/不正解ボタンは効果音なし（markAnswer内で再生）
        if (target.classList.contains('correct-btn') || target.classList.contains('wrong-btn')) {
            return;
        }
        
        // カテゴリーカードやメニュー項目はメニュー選択音
        if (target.classList.contains('category-card') || 
            target.classList.contains('menu-item') ||
            target.classList.contains('main-menu-btn')) {
            SoundEffects.playMenuSelect();
            return;
        }
        
        // その他のボタンはタップ音
        SoundEffects.playTap();
    }, true);
    
}

// 仮想キーボードの設定
function setupVirtualKeyboard() {
    const keyboard = document.getElementById('virtualKeyboard');
    if (!keyboard) return;
    
    // キーボードキーのタッチ/クリックイベント（タッチ優先で即座に反応）
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const initialLetter = key.dataset.key;
        let touchHandled = false;
        
        // 視覚的フィードバック
        const addPressedState = () => {
            key.style.transform = 'scale(0.95)';
            key.style.backgroundColor = '#d1d5db';
        };
        const removePressedState = () => {
            key.style.transform = '';
            key.style.backgroundColor = '';
        };
        
        // スペースキーの特別処理
        if (initialLetter === ' ') {
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                addPressedState();
                insertLetter(' ');
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                removePressedState();
                setTimeout(() => { touchHandled = false; }, 100);
            });
            
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                insertLetter(' ');
            });
        } else {
            // 通常の文字キー - タップ時の現在のdata-keyを使用（大文字/小文字対応）
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                addPressedState();
                // タップ時点でのdata-keyを取得（Shift状態に応じて大文字/小文字）
                const currentLetter = key.dataset.key;
                insertLetter(currentLetter);
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                removePressedState();
                setTimeout(() => { touchHandled = false; }, 100);
            });
            
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                // クリック時点でのdata-keyを取得（Shift状態に応じて大文字/小文字）
                const currentLetter = key.dataset.key;
                insertLetter(currentLetter);
            });
        }
    });
    
    // Shiftキー
    const shiftKey = document.getElementById('keyboardShift');
    if (shiftKey) {
        let shiftTouchHandled = false;
        
        shiftKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            shiftTouchHandled = true;
            toggleShift();
        }, { passive: false });
        
        shiftKey.addEventListener('touchend', () => {
            setTimeout(() => { shiftTouchHandled = false; }, 100);
        });
        
        shiftKey.addEventListener('click', (e) => {
            if (shiftTouchHandled) return;
            e.preventDefault();
            toggleShift();
        });
    }
    
    // バックスペースキー（長押し対応）
    const backspaceKey = document.getElementById('keyboardBackspace');
    if (backspaceKey) {
        let backspaceInterval = null;
        let backspaceTimeout = null;
        
        const startBackspaceRepeat = () => {
            // 即座に1回削除
            handleBackspace();
            
            // 300ms後に連続削除を開始
            backspaceTimeout = setTimeout(() => {
                backspaceInterval = setInterval(() => {
                    handleBackspace();
                }, 80); // 80msごとに削除
            }, 300);
        };
        
        const stopBackspaceRepeat = () => {
            if (backspaceTimeout) {
                clearTimeout(backspaceTimeout);
                backspaceTimeout = null;
            }
            if (backspaceInterval) {
                clearInterval(backspaceInterval);
                backspaceInterval = null;
            }
        };
        
        backspaceKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startBackspaceRepeat();
        }, { passive: false });
        
        backspaceKey.addEventListener('touchend', stopBackspaceRepeat);
        backspaceKey.addEventListener('touchcancel', stopBackspaceRepeat);
        
        backspaceKey.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startBackspaceRepeat();
        });
        
        backspaceKey.addEventListener('mouseup', stopBackspaceRepeat);
        backspaceKey.addEventListener('mouseleave', stopBackspaceRepeat);
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
                            // カードめくり音を再生
                            SoundEffects.playFlip();
                            
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
        // 受け取った文字をそのまま使用（data-keyは既にShift状態に応じて更新されている）
        const letterToInsert = letter;
        console.log('[DEBUG insertLetter] letter:', letter, 'isShiftActive:', isShiftActive);
        
        // Shiftキーがアクティブだった場合、入力後にリセット
        if (isShiftActive && letter !== ' ') {
            window.pendingShiftReset = 'virtualKeyboard';
        }
        
        // 直接値を設定し、data属性にも保存
        activeInput.value = letterToInsert;
        activeInput.dataset.savedValue = letterToInsert;
        
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
    const keyboard = document.getElementById('virtualKeyboard');
    if (shiftKey) {
        if (isShiftActive) {
            shiftKey.classList.add('active');
            shiftKey.dataset.shift = 'true';
        } else {
            shiftKey.classList.remove('active');
            shiftKey.dataset.shift = 'false';
        }
    }
    // キーボードにshift-activeクラスを追加/削除（ポップアップ用）
    if (keyboard) {
        keyboard.classList.toggle('shift-active', isShiftActive);
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
                key.dataset.key = letter.toUpperCase(); // ポップアップ用にdata-keyも更新
            } else {
                key.textContent = letter.toLowerCase();
                key.dataset.key = letter.toLowerCase(); // ポップアップ用にdata-keyも更新
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
            activeInput.dataset.savedValue = '';
        } else {
            // 前のフィールドに移動
            const currentIndex = parseInt(activeInput.dataset.index);
            if (currentIndex > 0) {
                const prevInput = letterInputs.querySelector(`input[data-index="${currentIndex - 1}"]`);
                if (prevInput && !prevInput.disabled) {
                    prevInput.focus();
                    prevInput.value = '';
                    prevInput.dataset.savedValue = '';
                }
            }
        }
    } else {
        // フォーカスがない場合は最後の入力済みフィールドをクリア
        const filledInputs = Array.from(inputs).filter(input => input.value);
        if (filledInputs.length > 0) {
            const lastInput = filledInputs[filledInputs.length - 1];
            lastInput.value = '';
            lastInput.dataset.savedValue = '';
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
    
    // 仮想キーボードの無効化を解除
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    if (virtualKeyboard) {
        virtualKeyboard.classList.remove('answer-submitted');
    }
    
    // Shiftキーの状態をリセット（キーボードを小文字に）
    if (isShiftActive) {
        isShiftActive = false;
        const shiftKey = document.getElementById('keyboardShift');
        if (shiftKey) {
            shiftKey.classList.remove('active');
            shiftKey.dataset.shift = 'false';
        }
        if (virtualKeyboard) {
            virtualKeyboard.classList.remove('shift-active');
        }
        updateKeyboardDisplay();
    }
    
    // No.を更新（カードモードと入力モードの両方）
    if (elements.wordNumber) {
        elements.wordNumber.textContent = `No.${word.id}`;
    }
    const inputWordNumber = document.getElementById('inputWordNumber');
    if (inputWordNumber) {
        inputWordNumber.textContent = `No.${word.id}`;
    }
    
    // チェックボックスの状態を更新
    if (elements.wordCheckbox) {
        if (reviewWords.has(word.id)) {
            elements.wordCheckbox.classList.add('checked');
        } else {
            elements.wordCheckbox.classList.remove('checked');
        }
    }
    const wordCheckboxBack = document.getElementById('wordCheckboxBack');
    if (wordCheckboxBack) {
        if (reviewWords.has(word.id)) {
            wordCheckboxBack.classList.add('checked');
        } else {
            wordCheckboxBack.classList.remove('checked');
        }
    }
    const inputWordCheckbox = document.getElementById('inputWordCheckbox');
    if (inputWordCheckbox) {
        if (reviewWords.has(word.id)) {
            inputWordCheckbox.classList.add('checked');
        } else {
            inputWordCheckbox.classList.remove('checked');
        }
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
    
    // 入試頻出度を表示（入力モード）
    const inputAppearanceCountEl = document.getElementById('inputWordAppearanceCount');
    if (inputAppearanceCountEl) {
        const count =
            typeof word.appearanceCount === 'number' && !isNaN(word.appearanceCount)
                ? word.appearanceCount
                : 0;
        const valueSpan = inputAppearanceCountEl.querySelector('.appearance-value');
        if (valueSpan) {
            const stars = getAppearanceStars(count);
            valueSpan.textContent = ` ${stars}`;
        }
        inputAppearanceCountEl.style.display = 'flex';
    }
    
    // 手書きモードかどうかで入力UIを切り替え
    const handwritingContainer = document.getElementById('handwritingInputContainer');
    // virtualKeyboard は上で既に取得済み
    
    if (isHandwritingMode) {
        // 手書きモード: letter-inputs を非表示にし、手書きUIを表示
        if (letterInputs) {
            letterInputs.classList.add('hidden');
        }
        if (handwritingContainer) {
            handwritingContainer.classList.remove('hidden');
            // 手書きUI初期化
            initHandwritingMode(word);
        }
        if (virtualKeyboard) {
            virtualKeyboard.classList.add('hidden');
        }
    } else {
        // 通常モード: 文字数分の入力フィールドを生成
        if (letterInputs) {
            letterInputs.classList.remove('hidden');
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
                input.setAttribute('autocapitalize', 'off');
                input.setAttribute('autocorrect', 'off');
                
                // 入力時の処理（大文字小文字を保持）
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // 大文字小文字を保持したまま設定（小文字に変換しない）
                    e.target.value = value;
                    // data属性にも保存
                    e.target.dataset.savedValue = value;
                    
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
        if (handwritingContainer) {
            handwritingContainer.classList.add('hidden');
        }
        if (virtualKeyboard) {
            virtualKeyboard.classList.remove('hidden');
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
    
    // 入力された文字を結合（data属性から取得して大文字小文字を保持）
    const inputs = letterInputs.querySelectorAll('.letter-input');
    // 各入力フィールドの値を先にdata属性から取得して保存
    const savedValues = Array.from(inputs).map(input => {
        const saved = input.dataset.savedValue;
        return (saved !== undefined && saved !== '') ? saved : input.value.trim();
    });
    const userAnswer = savedValues.join('');
    const correctWord = word.word;
    console.log('[DEBUG submitAnswer] userAnswer:', userAnswer, 'correctWord:', correctWord, 'isCorrect:', userAnswer === correctWord);
    
    inputAnswerSubmitted = true;
    
    // 入力フィールドを無効化
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // 仮想キーボードを視覚的に無効化（回答後は入力できないことを示す）
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    if (virtualKeyboard) {
        virtualKeyboard.classList.add('answer-submitted');
    }
    
    // 1文字ごとに正解・不正解を表示（入力されていない部分も赤く表示、大文字小文字を区別）
    inputs.forEach((input, index) => {
        const userChar = savedValues[index];
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
        
        // 値を明示的に再設定（ブラウザによる変更を上書き）
        input.value = userChar;
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
    
    // 答え表示時に音声を自動再生（効果音の後に遅延して再生）
    const wordToSpeak = word.word;
    console.log('[Audio] submitAnswer - scheduling speech for:', wordToSpeak);
    setTimeout(function() {
        console.log('[Audio] submitAnswer - calling speakWord for:', wordToSpeak);
        speakWord(wordToSpeak);
    }, 600);
    
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
    
    // 仮想キーボードを視覚的に無効化（回答後は入力できないことを示す）
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    if (virtualKeyboard) {
        virtualKeyboard.classList.add('answer-submitted');
    }
    
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
    
    // 答え表示時に音声を自動再生（効果音の後に遅延して再生）
    const wordToSpeak = word.word;
    console.log('[Audio] markAnswerAsDontKnow - scheduling speech for:', wordToSpeak);
    setTimeout(function() {
        console.log('[Audio] markAnswerAsDontKnow - calling speakWord for:', wordToSpeak);
        speakWord(wordToSpeak);
    }, 600);
    
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
    // 学習画面は非表示にせず、完了画面のオーバーレイだけを表示
    // （完了画面が閉じられた時にホーム画面に戻る）
    showCompletion();
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
        
        // 手書きモードの場合はリセット
        if (isHandwritingMode) {
            resetHandwritingMode();
        }
        
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
                markAnswer(false); // 左スワイプ = 覚えていない
            } else {
                markAnswer(true); // 右スワイプ = 覚えた
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
    // カードを元に戻す時も効果音を再生
    SoundEffects.playFlip();
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
    // カードめくり音を再生
    SoundEffects.playFlip();
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
    
    // チェックボックスの状態を更新
    if (elements.wordCheckbox) {
        if (reviewWords.has(word.id)) {
            elements.wordCheckbox.classList.add('checked');
        } else {
            elements.wordCheckbox.classList.remove('checked');
        }
    }
    const wordCheckboxBack = document.getElementById('wordCheckboxBack');
    if (wordCheckboxBack) {
        if (reviewWords.has(word.id)) {
            wordCheckboxBack.classList.add('checked');
        } else {
            wordCheckboxBack.classList.remove('checked');
        }
    }
    const inputWordCheckbox = document.getElementById('inputWordCheckbox');
    if (inputWordCheckbox) {
        if (reviewWords.has(word.id)) {
            inputWordCheckbox.classList.add('checked');
        } else {
            inputWordCheckbox.classList.remove('checked');
        }
    }
    
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

    // カテゴリごとの進捗を取得（両モードの進捗を合算）
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory) {
        // 小学生で習った単語の場合は、その単語のカテゴリーから進捗を読み込む
        const categoryKey = (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') ? word.category : selectedCategory;
        const categoryData = loadCategoryWordsForProgress(categoryKey);
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
/**
 * 例文中の特定の単語を太字にする
 */
function highlightTargetWord(sentence, targetWord) {
    if (!sentence || !targetWord) return sentence;
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    // マッチした文字列をそのまま保持しつつ <strong> で囲む
    let highlighted = sentence.replace(regex, (match) => `<strong>${match}</strong>`);
    
    // 例文が文（. ! ? で終わる）かつ先頭が小文字なら大文字化（タグはスキップ）
    if (/[.!?]\s*$/.test(sentence)) {
        highlighted = highlighted.replace(/^(\s*(?:<[^>]+>\s*)*)([a-z])/, (_m, prefix, first) => `${prefix}${first.toUpperCase()}`);
    }
    return highlighted;
}

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

// 復習モードのタイトルとクラスをリセット
function resetReviewWrongWordsTitle() {
    const inputListTitle = document.querySelector('.input-list-title');
    if (inputListTitle) {
        inputListTitle.textContent = '単語一覧';
    }
    
    const inputListHeader = document.querySelector('.input-list-header');
    if (inputListHeader) {
        inputListHeader.classList.remove('review-wrong-words');
    }
}

// ページネーション用の状態管理
let paginatedWordsData = [];
let paginatedCurrentPage = 0;
const WORDS_PER_PAGE = 100;
let paginatedProgressCache = {};
let paginatedCategoryCorrectSet = new Set();
let paginatedCategoryWrongSet = new Set();
let paginatedSkipProgress = false; // 進捗マーカーをスキップするかどうか

// インプットモード（眺める用）の一覧をページネーションで描画（大量データ用）
function renderInputListViewPaginated(words) {
    const listView = document.getElementById('inputListView');
    const container = document.getElementById('inputListContainer');
    
    if (!listView || !container) return;
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    container.scrollTop = 0;
    listView.scrollTop = 0;
    if (elements.mainContent) {
        elements.mainContent.scrollTop = 0;
    }
    
    // フリップモードでヘッダーがコンテナ内にある場合は先に元の位置に戻す
    const inputListHeader = document.querySelector('.input-list-header');
    if (inputListHeader && container.contains(inputListHeader)) {
        listView.insertBefore(inputListHeader, container);
    }
    
    container.innerHTML = '';
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
    }
    
    if (!Array.isArray(words) || words.length === 0) {
        // 単語がない場合もツールバーは表示したまま、メッセージを表示
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b;';
        emptyMessage.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">該当する単語がありません</div>
            <div style="font-size: 13px; opacity: 0.8;">絞り込み条件を変更してください</div>
        `;
        container.appendChild(emptyMessage);
        return;
    }
    
    // シャッフルモードの場合は単語をシャッフル
    if (isInputShuffled) {
        words = [...words].sort(() => Math.random() - 0.5);
    }
    
    // ページネーション用のデータを初期化
    paginatedWordsData = words;
    paginatedCurrentPage = 0;
    paginatedProgressCache = {};
    paginatedSkipProgress = false;
    
    // 進捗マーカー用のセットを取得
    if (selectedCategory === '大阪府のすべての英単語') {
        // 「すべての単語」の場合は、すべてのカテゴリーの進捗を読み込んでIDベースでマージ
        const allCorrectIds = new Set();
        const allWrongIds = new Set();
        const modes = ['card', 'input'];
        
        // localStorageのすべてのキーをチェックして進捗を収集
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('correctWords-') || key.startsWith('wrongWords-'))) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Array.isArray(data)) {
                        data.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (key.startsWith('correctWords-')) {
                                allCorrectIds.add(numId);
                            } else {
                                allWrongIds.add(numId);
                            }
                        });
                    }
                } catch (e) {}
            }
        }
        
        // グローバルな進捗キャッシュとして保存（特別なキー）
        paginatedProgressCache['__all__'] = {
            correct: allCorrectIds,
            wrong: allWrongIds
        };
    } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 小学生で習った単語の場合は各単語のカテゴリーから読み込む
        const modes = ['card', 'input'];
        words.forEach(word => {
            const cat = word.category;
            if (!paginatedProgressCache[cat]) {
                const correctSet = new Set();
                const wrongSet = new Set();
                
                modes.forEach(mode => {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    
                    if (savedCorrect) {
                        try {
                            JSON.parse(savedCorrect).forEach(id => {
                                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                                correctSet.add(numId);
                            });
                        } catch (e) {}
                    }
                    
                    if (savedWrong) {
                        try {
                            JSON.parse(savedWrong).forEach(id => {
                                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                                wrongSet.add(numId);
                            });
                        } catch (e) {}
                    }
                });
                
                paginatedProgressCache[cat] = {
                    correct: correctSet,
                    wrong: wrongSet
                };
            }
        });
    }
    
    paginatedCategoryCorrectSet = correctWords;
    paginatedCategoryWrongSet = wrongWords;
    if (selectedCategory && selectedCategory !== '小学生で習った単語とカテゴリー別に覚える単語' && selectedCategory !== '大阪府のすべての英単語') {
        const sets = loadCategoryWords(selectedCategory);
        paginatedCategoryCorrectSet = sets.correctSet;
        paginatedCategoryWrongSet = sets.wrongSet;
    }
    
    // 最初のページを描画
    loadMoreWords();
}

// 次のページを読み込む
function loadMoreWords() {
    const container = document.getElementById('inputListContainer');
    if (!container) return;
    
    const startIdx = paginatedCurrentPage * WORDS_PER_PAGE;
    const endIdx = Math.min(startIdx + WORDS_PER_PAGE, paginatedWordsData.length);
    
    if (startIdx >= paginatedWordsData.length) return;
    
    // 既存の「もっと見る」ボタンを削除
    const existingLoadMore = container.querySelector('.load-more-btn');
    if (existingLoadMore) {
        existingLoadMore.remove();
    }
    
    // 単語を描画
    const fragment = document.createDocumentFragment();
    for (let i = startIdx; i < endIdx; i++) {
        const word = paginatedWordsData[i];
        const item = createInputListItem(word, paginatedProgressCache, paginatedCategoryCorrectSet, paginatedCategoryWrongSet, paginatedSkipProgress);
        if (item) {
            fragment.appendChild(item);
        }
    }
    container.appendChild(fragment);
    
    paginatedCurrentPage++;
    
    // まだ単語がある場合は「もっと見る」ボタンを追加
    if (endIdx < paginatedWordsData.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
            <span>次の${Math.min(WORDS_PER_PAGE, paginatedWordsData.length - endIdx)}語を読み込む</span>
            <span class="load-more-count">(${endIdx}/${paginatedWordsData.length}語表示中)</span>
        `;
        loadMoreBtn.addEventListener('click', () => {
            loadMoreWords();
        });
        container.appendChild(loadMoreBtn);
    } else {
        // 全部読み込み完了
        const completeMsg = document.createElement('div');
        completeMsg.className = 'load-complete-msg';
        completeMsg.textContent = `全${paginatedWordsData.length}語を表示しました`;
        container.appendChild(completeMsg);
    }
}

// インプットモード（眺める用）の一覧を非同期で描画（大量データ用）
function renderInputListViewAsync(words) {
    const listView = document.getElementById('inputListView');
    const container = document.getElementById('inputListContainer');
    
    if (!listView || !container) return;
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    container.scrollTop = 0;
    listView.scrollTop = 0;
    if (elements.mainContent) {
        elements.mainContent.scrollTop = 0;
    }
    
    // フリップモードでヘッダーがコンテナ内にある場合は先に元の位置に戻す
    const inputListHeader = document.querySelector('.input-list-header');
    if (inputListHeader && container.contains(inputListHeader)) {
        listView.insertBefore(inputListHeader, container);
    }
    
    container.innerHTML = '';
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
    }
    
    if (!Array.isArray(words) || words.length === 0) {
        // 単語がない場合もツールバーは表示したまま、メッセージを表示
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b;';
        emptyMessage.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">該当する単語がありません</div>
            <div style="font-size: 13px; opacity: 0.8;">絞り込み条件を変更してください</div>
        `;
        container.appendChild(emptyMessage);
        return;
    }
    
    // 進捗マーカー用のセットを取得（両モードの進捗を合算）
    let progressCache = {};
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 各カテゴリーの進捗をキャッシュ（両モードの進捗を合算）
        const modes = ['card', 'input'];
        words.forEach(word => {
            const cat = word.category;
            if (!progressCache[cat]) {
                progressCache[cat] = { correct: new Set(), wrong: new Set() };
                modes.forEach(mode => {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    if (savedCorrect) {
                        JSON.parse(savedCorrect).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!progressCache[cat].wrong.has(numId)) {
                                progressCache[cat].correct.add(numId);
                            }
                        });
                    }
                    if (savedWrong) {
                        JSON.parse(savedWrong).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            progressCache[cat].wrong.add(numId);
                            progressCache[cat].correct.delete(numId);
                        });
                    }
                });
            }
        });
    }
    
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory && selectedCategory !== '小学生で習った単語とカテゴリー別に覚える単語') {
        // 両モードの進捗を合算して読み込む
        const sets = loadCategoryWordsForProgress(selectedCategory);
        categoryCorrectSet = sets.correctSet;
        categoryWrongSet = sets.wrongSet;
    }
    
    // バッチサイズ（一度に処理する単語数）
    const BATCH_SIZE = 100;
    let currentIndex = 0;
    
    // バッチ処理関数
    function processBatch() {
        const endIndex = Math.min(currentIndex + BATCH_SIZE, words.length);
        const fragment = document.createDocumentFragment();
        
        for (let i = currentIndex; i < endIndex; i++) {
            const word = words[i];
            const item = createInputListItem(word, progressCache, categoryCorrectSet, categoryWrongSet);
            if (item) {
                fragment.appendChild(item);
            }
        }
        
        container.appendChild(fragment);
        currentIndex = endIndex;
        
        // 進捗表示を更新
        if (currentIndex < words.length) {
            const progress = Math.round((currentIndex / words.length) * 100);
            // 次のバッチを処理
            requestAnimationFrame(() => {
                setTimeout(processBatch, 0);
            });
        }
    }
    
    // 最初のバッチを開始
    processBatch();
}

// 単一のリストアイテムを作成（renderInputListViewAsync用）
function createInputListItem(word, progressCache, categoryCorrectSet, categoryWrongSet, skipProgress = false) {
        // 展開モードの場合
        if (inputListViewMode === 'expand') {
            const item = document.createElement('div');
            item.className = 'input-list-item-expand';
            item.setAttribute('data-word', word.word);
            
        let isCorrect = false, isWrong = false;
        
        // 進捗マーカーをスキップしない場合のみ計算
        if (!skipProgress) {
            // 「すべての単語」の場合はグローバルな進捗キャッシュを使用
            if (selectedCategory === '大阪府のすべての英単語') {
                const cache = progressCache['__all__'];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
            // 小学生で習った単語の場合は各単語のカテゴリーから進捗を取得
                const cache = progressCache[word.category];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else {
                isCorrect = categoryCorrectSet.has(word.id);
                isWrong = categoryWrongSet.has(word.id);
            }
            
            if (isWrong) {
                item.classList.add('marker-wrong');
            } else if (isCorrect) {
                item.classList.add('marker-correct');
            }
        }
        
        // ヘッダー部分（番号、英単語、音声、ブックマーク）
        const header = document.createElement('div');
        header.className = 'input-list-expand-header';
        
        const number = document.createElement('span');
        number.className = 'input-list-expand-number';
        number.textContent = String(word.id).padStart(5, '0');
        if (!skipProgress) {
            if (isWrong) {
                number.classList.add('marker-wrong');
            } else if (isCorrect) {
                number.classList.add('marker-correct');
            }
        }
        
        // 「すべての単語」の場合は単語番号クリックで進捗変更可能
        if (selectedCategory === '大阪府のすべての英単語') {
            number.classList.add('clickable-number');
            number.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleWordProgress(word, number, item);
            });
        }
        item.appendChild(number);
        
        // チェックボックス（単語番号の右）
        const checkbox = document.createElement('div');
        checkbox.className = 'input-list-expand-checkbox';
        if (reviewWords.has(word.id)) {
            checkbox.classList.add('checked');
        }
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (reviewWords.has(word.id)) {
                reviewWords.delete(word.id);
                checkbox.classList.remove('checked');
            } else {
                reviewWords.add(word.id);
                checkbox.classList.add('checked');
            }
            saveReviewWords();
        });
        item.appendChild(checkbox);
        
        const wordRow = document.createElement('div');
        wordRow.className = 'input-list-expand-word-row';
        
        const wordEl = document.createElement('span');
        wordEl.className = 'input-list-expand-word';
        wordEl.textContent = word.word;
        wordRow.appendChild(wordEl);
        
        const audioBtn = document.createElement('button');
        audioBtn.className = 'audio-btn';
        audioBtn.setAttribute('type', 'button');
        audioBtn.setAttribute('aria-label', `${word.word}の音声を再生`);
        audioBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speakWord(word.word, audioBtn);
        });
        wordRow.appendChild(audioBtn);
        
        header.appendChild(wordRow);
        item.appendChild(header);
        
        // 右上のアクションエリア（でた度）
        const topActions = document.createElement('div');
        topActions.className = 'input-list-expand-top-actions';
        
        // でた度表示
        if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
            const appearanceBox = document.createElement('div');
            appearanceBox.className = 'input-list-expand-appearance-box';
            
            const osakaImg = document.createElement('img');
            osakaImg.src = 'osaka.png';
            osakaImg.alt = '大阪府';
            osakaImg.className = 'appearance-osaka-icon';
            appearanceBox.appendChild(osakaImg);
            
            const label = document.createElement('span');
            label.className = 'appearance-label';
            label.textContent = 'でた度';
            appearanceBox.appendChild(label);
            
            const stars = getAppearanceStars(word.appearanceCount);
            const starsSpan = document.createElement('span');
            starsSpan.className = 'appearance-stars';
            starsSpan.textContent = stars;
            appearanceBox.appendChild(starsSpan);
            
            topActions.appendChild(appearanceBox);
        }
        
        item.appendChild(topActions);
        
        // 意味（品詞付き）
        const meaningEl = document.createElement('div');
        meaningEl.className = 'input-list-expand-meaning';
        
        const meaningPos = document.createElement('span');
        meaningPos.className = 'pos-inline part-of-speech input-list-expand-meaning-pos';
        meaningPos.textContent = getPartOfSpeechShort(word.partOfSpeech || '') || '—';
        meaningEl.appendChild(meaningPos);
        
        const meaningText = document.createElement('span');
        meaningText.textContent = word.meaning || '';
        meaningEl.appendChild(meaningText);
        
        item.appendChild(meaningEl);
        
        // 用例
        if (word.example && (word.example.english || word.example.japanese)) {
            const exampleBox = document.createElement('div');
            exampleBox.className = 'input-list-expand-example';
            
            if (word.example.english) {
                const exEn = document.createElement('div');
                exEn.className = 'input-list-expand-example-en';
                const exampleEn = word.example.english;
                if (exampleEn && word.word) {
                    exEn.innerHTML = highlightTargetWord(exampleEn, word.word);
                } else {
                    exEn.textContent = exampleEn;
                }
                exampleBox.appendChild(exEn);
            }
            
            if (word.example.japanese) {
                const exJa = document.createElement('div');
                exJa.className = 'input-list-expand-example-ja';
                exJa.innerHTML = word.example.japanese;
                exampleBox.appendChild(exJa);
            }
            
            item.appendChild(exampleBox);
        }
        
        return item;
    } else {
        // フリップモード（従来のカード表示）
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
        number.textContent = String(word.id).padStart(5, '0');
        
        let isCorrect = false, isWrong = false;
        
        // 進捗マーカーをスキップしない場合のみ計算
        if (!skipProgress) {
            // 「すべての単語」の場合はグローバルな進捗キャッシュを使用
            if (selectedCategory === '大阪府のすべての英単語') {
                const cache = progressCache['__all__'];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                // 小学生で習った単語の場合は各単語のカテゴリーから進捗を取得
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
        }
        
        // 「すべての単語」の場合は単語番号クリックで進捗変更可能
        if (selectedCategory === '大阪府のすべての英単語') {
            number.classList.add('clickable-number');
            number.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleWordProgress(word, number, item);
            });
        }
        meta.appendChild(number);
        
        // チェックボックス（単語番号の右）
        const checkbox = document.createElement('div');
        checkbox.className = 'input-list-checkbox';
        if (reviewWords.has(word.id)) {
            checkbox.classList.add('checked');
        }
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (reviewWords.has(word.id)) {
                reviewWords.delete(word.id);
                checkbox.classList.remove('checked');
            } else {
                reviewWords.add(word.id);
                checkbox.classList.add('checked');
            }
            saveReviewWords();
        });
        meta.appendChild(checkbox);
        
        const row = document.createElement('div');
        row.className = 'input-list-row';
        
        const wordContainer = document.createElement('div');
        wordContainer.className = 'input-list-word-container';
        
        // カタカナ発音を上に表示（*で囲まれた部分を太字に）
        if (word.kana) {
            const kanaEl = document.createElement('span');
            kanaEl.className = 'input-list-kana';
            kanaEl.innerHTML = word.kana.replace(/\*([^*]+)\*/g, '<b>$1</b>');
            wordContainer.appendChild(kanaEl);
        }
        
        const wordEl = document.createElement('span');
        wordEl.className = 'input-list-word';
        wordEl.textContent = word.word;
        wordContainer.appendChild(wordEl);
        
        row.appendChild(wordContainer);
        
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
        
        inner.appendChild(front);
        inner.appendChild(back);
        item.appendChild(inner);
        
        // クリックでフリップ
        item.addEventListener('click', () => {
            item.classList.toggle('flipped');
        });
        
        return item;
    }
}

// インプットモード（眺める用）の一覧を描画
function renderInputListView(words) {
    const listView = document.getElementById('inputListView');
    const container = document.getElementById('inputListContainer');
    
    if (!listView || !container) return;
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    container.scrollTop = 0;
    listView.scrollTop = 0;
    if (elements.mainContent) {
        elements.mainContent.scrollTop = 0;
    }
    
    // フリップモードでヘッダーがコンテナ内にある場合は先に元の位置に戻す
    const inputListHeader = document.querySelector('.input-list-header');
    if (inputListHeader && container.contains(inputListHeader)) {
        listView.insertBefore(inputListHeader, container);
    }
    
    container.innerHTML = '';
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
    }
    
    if (!Array.isArray(words) || words.length === 0) {
        // 単語がない場合もツールバーは表示したまま、メッセージを表示
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b;';
        emptyMessage.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">該当する単語がありません</div>
            <div style="font-size: 13px; opacity: 0.8;">絞り込み条件を変更してください</div>
        `;
        container.appendChild(emptyMessage);
        return;
    }
    
    // シャッフルモードの場合は単語をシャッフル
    if (isInputShuffled) {
        words = [...words].sort(() => Math.random() - 0.5);
    }
    
    // 進捗マーカー用のセットを取得
    let progressCache = {};
    let allCorrectIds = new Set();
    let allWrongIds = new Set();
    
    if (selectedCategory === '大阪府のすべての英単語') {
        // 「すべての単語」の場合は全カテゴリーの進捗を読み込む
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('correctWords-') || key.startsWith('wrongWords-'))) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Array.isArray(data)) {
                        data.forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (key.startsWith('correctWords-')) {
                                allCorrectIds.add(numId);
                            } else {
                                allWrongIds.add(numId);
                            }
                        });
                    }
                } catch (e) {}
            }
        }
    } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
        // 各カテゴリーの進捗をキャッシュ（両モードの進捗を合算）
        const modes = ['card', 'input'];
        words.forEach(word => {
            const cat = word.category;
            if (!progressCache[cat]) {
                progressCache[cat] = { correct: new Set(), wrong: new Set() };
                modes.forEach(mode => {
                    const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                    const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                    if (savedCorrect) {
                        JSON.parse(savedCorrect).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            if (!progressCache[cat].wrong.has(numId)) {
                                progressCache[cat].correct.add(numId);
                            }
                        });
                    }
                    if (savedWrong) {
                        JSON.parse(savedWrong).forEach(id => {
                            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                            progressCache[cat].wrong.add(numId);
                            progressCache[cat].correct.delete(numId);
                        });
                    }
                });
            }
        });
    }
    
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory && selectedCategory !== '小学生で習った単語とカテゴリー別に覚える単語' && selectedCategory !== '大阪府のすべての英単語') {
        // 両モードの進捗を合算して読み込む
        const sets = loadCategoryWordsForProgress(selectedCategory);
        categoryCorrectSet = sets.correctSet;
        categoryWrongSet = sets.wrongSet;
    }
    
    words.forEach((word) => {
        // 展開モードの場合
        if (inputListViewMode === 'expand') {
            const item = document.createElement('div');
            item.className = 'input-list-item-expand';
            item.setAttribute('data-word', word.word);
            
            // 進捗を取得
            let isCorrect, isWrong;
            if (selectedCategory === '大阪府のすべての英単語') {
                // 「すべての単語」の場合
                isCorrect = allCorrectIds.has(word.id);
                isWrong = allWrongIds.has(word.id);
            } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                const cache = progressCache[word.category];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else {
                isCorrect = categoryCorrectSet.has(word.id);
                isWrong = categoryWrongSet.has(word.id);
            }
            
            if (isWrong) {
                item.classList.add('marker-wrong');
            } else if (isCorrect) {
                item.classList.add('marker-correct');
            }
            
            // ヘッダー部分（番号、英単語、音声）
            const header = document.createElement('div');
            header.className = 'input-list-expand-header';
            
            const number = document.createElement('span');
            number.className = 'input-list-expand-number';
            number.textContent = String(word.id).padStart(5, '0');
            if (isWrong) {
                number.classList.add('marker-wrong');
            } else if (isCorrect) {
                number.classList.add('marker-correct');
            }
            item.appendChild(number);
            
            // チェックボックス（単語番号の右）
            const checkbox = document.createElement('div');
            checkbox.className = 'input-list-expand-checkbox';
            if (reviewWords.has(word.id)) {
                checkbox.classList.add('checked');
            }
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                if (reviewWords.has(word.id)) {
                    reviewWords.delete(word.id);
                    checkbox.classList.remove('checked');
                } else {
                    reviewWords.add(word.id);
                    checkbox.classList.add('checked');
                }
                saveReviewWords();
            });
            item.appendChild(checkbox);
            
            const wordRow = document.createElement('div');
            wordRow.className = 'input-list-expand-word-row';
            
            const wordTextContainer = document.createElement('div');
            wordTextContainer.className = 'input-list-expand-word-container';
            
            // カタカナ発音を上に表示（*で囲まれた部分を太字に）
            if (word.kana) {
                const kanaEl = document.createElement('span');
                kanaEl.className = 'input-list-expand-kana';
                kanaEl.innerHTML = word.kana.replace(/\*([^*]+)\*/g, '<b>$1</b>');
                wordTextContainer.appendChild(kanaEl);
            }
            
            const wordEl = document.createElement('span');
            wordEl.className = 'input-list-expand-word';
            wordEl.textContent = word.word;
            wordTextContainer.appendChild(wordEl);
            
            wordRow.appendChild(wordTextContainer);
            
            const audioBtn = document.createElement('button');
            audioBtn.className = 'audio-btn';
            audioBtn.setAttribute('type', 'button');
            audioBtn.setAttribute('aria-label', `${word.word}の音声を再生`);
            audioBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
            audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                speakWord(word.word, audioBtn);
            });
            wordRow.appendChild(audioBtn);
            
            header.appendChild(wordRow);
            item.appendChild(header);
            
            // 右上のアクションエリア（でた度）
            const topActions = document.createElement('div');
            topActions.className = 'input-list-expand-top-actions';
            
            // でた度表示
            if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
                const appearanceBox = document.createElement('div');
                appearanceBox.className = 'input-list-expand-appearance-box';
                
                const osakaImg = document.createElement('img');
                osakaImg.src = 'osaka.png';
                osakaImg.alt = '大阪府';
                osakaImg.className = 'appearance-osaka-icon';
                appearanceBox.appendChild(osakaImg);
                
                const label = document.createElement('span');
                label.className = 'appearance-label';
                label.textContent = 'でた度';
                appearanceBox.appendChild(label);
                
                const stars = getAppearanceStars(word.appearanceCount);
                const starsSpan = document.createElement('span');
                starsSpan.className = 'appearance-stars';
                starsSpan.textContent = stars;
                appearanceBox.appendChild(starsSpan);
                
                topActions.appendChild(appearanceBox);
            }
            
            item.appendChild(topActions);
            
            // 意味（品詞付き）
            const meaningEl = document.createElement('div');
            meaningEl.className = 'input-list-expand-meaning';
            
            const meaningPos = document.createElement('span');
            meaningPos.className = 'pos-inline part-of-speech input-list-expand-meaning-pos';
            meaningPos.textContent = getPartOfSpeechShort(word.partOfSpeech || '') || '—';
            meaningEl.appendChild(meaningPos);
            
            const meaningText = document.createElement('span');
            meaningText.textContent = word.meaning || '';
            meaningEl.appendChild(meaningText);
            
            item.appendChild(meaningEl);
            
            // 用例
            if (word.example && (word.example.english || word.example.japanese)) {
                const exampleBox = document.createElement('div');
                exampleBox.className = 'input-list-expand-example';
                
                if (word.example.english) {
                    const exEn = document.createElement('div');
                    exEn.className = 'input-list-expand-example-en';
                    const exampleEn = word.example.english;
                    if (exampleEn && word.word) {
                        exEn.innerHTML = highlightTargetWord(exampleEn, word.word);
                    } else {
                        exEn.textContent = exampleEn;
                    }
                    exampleBox.appendChild(exEn);
                }
                
                if (word.example.japanese) {
                    const exJa = document.createElement('div');
                    exJa.className = 'input-list-expand-example-ja';
                    exJa.innerHTML = word.example.japanese;
                    exampleBox.appendChild(exJa);
                }
                
                item.appendChild(exampleBox);
            }
            
            container.appendChild(item);
        } else {
            // フリップモード（従来のカード表示）
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
            number.textContent = String(word.id).padStart(5, '0');
            
            // 進捗を取得
            let isCorrectFlip, isWrongFlip;
            if (selectedCategory === '大阪府のすべての英単語') {
                // 「すべての単語」の場合
                isCorrectFlip = allCorrectIds.has(word.id);
                isWrongFlip = allWrongIds.has(word.id);
            } else if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') {
                const cache = progressCache[word.category];
                isCorrectFlip = cache && cache.correct.has(word.id);
                isWrongFlip = cache && cache.wrong.has(word.id);
            } else {
                isCorrectFlip = categoryCorrectSet.has(word.id);
                isWrongFlip = categoryWrongSet.has(word.id);
            }
            
            if (isWrongFlip) {
                number.classList.add('marker-wrong');
                item.classList.add('marker-wrong');
            } else if (isCorrectFlip) {
                number.classList.add('marker-correct');
                item.classList.add('marker-correct');
            }
            
            // 「すべての単語」の場合は単語番号クリックで進捗変更可能
            if (selectedCategory === '大阪府のすべての英単語') {
                number.classList.add('clickable-number');
                number.addEventListener('click', (e) => {
                    e.stopPropagation();
                    cycleWordProgress(word, number, item);
                });
            }
            meta.appendChild(number);
            
            // チェックボックス（単語番号の右）
            const checkbox = document.createElement('div');
            checkbox.className = 'input-list-checkbox';
            if (reviewWords.has(word.id)) {
                checkbox.classList.add('checked');
            }
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                if (reviewWords.has(word.id)) {
                    reviewWords.delete(word.id);
                    checkbox.classList.remove('checked');
                } else {
                    reviewWords.add(word.id);
                    checkbox.classList.add('checked');
                }
                saveReviewWords();
            });
            meta.appendChild(checkbox);
            
            const row = document.createElement('div');
            row.className = 'input-list-row';
            
            const wordContainer = document.createElement('div');
            wordContainer.className = 'input-list-word-container';
            
            // カタカナ発音を上に表示（*で囲まれた部分を太字に）
            if (word.kana) {
                const kanaEl = document.createElement('span');
                kanaEl.className = 'input-list-kana';
                kanaEl.innerHTML = word.kana.replace(/\*([^*]+)\*/g, '<b>$1</b>');
                wordContainer.appendChild(kanaEl);
            }
            
            const wordEl = document.createElement('span');
            wordEl.className = 'input-list-word';
            wordEl.textContent = word.word;
            wordContainer.appendChild(wordEl);
            
            row.appendChild(wordContainer);
            
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
            
            inner.appendChild(front);
            inner.appendChild(back);
            
            // 右上のアクションエリア（でた度）
            const topActions = document.createElement('div');
            topActions.className = 'input-list-top-actions';
            
            // でた度表示
            if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
                const appearanceBox = document.createElement('div');
                appearanceBox.className = 'input-list-appearance-box';
                
                const osakaImg = document.createElement('img');
                osakaImg.src = 'osaka.png';
                osakaImg.alt = '大阪府';
                osakaImg.className = 'appearance-osaka-icon';
                appearanceBox.appendChild(osakaImg);
                
                const label = document.createElement('span');
                label.className = 'appearance-label';
                label.textContent = 'でた度';
                appearanceBox.appendChild(label);
                
                const stars = getAppearanceStars(word.appearanceCount);
                const starsSpan = document.createElement('span');
                starsSpan.className = 'appearance-stars';
                starsSpan.textContent = stars;
                appearanceBox.appendChild(starsSpan);
                
                topActions.appendChild(appearanceBox);
            }
            
            inner.appendChild(topActions);
            
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
        }
    });
    
    // 描画完了後にスクロール位置を一番上にリセット
    setTimeout(() => {
        window.scrollTo(0, 0);
        listView.scrollTop = 0;
        container.scrollTop = 0;
        if (elements.mainContent) {
            elements.mainContent.scrollTop = 0;
        }
    }, 0);
}

// 単語一覧のモード切り替えイベントを設定
function setupInputListModeToggle() {
    const flipBtn = document.getElementById('inputListModeFlip');
    const expandBtn = document.getElementById('inputListModeExpand');
    const flipAllBtn = document.getElementById('inputFlipAllBtn');
    
    if (!flipBtn || !expandBtn) return;
    
    flipBtn.addEventListener('click', () => {
        if (inputListViewMode === 'flip') return;
        inputListViewMode = 'flip';
        flipBtn.classList.add('active');
        expandBtn.classList.remove('active');
        updateRedSheetToggleVisibility();
        // すべてめくるボタンを表示・ラベルをリセット
        if (flipAllBtn) {
            flipAllBtn.classList.remove('hidden');
            const btnLabel = flipAllBtn.querySelector('.btn-label');
            if (btnLabel) btnLabel.textContent = '英語→日本語';
        }
        
