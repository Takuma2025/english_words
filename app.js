// アプリケーションの状態管理
let currentWords = [];
let currentIndex = 0;
let hasReachedGoalBefore = false; // 目標達成済みフラグ（演出重複防止）
let pendingGoalCelebration = false; // 学習完了後に目標達成画面を表示するフラグ
let selectedStudyMode = 'input'; // 'input' or 'output' - インプット/アウトプットモード選択
let currentInputFilter = 'all'; // インプットモードのフィルター状態: 'all', 'wrong', 'unlearned', 'bookmark', 'correct'
let isInputShuffled = false; // インプットモードのシャッフル状態

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
    // 小学生で習った単語のサブカテゴリ（指定順）
    const elementarySubCategories = [
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
        '方角・方向',
        '冠詞',
        '代名詞',
        '疑問詞',
        '限定詞（数量）',
        '前置詞',
        '助動詞・助動詞的表現',
        '接続詞',
        '関係代名詞',
        '間投詞'
    ];
    
    const categories = [
        'LEVEL1 超重要単語400',
        'LEVEL2 重要単語300',
        'LEVEL3 差がつく単語200',
        'LEVEL4 私立高校入試レベル',
        'LEVEL5 難関私立高校入試レベル'
    ];
    
    let totalLearned = 0;
    const modes = ['output', 'card']; // 両方のモードを読み込む
    
    // 小学生で習った単語のサブカテゴリを読み込む
    const elementaryLearnedSet = new Set();
    elementarySubCategories.forEach(subCat => {
        modes.forEach(mode => {
            const savedCorrect = localStorage.getItem(`correctWords-${subCat}_${mode}`);
            if (savedCorrect) {
                try {
                    const parsed = JSON.parse(savedCorrect);
                    parsed.forEach(id => elementaryLearnedSet.add(id));
                } catch (e) {
                    console.error('Error parsing correctWords:', e);
                }
            }
        });
    });
    totalLearned += elementaryLearnedSet.size;
    
    // その他のカテゴリを読み込む
    categories.forEach(cat => {
        const learnedSet = new Set();
        modes.forEach(mode => {
            const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
            if (savedCorrect) {
                try {
                    const parsed = JSON.parse(savedCorrect);
                    parsed.forEach(id => learnedSet.add(id));
                } catch (e) {
                    console.error('Error parsing correctWords:', e);
                }
            }
        });
        totalLearned += learnedSet.size;
    });
    
    return totalLearned;
}

// 全単語数を計算
function calculateTotalWords() {
    // vocabulary-data.jsの単語数を合計
    let total = 0;
    
    if (typeof elementaryWords !== 'undefined') {
        total += elementaryWords.length;
    }
    if (typeof categoryWords !== 'undefined') {
        Object.values(categoryWords).forEach(arr => {
            total += arr.length;
        });
    }
    if (typeof level1Words !== 'undefined') {
        total += level1Words.length;
    }
    if (typeof level2Words !== 'undefined') {
        total += level2Words.length;
    }
    if (typeof level3Words !== 'undefined') {
        total += level3Words.length;
    }
    if (typeof level4Words !== 'undefined') {
        total += level4Words.length;
    }
    if (typeof level5Words !== 'undefined') {
        total += level5Words.length;
    }
    
    return total || 1800; // デフォルト値
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
    const schoolProgressPercentEl = document.getElementById('schoolProgressPercent');
    const schoolProgressFractionEl = document.getElementById('schoolProgressFraction');
    const schoolProgressBarEl = document.getElementById('schoolProgressBar');
    
    if (requiredWords > 0) {
        const schoolProgress = Math.min(100, Math.round((learnedWords / requiredWords) * 100));
        if (schoolProgressPercentEl) schoolProgressPercentEl.textContent = `${schoolProgress}%`;
        if (schoolProgressFractionEl) schoolProgressFractionEl.textContent = `${learnedWords}/${requiredWords}`;
        if (schoolProgressBarEl) schoolProgressBarEl.style.width = `${schoolProgress}%`;
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

// 単語の進捗保存用カテゴリーを取得（小学生で習った単語、すべての単語の場合はword.categoryを使用）
function getProgressCategory(word) {
    if (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === '大阪府のすべての英単語') {
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
        
        // オーバーレイで学習方法を選択
        showStudyModeOverlay(
            () => {
                showInputModeDirectly('大阪府のすべての英単語', allWords, '大阪府のすべての英単語');
            },
            () => {
                showWordFilterView('大阪府のすべての英単語', allWords, '大阪府のすべての英単語');
            }
        );
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
        { displayName: 'カテゴリ別に覚える基本単語', dataName: '小学生で習った単語とカテゴリー別に覚える単語' },
        { displayName: '超重要700語', dataName: 'LEVEL1 超重要単語400' },
        { displayName: '重要500語', dataName: 'LEVEL2 重要単語300' },
        { displayName: '差がつく300語', dataName: 'LEVEL3 差がつく単語200' },
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
            if (isComplete) {
                barContainer.classList.add('category-progress-complete');
            } else {
                barContainer.classList.remove('category-progress-complete');
            }
        }
        if (text) {
            text.textContent = `${completedCount}/${total}語`;
        }
    });
    
    // 細分化メニューの進捗バーを更新
    updateSubcategoryProgressBars();
    
}

// 細分化メニューの進捗バーを更新
function updateSubcategoryProgressBars() {
    // カテゴリ別に覚える基本単語のサブカテゴリー
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
    
    // カテゴリ別に覚える基本単語の進捗バーを更新
    updateProgressBar('カテゴリ別に覚える基本単語', elementarySubcategories);
    
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
    updateLevelProgressBar('レベル１ 超重要700語', 1, level1Subcategories);
    updateLevelProgressBar('レベル２ 重要500語', 2, level2Subcategories);
    updateLevelProgressBar('レベル３ 差がつく300語', 3, level3Subcategories);
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

    // Web Speech APIが利用可能か確認
    if (!('speechSynthesis' in window)) {
        console.log('[speakWord] speechSynthesis not available');
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
        setupInputListFilter();
        setupRedSheetStickyScroll();
        updateVocabProgressBar();
        initMemoPad();
        
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
    
    // カテゴリ別に覚える基本単語のサブカテゴリ一覧（指定順）
    const elementarySubcategories = [
        '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
        '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
        '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
    ];
    
    // カテゴリ別のサブカテゴリかどうかチェック
    const isElementarySubcategory = elementarySubcategories.some(sub => title.includes(sub));
    
    if (title.includes('LEVEL1') || title.includes('超重要') || title.includes('レベル１') || title.includes('レベル1')) {
        return '<span class="level-badge level-badge-red">レベル１</span> ' + cleanTitle.replace(/超重要単語400/g, '超重要700語');
    } else if (title.includes('LEVEL2') || title.includes('重要500語') || title.includes('レベル２') || title.includes('レベル2')) {
        return '<span class="level-badge level-badge-orange">レベル２</span> ' + cleanTitle.replace(/重要単語300/g, '重要500語');
    } else if (title.includes('LEVEL3') || title.includes('差がつく') || title.includes('レベル３') || title.includes('レベル3')) {
        return '<span class="level-badge level-badge-blue">レベル３</span> ' + cleanTitle.replace(/差がつく単語200/g, '差がつく300語');
    } else if (title.includes('LEVEL4') || title.includes('私立高校入試レベル') || title.includes('レベル４') || title.includes('レベル4')) {
        return '<span class="level-badge level-badge-purple">レベル４</span> ' + cleanTitle;
    } else if (title.includes('LEVEL5') || title.includes('難関私立高校入試レベル') || title.includes('レベル５') || title.includes('レベル5')) {
        return '<span class="level-badge level-badge-dark">レベル５</span> ' + cleanTitle;
    } else if (title.includes('カテゴリ別') || title.includes('レベル０') || title.includes('レベル0')) {
        // カテゴリ別に覚える基本単語のメインカテゴリ
        if (title.includes('カテゴリ別に覚える基本単語') || title.includes('カテゴリー別に覚える単語') || title.includes('カテゴリー別360語')) {
            return '<span class="level-badge level-badge-green">レベル0</span> カテゴリー別360語';
        } else {
            return cleanTitle;
        }
    } else if (isElementarySubcategory) {
        return '<span class="level-badge level-badge-green">レベル0</span> ' + cleanTitle;
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
            if (title === 'カテゴリ別に覚える基本単語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-green">レベル0</span> カテゴリー別360語';
            } else if (title === 'レベル１ 超重要700語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-red">レベル１</span> 超重要700語';
            } else if (title === 'レベル２ 重要500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-orange">レベル２</span> 重要500語';
            } else if (title === 'レベル３ 差がつく300語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-blue">レベル３</span> 差がつく300語';
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
function showCategorySelection() {
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

// カテゴリ別に覚える基本単語の画面を表示
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
    const formattedTitle = formatTitleWithLevelBadge('カテゴリ別に覚える基本単語');
    courseTitle.innerHTML = formattedTitle;
    courseList.innerHTML = '';
    
    // 画像を非表示
    if (courseSelectionImage) {
        courseSelectionImage.style.display = 'none';
    }
    
    // 説明文を設定
    if (courseSelectionDescription) {
        courseSelectionDescription.textContent = '基礎からカテゴリー別に学習';
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
                        <svg class="file-icon-with-number" width="32" height="32" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <text x="12" y="13" text-anchor="middle" fill="white" font-size="11" font-weight="bold" stroke="white" stroke-width="0.5" style="font-family: Arial, sans-serif; dominant-baseline: central;">${number}</text>
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
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', 'カテゴリ別に覚える基本単語');
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
        
        if (!skipAnimation) {
            courseSelection.classList.add('slide-in-right');
            setTimeout(() => {
                courseSelection.classList.remove('slide-in-right');
            }, 300);
        }
    }
    
    // ナビゲーション状態を更新
    updateNavState('courseSelection');
    
    // 戻るボタン用にparentCategoryを保存
    window.currentSubcategoryParent = 'カテゴリ別に覚える基本単語';
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
    if (parentCategory === 'レベル１ 超重要700語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-red">レベル１</span> 超重要700語';
    } else if (parentCategory === 'レベル２ 重要500語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-orange">レベル２</span> 重要500語';
    } else if (parentCategory === 'レベル３ 差がつく300語') {
        courseTitle.innerHTML = '<span class="level-badge level-badge-blue">レベル３</span> 差がつく300語';
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
        if (parentCategory === 'レベル１ 超重要700語') {
            courseSelectionDescription.textContent = '大阪府公立高入試A問題50点突破・B問題40点突破必須レベルの超重要単語です。';
            courseSelectionDescription.style.display = 'block';
        } else if (parentCategory === 'レベル２ 重要500語') {
            courseSelectionDescription.textContent = '大阪府公立高入試A問題70点突破・B問題60点突破必須レベルの重要単語です。';
            courseSelectionDescription.style.display = 'block';
        } else if (parentCategory === 'レベル３ 差がつく300語') {
            courseSelectionDescription.textContent = '大阪府公立高入試C問題50点突破必須レベルの差がつく単語です。';
            courseSelectionDescription.style.display = 'block';
        } else {
            courseSelectionDescription.style.display = 'none';
        }
    }
    
    // サブカテゴリーの定義
    let subcategories = [];
    let levelCategory = '';
    let badgeColor = '';
    
    if (parentCategory === 'レベル１ 超重要700語') {
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
        badgeColor = '#ef4444'; // 赤
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
        badgeColor = '#f97316'; // オレンジ
    } else if (parentCategory === 'レベル３ 差がつく300語') {
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
        badgeColor = '#3b82f6'; // 青
    }
    
    // サブカテゴリーカードを生成
    subcategories.forEach((subcat, index) => {
        // 単語を取得（レベル別に取得）
        let levelWords = [];
        if (parentCategory === 'レベル１ 超重要700語') {
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
        } else if (parentCategory === 'レベル３ 差がつく300語') {
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
        if (parentCategory === 'レベル１ 超重要700語') {
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
        } else if (parentCategory === 'レベル３ 差がつく300語') {
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
                        <svg class="file-icon-with-number" width="32" height="32" viewBox="0 0 24 24" fill="${badgeColor}" stroke="${badgeColor}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <text x="12" y="13" text-anchor="middle" fill="white" font-size="11" font-weight="bold" stroke="white" stroke-width="0.5" style="font-family: Arial, sans-serif; dominant-baseline: central;">${number}</text>
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
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', parentCategory);
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
        
        if (!skipAnimation) {
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
function showCourseSelection(category, categoryWords) {
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
        
        // コース選択画面を右からスライドイン
        courseSelection.classList.remove('hidden');
        courseSelection.classList.add('slide-in-right');
        
        // アニメーション完了後にクラスをクリーンアップ
        setTimeout(() => {
            courseSelection.classList.remove('slide-in-right');
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
    
    // インプットモードに設定
    currentLearningMode = 'input';
    
    selectedCategory = category;
    currentCourseWords = words;
    currentFilterCourseTitle = courseTitle;
    currentFilterWords = words;
    currentFilterCategory = category;
    
    // コース選択画面を非表示
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    
    // カテゴリー選択画面を非表示
    elements.categorySelection.classList.add('hidden');
    
    // メインコンテンツを表示
    elements.mainContent.classList.remove('hidden');
    
    // テストへボタンを表示（インプットモードなので常に表示）
    const unitTestBtn = document.getElementById('unitTestBtn');
    if (unitTestBtn) {
        unitTestBtn.classList.remove('hidden');
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
    
    // 単語一覧を描画（大量の単語の場合はページネーションで処理）
    if (words.length > 500) {
        renderInputListViewPaginated(words);
    } else {
    renderInputListView(words);
    }
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
                <button type="button" class="learning-menu-category-btn" data-category="超重要700語">
                    <span class="learning-menu-category-title">超重要700語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="重要500語">
                    <span class="learning-menu-category-title">重要500語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="差がつく300語">
                    <span class="learning-menu-category-title">差がつく300語</span>
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
    if (category === '超重要700語') {
        subcategories = [
            'カテゴリ別に覚える基本単語',
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
    } else if (category === '差がつく300語') {
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
    let words = [];
    
    // カテゴリーに応じてレベルを決定
    let levelCategory = '';
    if (category === '超重要700語') {
        levelCategory = 'LEVEL1 超重要単語400';
    } else if (category === '重要500語') {
        levelCategory = 'LEVEL2 重要単語300';
    } else if (category === '差がつく300語') {
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
        if (subcategory === 'カテゴリ別に覚える基本単語') {
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
function showStudyModeOverlay(onInput, onOutput) {
    console.log('showStudyModeOverlay called', { onInput: !!onInput, onOutput: !!onOutput });
    // 既存のオーバーレイがあれば削除
    const existingOverlay = document.getElementById('studyModeOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.id = 'studyModeOverlay';
    overlay.className = 'study-mode-overlay';
    console.log('Overlay element created');
    
    overlay.innerHTML = `
        <div class="study-mode-container" style="width: calc(100% - 16px); max-width: 600px; margin: 0 auto;">
            <div class="study-mode-title">学習方法を選択</div>
            <div class="study-mode-buttons">
                <button type="button" class="study-mode-choice-btn study-mode-input-btn">
                    <span class="study-mode-choice-main">学習</span>
                    <span class="study-mode-choice-sub">単語一覧を見て<br>学習する</span>
                </button>
                <button type="button" class="study-mode-choice-btn study-mode-output-btn">
                    <span class="study-mode-choice-main">テスト</span>
                    <span class="study-mode-choice-sub">覚えたかどうか<br>確認する</span>
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
    
    // 学習ボタン
    const inputBtn = overlay.querySelector('.study-mode-input-btn');
    inputBtn.addEventListener('click', () => {
        overlay.remove();
        if (onInput) onInput();
    });
    
    // テストボタン
    const outputBtn = overlay.querySelector('.study-mode-output-btn');
    outputBtn.addEventListener('click', () => {
        overlay.remove();
        if (onOutput) onOutput();
    });
    
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
    
    // カテゴリ別に覚える基本単語カード
    const elementaryCategoryCardBtn = document.getElementById('elementaryCategoryCardBtn');
    if (elementaryCategoryCardBtn) {
        elementaryCategoryCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showElementaryCategorySelection();
        });
    }
    
    // レベル１ 超重要700語カード
    const level1CardBtn = document.getElementById('level1CardBtn');
    if (level1CardBtn) {
        level1CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLevelSubcategorySelection('レベル１ 超重要700語');
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
    
    // レベル３ 差がつく300語カード
    const level3CardBtn = document.getElementById('level3CardBtn');
    if (level3CardBtn) {
        level3CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLevelSubcategorySelection('レベル３ 差がつく300語');
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
            
            if (elements.mainContent) {
                elements.mainContent.classList.add('hidden');
            }
            
            // カテゴリ別に覚える基本単語のサブカテゴリー
            const elementarySubcategories = [
                '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
                '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
                '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
            ];
            
            // レベル別の細分化メニューから来た場合は、レベル別の細分化メニューに戻る
            console.log('inputBackBtn clicked, currentSubcategoryParent:', window.currentSubcategoryParent);
            if (window.currentSubcategoryParent && (window.currentSubcategoryParent === 'レベル１ 超重要700語' || 
                window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                window.currentSubcategoryParent === 'レベル３ 差がつく300語')) {
                console.log('Returning to level subcategory selection:', window.currentSubcategoryParent);
                showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                return;
            }
            
            // カテゴリ別に覚える基本単語から来た場合は、その画面に戻る
            if (window.currentSubcategoryParent === 'カテゴリ別に覚える基本単語') {
                showElementaryCategorySelection(true);
                return;
            }
            
            // カテゴリー別に覚える単語のサブカテゴリーの場合はカテゴリ別に覚える基本単語の画面に戻る
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
            
            const wordFilterView = document.getElementById('wordFilterView');
            
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
                    if (window.currentSubcategoryParent === 'レベル１ 超重要700語' || 
                        window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                        window.currentSubcategoryParent === 'レベル３ 差がつく300語') {
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    } else if (window.currentSubcategoryParent === 'カテゴリ別に覚える基本単語') {
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
                    if (window.currentSubcategoryParent && (window.currentSubcategoryParent === 'レベル１ 超重要700語' || 
                        window.currentSubcategoryParent === 'レベル２ 重要500語' || 
                        window.currentSubcategoryParent === 'レベル３ 差がつく300語')) {
                        elements.mainContent.classList.add('hidden');
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    }
                    
                    // カテゴリ別に覚える基本単語から来た場合は、細分化メニューに戻る
                    if (window.currentSubcategoryParent && window.currentSubcategoryParent === 'カテゴリ別に覚える基本単語') {
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
                // ボタンを離したときにシフトを解除するためフラグを設定
                window.pendingShiftReset = 'virtualKeyboard';
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
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    
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
    
    if (!Array.isArray(words) || words.length === 0) {
        listView.classList.add('hidden');
        return;
    }
    
    // シャッフルモードの場合は単語をシャッフル
    if (isInputShuffled) {
        words = [...words].sort(() => Math.random() - 0.5);
    }
    
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
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
    
    if (!Array.isArray(words) || words.length === 0) {
        listView.classList.add('hidden');
        return;
    }
    
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
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
                exEn.textContent = word.example.english;
                exampleBox.appendChild(exEn);
            }
            
            if (word.example.japanese) {
                const exJa = document.createElement('div');
                exJa.className = 'input-list-expand-example-ja';
                exJa.textContent = word.example.japanese;
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
    
    if (!Array.isArray(words) || words.length === 0) {
        listView.classList.add('hidden');
        return;
    }
    
    // シャッフルモードの場合は単語をシャッフル
    if (isInputShuffled) {
        words = [...words].sort(() => Math.random() - 0.5);
    }
    
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
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
                    exampleBox.appendChild(exEn);
                }
                
                if (word.example.japanese) {
                    const exJa = document.createElement('div');
                    exJa.className = 'input-list-expand-example-ja';
                    exJa.textContent = word.example.japanese;
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
        // フィルターを適用して再描画（絞り込み状態を保持）
        applyInputFilter();
        
        // フリップモード：ヘッダーをスクロールコンテナ内に移動
        const inputListHeader = document.querySelector('.input-list-header');
        const inputListContainer = document.getElementById('inputListContainer');
        if (inputListHeader && inputListContainer && !inputListContainer.contains(inputListHeader)) {
            inputListContainer.insertBefore(inputListHeader, inputListContainer.firstChild);
        }
    });
    
    expandBtn.addEventListener('click', () => {
        if (inputListViewMode === 'expand') return;
        inputListViewMode = 'expand';
        expandBtn.classList.add('active');
        flipBtn.classList.remove('active');
        updateRedSheetToggleVisibility();
        // すべてめくるボタンを非表示
        if (flipAllBtn) flipAllBtn.classList.add('hidden');
        
        // 展開モード：ヘッダーを元の位置に戻す
        const inputListHeader = document.querySelector('.input-list-header');
        const inputListView = document.getElementById('inputListView');
        const inputListContainer = document.getElementById('inputListContainer');
        if (inputListHeader && inputListView && inputListContainer && inputListContainer.contains(inputListHeader)) {
            inputListView.insertBefore(inputListHeader, inputListContainer);
        }
        
        // 現在の単語リストを再描画（フィルターを適用）
        applyInputFilter();
    });
    
    // すべてめくるボタンのイベント
    if (flipAllBtn) {
        flipAllBtn.addEventListener('click', () => {
            const container = document.getElementById('inputListContainer');
            if (!container) return;
            const items = container.querySelectorAll('.input-list-item');
            const btnLabel = flipAllBtn.querySelector('.btn-label');
            
            // 現在の状態を確認（最初のアイテムで判断）
            const firstItem = items[0];
            const isCurrentlyFlipped = firstItem && firstItem.classList.contains('flipped');
            
            items.forEach(item => {
                if (isCurrentlyFlipped) {
                    item.classList.remove('flipped');
                } else {
                    item.classList.add('flipped');
                }
            });
            
            // ボタンのラベルを切り替え
            if (btnLabel) {
                if (isCurrentlyFlipped) {
                    btnLabel.textContent = '英語→日本語';
                } else {
                    btnLabel.textContent = '日本語→英語';
                }
            }
        });
    }
}

// インプットモード用フィルターのセットアップ
function setupInputListFilter() {
    // 新しいドロップダウン形式のフィルター
    const filterTrigger = document.getElementById('inputFilterTrigger');
    const filterDropdown = document.getElementById('inputFilterDropdown');
    const filterCheckboxes = document.querySelectorAll('.filter-dropdown-item input[type="checkbox"]');
    const filterActiveBadge = document.getElementById('filterActiveBadge');
    
    if (filterTrigger && filterDropdown) {
        // トリガーボタンのクリックでドロップダウン開閉
        filterTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = filterDropdown.classList.contains('show');
            if (isOpen) {
                filterDropdown.classList.remove('show');
                // 絞り込み中かどうかを確認してactiveを維持
                const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
                if (allCheckbox && !allCheckbox.checked) {
                    // 絞り込み中はactiveを維持
                    filterTrigger.classList.add('active');
                } else {
                    filterTrigger.classList.remove('active');
                }
            } else {
                filterDropdown.classList.remove('hidden');
                // 少し遅延してアニメーションを適用
                requestAnimationFrame(() => {
                    filterDropdown.classList.add('show');
                    filterTrigger.classList.add('active');
                });
            }
        });
        
        // ドロップダウン外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && !filterTrigger.contains(e.target)) {
                filterDropdown.classList.remove('show');
                // 絞り込み中かどうかを確認してactiveを維持
                const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
                if (allCheckbox && !allCheckbox.checked) {
                    // 絞り込み中はactiveを維持
                    filterTrigger.classList.add('active');
                } else {
                    filterTrigger.classList.remove('active');
                }
            }
        });
        
        // チェックボックスの変更イベント
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const filterType = checkbox.dataset.filter;
                const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
                const otherCheckboxes = Array.from(filterCheckboxes).filter(cb => cb.dataset.filter !== 'all');
                
                if (filterType === 'all') {
                    // 「すべて」をクリックした場合
                    if (checkbox.checked) {
                        // すべてをチェック
                        otherCheckboxes.forEach(cb => cb.checked = true);
                    } else {
                        // すべてのチェックを外す
                        otherCheckboxes.forEach(cb => cb.checked = false);
                    }
                } else {
                    // 個別のチェックボックスの場合
                    const allChecked = otherCheckboxes.every(cb => cb.checked);
                    const noneChecked = otherCheckboxes.every(cb => !cb.checked);
                    
                    if (allChecked) {
                        // すべてチェックされている場合は「すべて」もチェック
                        if (allCheckbox) allCheckbox.checked = true;
                    } else {
                        // そうでない場合は「すべて」のチェックを外す
                        if (allCheckbox) allCheckbox.checked = false;
                    }
                }
                
                // バッジを更新
                updateFilterBadge();
                
                // フィルターを適用
                applyInputFilter();
            });
        });
    }
    
    // バッジ更新関数（グローバルに公開）
    window.updateFilterBadge = function(filteredCount) {
        if (!filterActiveBadge) return;
        
        const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
        
        if (allCheckbox && allCheckbox.checked) {
            // すべて選択時はバッジ非表示
            filterActiveBadge.classList.add('hidden');
            filterTrigger.classList.remove('active');
        } else if (typeof filteredCount === 'number') {
            // 絞り込んだ単語数を表示
            filterActiveBadge.textContent = filteredCount;
            filterActiveBadge.classList.remove('hidden');
            filterTrigger.classList.add('active');
        } else {
            filterActiveBadge.classList.add('hidden');
            filterTrigger.classList.remove('active');
        }
    }
    
    // 旧フィルターボタン対応（互換性用）
    const filterBtns = document.querySelectorAll('.input-filter-btn:not(.red-sheet-btn)');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-close-icon')) return;
            const filterType = btn.dataset.filter;
            if (filterType === 'all') {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            } else {
                const allBtn = document.querySelector('.input-filter-btn[data-filter="all"]');
                if (allBtn) allBtn.classList.remove('active');
                btn.classList.toggle('active');
            }
            applyInputFilter();
        });
    });
    
    // 赤シートボタンのセットアップ
    setupRedSheet();
    updateRedSheetToggleVisibility();
    
    // シャッフルボタンのセットアップ
    const shuffleBtn = document.getElementById('inputShuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            const container = document.getElementById('inputListContainer');
            
            // シャッフルアニメーション開始
            shuffleBtn.classList.add('shuffling');
            if (container) {
                container.classList.add('shuffle-animating');
            }
            
            // アニメーション後にシャッフル実行
            setTimeout(() => {
                isInputShuffled = !isInputShuffled;
                shuffleBtn.classList.toggle('active', isInputShuffled);
                
                // フィルターを再適用してリストを更新
                applyInputFilter();
                
                // フェードインアニメーション
                if (container) {
                    container.classList.remove('shuffle-animating');
                    container.classList.add('shuffle-fade-in');
                    setTimeout(() => {
                        container.classList.remove('shuffle-fade-in');
                    }, 300);
                }
                
                // ボタンのアニメーション終了
                shuffleBtn.classList.remove('shuffling');
            }, 400);
        });
    }
}

// 赤シートモードのセットアップ
let currentRedSheetIndex = 0; // 現在の赤シート位置のインデックス

function setupRedSheet() {
    const redSheetToggle = document.getElementById('redSheetToggle');
    const redSheetCheckbox = redSheetToggle?.querySelector('.red-sheet-checkbox');
    const redSheetOverlay = document.getElementById('redSheetOverlay');
    const redSheetNextBtn = document.getElementById('redSheetNextBtn');
    const inputListView = document.getElementById('inputListView');
    
    if (!redSheetCheckbox || !redSheetOverlay) return;
    
    redSheetCheckbox.addEventListener('change', () => {
        const isActive = redSheetCheckbox.checked;
        
        if (isActive) {
            // 現在表示されている範囲内で、一番上の単語の日本語の意味を探す
            const meanings = document.querySelectorAll('.input-list-expand-meaning');
            let targetMeaning = null;
            let targetIndex = 0;
            
            // ヘッダーの高さを考慮したオフセット（スティッキーなコントロールバーなど）
            const headerOffset = 150; 

            for (let i = 0; i < meanings.length; i++) {
                const rect = meanings[i].getBoundingClientRect();
                // 画面内にあり、かつヘッダーより下にある最初の意味要素を見つける
                if (rect.bottom > headerOffset) {
                    targetMeaning = meanings[i];
                    targetIndex = i;
                    break;
                }
            }

            currentRedSheetIndex = targetIndex;
            let topPosition = 150; // デフォルト値
            let leftPosition = 0; // デフォルト値

            if (targetMeaning) {
                const rect = targetMeaning.getBoundingClientRect();
                topPosition = rect.top; // 日本語の意味の上端から
                // 意味テキストの左端から右端まで隠す
                leftPosition = rect.left - 10;
            } else if (meanings.length > 0) {
                // 見つからない場合は一番最初の要素（フォールバック）
                const rect = meanings[0].getBoundingClientRect();
                topPosition = rect.top;
                leftPosition = rect.left - 10;
                currentRedSheetIndex = 0;
            }

            redSheetOverlay.style.top = topPosition + 'px';
            redSheetOverlay.style.left = leftPosition + 'px';
            redSheetOverlay.style.right = '0';
            
            redSheetOverlay.classList.remove('hidden');
            inputListView.classList.add('red-sheet-mode');
            setupRedSheetDrag(redSheetOverlay);
            
            // 下矢印ボタンを表示
            if (redSheetNextBtn) {
                redSheetNextBtn.classList.remove('hidden');
            }
        } else {
            redSheetOverlay.classList.add('hidden');
            inputListView.classList.remove('red-sheet-mode');
            
            // 下矢印ボタンを非表示
            if (redSheetNextBtn) {
                redSheetNextBtn.classList.add('hidden');
            }
        }
    });
    
    // 下矢印ボタンのクリックイベント
    if (redSheetNextBtn) {
        redSheetNextBtn.addEventListener('click', () => {
            moveRedSheetToNext();
        });
    }
}

// 赤シートを次の単語に移動
function moveRedSheetToNext() {
    const redSheetOverlay = document.getElementById('redSheetOverlay');
    const inputListView = document.getElementById('inputListView');
    const meanings = document.querySelectorAll('.input-list-expand-meaning');
    
    if (!redSheetOverlay || !inputListView || meanings.length === 0) return;
    
    // 画面の表示領域を取得（ヘッダーを考慮）
    const headerOffset = 150; // ヘッダー部分のオフセット
    const viewportHeight = window.innerHeight;
    
    // 赤シートの現在位置を取得
    const currentRedSheetTop = parseFloat(redSheetOverlay.style.top) || 0;
    
    // 現在隠している単語を特定（赤シートの位置に最も近い単語）
    let currentWordIndex = -1;
    for (let i = 0; i < meanings.length; i++) {
        const rect = meanings[i].getBoundingClientRect();
        if (rect.top <= currentRedSheetTop + 5) {
            currentWordIndex = i;
        } else {
            break;
        }
    }
    
    // 赤シートの位置より下にある最初の単語を見つける
    let nextIndex = -1;
    for (let i = 0; i < meanings.length; i++) {
        const rect = meanings[i].getBoundingClientRect();
        // 赤シートより少し下にある単語を探す（5px余裕を持たせる）
        if (rect.top > currentRedSheetTop + 5) {
            nextIndex = i;
            break;
        }
    }
    
    // 次の単語が見つからない場合は終了
    if (nextIndex === -1) {
        currentRedSheetIndex = 0;
        
        // 赤シートをフェードアウト
        redSheetOverlay.style.transition = 'opacity 0.3s ease';
        redSheetOverlay.style.opacity = '0';
        
        // フェードアウト完了後に赤シートを非表示にしてチェックボックスをオフ
        setTimeout(() => {
            redSheetOverlay.classList.add('hidden');
            redSheetOverlay.style.opacity = '';
            redSheetOverlay.style.transition = '';
            inputListView.classList.remove('red-sheet-mode');
            
            // 下矢印ボタンを非表示
            const redSheetNextBtn = document.getElementById('redSheetNextBtn');
            if (redSheetNextBtn) {
                redSheetNextBtn.classList.add('hidden');
            }
            
            // チェックボックスをオフ
            const redSheetToggle = document.getElementById('redSheetToggle');
            const redSheetCheckbox = redSheetToggle?.querySelector('.red-sheet-checkbox');
            if (redSheetCheckbox) {
                redSheetCheckbox.checked = false;
            }
        }, 300);
        return;
    }
    
    const nextMeaning = meanings[nextIndex];
    if (!nextMeaning) return;
    
    // 次の単語の位置を取得
    const nextRect = nextMeaning.getBoundingClientRect();
    
    // 次の単語が画面外ならスクロール（現在の単語を隠したまま上へ）
    if (nextRect.top >= viewportHeight) {
        // 現在隠している単語を取得
        const currentMeaning = currentWordIndex >= 0 ? meanings[currentWordIndex] : meanings[0];
        const currentRect = currentMeaning.getBoundingClientRect();
        
        // スクロール量を計算（現在の単語がヘッダー直下に来るように）
        const scrollAmount = currentRect.top - headerOffset;
        
        // スクロール可能な最大量を計算（リスト最後で制限される場合用）
        const scrollTop = inputListView.scrollTop;
        const scrollHeight = inputListView.scrollHeight;
        const clientHeight = inputListView.clientHeight;
        const maxScrollAmount = scrollHeight - scrollTop - clientHeight;
        
        // 実際にスクロールする量（計算量と最大量の小さい方）
        const actualScrollAmount = Math.min(scrollAmount, Math.max(0, maxScrollAmount));
        
        // 赤シートの新しい位置（現在の単語を隠したまま上へ）
        const newRedSheetTop = currentRect.top - actualScrollAmount;
        
        // スクロールと赤シートのアニメーションを同時に開始
        inputListView.scrollBy({
            top: actualScrollAmount,
            behavior: 'smooth'
        });
        
        // 赤シートも同時にアニメーション（現在の単語を隠したまま）
        redSheetOverlay.style.transition = 'top 0.3s ease';
        redSheetOverlay.style.top = newRedSheetTop + 'px';
        redSheetOverlay.style.left = (currentRect.left - 10) + 'px';
        
        setTimeout(() => {
            redSheetOverlay.style.transition = '';
        }, 300);
        
        // インデックスは更新しない（次回のボタン押下で次の単語へ）
    } else {
        // 画面内なので赤シートを次の単語に移動
        currentRedSheetIndex = nextIndex;
        redSheetOverlay.style.transition = 'top 0.3s ease';
        redSheetOverlay.style.top = nextRect.top + 'px';
        redSheetOverlay.style.left = (nextRect.left - 10) + 'px';
        setTimeout(() => {
            redSheetOverlay.style.transition = '';
        }, 300);
    }
}

// 赤シートトグルの表示/非表示を切り替え
function updateRedSheetToggleVisibility() {
    const redSheetToggle = document.getElementById('redSheetToggle');
    if (!redSheetToggle) return;
    
    // 展開モードのときだけ表示
    if (inputListViewMode === 'expand') {
        redSheetToggle.classList.add('visible');
        redSheetToggle.classList.remove('hidden');
    } else {
        redSheetToggle.classList.remove('visible');
        redSheetToggle.classList.add('hidden');
        // フリップモードに切り替えたときは赤シートをリセット
        resetRedSheet();
    }
}

// 赤シートトグルのスティッキー動作をセットアップ
function setupRedSheetStickyScroll() {
    const inputListView = document.getElementById('inputListView');
    const redSheetToggle = document.getElementById('redSheetToggle');
    const inputListHeaderRow = document.querySelector('.input-list-header-row');
    
    if (!inputListView || !redSheetToggle) return;
    
    // スクロール位置を監視（inputListViewがスクロールコンテナ）
    inputListView.addEventListener('scroll', () => {
        if (!redSheetToggle.classList.contains('visible')) return;
        
        // ヘッダー行の位置を取得
        if (inputListHeaderRow) {
            const headerRect = inputListHeaderRow.getBoundingClientRect();
            // ヘッダーが画面上部より上に出たらスティッキーにする
            if (headerRect.bottom < 60) {
                redSheetToggle.classList.add('sticky');
            } else {
                redSheetToggle.classList.remove('sticky');
            }
        }
    });
}

// 赤シートドラッグ機能
function setupRedSheetDrag(overlay) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    
    const onPointerDown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = overlay.offsetLeft;
        startTop = overlay.offsetTop;
        overlay.style.cursor = 'grabbing';
        overlay.setPointerCapture(e.pointerId);
    };
    
    const onPointerMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        // 自由に動かせる
        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
    };
    
    const onPointerUp = (e) => {
        isDragging = false;
        overlay.style.cursor = 'grab';
        overlay.releasePointerCapture(e.pointerId);
    };
    
    // 既存のリスナーを削除してから追加
    overlay.removeEventListener('pointerdown', overlay._onPointerDown);
    overlay.removeEventListener('pointermove', overlay._onPointerMove);
    overlay.removeEventListener('pointerup', overlay._onPointerUp);
    
    overlay._onPointerDown = onPointerDown;
    overlay._onPointerMove = onPointerMove;
    overlay._onPointerUp = onPointerUp;
    
    overlay.addEventListener('pointerdown', onPointerDown);
    overlay.addEventListener('pointermove', onPointerMove);
    overlay.addEventListener('pointerup', onPointerUp);
}

// 赤シートをリセット
function resetRedSheet() {
    const redSheetToggle = document.getElementById('redSheetToggle');
    const redSheetCheckbox = redSheetToggle?.querySelector('.red-sheet-checkbox');
    const redSheetOverlay = document.getElementById('redSheetOverlay');
    const redSheetNextBtn = document.getElementById('redSheetNextBtn');
    const inputListView = document.getElementById('inputListView');
    
    if (redSheetCheckbox) redSheetCheckbox.checked = false;
    if (redSheetOverlay) redSheetOverlay.classList.add('hidden');
    if (redSheetNextBtn) redSheetNextBtn.classList.add('hidden');
    if (inputListView) inputListView.classList.remove('red-sheet-mode');
    if (redSheetToggle) redSheetToggle.classList.remove('sticky');
    currentRedSheetIndex = 0;
}

// フィルターを適用して単語リストを再描画
function applyInputFilter() {
    const baseWords = currentCourseWords && currentCourseWords.length > 0 ? currentCourseWords : currentWords;
    if (!baseWords || baseWords.length === 0) return;
    
    // 単語の状態を取得するためのキャッシュを作成
    let allCorrectIds = new Set();
    let allWrongIds = new Set();
    
    // 「すべての単語」の場合は全カテゴリーの進捗を読み込む
    if (selectedCategory === '大阪府のすべての英単語') {
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
        // 小学生で習った単語の場合は各単語のカテゴリーから進捗を読み込む
        const modes = ['card', 'input'];
        const categoryCache = {};
        
        baseWords.forEach(word => {
            const cat = word.category;
            if (!categoryCache[cat]) {
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
                
                categoryCache[cat] = { correctSet, wrongSet };
            }
        });
        
        // カテゴリーキャッシュから全IDを収集
        Object.values(categoryCache).forEach(cache => {
            cache.correctSet.forEach(id => allCorrectIds.add(id));
            cache.wrongSet.forEach(id => allWrongIds.add(id));
        });
    } else {
        // 通常のカテゴリーの場合は selectedCategory を使用（renderInputListView と同じ方式）
        const modes = ['card', 'input'];
        
        modes.forEach(mode => {
            const savedCorrect = localStorage.getItem(`correctWords-${selectedCategory}_${mode}`);
            const savedWrong = localStorage.getItem(`wrongWords-${selectedCategory}_${mode}`);
            
            if (savedCorrect) {
                try {
                    JSON.parse(savedCorrect).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allCorrectIds.add(numId);
                    });
                } catch (e) {}
            }
            
            if (savedWrong) {
                try {
                    JSON.parse(savedWrong).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        allWrongIds.add(numId);
                    });
                } catch (e) {}
            }
        });
    }
    
    // アクティブなフィルターを取得（新しいドロップダウン形式を優先）
    let activeFilters = [];
    const filterCheckboxes = document.querySelectorAll('.filter-dropdown-item input[type="checkbox"]:checked');
    
    if (filterCheckboxes.length > 0) {
        // 新しいドロップダウン形式
        activeFilters = Array.from(filterCheckboxes).map(cb => cb.dataset.filter);
    } else {
        // 旧ボタン形式（互換性用）
        activeFilters = Array.from(document.querySelectorAll('.input-filter-btn:not(.red-sheet-btn).active'))
            .map(btn => btn.dataset.filter);
    }
    
    let filteredWords = baseWords;
    
    // 何もチェックされていない場合は空の結果
    if (activeFilters.length === 0) {
        filteredWords = [];
    }
    // 「すべて」が選択されている場合は全単語を表示
    else if (activeFilters.includes('all')) {
        filteredWords = baseWords;
    } else {
        // 複数のフィルターの和集合を取る
        const filteredSets = [];
        
        activeFilters.forEach(filter => {
            let filteredSet = new Set();
            
            switch (filter) {
                case 'wrong':
                    // 覚えていない単語（間違えた）
                    baseWords.forEach(word => {
                        if (allWrongIds.has(word.id)) {
                            filteredSet.add(word.id);
                        }
                    });
                    break;
                case 'unlearned':
                    // 未学習の単語（正解も不正解もない）
                    baseWords.forEach(word => {
                        if (!allCorrectIds.has(word.id) && !allWrongIds.has(word.id)) {
                            filteredSet.add(word.id);
                        }
                    });
                    break;
                case 'bookmark':
                    // チェック済み（ブックマーク）の単語
                    baseWords.forEach(word => {
                        if (reviewWords.has(word.id)) {
                            filteredSet.add(word.id);
                        }
                    });
                    break;
                case 'correct':
                    // 覚えた単語（正解して、かつ間違えていない）
                    baseWords.forEach(word => {
                        if (allCorrectIds.has(word.id) && !allWrongIds.has(word.id)) {
                            filteredSet.add(word.id);
                        }
                    });
                    break;
            }
            
            if (filteredSet.size > 0) {
                filteredSets.push(filteredSet);
            }
        });
        
        // すべてのフィルターセットの和集合を取る
        if (filteredSets.length > 0) {
            const unionSet = new Set();
            filteredSets.forEach(set => {
                set.forEach(id => unionSet.add(id));
            });
            filteredWords = baseWords.filter(word => unionSet.has(word.id));
        } else {
            filteredWords = [];
        }
    }
    
    // フィルター結果を表示
    if (filteredWords.length > 0) {
        // 大量データの場合はページネーションを使用
        if (filteredWords.length > 500) {
            renderInputListViewPaginated(filteredWords);
        } else {
        renderInputListView(filteredWords);
        }
    } else {
        // フィルター結果が0件の場合
        const container = document.getElementById('inputListContainer');
        if (container) {
            container.innerHTML = '<div class="input-filter-empty">該当する単語がありません</div>';
        }
    }
    
    // フィルター結果の件数を更新
    updateFilterCount(filteredWords.length, baseWords.length);
    
    // バッジに絞り込んだ単語数を表示
    if (window.updateFilterBadge) {
        const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
        if (allCheckbox && allCheckbox.checked) {
            window.updateFilterBadge(null);
        } else {
            window.updateFilterBadge(filteredWords.length);
        }
    }
}

// フィルター結果の件数を表示
function updateFilterCount(filtered, total) {
    const titleEl = document.querySelector('.input-list-title');
    if (!titleEl) return;
    
    // アクティブなフィルターボタンからフィルターを取得
    const activeFilters = Array.from(document.querySelectorAll('.input-filter-btn:not(.red-sheet-btn).active'))
        .map(btn => btn.dataset.filter);
    
    if (activeFilters.includes('all') || activeFilters.length === 0) {
        titleEl.textContent = '単語一覧';
    } else {
        const filterNames = {
            'wrong': '覚えていない',
            'unlearned': '未学習',
            'bookmark': 'チェックマーク',
            'correct': '覚えた'
        };
        
        if (activeFilters.length === 1) {
            titleEl.textContent = `${filterNames[activeFilters[0]]}（${filtered}語）`;
        } else {
            const filterLabels = activeFilters.map(f => filterNames[f]).join('・');
            titleEl.textContent = `${filterLabels}（${filtered}語）`;
        }
    }
}

// フィルターをリセット
function resetInputFilter() {
    currentInputFilter = 'all';
    const filterBtns = document.querySelectorAll('.input-filter-btn');
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // ドロップダウン形式のフィルターもデフォルト（すべてON）に戻す
    const dropdownCheckboxes = document.querySelectorAll('.filter-dropdown-item input[type="checkbox"]');
    dropdownCheckboxes.forEach(cb => cb.checked = true);

    // ドロップダウンの開閉状態とバッジをリセット
    const filterDropdown = document.getElementById('inputFilterDropdown');
    if (filterDropdown) {
        filterDropdown.classList.add('hidden');
        filterDropdown.classList.remove('show');
    }

    const filterTrigger = document.getElementById('inputFilterTrigger');
    if (filterTrigger) {
        filterTrigger.classList.remove('active');
    }

    const filterActiveBadge = document.getElementById('filterActiveBadge');
    if (filterActiveBadge) {
        filterActiveBadge.textContent = '';
        filterActiveBadge.classList.add('hidden');
    }

    if (typeof window.updateFilterBadge === 'function') {
        window.updateFilterBadge(null);
    }
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
    
    // 品詞を一文字に変換
    const posShort = getPartOfSpeechShort(word.partOfSpeech || '');
    const posClass = getPartOfSpeechClass(word.partOfSpeech || '');
    
    // 英単語と品詞を一緒に表示（品詞を左横に）- アウトプットモードでは非表示
    const englishWordWrapper = elements.englishWord.parentElement;
    let posElementFront = document.getElementById('posInlineFront');
    if (posShort && currentLearningMode === 'input') {
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
    
    // 入試頻出度を表示（カードモード）- アウトプットモードでは非表示
    const appearanceCountEl = document.getElementById('wordAppearanceCount');
    if (appearanceCountEl) {
        appearanceCountEl.style.display = 'none';
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

    // 裏面に英単語を表示（アウトプットモードのみ）
    const englishWordBack = document.getElementById('englishWordBack');
    if (englishWordBack) {
        if (currentLearningMode !== 'input') {
            englishWordBack.textContent = word.word;
            englishWordBack.style.display = '';
        } else {
            englishWordBack.style.display = 'none';
        }
    }

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
    
    if (isChoiceQuestionModeActive) {
        // 四択問題モードのとき
        progressStepLeft.disabled = currentChoiceQuestionIndex === 0;
        progressStepRight.disabled = currentChoiceQuestionIndex >= choiceQuestionData.length - 1;
        // テキストを更新
        const leftSpan = progressStepLeft.querySelector('span');
        const rightSpan = progressStepRight.querySelector('span');
        if (leftSpan) leftSpan.textContent = '前の問題へ';
        if (rightSpan) rightSpan.textContent = '次の問題へ';
    } else if (isReorderModeActive) {
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
    // 小学生で習った単語、すべての単語の場合は、各単語のカテゴリーを使用
    const categoryKey = (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === '大阪府のすべての英単語') ? word.category : selectedCategory;
    if (categoryKey) {
        // 現在のモードで正解を保存
        const { correctSet, wrongSet } = loadCategoryWords(categoryKey);
        correctSet.add(word.id);
        wrongSet.delete(word.id);
        saveCategoryWords(categoryKey, correctSet, wrongSet);
        
        // すべてのモードの間違いリストから削除（別モードで間違えた記録も消す）
        const allModes = ['card', 'input'];
        allModes.forEach(mode => {
            const wrongKey = `wrongWords-${categoryKey}_${mode}`;
            const savedWrong = localStorage.getItem(wrongKey);
            if (savedWrong) {
                const wrongList = JSON.parse(savedWrong);
                const filteredList = wrongList.filter(id => {
                    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                    return numId !== word.id;
                });
                if (filteredList.length !== wrongList.length) {
                    localStorage.setItem(wrongKey, JSON.stringify(filteredList));
                }
            }
        });
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
    updateVocabProgressBar(); // 英単語進捗バーを更新

    // 画面全体のフィードバック表示
    if (isInputModeActive && elements.feedbackOverlay) {
        // 入力モード: グローバルオーバーレイを使用
        elements.feedbackOverlay.className = `feedback-overlay mastered active`;
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 400);
    } else if (!isInputModeActive && elements.cardFeedbackOverlay) {
        // カードモード: カード専用オーバーレイを使用（カードの後ろに表示）
        elements.cardFeedbackOverlay.className = `card-feedback-overlay mastered active`;
        setTimeout(() => {
            elements.cardFeedbackOverlay.classList.remove('active');
        }, 400);
    }

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
            selectedCategory !== '大阪C問題対策英単語タイムアタック'
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

// キラキラエフェクトを表示
function showSparkleEffect() {
    // コンテナを作成
    const container = document.createElement('div');
    container.className = 'sparkle-container';
    document.body.appendChild(container);
    
    // カラフルな色の配列
    const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171'];
    
    // 星型キラキラを複数生成（少なめに）
    const sparkleCount = 12;
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            // ランダムな位置
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            // 星型キラキラ
            const star = document.createElement('div');
            star.className = 'sparkle-star';
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = (Math.random() * 0.2) + 's';
            // ランダムなサイズ（バラバラに）
            const size = 0.5 + Math.random() * 1.2;
            star.style.setProperty('--star-scale', size);
            // ランダムなカラフル色を設定
            const color = colors[Math.floor(Math.random() * colors.length)];
            star.style.setProperty('--star-color', color);
            container.appendChild(star);
        }, i * 35);
    }
    
    // コンテナを削除
    setTimeout(() => {
        container.remove();
    }, 1200);
}

// スワイプまたはボタンで正解/不正解をマーク
function markAnswer(isCorrect, isTimeout = false) {
    if (currentIndex >= currentRangeEnd) return;
    
    // 効果音を再生（正解/不正解）
    if (isCorrect) {
        SoundEffects.playCorrect();
    } else {
        SoundEffects.playWrong();
    }

    const word = currentWords[currentIndex];
    answeredWords.add(word.id);
    const responseMs = wordResponseStartTime ? (Date.now() - wordResponseStartTime) : null;
    

    // 現在の問題の回答状況を記録
    const questionIndex = currentIndex - currentRangeStart;
    if (questionIndex >= 0 && questionIndex < questionStatus.length) {
        questionStatus[questionIndex] = isCorrect ? 'correct' : 'wrong';
    }

    if (isCorrect) {
        correctCount++;
        correctWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        // 小学生で習った単語の場合は、各単語のカテゴリー（機能語の場合は「冠詞」「代名詞」など）を使用
        const categoryKey = (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語') ? word.category : selectedCategory;
        if (categoryKey) {
            // 現在のモードで正解を保存
            const { correctSet, wrongSet } = loadCategoryWords(categoryKey);
            correctSet.add(word.id);
            wrongSet.delete(word.id);
            saveCategoryWords(categoryKey, correctSet, wrongSet);
            
            // すべてのモードの間違いリストから削除（別モードで間違えた記録も消す）
            const allModes = ['card', 'input'];
            allModes.forEach(mode => {
                const wrongKey = `wrongWords-${categoryKey}_${mode}`;
                const savedWrong = localStorage.getItem(wrongKey);
                if (savedWrong) {
                    const wrongList = JSON.parse(savedWrong);
                    const filteredList = wrongList.filter(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        return numId !== word.id;
                    });
                    if (filteredList.length !== wrongList.length) {
                        localStorage.setItem(wrongKey, JSON.stringify(filteredList));
                    }
                }
            });
        }
        
        saveCorrectWords();
        
    } else {
        wrongCount++;
        // 間違えた場合は間違いリストに追加
        wrongWords.add(word.id);
        
        // カテゴリごとの進捗を更新
        // 小学生で習った単語、すべての単語の場合は、各単語のカテゴリーを使用
        const categoryKeyWrong = (selectedCategory === '小学生で習った単語とカテゴリー別に覚える単語' || selectedCategory === '大阪府のすべての英単語') ? word.category : selectedCategory;
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
    updateVocabProgressBar(); // 英単語進捗バーを更新

    // 画面全体のフィードバック表示
    if (isInputModeActive && elements.feedbackOverlay) {
        // 入力モード: グローバルオーバーレイを使用
        elements.feedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 400);
    } else if (!isInputModeActive && elements.cardFeedbackOverlay) {
        // カードモード: カード専用オーバーレイを使用（カードの後ろに表示）
        elements.cardFeedbackOverlay.className = `card-feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            elements.cardFeedbackOverlay.classList.remove('active');
        }, 400);
    }
    
    // 正解時にキラキラエフェクトを表示
    if (isCorrect) {
        showSparkleEffect();
    }

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
            selectedCategory !== '大阪C問題対策英単語タイムアタック'
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
    // 完了音を再生
    SoundEffects.playComplete();
    
    const completionOverlay = document.getElementById('completionOverlay');
    if (!completionOverlay) {
        // フォールバック：旧方式
        showCategorySelection();
        return;
    }
    
    // 前回のアニメーション状態を完全にリセット
    const completionProgressBar = document.querySelector('.completion-progress-bar');
    if (completionProgressBar) {
        // すべてのCOMPLETEクラスを確実に削除
        completionProgressBar.classList.remove('completion-progress-complete', 'completion-progress-complete-card', 'completion-progress-complete-input');
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
                    // すべてのCOMPLETEクラスを確実に削除（念のため）
                    completionProgressBar.classList.remove('completion-progress-complete', 'completion-progress-complete-card', 'completion-progress-complete-input');
                    // 強制リフローで確実に反映
                    void completionProgressBar.offsetHeight;
                    // 少し待ってからモードに応じたクラスを追加（アニメーションを確実に再実行）
                    requestAnimationFrame(() => {
                        // モードに応じて異なるCOMPLETE表示クラスを追加
                        // 英語→日本語モード（カードモード）: 青色でシンプル
                        // 日本語→英語モード（キーボード/手書き入力）: 豪華な金色グラデーション
                        if (selectedQuizDirection === 'jpn-to-eng') {
                            // 日本語→英語モード（入力モード）: 豪華なCOMPLETE表示
                            completionProgressBar.classList.add('completion-progress-complete-input');
                        } else {
                            // 英語→日本語モード（カードモード）: 青色のCOMPLETE表示
                            completionProgressBar.classList.add('completion-progress-complete-card');
                        }
                    });
                }, animationTime + 100); // 少し余裕を持たせる
            }
        }, 300);
        
        // コンプリート時は紙吹雪を表示
        if (isComplete && confettiContainer) {
            createConfetti(confettiContainer);
        }
        
        // 目標達成チェック（学習完了時に判定して、ホーム画面に戻った時に表示）
        const selectedSchool = loadSelectedSchool();
        if (selectedSchool) {
            const learnedWords = calculateTotalLearnedWords();
            const requiredWords = calculateRequiredWords(selectedSchool.hensachi, selectedSchool.name);
            const hasReachedRequired = requiredWords > 0 && learnedWords >= requiredWords;
            
            console.log('学習完了時の目標達成チェック:', {
                learnedWords,
                requiredWords,
                hasReachedRequired,
                hasReachedGoalBefore
            });
            
            if (hasReachedRequired && !hasReachedGoalBefore) {
                console.log('目標達成を検出！ホーム画面に戻った時に表示します');
                pendingGoalCelebration = true;
            }
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
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            // 横揺れの強さ（左右ランダム）
            const swayDirection = Math.random() > 0.5 ? 1 : -1;
            const swayAmount1 = (Math.random() * 40 + 20) * swayDirection;
            const swayAmount2 = (Math.random() * 35 + 15) * -swayDirection;
            const swayAmount3 = (Math.random() * 30 + 15) * swayDirection;
            const swayAmount4 = (Math.random() * 25 + 10) * -swayDirection;
            
            // 回転角度
            const rotateStart = Math.random() * 360;
            const rotateEnd = rotateStart + (Math.random() * 720 + 360) * (Math.random() > 0.5 ? 1 : -1);
            
            // ランダムなキーフレームポイント（各紙吹雪で異なる高さで揺れる）
            const p1 = 15 + Math.random() * 10;  // 15-25%
            const p2 = 35 + Math.random() * 10;  // 35-45%
            const p3 = 55 + Math.random() * 10;  // 55-65%
            const p4 = 75 + Math.random() * 10;  // 75-85%
            
            // 個別のキーフレームアニメーション（linearでスムーズに）
            const keyframes = `
                @keyframes confettiFall${i} {
                    0% {
                        transform: translateY(0) translateX(0) rotate(${rotateStart}deg) rotateX(0deg);
                        opacity: 1;
                    }
                    ${p1}% {
                        transform: translateY(${p1}vh) translateX(${swayAmount1}px) rotate(${rotateStart + (rotateEnd - rotateStart) * (p1/100)}deg) rotateX(${90 * (p1/25)}deg);
                    }
                    ${p2}% {
                        transform: translateY(${p2}vh) translateX(${swayAmount2}px) rotate(${rotateStart + (rotateEnd - rotateStart) * (p2/100)}deg) rotateX(${180 * (p2/45)}deg);
                    }
                    ${p3}% {
                        transform: translateY(${p3}vh) translateX(${swayAmount3}px) rotate(${rotateStart + (rotateEnd - rotateStart) * (p3/100)}deg) rotateX(${270 * (p3/65)}deg);
                    }
                    ${p4}% {
                        transform: translateY(${p4}vh) translateX(${swayAmount4}px) rotate(${rotateStart + (rotateEnd - rotateStart) * (p4/100)}deg) rotateX(${360 * (p4/85)}deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(105vh) translateX(${swayAmount1 * 0.3}px) rotate(${rotateEnd}deg) rotateX(450deg);
                        opacity: 0;
                    }
                }
            `;
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            confetti.style.animationName = `confettiFall${i}`;
            confetti.style.animationTimingFunction = 'linear';
            container.appendChild(confetti);
            
            // アニメーション終了後に削除
            setTimeout(() => {
                confetti.remove();
                style.remove();
            }, (duration + 0.5) * 1000);
        }, i * 25);
    }
}

// 目標達成の演出
function showGoalAchievedCelebration(school) {
    console.log('showGoalAchievedCelebration 呼び出されました', school);
    const overlay = document.getElementById('goalAchievedOverlay');
    const confettiContainer = document.getElementById('goalConfettiContainer');
    const schoolNameEl = document.getElementById('goalAchievedSchool');
    const closeBtn = document.getElementById('goalAchievedCloseBtn');
    const progressBar = document.getElementById('goalAchievedProgressBar');
    const progressCorrect = document.getElementById('goalAchievedProgressCorrect');
    const progressWrong = document.getElementById('goalAchievedProgressWrong');
    const progressText = document.getElementById('goalAchievedProgressText');
    
    if (!overlay) {
        console.error('goalAchievedOverlay が見つかりません');
        return;
    }
    
    console.log('目標達成画面を表示します');
    
    // 学校名を設定
    if (schoolNameEl && school) {
        schoolNameEl.textContent = school.name;
    }
    
    // 進捗バーを更新
    if (school) {
        const learnedWords = calculateTotalLearnedWords();
        const requiredWords = calculateRequiredWords(school.hensachi, school.name);
        const correctWords = Math.min(learnedWords, requiredWords);
        const wrongWords = Math.max(0, requiredWords - learnedWords);
        const progressPercent = requiredWords > 0 ? Math.round((correctWords / requiredWords) * 100) : 0;
        
        // 進捗バーの幅を更新
        if (progressCorrect) {
            progressCorrect.style.width = `${progressPercent}%`;
        }
        if (progressWrong) {
            progressWrong.style.width = `${100 - progressPercent}%`;
        }
        
        // テキストを更新（右下に表示）
        if (progressText) {
            progressText.textContent = `${correctWords}/${requiredWords}語`;
        }
        
        // COMPLETE!!を表示
        if (progressBar && learnedWords >= requiredWords) {
            progressBar.classList.add('goal-achieved-progress-complete');
        }
    }
    
    // オーバーレイを表示
    overlay.classList.remove('hidden');
    
    // 効果音を再生
    SoundEffects.playComplete();
    
    // 少し遅延してshowクラスを追加（アニメーション用）
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });
    
    // 花火を生成
    if (confettiContainer) {
        confettiContainer.innerHTML = '';
        createFireworks(confettiContainer);
    }
    
    // 閉じるボタン（最初は非表示）
    if (closeBtn) {
        closeBtn.classList.add('hidden');
        closeBtn.onclick = () => {
            SoundEffects.playTap();
            hideGoalAchievedCelebration();
        };
        
        // 花火終了後（約8.5秒後）にボタンをフェードイン表示
        // 8発 × 700ms間隔 + 打ち上げ1600ms + 爆発2000ms ≒ 8500ms
        setTimeout(() => {
            closeBtn.classList.remove('hidden');
            closeBtn.classList.add('fade-in');
        }, 8500);
    }
    
    // 背景クリックで閉じる（ボタン表示後のみ）
    overlay.onclick = (e) => {
        if (e.target === overlay && closeBtn && !closeBtn.classList.contains('hidden')) {
            SoundEffects.playClose();
            hideGoalAchievedCelebration();
        }
    };
}

// 目標達成演出を閉じる
function hideGoalAchievedCelebration() {
    const overlay = document.getElementById('goalAchievedOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.classList.add('hidden');
        // コンテナをクリア
        const confettiContainer = document.getElementById('goalConfettiContainer');
        const sparkleContainer = document.getElementById('goalSparkleContainer');
        if (confettiContainer) confettiContainer.innerHTML = '';
        if (sparkleContainer) sparkleContainer.innerHTML = '';
    }, 500);
}

// 目標達成用の花火アニメーション（リアル版）
function createFireworks(container) {
    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    const colorSets = [
        ['#ff4757', '#ff6b81', '#ff8a9b'], // 赤
        ['#ffa502', '#ffbe4d', '#ffd580'], // オレンジ
        ['#2ed573', '#5ce08a', '#8beba6'], // 緑
        ['#1e90ff', '#54a9ff', '#8ac4ff'], // 青
        ['#a55eea', '#bb7ff0', '#d4a5f5'], // 紫
        ['#fd79a8', '#fe9bb8', '#ffbdd0'], // ピンク
        ['#00d2d3', '#4de0e1', '#80e9ea'], // シアン
        ['#fdcb6e', '#fed990', '#fee6b3'], // 黄
    ];
    
    // 打ち上げ花火を1つ作成
    function launchFirework(startX) {
        const targetY = H * (0.2 + Math.random() * 0.15);
        const colors = colorSets[Math.floor(Math.random() * colorSets.length)];
        
        // ロケット
        const rocket = document.createElement('div');
        rocket.className = 'fw-rocket';
        rocket.style.left = startX + 'px';
        rocket.style.top = H + 'px';
        container.appendChild(rocket);
        
        // 打ち上げ時間（ゆっくり）
        const launchDuration = 1200 + Math.random() * 400;
        
        // 打ち上げアニメーション
        const launchAnim = rocket.animate([
            { top: H + 'px' },
            { top: targetY + 'px' }
        ], {
            duration: launchDuration,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // 軌跡を追加
        const trailElements = [];
        let trailInterval = setInterval(() => {
            const t = document.createElement('div');
            t.className = 'fw-trail';
            t.style.left = (startX + (Math.random() - 0.5) * 6) + 'px';
            const progress = launchAnim.currentTime / launchDuration;
            const yPos = H - (H - targetY) * progress;
            t.style.top = yPos + 'px';
            t.style.background = `rgba(255, 240, 200, ${0.9 - progress * 0.5})`;
            container.appendChild(t);
            trailElements.push(t);
            
            t.animate([
                { opacity: 0.9, transform: 'scale(1.2)' },
                { opacity: 0, transform: 'scale(0.3)' }
            ], { duration: 500, fill: 'forwards' }).onfinish = () => t.remove();
        }, 50);
        
        launchAnim.onfinish = () => {
            clearInterval(trailInterval);
            rocket.remove();
            trailElements.forEach(t => t.remove());
            
            // 爆発
            explode(startX, targetY, colors);
        };
    }
    
    // 爆発
    function explode(cx, cy, colors) {
        const mainCount = 40;
        const innerCount = 20;
        
        // メインの爆発（外側・大きく）
        for (let i = 0; i < mainCount; i++) {
            const angle = (Math.PI * 2 / mainCount) * i + (Math.random() - 0.5) * 0.2;
            const speed = 180 + Math.random() * 80;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            createParticle(cx, cy, angle, speed, color, 8 + Math.random() * 4, 2000);
        }
        
        // 内側の爆発
        for (let i = 0; i < innerCount; i++) {
            const angle = (Math.PI * 2 / innerCount) * i + Math.random() * 0.3;
            const speed = 80 + Math.random() * 50;
            const color = colors[0];
            
            createParticle(cx, cy, angle, speed, color, 6 + Math.random() * 3, 1600);
        }
        
        // 白いスパーク（大きめ）
        for (let i = 0; i < 25; i++) {
            const spark = document.createElement('div');
            spark.className = 'fw-spark';
            spark.style.width = '4px';
            spark.style.height = '4px';
            spark.style.left = cx + 'px';
            spark.style.top = cy + 'px';
            container.appendChild(spark);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            const endX = Math.cos(angle) * dist;
            const endY = Math.sin(angle) * dist;
            
            spark.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
            ], { duration: 700, easing: 'ease-out', fill: 'forwards' }).onfinish = () => spark.remove();
        }
    }
    
    // パーティクル（重力で落下）
    function createParticle(cx, cy, angle, speed, color, size, duration) {
        const p = document.createElement('div');
        p.className = 'fw-particle';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.background = color;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        container.appendChild(p);
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const gravity = 60;
        
        // 物理演算でキーフレーム生成
        const frames = [];
        const steps = 25;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const time = t * (duration / 1000);
            const x = vx * time * 0.7;
            const y = vy * time * 0.7 + 0.5 * gravity * time * time;
            const scale = 1 - t * 0.6;
            const opacity = 1 - t * 0.9;
            frames.push({
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                opacity: opacity
            });
        }
        
        p.animate(frames, {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        }).onfinish = () => p.remove();
        
        // 尾を引く
        let tailCount = 0;
        const tailInterval = setInterval(() => {
            tailCount++;
            if (tailCount > 10) {
                clearInterval(tailInterval);
                return;
            }
            
            const progress = tailCount / 10;
            const time = progress * (duration / 1000) * 0.4;
            const tx = cx + vx * time * 0.7;
            const ty = cy + vy * time * 0.7 + 0.5 * gravity * time * time;
            
            const tail = document.createElement('div');
            tail.className = 'fw-particle';
            tail.style.width = (size * 0.5) + 'px';
            tail.style.height = (size * 0.5) + 'px';
            tail.style.background = color;
            tail.style.left = tx + 'px';
            tail.style.top = ty + 'px';
            container.appendChild(tail);
            
            tail.animate([
                { opacity: 0.7, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.3)' }
            ], { duration: 400, fill: 'forwards' }).onfinish = () => tail.remove();
        }, 80);
    }
    
    // 8発の花火を打ち上げ（ゆっくり間隔）
    const launchPositions = [0.3, 0.7, 0.5, 0.25, 0.75, 0.4, 0.6, 0.5];
    launchPositions.forEach((xRatio, i) => {
            setTimeout(() => {
            launchFirework(W * xRatio + (Math.random() - 0.5) * 30);
        }, i * 700);
    });
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
                completionProgressBar.classList.remove('completion-progress-complete', 'completion-progress-complete-card', 'completion-progress-complete-input');
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
    } else if (category === 'LEVEL1 超重要単語400' || category === 'LEVEL2 重要単語300' || category === 'LEVEL3 差がつく単語200' || 
               category === 'LEVEL4 私立高校入試レベル' || category === 'LEVEL5 難関私立高校入試レベル') {
        // レベル別単語：vocabulary-data.jsから取得
        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === category);
    } else {
            showCategorySelection();
            return;
        }
    } else {
        // vocabulary-data.jsから取得を試みる
        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === category);
        } else {
            // フォールバック：wordDataから検索
            categoryWords = wordData.filter(word => word.category === category);
        }
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
    // 今回のセッションで間違えた単語を取得（questionStatusを使用）
    const wrongWordsInSession = currentWords.filter((word, index) => {
        return questionStatus[index] === 'wrong';
    });
    
    // 間違えた単語がない場合は、完了画面を閉じずに通知を表示
    if (wrongWordsInSession.length === 0) {
        showAlert('通知', '覚えていない単語はありません');
        return;
    }
    
    // 現在表示されている学習画面を非表示にする
    const handwritingQuizView = document.getElementById('handwritingQuizView');
    const inputMode = document.getElementById('inputMode');
    const cardTopSection = document.querySelector('.card-top-section');
    const wordCard = document.getElementById('wordCard');
    if (handwritingQuizView) handwritingQuizView.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (cardTopSection) cardTopSection.classList.add('hidden');
    if (wordCard) wordCard.classList.add('hidden');
    
    // 先に復習画面を表示してから、完了画面を閉じる（一瞬他の画面が見えないようにする）
    showInputModeDirectly(selectedCategory, wrongWordsInSession, currentFilterCourseTitle || selectedCategory);
    
    // 復習画面が表示された後で完了画面を閉じる
    hideCompletion();
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
                
                // 四択問題モードの場合
                if (isChoiceQuestionModeActive) {
                    currentChoiceQuestionIndex = absoluteIndex;
                    choiceAnswerSubmitted = false;
                    displayCurrentChoiceQuestion();
                    updateStats();
                    updateNavButtons();
                    return;
                }
                
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
    if (isChoiceQuestionModeActive) {
        currentQuestionIndex = currentChoiceQuestionIndex - currentRangeStart;
    } else if (isReorderModeActive) {
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
    // テストモードかどうかを判定
    let total;
    let currentQuestionIndex;
    
    {
        // 通常モードの場合
        total = currentRangeEnd - currentRangeStart;
        // モードに応じて現在のインデックスを取得
        if (isChoiceQuestionModeActive) {
            currentQuestionIndex = currentChoiceQuestionIndex - currentRangeStart;
        } else if (isReorderModeActive) {
            currentQuestionIndex = currentReorderIndex - currentRangeStart;
        } else if (isSentenceModeActive) {
            currentQuestionIndex = currentSentenceIndex - currentRangeStart;
        } else {
            currentQuestionIndex = currentIndex - currentRangeStart;
        }
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
    let total;
    let currentPosition;
    let relativeIndex;
    
    {
        // 通常モードの場合
        total = currentRangeEnd - currentRangeStart;
        // 現在見ている英単語の位置（1から始まる）
        currentPosition = currentIndex + 1;
        relativeIndex = currentIndex - currentRangeStart;
    }
    
    // 共通の進捗テキストを更新
    if (elements.progressText) {
        elements.progressText.textContent = `${currentPosition} / ${total}`;
    }
    
    // テストモード用の進捗表示も更新
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress && document.body.classList.contains('quiz-test-mode')) {
        testModeProgress.textContent = `${currentPosition}/${total}`;
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
            
            
            // 画面を更新
            if (elements.categorySelection && !elements.categorySelection.classList.contains('hidden')) {
                loadData();
                updateCategoryStars();
            }
            
            // 進捗バーを更新
            updateVocabProgressBar();
            
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
    SoundEffects.playClose();
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
    
    // ハンバーガーメニューと戻るボタンを非表示、ポーズボタンを表示（テストモード）
    updateHeaderButtons('learning', '', true);

    // インプットモード用戻るボタンとポーズボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');
    if (unitPauseBtn) unitPauseBtn.classList.remove('hidden');

    // カードモード、入力モード、整序英作文モードを非表示、例文モードを表示
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const inputMode = document.getElementById('inputMode');
    const inputListView = document.getElementById('inputListView');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (inputListView) inputListView.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.remove('hidden');
    // モードフラグをリセット
    isInputModeActive = false;
    isReorderModeActive = false;
    isChoiceQuestionModeActive = false;
    document.body.classList.remove('choice-question-mode-active');
    if (cardHint) cardHint.classList.add('hidden');
    // 例文モードのときは進捗バーのボタンを表示（テキストは「前の問題へ・次の問題へ」に変更）
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    updateNavButtons(); // ボタンのテキストと状態を更新
    
    // 進捗バーを初期化
    initSentenceProgressBar();
    
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

// 厳選例文暗記モードの進捗バーを初期化
function initSentenceProgressBar() {
    const container = document.getElementById('sentenceProgressBarContainer');
    const rangeEl = document.getElementById('sentenceProgressRange');
    const progressText = document.getElementById('sentenceProgressText');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 最大20セグメント表示
    const maxSegments = Math.min(sentenceData.length, 20);
    
    for (let i = 0; i < maxSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        container.appendChild(segment);
    }
    
    // 問題番号の範囲を表示
    if (rangeEl && sentenceData.length > 0) {
        const firstId = sentenceData[0].id || 1;
        const lastId = sentenceData[Math.min(19, sentenceData.length - 1)].id || Math.min(20, sentenceData.length);
        rangeEl.textContent = `No.${firstId}-${lastId}`;
    }
    
    // 進捗テキストを更新
    if (progressText) {
        progressText.textContent = `0/${sentenceData.length}`;
    }
    
    // 統計をリセット
    const correctEl = document.getElementById('sentenceCorrectCount');
    const wrongEl = document.getElementById('sentenceWrongCount');
    if (correctEl) correctEl.textContent = '0';
    if (wrongEl) wrongEl.textContent = '0';
}

// 厳選例文暗記モードの進捗バーを更新
function updateSentenceProgressBar() {
    const container = document.getElementById('sentenceProgressBarContainer');
    const progressText = document.getElementById('sentenceProgressText');
    const correctEl = document.getElementById('sentenceCorrectCount');
    const wrongEl = document.getElementById('sentenceWrongCount');
    
    if (!container) return;
    
    const segments = container.querySelectorAll('.progress-segment');
    let sentenceCorrect = 0;
    let sentenceWrong = 0;
    
    segments.forEach((segment, i) => {
        segment.classList.remove('current', 'correct', 'wrong');
        
        if (i === currentSentenceIndex) {
            segment.classList.add('current');
        } else if (questionStatus[i] === 'correct') {
            segment.classList.add('correct');
            sentenceCorrect++;
        } else if (questionStatus[i] === 'wrong') {
            segment.classList.add('wrong');
            sentenceWrong++;
        }
    });
    
    // 進捗テキストを更新
    if (progressText) {
        const answered = sentenceCorrect + sentenceWrong;
        progressText.textContent = `${answered}/${sentenceData.length}`;
    }
    
    // 統計を更新
    if (correctEl) correctEl.textContent = String(sentenceCorrect);
    if (wrongEl) wrongEl.textContent = String(sentenceWrong);
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
    
    // 進捗バーを更新
    updateSentenceProgressBar();
    
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
    
    // 選択中の空所がない場合は、最初の未入力の空所を選択（最初の入力時のみ）
    if (!currentBlank) {
        currentBlank = sentenceBlanks.find(b => !b.userInput || b.userInput.length < b.word.length);
        if (currentBlank) {
            selectSentenceBlank(currentBlank.index);
        } else {
            // すべての空所が埋まっている場合は何もしない
            return;
        }
    }
    
    // 選択中の空所が入力完了している場合は何もしない（ユーザーが手動で次の空所を選択する必要がある）
    if (currentBlank.userInput.length >= currentBlank.word.length) {
        return;
    }
    
    if (currentBlank && currentBlank.userInput.length < currentBlank.word.length) {
        let letterToInsert;
        if (letter === ' ') {
            letterToInsert = ' ';
        } else {
            if (isShiftActive) {
                letterToInsert = String(letter).toUpperCase();
                // ボタンを離したときにシフトを解除するためフラグを設定
                window.pendingShiftReset = 'sentenceKeyboard';
            } else {
                letterToInsert = String(letter).toLowerCase();
            }
        }
        
        currentBlank.userInput += letterToInsert;
        
        // 空所の表示を更新（入力済みの文字 + 残りのスペース）
        const remainingLength = currentBlank.word.length - currentBlank.userInput.length;
        currentBlank.element.textContent = currentBlank.userInput + (remainingLength > 0 ? ' '.repeat(remainingLength) : '');
        
        // 入力が完了しても自動的に次の空所には移動しない（ユーザーが手動で選択する必要がある）
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
    const keyboard = document.getElementById('sentenceKeyboard');
    if (shiftKey) {
        if (isShiftActive) {
            shiftKey.classList.add('active');
        } else {
            shiftKey.classList.remove('active');
        }
    }
    // キーボードにshift-activeクラスを追加/削除（ポップアップ用）
    if (keyboard) {
        keyboard.classList.toggle('shift-active', isShiftActive);
        // キーボードの表示を更新（大文字/小文字）
        keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
            const letter = key.dataset.key;
            if (letter && letter !== ' ') {
                if (isShiftActive) {
                    key.textContent = letter.toUpperCase();
                    key.dataset.key = letter.toUpperCase();
                } else {
                    key.textContent = letter.toLowerCase();
                    key.dataset.key = letter.toLowerCase();
                }
            }
        });
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
    
    // 効果音を再生
    if (isCorrect) {
        SoundEffects.playCorrect();
        correctCount++;
        questionStatus[currentSentenceIndex] = 'correct';
    } else {
        SoundEffects.playWrong();
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
    
    // ハンバーガーメニューと戻るボタンを非表示、ポーズボタンを表示（テストモード）
    updateHeaderButtons('learning', '', true);

    // インプットモード用戻るボタンとポーズボタンの制御
    const inputBackBtn = document.getElementById('inputBackBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');
    if (unitPauseBtn) unitPauseBtn.classList.remove('hidden');

    // 他のモードを非表示、整序英作文モードを表示
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const inputMode = document.getElementById('inputMode');
    const inputListView = document.getElementById('inputListView');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.querySelector('.progress-step-buttons');
    const choiceMode = document.getElementById('choiceQuestionMode');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (inputListView) inputListView.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.remove('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    isChoiceQuestionModeActive = false;
    document.body.classList.remove('choice-question-mode-active');
    updateNavButtons(); // ボタンのテキストと状態を更新
    
    displayCurrentReorderQuestion();
    // 進捗バーのセグメントを生成
    const total = currentRangeEnd - currentRangeStart;
    if (total > 0) {
        createProgressSegments(total);
    }
    updateStats();
    updateNavState('learning');
    
    // 進捗バーを初期化
    initReorderProgressBar();
}

// 整序英作文モードの進捗バーを初期化
function initReorderProgressBar() {
    const container = document.getElementById('reorderProgressBarContainer');
    const rangeEl = document.getElementById('reorderProgressRange');
    const progressText = document.getElementById('reorderProgressText');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 最大20セグメント表示
    const maxSegments = Math.min(reorderData.length, 20);
    
    for (let i = 0; i < maxSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        container.appendChild(segment);
    }
    
    // 問題番号の範囲を表示
    if (rangeEl && reorderData.length > 0) {
        const firstId = reorderData[0].id || 1;
        const lastId = reorderData[Math.min(19, reorderData.length - 1)].id || Math.min(20, reorderData.length);
        rangeEl.textContent = `No.${firstId}-${lastId}`;
    }
    
    // 進捗テキストを更新
    if (progressText) {
        progressText.textContent = `0/${reorderData.length}`;
    }
    
    // 統計をリセット
    const correctEl = document.getElementById('reorderCorrectCount');
    const wrongEl = document.getElementById('reorderWrongCount');
    if (correctEl) correctEl.textContent = '0';
    if (wrongEl) wrongEl.textContent = '0';
}

// 整序英作文モードの進捗バーを更新
function updateReorderProgressBar() {
    const container = document.getElementById('reorderProgressBarContainer');
    const progressText = document.getElementById('reorderProgressText');
    const correctEl = document.getElementById('reorderCorrectCount');
    const wrongEl = document.getElementById('reorderWrongCount');
    
    if (!container) return;
    
    const segments = container.querySelectorAll('.progress-segment');
    let reorderCorrect = 0;
    let reorderWrong = 0;
    
    segments.forEach((segment, i) => {
        segment.classList.remove('current', 'correct', 'wrong');
        
        if (i === currentReorderIndex) {
            segment.classList.add('current');
        } else if (questionStatus[i] === 'correct') {
            segment.classList.add('correct');
            reorderCorrect++;
        } else if (questionStatus[i] === 'wrong') {
            segment.classList.add('wrong');
            reorderWrong++;
        }
    });
    
    // 進捗テキストを更新
    if (progressText) {
        const answered = reorderCorrect + reorderWrong;
        progressText.textContent = `${answered}/${reorderData.length}`;
    }
    
    // 統計を更新
    if (correctEl) correctEl.textContent = String(reorderCorrect);
    if (wrongEl) wrongEl.textContent = String(reorderWrong);
}

// 現在の整序英作文問題を表示
function displayCurrentReorderQuestion() {
    if (currentReorderIndex < 0 || currentReorderIndex >= reorderData.length) {
        return;
    }
    
    // 進捗バーを更新
    updateReorderProgressBar();
    
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
    
    // 統計を更新と効果音
    if (isCorrect) {
        SoundEffects.playCorrect();
        correctCount++;
        questionStatus[currentReorderIndex] = 'correct';
    } else {
        SoundEffects.playWrong();
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

// ================================
// 四択問題モード
// ================================

// 四択問題モードで学習を初期化
function initChoiceQuestionLearning(category) {
    // choiceQuestionsが定義されているか確認
    if (typeof choiceQuestions === 'undefined') {
        showAlert('エラー', '四択問題のデータファイルが読み込まれていません。ページを再読み込みしてください。');
        console.error('choiceQuestions is undefined in initChoiceQuestionLearning');
        return;
    }
    if (!choiceQuestions || choiceQuestions.length === 0) {
        showAlert('エラー', '四択問題のデータが空です。');
        console.error('choiceQuestions is empty in initChoiceQuestionLearning');
        return;
    }
    
    selectedCategory = category;
    choiceQuestionData = choiceQuestions;
    isChoiceQuestionModeActive = true;
    isReorderModeActive = false;
    isSentenceModeActive = false;
    isInputModeActive = false;
    document.body.classList.add('choice-question-mode-active');
    document.body.classList.remove('reorder-mode-active', 'sentence-mode-active');
    currentChoiceQuestionIndex = 0;
    choiceAnswerSubmitted = false;
    selectedChoiceIndex = -1;
    
    currentRangeStart = 0;
    currentRangeEnd = choiceQuestionData.length;
    currentIndex = 0;
    
    answeredWords.clear();
    correctCount = 0;
    wrongCount = 0;
    questionStatus = new Array(choiceQuestionData.length).fill(null);
    
    // 前回の回答状況を読み込んで進捗バーに反映
    if (category) {
        const { correctSet, wrongSet } = loadCategoryWords(category);
        choiceQuestionData.forEach((question, index) => {
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
    
    // タイトルを設定
    if (elements.unitName) {
        elements.unitName.textContent = 'C問題対策 大問1整序英作文【四択問題】';
    }
    
    // テーマカラーを更新
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    
    // ヘッダーボタンを更新
    updateHeaderButtons('learning', '', true);
    
    // 四択問題モードではメモボタンとテストボタンを非表示、×ボタンのみ表示
    const memoPadBtn = document.getElementById('memoPadBtn');
    const unitTestBtn = document.getElementById('unitTestBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    const inputBackBtn = document.getElementById('inputBackBtn');
    if (memoPadBtn) memoPadBtn.classList.add('hidden');
    if (unitTestBtn) unitTestBtn.classList.add('hidden');
    if (unitPauseBtn) unitPauseBtn.classList.remove('hidden');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');
    
    // 各モードの表示制御
    const cardMode = document.querySelector('.word-card-wrapper');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const choiceMode = document.getElementById('choiceQuestionMode');
    const cardHint = document.getElementById('cardHint');
    const progressStepButtons = document.getElementById('progressStepButtons');
    
    if (cardMode) cardMode.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.remove('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    if (progressStepButtons) progressStepButtons.classList.remove('hidden');
    
    // 進捗バーを初期化
    initChoiceProgressBar();
    
    // 最初の問題を表示
    displayCurrentChoiceQuestion();
    
    // スクロール位置をトップに戻す
    window.scrollTo(0, 0);
}

// 四択問題の進捗バーを初期化
function initChoiceProgressBar() {
    const container = document.getElementById('choiceProgressBarContainer');
    const rangeEl = document.getElementById('choiceProgressRange');
    const progressText = document.getElementById('choiceProgressText');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 最大20セグメント表示
    const maxSegments = Math.min(choiceQuestionData.length, 20);
    
    for (let i = 0; i < maxSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        container.appendChild(segment);
    }
    
    // 問題番号の範囲を表示
    if (rangeEl && choiceQuestionData.length > 0) {
        const firstId = choiceQuestionData[0].id || 1;
        const lastId = choiceQuestionData[Math.min(19, choiceQuestionData.length - 1)].id || Math.min(20, choiceQuestionData.length);
        rangeEl.textContent = `No.${firstId}-${lastId}`;
    }
    
    // 進捗テキストを更新
    if (progressText) {
        progressText.textContent = `0/${choiceQuestionData.length}`;
    }
    
    // 統計をリセット
    const correctCountEl = document.getElementById('choiceCorrectCount');
    const wrongCountEl = document.getElementById('choiceWrongCount');
    if (correctCountEl) correctCountEl.textContent = '0';
    if (wrongCountEl) wrongCountEl.textContent = '0';
}

// 四択問題の進捗バーを更新
function updateChoiceProgressBar() {
    const container = document.getElementById('choiceProgressBarContainer');
    const progressText = document.getElementById('choiceProgressText');
    
    if (!container) return;
    
    const segments = container.querySelectorAll('.progress-segment');
    let choiceCorrect = 0;
    let choiceWrong = 0;
    
    segments.forEach((segment, index) => {
        segment.classList.remove('current', 'correct', 'wrong');
        
        if (index < questionStatus.length) {
            if (questionStatus[index] === 'correct') {
                segment.classList.add('correct');
                choiceCorrect++;
            } else if (questionStatus[index] === 'wrong') {
                segment.classList.add('wrong');
                choiceWrong++;
            }
        }
        
        if (index === currentChoiceQuestionIndex) {
            segment.classList.add('current');
        }
    });
    
    // 進捗テキストを更新
    if (progressText) {
        const answered = choiceCorrect + choiceWrong;
        progressText.textContent = `${answered}/${choiceQuestionData.length}`;
    }
    
    // 統計を更新
    const correctCountEl = document.getElementById('choiceCorrectCount');
    const wrongCountEl = document.getElementById('choiceWrongCount');
    if (correctCountEl) correctCountEl.textContent = choiceCorrect;
    if (wrongCountEl) wrongCountEl.textContent = choiceWrong;
}

// 現在の四択問題を表示
function displayCurrentChoiceQuestion() {
    if (currentChoiceQuestionIndex < 0 || currentChoiceQuestionIndex >= choiceQuestionData.length) {
        return;
    }
    
    // 進捗バーを更新
    updateChoiceProgressBar();
    
    const question = choiceQuestionData[currentChoiceQuestionIndex];
    const questionNumberEl = document.getElementById('choiceQuestionNumber');
    const questionTextEl = document.getElementById('choiceQuestionText');
    const optionsContainer = document.getElementById('choiceOptionsContainer');
    const explanationContainer = document.getElementById('choiceExplanationContainer');
    const nextBtnContainer = document.getElementById('choiceNextBtnContainer');
    
    // 問題番号を表示
    if (questionNumberEl) {
        questionNumberEl.textContent = `問題 ${question.id}`;
    }
    
    // 問題文を表示
    if (questionTextEl) {
        questionTextEl.textContent = question.question;
    }
    
    // 選択肢を生成
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        question.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-option-btn';
            btn.dataset.choiceIndex = index;
            btn.innerHTML = `
                <span class="choice-label">${choice.label}</span>
                <span class="choice-text">${choice.text}</span>
            `;
            btn.addEventListener('click', () => selectChoiceOption(index));
            optionsContainer.appendChild(btn);
        });
    }
    
    // 解説と次へボタンを非表示
    if (explanationContainer) {
        explanationContainer.classList.add('hidden');
        explanationContainer.classList.remove('correct-answer', 'wrong-answer');
    }
    if (nextBtnContainer) {
        nextBtnContainer.classList.add('hidden');
    }
    
    // 状態をリセット
    choiceAnswerSubmitted = false;
    selectedChoiceIndex = -1;
    
    // ステップボタンの状態を更新
    updateNavButtons();
}

// 選択肢を選択
function selectChoiceOption(index) {
    if (choiceAnswerSubmitted) return;
    
    const optionsContainer = document.getElementById('choiceOptionsContainer');
    if (!optionsContainer) return;
    
    // 選択状態をリセット
    const allBtns = optionsContainer.querySelectorAll('.choice-option-btn');
    allBtns.forEach(btn => btn.classList.remove('selected'));
    
    // 選択した選択肢をハイライト
    const selectedBtn = optionsContainer.querySelector(`[data-choice-index="${index}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    selectedChoiceIndex = index;
    
    // 自動的に回答を送信
    submitChoiceAnswer();
}

// 四択問題の回答を送信
function submitChoiceAnswer() {
    if (choiceAnswerSubmitted || selectedChoiceIndex === -1) return;
    
    choiceAnswerSubmitted = true;
    
    const question = choiceQuestionData[currentChoiceQuestionIndex];
    const isCorrect = selectedChoiceIndex === question.correctIndex;
    
    const optionsContainer = document.getElementById('choiceOptionsContainer');
    const explanationContainer = document.getElementById('choiceExplanationContainer');
    const resultIcon = document.getElementById('choiceResultIcon');
    const resultText = document.getElementById('choiceResultText');
    const explanationContent = document.getElementById('choiceExplanationContent');
    const nextBtnContainer = document.getElementById('choiceNextBtnContainer');
    
    // すべての選択肢を無効化
    const allBtns = optionsContainer.querySelectorAll('.choice-option-btn');
    allBtns.forEach(btn => btn.classList.add('disabled'));
    
    // 正解・不正解のスタイルを適用
    const selectedBtn = optionsContainer.querySelector(`[data-choice-index="${selectedChoiceIndex}"]`);
    const correctBtn = optionsContainer.querySelector(`[data-choice-index="${question.correctIndex}"]`);
    
    if (isCorrect) {
        if (selectedBtn) selectedBtn.classList.add('correct');
        SoundEffects.playCorrect();
        correctCount++;
        questionStatus[currentChoiceQuestionIndex] = 'correct';
    } else {
        if (selectedBtn) selectedBtn.classList.add('wrong');
        if (correctBtn) correctBtn.classList.add('correct');
        SoundEffects.playWrong();
        wrongCount++;
        questionStatus[currentChoiceQuestionIndex] = 'wrong';
    }
    
    // 進捗を保存
    saveChoiceProgress(question.id, isCorrect);
    
    // 進捗バーを更新
    updateChoiceProgressBar();
    
    // 解説を表示
    if (explanationContainer) {
        explanationContainer.classList.remove('hidden', 'correct-answer', 'wrong-answer');
        explanationContainer.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    }
    
    if (resultIcon) {
        resultIcon.textContent = isCorrect ? '○' : '×';
    }
    
    if (resultText) {
        resultText.textContent = isCorrect ? '正解！' : `不正解 正解は「${question.correctLabel}」`;
    }
    
    if (explanationContent) {
        explanationContent.textContent = question.explanation;
    }
    
    // 次の問題へボタンを表示
    if (nextBtnContainer) {
        nextBtnContainer.classList.remove('hidden');
    }
    
    // 画面全体のフィードバック表示
    if (elements.feedbackOverlay) {
        elements.feedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            elements.feedbackOverlay.classList.remove('active');
        }, 400);
    }
}

// 四択問題の進捗を保存
function saveChoiceProgress(questionId, isCorrect) {
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

// 次の四択問題へ
function moveToNextChoiceQuestion() {
    if (currentChoiceQuestionIndex < choiceQuestionData.length - 1) {
        currentChoiceQuestionIndex++;
        currentIndex = currentChoiceQuestionIndex;
        displayCurrentChoiceQuestion();
    } else {
        // 最後の問題の場合は完了画面を表示
        showCompletionScreen();
    }
}

// 前の四択問題へ
function moveToPrevChoiceQuestion() {
    if (currentChoiceQuestionIndex > 0) {
        currentChoiceQuestionIndex--;
        currentIndex = currentChoiceQuestionIndex;
        displayCurrentChoiceQuestion();
    }
}

// 四択問題の次へボタンイベント
document.addEventListener('click', function(e) {
    if (e.target.id === 'choiceNextBtn' || e.target.closest('#choiceNextBtn')) {
        moveToNextChoiceQuestion();
    }
});

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
                // 大文字を入力した場合は、ボタンを離したときにシフトを解除するためフラグを設定
                if (currentShift && letter.match(/[a-z]/) && charToInsert === letter.toUpperCase()) {
                    window.pendingShiftReset = 'grammarExerciseKeyboard';
                    window.grammarExerciseResetShiftState = resetShiftState;
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
    // キーボードにshift-activeクラスを追加/削除（ポップアップ用）
    keyboard.classList.toggle('shift-active', isShift);
    
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        const keyValue = key.dataset.key;
        if (keyValue && keyValue.length === 1 && keyValue.match(/[a-z]/i)) {
            const newValue = isShift ? keyValue.toUpperCase() : keyValue.toLowerCase();
            key.textContent = newValue;
            key.dataset.key = newValue; // ポップアップ用にdata-keyも更新
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

// =============================================
// 手書き入力クイズモード（日本語→英語専用）
// =============================================

// 解答ボタンを現在のDOMにバインドするヘルパー
function bindHWQuizSubmitButton() {
    const btn = document.querySelector('.hw-answer-btn');
    if (!btn) return;
    const handler = (e) => {
        e.preventDefault();
        submitHWQuizAnswer();
    };
    btn.onclick = handler;
    btn.ontouchend = handler;
}

// 手書きクイズの状態管理
let hwQuizWords = [];
let hwQuizIndex = 0;
let hwQuizCategory = '';
let hwQuizCourseTitle = '';
let hwQuizAnswerSubmitted = false;
let hwQuizConfirmedText = '';
let hwQuizCanvas = null;
let hwQuizCtx = null;
let hwQuizIsDrawing = false;
let hwQuizLastX = 0;
let hwQuizLastY = 0;
let hwQuizDrawTimeout = null;
let hwQuizResults = []; // 各問題の結果を記録: 'correct', 'wrong', null
let hwQuizCorrectCount = 0;
let hwQuizWrongCount = 0;

/**
 * 手書きクイズモードを開始
 */
async function startHandwritingQuiz(category, words, courseTitle) {
    console.log('[HWQuiz] Starting handwriting quiz with', words.length, 'words');
    
    // 日本語→英語モードなので、selectedLearningModeを'input'に設定
    // これにより、進捗が_inputキーで保存される
    selectedLearningMode = 'input';
    
    hwQuizWords = words;
    hwQuizIndex = 0;
    hwQuizCategory = category;
    hwQuizCourseTitle = courseTitle;
    hwQuizResults = new Array(words.length).fill(null);
    hwQuizCorrectCount = 0;
    hwQuizWrongCount = 0;
    hwQuizInputMode = 'typing'; // デフォルトはタイピングモード
    hwKeyboardShiftActive = false;
    
    // 手書きクイズ画面を表示
    const hwQuizView = document.getElementById('handwritingQuizView');
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection) categorySelection.classList.add('hidden');
    if (hwQuizView) hwQuizView.classList.remove('hidden');
    
    // UIを初期化
    const mainEl = hwQuizView.querySelector('.hw-main');
    if (mainEl) {
        mainEl.innerHTML = `
            <!-- 問題（シンプル表示） -->
            <div class="hw-question-simple">
                <span class="pos-inline part-of-speech" id="hwQuizPos"></span>
                <span class="hw-question-meaning" id="hwQuizMeaning">意味</span>
            </div>
            
            <!-- 回答エリア -->
            <div class="hw-answer-area">
                <div class="hw-answer" id="hwQuizAnswerDisplay">
                    <span class="hw-answer-text"></span>
                </div>
                <!-- 正解表示用のプレースホルダー -->
                <div id="hwQuizCorrectAnswerPlaceholder"></div>
            </div>
            
            <!-- 結果表示 -->
            <div class="hw-result hidden" id="hwQuizResult">
                <div class="hw-result-badge" id="hwQuizResultIcon"></div>
                <div class="hw-result-word">
                    <span id="hwQuizCorrectWord"></span>
                    <button class="hw-audio-btn" id="hwQuizAudioBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    // 下部固定エリアを初期化
    const inputFixedEl = hwQuizView.querySelector('.hw-input-fixed-bottom');
    if (inputFixedEl) {
        inputFixedEl.innerHTML = `
            <!-- キャンバス（手書きモード用） -->
            <div class="hw-canvas-area" id="hwCanvasArea">
                <div class="hw-canvas-wrapper">
                    <div class="hw-canvas-label">手書き入力欄</div>
                    <div class="hw-canvas-lines"></div>
                    <canvas id="hwQuizCanvas" class="hw-canvas" width="500" height="180"></canvas>
                </div>
                <!-- 手書きモード用のボタン -->
                <div class="hw-canvas-buttons">
                    <button class="hw-space-btn" id="hwQuizHandwritingSpaceBtn" type="button">
                        <span>空白</span>
                    </button>
                    <button class="hw-backspace-btn" id="hwQuizBackspaceBtn" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                            <line x1="18" y1="9" x2="12" y2="15"></line>
                            <line x1="12" y1="9" x2="18" y2="15"></line>
                        </svg>
                        <span>1文字消す</span>
                    </button>
                </div>
            </div>
            
            <!-- 認識候補 -->
            <div class="hw-candidates" id="hwQuizPredictions"></div>
            
            <!-- 仮想キーボード（タイピングモード用） -->
            <div class="virtual-keyboard hidden" id="hwVirtualKeyboard">
                <div class="keyboard-row">
                    <button class="keyboard-key" data-key="q">q</button>
                    <button class="keyboard-key" data-key="w">w</button>
                    <button class="keyboard-key" data-key="e">e</button>
                    <button class="keyboard-key" data-key="r">r</button>
                    <button class="keyboard-key" data-key="t">t</button>
                    <button class="keyboard-key" data-key="y">y</button>
                    <button class="keyboard-key" data-key="u">u</button>
                    <button class="keyboard-key" data-key="i">i</button>
                    <button class="keyboard-key" data-key="o">o</button>
                    <button class="keyboard-key" data-key="p">p</button>
                </div>
                <div class="keyboard-row">
                    <button class="keyboard-key" data-key="a">a</button>
                    <button class="keyboard-key" data-key="s">s</button>
                    <button class="keyboard-key" data-key="d">d</button>
                    <button class="keyboard-key" data-key="f">f</button>
                    <button class="keyboard-key" data-key="g">g</button>
                    <button class="keyboard-key" data-key="h">h</button>
                    <button class="keyboard-key" data-key="j">j</button>
                    <button class="keyboard-key" data-key="k">k</button>
                    <button class="keyboard-key" data-key="l">l</button>
                    <button class="keyboard-key keyboard-key-space" data-key=" ">_</button>
                </div>
                <div class="keyboard-row">
                    <button class="keyboard-key keyboard-key-shift" id="hwKeyboardShift" data-shift="false">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                    <button class="keyboard-key" data-key="z">z</button>
                    <button class="keyboard-key" data-key="x">x</button>
                    <button class="keyboard-key" data-key="c">c</button>
                    <button class="keyboard-key" data-key="v">v</button>
                    <button class="keyboard-key" data-key="b">b</button>
                    <button class="keyboard-key" data-key="n">n</button>
                    <button class="keyboard-key" data-key="m">m</button>
                    <button class="keyboard-key" data-key="'">'</button>
                    <button class="keyboard-key keyboard-key-special" id="hwKeyboardBackspace">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                            <line x1="18" y1="9" x2="12" y2="15"></line>
                            <line x1="12" y1="9" x2="18" y2="15"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- 解答ボタン -->
            <div class="keyboard-actions">
                <button class="keyboard-action-btn" id="hwQuizPassBtn" type="button">パス</button>
                <button class="keyboard-action-btn keyboard-action-btn-primary hw-answer-btn" type="button" onclick="submitHWQuizAnswer()">解答</button>
            </div>
        `;

        bindHWQuizSubmitButton();
    }
    
    // 単元名を設定（テストモードでは非表示）
    const unitName = document.getElementById('hwQuizUnitName');
    if (unitName) {
        unitName.textContent = courseTitle || '日本語→英語';
        unitName.classList.add('hidden');
    }
    
    // テストモード用のUIを有効化（白背景ヘッダー、中央に進捗表示）
    document.body.classList.add('quiz-test-mode');
    document.body.classList.add('learning-mode');
    const hwTestModeProgress = document.getElementById('hwTestModeProgress');
    if (hwTestModeProgress) {
        hwTestModeProgress.classList.remove('hidden');
        hwTestModeProgress.textContent = `1/${words.length}`;
    }
    // ステータスバーを白に
    updateThemeColorForTest(true);
    
    // 進捗セグメントを初期化
    initHWQuizProgressSegments();
    
    // キャンバスを初期化
    initHWQuizCanvas();
    
    // イベントリスナーを設定
    setupHWQuizEvents();
    
    // 最初の問題を表示
    displayHWQuizQuestion();
    
    // モデルをロード
    await loadHWQuizModel();
}

/**
 * 進捗セグメントを初期化
 */
function initHWQuizProgressSegments() {
    const container = document.getElementById('hwQuizProgressBarContainer');
    const rangeEl = document.getElementById('hwQuizProgressRange');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 最大20セグメント表示
    const maxSegments = Math.min(hwQuizWords.length, 20);
    
    for (let i = 0; i < maxSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.dataset.index = i;
        if (i === 0) segment.classList.add('current');
        container.appendChild(segment);
    }
    
    // 範囲テキストを設定
    if (rangeEl && hwQuizWords.length > 0) {
        const firstWord = hwQuizWords[0];
        const lastWord = hwQuizWords[hwQuizWords.length - 1];
        rangeEl.textContent = `No.${firstWord.id}-${lastWord.id}`;
    }
    
    // 統計をリセット
    updateHWQuizStats();
}

/**
 * 進捗セグメントを更新
 */
function updateHWQuizProgressSegments() {
    const container = document.getElementById('hwQuizProgressBarContainer');
    if (!container) return;
    
    const segments = container.querySelectorAll('.progress-segment');
    segments.forEach((segment, i) => {
        segment.classList.remove('current', 'correct', 'wrong');
        
        if (i === hwQuizIndex) {
            segment.classList.add('current');
        } else if (hwQuizResults[i] === 'correct') {
            segment.classList.add('correct');
        } else if (hwQuizResults[i] === 'wrong') {
            segment.classList.add('wrong');
        }
    });
}

/**
 * 統計を更新
 */
function updateHWQuizStats() {
    const correctEl = document.getElementById('hwQuizCorrectCount');
    const wrongEl = document.getElementById('hwQuizWrongCount');
    const progressEl = document.getElementById('hwQuizProgressText');
    
    if (correctEl) correctEl.textContent = hwQuizCorrectCount;
    if (wrongEl) wrongEl.textContent = hwQuizWrongCount;
    if (progressEl) progressEl.textContent = `${hwQuizIndex + 1}/${hwQuizWords.length}`;
    
    // テストモード用の進捗表示も更新
    const hwTestModeProgress = document.getElementById('hwTestModeProgress');
    if (hwTestModeProgress && document.body.classList.contains('quiz-test-mode')) {
        hwTestModeProgress.textContent = `${hwQuizIndex + 1}/${hwQuizWords.length}`;
    }
}

/**
 * モデルをロード
 */
async function loadHWQuizModel() {
    const loadingEl = document.getElementById('hwQuizLoading');
    if (loadingEl) loadingEl.classList.add('hidden');
    
    const predictions = document.getElementById('hwQuizPredictions');
    
    if (!window.handwritingRecognition) {
        console.error('[HWQuiz] HandwritingRecognition not found');
        return;
    }
    
    if (window.handwritingRecognition.isModelLoaded) {
        if (predictions) {
            predictions.innerHTML = '';
        }
        return;
    }
    
    try {
        const result = await window.handwritingRecognition.loadModel();
        if (predictions) {
            if (result) {
                predictions.innerHTML = '';
            } else {
                const errorDetail = window.handwritingRecognition.getLastError ? 
                    window.handwritingRecognition.getLastError() : 'エラー';
                predictions.innerHTML = `<span class="hw-candidates-placeholder">${errorDetail}</span>`;
            }
        }
    } catch (error) {
        console.error('[HWQuiz] Model load error:', error);
    }
}

/**
 * キャンバスを初期化
 */
let hwQuizCanvasInitialized = false;

function initHWQuizCanvas() {
    hwQuizCanvas = document.getElementById('hwQuizCanvas');
    if (!hwQuizCanvas) {
        console.error('[HWQuiz] Canvas not found');
        return;
    }
    
    hwQuizCtx = hwQuizCanvas.getContext('2d');
    
    // 状態をリセット
    hwQuizIsDrawing = false;
    hwQuizIsRecognizing = false;
    
    clearHWQuizCanvas();
    
    // 既に初期化済みならイベント登録をスキップ
    if (hwQuizCanvasInitialized) {
        console.log('[HWQuiz] Canvas already initialized, context refreshed');
        return;
    }
    
    console.log('[HWQuiz] Initializing canvas events');
    
    // 描画イベント（マウス）
    hwQuizCanvas.addEventListener('mousedown', hwQuizDrawStart);
    hwQuizCanvas.addEventListener('mousemove', hwQuizDrawMove);
    hwQuizCanvas.addEventListener('mouseup', hwQuizDrawEnd);
    hwQuizCanvas.addEventListener('mouseleave', hwQuizDrawEnd);
    
    // 描画イベント（タッチ）
    hwQuizCanvas.addEventListener('touchstart', hwQuizDrawStart, { passive: false });
    hwQuizCanvas.addEventListener('touchmove', hwQuizDrawMove, { passive: false });
    hwQuizCanvas.addEventListener('touchend', hwQuizDrawEnd);
    hwQuizCanvas.addEventListener('touchcancel', hwQuizDrawEnd);
    
    hwQuizCanvasInitialized = true;
}

/**
 * キャンバスをクリア
 * 【精度向上ポイント】線の太さをEMNISTの学習データに合わせる
 * EMNISTは28x28ピクセルで線の太さは約2-3ピクセル
 * キャンバスが200x200の場合、200/28 ≈ 7.14 なので線幅10-12が適切
 */
function clearHWQuizCanvas() {
    if (!hwQuizCtx || !hwQuizCanvas) return;
    hwQuizCtx.fillStyle = '#ffffff';
    hwQuizCtx.fillRect(0, 0, hwQuizCanvas.width, hwQuizCanvas.height);
    hwQuizCtx.strokeStyle = '#000000'; // 黒で描画（反転前提）
    // 認識済みセグメント数をリセット
    hwQuizRecognizedSegments = 0;
    // キャンバスサイズに応じて線幅を動的調整（細め）
    const scaleFactor = hwQuizCanvas.width / 28;
    hwQuizCtx.lineWidth = Math.max(3, Math.round(scaleFactor * 0.8));
    hwQuizCtx.lineCap = 'round';
    hwQuizCtx.lineJoin = 'round';
}

/**
 * 描画開始
 */
function hwQuizDrawStart(e) {
    if (hwQuizAnswerSubmitted) return;
    
    // キャンバスコンテキストがない場合は再初期化
    if (!hwQuizCtx || !hwQuizCanvas) {
        hwQuizCanvas = document.getElementById('hwQuizCanvas');
        if (hwQuizCanvas) {
            hwQuizCtx = hwQuizCanvas.getContext('2d');
            clearHWQuizCanvas();
        }
        if (!hwQuizCtx) return;
    }
    
    e.preventDefault();
    hwQuizIsDrawing = true;
    
    const pos = getHWQuizPos(e);
    hwQuizLastX = pos.x;
    hwQuizLastY = pos.y;
    
    // タップした位置に点を描画（チョンとタップしただけでも描画されるように）
    hwQuizCtx.fillStyle = '#000000';
    hwQuizCtx.beginPath();
    hwQuizCtx.arc(pos.x, pos.y, hwQuizCtx.lineWidth / 2, 0, Math.PI * 2);
    hwQuizCtx.fill();
    
    if (hwQuizDrawTimeout) {
        clearTimeout(hwQuizDrawTimeout);
        hwQuizDrawTimeout = null;
    }
}

/**
 * 描画中
 */
function hwQuizDrawMove(e) {
    if (!hwQuizIsDrawing) return;
    if (!hwQuizCtx) return;
    e.preventDefault();
    
    const pos = getHWQuizPos(e);
    
    hwQuizCtx.beginPath();
    hwQuizCtx.moveTo(hwQuizLastX, hwQuizLastY);
    hwQuizCtx.lineTo(pos.x, pos.y);
    hwQuizCtx.stroke();
    
    hwQuizLastX = pos.x;
    hwQuizLastY = pos.y;
}

/**
 * 描画終了
 */
function hwQuizDrawEnd(e) {
    if (!hwQuizIsDrawing) return;
    hwQuizIsDrawing = false;
    
    // 描画停止後、自動認識（短い遅延で）
    if (hwQuizDrawTimeout) clearTimeout(hwQuizDrawTimeout);
    hwQuizDrawTimeout = setTimeout(() => {
        recognizeHWQuizCanvas();
    }, 300);
}

/**
 * キャンバス座標を取得
 */
function getHWQuizPos(e) {
    const rect = hwQuizCanvas.getBoundingClientRect();
    const scaleX = hwQuizCanvas.width / rect.width;
    const scaleY = hwQuizCanvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 認識処理中フラグ
let hwQuizIsRecognizing = false;

/**
 * キャンバスを認識して自動入力
 */
async function recognizeHWQuizCanvas() {
    if (hwQuizAnswerSubmitted) return;
    if (!window.handwritingRecognition?.isModelLoaded) {
        return;
    }
    
    // 既に認識処理中なら何もしない
    if (hwQuizIsRecognizing) {
        return;
    }
    
    hwQuizIsRecognizing = true;
    
    try {
        // 現在のセグメントを検出（キャンバス上に残っているもの）
        const segments = window.handwritingRecognition.segmentCharacters(hwQuizCanvas);
        
        if (!segments || segments.length === 0) {
            hwQuizIsRecognizing = false;
            return;
        }
        
        // 最大3マス同時並行で認識
        const maxSegments = Math.min(segments.length, 3);
        const recognitionPromises = [];
        
        for (let i = 0; i < maxSegments; i++) {
            recognitionPromises.push(
                recognizeSingleSegment(segments[i]).then(result => ({
                    result,
                    segment: segments[i],
                    index: i
                }))
            );
        }
        
        // 全ての認識を並列実行
        const results = await Promise.all(recognitionPromises);
        
        // 左から順にソート
        results.sort((a, b) => a.segment.x - b.segment.x);
        
        // 順番に飛ばす（少し遅延を入れて）
        for (let i = 0; i < results.length; i++) {
            const { result, segment } = results[i];
            setTimeout(() => {
                if (result && result.char && result.confidence > 0.3) {
                    // 認識成功
                    flyCharFromSegment(result.char, segment);
                } else {
                    // 認識失敗 - ?マークを表示
                    showRecognitionError(segment);
                }
            }, i * 100); // 100msずつ遅延
        }
        
    } catch (error) {
        console.error('[HWQuiz] Recognition error:', error);
    }
    
    hwQuizIsRecognizing = false;
}

/**
 * 単一セグメントを認識
 */
async function recognizeSingleSegment(segment) {
    const canvas = document.getElementById('hwQuizCanvas');
    if (!canvas) return null;
    
    // セグメントを正方形キャンバスに描画
    const segCanvas = document.createElement('canvas');
    const size = Math.max(segment.width, segment.height) + 20;
    segCanvas.width = size;
    segCanvas.height = size;
    const segCtx = segCanvas.getContext('2d');
    
    // 白で塗りつぶし
    segCtx.fillStyle = '#ffffff';
    segCtx.fillRect(0, 0, size, size);
    
    // セグメントを中央に配置
    const offsetX = (size - segment.width) / 2;
    const offsetY = (size - segment.height) / 2;
    segCtx.drawImage(
        canvas,
        segment.x, segment.y, segment.width, segment.height,
        offsetX, offsetY, segment.width, segment.height
    );
    
    // 認識
    const result = await window.handwritingRecognition.predict(segCanvas);
    
    if (result && result.topK && result.topK.length > 0) {
        return {
            char: result.topK[0].label,
            confidence: result.topK[0].probability
        };
    }
    
    return null;
}

/**
 * セグメント境界線を描画
 */
function drawSegmentLine(segmentEndX) {
    if (!hwQuizCtx || !hwQuizCanvas) return;
    
    // 薄いグレーの縦線を描画
    hwQuizCtx.save();
    hwQuizCtx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    hwQuizCtx.lineWidth = 1;
    hwQuizCtx.setLineDash([4, 4]); // 点線
    hwQuizCtx.beginPath();
    hwQuizCtx.moveTo(segmentEndX + 5, 0);
    hwQuizCtx.lineTo(segmentEndX + 5, hwQuizCanvas.height);
    hwQuizCtx.stroke();
    hwQuizCtx.restore();
}

/**
 * 認識失敗時に?マークを表示
 */
function showRecognitionError(segment) {
    const canvas = document.getElementById('hwQuizCanvas');
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    
    // セグメント部分を消去
    hwQuizCtx.fillStyle = '#ffffff';
    hwQuizCtx.fillRect(segment.x - 2, segment.y - 2, segment.width + 4, segment.height + 4);
    
    // ?マークを表示
    const errorMark = document.createElement('div');
    errorMark.textContent = '?';
    errorMark.style.position = 'fixed';
    errorMark.style.left = (canvasRect.left + (segment.x + segment.width / 2) * scaleX) + 'px';
    errorMark.style.top = (canvasRect.top + (segment.y + segment.height / 2) * scaleY) + 'px';
    errorMark.style.transform = 'translate(-50%, -50%)';
    errorMark.style.fontSize = '48px';
    errorMark.style.fontWeight = 'bold';
    errorMark.style.color = '#ef4444';
    errorMark.style.pointerEvents = 'none';
    errorMark.style.zIndex = '2000';
    errorMark.style.transition = 'all 0.5s ease-out';
    document.body.appendChild(errorMark);
    
    // フェードアウト
    setTimeout(() => {
        errorMark.style.opacity = '0';
        errorMark.style.transform = 'translate(-50%, -50%) scale(1.5)';
    }, 100);
    
    // 削除
    setTimeout(() => {
        errorMark.remove();
    }, 600);
}

/**
 * セグメント位置から文字を処理
 */
function flyCharFromSegment(char, segment) {
    const canvas = document.getElementById('hwQuizCanvas');
    const answerDisplay = document.getElementById('hwQuizAnswerDisplay');
    
    if (!canvas || !answerDisplay) {
        const adjustedChar = adjustCharCaseForAnswer(char);
        hwQuizConfirmedText += adjustedChar;
        updateHWQuizAnswerDisplay();
        return;
    }
    
    // セグメント部分をキャプチャ
    const padding = 3;
    const captureX = Math.max(0, segment.x - padding);
    const captureY = Math.max(0, segment.y - padding);
    const captureWidth = Math.min(canvas.width - captureX, segment.width + padding * 2);
    const captureHeight = Math.min(canvas.height - captureY, segment.height + padding * 2);
    
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = captureWidth;
    captureCanvas.height = captureHeight;
    const captureCtx = captureCanvas.getContext('2d');
    captureCtx.drawImage(canvas, captureX, captureY, captureWidth, captureHeight, 0, 0, captureWidth, captureHeight);
    
    // 白い背景を透明にする
    const imageData = captureCtx.getImageData(0, 0, captureWidth, captureHeight);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // 白に近いピクセル（RGB各230以上）を透明に
        if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
            data[i + 3] = 0; // アルファを0に
        }
    }
    captureCtx.putImageData(imageData, 0, 0);
    
    // キャンバスからセグメント部分を即座に消去（新しい文字が書けるように）
    hwQuizCtx.fillStyle = '#ffffff';
    hwQuizCtx.fillRect(captureX - 2, captureY - 2, captureWidth + 4, captureHeight + 4);
    
    // 書いた文字そのものを飛ばすアニメーション
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    
    // 飛ぶ画像要素を作成
    const flyingImg = document.createElement('img');
    flyingImg.src = captureCanvas.toDataURL();
    flyingImg.style.position = 'fixed';
    flyingImg.style.left = (canvasRect.left + captureX * scaleX + captureWidth * scaleX / 2) + 'px';
    flyingImg.style.top = (canvasRect.top + captureY * scaleY + captureHeight * scaleY / 2) + 'px';
    flyingImg.style.width = (captureWidth * scaleX) + 'px';
    flyingImg.style.height = (captureHeight * scaleY) + 'px';
    flyingImg.style.transform = 'translate(-50%, -50%)';
    flyingImg.style.pointerEvents = 'none';
    flyingImg.style.zIndex = '2000';
    flyingImg.style.transition = 'all 0.35s ease-in-out';
    document.body.appendChild(flyingImg);
    
    // 回答欄の位置を計算
    const answerRect = answerDisplay.getBoundingClientRect();
    const currentText = hwQuizConfirmedText || '';
    const tempSpan = document.createElement('span');
    tempSpan.style.cssText = 'position:absolute;visibility:hidden;font-size:48px;font-weight:700;font-family:"Times New Roman",serif;letter-spacing:2px;';
    tempSpan.textContent = currentText;
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    tempSpan.remove();
    
    const targetX = answerRect.left + answerRect.width / 2 + textWidth / 2;
    const targetY = answerRect.top + answerRect.height / 2;
    
    // 飛ばす
    requestAnimationFrame(() => {
        flyingImg.style.left = targetX + 'px';
        flyingImg.style.top = targetY + 'px';
        flyingImg.style.width = '30px';
        flyingImg.style.height = '30px';
        flyingImg.style.opacity = '0.5';
    });
    
    // アニメーション完了後に文字を追加して画像を削除
    setTimeout(() => {
        const adjustedChar = adjustCharCaseForAnswer(char);
        hwQuizConfirmedText += adjustedChar;
        updateHWQuizAnswerDisplay();
        flyingImg.remove();
    }, 350);
}

/**
 * 文字を自動入力（飛ぶアニメーション付き）
 */
function autoInputHWQuizChar(char) {
    const canvas = document.getElementById('hwQuizCanvas');
    const answerDisplay = document.getElementById('hwQuizAnswerDisplay');
    
    if (!canvas || !answerDisplay) {
        addHWQuizChar(char);
        return;
    }
    
    // キャンバスの中心座標を取得
    const canvasRect = canvas.getBoundingClientRect();
    const startX = canvasRect.left + canvasRect.width / 2;
    const startY = canvasRect.top + canvasRect.height / 2;
    
    // 回答欄の次の文字位置を計算（中央揃えなので、現在のテキストの右端）
    const answerRect = answerDisplay.getBoundingClientRect();
    const currentText = hwQuizConfirmedText || '';
    // テキストの幅を一時的に計測
    const tempSpan = document.createElement('span');
    tempSpan.style.cssText = 'position:absolute;visibility:hidden;font-size:38px;font-weight:700;font-family:"Times New Roman",serif;letter-spacing:2px;';
    tempSpan.textContent = currentText;
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    tempSpan.remove();
    
    // 中央揃えなので、テキストの右端の位置を計算
    const centerX = answerRect.left + answerRect.width / 2;
    const endX = centerX + textWidth / 2 + 10; // テキスト右端 + 少し余白
    const endY = answerRect.top + answerRect.height / 2;
    
    // 飛ぶ文字を作成
    const flyingChar = document.createElement('div');
    flyingChar.className = 'hw-flying-char';
    flyingChar.textContent = char;
    flyingChar.style.left = startX + 'px';
    flyingChar.style.top = startY + 'px';
    document.body.appendChild(flyingChar);
    
    // キャンバスを即座にクリア
    clearHWQuizCanvas();
    
    // ポップアップ後に飛ばす
    setTimeout(() => {
        flyingChar.classList.add('flying');
        flyingChar.style.left = endX + 'px';
        flyingChar.style.top = endY + 'px';
        flyingChar.style.transform = 'translate(-50%, -50%) scale(0.5)';
        flyingChar.style.fontSize = '38px';
    }, 200);
    
    // 文字を追加して飛ぶ文字を削除
    setTimeout(() => {
        const adjustedChar = adjustCharCaseForAnswer(char);
        hwQuizConfirmedText += adjustedChar;
        updateHWQuizAnswerDisplay();
        flyingChar.remove();
        
        // 予測をクリア
        const container = document.getElementById('hwQuizPredictions');
        if (container) {
            container.innerHTML = '';
        }
    }, 700);
}

/**
 * 文字のケースを正解の単語に合わせて調整
 * 最初の文字の場合、正解が大文字で始まるなら大文字に変換
 */
function adjustCharCaseForAnswer(char) {
    // 現在入力中の位置
    const position = hwQuizConfirmedText.length;
    
    // 正解の単語を取得
    const word = hwQuizWords && hwQuizWords[hwQuizIndex];
    if (!word || !word.word) return char;
    
    const correctWord = word.word;
    
    // 対応する位置の正解文字を取得
    if (position < correctWord.length) {
        const correctChar = correctWord[position];
        // 正解が大文字なら大文字に、小文字なら小文字に変換
        if (correctChar === correctChar.toUpperCase() && correctChar !== correctChar.toLowerCase()) {
            return char.toUpperCase();
        } else {
            return char.toLowerCase();
        }
    }
    
    return char;
}

/**
 * 文字を追加（手動用フォールバック）
 */
function addHWQuizChar(char) {
    const adjustedChar = adjustCharCaseForAnswer(char);
    hwQuizConfirmedText += adjustedChar;
    updateHWQuizAnswerDisplay();
    clearHWQuizCanvas();
    
    // 予測をクリア
    const container = document.getElementById('hwQuizPredictions');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * 回答表示を更新
 */
function updateHWQuizAnswerDisplay() {
    const display = document.getElementById('hwQuizAnswerDisplay');
    if (display) {
        const textEl = display.querySelector('.hw-answer-text');
        if (textEl) {
            textEl.textContent = hwQuizConfirmedText;
        } else {
        display.textContent = hwQuizConfirmedText;
        }
    }
}

// 現在の入力モード（handwriting または typing）
let hwQuizInputMode = 'typing';
let hwKeyboardShiftActive = false;

/**
 * イベントリスナーを設定
 */
function setupHWQuizEvents() {
    // 入力モード切替ボタン
    const handwritingBtn = document.getElementById('hwModeHandwriting');
    const typingBtn = document.getElementById('hwModeTyping');
    
    if (handwritingBtn) {
        handwritingBtn.onclick = () => switchHWInputMode('handwriting');
    }
    if (typingBtn) {
        typingBtn.onclick = () => switchHWInputMode('typing');
    }
    
    // 仮想キーボードのイベント設定
    setupHWVirtualKeyboard();
    
    // 戻るボタン
    const backBtn = document.getElementById('hwQuizBackBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            exitHWQuiz();
        };
    }
    
    // ×ボタン（ポーズ表示）
    const pauseBtn = document.getElementById('hwQuizPauseBtn');
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            const pauseOverlay = document.getElementById('hwQuizPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.remove('hidden');
            }
        };
    }
    
    // ポーズ：学習を続ける
    const pauseContinueBtn = document.getElementById('hwQuizPauseContinueBtn');
    if (pauseContinueBtn) {
        pauseContinueBtn.onclick = () => {
            const pauseOverlay = document.getElementById('hwQuizPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
        };
    }
    
    // ポーズ：中断する
    const pauseQuitBtn = document.getElementById('hwQuizPauseQuitBtn');
    if (pauseQuitBtn) {
        pauseQuitBtn.onclick = () => {
            const pauseOverlay = document.getElementById('hwQuizPauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
            exitHWQuiz();
        };
    }
    
    // ポーズオーバーレイの背景クリックで閉じる
    const pauseOverlay = document.getElementById('hwQuizPauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.onclick = (e) => {
            if (e.target === pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
        };
    }
    
    
    // バックスペースボタン（長押し対応）
    const backspaceBtn = document.getElementById('hwQuizBackspaceBtn');
    if (backspaceBtn && !backspaceBtn._hwEventsAttached) {
        backspaceBtn._hwEventsAttached = true;
        let backspaceInterval = null;
        let backspaceTimeout = null;
        let isTouching = false;
        
        const doBackspace = () => {
            if (hwQuizAnswerSubmitted) return;
            if (hwQuizConfirmedText.length > 0) {
                hwQuizConfirmedText = hwQuizConfirmedText.slice(0, -1);
                updateHWQuizAnswerDisplay();
            }
        };
        
        const startBackspace = () => {
            doBackspace();
            // 200ms後に連続削除開始
            backspaceTimeout = setTimeout(() => {
                backspaceInterval = setInterval(doBackspace, 60);
            }, 200);
        };
        
        const stopBackspace = () => {
            if (backspaceTimeout) {
                clearTimeout(backspaceTimeout);
                backspaceTimeout = null;
            }
            if (backspaceInterval) {
                clearInterval(backspaceInterval);
                backspaceInterval = null;
            }
        };
        
        // タッチイベント
        backspaceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isTouching = true;
            startBackspace();
        }, { passive: false });
        backspaceBtn.addEventListener('touchend', () => {
            stopBackspace();
            setTimeout(() => { isTouching = false; }, 100);
        });
        backspaceBtn.addEventListener('touchcancel', () => {
            stopBackspace();
            setTimeout(() => { isTouching = false; }, 100);
        });
        
        // マウスイベント（タッチ中は無視）
        backspaceBtn.addEventListener('mousedown', (e) => {
            if (isTouching) return;
            e.preventDefault();
            startBackspace();
        });
        backspaceBtn.addEventListener('mouseup', () => {
            if (isTouching) return;
            stopBackspace();
        });
        backspaceBtn.addEventListener('mouseleave', () => {
            if (isTouching) return;
            stopBackspace();
        });
    }
    
    // スペースボタン
    const spaceBtn = document.getElementById('hwQuizSpaceBtn');
    if (spaceBtn) {
        spaceBtn.onclick = () => {
            if (hwQuizAnswerSubmitted) return;
            // 連続スペースを防ぐ（最後の文字がスペースなら追加しない）
            if (hwQuizConfirmedText.length > 0 && hwQuizConfirmedText.slice(-1) === ' ') {
                return;
            }
            hwQuizConfirmedText += ' ';
            updateHWQuizAnswerDisplay();
        };
    }
    
    // 手書きモード用のスペースボタン
    const handwritingSpaceBtn = document.getElementById('hwQuizHandwritingSpaceBtn');
    if (handwritingSpaceBtn) {
        handwritingSpaceBtn.onclick = () => {
            if (hwQuizAnswerSubmitted) return;
            // 連続スペースを防ぐ（最後の文字がスペースなら追加しない）
            if (hwQuizConfirmedText.length > 0 && hwQuizConfirmedText.slice(-1) === ' ') {
                return;
            }
            hwQuizConfirmedText += ' ';
            updateHWQuizAnswerDisplay();
        };
    }
    
    // 回答ボタン（個別にバインド）
    
    // 次へボタン
    const nextBtn = document.getElementById('hwQuizNextBtn');
    if (nextBtn) {
        nextBtn.onclick = () => {
            goToNextHWQuizQuestion();
        };
    }
    
    // 音声ボタン
    const audioBtn = document.getElementById('hwQuizAudioBtn');
    if (audioBtn) {
        audioBtn.onclick = () => {
            const word = hwQuizWords[hwQuizIndex];
            if (word) {
                speakWord(word.word);
            }
        };
    }
    
    // パスボタン
    const passBtn = document.getElementById('hwQuizPassBtn');
    if (passBtn) {
        passBtn.onclick = () => {
            handleHWQuizPass();
        };
    }
    
    // チェックボックス
    const hwCheckbox = document.getElementById('hwQuizCheckbox');
    if (hwCheckbox) {
        hwCheckbox.onclick = () => {
            toggleHWQuizReview();
        };
    }
    
    // デバッグトグル
    const debugToggle = document.getElementById('hwQuizDebugToggle');
    if (debugToggle) {
        debugToggle.onchange = () => {
            const debugContent = document.getElementById('hwQuizDebugContent');
            if (debugContent) {
                debugContent.classList.toggle('hidden', !debugToggle.checked);
            }
        };
    }
    
    // デバッグ設定
    const debugInvert = document.getElementById('hwQuizDebugInvert');
    const debugTrim = document.getElementById('hwQuizDebugTrim');
    const debugCenter = document.getElementById('hwQuizDebugCenter');
    
    if (debugInvert) {
        debugInvert.onchange = () => {
            if (window.handwritingRecognition) {
                window.handwritingRecognition.debugSettings.invert = debugInvert.checked;
            }
        };
    }
    if (debugTrim) {
        debugTrim.onchange = () => {
            if (window.handwritingRecognition) {
                window.handwritingRecognition.debugSettings.trim = debugTrim.checked;
            }
        };
    }
    if (debugCenter) {
        debugCenter.onchange = () => {
            if (window.handwritingRecognition) {
                window.handwritingRecognition.debugSettings.center = debugCenter.checked;
            }
        };
    }
}

/**
 * 入力モードを切り替え
 */
function switchHWInputMode(mode) {
    hwQuizInputMode = mode;
    
    const handwritingBtn = document.getElementById('hwModeHandwriting');
    const typingBtn = document.getElementById('hwModeTyping');
    const canvasArea = document.getElementById('hwCanvasArea');
    const predictions = document.getElementById('hwQuizPredictions');
    const keyboard = document.getElementById('hwVirtualKeyboard');
    const inputFixedBottom = document.querySelector('.hw-input-fixed-bottom');
    const keyboardActions = inputFixedBottom ? inputFixedBottom.querySelector('.keyboard-actions') : null;
    
    if (mode === 'handwriting') {
        // 手書きモード
        if (handwritingBtn) handwritingBtn.classList.add('active');
        if (typingBtn) typingBtn.classList.remove('active');
        if (canvasArea) canvasArea.style.display = 'flex';
        if (predictions) predictions.style.display = 'flex';
        if (keyboard) keyboard.classList.add('hidden');
        if (inputFixedBottom) inputFixedBottom.style.background = 'transparent';
        if (keyboardActions) keyboardActions.style.background = 'transparent';
    } else {
        // タイピングモード
        if (handwritingBtn) handwritingBtn.classList.remove('active');
        if (typingBtn) typingBtn.classList.add('active');
        if (canvasArea) canvasArea.style.display = 'none';
        if (predictions) predictions.style.display = 'none';
        if (keyboard) keyboard.classList.remove('hidden');
        if (inputFixedBottom) inputFixedBottom.style.background = '#d1d4d9';
        if (keyboardActions) keyboardActions.style.background = '#d1d4d9';
    }
}

// Note: The toggle buttons now use input-list-mode-btn class for styling

/**
 * 仮想キーボードのイベント設定
 */
function setupHWVirtualKeyboard() {
    const keyboard = document.getElementById('hwVirtualKeyboard');
    if (!keyboard) return;
    
    // キーボードのキーにイベントを設定
    const keys = keyboard.querySelectorAll('.keyboard-key');
    keys.forEach(key => {
        // 既にイベントが設定されている場合はスキップ
        if (key._hwKeyboardEventSet) return;
        key._hwKeyboardEventSet = true;
        
        key.addEventListener('click', (e) => {
            if (hwQuizAnswerSubmitted) return;
            e.preventDefault();
            const keyValue = key.dataset.key;
            
            if (key.id === 'hwKeyboardBackspace') {
                // バックスペース
                if (hwQuizConfirmedText.length > 0) {
                    hwQuizConfirmedText = hwQuizConfirmedText.slice(0, -1);
                    updateHWQuizAnswerDisplay();
                }
            } else if (key.id === 'hwKeyboardShift') {
                // シフトキー
                hwKeyboardShiftActive = !hwKeyboardShiftActive;
                key.classList.toggle('active', hwKeyboardShiftActive);
                updateHWKeyboardCase();
            } else if (keyValue) {
                // スペースキーの場合、連続スペースを防ぐ
                if (keyValue === ' ') {
                    if (hwQuizConfirmedText.length > 0 && hwQuizConfirmedText.slice(-1) === ' ') {
                        return; // 最後の文字がスペースなら追加しない
                    }
                    hwQuizConfirmedText += ' ';
                    updateHWQuizAnswerDisplay();
                    return;
                }
                
                // 通常のキー
                let char = keyValue;
                const wasShiftActive = hwKeyboardShiftActive;
                if (wasShiftActive) {
                    char = char.toUpperCase();
                    // ボタンを離したときにシフトを解除するためフラグを設定
                    window.pendingShiftReset = 'hwVirtualKeyboard';
                }
                // 正解の大文字/小文字に合わせて調整
                const adjustedChar = adjustCharCaseForAnswer(char);
                hwQuizConfirmedText += adjustedChar;
                updateHWQuizAnswerDisplay();
            }
        });
        
        // タッチイベント
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            key.click();
        }, { passive: false });
    });
}

/**
 * キーボードの大文字/小文字表示を更新
 */
function updateHWKeyboardCase() {
    const keyboard = document.getElementById('hwVirtualKeyboard');
    if (!keyboard) return;
    
    // キーボードにshift-activeクラスを追加/削除（ポップアップ用）
    keyboard.classList.toggle('shift-active', hwKeyboardShiftActive);
    
    const keys = keyboard.querySelectorAll('.keyboard-key');
    keys.forEach(key => {
        const keyValue = key.dataset.key;
        if (keyValue && keyValue.length === 1 && keyValue.match(/[a-z]/i)) {
            const newValue = hwKeyboardShiftActive ? keyValue.toUpperCase() : keyValue.toLowerCase();
            key.textContent = newValue;
            key.dataset.key = newValue; // ポップアップ用にdata-keyも更新
        }
    });
}

/**
 * 問題を表示
 */
function displayHWQuizQuestion() {
    const word = hwQuizWords[hwQuizIndex];
    if (!word) return;
    
    hwQuizAnswerSubmitted = false;
    hwQuizConfirmedText = '';
    hwQuizIsDrawing = false;
    hwQuizIsRecognizing = false;
    
    // 入力エリアの無効化を解除
    const inputFixedBottom = document.getElementById('hwInputFixedBottom');
    if (inputFixedBottom) {
        inputFixedBottom.classList.remove('hw-input-disabled');
    }
    
    // 進捗セグメントと統計を更新
    updateHWQuizProgressSegments();
    updateHWQuizStats();
    
    // 品詞（インプットモードと同じスタイル）
    const posEl = document.getElementById('hwQuizPos');
    if (posEl) {
        const posShort = getPartOfSpeechShort(word.partOfSpeech || '');
        const posClass = getPartOfSpeechClass(word.partOfSpeech || '');
        posEl.textContent = posShort;
        posEl.className = `pos-inline part-of-speech ${posClass}`;
    }
    
    // 意味
    const meaningEl = document.getElementById('hwQuizMeaning');
    if (meaningEl) {
        meaningEl.textContent = word.meaning;
    }
    
    // チェックボックスの状態を更新
    updateHWQuizCheckbox();
    
    // 回答表示をクリア
    updateHWQuizAnswerDisplay();
    
    // キャンバスコンテキストを再取得してクリア
    hwQuizCanvas = document.getElementById('hwQuizCanvas');
    if (hwQuizCanvas) {
        hwQuizCtx = hwQuizCanvas.getContext('2d');
    }
    clearHWQuizCanvas();
    
    // 予測をクリア
    const predictions = document.getElementById('hwQuizPredictions');
    if (predictions) {
        predictions.innerHTML = '';
    }
    
    // UIをリセット
    const result = document.getElementById('hwQuizResult');
    const answerDisplay = document.getElementById('hwQuizAnswerDisplay');
    const modeToggle = document.querySelector('.hw-mode-toggle-row');
    
    if (result) result.classList.add('hidden');
    if (answerDisplay) {
        answerDisplay.classList.remove('correct', 'wrong');
        answerDisplay.style.borderColor = '';
        answerDisplay.style.backgroundColor = '';
        answerDisplay.style.color = '';
    }
    if (modeToggle) modeToggle.style.display = '';
    if (inputFixedBottom) inputFixedBottom.style.display = '';
    
    // 現在の入力モードに応じて表示を切り替え
    switchHWInputMode(hwQuizInputMode);
    
    // キャンバスを再初期化（2回目以降も動作するように）
    initHWQuizCanvas();
    
    // 正解表示をクリア
    const placeholder = document.getElementById('hwQuizCorrectAnswerPlaceholder');
    if (placeholder) placeholder.innerHTML = '';
    
    // 追加した要素を削除
    const nextBtnContainer = document.getElementById('hwQuizNextBtnContainer');
    if (nextBtnContainer) nextBtnContainer.remove();
    
    // keyboard-actionsをパス・解答ボタンに復元
    const keyboardActions = inputFixedBottom ? inputFixedBottom.querySelector('.keyboard-actions') : null;
    if (keyboardActions) {
        keyboardActions.innerHTML = `
            <button class="keyboard-action-btn" id="hwQuizPassBtn" type="button">パス</button>
            <button class="keyboard-action-btn keyboard-action-btn-primary hw-answer-btn" type="button" onclick="submitHWQuizAnswer()">解答</button>
        `;
        
        // パスボタンのイベントを再設定
        const passBtn = document.getElementById('hwQuizPassBtn');
        if (passBtn) {
            passBtn.onclick = () => handleHWQuizPass();
        }
    }
    
    // 念のため再バインド
    bindHWQuizSubmitButton();
    
}

/**
 * 回答を送信
 */
function submitHWQuizAnswer() {
    console.log('[HWQuiz] submitHWQuizAnswer called!!');
    
    if (hwQuizAnswerSubmitted) {
        console.log('[HWQuiz] Already submitted, returning');
        return;
    }
    
    const word = hwQuizWords[hwQuizIndex];
    if (!word) {
        console.log('[HWQuiz] No word found at index', hwQuizIndex);
        return;
    }
    
    try {

    console.log('[HWQuiz] Processing answer for:', word.word);
    hwQuizAnswerSubmitted = true;
    
    // 未入力でも処理を続行
    const userAnswer = (hwQuizConfirmedText || "").trim().toLowerCase();
    const correctAnswer = (word.word || "").toLowerCase();
    const isCorrect = userAnswer !== "" && userAnswer === correctAnswer;
    
    console.log('[HWQuiz] User:', userAnswer || "(empty)", '| Correct:', correctAnswer, '| Result:', isCorrect);
    
    // 結果を記録
    if (!hwQuizResults) hwQuizResults = {};
    hwQuizResults[hwQuizIndex] = isCorrect ? 'correct' : 'wrong';
    if (isCorrect) {
        hwQuizCorrectCount++;
    } else {
        hwQuizWrongCount++;
    }
    
    // 進捗セグメントと統計を更新
    updateHWQuizProgressSegments();
    updateHWQuizStats();
    
    // 効果音
    if (isCorrect) {
        if (typeof SoundEffects !== 'undefined' && SoundEffects.playCorrect) {
        SoundEffects.playCorrect();
        }
        if (typeof correctWords !== 'undefined') correctWords.add(word.id);
        if (typeof wrongWords !== 'undefined') wrongWords.delete(word.id);
    } else {
        if (typeof SoundEffects !== 'undefined' && SoundEffects.playWrong) {
        SoundEffects.playWrong();
        }
        if (typeof wrongWords !== 'undefined') wrongWords.add(word.id);
    }
    
    // 進捗保存
    if (typeof saveCategoryWords === 'function' && typeof correctWords !== 'undefined' && typeof wrongWords !== 'undefined') {
        saveCategoryWords(hwQuizCategory, correctWords, wrongWords);
    }
    
    // 結果を表示
    showHWQuizResult(isCorrect, word);
    
    } catch (error) {
        console.error('[HWQuiz] Error:', error);
    }
}

// グローバルに登録（念のため）
window.submitHWQuizAnswer = submitHWQuizAnswer;

/**
 * 差分ハイライトを生成（正解表示用）
 * 正解の文字列で、ユーザーが間違えた/欠けている部分をハイライト
 */
function generateDiffHighlight(userInput, correctWord) {
    const diff = computeDiff(userInput, correctWord);
    let html = '';
    
    for (const item of diff) {
        if (item.type === 'match') {
            html += `<span class="diff-match">${item.char}</span>`;
        } else if (item.type === 'missing') {
            // ユーザーが入力しなかった文字（正解にはある）
            html += `<span class="diff-missing">${item.char}</span>`;
        } else if (item.type === 'wrong') {
            // ユーザーが間違えた文字
            html += `<span class="diff-wrong">${item.char}</span>`;
        }
    }
    
    return html;
}

/**
 * ユーザー入力の差分ハイライト（解答欄表示用）
 * 欠けている文字も赤いマーカーで表示
 */
function generateUserInputDiffHighlight(userInput, correctWord) {
    if (!userInput) {
        // 未入力の場合、正解の文字数分の赤いマーカーを表示
        let html = '';
        for (let i = 0; i < correctWord.length; i++) {
            html += `<span class="diff-missing-slot"></span>`;
        }
        return html || '<span class="diff-empty">（未入力）</span>';
    }
    
    const diff = computeFullDiff(userInput, correctWord);
    let html = '';
    
    for (const item of diff) {
        if (item.type === 'match') {
            html += `<span class="diff-match">${item.char}</span>`;
        } else if (item.type === 'wrong') {
            // ユーザーが間違えた文字
            html += `<span class="diff-wrong-input">${item.char}</span>`;
        } else if (item.type === 'missing') {
            // ユーザーが入力しなかった文字（空きスロット）
            html += `<span class="diff-missing-slot"></span>`;
        }
    }
    
    return html;
}

/**
 * 差分を計算（正解基準）
 */
function computeDiff(userInput, correctWord) {
    const result = [];
    const lcs = computeLCS(userInput, correctWord);
    
    let ui = 0, ci = 0, li = 0;
    
    while (ci < correctWord.length) {
        if (li < lcs.length && ci === lcs[li].correctIndex) {
            // LCSに含まれる文字（一致）
            result.push({ type: 'match', char: correctWord[ci] });
            ui = lcs[li].userIndex + 1;
            li++;
        } else {
            // ユーザーが入力しなかった/間違えた文字
            result.push({ type: 'missing', char: correctWord[ci] });
        }
        ci++;
    }
    
    return result;
}

/**
 * ユーザー入力の差分を計算（ユーザー入力基準）
 */
function computeUserDiff(userInput, correctWord) {
    const result = [];
    const lcs = computeLCS(userInput, correctWord);
    
    let li = 0;
    
    for (let ui = 0; ui < userInput.length; ui++) {
        if (li < lcs.length && ui === lcs[li].userIndex) {
            // LCSに含まれる文字（一致）
            result.push({ type: 'match', char: userInput[ui] });
            li++;
        } else {
            // 間違えた/余分な文字
            result.push({ type: 'wrong', char: userInput[ui] });
        }
    }
    
    return result;
}

/**
 * 完全な差分を計算
 * ユーザー入力の各文字を順番に処理し、正解と比較
 * 入力文字を先に表示、不足分を末尾に追加
 */
function computeFullDiff(userInput, correctWord) {
    const result = [];
    const maxLen = Math.max(userInput.length, correctWord.length);
    
    for (let i = 0; i < maxLen; i++) {
        const userChar = userInput[i];
        const correctChar = correctWord[i];
        
        if (userChar && correctChar) {
            // 両方に文字がある
            if (userChar === correctChar) {
                result.push({ type: 'match', char: userChar });
            } else {
                result.push({ type: 'wrong', char: userChar });
            }
        } else if (userChar && !correctChar) {
            // ユーザーが余分に入力（正解より長い）
            result.push({ type: 'wrong', char: userChar });
        } else if (!userChar && correctChar) {
            // ユーザーが入力しなかった（正解より短い）
            result.push({ type: 'missing', char: correctChar });
        }
    }
    
    return result;
}

/**
 * LCS（最長共通部分列）を計算
 */
function computeLCS(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    // DPテーブルを作成
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // バックトラックしてLCSを取得
    const lcs = [];
    let i = m, j = n;
    
    while (i > 0 && j > 0) {
        if (str1[i - 1] === str2[j - 1]) {
            lcs.unshift({ userIndex: i - 1, correctIndex: j - 1, char: str1[i - 1] });
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    
    return lcs;
}

/**
 * 結果を表示
 */
function showHWQuizResult(isCorrect, word) {
    console.log('[HWQuiz] showHWQuizResult called, isCorrect:', isCorrect);
    
    const answerDisplay = document.getElementById('hwQuizAnswerDisplay');
    const modeToggle = document.querySelector('.hw-mode-toggle-row');
    const inputFixedBottom = document.getElementById('hwInputFixedBottom');
    
    // 入力エリアを無効化（視覚的フィードバック）
    if (inputFixedBottom) {
        inputFixedBottom.classList.add('hw-input-disabled');
    }
    
    // モードトグルも表示したまま（キーボード・手書きエリアも表示したまま）
    
    // 画面全体のフィードバック表示（正解は青、不正解は赤）
    const hwFeedbackOverlay = document.getElementById('hwQuizFeedbackOverlay');
    if (hwFeedbackOverlay) {
        hwFeedbackOverlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'} active`;
        setTimeout(() => {
            hwFeedbackOverlay.classList.remove('active');
        }, 400);
    }
    
    // 正解時にキラキラエフェクトを表示
    if (isCorrect && typeof showSparkleEffect === 'function') {
        showSparkleEffect();
    }
    
    // 解答欄の色を変更（背景は白のまま）
    if (answerDisplay) {
        if (isCorrect) {
            // 正解：青枠
            answerDisplay.style.borderColor = '#3182ce';
            answerDisplay.style.backgroundColor = '#ffffff';
            answerDisplay.style.color = '#2b6cb0';
        } else {
            // 不正解：赤枠、文字は黒
            answerDisplay.style.borderColor = '#e53e3e';
            answerDisplay.style.backgroundColor = '#ffffff';
            answerDisplay.style.color = '#1a202c';
        }
    }
    
    // 不正解の場合、入力欄に差分ハイライトを適用
    if (!isCorrect && answerDisplay) {
        const userInput = (hwQuizConfirmedText || "").trim().toLowerCase();
        const correctWord = word.word.toLowerCase();
        const userDiffHtml = generateUserInputDiffHighlight(userInput, correctWord);
        const answerText = answerDisplay.querySelector('.hw-answer-text');
        if (answerText) {
            answerText.innerHTML = userDiffHtml;
        }
    }
    
    // 正解表示（通常表示）
    const placeholder = document.getElementById('hwQuizCorrectAnswerPlaceholder');
    if (!isCorrect && placeholder) {
        placeholder.innerHTML = `
            <div class="hw-correct-answer-box" id="hwQuizCorrectAnswerBox">
                <span class="hw-correct-word">${word.word}</span>
            </div>
        `;
    }
    
    // 既存のkeyboard-actionsを次へボタンに置き換え
    const keyboardActions = inputFixedBottom ? inputFixedBottom.querySelector('.keyboard-actions') : null;
    if (keyboardActions) {
        keyboardActions.innerHTML = `<button class="keyboard-action-btn keyboard-action-btn-primary" id="hwQuizNextBtnNew">次へ</button>`;
        
        // 次へボタンのイベント
        const nextBtn = document.getElementById('hwQuizNextBtnNew');
        if (nextBtn) {
            nextBtn.onclick = () => goToNextHWQuizQuestion();
        }
    }
    
    // 答え表示時に音声を自動再生（効果音の後に遅延して再生）
    const wordToSpeak = word.word;
    console.log('[Audio] showHWQuizResult - scheduling speech for:', wordToSpeak);
    setTimeout(function() {
        console.log('[Audio] showHWQuizResult - calling speakWord for:', wordToSpeak);
        speakWord(wordToSpeak);
    }, 600);
}

/**
 * パスボタンの処理
 */
function handleHWQuizPass() {
    if (hwQuizAnswerSubmitted) return;
    
    const word = hwQuizWords[hwQuizIndex];
    if (!word) return;
    
    // 不正解として記録
    hwQuizResults[hwQuizIndex] = 'wrong';
    hwQuizWrongCount++;
    hwQuizAnswerSubmitted = true;
    
    // 進捗セグメントと統計を更新
    updateHWQuizProgressSegments();
    updateHWQuizStats();
    
    // 効果音
    if (typeof SoundEffects !== 'undefined' && SoundEffects.playWrong) {
        SoundEffects.playWrong();
    }
    
    // 間違いとして保存
    if (typeof wrongWords !== 'undefined') wrongWords.add(word.id);
    
    // 進捗保存
    if (typeof saveCategoryWords === 'function' && typeof correctWords !== 'undefined' && typeof wrongWords !== 'undefined') {
        saveCategoryWords(hwQuizCategory, correctWords, wrongWords);
    }
    
    // 結果を表示（不正解として）
    showHWQuizResult(false, word);
}

/**
 * 次の問題へ
 */
function goToNextHWQuizQuestion() {
    hwQuizIndex++;
    
    if (hwQuizIndex >= hwQuizWords.length) {
        // クイズ完了
        showHWQuizCompletion();
    } else {
        displayHWQuizQuestion();
    }
}

/**
 * クイズ完了画面
 */
function showHWQuizCompletion() {
    // 手書きモードの変数をグローバル変数に反映（showCompletionで使用するため）
    correctCount = hwQuizCorrectCount || 0;
    wrongCount = hwQuizWrongCount || 0;
    currentWords = hwQuizWords || [];
    selectedCategory = hwQuizCategory || selectedCategory;
    currentFilterCourseTitle = hwQuizCourseTitle || currentFilterCourseTitle;
    
    // questionStatusを手書きモードの結果から設定（復習ボタン用）
    questionStatus = (hwQuizResults || []).map(result => result === 'correct' ? 'correct' : 'wrong');
    
    // 学習画面は非表示にせず、完了画面のオーバーレイだけを表示
    // （完了画面が閉じられた時にホーム画面に戻る）
    showCompletion();
}

/**
 * クイズをやり直す
 */
function restartHWQuiz() {
    hwQuizIndex = 0;
    hwQuizConfirmedText = '';
    hwQuizCorrectCount = 0;
    hwQuizWrongCount = 0;
    hwQuizResults = {};
    hwQuizAnswerSubmitted = false;
    
    // メインコンテンツを復元
    const main = document.querySelector('.hw-main');
    if (main) {
        main.innerHTML = `
            <!-- 問題（シンプル表示） -->
            <div class="hw-question-simple">
                <span class="pos-inline part-of-speech" id="hwQuizPos"></span>
                <span class="hw-question-meaning" id="hwQuizMeaning">意味</span>
            </div>
            
            <!-- 回答エリア -->
            <div class="hw-answer-area">
                <div class="hw-answer" id="hwQuizAnswerDisplay">
                    <span class="hw-answer-text"></span>
                </div>
                <!-- 正解表示用のプレースホルダー -->
                <div id="hwQuizCorrectAnswerPlaceholder"></div>
            </div>
            
            <!-- 結果表示 -->
            <div class="hw-result hidden" id="hwQuizResult">
                <div class="hw-result-badge" id="hwQuizResultIcon"></div>
                <div class="hw-result-word">
                    <span id="hwQuizCorrectWord"></span>
                    <button class="hw-audio-btn" id="hwQuizAudioBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    // 下部固定エリアを復元
    const inputFixed = document.getElementById('hwInputFixedBottom');
    if (inputFixed) {
        inputFixed.innerHTML = `
            <!-- キャンバス（手書きモード用） -->
            <div class="hw-canvas-area" id="hwCanvasArea">
                <div class="hw-canvas-wrapper">
                    <div class="hw-canvas-label">手書き入力欄</div>
                    <div class="hw-canvas-lines"></div>
                    <canvas id="hwQuizCanvas" class="hw-canvas" width="500" height="180"></canvas>
                </div>
                <!-- 手書きモード用のボタン -->
                <div class="hw-canvas-buttons">
                    <button class="hw-space-btn" id="hwQuizHandwritingSpaceBtn" type="button">
                        <span>空白</span>
                    </button>
                    <button class="hw-backspace-btn" id="hwQuizBackspaceBtn" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                            <line x1="18" y1="9" x2="12" y2="15"></line>
                            <line x1="12" y1="9" x2="18" y2="15"></line>
                        </svg>
                        <span>1文字消す</span>
                    </button>
                </div>
            </div>
            
            <!-- 認識候補 -->
            <div class="hw-candidates" id="hwQuizPredictions"></div>
            
            <!-- 仮想キーボード（タイピングモード用） -->
            <div class="virtual-keyboard hidden" id="hwVirtualKeyboard">
                <div class="keyboard-row">
                    <button class="keyboard-key" data-key="q">q</button>
                    <button class="keyboard-key" data-key="w">w</button>
                    <button class="keyboard-key" data-key="e">e</button>
                    <button class="keyboard-key" data-key="r">r</button>
                    <button class="keyboard-key" data-key="t">t</button>
                    <button class="keyboard-key" data-key="y">y</button>
                    <button class="keyboard-key" data-key="u">u</button>
                    <button class="keyboard-key" data-key="i">i</button>
                    <button class="keyboard-key" data-key="o">o</button>
                    <button class="keyboard-key" data-key="p">p</button>
                </div>
                <div class="keyboard-row">
                    <button class="keyboard-key" data-key="a">a</button>
                    <button class="keyboard-key" data-key="s">s</button>
                    <button class="keyboard-key" data-key="d">d</button>
                    <button class="keyboard-key" data-key="f">f</button>
                    <button class="keyboard-key" data-key="g">g</button>
                    <button class="keyboard-key" data-key="h">h</button>
                    <button class="keyboard-key" data-key="j">j</button>
                    <button class="keyboard-key" data-key="k">k</button>
                    <button class="keyboard-key" data-key="l">l</button>
                    <button class="keyboard-key keyboard-key-space" data-key=" ">_</button>
                </div>
                <div class="keyboard-row">
                    <button class="keyboard-key keyboard-key-shift" id="hwKeyboardShift" data-shift="false">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
                    <button class="keyboard-key" data-key="z">z</button>
                    <button class="keyboard-key" data-key="x">x</button>
                    <button class="keyboard-key" data-key="c">c</button>
                    <button class="keyboard-key" data-key="v">v</button>
                    <button class="keyboard-key" data-key="b">b</button>
                    <button class="keyboard-key" data-key="n">n</button>
                    <button class="keyboard-key" data-key="m">m</button>
                    <button class="keyboard-key" data-key="'">'</button>
                    <button class="keyboard-key keyboard-key-special" id="hwKeyboardBackspace">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                        <line x1="18" y1="9" x2="12" y2="15"></line>
                        <line x1="12" y1="9" x2="18" y2="15"></line>
                    </svg>
                </button>
                </div>
            </div>
            
            <!-- 解答ボタン -->
            <div class="keyboard-actions">
                <button class="keyboard-action-btn" id="hwQuizPassBtn" type="button">パス</button>
                <button class="keyboard-action-btn keyboard-action-btn-primary hw-answer-btn" type="button" onclick="submitHWQuizAnswer()">解答</button>
            </div>
            
            <!-- 結果表示 -->
            <div class="hw-result hidden" id="hwQuizResult">
                <div class="hw-result-badge" id="hwQuizResultIcon"></div>
                <div class="hw-result-word">
                    <span id="hwQuizCorrectWord"></span>
                    <button class="hw-audio-btn" id="hwQuizAudioBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    // 進捗セグメントを再初期化
    initHWQuizProgressSegments();
    
    // キャンバスを再初期化
    hwQuizCanvasInitialized = false;
    initHWQuizCanvas();
    
    // イベントを再設定
    setupHWQuizEvents();
    bindHWQuizSubmitButton();
    
    // 最初の問題を表示
    displayHWQuizQuestion();
}

/**
 * クイズを終了
 */
function exitHWQuiz() {
    const hwQuizView = document.getElementById('handwritingQuizView');
    
    if (hwQuizView) hwQuizView.classList.add('hidden');
    
    // テストモードのクラスをリセット
    document.body.classList.remove('quiz-test-mode');
    document.body.classList.remove('learning-mode');
    updateThemeColorForTest(false);
    
    // テストモード用の進捗表示を非表示
    const hwTestModeProgress = document.getElementById('hwTestModeProgress');
    if (hwTestModeProgress) hwTestModeProgress.classList.add('hidden');
    
    // リセット
    hwQuizWords = [];
    hwQuizIndex = 0;
    hwQuizConfirmedText = '';
    isHandwritingMode = false;
    hwQuizCanvasInitialized = false; // キャンバス初期化フラグをリセット
    hwQuizCanvas = null;
    hwQuizCtx = null;
    
    // 細分化メニュー画面に戻る
    const parent = window.currentSubcategoryParent;
    if (parent === 'レベル１ 超重要700語' || parent === 'レベル２ 重要500語' || parent === 'レベル３ 差がつく300語') {
        showLevelSubcategorySelection(parent, true);
    } else if (parent === 'カテゴリ別に覚える基本単語') {
        showElementaryCategorySelection(true);
    } else {
        // その他の場合はカテゴリー選択画面に戻る
        showCategorySelection();
    }
}

/**
 * 手書きクイズのチェック（ブックマーク）を切り替え
 */
function toggleHWQuizReview() {
    if (hwQuizIndex >= hwQuizWords.length) return;
    
    const word = hwQuizWords[hwQuizIndex];
    if (reviewWords.has(word.id)) {
        reviewWords.delete(word.id);
    } else {
        reviewWords.add(word.id);
    }
    
    saveReviewWords();
    updateHWQuizCheckbox();
}

/**
 * 手書きクイズのチェックボックスの表示を更新
 */
function updateHWQuizCheckbox() {
    const hwCheckbox = document.getElementById('hwQuizCheckbox');
    if (!hwCheckbox) return;
    
    if (hwQuizIndex >= hwQuizWords.length) return;
    
    const word = hwQuizWords[hwQuizIndex];
    if (reviewWords.has(word.id)) {
        hwCheckbox.classList.add('checked');
    } else {
        hwCheckbox.classList.remove('checked');
    }
}

// =============================================
// メモ用紙機能
// =============================================
let memoPadCanvas = null;
let memoPadCtx = null;
let memoPadIsDrawing = false;
let memoPadLastX = 0;
let memoPadLastY = 0;
let memoPadLineWidth = 2; // デフォルトの太さ

function initMemoPad() {
    // インプットモード用のみ（アウトプットモードではメモ不要）
    setupMemoPadListeners('memoPadBtn', 'memoPadOverlay', 'memoPadCloseBtn', 'memoPadClearBtn', 'memoPadCanvas');
    
    // インラインメモボタン（トグル横）も同じオーバーレイに接続
    const inlineBtn = document.getElementById('memoPadBtnInline');
    if (inlineBtn) {
        inlineBtn.addEventListener('click', () => {
            const overlay = document.getElementById('memoPadOverlay');
            const canvas = document.getElementById('memoPadCanvas');
            if (overlay && canvas) {
                if (!overlay.classList.contains('hidden') && !overlay.classList.contains('closing')) {
                    // 開いている場合は閉じる
                    overlay.classList.add('closing');
                    overlay.classList.remove('opening');
                    inlineBtn.classList.remove('active');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('closing');
                    }, 300);
                } else if (overlay.classList.contains('hidden')) {
                    // 閉じている場合は開く
                    overlay.classList.remove('hidden');
                    overlay.classList.remove('closing');
                    overlay.classList.add('opening');
                    inlineBtn.classList.add('active');
                    memoPadCanvas = canvas;
                    initMemoPadCanvas();
                }
            }
        });
    }
}

function setupMemoPadListeners(btnId, overlayId, closeBtnId, clearBtnId, canvasId) {
    const btn = document.getElementById(btnId);
    const overlay = document.getElementById(overlayId);
    const closeBtn = document.getElementById(closeBtnId);
    const clearBtn = document.getElementById(clearBtnId);
    const canvas = document.getElementById(canvasId);
    
    if (!btn || !overlay || !canvas) return;
    
    // メモを閉じる関数
    function closeMemoPad() {
        overlay.classList.add('closing');
        overlay.classList.remove('opening');
        const inlineBtn = document.getElementById('memoPadBtnInline');
        if (inlineBtn) {
            inlineBtn.classList.remove('active');
        }
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('closing');
        }, 300);
    }
    
    // メモを開く関数
    function openMemoPad() {
        overlay.classList.remove('hidden');
        overlay.classList.remove('closing');
        overlay.classList.add('opening');
        memoPadCanvas = canvas;
        initMemoPadCanvas();
    }
    
    // メモボタンクリック（トグル動作）
    btn.addEventListener('click', () => {
        if (!overlay.classList.contains('hidden') && !overlay.classList.contains('closing')) {
            // 開いている場合は閉じる
            closeMemoPad();
        } else if (overlay.classList.contains('hidden')) {
            // 閉じている場合は開く
            openMemoPad();
        }
    });
    
    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeMemoPad();
        });
    }
    
    // クリアボタン
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            memoPadCanvas = canvas;
            memoPadCtx = canvas.getContext('2d');
            clearMemoPadCanvas();
        });
    }
}

function initMemoPadCanvas() {
    if (!memoPadCanvas) return;
    
    // キャンバスサイズを設定
    const container = memoPadCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    memoPadCanvas.width = rect.width * dpr;
    memoPadCanvas.height = (rect.height - 60) * dpr; // ヘッダー分を引く
    memoPadCanvas.style.width = rect.width + 'px';
    memoPadCanvas.style.height = (rect.height - 60) + 'px';
    
    memoPadCtx = memoPadCanvas.getContext('2d');
    memoPadCtx.scale(dpr, dpr);
    
    // 背景をクリア（透明）
    memoPadCtx.clearRect(0, 0, memoPadCanvas.width, memoPadCanvas.height);
    
    // 描画設定
    memoPadCtx.strokeStyle = '#1f2937';
    memoPadCtx.lineWidth = memoPadLineWidth;
    memoPadCtx.lineCap = 'round';
    memoPadCtx.lineJoin = 'round';
    
    // 太さボタンのイベントリスナー設定
    setupMemoPadThicknessButtons();
    
    // イベントリスナー（既に設定済みならスキップ）
    if (memoPadCanvas._eventsAttached) return;
    memoPadCanvas._eventsAttached = true;
    
    // マウスイベント
    memoPadCanvas.addEventListener('mousedown', memoPadDrawStart);
    memoPadCanvas.addEventListener('mousemove', memoPadDrawMove);
    memoPadCanvas.addEventListener('mouseup', memoPadDrawEnd);
    memoPadCanvas.addEventListener('mouseleave', memoPadDrawEnd);
    
    // タッチイベント
    memoPadCanvas.addEventListener('touchstart', memoPadDrawStart, { passive: false });
    memoPadCanvas.addEventListener('touchmove', memoPadDrawMove, { passive: false });
    memoPadCanvas.addEventListener('touchend', memoPadDrawEnd);
    memoPadCanvas.addEventListener('touchcancel', memoPadDrawEnd);
}

function setupMemoPadThicknessButtons() {
    const thicknessButtons = document.querySelectorAll('.memo-pad-thickness-btn');
    if (!thicknessButtons.length) return;
    
    // 既に設定済みならスキップ
    if (thicknessButtons[0]._eventsAttached) return;
    
    thicknessButtons.forEach(btn => {
        btn._eventsAttached = true;
        btn.addEventListener('click', () => {
            // アクティブ状態を更新
            thicknessButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 太さを変更
            const thickness = parseInt(btn.dataset.thickness, 10);
            memoPadLineWidth = thickness;
            
            // 現在のコンテキストに即座に反映
            if (memoPadCtx) {
                memoPadCtx.lineWidth = thickness;
            }
        });
    });
}

function clearMemoPadCanvas() {
    if (!memoPadCtx || !memoPadCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    memoPadCtx.clearRect(0, 0, memoPadCanvas.width / dpr, memoPadCanvas.height / dpr);
}

function memoPadDrawStart(e) {
    e.preventDefault();
    memoPadIsDrawing = true;
    const pos = getMemoPadPos(e);
    memoPadLastX = pos.x;
    memoPadLastY = pos.y;
}

function memoPadDrawMove(e) {
    if (!memoPadIsDrawing) return;
    e.preventDefault();
    
    const pos = getMemoPadPos(e);
    
    memoPadCtx.beginPath();
    memoPadCtx.moveTo(memoPadLastX, memoPadLastY);
    memoPadCtx.lineTo(pos.x, pos.y);
    memoPadCtx.stroke();
    
    memoPadLastX = pos.x;
    memoPadLastY = pos.y;
}

function memoPadDrawEnd(e) {
    memoPadIsDrawing = false;
}

function getMemoPadPos(e) {
    const rect = memoPadCanvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// アプリケーションの起動
// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOMが既に読み込まれている場合は即座に実行
    init();
}

// 解答ボタンのイベント委譲（クラス名ベース・確実に動作させるため）
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.hw-answer-btn');
    if (btn) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[HWQuiz] Answer button clicked via delegation');
        window.submitHWQuizAnswer();
    }
}, true);

document.addEventListener('touchstart', function(e) {
    const btn = e.target.closest('.hw-answer-btn');
    if (btn) {
        e.preventDefault();
        console.log('[HWQuiz] Answer button touched via delegation');
        window.submitHWQuizAnswer();
    }
}, { capture: true, passive: false });

// キーボードキーのポップアップエフェクト（iOSスタイル）
(function() {
    // ボタンを離したときにシフトを解除する関数
    function handlePendingShiftReset() {
        if (!window.pendingShiftReset) return;
        
        const keyboardType = window.pendingShiftReset;
        window.pendingShiftReset = null;
        
        switch (keyboardType) {
            case 'virtualKeyboard':
                if (typeof isShiftActive !== 'undefined' && isShiftActive) {
                    toggleShift();
                }
                break;
            case 'sentenceKeyboard':
                if (typeof isShiftActive !== 'undefined' && isShiftActive) {
                    toggleSentenceShift();
                }
                break;
            case 'grammarExerciseKeyboard':
                if (window.grammarExerciseResetShiftState) {
                    window.grammarExerciseResetShiftState();
                    window.grammarExerciseResetShiftState = null;
                }
                break;
            case 'hwVirtualKeyboard':
                if (typeof hwKeyboardShiftActive !== 'undefined' && hwKeyboardShiftActive) {
                    hwKeyboardShiftActive = false;
                    const shiftBtn = document.getElementById('hwKeyboardShift');
                    if (shiftBtn) shiftBtn.classList.remove('active');
                    updateHWKeyboardCase();
                }
                break;
        }
    }
    
    // タッチデバイスでのポップアップエフェクト
    document.addEventListener('touchstart', function(e) {
        const key = e.target.closest('.keyboard-key[data-key]');
        if (key && !key.classList.contains('keyboard-key-special') && !key.classList.contains('keyboard-key-shift')) {
            key.classList.add('key-pressed');
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        const key = e.target.closest('.keyboard-key[data-key]');
        if (key) {
            setTimeout(() => {
                key.classList.remove('key-pressed');
                // ボタンを離したときにシフトを解除
                handlePendingShiftReset();
            }, 100);
        }
    }, { passive: true });
    
    document.addEventListener('touchcancel', function(e) {
        const key = e.target.closest('.keyboard-key[data-key]');
        if (key) {
            key.classList.remove('key-pressed');
        }
    }, { passive: true });
    
    // マウスでのポップアップエフェクト（デスクトップ用）
    document.addEventListener('mousedown', function(e) {
        const key = e.target.closest('.keyboard-key[data-key]');
        if (key && !key.classList.contains('keyboard-key-special') && !key.classList.contains('keyboard-key-shift')) {
            key.classList.add('key-pressed');
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        document.querySelectorAll('.keyboard-key.key-pressed').forEach(key => {
            key.classList.remove('key-pressed');
        });
        // ボタンを離したときにシフトを解除
        handlePendingShiftReset();
    });
    
    document.addEventListener('mouseleave', function(e) {
        if (e.target.classList && e.target.classList.contains('keyboard-key')) {
            e.target.classList.remove('key-pressed');
        }
    }, { capture: true });
})();

