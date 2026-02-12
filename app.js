// ステータスバーの色を即座に切り替える関数（遅延・フェードなし）
function setStatusBarColor(color) {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        const parent = themeColorMeta.parentNode;
        themeColorMeta.remove();
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = color;
        parent.insertBefore(newMeta, parent.firstChild);
    } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = color;
        document.head.insertBefore(newMeta, document.head.firstChild);
    }
    // iOS: 白背景は default（黒文字）、青背景は black-translucent（白文字）
    const statusBarStyleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarStyleMeta) {
        const isWhite = /^#(fff|ffffff)$/i.test(String(color).replace(/\s/g, ''));
        statusBarStyleMeta.setAttribute('content', isWhite ? 'default' : 'black-translucent');
    }
}

// アプリケーションの状態管理
let currentWords = [];
let currentIndex = 0;
let hasReachedGoalBefore = false; // 目標達成済みフラグ（演出重複防止）
let isReturningToLearningMenu = false; // 学習メニューに戻る時のフラグ
let returnToCourseInfo = null; // 中断時に戻るコース情報 { category, words }
let lastExpandProgressWidth = 0; // 拡大アニメーション時の進捗バー幅（縮小時に使用）
let pendingGoalCelebration = false; // 学習完了後に目標達成画面を表示するフラグ
let selectedStudyMode = 'input'; // 'input' or 'output' - インプット/アウトプットモード選択
let currentInputFilter = 'all'; // インプットモードのフィルター状態: 'all', 'wrong', 'unlearned', 'bookmark', 'correct'
let isInputShuffled = false; // インプットモードのシャッフル状態
let learnedWordsAtStart = 0; // 進捗アニメーション用：学習開始時の覚えた語彙数
let lastLearningCategory = null; // 最後に学習していたカテゴリ
let lastLearningSourceElement = null; // 進捗アニメーション用：学習開始時のソース要素
let isAnimatingProgress = false; // アニメーション重複防止フラグ
let calendarViewDate = new Date(); // 表示中の学習カレンダーの基準日

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

// カード縮小アニメーション関数（戻るとき用）
function animateCardShrink(targetCardId, callback) {
    // まずオーバーレイを画面全体に表示
    const overlay = document.createElement('div');
    overlay.className = 'card-expand-overlay';
    Object.assign(overlay.style, {
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        opacity: '1',
        transition: 'none',
        zIndex: '10000',
        backgroundColor: '#ffffff',
        transformStyle: 'preserve-3d',
        transform: 'perspective(1000px) rotateY(0deg)'
    });
    
    // 戻る時もアイコン、タイトル、バッジ、進捗バーを表示
    const targetCard = document.getElementById(targetCardId);
    if (targetCard) {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'expand-title';
        // 最初は拡大状態からスタート
        titleContainer.style.transform = 'scale(1.5)';
        
        const icon = targetCard.querySelector('.intro-icon, .irregular-verbs-icon, .all-words-icon, .category-icon, [class*="-icon"]:not(.category-arrow)');
        const badge = targetCard.querySelector('.level-badge');
        const categoryName = targetCard.querySelector('.category-name');
        const progress = targetCard.querySelector('.category-progress');
        
        // 元の進捗バーの幅を取得
        const progressWidth = progress ? progress.getBoundingClientRect().width : 0;
        
        if (icon) {
            const iconClone = icon.cloneNode(true);
            // クローンしたアイコンのvisibilityを確実にvisibleに
            iconClone.style.visibility = 'visible';
            iconClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
            titleContainer.appendChild(iconClone);
        }
        
        if (badge) {
            const badgeClone = badge.cloneNode(true);
            // クローンしたバッジのvisibilityを確実にvisibleに
            badgeClone.style.visibility = 'visible';
            badgeClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
            titleContainer.appendChild(badgeClone);
        }
        
        if (categoryName) {
            const titleText = document.createElement('div');
            titleText.className = 'title-text';
            const textOnly = categoryName.textContent.replace(/RANK\d/g, '').replace(/Level\d/g, '').trim();
            titleText.textContent = textOnly;
            titleContainer.appendChild(titleText);
        }
        
        if (progress) {
            const progressClone = progress.cloneNode(true);
            // クローンした進捗バーのvisibilityを確実にvisibleに
            progressClone.style.visibility = 'visible';
            progressClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
            // 進捗テキスト（0/0語など）は非表示にする
            const progressText = progressClone.querySelector('.category-progress-text');
            if (progressText) progressText.style.display = 'none';
            // 進捗バーの幅を元のカードに合わせる（取得できない場合は拡大時の幅を使用）
            const width = progressWidth > 0 ? progressWidth : (lastExpandProgressWidth > 0 ? lastExpandProgressWidth : 130);
            progressClone.style.width = width + 'px';
            progressClone.style.minWidth = width + 'px';
            progressClone.style.maxWidth = width + 'px';
            titleContainer.appendChild(progressClone);
        }
        overlay.appendChild(titleContainer);
    }
    
    document.body.appendChild(overlay);
    
    // アニメーション中はスクロールを無効化
    const appMain = document.querySelector('.app-main');
    if (appMain) {
        appMain.style.overflow = 'hidden';
        appMain.style.touchAction = 'none';
    }
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    overlay.style.touchAction = 'none';
    
    // 画面遷移を先に実行（オーバーレイの下で）
    if (callback) callback();
    
    // レイアウトの確定を待ってからスクロール
    setTimeout(() => {
        const currentTargetCard = document.getElementById(targetCardId);
        const appMainEl = document.querySelector('.app-main');
        
        if (currentTargetCard && appMainEl) {
            // 最下部メニューの場合は一番下まで、それ以外は中央までスクロール
            if (targetCardId === 'allWordsCardBtn' || targetCardId === 'irregularVerbsCardBtn' || targetCardId === 'exam1200CardBtn') {
                appMainEl.scrollTop = appMainEl.scrollHeight + 1000;
            } else {
                currentTargetCard.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
            
            // スクロール位置が確定するまで2フレーム待つ
            requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const rect = currentTargetCard.getBoundingClientRect();
                const titleContainer = overlay.querySelector('.expand-title');
                
                // カードが画面外（rectが異常）の場合はフェードアウトで終了
                if (rect.width === 0 || rect.height === 0) {
                    overlay.style.transition = 'opacity 0.2s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        if (appMainEl) { appMainEl.style.overflow = ''; appMainEl.style.touchAction = ''; }
                        document.body.style.overflow = ''; document.body.style.touchAction = '';
                    }, 200);
                    return;
                }
                
                // 元のカードをグレーアウト
                currentTargetCard.style.filter = 'grayscale(100%)';
                currentTargetCard.style.opacity = '0.5';
                currentTargetCard.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
                
                overlay.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                overlay.style.left = rect.left + 'px';
                overlay.style.top = rect.top + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                overlay.style.opacity = '1';
                overlay.style.transform = 'perspective(1000px) rotateY(-360deg)';
                
                // バッジと文字も縮小
                if (titleContainer) {
                    titleContainer.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    titleContainer.style.transform = 'scale(1)';
                }
                
                setTimeout(() => {
                    // アニメーション完了後にオーバーレイを削除し、元のカードを元に戻す
                    overlay.remove();
                    currentTargetCard.style.filter = '';
                    currentTargetCard.style.opacity = '';
                    currentTargetCard.style.transition = '';
                    // スクロールを再開
                    if (appMainEl) { appMainEl.style.overflow = ''; appMainEl.style.touchAction = ''; }
                    document.body.style.overflow = ''; document.body.style.touchAction = '';
                }, 600);
            });
            });
        } else {
            overlay.style.transition = 'opacity 0.2s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (appMainEl) { appMainEl.style.overflow = ''; appMainEl.style.touchAction = ''; }
                document.body.style.overflow = ''; document.body.style.touchAction = '';
            }, 200);
        }
    }, 50);
}

// カード拡大アニメーション関数
function animateCardExpand(cardElement, backgroundColor, callback) {
    if (!cardElement) {
        if (callback) callback();
        return;
    }
    
    const rect = cardElement.getBoundingClientRect();
    
    // 先にバッジ、アイコン、タイトル、進捗バーをクローン（非表示にする前に）
    const badge = cardElement.querySelector('.level-badge');
    const categoryName = cardElement.querySelector('.category-name');
    // アイコンを探す（様々なクラス名に対応）
    const icon = cardElement.querySelector('.intro-icon, .irregular-verbs-icon, .all-words-icon, .category-icon, [class*="-icon"]:not(.category-arrow)');
    const progress = cardElement.querySelector('.category-progress');
    
    // 元の進捗バーの幅を取得（クローン前に）
    const progressWidth = progress ? progress.getBoundingClientRect().width : 0;
    // 縮小アニメーション時に使用するため保存
    if (progressWidth > 0) {
        lastExpandProgressWidth = progressWidth;
    }
    
    const badgeClone = badge ? badge.cloneNode(true) : null;
    const iconClone = icon ? icon.cloneNode(true) : null;
    const progressClone = progress ? progress.cloneNode(true) : null;
    const categoryText = categoryName ? categoryName.textContent.replace(/RANK\d/g, '').replace(/Level\d/g, '').trim() : '';
    
    // 元のカードはそのまま残す（非表示にしない）
    
    // オーバーレイ要素を作成
    const overlay = document.createElement('div');
    overlay.className = 'card-expand-overlay';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.opacity = '1';
    overlay.style.transition = 'none';
    
    // アイコン、バッジ、タイトルをオーバーレイに追加
    const titleContainer = document.createElement('div');
    titleContainer.className = 'expand-title';
    
    if (iconClone) {
        // クローンしたアイコンのvisibilityを確実にvisibleに
        iconClone.style.visibility = 'visible';
        iconClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
        titleContainer.appendChild(iconClone);
    }
    
    if (badgeClone) {
        // クローンしたバッジのvisibilityを確実にvisibleに
        badgeClone.style.visibility = 'visible';
        badgeClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
        titleContainer.appendChild(badgeClone);
    }
    
    if (categoryText) {
        const titleText = document.createElement('div');
        titleText.className = 'title-text';
        titleText.textContent = categoryText;
        titleContainer.appendChild(titleText);
    }
    
    if (progressClone && progressWidth > 0) {
        // クローンした進捗バーのvisibilityを確実にvisibleに
        progressClone.style.visibility = 'visible';
        progressClone.querySelectorAll('*').forEach(el => el.style.visibility = 'visible');
        // 進捗テキスト（0/0語など）は非表示にする
        const progressText = progressClone.querySelector('.category-progress-text');
        if (progressText) progressText.style.display = 'none';
        // 進捗バーの幅を元のカードに合わせる
        progressClone.style.width = progressWidth + 'px';
        progressClone.style.minWidth = progressWidth + 'px';
        progressClone.style.maxWidth = progressWidth + 'px';
        titleContainer.appendChild(progressClone);
    }
    
    overlay.appendChild(titleContainer);
    document.body.appendChild(overlay);
    
    // 3D回転用の設定
    overlay.style.transformStyle = 'preserve-3d';
    overlay.style.transform = 'perspective(1000px) rotateY(0deg)';
    
    // 効果音を再生
    SoundEffects.playMenuSelect();
    
    // 次のフレームでアニメーション開始
    requestAnimationFrame(() => {
        // 元のカードをグレーアウト
        cardElement.style.filter = 'grayscale(100%)';
        cardElement.style.opacity = '0.5';
        cardElement.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
        
        overlay.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.opacity = '1';
        overlay.style.transform = 'perspective(1000px) rotateY(360deg)';
        // バッジと文字も拡大
        titleContainer.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        titleContainer.style.transform = 'scale(1.5)';
    });
    
    // アニメーション完了後
    setTimeout(() => {
        if (callback) callback();
        // フェードアウトしてオーバーレイを削除
        overlay.style.transition = 'opacity 0.15s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 150);
    }, 400);
}

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
// 入試頻出度をS～Dランクに変換
function getAppearanceStars(count) {
    if (typeof count !== 'number' || isNaN(count) || count < 0) {
        return 'D';
    }
    if (count >= 50) {
        return 'S';
    } else if (count >= 20) {
        return 'A';
    } else if (count >= 5) {
        return 'B';
    } else if (count >= 1) {
        return 'C';
    } else {
        return 'D';
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
        lastLearningSourceElement = null;
        return;
    }
    
    // ソース要素（飛ばし元）を特定
    // 保存されたソース要素を優先的に使用
    let sourceElement = lastLearningSourceElement;
    
    // 保存されたソース要素が無効な場合のみフォールバック
    if (!sourceElement || !document.body.contains(sourceElement)) {
        const category = lastLearningCategory || '';
        const parentCategory = window.currentSubcategoryParent || '';
        const checkCategory = category + ' ' + parentCategory;
        
        console.log('カテゴリ判定（フォールバック）:', { category, parentCategory, checkCategory });
        
        // LEVEL1〜5の判定
        if (checkCategory.includes('レベル０') || checkCategory.includes('LEVEL0') || checkCategory.includes('入門')) {
            sourceElement = document.getElementById('level0CardBtn') || document.querySelector('[data-category*="LEVEL0"]');
        } else if (checkCategory.includes('レベル１') || checkCategory.includes('LEVEL1') || checkCategory.includes('初級')) {
            sourceElement = document.getElementById('level1CardBtn');
        } else if (checkCategory.includes('レベル２') || checkCategory.includes('LEVEL2') || checkCategory.includes('中級')) {
            sourceElement = document.getElementById('level2CardBtn');
        } else if (checkCategory.includes('レベル３') || checkCategory.includes('LEVEL3') || checkCategory.includes('上級')) {
            sourceElement = document.getElementById('level3CardBtn');
        } else if (checkCategory.includes('LEVEL4') || checkCategory.includes('難関')) {
            sourceElement = document.querySelector('[data-category*="LEVEL4"]');
        } else if (checkCategory.includes('LEVEL5') || checkCategory.includes('難関')) {
            sourceElement = document.querySelector('[data-category*="LEVEL5"]');
        }
        
        // それでも見つからない場合、学習していたカテゴリに最も近いカードを探す
        if (!sourceElement) {
            // 任意のLEVELカードをフォールバックとして使用
            sourceElement = document.getElementById('level1CardBtn') || 
                           document.getElementById('level2CardBtn') ||
                           document.getElementById('level3CardBtn');
        }
    }
    
    const targetElement = document.getElementById('schoolProgressBar');
    const progressWrapper = document.querySelector('.school-card-progress-bar-wrapper');
    if (!sourceElement || !targetElement) {
        console.log('アニメーション中止: 要素が見つかりません', { sourceElement, targetElement });
        lastLearningCategory = null;
        lastLearningSourceElement = null;
        return;
    }

    isAnimatingProgress = true;
    
    // ★アニメーションが見えるように画面を一番上にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTo({ top: 0, behavior: 'smooth' });
    
    // スクロール完了を待ってからアニメーション開始
    setTimeout(() => {
        startStarAnimation();
    }, 300);
    
    function startStarAnimation() {
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
    const staggerDelay = 120; // 星の出発間隔（ゆっくり吸い込まれるように）
    let completedCount = 0;
    
    // 進捗バーの現在値を保存（アニメーション前の値）
    const schoolProgressCurrentEl = document.getElementById('schoolProgressCurrent');
    const schoolProgressBarEl = document.getElementById('schoolProgressBar');
    const schoolProgressPercentEl = document.getElementById('schoolProgressPercent');
    
    // 新しい値を計算（selectedSchoolは上で既に取得済み）
    const newLearnedWords = calculateTotalLearnedWords();
    const requiredWords = selectedSchool ? calculateRequiredWords(selectedSchool.hensachi, selectedSchool.name) : 0;
    const newPercent = requiredWords > 0 ? Math.min(100, Math.round((newLearnedWords / requiredWords) * 100)) : 0;
    
    // 学習開始時の値を使用（DOM値は信頼できないため）
    const oldLearnedWords = learnedWordsAtStart;
    const oldPercent = requiredWords > 0 ? Math.min(100, Math.round((oldLearnedWords / requiredWords) * 100)) : 0;
    
    // 進捗バーの表示値を学習開始時の値に設定（アニメーション前の状態にする）
    if (schoolProgressCurrentEl) schoolProgressCurrentEl.textContent = oldLearnedWords;
    if (schoolProgressBarEl) schoolProgressBarEl.style.width = `${oldPercent}%`;
    if (schoolProgressPercentEl) schoolProgressPercentEl.textContent = oldPercent;
    
    for (let i = 0; i < starCount; i++) {
        setTimeout(() => {
            createFloatingStar(sourceRect, targetElement, () => {
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
                            schoolProgressCurrentEl, schoolProgressBarEl, schoolProgressPercentEl,
                            requiredWords
                        );
                        
                        // +○語のフローティングテキストを表示
                        if (learnedCount > 0) {
                            showFloatingAddedWords(learnedCount);
                        }
                        
                        // タップブロックオーバーレイを削除（フローティングテキスト表示後に遅延）
                        setTimeout(() => {
                            const blocker = document.getElementById('progressAnimationBlocker');
                            if (blocker) blocker.remove();
                        }, 800);
                        
                        isAnimatingProgress = false;
                        lastLearningCategory = null;
                        lastLearningSourceElement = null;
                    }, 200);
                }
            });
        }, i * staggerDelay);
    }
    
    // 進捗の数値をアニメーションで更新（1つずつカウントアップ）
    function animateProgressValues(oldWords, newWords, oldPct, newPct, wordEl, barEl, pctEl, actualRequiredWords) {
        const diff = newWords - oldWords;
        if (diff <= 0) {
            // 差がなければ即座に更新
            if (wordEl) wordEl.textContent = newWords;
            if (barEl) barEl.style.width = `${newPct}%`;
            if (pctEl) pctEl.textContent = newPct;
            return;
        }
        
        // 1つずつカウントアップ（最大2秒、最小間隔50ms）
        const interval = Math.max(70, Math.min(150, 3000 / diff));
        let currentWords = oldWords;
        // 正確な必須語数を使用（渡されていない場合はフォールバック）
        const requiredWords = actualRequiredWords > 0 ? actualRequiredWords : (newPct > 0 ? Math.round(newWords / (newPct / 100)) : newWords);
        
        function countUp() {
            currentWords++;
            const currentPct = requiredWords > 0 ? Math.min(100, Math.round((currentWords / requiredWords) * 100)) : newPct;
            
            // DOM更新
            if (wordEl) wordEl.textContent = currentWords;
            if (barEl) barEl.style.width = `${currentPct}%`;
            if (pctEl) pctEl.textContent = currentPct;
            
            if (currentWords < newWords) {
                setTimeout(countUp, interval);
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
        
        // 少し遅延してからカウントアップ開始
        setTimeout(countUp, 100);
    }

    // カラフルな★（白い外枠）を生成してふわっと飛ばす
    function createFloatingStar(sourceRect, targetElement, onComplete) {
        const star = document.createElement('div');
        const size = 22 + Math.random() * 16; // 22〜38px
        
        const sX = sourceRect.left + sourceRect.width / 2 + (Math.random() - 0.5) * 80;
        const sY = sourceRect.top + sourceRect.height / 2 + (Math.random() - 0.5) * 40;
        
        // ターゲット位置のランダムオフセットを固定（アニメーション開始時に決定）
        const targetOffsetRatio = Math.random(); // 0〜1の範囲でターゲットバー内の位置を決定
        
        // カラフルな色のバリエーション
        const starColors = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fb923c', '#f87171', '#22d3ee'];
        const randomColor = starColors[Math.floor(Math.random() * starColors.length)];
        
        // SVGの★アイコン（丸みのあるかわいい星）
        star.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.9));"><path d="M12 1.5c.4 0 .8.3 1 .7l2.5 5.3 5.7.9c.5.1.9.4 1 .9.1.4 0 .9-.3 1.2l-4.2 4.2 1 5.8c.1.5-.1.9-.5 1.2-.4.2-.8.2-1.2 0L12 18.8l-5 2.9c-.4.2-.8.2-1.2 0-.4-.2-.6-.7-.5-1.2l1-5.8-4.2-4.2c-.4-.3-.5-.8-.3-1.2.1-.5.5-.8 1-.9l5.7-.9 2.5-5.3c.2-.4.6-.7 1-.7z" fill="${randomColor}" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
        star.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${sX}px;
            top: ${sY}px;
            text-shadow: none;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            will-change: transform, opacity;
        `;
        document.body.appendChild(star);
        
        const duration = 2400 + Math.random() * 800; // 2.4〜3.2秒（吸い込まれる移動をゆっくりに）
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
            
            // 毎フレームでターゲットの現在位置を取得（スクロール対応）
            const currentTargetRect = targetElement.getBoundingClientRect();
            const eX = currentTargetRect.left + targetOffsetRatio * currentTargetRect.width;
            const eY = currentTargetRect.top + currentTargetRect.height / 2;
            
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
    
    // 進捗バーのグロー演出（キラキラ粒子エフェクト）
    function animateProgressBarGlow(bar, wrapper) {
        if (!bar || !wrapper) return;
        
        const wrapperRect = wrapper.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        
        // キラキラ粒子を生成
        const particleCount = 12;
        const colors = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'];
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const size = 6 + Math.random() * 8;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // バーの端（進捗位置）付近からスタート
                const startX = barRect.right - 10 + (Math.random() - 0.5) * 30;
                const startY = barRect.top + barRect.height / 2 + (Math.random() - 0.5) * 20;
                
                particle.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M12 1.5c.4 0 .8.3 1 .7l2.5 5.3 5.7.9c.5.1.9.4 1 .9.1.4 0 .9-.3 1.2l-4.2 4.2 1 5.8c.1.5-.1.9-.5 1.2-.4.2-.8.2-1.2 0L12 18.8l-5 2.9c-.4.2-.8.2-1.2 0-.4-.2-.6-.7-.5-1.2l1-5.8-4.2-4.2c-.4-.3-.5-.8-.3-1.2.1-.5.5-.8 1-.9l5.7-.9 2.5-5.3c.2-.4.6-.7 1-.7z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/></svg>`;
                particle.style.cssText = `
                    position: fixed;
                    left: ${startX}px;
                    top: ${startY}px;
                    pointer-events: none;
                    z-index: 10000;
                `;
                document.body.appendChild(particle);
                
                // アニメーション（飛び散りはゆっくりに）
                const angle = (Math.random() - 0.5) * Math.PI;
                const distance = 40 + Math.random() * 60;
                const duration = 1400 + Math.random() * 800; // 1.4〜2.2秒（つっくり）
                const startTime = performance.now();
                
                function animateParticle(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // イージング
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    
                    const x = startX + Math.cos(angle) * distance * easeOut;
                    const y = startY + Math.sin(angle) * distance * easeOut - progress * 30;
                    const scale = 1 - progress * 0.5;
                    const opacity = 1 - progress;
                    const rotation = progress * 360;
                    
                    particle.style.left = `${x}px`;
                    particle.style.top = `${y}px`;
                    particle.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
                    particle.style.opacity = opacity;
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        particle.remove();
                    }
                }
                requestAnimationFrame(animateParticle);
            }, i * 90); // 飛び散りの開始間隔もゆっくりに
        }
        
        // バーとラッパー（グレー部分）の色が少し変わる効果
        const originalBarBg = getComputedStyle(bar).backgroundColor;
        const originalWrapperBg = getComputedStyle(wrapper).backgroundColor;
        
        bar.style.transition = 'background-color 0.3s ease-out';
        bar.style.backgroundColor = '#60a5fa'; // 少し明るい青
        wrapper.style.transition = 'background-color 0.3s ease-out';
        wrapper.style.backgroundColor = '#d1d5db'; // 少し明るいグレー
        
        // 0.8秒後にリセット
        setTimeout(() => {
            bar.style.transition = 'background-color 0.5s ease-out';
            bar.style.backgroundColor = '';
            wrapper.style.transition = 'background-color 0.5s ease-out';
            wrapper.style.backgroundColor = '';
        }, 800);
    }
    
    // +○語のフローティングテキストを表示
    function showFloatingAddedWords(count) {
        // 表示時に進捗バーの現在位置を再取得
        const progressBar = document.getElementById('schoolProgressBar');
        if (!progressBar) return;
        
        const currentRect = progressBar.getBoundingClientRect();
        
        const floatingText = document.createElement('div');
        floatingText.innerHTML = `+${count}<span style="font-size: 16px;">語</span>`;
        floatingText.style.position = 'fixed';
        floatingText.style.left = `${currentRect.left + currentRect.width / 2}px`;
        floatingText.style.top = `${currentRect.top - 5}px`;
        floatingText.style.transform = 'translateX(-50%)';
        floatingText.style.fontFamily = "'Oswald', sans-serif";
        floatingText.style.fontSize = '24px';
        floatingText.style.fontWeight = '500';
        floatingText.style.color = '#2563eb';
        floatingText.style.textShadow = '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, -2px 0 0 #fff, 2px 0 0 #fff, 0 -2px 0 #fff, 0 2px 0 #fff';
        floatingText.style.zIndex = '10001';
        floatingText.style.pointerEvents = 'none';
        floatingText.style.opacity = '1';
        
        document.body.appendChild(floatingText);
        
        // アニメーション開始（上に上がりながらフェードアウト）
        setTimeout(() => {
            floatingText.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out';
            floatingText.style.transform = 'translateX(-50%) translateY(-50px)';
            floatingText.style.opacity = '0';
        }, 50);
        
        // 削除
        setTimeout(() => {
            floatingText.remove();
        }, 1600);
    }
    } // startStarAnimation関数の終わり
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
                // モーダルクローズ後に再度進捗バーを更新（確実に反映させる）
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        updateVocabProgressBar();
                    });
                });
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

// フリップ（単語カード）デッキ表示用の状態
let inputFlipDeckWords = [];
let inputFlipDeckIndex = 0;
let inputFlipDeckContext = null; // { progressCache, categoryCorrectSet, categoryWrongSet, skipProgress }
let inputFlipDeckEls = null; // { container, stage, host, prevBtn, nextBtn, counter }
let inputFlipDeckAllFlipped = false; // 全カードフリップ状態
let inputFlipDeckProgressPos = 0; // 表示用の進捗（1 / total の「1」を決める）
let inputFlipDeckFinished = false; // すべて飛ばし終わったか（カード位置に「もう一度」を出す）

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
    '難関レベルまで',
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

// でた度（appearanceCount）をランク値（1-5）に変換（フィルタ用）
// 5=S, 4=A, 3=B, 2=C, 1=D
function getStarRating(count) {
    if (count >= 50) return 5;  // S
    if (count >= 20) return 4;  // A
    if (count >= 5) return 3;   // B
    if (count >= 1) return 2;   // C
    return 1;                    // D
}

// 単語の進捗保存用カテゴリーを取得（小学生で習った単語、すべての単語の場合はword.categoryを使用）
function getProgressCategory(word) {
    if (selectedCategory === 'LEVEL0 入門600語' || selectedCategory === '大阪府のすべての英単語' || selectedCategory === '入試直前これだけ1200語') {
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
    
    if (selectedCategory === 'LEVEL0 入門600語') {
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


// 全単語データを取得（LEVEL0〜5 を欠けず含む。IDで重複除去しID順にソート）
function getAllWordData() {
    const vocabularyWords = (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function')
        ? getAllVocabulary()
        : [];
    const mainWords = Array.isArray(wordData) ? wordData : [];
    const elementaryWords = (typeof elementaryWordData !== 'undefined' && Array.isArray(elementaryWordData))
        ? elementaryWordData
        : [];
    // IDをキーに重複除去（vocabulary を優先し、同じ id は1件だけ）
    const byId = new Map();
    [...vocabularyWords, ...mainWords, ...elementaryWords].forEach(w => {
        if (w && w.id != null && !byId.has(w.id)) byId.set(w.id, w);
    });
    const merged = Array.from(byId.values());
    merged.sort((a, b) => (a.id - b.id));
    return merged;
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
        // 全単語は getAllWordData() で取得（LEVEL0〜5 を欠けずに含む）
        let allWords = getAllWordData();
        
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
        { displayName: '入門600語', dataName: 'LEVEL0 入門600語' },
        { displayName: '初級500語', dataName: 'LEVEL1 初級500語' },
        { displayName: '中級500語', dataName: 'LEVEL2 中級500語' },
        { displayName: '上級500語', dataName: 'LEVEL3 上級500語' },
        { displayName: 'Level4 ハイレベル300語', dataName: 'LEVEL4 ハイレベル300語' },
        { displayName: 'Level5 難関突破100語', dataName: 'LEVEL5 難関突破100語' },
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
        
        if (categoryDataName === 'LEVEL0 入門600語') {
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
                    const wordCategory = word.category || 'LEVEL1 初級500語';
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
            // タイムアタックモード：LEVEL1 初級500語の単語を使用
            if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
                const allWords = getAllVocabulary();
                categoryWords = allWords.filter(word => word.category === 'LEVEL1 初級500語');
            } else {
                categoryWords = wordData.filter(word => word.category === 'LEVEL1 初級500語');
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
        } else if (categoryDataName === 'LEVEL1 初級500語' || categoryDataName === 'LEVEL2 中級500語' || categoryDataName === 'LEVEL3 上級500語' || 
                   categoryDataName === 'LEVEL4 ハイレベル300語' || categoryDataName === 'LEVEL5 難関突破100語') {
            // レベル別単語：vocabulary-data.jsから取得（最適化）
            const levelMap = {
                'LEVEL1 初級500語': 1,
                'LEVEL2 中級500語': 2,
                'LEVEL3 上級500語': 3,
                'LEVEL4 ハイレベル300語': 4,
                'LEVEL5 難関突破100語': 5
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
        if (categoryDataName === 'LEVEL1 初級500語' || categoryDataName === 'LEVEL2 中級500語' || categoryDataName === 'LEVEL3 上級500語') {
            // 進捗率を計算（正解数、間違い数）
            let correctCountInCategory = 0;
            let wrongCountInCategory = 0;
            // 入力モード用のカウンター
            let inputModeCorrectCount = 0;
            let inputModeWrongCount = 0;
            
            // レベル番号を取得
            const levelMap = {
                'LEVEL1 初級500語': 1,
                'LEVEL2 中級500語': 2,
                'LEVEL3 上級500語': 3
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

// 細分化メニューの進捗バーを更新（50語ずつの範囲ベース）
function updateSubcategoryProgressBars() {
    // レベル別進捗バー更新関数
    function updateLevelProgressBar(categoryName, levelNum) {
        // 該当レベルの単語を取得
        let levelWords = [];
        if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
            levelWords = getVocabularyByLevel(levelNum);
        } else if (typeof getAllVocabulary !== 'undefined') {
            const allWords = getAllVocabulary();
            levelWords = allWords.filter(word => word.category && word.category.startsWith(`LEVEL${levelNum} `));
        }
        levelWords.sort((a, b) => a.id - b.id);
        
        const totalWords = levelWords.length;
        let correctCount = 0;
        let wrongCount = 0;
        
        const modes = ['card', 'input'];
        const allCorrectSet = new Set();
        const allWrongSet = new Set();
        
        // 50語ずつのサブカテゴリーキーを生成して進捗を計算（保存時と同じく単語IDでキーを生成）
        const chunkSize = 50;
        const numChunks = Math.ceil(totalWords / chunkSize);
        
        for (let i = 0; i < numChunks; i++) {
            const startIdx = i * chunkSize;
            const endIdx = Math.min(startIdx + chunkSize, totalWords);
            const wordsInChunk = levelWords.slice(startIdx, endIdx);
            const firstId = wordsInChunk.length > 0 ? wordsInChunk[0].id : startIdx + 1;
            const lastId = wordsInChunk.length > 0 ? wordsInChunk[wordsInChunk.length - 1].id : endIdx;
            const subcatKey = `LEVEL${levelNum}_${firstId}-${lastId}`;
            
            // 各モードの進捗を合算
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${subcatKey}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${subcatKey}_${mode}`);
                
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
        }
        
        // 各単語の進捗をチェック
        levelWords.forEach(word => {
            if (allWrongSet.has(word.id)) {
                wrongCount++;
            } else if (allCorrectSet.has(word.id)) {
                correctCount++;
            }
        });
        
        const correctPercent = totalWords === 0 ? 0 : (correctCount / totalWords) * 100;
        const wrongPercent = totalWords === 0 ? 0 : (wrongCount / totalWords) * 100;
        const completedCount = correctCount + wrongCount;
        const isComplete = totalWords > 0 && wrongCount === 0 && correctCount === totalWords;
        
        // DOM要素を更新
        const correctBar = document.getElementById(`progress-correct-${categoryName}`);
        const wrongBar = document.getElementById(`progress-wrong-${categoryName}`);
        const text = document.getElementById(`progress-text-${categoryName}`);
        const barContainer = correctBar ? correctBar.closest('.category-progress-bar') : null;
        
        if (correctBar) {
            correctBar.style.width = `${correctPercent}%`;
        }
        if (wrongBar) {
            wrongBar.style.left = `${correctPercent}%`;
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
            text.textContent = `${completedCount}/${totalWords}語`;
        }
    }
    
    // 各レベルの進捗バーを更新
    updateLevelProgressBar('入門600語', 0);
    updateLevelProgressBar('初級500語', 1);
    updateLevelProgressBar('中級500語', 2);
    updateLevelProgressBar('上級500語', 3);
    updateLevelProgressBar('LEVEL4 ハイレベル300語', 4);
    updateLevelProgressBar('LEVEL5 難関突破100語', 5);
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
            // 最初の部分は「LEVEL0 入門600語」として扱う
            // その後、LEVEL1 初級500語、LEVEL2 中級500語、LEVEL3 上級500語に分割
            // 注意: 実際のデータ構造に応じて調整が必要
            if (index < 600) {
                word.category = 'LEVEL1 初級500語';
            } else if (index < 800) {
                word.category = 'LEVEL2 中級500語';
            } else if (index < 900) {
                word.category = 'LEVEL3 上級500語';
            } else {
                // 900以降は「LEVEL0 入門600語」として扱う
                // または、データ構造に応じて調整
                word.category = 'LEVEL0 入門600語';
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

/** 横向き→縦向きに戻したときにビューポートの拡大が戻らない問題を防ぐ */
function resetViewportOnOrientationChange() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const setViewport = (content) => {
        meta.setAttribute('content', content);
    };

    const resetZoom = () => {
        const w = window.innerWidth;
        // 実際のピクセル幅を指定して強制的にレイアウトを再計算させる（カードが大きいままになるのを防ぐ）
        setViewport(`width=${w}, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`);
        requestAnimationFrame(() => {
            setViewport('width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        });
        window.scrollTo(0, 0);
    };

    window.addEventListener('orientationchange', () => {
        resetZoom();
        setTimeout(resetZoom, 200);
    });

    let lastInnerWidth = window.innerWidth;
    let lastInnerHeight = window.innerHeight;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const swapped = (w > h && lastInnerWidth < lastInnerHeight) || (w < h && lastInnerWidth > lastInnerHeight);
        lastInnerWidth = w;
        lastInnerHeight = h;
        if (swapped && resizeTimer === null) {
            resizeTimer = setTimeout(() => {
                resetZoom();
                resizeTimer = null;
            }, 150);
        }
    });
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
        resetViewportOnOrientationChange();
        assignCategories();
        loadData();
        initExamCountdown();
        setupEventListeners();
        initQuizModeListeners(); // 4択クイズモードのイベントリスナー
        initSchoolSelector();
        setupVolumeControl();
        initSpeechSynthesis(); // 音声合成を事前に初期化
        setupInputListModeToggle();
        setupInputListSettings();
        setupInputListFilter();
        setupRedSheetStickyScroll();
        updateVocabProgressBar();
        initAdBannerSlider();
        initStudyCalendar();
        
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
    
    // 入門600語のサブカテゴリ一覧（指定順）
    const elementarySubcategories = [
        '家族', '曜日・月・季節', '時間・時間帯', '数字', '色', '体', '文房具', '楽器', '衣類', '単位',
        '食べ物・飲み物', 'スポーツ', '動物', '教科', '学校（の種類）',
        '乗り物', '町の施設', '職業', '国や地域', '自然', '天気', '方角・方向'
    ];
    
    // カテゴリ別のサブカテゴリかどうかチェック
    const isElementarySubcategory = elementarySubcategories.some(sub => title.includes(sub));
    
    if (title.includes('LEVEL0') || title.includes('入門') || title.includes('レベル０') || title.includes('レベル0')) {
        return '<span class="level-badge level-badge-header level-badge-green">Level<b>0</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL1') || title.includes('初級') || title.includes('レベル１') || title.includes('レベル1')) {
        return '<span class="level-badge level-badge-header level-badge-red">Level<b>1</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL2') || title.includes('中級') || title.includes('レベル２') || title.includes('レベル2')) {
        return '<span class="level-badge level-badge-header level-badge-orange">Level<b>2</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL3') || title.includes('上級') || title.includes('レベル３') || title.includes('レベル3')) {
        return '<span class="level-badge level-badge-header level-badge-blue">Level<b>3</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL4') || title.includes('難関') || title.includes('レベル４') || title.includes('レベル4')) {
        return '<span class="level-badge level-badge-header level-badge-purple">Level<b>4</b></span> ' + cleanTitle;
    } else if (title.includes('LEVEL5') || title.includes('難関') || title.includes('レベル５') || title.includes('レベル5')) {
        return '<span class="level-badge level-badge-header level-badge-dark">Level<b>5</b></span> ' + cleanTitle;
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
        if (mode === 'course') {
            appHeader.classList.add('header-course-selection', 'header-align-bottom');
        } else {
            appHeader.classList.remove('header-course-selection', 'header-align-bottom');
        }
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
            // コース選択時：Levelバッジのみ中央に表示
            if (title === 'レベル０ 入門600語' || title === '入門600語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-green">Level<b>0</b></span>';
            } else if (title === 'レベル１ 初級500語' || title === '初級500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-red">Level<b>1</b></span>';
            } else if (title === 'レベル２ 中級500語' || title === '中級500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-orange">Level<b>2</b></span>';
            } else if (title === 'レベル３ 上級500語' || title === '上級500語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-blue">Level<b>3</b></span>';
            } else if (title === 'レベル４ ハイレベル300語' || title === 'ハイレベル300語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-purple">Level<b>4</b></span>';
            } else if (title === 'レベル５ 難関突破100語' || title === '難関突破100語') {
                headerTitleText.innerHTML = '<span class="level-badge level-badge-header level-badge-dark">Level<b>5</b></span>';
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

// 単語表示用：括弧は細字、括弧内（例: an）は太字（例: a (an)）
// 展開モード: 英単語が親要素からはみ出す場合に横縮小する
function fitWordToContainer(wordEl) {
    if (!wordEl || !wordEl.parentElement) return;
    // リセット
    wordEl.style.transform = '';
    wordEl.style.transformOrigin = '';
    // 描画後に実測するため rAF で遅延
    requestAnimationFrame(() => {
        const container = wordEl.parentElement;
        if (!container) return;
        const containerWidth = container.clientWidth - parseFloat(getComputedStyle(container).paddingLeft || 0) - parseFloat(getComputedStyle(container).paddingRight || 0);
        const wordWidth = wordEl.scrollWidth;
        if (wordWidth > containerWidth && containerWidth > 0) {
            const scale = Math.max(0.5, containerWidth / wordWidth);
            wordEl.style.transform = `scaleX(${scale.toFixed(3)})`;
            wordEl.style.transformOrigin = 'left center';
        }
    });
}

function formatWordForDisplay(wordStr) {
    if (!wordStr || typeof wordStr !== 'string') return null;
    if (!wordStr.includes(' (')) return null;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const m = wordStr.match(/^(.+?) \(([^)]*)\)(.*)$/);
    if (!m) return null;
    return esc(m[1]) + ' <span class="word-paren-light">(</span><span class="word-paren-bold">' + esc(m[2]) + '</span><span class="word-paren-light">)</span>' + esc(m[3]);
}

// 単語番号範囲パターンを検出してリッチHTMLに変換するヘルパー（Section1 単語番号0101-0150 形式でヘッダー表示）
function formatUnitNameHTML(unitName) {
    const pad4 = (n) => String(n).padStart(4, '0');
    // #番号#No.○-○ → SectionN 単語番号0101-0150 表示
    const matchWithNum = String(unitName).match(/^#(\d+)#No\.(\d+)-(\d+)$/);
    if (matchWithNum) {
        const sectionNum = matchWithNum[1];
        const fromNum = pad4(matchWithNum[2]);
        const toNum = pad4(matchWithNum[3]);
        return `<span class="unit-name-section">Section</span><span class="unit-name-section-n">${sectionNum}</span> <span class="header-range-block header-range-white"><span class="header-range-no">単語番号</span><span class="header-range-nums">${fromNum}<span class="header-range-sep">-</span>${toNum}</span></span>`;
    }
    // No.○-○ のみのパターン → 単語番号0101-0150
    const match = String(unitName).match(/^No\.(\d+)-(\d+)$/);
    if (match) {
        const fromNum = pad4(match[1]);
        const toNum = pad4(match[2]);
        return `<span class="header-range-block header-range-white"><span class="header-range-no">単語番号</span><span class="header-range-nums">${fromNum}<span class="header-range-sep">-</span>${toNum}</span></span>`;
    }
    return null;
}

// 親カテゴリまたはカテゴリ文字列からSECTION色用のレベルクラスを取得
function getSectionLevelClass(categoryOrParent) {
    const s = String(categoryOrParent || '');
    if (/LEVEL0|入門|レベル０|レベル0/i.test(s)) return 'unit-header-level-0';
    if (/LEVEL1|初級|レベル１|レベル1/i.test(s)) return 'unit-header-level-1';
    if (/LEVEL2|中級|レベル２|レベル2/i.test(s)) return 'unit-header-level-2';
    if (/LEVEL3|上級|レベル３|レベル3/i.test(s)) return 'unit-header-level-3';
    if (/LEVEL4|ハイレベル|レベル４|レベル4/i.test(s)) return 'unit-header-level-4';
    if (/LEVEL5|難関|レベル５|レベル5/i.test(s)) return 'unit-header-level-5';
    return null;
}

// 学習ヘッダーにSECTION用レベルクラスを適用（白ヘッダー時の色用）
function applySectionLevelToHeader(categoryOrParent) {
    const container = document.querySelector('.unit-header-container');
    if (!container) return;
    const levelClass = getSectionLevelClass(categoryOrParent);
    container.classList.remove('unit-header-level-0', 'unit-header-level-1', 'unit-header-level-2', 'unit-header-level-3', 'unit-header-level-4', 'unit-header-level-5');
    if (levelClass) container.classList.add(levelClass);
}

// 要素にunitNameを設定（No.パターンならリッチHTML）
function setUnitNameContent(el, unitName) {
    if (!el) return;
    const richHTML = formatUnitNameHTML(unitName);
    // 学習画面ヘッダー中央は「Section1」「Section2」のように数字付きで表示
    if (el.id === 'unitName' && richHTML) {
        const matchWithNum = String(unitName).match(/^#(\d+)#No\.\d+-\d+$/);
        const sectionNum = matchWithNum ? matchWithNum[1] : '';
        el.innerHTML = sectionNum
            ? `<span class="unit-name-section">Section</span><span class="unit-name-section-n">${sectionNum}</span>`
            : 'Section';
        return;
    }
    if (richHTML) {
        el.innerHTML = richHTML;
    } else {
        const formattedTitle = formatTitleWithLevelBadge(unitName);
        if (formattedTitle !== unitName) {
            el.innerHTML = formattedTitle;
        } else {
            el.textContent = unitName;
        }
    }
}

// ヘッダーの単元名を更新
function updateHeaderUnitName(unitName) {
    const headerUnitName = document.getElementById('headerUnitName');
    if (headerUnitName) {
        const richHTML = formatUnitNameHTML(unitName);
        if (richHTML) {
            headerUnitName.innerHTML = richHTML;
        } else {
            headerUnitName.textContent = unitName;
        }
    }
}

// カテゴリー選択画面を表示
function showCategorySelection(slideIn = false, skipScroll = false) {
    // 学習セッション終了（時間を記録）
    endStudySession();
    
    // 戻り先情報をクリア
    returnToCourseInfo = null;
    
    // スクロール位置を一番上にリセット
    if (!skipScroll) {
        window.scrollTo(0, 0);
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollTop = 0;
    }
    
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
            
            // 学習後にホームに戻った時、進捗アニメーションを実行
            if (lastLearningCategory) {
                setTimeout(() => {
                    animateProgressToGoal();
                    // アニメーション後にカテゴリをリセット
                    lastLearningCategory = null;
                    lastLearningSourceElement = null;
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
    
    // フローティング要復習ボタンを表示（ホーム画面のみ）
    showFloatingReviewBtn();
}

// 学習メニュー（コース選択画面）に戻る（中断時用）
function returnToLearningMenu(category) {
    // 学習セッション終了
    endStudySession();
    
    // 既存のモーダル/オーバーレイをすべて閉じる
    const overlaysToClose = [
        'studyModeOverlay',
        'learningMenuOverlay',
        'ivModeOverlay'
    ];
    overlaysToClose.forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) overlay.remove();
    });
    // study-mode-overlayクラスを持つ要素もすべて削除
    document.querySelectorAll('.study-mode-overlay').forEach(el => el.remove());
    
    // フィルター画面（テストの設定画面）を閉じる
    const wordFilterView = document.getElementById('wordFilterView');
    const filterOverlay = document.getElementById('filterOverlay');
    if (wordFilterView) {
        wordFilterView.classList.add('hidden');
        wordFilterView.classList.remove('show');
    }
    if (filterOverlay) {
        filterOverlay.classList.add('hidden');
        filterOverlay.classList.remove('show');
    }
    
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
    
    document.body.classList.remove('learning-mode');
    updateThemeColor(false);
    
    // メインコンテンツ（学習画面全体）を非表示にする
    if (elements.mainContent) {
        elements.mainContent.classList.add('hidden');
    }
    
    // すべての学習モードを非表示にする
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    const inputMode = document.getElementById('inputMode');
    const sentenceMode = document.getElementById('sentenceMode');
    const reorderMode = document.getElementById('reorderMode');
    const cardHint = document.getElementById('cardHint');
    const handwritingQuizView = document.getElementById('handwritingQuizView');
    const cardTopSection = document.querySelector('.card-top-section');
    const choiceMode = document.getElementById('choiceQuestionMode');
    const inputListView = document.getElementById('inputListView');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (sentenceMode) sentenceMode.classList.add('hidden');
    if (reorderMode) reorderMode.classList.add('hidden');
    if (choiceMode) choiceMode.classList.add('hidden');
    if (cardHint) cardHint.classList.add('hidden');
    if (handwritingQuizView) handwritingQuizView.classList.add('hidden');
    if (cardTopSection) cardTopSection.classList.add('hidden');
    if (inputListView) inputListView.classList.add('hidden');
    
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
    
    // 最新のデータを読み込み
    loadData();
    
    // サブカテゴリー選択画面の親カテゴリーがあればそこに戻る
    const parent = window.currentSubcategoryParent;
    if (parent === 'レベル１ 初級500語' || parent === 'レベル２ 中級500語' || 
        parent === 'レベル３ 上級500語' || parent === 'レベル４ ハイレベル300語' || 
        parent === 'レベル５ 難関突破100語') {
        showLevelSubcategorySelection(parent, true);
    } else if (parent === '入門600語') {
        showElementaryCategorySelection(true);
    } else if (returnToCourseInfo && returnToCourseInfo.category && returnToCourseInfo.words) {
        // 保存されたコース情報があればそのコース選択画面に戻る
        // skipSaveReturnInfo = true で、戻り情報を上書きしない
        showCourseSelection(returnToCourseInfo.category, returnToCourseInfo.words, false, true);
    } else {
        // 情報がなければホーム画面に戻る
        showCategorySelection();
    }
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
    // フローティング要復習ボタンを非表示（サブカテゴリー画面への遷移）
    hideFloatingReviewBtn();
    
    // デバッグ用ログ
    console.log('startCategory called with category:', category);
    selectedCategory = category;
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
    lastLearningCategory = category;
    // モード用のボディクラスをいったんリセット
    document.body.classList.remove('sentence-mode-active', 'reorder-mode-active', 'choice-question-mode-active');
    isChoiceQuestionModeActive = false;
    
    // LEVEL0 入門600語の場合は、elementaryWordDataを使用
    let categoryWords;
    if (category === '基本語彙500') {
        // 基本語彙500コースは削除されました
        showAlert('エラー', 'このコースは利用できません。');
        return;
    } else if (category === 'LEVEL1 初級500語' || category === 'LEVEL2 中級500語' || category === 'LEVEL3 上級500語' || 
               category === 'LEVEL4 ハイレベル300語' || category === 'LEVEL5 難関突破100語') {
        // レベル別単語：vocabulary-data.jsから取得（最適化）
        console.log('Loading level vocabulary:', category);
        const levelMap = {
            'LEVEL1 初級500語': 1,
            'LEVEL2 中級500語': 2,
            'LEVEL3 上級500語': 3,
            'LEVEL4 ハイレベル300語': 4,
            'LEVEL5 難関突破100語': 5
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
    } else if (category === 'LEVEL0 入門600語') {
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
        // タイムアタックモード：LEVEL1 初級500語の単語を使用
        if (typeof getAllVocabulary !== 'undefined' && typeof getAllVocabulary === 'function') {
            const allWords = getAllVocabulary();
            categoryWords = allWords.filter(word => word.category === 'LEVEL1 初級500語');
        } else {
            categoryWords = wordData.filter(word => word.category === 'LEVEL1 初級500語');
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
    
    if (isVocabularySubcategory && !isReturningToLearningMenu) {
        // サブカテゴリーの場合は直接フィルター画面を表示（戻る時以外）
        console.log('Vocabulary subcategory detected, showing filter view directly');
        currentCourseWords = categoryWords;
        // カテゴリー選択画面を非表示、コース選択画面を表示してからフィルター画面を表示
        elements.categorySelection.classList.add('hidden');
        const courseSelection = document.getElementById('courseSelection');
        if (courseSelection) {
            courseSelection.classList.remove('hidden');
        }
        showWordFilterView(category, categoryWords, category);
    } else if (isVocabularySubcategory && isReturningToLearningMenu) {
        // サブカテゴリーから戻る場合はホーム画面に戻る
        console.log('Returning from vocabulary subcategory, going to home');
        showCategorySelection();
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
    // 学習セッション開始
    startStudySession();
    
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
        if (category === 'LEVEL0 入門600語') {
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
        setUnitNameContent(elements.unitName, displayTitle);
    }
    
    // ヘッダーの単元名も更新
    updateHeaderUnitName(displayTitle);
    // SECTIONの色をLEVELに合わせる（白ヘッダー用）
    if (String(displayTitle).match(/^#\d+#No\.\d+-\d+$/)) {
        applySectionLevelToHeader(category || window.currentSubcategoryParent);
    } else {
        applySectionLevelToHeader(null);
    }
    
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

// 単語番号をフォーマット（例: 1 → "1", 798 → "798"）
function formatWordNumber(num) {
    return String(num);
}

// 50語ずつのサブカテゴリーカードを生成する共通関数
function generate50WordSubcategoryCards(levelWords, levelNum, parentCategory, courseList, badgeColor, badgeBgColor) {
    const chunkSize = 50;
    const totalWords = levelWords.length;
    const numChunks = Math.ceil(totalWords / chunkSize);
    
    for (let i = 0; i < numChunks; i++) {
        const startIdx = i * chunkSize;
        const endIdx = Math.min(startIdx + chunkSize, totalWords);
        const words = levelWords.slice(startIdx, endIdx);
        const wordCount = words.length;
        
        // 単語番号の範囲（実際の単語IDを使用）
        const firstId = wordCount > 0 ? words[0].id : startIdx + 1;
        const lastId = wordCount > 0 ? words[wordCount - 1].id : endIdx;
        const chunkNum = i + 1;
        const rangeLabel = `#${chunkNum}#No.${formatWordNumber(firstId)}-${formatWordNumber(lastId)}`;
        const subcatKey = `LEVEL${levelNum}_${firstId}-${lastId}`;
        
        // 進捗を計算
        let correctCount = 0;
        let wrongCount = 0;
        let inputModeCorrectCount = 0;
        let inputModeWrongCount = 0;
        
        if (words.length > 0) {
            const modes = ['card', 'input'];
            const allCorrectSet = new Set();
            const allWrongSet = new Set();
            const inputCorrectSet = new Set();
            const inputWrongSet = new Set();
            
            modes.forEach(mode => {
                const savedCorrectWords = localStorage.getItem(`correctWords-${subcatKey}_${mode}`);
                const savedWrongWords = localStorage.getItem(`wrongWords-${subcatKey}_${mode}`);
                
                if (savedCorrectWords) {
                    JSON.parse(savedCorrectWords).forEach(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        if (!allWrongSet.has(numId)) {
                            allCorrectSet.add(numId);
                        }
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
                if (inputWrongSet.has(word.id)) {
                    inputModeWrongCount++;
                } else if (inputCorrectSet.has(word.id)) {
                    inputModeCorrectCount++;
                }
            });
        }
        
        const correctPercent = wordCount > 0 ? (correctCount / wordCount) * 100 : 0;
        const wrongPercent = wordCount > 0 ? (wrongCount / wordCount) * 100 : 0;
        
        const isComplete = wordCount > 0 && wrongCount === 0 && correctCount === wordCount;
        const isInputModeComplete = wordCount > 0 && inputModeWrongCount === 0 && inputModeCorrectCount === wordCount;
        
        let progressBarClass = 'category-progress-bar';
        if (isInputModeComplete) {
            progressBarClass = 'category-progress-bar category-progress-complete-input';
        } else if (isComplete) {
            progressBarClass = 'category-progress-bar category-progress-complete';
        }
        
        const card = document.createElement('div');
        card.className = 'category-card category-card-with-actions';
        card.setAttribute('data-level-total', String(totalWords));
        
        card.innerHTML = `
            <div class="category-info">
                <div class="subcat-top-row">
                    <span class="subcat-section" style="color: ${badgeColor}; --subcat-marker: ${badgeBgColor}">Section<span class="subcat-section-n">${i + 1}</span></span>
                    <span class="subcat-range-card"><span class="subcat-range-no">単語番号</span><span class="subcat-range-nums">${String(firstId).padStart(4, '0')}<span class="subcat-range-sep">-</span>${String(lastId).padStart(4, '0')}</span></span>
                </div>
                <div class="subcat-progress-row">
                    <div class="${progressBarClass}">
                        <div class="category-progress-correct" style="width: ${correctPercent}%"></div>
                        <div class="category-progress-wrong" style="width: ${wrongPercent}%"></div>
                    </div>
                    <span class="subcat-progress-num">${correctCount}<span class="subcat-progress-slash">/</span>${wordCount}</span>
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
                const total = parseInt(card.getAttribute('data-level-total') || '0', 10);
                showInputModeDirectly(subcatKey, words, rangeLabel, total > 0 ? total : undefined);
            });
        }
        
        if (outputBtn) {
            outputBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWordFilterView(subcatKey, words, rangeLabel);
            });
        }
        
        if (categoryInfo) {
            categoryInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseActionModal(subcatKey, words, rangeLabel);
            });
        }
        
        courseList.appendChild(card);
    }
}

// 入門600語の画面を表示
function showElementaryCategorySelection(skipAnimation = false) {
    // フローティング要復習ボタンを非表示（サブカテゴリー画面）
    hideFloatingReviewBtn();
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 進捗アニメーション用：入門600語カード要素を保存
    lastLearningSourceElement = document.getElementById('elementaryCategoryCardBtn');
    
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
    const formattedTitle = formatTitleWithLevelBadge('入門600語');
    courseTitle.innerHTML = formattedTitle;
    courseList.innerHTML = '';
    
    // 画像を非表示
    if (courseSelectionImage) {
        courseSelectionImage.style.display = 'none';
    }
    
    // 説明文を設定
    if (courseSelectionDescription) {
        courseSelectionDescription.textContent = '小学生で習った単語を中心に入門レベルの単語を覚えよう';
        courseSelectionDescription.style.display = 'block';
    }
    
    // Level0の単語を取得（ID 1-600）
    let level0Words = [];
    if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
        level0Words = getVocabularyByLevel(0);
    } else if (typeof getAllVocabulary !== 'undefined') {
        const allWords = getAllVocabulary();
        level0Words = allWords.filter(word => word.category && word.category.startsWith('LEVEL0 '));
    }
    // IDでソート
    level0Words.sort((a, b) => a.id - b.id);
    
    // 50語ずつのカードを生成（Section色はLevelバッジと統一）
    generate50WordSubcategoryCards(level0Words, 0, '入門600語', courseList, '#0369a1', '#bae6fd');
    
    // 一番下に大阪の画像を追加
    const osakaFooterImg = document.createElement('div');
    osakaFooterImg.className = 'osaka-footer-container';
    osakaFooterImg.innerHTML = `<img src="osaka.png" alt="大阪" class="osaka-footer-img">`;
    courseList.appendChild(osakaFooterImg);
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', '入門600語');
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
        
    }
    
    // ナビゲーション状態を更新
    updateNavState('courseSelection');

    // 戻るボタン用にparentCategoryを保存
    window.currentSubcategoryParent = '入門600語';
}

// レベル別細分化メニューを表示（50語ずつ）
function showLevelSubcategorySelection(parentCategory, skipAnimation = false) {
    // フローティング要復習ボタンを非表示（サブカテゴリー画面）
    hideFloatingReviewBtn();
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 進捗アニメーション用：親カテゴリに対応するカード要素を保存
    if (parentCategory === 'レベル１ 初級500語') {
        lastLearningSourceElement = document.getElementById('level1CardBtn');
    } else if (parentCategory === 'レベル２ 中級500語') {
        lastLearningSourceElement = document.getElementById('level2CardBtn');
    } else if (parentCategory === 'レベル３ 上級500語') {
        lastLearningSourceElement = document.getElementById('level3CardBtn');
    } else if (parentCategory === 'レベル４ ハイレベル300語') {
        lastLearningSourceElement = document.getElementById('level4CardBtn');
    } else if (parentCategory === 'レベル５ 難関突破100語') {
        lastLearningSourceElement = document.getElementById('level5CardBtn');
    }
    
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
    
    // レベル番号と色を設定
    let levelNum = 0;
    let badgeColor = '';
    let badgeBgColor = '';
    let badgeClass = '';
    let description = '';
    
    /* Sectionラベルの色はLevelバッジと統一（薄い青） */
    badgeColor = '#0369a1';
    badgeBgColor = '#bae6fd';
    if (parentCategory === 'レベル１ 初級500語') {
        levelNum = 1;
        badgeClass = 'level-badge-red';
        description = '中1で習った単語を中心に初級レベルの単語を覚えよう';
        courseTitle.innerHTML = '<span class="level-badge level-badge-red">Level<b>1</b></span> 初級500語';
    } else if (parentCategory === 'レベル２ 中級500語') {
        levelNum = 2;
        badgeClass = 'level-badge-orange';
        description = '中2で習った単語を中心に中級レベルの単語を覚えよう';
        courseTitle.innerHTML = '<span class="level-badge level-badge-orange">Level<b>2</b></span> 中級500語';
    } else if (parentCategory === 'レベル３ 上級500語') {
        levelNum = 3;
        badgeClass = 'level-badge-blue';
        description = '中3で習った単語を中心に上級レベルの単語を覚えよう';
        courseTitle.innerHTML = '<span class="level-badge level-badge-blue">Level<b>3</b></span> 上級500語';
    } else if (parentCategory === 'レベル４ ハイレベル300語') {
        levelNum = 4;
        badgeClass = 'level-badge-purple';
        description = '差がつくハイレベルな単語を覚えよう';
        courseTitle.innerHTML = '<span class="level-badge level-badge-purple">Level<b>4</b></span> ハイレベル300語';
    } else if (parentCategory === 'レベル５ 難関突破100語') {
        levelNum = 5;
        badgeClass = 'level-badge-dark';
        description = '難関突破レベルの単語を覚えよう';
        courseTitle.innerHTML = '<span class="level-badge level-badge-dark">Level<b>5</b></span> 難関突破100語';
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
        if (description) {
            courseSelectionDescription.textContent = description;
            courseSelectionDescription.style.display = 'block';
        } else {
            courseSelectionDescription.style.display = 'none';
        }
    }
    
    // 該当レベルの単語を取得
    let levelWords = [];
    if (typeof getVocabularyByLevel !== 'undefined' && typeof getVocabularyByLevel === 'function') {
        levelWords = getVocabularyByLevel(levelNum);
    } else if (typeof getAllVocabulary !== 'undefined') {
        const allWords = getAllVocabulary();
        levelWords = allWords.filter(word => word.category && word.category.startsWith(`LEVEL${levelNum} `));
    }
    // IDでソート
    levelWords.sort((a, b) => a.id - b.id);
    
    // 50語ずつのカードを生成
    generate50WordSubcategoryCards(levelWords, levelNum, parentCategory, courseList, badgeColor, badgeBgColor);
    
    // 一番下に大阪の画像を追加
    const osakaFooterImg = document.createElement('div');
    osakaFooterImg.className = 'osaka-footer-container';
    osakaFooterImg.innerHTML = `<img src="osaka.png" alt="大阪" class="osaka-footer-img">`;
    courseList.appendChild(osakaFooterImg);
    
    // ヘッダーの戻るボタンを表示
    updateHeaderButtons('course', parentCategory);
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
    }
    
    // ナビゲーション状態を更新
    updateNavState('courseSelection');
    
    // 戻るボタン用にparentCategoryを保存
    window.currentSubcategoryParent = parentCategory;
}

// コース選択画面を表示（100刻み）
function showCourseSelection(category, categoryWords, slideIn = false, skipSaveReturnInfo = false) {
    // 中断時に戻るためのコース情報を保存（戻り時の呼び出しではスキップ）
    // 配列は参照渡しなのでコピーを保存
    if (!skipSaveReturnInfo) {
        returnToCourseInfo = { category, words: [...categoryWords] };
    }
    
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
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
    if (category === 'LEVEL0 入門600語') {
        displayCategory = '入門600語';
    } else if (category === 'LEVEL1 初級500語') {
        displayCategory = '初級500語';
    } else if (category === 'LEVEL2 中級500語') {
        displayCategory = '中級500語';
    } else if (category === 'LEVEL3 上級500語') {
        displayCategory = '上級500語';
    } else if (category === 'LEVEL4 ハイレベル300語') {
        displayCategory = 'ハイレベル300語';
    } else if (category === 'LEVEL5 難関突破100語') {
        displayCategory = '難関突破100語';
    }
    courseTitle.textContent = `${displayCategory} - コースを選んでください`;
    courseList.innerHTML = '';
    
    // 説明文を非表示（通常のコース選択画面では説明文は表示しない）
    if (courseSelectionDescription) {
        courseSelectionDescription.style.display = 'none';
    }
    
    console.log('Course title set and list cleared');
    
    // LEVEL0 入門600語の場合は、固定のサブコースを表示
    if (category === 'LEVEL0 入門600語') {
        console.log('Detected elementary category, creating accordion sections...');
        // 入門基本単語グループ（指定順）
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
            if (groupTitle === '入門基本単語') {
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

            // 「入門基本単語」の場合のみ、説明テキスト（注釈）を先頭に表示
            if (groupTitle === '入門基本単語') {
                const note = document.createElement('p');
                note.className = 'course-group-note';
                note.textContent = '基礎から入門600語をまとめています。';
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
        addCourseGroup('入門基本単語', elementaryCourses);
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
    
    // 画面遷移
    const categorySelection = document.getElementById('categorySelection');
    
    if (categorySelection && courseSelection) {
        categorySelection.classList.add('hidden');
        courseSelection.classList.remove('hidden');
    } else {
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
    // 学習セッション開始
    startStudySession();
    
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
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
    if (category === 'LEVEL0 入門600語') {
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
        const hasWords = filteredWords.length > 0;
        questionCountSection.style.display = hasWords ? '' : 'none';
        
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
    if (currentFilterCategory === 'LEVEL0 入門600語') {
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
function showInputModeDirectly(category, words, courseTitle, totalWordsForProgress) {
    // 進捗バー用：セクション表示時はレベル総数、それ以外は0（renderInputListViewでwords.lengthを使う）
    window.inputListViewTotalWords = totalWordsForProgress !== undefined ? totalWordsForProgress : 0;
    // 学習セッション開始
    startStudySession();
    
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    // スクロール位置を一番上にリセット
    window.scrollTo(0, 0);
    const appMain = document.querySelector('.app-main');
    if (appMain) appMain.scrollTop = 0;
    
    // コンパクトモードをデフォルト（オフ）にリセット
    const inputListContainer = document.getElementById('inputListContainer');
    const compactToggleBtn = document.getElementById('compactModeToggleBtn');
    if (compactToggleBtn) {
        compactToggleBtn.classList.remove('active');
    }
    if (inputListContainer) {
        inputListContainer.classList.remove('compact-mode');
        inputListContainer.classList.remove('hide-examples');
        inputListContainer.classList.remove('all-words-mode');
    }
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
    lastLearningCategory = category;
    console.log('showInputModeDirectly: 学習開始', { category, learnedWordsAtStart });
    
    // インプットモードに設定
    currentLearningMode = 'input';
    
    selectedCategory = category;
    currentCourseWords = words;
    currentFilterCourseTitle = courseTitle;
    currentFilterWords = words;
    currentFilterCategory = category;
    
    // 「すべての単語」モードの場合、検索を表示（でた度で絞るは非表示のまま）
    const isAllWords = category === '大阪府のすべての英単語';
    const freqSection = document.getElementById('filterFrequencySection');
    const wordSearchContainer = document.getElementById('wordSearchContainer');
    
    if (freqSection) freqSection.classList.add('hidden');
    if (isAllWords) {
        if (wordSearchContainer) wordSearchContainer.classList.remove('hidden');
    } else {
        if (wordSearchContainer) wordSearchContainer.classList.add('hidden');
    }
    
    // コース選択画面を即座に非表示
    const courseSelection = document.getElementById('courseSelection');
    if (courseSelection) {
        courseSelection.classList.add('hidden');
    }
    
    // カテゴリー選択画面を即座に非表示
    elements.categorySelection.classList.add('hidden');
    
    // メインコンテンツを表示
    elements.mainContent.classList.remove('hidden');
    
    // テストへボタンを表示（インプットモードなので常に表示、ただし「すべての単語」では非表示）
    const unitTestBtn = document.getElementById('unitTestBtn');
    if (unitTestBtn) {
        if (category === '大阪府のすべての英単語') {
            unitTestBtn.classList.add('hidden');
        } else {
            unitTestBtn.classList.remove('hidden');
        }
    }
    
    // ヘッダー更新
    updateHeaderButtons('learning');
    const title = courseTitle || category;
    if (elements.unitName) {
        setUnitNameContent(elements.unitName, title);
    }
    // ヘッダーの単元名も更新
    updateHeaderUnitName(title);
    // SECTIONの色をLEVELに合わせる（白ヘッダー用）
    if (String(title).match(/^#\d+#No\.\d+-\d+$/)) {
        applySectionLevelToHeader(category || window.currentSubcategoryParent);
    } else {
        applySectionLevelToHeader(null);
    }
    
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
    
    // input-list-header-rowを表示（モードトグルボタン等）。「すべての単語」のときはトグル行ごと非表示（単語帳のみ）
    const inputListHeaderRow = document.querySelector('.input-list-header-row');
    if (inputListHeaderRow) {
        if (category === '大阪府のすべての英単語') {
            inputListHeaderRow.style.display = 'none';
        } else {
            inputListHeaderRow.style.display = '';
        }
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
    
    // 赤シートボタンの表示状態を更新（展開モードでは表示）
    updateRedSheetToggleVisibility();
    
    // 「すべての単語」モードの場合はデフォルトでコンパクト表示をON
    if (category === '大阪府のすべての英単語') {
        const compactToggleBtn = document.getElementById('compactModeToggleBtn');
        const listContainer = document.getElementById('inputListContainer');
        if (compactToggleBtn) compactToggleBtn.classList.add('active');
        if (listContainer) {
            listContainer.classList.add('compact-mode');
            listContainer.classList.add('hide-examples');
        }
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
                <button type="button" class="learning-menu-category-btn" data-category="初級500語">
                    <span class="learning-menu-category-title">初級500語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="中級500語">
                    <span class="learning-menu-category-title">中級500語</span>
                </button>
                <button type="button" class="learning-menu-category-btn" data-category="上級500語">
                    <span class="learning-menu-category-title">上級500語</span>
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
    if (category === '初級500語') {
        subcategories = [
            '入門600語',
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
    } else if (category === '中級500語') {
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
    } else if (category === '上級500語') {
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
    // 連続正解カウントをリセット
    quizStreakCount = 0;
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
    lastLearningCategory = category;
    console.log('startLearningFromMenu: 学習開始', { category, learnedWordsAtStart });
    
    let words = [];
    
    // カテゴリーに応じてレベルを決定
    let levelCategory = '';
    if (category === '初級500語') {
        levelCategory = 'LEVEL1 初級500語';
    } else if (category === '中級500語') {
        levelCategory = 'LEVEL2 中級500語';
    } else if (category === '上級500語') {
        levelCategory = 'LEVEL3 上級500語';
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
        if (subcategory === '入門600語') {
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
    // 学習セッション開始
    startStudySession();
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
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
        setUnitNameContent(elements.unitName, displayTitleTA);
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
    // 学習セッション開始
    startStudySession();
    
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
    quizStreakCount = 0; // 連続正解カウントをリセット（新しい学習セッション）
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
        if (category === 'LEVEL0 入門600語') {
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
        setUnitNameContent(elements.unitName, displayTitle);
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
        // 赤シートボタンの表示状態を更新
        updateRedSheetToggleVisibility();
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
    
    // 入門600語カード
    const elementaryCategoryCardBtn = document.getElementById('elementaryCategoryCardBtn');
    if (elementaryCategoryCardBtn) {
        elementaryCategoryCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(elementaryCategoryCardBtn, '#ffffff', () => {
                showElementaryCategorySelection();
            });
        });
    }
    
    // カテゴリー別カード（レベル・グループ一覧へスクロール）
    const categoryByCardBtn = document.getElementById('categoryByCardBtn');
    if (categoryByCardBtn) {
        categoryByCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = document.getElementById('courseMasterSection');
            const list = document.querySelector('.category-list');
            const target = section || list;
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // レベル１ 初級500語カード
    const level1CardBtn = document.getElementById('level1CardBtn');
    if (level1CardBtn) {
        level1CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(level1CardBtn, '#ffffff', () => {
                showLevelSubcategorySelection('レベル１ 初級500語');
            });
        });
    }
    
    // レベル２ 中級500語カード
    const level2CardBtn = document.getElementById('level2CardBtn');
    if (level2CardBtn) {
        level2CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(level2CardBtn, '#ffffff', () => {
                showLevelSubcategorySelection('レベル２ 中級500語');
            });
        });
    }
    
    // レベル３ 上級500語カード
    const level3CardBtn = document.getElementById('level3CardBtn');
    if (level3CardBtn) {
        level3CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(level3CardBtn, '#ffffff', () => {
                showLevelSubcategorySelection('レベル３ 上級500語');
            });
        });
    }
    
    // レベル４ ハイレベル300語カード
    const level4CardBtn = document.getElementById('level4CardBtn');
    if (level4CardBtn) {
        level4CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(level4CardBtn, '#ffffff', () => {
                showLevelSubcategorySelection('レベル４ ハイレベル300語');
            });
        });
    }
    
    // レベル５ 難関突破100語カード
    const level5CardBtn = document.getElementById('level5CardBtn');
    if (level5CardBtn) {
        level5CardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            animateCardExpand(level5CardBtn, '#ffffff', () => {
                showLevelSubcategorySelection('レベル５ 難関突破100語');
            });
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
                    // LEVEL4, LEVEL5 などホーム画面のカードはアニメーション付き
                    const isHomeCard = categoryCard.closest('.course-section');
                    if (isHomeCard) {
                        animateCardExpand(categoryCard, '#ffffff', () => {
                            startCategory(category);
                        });
                    } else {
                        startCategory(category);
                    }
                }
            }
        });
        console.log('Category card listener added successfully');
    } else {
        console.error('categorySelection element not found!');
    }
    
    // 入試直前これだけ1200語カード（id 1〜1200）
    const exam1200CardBtn = document.getElementById('exam1200CardBtn');
    if (exam1200CardBtn) {
        exam1200CardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            animateCardExpand(exam1200CardBtn, '#ffffff', () => {
                const allWords = getAllWordData();
                const words1200 = allWords.filter(w => w.id >= 1 && w.id <= 1200);
                if (!words1200.length) {
                    console.error('exam1200: no words');
                    return;
                }
                showInputModeDirectly('入試直前これだけ1200語', words1200, '入試直前これだけ1200語');
            });
        });
    }

    // 大阪府のすべての英単語カードボタン
    const allWordsCardBtn = document.getElementById('allWordsCardBtn');
    if (allWordsCardBtn) {
        allWordsCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            animateCardExpand(allWordsCardBtn, '#ffffff', () => {
                startAllWordsLearning();
            });
        });
    }
    
    // 不規則変化の単語カードボタン → サブカテゴリーメニューを表示
    const irregularVerbsCardBtn = document.getElementById('irregularVerbsCardBtn');
    if (irregularVerbsCardBtn) {
        irregularVerbsCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            animateCardExpand(irregularVerbsCardBtn, '#ffffff', () => {
                showIvMenuView();
            });
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
    
    // 学習モードのランダムボタン
    const ivStudyShuffleBtn = document.getElementById('ivStudyShuffleBtn');
    if (ivStudyShuffleBtn) {
        ivStudyShuffleBtn.addEventListener('click', () => {
            ivStudyIsRandomOrder = !ivStudyIsRandomOrder;
            ivStudyShuffleBtn.classList.toggle('active', ivStudyIsRandomOrder);
            refreshIvStudyTable();
        });
    }
    
    // 学習モードのしぼるボタン
    const ivStudyFilterTrigger = document.getElementById('ivStudyFilterTrigger');
    const ivStudyFilterDropdown = document.getElementById('ivStudyFilterDropdown');
    if (ivStudyFilterTrigger && ivStudyFilterDropdown) {
        ivStudyFilterTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpening = ivStudyFilterDropdown.classList.contains('hidden');
            ivStudyFilterDropdown.classList.toggle('hidden');
            // 開くときは青に、閉じるときはフィルター状態に応じて
            if (isOpening) {
                ivStudyFilterTrigger.classList.add('active');
            } else {
                updateIvStudyFilterBadge(); // フィルター状態に応じてactiveを更新
            }
        });
        
        // ドロップダウン外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!ivStudyFilterDropdown.contains(e.target) && e.target !== ivStudyFilterTrigger && !ivStudyFilterTrigger.contains(e.target)) {
                ivStudyFilterDropdown.classList.add('hidden');
                updateIvStudyFilterBadge(); // フィルター状態に応じてactiveを更新
            }
        });
        
        // フィルターチェックボックスのイベント
        const ivStudyFilterAll = document.getElementById('ivStudyFilterAll');
        const ivStudyFilterUnlearned = document.getElementById('ivStudyFilterUnlearned');
        const ivStudyFilterWrong = document.getElementById('ivStudyFilterWrong');
        const ivStudyFilterBookmark = document.getElementById('ivStudyFilterBookmark');
        const ivStudyFilterCorrect = document.getElementById('ivStudyFilterCorrect');
        
        if (ivStudyFilterAll) {
            ivStudyFilterAll.addEventListener('change', () => {
                ivStudyFilterState.all = ivStudyFilterAll.checked;
                if (ivStudyFilterAll.checked) {
                    ivStudyFilterState.unlearned = true;
                    ivStudyFilterState.wrong = true;
                    ivStudyFilterState.correct = true;
                    ivStudyFilterState.bookmark = true;
                    if (ivStudyFilterUnlearned) ivStudyFilterUnlearned.checked = true;
                    if (ivStudyFilterWrong) ivStudyFilterWrong.checked = true;
                    if (ivStudyFilterCorrect) ivStudyFilterCorrect.checked = true;
                    if (ivStudyFilterBookmark) ivStudyFilterBookmark.checked = true;
                }
                refreshIvStudyTable();
            });
        }
        
        const handleStudyIndividualFilter = () => {
            ivStudyFilterState.unlearned = ivStudyFilterUnlearned?.checked ?? true;
            ivStudyFilterState.wrong = ivStudyFilterWrong?.checked ?? true;
            ivStudyFilterState.correct = ivStudyFilterCorrect?.checked ?? true;
            ivStudyFilterState.bookmark = ivStudyFilterBookmark?.checked ?? true;
            const allOn = ivStudyFilterState.unlearned && ivStudyFilterState.wrong && ivStudyFilterState.correct && ivStudyFilterState.bookmark;
            ivStudyFilterState.all = allOn;
            if (ivStudyFilterAll) ivStudyFilterAll.checked = allOn;
            refreshIvStudyTable();
        };
        
        if (ivStudyFilterUnlearned) ivStudyFilterUnlearned.addEventListener('change', handleStudyIndividualFilter);
        if (ivStudyFilterWrong) ivStudyFilterWrong.addEventListener('change', handleStudyIndividualFilter);
        if (ivStudyFilterCorrect) ivStudyFilterCorrect.addEventListener('change', handleStudyIndividualFilter);
        if (ivStudyFilterBookmark) ivStudyFilterBookmark.addEventListener('change', handleStudyIndividualFilter);
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
    
    // 不規則変化のランダムボタン
    const ivShuffleBtn = document.getElementById('ivShuffleBtn');
    if (ivShuffleBtn) {
        ivShuffleBtn.addEventListener('click', () => {
            ivIsRandomOrder = !ivIsRandomOrder;
            ivShuffleBtn.classList.toggle('active', ivIsRandomOrder);
            refreshIvTable();
        });
    }
    
    // 不規則変化のしぼるボタン
    const ivFilterTrigger = document.getElementById('ivFilterTrigger');
    const ivFilterDropdown = document.getElementById('ivFilterDropdown');
    if (ivFilterTrigger && ivFilterDropdown) {
        ivFilterTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpening = ivFilterDropdown.classList.contains('hidden');
            ivFilterDropdown.classList.toggle('hidden');
            // ドロップダウンを開くときは青に
            if (isOpening) {
                ivFilterTrigger.classList.add('active');
            }
        });
        
        // ドロップダウン外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!ivFilterDropdown.contains(e.target) && e.target !== ivFilterTrigger) {
                ivFilterDropdown.classList.add('hidden');
                // 閉じた後、フィルター状態に応じてactiveを更新
                const allChecked = ivFilterState.all || (ivFilterState.unlearned && ivFilterState.wrong && ivFilterState.correct && ivFilterState.bookmark);
                if (allChecked) {
                    ivFilterTrigger.classList.remove('active');
                }
            }
        });
        
        // フィルターチェックボックスのイベント
        const ivFilterAll = document.getElementById('ivFilterAll');
        const ivFilterUnlearned = document.getElementById('ivFilterUnlearned');
        const ivFilterWrong = document.getElementById('ivFilterWrong');
        const ivFilterBookmark = document.getElementById('ivFilterBookmark');
        const ivFilterCorrect = document.getElementById('ivFilterCorrect');
        
        if (ivFilterAll) {
            ivFilterAll.addEventListener('change', () => {
                ivFilterState.all = ivFilterAll.checked;
                if (ivFilterAll.checked) {
                    ivFilterState.unlearned = true;
                    ivFilterState.wrong = true;
                    ivFilterState.correct = true;
                    ivFilterState.bookmark = true;
                    if (ivFilterUnlearned) ivFilterUnlearned.checked = true;
                    if (ivFilterWrong) ivFilterWrong.checked = true;
                    if (ivFilterCorrect) ivFilterCorrect.checked = true;
                    if (ivFilterBookmark) ivFilterBookmark.checked = true;
                }
                refreshIvTable();
            });
        }
        
        const handleIndividualFilter = () => {
            ivFilterState.unlearned = ivFilterUnlearned?.checked ?? true;
            ivFilterState.wrong = ivFilterWrong?.checked ?? true;
            ivFilterState.correct = ivFilterCorrect?.checked ?? true;
            ivFilterState.bookmark = ivFilterBookmark?.checked ?? true;
            const allOn = ivFilterState.unlearned && ivFilterState.wrong && ivFilterState.correct && ivFilterState.bookmark;
            ivFilterState.all = allOn;
            if (ivFilterAll) ivFilterAll.checked = allOn;
            refreshIvTable();
        };
        
        if (ivFilterUnlearned) ivFilterUnlearned.addEventListener('change', handleIndividualFilter);
        if (ivFilterWrong) ivFilterWrong.addEventListener('change', handleIndividualFilter);
        if (ivFilterCorrect) ivFilterCorrect.addEventListener('change', handleIndividualFilter);
        if (ivFilterBookmark) ivFilterBookmark.addEventListener('change', handleIndividualFilter);
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
    const swipeOutDuration = 420; // ミリ秒（飛んでいく速度をゆっくりに）
    
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
            if (!elements.wordCard) { isCardAnimating = false; return; }
            elements.wordCard.style.transition = 'none';
            elements.wordCard.style.transform = '';
            isCardAnimating = false;
            markAnswer(true);
        }, swipeOutDuration);
    });
    elements.wrongBtn.addEventListener('click', () => {
        // カードが裏返されていない場合は何もしない
        if (!elements.wordCard || !elements.wordCard.classList.contains('flipped')) return;
        // アニメーション中なら処理しない
        if (isCardAnimating) return;
        
        // スワイプと同じように左にスライドアウト
        isCardAnimating = true;
        elements.wordCard.style.transition = `transform ${swipeOutDuration}ms ${swipeOutEasing}, opacity ${swipeOutDuration}ms ${swipeOutEasing}`;
        elements.wordCard.style.transform = 'translateX(-120%) rotate(-12deg)';
        elements.wordCard.style.opacity = '0';
        
        setTimeout(() => {
            if (!elements.wordCard) { isCardAnimating = false; return; }
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
                if (!elements.wordCard) { isCardAnimating = false; return; }
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
    
    // ポーズメニュー：中断する（学習メニューに戻る）
    if (elements.pauseQuitBtn) {
        elements.pauseQuitBtn.addEventListener('click', () => {
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.add('hidden');
            }
            // 現在のカテゴリがあれば学習メニューに戻る、なければホーム画面へ
            if (selectedCategory) {
                returnToLearningMenu(selectedCategory);
            } else {
                showCategorySelection();
            }
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
        inputBackBtn.addEventListener('click', handleBackButton);
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
                SoundEffects.playCorrect(); // 選択時に効果音
            }
        });
    }
    
    if (modeJpnToEng) {
        modeJpnToEng.addEventListener('change', () => {
            if (modeJpnToEng.checked) {
                selectedQuizDirection = 'jpn-to-eng';
                isHandwritingMode = true;
                console.log('[Filter] Quiz direction: 日本語→英語 (手書きモード)');
                SoundEffects.playCorrect(); // 選択時に効果音
                
                // モデルを事前ロード
                if (window.handwritingRecognition && !window.handwritingRecognition.isModelLoaded) {
                    console.log('[Filter] Pre-loading EMNIST model...');
                    window.handwritingRecognition.loadModel();
                }
            }
        });
    }

    // 出題順（標準 / ランダム）のラジオボタン
    const orderSequential = document.getElementById('orderSequential');
    const orderRandom = document.getElementById('orderRandom');

    if (orderSequential) {
        orderSequential.addEventListener('change', () => {
            if (orderSequential.checked) {
                SoundEffects.playCorrect(); // 選択時に効果音
            }
        });
    }

    if (orderRandom) {
        orderRandom.addEventListener('change', () => {
            if (orderRandom.checked) {
                SoundEffects.playCorrect(); // 選択時に効果音
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
                // 「すべて」から押した場合は、maxCountより小さい最大の10の倍数に
                currentCount = Math.floor((maxCount - 1) / 10) * 10;
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
            
            // 連続正解カウントをリセット（新しい学習セッション）
            quizStreakCount = 0;
            
            // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
            // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
            if (!lastLearningCategory) {
                learnedWordsAtStart = calculateTotalLearnedWords();
            }
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
                if (selectedCategory) {
                    returnToLearningMenu(selectedCategory);
                } else {
                    showCategorySelection();
                }
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
            // 学習セッション終了（時間を記録）
            endStudySession();
            
            // 学習モードをリセット
            document.body.classList.remove('learning-mode');
            updateThemeColor(false);
            
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
                    if (window.currentSubcategoryParent === 'レベル１ 初級500語' || 
                        window.currentSubcategoryParent === 'レベル２ 中級500語' || 
                        window.currentSubcategoryParent === 'レベル３ 上級500語' ||
                        window.currentSubcategoryParent === 'レベル４ ハイレベル300語' ||
                        window.currentSubcategoryParent === 'レベル５ 難関突破100語') {
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    } else if (window.currentSubcategoryParent === '入門600語') {
                        showElementaryCategorySelection(true);
                        return;
                    }
                }
                
                // その他の場合は従来の処理
                if (courseSelection) {
                    courseSelection.classList.remove('hidden');
                    // ヘッダーのタイトルを更新
                    let displayCategory = selectedCategory;
                    if (selectedCategory === 'LEVEL0 入門600語') {
                        displayCategory = '入門600語';
                    }
                    updateHeaderButtons('course', displayCategory);
                }
            } else if (courseSelection && !courseSelection.classList.contains('hidden')) {
                // コース選択画面からカテゴリー選択画面に戻る（縮小アニメーション）
                const categorySelection = elements.categorySelection;
                
                // サブカテゴリー画面からの戻り
                if (window.currentSubcategoryParent) {
                    // 戻り先のカードIDを特定
                    let targetCardId = null;
                    if (window.currentSubcategoryParent === 'レベル１ 初級500語') {
                        targetCardId = 'level1CardBtn';
                    } else if (window.currentSubcategoryParent === 'レベル２ 中級500語') {
                        targetCardId = 'level2CardBtn';
                    } else if (window.currentSubcategoryParent === 'レベル３ 上級500語') {
                        targetCardId = 'level3CardBtn';
                    } else if (window.currentSubcategoryParent === 'レベル４ ハイレベル300語') {
                        targetCardId = 'level4CardBtn';
                    } else if (window.currentSubcategoryParent === 'レベル５ 難関突破100語') {
                        targetCardId = 'level5CardBtn';
                    } else if (window.currentSubcategoryParent === '入門600語') {
                        targetCardId = 'elementaryCategoryCardBtn';
                    }
                    
                    if (targetCardId) {
                        // 学習後の★アニメーション用にカテゴリを保存（lastLearningCategoryはリセットしない）
                        const hasStarAnimation = !!lastLearningCategory;
                        
                        window.currentSubcategoryParent = null;
                        animateCardShrink(targetCardId, () => {
                            courseSelection.classList.add('hidden');
                            categorySelection.classList.remove('hidden');
                            updateHeaderButtons('home');
                            updateCategoryStars();
                            updateVocabProgressBar();
                            showFloatingReviewBtn();
                        });
                        
                        // 縮小アニメーション完了後（600ms）に★アニメーションを実行
                        if (hasStarAnimation) {
                            setTimeout(() => {
                                animateProgressToGoal();
                                lastLearningCategory = null;
                                lastLearningSourceElement = null;
                            }, 700);
                        }
                        return;
                    }
                }
                
                courseSelection.classList.add('hidden');
                showCategorySelection();
            } else if (elements.mainContent && !elements.mainContent.classList.contains('hidden')) {
                // 学習画面からコース選択画面またはカテゴリー選択画面に戻る
                if (selectedCategory) {
                    // 単語一覧から来た場合は、縮小アニメーションでホームに戻る
                    if (selectedCategory === '大阪府のすべての英単語') {
                        animateCardShrink('allWordsCardBtn', () => {
                            selectedCategory = null;
                            elements.mainContent.classList.add('hidden');
                            elements.categorySelection.classList.remove('hidden');
                            updateHeaderButtons('home');
                            updateCategoryStars();
                            updateVocabProgressBar();
                            showFloatingReviewBtn();
                        });
                        return;
                    }
                    // 入試直前これだけ1200語から来た場合は、縮小アニメーションでホームに戻る
                    if (selectedCategory === '入試直前これだけ1200語') {
                        animateCardShrink('exam1200CardBtn', () => {
                            selectedCategory = null;
                            elements.mainContent.classList.add('hidden');
                            elements.categorySelection.classList.remove('hidden');
                            updateHeaderButtons('home');
                            updateCategoryStars();
                            updateVocabProgressBar();
                            showFloatingReviewBtn();
                        });
                        return;
                    }
                    
                    // 不規則変化の単語から来た場合は、不規則変化メニューに戻る
                    if (window.currentSubcategoryParent && window.currentSubcategoryParent === '不規則変化の単語') {
                        elements.mainContent.classList.add('hidden');
                        const ivMenuView = document.getElementById('ivMenuView');
                        if (ivMenuView) ivMenuView.classList.remove('hidden');
                        updateHeaderButtons('course', '不規則変化の単語');
                        return;
                    }
                    
                    // レベル別の細分化メニューから来た場合は、細分化メニューに戻る
                    if (window.currentSubcategoryParent && (window.currentSubcategoryParent === 'レベル１ 初級500語' || 
                        window.currentSubcategoryParent === 'レベル２ 中級500語' || 
                        window.currentSubcategoryParent === 'レベル３ 上級500語' ||
                        window.currentSubcategoryParent === 'レベル４ ハイレベル300語' ||
                        window.currentSubcategoryParent === 'レベル５ 難関突破100語')) {
                        elements.mainContent.classList.add('hidden');
                        showLevelSubcategorySelection(window.currentSubcategoryParent, true);
                        return;
                    }
                    
                    // 入門600語から来た場合は、細分化メニューに戻る
                    if (window.currentSubcategoryParent && window.currentSubcategoryParent === '入門600語') {
                        elements.mainContent.classList.add('hidden');
                        showElementaryCategorySelection(true);
                        return;
                    }
                    
                    // コース選択画面に戻る
                    let categoryWords;
                    if (selectedCategory === 'LEVEL0 入門600語') {
                        if (typeof getElementaryVocabulary !== 'undefined' && typeof getElementaryVocabulary === 'function') {
                            categoryWords = getElementaryVocabulary();
                        } else if (typeof elementaryWordData !== 'undefined') {
                            categoryWords = elementaryWordData;
                        } else {
                            showCategorySelection();
                            return;
                        }
                    } else if (selectedCategory === 'LEVEL1 初級500語' || selectedCategory === 'LEVEL2 中級500語' || selectedCategory === 'LEVEL3 上級500語' || 
                               selectedCategory === 'LEVEL4 ハイレベル300語' || selectedCategory === 'LEVEL5 難関突破100語') {
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
    
    // 学習カレンダーリセットボタン
    const clearCalendarBtn = document.getElementById('clearCalendarBtn');
    if (clearCalendarBtn) {
        clearCalendarBtn.addEventListener('click', () => {
            closeSidebar();
            clearStudyCalendarData();
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
            target.classList.contains('close-btn') ||
            target.id === 'filterCloseBtn' ||
            target.id === 'filterBackBtn' ||
            target.id === 'closeSchoolSettings' ||
            target.id === 'sidebarCloseBtn' ||
            target.closest('.filter-close-btn, .school-modal-close, .school-confirm-btn, .sidebar-close-btn, .close-btn') ||
            target.closest('#filterCloseBtn, #filterBackBtn, #closeSchoolSettings, #sidebarCloseBtn');
        
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
        // partOfSpeech ではなく meaning 内の【名】【形】等から品詞を出す
        const meaningWrapper = inputMeaning.parentElement;
        let posElement = document.getElementById('inputPosInline');
        if (!posElement) {
            posElement = document.createElement('span');
            posElement.id = 'inputPosInline';
            posElement.className = 'pos-inline part-of-speech meaning-pos-inline other';
            meaningWrapper.insertBefore(posElement, inputMeaning);
        }
        
        const posText = getMeaningPosBadgeText(word.meaning || '');
        if (posText) {
            posElement.textContent = posText;
            posElement.className = `pos-inline part-of-speech meaning-pos-inline ${getPosClassFromPosShort(posText)}`;
            posElement.style.display = '';
        } else {
            posElement.style.display = 'none';
        }
        
        // 日本語本文側には品詞バッジを埋め込まず、《活用》は表示しない
        setMeaningContent(inputMeaning, word.meaning, { showPosBadges: false, hideConjugation: true });
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

        // トランジションを有効化（スワイプで飛んでいく速度をゆっくりに）
        card.style.transition = 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.42s cubic-bezier(0.4, 0, 0.2, 1)';

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
    if (!elements.wordCard) return;
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
    if (!elements.wordCard) return;
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
        // 小学生で習った単語・入試直前1200語の場合は、その単語のカテゴリーから進捗を読み込む
        const categoryKey = (selectedCategory === 'LEVEL0 入門600語' || selectedCategory === '入試直前これだけ1200語') ? word.category : selectedCategory;
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

// meaning 内の品詞タグ（【名】など）と活用（《活用》）を表示用に整形する
function meaningHasPosTags(text) {
    if (!text) return false;
    return text.includes('【') || text.includes('〈') || text.includes('〖');
}

function toPosShortFromMeaningTag(tag) {
    if (!tag) return '';
    const t = String(tag).trim();
    if (t.length === 1) return t;
    if (t.includes('動')) return '動';
    if (t.includes('名')) return '名';
    if (t.includes('形')) return '形';
    if (t.includes('副')) return '副';
    if (t.includes('前')) return '前';
    if (t.includes('接')) return '接';
    if (t.includes('冠')) return '冠';
    if (t.includes('代')) return '代';
    if (t.includes('助')) return '助';
    if (t.includes('間')) return '間';
    if (t.includes('関')) return '関';
    return t.charAt(0);
}

function getPosClassFromPosShort(posShort) {
    if (!posShort) return 'other';
    if (posShort.includes('助')) return 'auxiliary';
    if (posShort.includes('動')) return 'verb';
    if (posShort.includes('代')) return 'pronoun';
    if (posShort.includes('名')) return 'noun';
    if (posShort.includes('形')) return 'adjective';
    if (posShort.includes('副')) return 'adverb';
    if (posShort.includes('接')) return 'conjunction';
    if (posShort.includes('前')) return 'preposition';
    if (posShort.includes('冠')) return 'article';
    return 'other';
}

function parseMeaningPosSegments(rawText) {
    if (!rawText) return [];
    const text = String(rawText);
    const tagRegex = /〖([^〗]+)〗|〈([^〉]+)〉|【([^】]+)】/g;
    
    const segments = [];
    let currentPos = '';
    let currentSource = null; // 'bracket' | 'angle' | 'double-angle' | null
    let lastIndex = 0;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
        const start = match.index;
        const between = text.slice(lastIndex, start);
        const cleaned = between.replace(/[；;]\s*$/g, '').trim();
        if (cleaned) {
            segments.push({ posShort: currentPos, text: cleaned, source: currentSource });
        }
        
        const inner = (match[1] || match[2] || match[3] || '').trim();
        currentPos = toPosShortFromMeaningTag(inner);
        currentSource =
            match[3] != null ? 'bracket' : (match[2] != null ? 'angle' : 'double-angle');
        
        lastIndex = tagRegex.lastIndex;
    }
    
    const rest = text.slice(lastIndex);
    const cleanedRest = rest.replace(/^\s*[；;]\s*/g, '').trim();
    if (cleanedRest) {
        segments.push({ posShort: currentPos, text: cleanedRest, source: currentSource });
    }
    
    if (segments.length === 0) {
        return [{ posShort: '', text: text.trim(), source: null }];
    }
    return segments;
}

function getMeaningPosBadgeText(rawText) {
    const segments = parseMeaningPosSegments(rawText);
    const uniq = [];
    segments.forEach(s => {
        const p = (s.posShort || '').trim();
        if (!p) return;
        if (p === '連') return; // 連語は非表示方針
        if (!uniq.includes(p)) uniq.push(p);
    });
    return uniq.join('・');
}

// 意味文などで () を太字にしない：括弧部分を .meaning-paren-normal でラップして追加
function appendTextWithParenNormal(targetEl, rawText) {
    if (!targetEl || rawText == null) return;
    const text = String(rawText);
    const parts = text.split(/(\([^)]*\))/g);
    parts.forEach((part) => {
        if (/^\([^)]*\)$/.test(part)) {
            const span = document.createElement('span');
            span.className = 'meaning-paren-normal';
            span.textContent = part;
            targetEl.appendChild(span);
        } else if (part) {
            targetEl.appendChild(document.createTextNode(part));
        }
    });
}

function appendTextWithConjugationBreak(targetEl, rawText, options = {}) {
    if (!targetEl) return;
    const text = String(rawText || '');
    const marker = '《活用》';
    const idx = text.indexOf(marker);
    if (idx === -1) {
        appendTextWithParenNormal(targetEl, text);
        return;
    }
    
    const before = text.slice(0, idx).trimEnd();
    const hideConjugation = options && options.hideConjugation;
    if (before) appendTextWithParenNormal(targetEl, before);
    if (hideConjugation) return; // 《活用》以降は表示しない
    
    const after = text.slice(idx).trimStart();
    targetEl.appendChild(document.createElement('br'));
    appendTextWithParenNormal(targetEl, after);
}

function stripConjugationFromText(rawText) {
    if (!rawText) return '';
    const text = String(rawText);
    // 「《活用》」以降を丸ごと削除（表記ゆれやスペースがあっても確実に消す）
    return text.replace(/\s*《活用》[\s\S]*$/g, '').trimEnd();
}

// 《活用》部分を抽出する（例: "am - was - been"）
function extractConjugationFromText(rawText) {
    if (!rawText) return '';
    const text = String(rawText);
    const marker = '《活用》';
    const idx = text.indexOf(marker);
    if (idx === -1) return '';
    let rest = text.substring(idx + marker.length).trim();
    // 例: "am - am - am 〖連〗be able to～" のように後ろにタグが続く場合はそこで打ち切る
    const stopIdx = rest.search(/[〖〈【]/);
    if (stopIdx !== -1) rest = rest.substring(0, stopIdx).trim();
    return rest;
}

function getPosLabelKind(partOfSpeechText) {
    const t = String(partOfSpeechText || '');
    // 助動詞/動詞/形容詞/副詞が含まれる場合はそれを優先。それ以外は代名詞/名詞→その他
    if (t.includes('助動詞')) return 'auxiliary';
    if (t.includes('動詞')) return 'verb';
    if (t.includes('形容詞')) return 'adjective';
    if (t.includes('副詞')) return 'adverb';
    if (t.includes('代名詞')) return 'pronoun';
    if (t.includes('名詞')) return 'noun';
    if (t.includes('接続詞')) return 'conjunction';
    if (t.includes('前置詞')) return 'preposition';
    if (t.includes('冠詞')) return 'article';
    return 'other';
}

function splitPartOfSpeechLabels(partOfSpeechText) {
    const raw = String(partOfSpeechText || '').trim();
    if (!raw) return [];
    // 「名詞・副詞」「名詞・形容詞・副詞」などを個別ラベルに分割（区切り文字は表示しない）
    return raw
        .split(/[・、,\s]+/g)
        .map(s => s.trim())
        .filter(Boolean);
}

function toShortPosFromPartOfSpeech(part) {
    const t = String(part || '').trim();
    if (!t) return '';
    if (t.includes('代名詞')) return '代';
    if (t.includes('名詞')) return '名';
    if (t.includes('助動詞')) return '助';
    if (t.includes('動詞')) return '動';
    if (t.includes('形容詞')) return '形';
    if (t.includes('副詞')) return '副';
    if (t.includes('前置詞')) return '前';
    if (t.includes('接続詞')) return '接';
    if (t.includes('冠詞')) return '冠';
    if (t.includes('間投詞')) return '間';
    if (t.includes('疑問詞')) return '疑';
    if (t.includes('関係')) return '関';
    if (t.includes('限定詞')) return '限';
    // フォールバック：最初の1文字
    return t.charAt(0);
}

// 〖連〗（連語）部分を抽出する（複数あれば配列で返す）
function extractRengoFromText(rawText) {
    if (!rawText) return [];
    const text = String(rawText);
    const results = [];
    const re = /〖連〗\s*([\s\S]*?)(?=\s*(?:〖|〈|【|$))/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const t = String(m[1] || '').trim();
        if (t) results.push(t);
    }
    return results;
}

function isJapaneseChar(ch) {
    const code = ch.codePointAt(0);
    // Hiragana, Katakana, Kanji, punctuation/symbols commonly used in Japanese text
    return (
        (code >= 0x3040 && code <= 0x30FF) || // ひらがな・カタカナ
        (code >= 0x3400 && code <= 0x9FFF) || // CJK
        (code >= 0x3000 && code <= 0x303F) || // CJK punctuation
        code === 0xFF5E || // ～
        code === 0x30FC    // ー
    );
}

function setRengoContent(targetEl, rawText) {
    if (!targetEl) return;
    targetEl.textContent = '';
    const s = String(rawText || '');
    if (!s) return;

    let buf = '';
    let bufIsJa = null;

    const flush = () => {
        if (!buf) return;
        const span = document.createElement('span');
        span.className = bufIsJa ? 'rengo-ja' : 'rengo-en';
        span.textContent = buf;
        targetEl.appendChild(span);
        buf = '';
    };

    for (const ch of s) {
        const isJa = isJapaneseChar(ch);
        if (bufIsJa === null) {
            bufIsJa = isJa;
            buf = ch;
            continue;
        }
        if (isJa === bufIsJa) {
            buf += ch;
        } else {
            flush();
            bufIsJa = isJa;
            buf = ch;
        }
    }
    flush();
}

function renderMeaningWithPosSegments(targetEl, rawText, options = {}) {
    if (!targetEl) return;
    targetEl.innerHTML = '';
    
    // 連語（〖連〗）は表示しない
    const segments = parseMeaningPosSegments(rawText).filter(s => (s.posShort || '').trim() !== '連');
    const showPosBadges = options.showPosBadges !== false;
    
    segments.forEach((seg, idx) => {
        const pos = (seg.posShort || '').trim();
        
        if (idx > 0) targetEl.appendChild(document.createTextNode(' '));
        
        if (showPosBadges && pos) {
            const badge = document.createElement('span');
            badge.className = `pos-inline part-of-speech meaning-pos-inline ${getPosClassFromPosShort(pos)}`;
            if (seg && seg.source === 'bracket') badge.classList.add('meaning-pos-inline-bracket');
            badge.textContent = pos;
            targetEl.appendChild(badge);
            targetEl.appendChild(document.createTextNode(' '));
        }
        
        appendTextWithConjugationBreak(targetEl, seg.text, options);
    });
}

function setMeaningContent(meaningElement, text, options = {}) {
    if (!meaningElement) return;
    if (!text) {
        meaningElement.textContent = '';
        meaningElement.classList.remove('meaning-multiline-root');
        return;
    }

    // 《活用》を表示しない指定なら、先に確実に取り除く
    if (options && options.hideConjugation) {
        text = stripConjugationFromText(text);
        // 取り除いた結果が空になったらクリア
        if (!text) {
            meaningElement.textContent = '';
            meaningElement.classList.remove('meaning-multiline-root');
            return;
        }
    }
    
    // ①が含まれていなければ一行表示（品詞タグと《活用》の整形を適用）
    if (!text.includes('①')) {
        if (meaningHasPosTags(text)) {
            renderMeaningWithPosSegments(meaningElement, text, options);
        } else if (String(text).includes('《活用》')) {
            meaningElement.innerHTML = '';
            appendTextWithConjugationBreak(meaningElement, text, options);
        } else {
            meaningElement.innerHTML = '';
            appendTextWithParenNormal(meaningElement, text);
        }
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
        meaningElement.innerHTML = '';
        appendTextWithParenNormal(meaningElement, text);
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
        if (meaningHasPosTags(lineText)) {
            renderMeaningWithPosSegments(textSpan, lineText, options);
        } else if (String(lineText).includes('《活用》')) {
            textSpan.innerHTML = '';
            appendTextWithConjugationBreak(textSpan, lineText, options);
        } else {
            textSpan.innerHTML = '';
            appendTextWithParenNormal(textSpan, lineText);
        }
        
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
        // フリップモード時はヘッダーをコンテナ内に移動してスクロールに追随させる
        if (inputListHeader && !container.contains(inputListHeader)) {
            container.appendChild(inputListHeader);
        }
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
    } else if (selectedCategory === 'LEVEL0 入門600語' || selectedCategory === '入試直前これだけ1200語') {
        // 各単語のカテゴリーから進捗を読み込む
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
    if (selectedCategory && selectedCategory !== 'LEVEL0 入門600語' && selectedCategory !== '大阪府のすべての英単語' && selectedCategory !== '入試直前これだけ1200語') {
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
        // フリップモード時はヘッダーをコンテナ内に移動してスクロールに追随させる
        if (inputListHeader && !container.contains(inputListHeader)) {
            container.appendChild(inputListHeader);
        }
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
    if (selectedCategory === 'LEVEL0 入門600語') {
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
    if (selectedCategory && selectedCategory !== 'LEVEL0 入門600語' && selectedCategory !== '入試直前これだけ1200語') {
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
            } else if (selectedCategory === 'LEVEL0 入門600語') {
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
        
        // ====== 左カラム（英単語情報） ======
        const leftCol = document.createElement('div');
        leftCol.className = 'expand-left-col';
        
        // 上部：番号とチェックボックスの連結ボックス
        const leftTop = document.createElement('div');
        leftTop.className = 'expand-left-top';
        
        // 番号（先に追加）
        const number = document.createElement('span');
        number.className = 'input-list-expand-number';
        number.textContent = String(word.id).padStart(4, '0');
        if (!skipProgress) {
            if (isWrong) {
                number.classList.add('marker-wrong');
            } else if (isCorrect) {
                number.classList.add('marker-correct');
            }
        }
        
        if (selectedCategory === '大阪府のすべての英単語') {
            number.classList.add('clickable-number');
            number.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleWordProgress(word, number, item);
            });
        }
        // チェックボックス（左に表示）
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
        leftTop.appendChild(checkbox);

        // 番号（チェックの右に表示）
        leftTop.appendChild(number);

        // 品詞（番号の右に表示：複数なら並べる。区切りの「・」は表示しない）
        const posParts = splitPartOfSpeechLabels(word.partOfSpeech);
        posParts.forEach((p) => {
            const posLabel = document.createElement('span');
            posLabel.className = `expand-left-pos expand-left-pos-${getPosLabelKind(p)}`;
            posLabel.textContent = toShortPosFromPartOfSpeech(p);
            leftTop.appendChild(posLabel);
        });
        leftCol.appendChild(leftTop);
        
        // 英単語（はみ出す場合は横縮小）
        const wordEl = document.createElement('div');
        wordEl.className = 'input-list-expand-word';
        const wordFormatted = formatWordForDisplay(word.word);
        if (wordFormatted) {
            wordEl.innerHTML = wordFormatted;
        } else {
            wordEl.textContent = word.word;
        }
        leftCol.appendChild(wordEl);
        fitWordToContainer(wordEl);
        
        // カタカナ読み（あれば）
        if (word.kana) {
            const kanaEl = document.createElement('div');
            kanaEl.className = 'input-list-expand-kana';
            // *で囲まれた部分を太字にする
            const kanaText = word.kana.replace(/\*([^*]+)\*/g, '<b>$1</b>');
            kanaEl.innerHTML = kanaText;
            leftCol.appendChild(kanaEl);
        }
        
        // 発音ボタン
        const pronunciationBtn = document.createElement('button');
        pronunciationBtn.className = 'expand-pronunciation-btn';
        pronunciationBtn.setAttribute('type', 'button');
        pronunciationBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
        pronunciationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speakWord(word.word, pronunciationBtn);
        });
        leftCol.appendChild(pronunciationBtn);
        
        item.appendChild(leftCol);
        
        // ====== 右カラム（意味・例文） ======
        const rightCol = document.createElement('div');
        rightCol.className = 'expand-right-col';
        
        // 品詞バッジ（meaningから抽出）
        const posBadgeText = getMeaningPosBadgeText(word.meaning || '');
        if (posBadgeText) {
            const posBadge = document.createElement('span');
            posBadge.className = 'expand-pos-badge';
            posBadge.textContent = posBadgeText;
            rightCol.appendChild(posBadge);
        }
        
        // 意味テキスト
        const meaningText = document.createElement('div');
        meaningText.className = 'expand-meaning-text';
        setMeaningContent(meaningText, word.meaning || '', { hideConjugation: true, showPosBadges: false });
        rightCol.appendChild(meaningText);
        
        // 活用・例文セクション（線の下）
        const conjugationText = extractConjugationFromText(word.meaning || '');
        const hasExample = word.example && (word.example.english || word.example.japanese);
        
        if (conjugationText || hasExample) {
            // 線の下のコンテナ
            const belowLineSection = document.createElement('div');
            belowLineSection.className = 'expand-below-line-section';
            
            // 活用（あれば）
            if (conjugationText) {
                const conjSection = document.createElement('div');
                conjSection.className = 'expand-conjugation-section';
                
                const conjBadge = document.createElement('span');
                conjBadge.className = 'expand-conjugation-badge';
                conjBadge.textContent = '活';
                conjSection.appendChild(conjBadge);
                
                const conjText = document.createElement('span');
                conjText.className = 'expand-conjugation-text';
                conjText.textContent = conjugationText;
                conjSection.appendChild(conjText);
                
                belowLineSection.appendChild(conjSection);
            }
            
            // 例文（あれば）
            if (hasExample) {
                const exampleSection = document.createElement('div');
                exampleSection.className = 'expand-example-section';
                
                // 例バッジと英語を横並び
                const exampleRow = document.createElement('div');
                exampleRow.className = 'expand-example-row';
                
                const exampleBadge = document.createElement('span');
                exampleBadge.className = 'expand-example-badge';
                exampleBadge.textContent = '例';
                exampleRow.appendChild(exampleBadge);
                
                if (word.example.english) {
                    const exEn = document.createElement('span');
                    exEn.className = 'expand-example-en';
                    if (word.word) {
                        exEn.innerHTML = highlightTargetWord(word.example.english, word.word);
                    } else {
                        exEn.textContent = word.example.english;
                    }
                    exampleRow.appendChild(exEn);
                }
                
                exampleSection.appendChild(exampleRow);
                
                if (word.example.japanese) {
                    const exJa = document.createElement('div');
                    exJa.className = 'expand-example-ja';
                    exJa.innerHTML = word.example.japanese;
                    exampleSection.appendChild(exJa);
                }
                
                belowLineSection.appendChild(exampleSection);
            }
            
            rightCol.appendChild(belowLineSection);
        }
        
        // でた度表示（右カラム内に配置）
        if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
            const topActions = document.createElement('div');
            topActions.className = 'input-list-expand-top-actions';
            
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
            rightCol.appendChild(topActions);
        }
        
        item.appendChild(rightCol);
        
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
        
        const metaFront = document.createElement('div');
        metaFront.className = 'input-list-meta';
        
        const metaBack = document.createElement('div');
        metaBack.className = 'input-list-meta';
        
        const numberFront = document.createElement('span');
        numberFront.className = 'input-list-number';
        numberFront.textContent = String(word.id).padStart(4, '0');
        
        const numberBack = document.createElement('span');
        numberBack.className = 'input-list-number';
        numberBack.textContent = String(word.id).padStart(4, '0');
        
        let isCorrect = false, isWrong = false;
        
        // 進捗マーカーをスキップしない場合のみ計算
        if (!skipProgress) {
            // 「すべての単語」の場合はグローバルな進捗キャッシュを使用
            if (selectedCategory === '大阪府のすべての英単語') {
                const cache = progressCache['__all__'];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else if (selectedCategory === 'LEVEL0 入門600語') {
                // 小学生で習った単語の場合は各単語のカテゴリーから進捗を取得
                const cache = progressCache[word.category];
                isCorrect = cache && cache.correct.has(word.id);
                isWrong = cache && cache.wrong.has(word.id);
            } else {
                isCorrect = categoryCorrectSet.has(word.id);
                isWrong = categoryWrongSet.has(word.id);
            }
            
            if (isWrong) {
                numberFront.classList.add('marker-wrong');
                numberBack.classList.add('marker-wrong');
                item.classList.add('marker-wrong');
            } else if (isCorrect) {
                numberFront.classList.add('marker-correct');
                numberBack.classList.add('marker-correct');
                item.classList.add('marker-correct');
            }
        }
        
        // 「すべての単語」の場合は単語番号クリックで進捗変更可能
        if (selectedCategory === '大阪府のすべての英単語') {
            const syncNumberMarkers = (src, dst) => {
                dst.classList.toggle('marker-correct', src.classList.contains('marker-correct'));
                dst.classList.toggle('marker-wrong', src.classList.contains('marker-wrong'));
            };
            
            numberFront.classList.add('clickable-number');
            numberFront.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleWordProgress(word, numberFront, item);
                syncNumberMarkers(numberFront, numberBack);
            });
            
            numberBack.classList.add('clickable-number');
            numberBack.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleWordProgress(word, numberBack, item);
                syncNumberMarkers(numberBack, numberFront);
            });
        }
        // チェックボックス（単語番号の左）
        const checkboxFront = document.createElement('div');
        checkboxFront.className = 'input-list-checkbox';
        const checkboxBack = document.createElement('div');
        checkboxBack.className = 'input-list-checkbox';
        
        const setReviewCheckedUI = (isChecked) => {
            checkboxFront.classList.toggle('checked', isChecked);
            checkboxBack.classList.toggle('checked', isChecked);
        };
        setReviewCheckedUI(reviewWords.has(word.id));
        
        const toggleReview = (e) => {
            e.stopPropagation();
            if (reviewWords.has(word.id)) {
                reviewWords.delete(word.id);
            } else {
                reviewWords.add(word.id);
            }
            saveReviewWords();
            setReviewCheckedUI(reviewWords.has(word.id));
        };
        
        checkboxFront.addEventListener('click', toggleReview);
        checkboxBack.addEventListener('click', toggleReview);
        
        // 左上は「チェック → 単語番号 → 品詞」（くっつけて表示）
        metaFront.appendChild(checkboxFront);
        metaBack.appendChild(checkboxBack);
        metaFront.appendChild(numberFront);
        metaBack.appendChild(numberBack);
        
        // 品詞（番号の右に表示：複数なら並べる）
        const posParts = splitPartOfSpeechLabels(word.partOfSpeech);
        posParts.forEach((p) => {
            const posLabelFront = document.createElement('span');
            posLabelFront.className = `flip-card-pos flip-card-pos-${getPosLabelKind(p)}`;
            posLabelFront.textContent = toShortPosFromPartOfSpeech(p);
            metaFront.appendChild(posLabelFront);
            
            const posLabelBack = document.createElement('span');
            posLabelBack.className = `flip-card-pos flip-card-pos-${getPosLabelKind(p)}`;
            posLabelBack.textContent = toShortPosFromPartOfSpeech(p);
            metaBack.appendChild(posLabelBack);
        });
        
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
        const wordFormatted = formatWordForDisplay(word.word);
        if (wordFormatted) {
            wordEl.innerHTML = wordFormatted;
        } else {
            wordEl.textContent = word.word;
        }
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
        
        const flipHint = document.createElement('div');
        flipHint.className = 'input-list-flip-hint';
        flipHint.textContent = 'タップしてめくる';
        
        front.appendChild(metaFront);
        front.appendChild(row);
        front.appendChild(flipHint);
        
        // 裏面
        const back = document.createElement('div');
        back.className = 'input-list-back';
        
        const meaningEl = document.createElement('div');
        meaningEl.className = 'input-list-meaning';
        
        const meaningWrapper = document.createElement('div');
        meaningWrapper.className = 'input-list-meaning-wrapper';
        const meaningPos = document.createElement('span');
        meaningPos.className = 'pos-inline part-of-speech input-list-meaning-pos';
        meaningPos.textContent = '';
        meaningPos.style.display = 'none';
        meaningWrapper.appendChild(meaningPos);
        const meaningText = document.createElement('span');
        // 単語カードモード（フリップ）では《活用》は表示しない
        setMeaningContent(meaningText, word.meaning || '', { hideConjugation: true, showPosBadges: false });
        meaningWrapper.appendChild(meaningText);
        meaningEl.appendChild(meaningWrapper);
        back.appendChild(metaBack);
        back.appendChild(meaningEl);
        const flipHintBack = document.createElement('div');
        flipHintBack.className = 'input-list-flip-hint';
        flipHintBack.textContent = 'タップしてめくる';
        back.appendChild(flipHintBack);
        
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
    
    // フリップデッキが既に構築済みの場合：DOM再構築をスキップしてデータ更新+カード再描画のみ
    // （シャッフル・フィルター変更時のパフォーマンス最適化）
    if (inputListViewMode === 'flip' && inputFlipDeckEls && container.classList.contains('flip-deck-mode')
        && Array.isArray(words) && words.length > 0) {
        // シャッフルモードの場合は単語をシャッフル
        let wordsToUse = Array.isArray(words) ? words : [];
        if (isInputShuffled && wordsToUse.length > 0) {
            wordsToUse = [...wordsToUse].sort(() => Math.random() - 0.5);
        }
        
        // 進捗キャッシュを更新
        let progressCache = {};
        let categoryCorrectSet = correctWords;
        let categoryWrongSet = wrongWords;
        if (selectedCategory === '大阪府のすべての英単語') {
            const allCorrectIds = new Set();
            const allWrongIds = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('correctWords-') || key.startsWith('wrongWords-'))) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (Array.isArray(data)) {
                            data.forEach(id => {
                                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                                if (key.startsWith('correctWords-')) allCorrectIds.add(numId);
                                else allWrongIds.add(numId);
                            });
                        }
                    } catch (e) {}
                }
            }
            progressCache['__all__'] = { correct: allCorrectIds, wrong: allWrongIds };
        } else if (selectedCategory !== 'LEVEL0 入門600語' && selectedCategory !== '入試直前これだけ1200語') {
            const sets = loadCategoryWordsForProgress(selectedCategory);
            categoryCorrectSet = sets.correctSet;
            categoryWrongSet = sets.wrongSet;
        } else {
            const modes = ['card', 'input'];
            wordsToUse.forEach(word => {
                const cat = word.category;
                if (!progressCache[cat]) {
                    progressCache[cat] = { correct: new Set(), wrong: new Set() };
                    modes.forEach(mode => {
                        const savedCorrect = localStorage.getItem(`correctWords-${cat}_${mode}`);
                        const savedWrong = localStorage.getItem(`wrongWords-${cat}_${mode}`);
                        if (savedCorrect) {
                            try { JSON.parse(savedCorrect).forEach(id => { progressCache[cat].correct.add(typeof id === 'string' ? parseInt(id, 10) : id); }); } catch (e) {}
                        }
                        if (savedWrong) {
                            try { JSON.parse(savedWrong).forEach(id => { const numId = typeof id === 'string' ? parseInt(id, 10) : id; progressCache[cat].wrong.add(numId); progressCache[cat].correct.delete(numId); }); } catch (e) {}
                        }
                    });
                }
            });
        }
        
        inputFlipDeckWords = wordsToUse;
        inputFlipDeckIndex = 0;
        inputFlipDeckAllFlipped = false;
        inputFlipDeckProgressPos = 0;
        inputFlipDeckFinished = false;
        inputFlipDeckContext = { progressCache, categoryCorrectSet, categoryWrongSet, skipProgress: false };
        container.classList.remove('deck-flipped');
        inputFlipDeckEls.renderDeckCard();
        inputFlipDeckEls.updateFlipAllBtnLabel();
        return;
    }
    
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
    inputFlipDeckEls = null; // DOMクリア時は必ずデッキ参照を破棄（フィルターで0件→復帰時に再構築させる）
    listView.classList.remove('hidden');
    
    // モードに応じてコンテナにクラスを追加
    if (inputListViewMode === 'expand') {
        container.classList.add('expand-mode');
        container.classList.remove('flip-mode');
        container.classList.remove('flip-deck-mode');
    } else {
        container.classList.add('flip-mode');
        container.classList.remove('expand-mode');
        // デッキ表示ではスクロール追随が不要なので、ヘッダーはコンテナ外のまま
        container.classList.add('flip-deck-mode');
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
    } else if (selectedCategory === 'LEVEL0 入門600語') {
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

    // デッキ描画用に「すべての単語」も progressCache に統一した形で入れておく
    if (selectedCategory === '大阪府のすべての英単語') {
        progressCache['__all__'] = { correct: allCorrectIds, wrong: allWrongIds };
    }
    
    let categoryCorrectSet = correctWords;
    let categoryWrongSet = wrongWords;
    if (selectedCategory && selectedCategory !== 'LEVEL0 入門600語' && selectedCategory !== '大阪府のすべての英単語' && selectedCategory !== '入試直前これだけ1200語') {
        // 両モードの進捗を合算して読み込む
        const sets = loadCategoryWordsForProgress(selectedCategory);
        categoryCorrectSet = sets.correctSet;
        categoryWrongSet = sets.wrongSet;
    }

    // ===== フリップ（単語カード）デッキ表示：1枚だけ描画 =====
    if (inputListViewMode === 'flip') {
        // 状態を初期化（フィルター/検索/ランダム適用時は先頭から）
        inputFlipDeckWords = Array.isArray(words) ? words : [];
        inputFlipDeckIndex = 0;
        inputFlipDeckAllFlipped = false; // 全カードフリップ状態をリセット
        inputFlipDeckProgressPos = 0; // 進捗表示もリセット
        inputFlipDeckFinished = false; // 完了状態もリセット
        inputFlipDeckContext = {
            progressCache,
            categoryCorrectSet,
            categoryWrongSet,
            skipProgress: false
        };

        // DOM構築（重なり + カード1枚 + ナビ）
        container.classList.add('flip-deck-mode');

        const stage = document.createElement('div');
        stage.className = 'flip-deck-stage';

        const stack = document.createElement('div');
        stack.className = 'flip-deck-stack';
        const stackInner = document.createElement('div');
        stackInner.className = 'flip-deck-stack-inner';
        stack.appendChild(stackInner);
        // 背面のダミーカード（5枚固定で使い回し、スタイル更新のみ＝DOM操作ゼロ）
        const MAX_STACK = 5;
        const stackCards = [];
        const fragment = document.createDocumentFragment();
        for (let i = MAX_STACK; i >= 1; i--) {
            const card = document.createElement('div');
            card.className = 'flip-deck-stack-card';
            card.style.display = 'none';
            fragment.appendChild(card);
            stackCards.push({ el: card, layer: i });
        }
        stackInner.appendChild(fragment);
        let lastStackRemaining = -1;
        const buildStackCards = (total) => {
            const remaining = Math.max(total - 1, 0);
            if (remaining === lastStackRemaining) return;
            lastStackRemaining = remaining;

            // 残り枚数ぶんだけレイヤーを表示（最大 MAX_STACK）
            // remaining=1 → layer1(白)のみ, remaining=2 → layer1+2, remaining=3 → layer1+2+3 ...
            const visibleLayers = Math.min(remaining, MAX_STACK);
            // 1レイヤーあたりのオフセット（px）: カードが多いほど少し広がる
            const spacing = Math.min(6, 3 + remaining * 0.08);

            for (let idx = 0; idx < MAX_STACK; idx++) {
                const { el, layer } = stackCards[idx];
                if (layer <= visibleLayers) {
                    el.style.display = '';
                    if (layer === 1) {
                        // 手前の白カード：メインカードの真後ろ
                        el.style.transform = 'translateY(0) scale(1)';
                    } else {
                        // 青カード：layer枚目ぶんだけ下にずらす
                        const dy = (layer - 1) * spacing;
                        const sc = 1 - (layer - 1) * 0.006;
                        el.style.transform = `translateY(${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
                    }
                } else {
                    el.style.display = 'none';
                }
            }
        };

        const host = document.createElement('div');
        host.className = 'flip-deck-host';

        stage.appendChild(stack);
        stage.appendChild(host);

        const nav = document.createElement('div');
        nav.className = 'flip-deck-nav';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'flip-deck-nav-btn flip-deck-nav-btn-prev';
        prevBtn.setAttribute('aria-label', '前のカードへ');
        prevBtn.innerHTML = '<span class="label">前へ</span>';

        const counter = document.createElement('div');
        counter.className = 'flip-deck-counter';
        counter.textContent = '';

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'flip-deck-nav-btn flip-deck-nav-btn-next';
        nextBtn.setAttribute('aria-label', '次のカードへ');
        nextBtn.innerHTML = '<span class="label">次へ</span>';

        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'flip-deck-nav-btn flip-deck-nav-btn-replay';
        replayBtn.setAttribute('aria-label', 'もう一度最初から');
        replayBtn.innerHTML = '<span class="label">もう一度</span>';
        replayBtn.style.display = 'none';

        nav.appendChild(prevBtn);
        nav.appendChild(counter);
        nav.appendChild(nextBtn);
        nav.appendChild(replayBtn);

        container.appendChild(stage);
        container.appendChild(nav);

        const stopSpeechIfPlaying = () => {
            if (currentSpeech) {
                window.speechSynthesis.cancel();
                currentSpeech = null;
                const playingButtons = document.querySelectorAll('.audio-btn.playing');
                playingButtons.forEach(btn => btn.classList.remove('playing'));
            }
        };

        const updateFlipAllBtnLabel = () => {
            const flipAllBtn = document.getElementById('inputFlipAllBtn');
            const btnLabel = flipAllBtn ? flipAllBtn.querySelector('.btn-label') : null;
            if (btnLabel) btnLabel.textContent = inputFlipDeckAllFlipped ? 'あ→A' : 'A→あ';
        };

        const showReplayCard = () => {
            const total = inputFlipDeckWords.length;
            host.innerHTML = '';
            buildStackCards(0);

            const replayCard = document.createElement('button');
            replayCard.type = 'button';
            replayCard.className = 'flip-deck-replay-card';
            replayCard.innerHTML = '<span class="label">もう一度</span>';
            replayCard.addEventListener('click', (e) => {
                e.preventDefault();
                stopSpeechIfPlaying();
                inputFlipDeckFinished = false;
                inputFlipDeckIndex = 0;
                inputFlipDeckProgressPos = 0;
                shouldAnimateFloatUp = true;
                renderDeckCard();
            });

            host.appendChild(replayCard);

            // ナビは無効化（カード位置の「もう一度」を使う）。最後なので前へも非表示
            prevBtn.disabled = true;
            prevBtn.style.display = 'none';
            nextBtn.disabled = true;
            nextBtn.style.display = 'none';
            replayBtn.style.display = 'none';
            counter.textContent = `${total} / ${total}`;
        };

        // host配下でのクリックを先に捕まえて、音声再生を止める（カード側のflip処理より先に実行）
        host.addEventListener('click', () => {
            stopSpeechIfPlaying();
        }, true);

        // カードをタップでめくっても「すべてめくる」ボタンラベルは追随させない

        let shouldAnimateFloatUp = false;
        let prevReturnInProgress = false;
        let nextFlyInProgress = false;
        let nextFlyTimeoutId = null;
        let nextFlyCleanup = null;
        let prevReturnTimeoutId = null;
        let prevReturnCleanup = null;

        /** 再生中の「次へ」アニメーションを即時完了させ、どんどん次へ進めるようにする。スキップした場合 true */
        const finishPendingNext = () => {
            if (!nextFlyInProgress || !nextFlyCleanup) return false;
            if (nextFlyTimeoutId !== null) clearTimeout(nextFlyTimeoutId);
            nextFlyTimeoutId = null;
            nextFlyCleanup();
            nextFlyCleanup = null;
            nextFlyInProgress = false;
            return true;
        };

        /** 再生中の「前へ」アニメーションを即時完了させる。スキップした場合 true */
        const finishPendingPrev = () => {
            if (!prevReturnInProgress || !prevReturnCleanup) return false;
            if (prevReturnTimeoutId !== null) clearTimeout(prevReturnTimeoutId);
            prevReturnTimeoutId = null;
            prevReturnCleanup();
            prevReturnCleanup = null;
            prevReturnInProgress = false;
            return true;
        };

        // A→あ/あ→Aモード：CSSフリップではなく表裏の表示順を入れ替える
        const applyFlipAllMode = (item) => {
            if (!item) return;
            const front = item.querySelector('.input-list-front');
            const back = item.querySelector('.input-list-back');
            if (!front || !back) return;
            if (inputFlipDeckAllFlipped) {
                front.style.order = '2';
                back.style.order = '1';
                back.style.transform = 'translateZ(1px)';
                back.style.position = 'relative';
                front.style.transform = 'rotateY(180deg) translateZ(1px)';
                front.style.position = 'absolute';
            } else {
                front.style.order = '';
                back.style.order = '';
                front.style.transform = '';
                front.style.position = '';
                back.style.transform = '';
                back.style.position = '';
            }
        };

        const renderDeckCard = () => {
            container.classList.remove('deck-flipped');
            host.innerHTML = '';
            const total = inputFlipDeckWords.length;
            if (total === 0) {
                counter.textContent = '0 / 0';
                prevBtn.disabled = true;
                prevBtn.style.display = 'none';
                nextBtn.disabled = true;
                nextBtn.style.display = '';
                replayBtn.style.display = 'none';
                updateFlipAllBtnLabel();
                buildStackCards(0);
                return;
            }

            // 完了状態：カード位置に「もう一度」を表示
            if (inputFlipDeckFinished) {
                showReplayCard();
                return;
            }

            // インデックスが範囲外の場合は安全に補正
            if (inputFlipDeckIndex < 0) inputFlipDeckIndex = 0;
            if (inputFlipDeckIndex >= total) {
                inputFlipDeckFinished = true;
                showReplayCard();
                return;
            }

            // 残り枚数に合わせてスタックを再生成（減っていく）
            const remaining = Math.max(total - inputFlipDeckIndex - 1, 0);
            buildStackCards(remaining + 1);

            const word = inputFlipDeckWords[inputFlipDeckIndex];
            if (!word || !inputFlipDeckContext) {
                console.warn('renderDeckCard: word or context is missing', inputFlipDeckIndex);
                return;
            }
            const item = createInputListItem(
                word,
                inputFlipDeckContext.progressCache,
                inputFlipDeckContext.categoryCorrectSet,
                inputFlipDeckContext.categoryWrongSet,
                inputFlipDeckContext.skipProgress
            );
            // A→あ/あ→Aモードを反映（フリップではなく表裏入れ替え）
            item.classList.remove('flipped');
            applyFlipAllMode(item);

            host.appendChild(item);

            // 進捗は index に合わせて更新
            inputFlipDeckProgressPos = inputFlipDeckIndex;
            counter.textContent = `${inputFlipDeckIndex + 1} / ${total}`;
            const atEnd = inputFlipDeckIndex >= total - 1;
            prevBtn.disabled = inputFlipDeckIndex <= 0;
            prevBtn.style.display = ''; // 最後の1枚でも表示、もう一度のときだけ非表示
            nextBtn.disabled = false;   // 最後の1枚でも次へで「もう一度」へ進める
            nextBtn.style.display = '';
            // 「もう一度」はカード位置で出すのでナビには出さない
            replayBtn.style.display = 'none';
            updateFlipAllBtnLabel();
            
            // スタック表示は buildStackCards(remaining+1) が担当
        };

        const goPrev = () => {
            stopSpeechIfPlaying();
            if (inputFlipDeckIndex <= 0) return false;
            inputFlipDeckIndex -= 1;
            shouldAnimateFloatUp = true;
            renderDeckCard();
            return true;
        };

        const FLY_NEXT_DURATION = 650;

        const goNext = () => {
            stopSpeechIfPlaying();
            const hadPending = finishPendingNext(); /* アニメ中なら即時完了。return せずそのまま次へ進む */
            const total = inputFlipDeckWords.length;
            if (total === 0) return false;

            const runNext = () => {
                const currentItem = host.querySelector('.input-list-item');
                if (!currentItem) {
                    if (inputFlipDeckIndex >= total - 1) return false;
                    inputFlipDeckIndex += 1;
                    shouldAnimateFloatUp = true;
                    renderDeckCard();
                    return true;
                }
                const atEnd = inputFlipDeckIndex >= total - 1;
                let nextItem = null;
                if (!atEnd) {
                    const nextWord = inputFlipDeckWords[inputFlipDeckIndex + 1];
                    if (!nextWord || !inputFlipDeckContext) {
                        inputFlipDeckIndex += 1;
                        shouldAnimateFloatUp = true;
                        renderDeckCard();
                        return true;
                    }
                    nextItem = createInputListItem(
                        nextWord,
                        inputFlipDeckContext.progressCache,
                        inputFlipDeckContext.categoryCorrectSet,
                        inputFlipDeckContext.categoryWrongSet,
                        inputFlipDeckContext.skipProgress
                    );
                    applyFlipAllMode(nextItem);
                    nextItem.classList.add('deck-card-below');
                    host.insertBefore(nextItem, currentItem);
                }
                currentItem.classList.add('deck-card-above');
                currentItem.classList.add('swipe-out-right');
                nextFlyInProgress = true;

                nextFlyCleanup = () => {
                    try {
                        if (currentItem && currentItem.parentNode) currentItem.remove();
                    } catch (e) { /* already removed */ }
                    if (nextItem) nextItem.classList.remove('deck-card-below');
                    nextFlyInProgress = false;
                    if (atEnd) {
                        inputFlipDeckFinished = true;
                        showReplayCard();
                        return;
                    }
                    inputFlipDeckIndex += 1;
                    inputFlipDeckProgressPos = inputFlipDeckIndex;
                    counter.textContent = `${inputFlipDeckIndex + 1} / ${total}`;
                    prevBtn.disabled = inputFlipDeckIndex <= 0;
                    prevBtn.style.display = '';
                    nextBtn.disabled = false;
                    nextBtn.style.display = '';
                    replayBtn.style.display = 'none';
                    updateFlipAllBtnLabel();
                    const remaining = Math.max(total - inputFlipDeckIndex - 1, 0);
                    buildStackCards(remaining + 1);
                };
                nextFlyTimeoutId = setTimeout(() => {
                    if (nextFlyCleanup) {
                        nextFlyCleanup();
                    }
                    nextFlyCleanup = null;
                    nextFlyTimeoutId = null;
                }, FLY_NEXT_DURATION);
                return true;
            };

            /* 即時完了した直後は DOM 更新を待ってから次を実行し、連打で確実に進むようにする */
            if (hadPending) {
                requestAnimationFrame(runNext);
                return true;
            }
            return runNext();
        };

        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (inputFlipDeckFinished) return;
            if (inputFlipDeckIndex <= 0) return;
            finishPendingPrev();
            finishPendingNext();
            stopSpeechIfPlaying();

            const currentItem = host.querySelector('.input-list-item');
            const total = inputFlipDeckWords.length;
            const prevIndex = inputFlipDeckIndex - 1;

            if (!currentItem || !total) {
                goPrev();
                return;
            }

            // 前のカードを「戻ってくる」アニメーションで表示
            const prevWord = inputFlipDeckWords[prevIndex];
            if (!prevWord || !inputFlipDeckContext) {
                goPrev();
                return;
            }
            const prevItem = createInputListItem(
                prevWord,
                inputFlipDeckContext.progressCache,
                inputFlipDeckContext.categoryCorrectSet,
                inputFlipDeckContext.categoryWrongSet,
                inputFlipDeckContext.skipProgress
            );
            applyFlipAllMode(prevItem);
            prevItem.classList.add('deck-card-return-in');
            host.insertBefore(prevItem, currentItem);

            currentItem.classList.add('deck-card-above');
            currentItem.classList.add('deck-card-return-out');
            prevReturnInProgress = true;

            prevReturnCleanup = () => {
                try {
                    if (currentItem && currentItem.parentNode) currentItem.remove();
                } catch (e) { /* already removed */ }
                prevItem.classList.remove('deck-card-return-in');
                prevReturnInProgress = false;
                inputFlipDeckIndex = prevIndex;
                inputFlipDeckProgressPos = inputFlipDeckIndex;
                counter.textContent = `${inputFlipDeckIndex + 1} / ${total}`;
                prevBtn.disabled = inputFlipDeckIndex <= 0;
                prevBtn.style.display = '';
                nextBtn.disabled = false;
                nextBtn.style.display = '';
                replayBtn.style.display = 'none';
                updateFlipAllBtnLabel();
                const remaining = Math.max(total - inputFlipDeckIndex - 1, 0);
                buildStackCards(remaining + 1);
            };
            prevReturnTimeoutId = setTimeout(() => {
                if (prevReturnCleanup) {
                    prevReturnCleanup();
                }
                prevReturnCleanup = null;
                prevReturnTimeoutId = null;
            }, 620);
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goNext();
        });

        replayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopSpeechIfPlaying();
            inputFlipDeckFinished = false;
            inputFlipDeckIndex = 0;
            inputFlipDeckProgressPos = 0;
            shouldAnimateFloatUp = true;
            renderDeckCard();
        });

        // ===== スワイプで前後移動（めくらなくてもOK） =====
        let swipeStartX = 0;
        let swipeStartY = 0;
        let swipeStartTime = 0;
        let isSwiping = false;

        const SWIPE_THRESHOLD = 50; // 最低スワイプ距離
        const SWIPE_TIME_LIMIT = 400; // スワイプ判定の時間制限（ms）

        host.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            swipeStartX = e.touches[0].clientX;
            swipeStartY = e.touches[0].clientY;
            swipeStartTime = Date.now();
            isSwiping = true;
        }, { passive: true });

        host.addEventListener('touchmove', (e) => {
            // 縦スクロールが主なら無効化
            if (!isSwiping) return;
            const diffX = Math.abs(e.touches[0].clientX - swipeStartX);
            const diffY = Math.abs(e.touches[0].clientY - swipeStartY);
            if (diffY > diffX * 1.2) {
                isSwiping = false;
            }
        }, { passive: true });

        host.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            finishPendingNext(); /* 前のアニメがあれば即時完了してからこのスワイプを処理 */
            const endX = e.changedTouches[0].clientX;
            const diffX = endX - swipeStartX;
            const elapsed = Date.now() - swipeStartTime;

            if (elapsed > SWIPE_TIME_LIMIT) return;
            if (Math.abs(diffX) < SWIPE_THRESHOLD) return;

            const currentItem = host.querySelector('.input-list-item');
            const total = inputFlipDeckWords.length;
            if (!currentItem || total <= 1) return;
            const atEnd = inputFlipDeckIndex >= total - 1;
            const direction = diffX < 0 ? 'left' : 'right';

            nextFlyInProgress = true;

            // アニメが確実に効くよう、飛ばすカードをラッパーで包んでラッパーにアニメを適用
            const flyWrapper = document.createElement('div');
            flyWrapper.className = `deck-swipe-fly-wrapper deck-card-above swipe-out-${direction}`;
            host.insertBefore(flyWrapper, currentItem);
            flyWrapper.appendChild(currentItem);

            let nextItem = null;
            if (!atEnd) {
                const nextWord = inputFlipDeckWords[inputFlipDeckIndex + 1];
                if (nextWord && inputFlipDeckContext) {
                    nextItem = createInputListItem(
                        nextWord,
                        inputFlipDeckContext.progressCache,
                        inputFlipDeckContext.categoryCorrectSet,
                        inputFlipDeckContext.categoryWrongSet,
                        inputFlipDeckContext.skipProgress
                    );
                    applyFlipAllMode(nextItem);
                    nextItem.classList.add('deck-card-below');
                    host.appendChild(nextItem);
                }
            }

            nextFlyCleanup = () => {
                nextFlyInProgress = false;
                try {
                    if (flyWrapper && flyWrapper.parentNode) flyWrapper.remove();
                } catch (e) { /* already removed */ }
                if (nextItem) nextItem.classList.remove('deck-card-below');
                if (atEnd) {
                    inputFlipDeckFinished = true;
                    showReplayCard();
                    return;
                }
                inputFlipDeckIndex += 1;
                inputFlipDeckProgressPos = inputFlipDeckIndex;
                counter.textContent = `${inputFlipDeckIndex + 1} / ${total}`;
                prevBtn.disabled = inputFlipDeckIndex <= 0;
                prevBtn.style.display = '';
                nextBtn.disabled = false;
                nextBtn.style.display = '';
                replayBtn.style.display = 'none';
                updateFlipAllBtnLabel();
                const remaining = Math.max(total - inputFlipDeckIndex - 1, 0);
                buildStackCards(remaining + 1);
            };
            nextFlyTimeoutId = setTimeout(() => {
                if (nextFlyCleanup) {
                    nextFlyCleanup();
                }
                nextFlyCleanup = null;
                nextFlyTimeoutId = null;
            }, 650);
        }, { passive: true });

        // グローバル参照（他イベントから現カード参照したいとき用）
        inputFlipDeckEls = { container, stage, host, prevBtn, nextBtn, counter, renderDeckCard, updateFlipAllBtnLabel, goPrev, goNext };

        renderDeckCard();

        // 描画完了後にスクロール位置を一番上にリセット
        setTimeout(() => {
            window.scrollTo(0, 0);
            listView.scrollTop = 0;
            container.scrollTop = 0;
            if (elements.mainContent) {
                elements.mainContent.scrollTop = 0;
            }
        }, 0);
        return;
    }
    
    // 展開モード：1番上の単語の上に水色で No.○○○○～○○○○ を表示（表示中の範囲＝idの最小～最大。ランダムで順序だけ変わっても同じ範囲を表示）
    if (inputListViewMode === 'expand' && words.length > 0) {
        const ids = words.map((w) => w.id);
        const firstId = Math.min(...ids);
        const lastId = Math.max(...ids);
        const pad = (n) => String(n).padStart(4, '0');
        const headerWrap = document.createElement('div');
        headerWrap.className = 'expand-range-header';
        const rangeTitle = document.createElement('div');
        rangeTitle.className = 'expand-range-title';
        rangeTitle.innerHTML = `<span class="expand-range-no">単語番号</span>${pad(firstId)}-${pad(lastId)}`;
        headerWrap.appendChild(rangeTitle);
        container.appendChild(headerWrap);
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
            } else if (selectedCategory === 'LEVEL0 入門600語') {
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
            
            // ====== 左カラム（英単語情報） ======
            const leftCol = document.createElement('div');
            leftCol.className = 'expand-left-col';
            
            // 上部：番号とチェックボックスの連結ボックス
            const leftTop = document.createElement('div');
            leftTop.className = 'expand-left-top';
            
            // 番号（先に追加）
            const number = document.createElement('span');
            number.className = 'input-list-expand-number';
            number.textContent = String(word.id).padStart(4, '0');
            if (isWrong) {
                number.classList.add('marker-wrong');
            } else if (isCorrect) {
                number.classList.add('marker-correct');
            }
            // チェックボックス（左に表示）
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
            leftTop.appendChild(checkbox);

            // 番号（チェックの右に表示）
            leftTop.appendChild(number);

            // 品詞（番号の右に表示：複数なら並べる。区切りの「・」は表示しない）
            const posParts = splitPartOfSpeechLabels(word.partOfSpeech);
            posParts.forEach((p) => {
                const posLabel = document.createElement('span');
                posLabel.className = `expand-left-pos expand-left-pos-${getPosLabelKind(p)}`;
                posLabel.textContent = toShortPosFromPartOfSpeech(p);
                leftTop.appendChild(posLabel);
            });
            leftCol.appendChild(leftTop);
            
            // 英単語（はみ出す場合は横縮小）
            const wordEl = document.createElement('div');
            wordEl.className = 'input-list-expand-word';
            const wordFormatted = formatWordForDisplay(word.word);
            if (wordFormatted) {
                wordEl.innerHTML = wordFormatted;
            } else {
                wordEl.textContent = word.word;
            }
            leftCol.appendChild(wordEl);
            fitWordToContainer(wordEl);
            
            // カタカナ読み（あれば）
            if (word.kana) {
                const kanaEl = document.createElement('div');
                kanaEl.className = 'input-list-expand-kana';
                kanaEl.innerHTML = word.kana.replace(/\*([^*]+)\*/g, '<b>$1</b>');
                leftCol.appendChild(kanaEl);
            }
            
            // 発音ボタン
            const pronunciationBtn = document.createElement('button');
            pronunciationBtn.className = 'expand-pronunciation-btn';
            pronunciationBtn.setAttribute('type', 'button');
            pronunciationBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
            pronunciationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                speakWord(word.word, pronunciationBtn);
            });
            leftCol.appendChild(pronunciationBtn);
            
            item.appendChild(leftCol);
            
            // ====== 右カラム（意味・例文） ======
            const rightCol = document.createElement('div');
            rightCol.className = 'expand-right-col';
            
            // 品詞バッジ（meaningから抽出）
            const posBadgeText = getMeaningPosBadgeText(word.meaning || '');
            if (posBadgeText) {
                const posBadge = document.createElement('span');
                posBadge.className = 'expand-pos-badge';
                posBadge.textContent = posBadgeText;
                rightCol.appendChild(posBadge);
            }
            
            // 意味テキスト
            const meaningText = document.createElement('div');
            meaningText.className = 'expand-meaning-text';
            setMeaningContent(meaningText, word.meaning || '', { hideConjugation: true, showPosBadges: false });
            rightCol.appendChild(meaningText);
            
            // 活用・例文セクション（線の下）
            const conjugationText = extractConjugationFromText(word.meaning || '');
            const hasExample = word.example && (word.example.english || word.example.japanese);
            
            if (conjugationText || hasExample) {
                // 線の下のコンテナ
                const belowLineSection = document.createElement('div');
                belowLineSection.className = 'expand-below-line-section';
                
                // 活用（あれば）
                if (conjugationText) {
                    const conjSection = document.createElement('div');
                    conjSection.className = 'expand-conjugation-section';
                    
                    const conjBadge = document.createElement('span');
                    conjBadge.className = 'expand-conjugation-badge';
                    conjBadge.textContent = '活';
                    conjSection.appendChild(conjBadge);
                    
                    const conjText = document.createElement('span');
                    conjText.className = 'expand-conjugation-text';
                    conjText.textContent = conjugationText;
                    conjSection.appendChild(conjText);
                    
                    belowLineSection.appendChild(conjSection);
                }
                
                // 例文（あれば）
                if (hasExample) {
                    const exampleSection = document.createElement('div');
                    exampleSection.className = 'expand-example-section';
                    
                    // 例バッジと英語を横並び
                    const exampleRow = document.createElement('div');
                    exampleRow.className = 'expand-example-row';
                    
                    const exampleBadge = document.createElement('span');
                    exampleBadge.className = 'expand-example-badge';
                    exampleBadge.textContent = '例';
                    exampleRow.appendChild(exampleBadge);
                    
                    if (word.example.english) {
                        const exEn = document.createElement('span');
                        exEn.className = 'expand-example-en';
                        if (word.word) {
                            exEn.innerHTML = highlightTargetWord(word.example.english, word.word);
                        } else {
                            exEn.textContent = word.example.english;
                        }
                        exampleRow.appendChild(exEn);
                    }
                    
                    exampleSection.appendChild(exampleRow);
                    
                    if (word.example.japanese) {
                        const exJa = document.createElement('div');
                        exJa.className = 'expand-example-ja';
                        exJa.innerHTML = word.example.japanese;
                        exampleSection.appendChild(exJa);
                    }
                    
                    belowLineSection.appendChild(exampleSection);
                }
                
                rightCol.appendChild(belowLineSection);
            }
            
            // でた度表示（右カラム内に配置）
            if (typeof word.appearanceCount === 'number' && !Number.isNaN(word.appearanceCount)) {
                const topActions = document.createElement('div');
                topActions.className = 'input-list-expand-top-actions';
                
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
                rightCol.appendChild(topActions);
            }
            
            item.appendChild(rightCol);
            
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
            
            const metaFront = document.createElement('div');
            metaFront.className = 'input-list-meta';
            
            const metaBack = document.createElement('div');
            metaBack.className = 'input-list-meta';
            
            const numberFront = document.createElement('span');
            numberFront.className = 'input-list-number';
            numberFront.textContent = String(word.id).padStart(4, '0');
            
            const numberBack = document.createElement('span');
            numberBack.className = 'input-list-number';
            numberBack.textContent = String(word.id).padStart(4, '0');
            
            // 進捗を取得
            let isCorrectFlip, isWrongFlip;
            if (selectedCategory === '大阪府のすべての英単語') {
                // 「すべての単語」の場合
                isCorrectFlip = allCorrectIds.has(word.id);
                isWrongFlip = allWrongIds.has(word.id);
            } else if (selectedCategory === 'LEVEL0 入門600語') {
                const cache = progressCache[word.category];
                isCorrectFlip = cache && cache.correct.has(word.id);
                isWrongFlip = cache && cache.wrong.has(word.id);
            } else {
                isCorrectFlip = categoryCorrectSet.has(word.id);
                isWrongFlip = categoryWrongSet.has(word.id);
            }
            
            if (isWrongFlip) {
                numberFront.classList.add('marker-wrong');
                numberBack.classList.add('marker-wrong');
                item.classList.add('marker-wrong');
            } else if (isCorrectFlip) {
                numberFront.classList.add('marker-correct');
                numberBack.classList.add('marker-correct');
                item.classList.add('marker-correct');
            }
            
            // 「すべての単語」の場合は単語番号クリックで進捗変更可能
            if (selectedCategory === '大阪府のすべての英単語') {
                const syncNumberMarkers = (src, dst) => {
                    dst.classList.toggle('marker-correct', src.classList.contains('marker-correct'));
                    dst.classList.toggle('marker-wrong', src.classList.contains('marker-wrong'));
                };
                
                numberFront.classList.add('clickable-number');
                numberFront.addEventListener('click', (e) => {
                    e.stopPropagation();
                    cycleWordProgress(word, numberFront, item);
                    syncNumberMarkers(numberFront, numberBack);
                });
                
                numberBack.classList.add('clickable-number');
                numberBack.addEventListener('click', (e) => {
                    e.stopPropagation();
                    cycleWordProgress(word, numberBack, item);
                    syncNumberMarkers(numberBack, numberFront);
                });
            }
            // チェックボックス（単語番号の左）
            const checkboxFront = document.createElement('div');
            checkboxFront.className = 'input-list-checkbox';
            const checkboxBack = document.createElement('div');
            checkboxBack.className = 'input-list-checkbox';
            
            const setReviewCheckedUI = (isChecked) => {
                checkboxFront.classList.toggle('checked', isChecked);
                checkboxBack.classList.toggle('checked', isChecked);
            };
            setReviewCheckedUI(reviewWords.has(word.id));
            
            const toggleReview = (e) => {
                e.stopPropagation();
                if (reviewWords.has(word.id)) {
                    reviewWords.delete(word.id);
                } else {
                    reviewWords.add(word.id);
                }
                saveReviewWords();
                setReviewCheckedUI(reviewWords.has(word.id));
            };
            
            checkboxFront.addEventListener('click', toggleReview);
            checkboxBack.addEventListener('click', toggleReview);
            
            // 左上は「チェック → 単語番号」（くっつけて表示）
            metaFront.appendChild(checkboxFront);
            metaBack.appendChild(checkboxBack);
            metaFront.appendChild(numberFront);
            metaBack.appendChild(numberBack);
            
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
            
            front.appendChild(metaFront);
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
            meaningPos.textContent = '';
            meaningPos.style.display = 'none';
            meaningWrapper.appendChild(meaningPos);
            const meaningText = document.createElement('span');
            // 単語カードモード（フリップ）では《活用》は表示しない
            setMeaningContent(meaningText, word.meaning || '', { hideConjugation: true, showPosBadges: false });
            meaningWrapper.appendChild(meaningText);
            meaningEl.appendChild(meaningWrapper);
            back.appendChild(metaBack);
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
                // 先にフリップを反映して体感の遅れを防ぐ
                item.classList.toggle('flipped');
                // 音声再生中なら停止・スタイルリセットは後で（非ブロッキング）
                if (currentSpeech) {
                    window.speechSynthesis.cancel();
                    currentSpeech = null;
                    const playingButtons = document.querySelectorAll('.audio-btn.playing');
                    playingButtons.forEach(btn => btn.classList.remove('playing'));
                }
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
            if (btnLabel) btnLabel.textContent = 'A→あ';
        }
        // コンパクト表示トグルを非表示（カードモードでは不要）
        const compactBtn = document.getElementById('compactModeToggleBtn');
        if (compactBtn) compactBtn.classList.add('hidden');
        
        // フィルターを適用して再描画（絞り込み状態を保持）
        applyInputFilter();
    });
    
    expandBtn.addEventListener('click', () => {
        if (inputListViewMode === 'expand') return;
        inputListViewMode = 'expand';
        expandBtn.classList.add('active');
        flipBtn.classList.remove('active');
        updateRedSheetToggleVisibility();
        // すべてめくるボタンを非表示
        if (flipAllBtn) flipAllBtn.classList.add('hidden');
        // コンパクト表示トグルを表示
        const compactBtn = document.getElementById('compactModeToggleBtn');
        if (compactBtn) compactBtn.classList.remove('hidden');
        
        // 現在の単語リストを再描画（フィルターを適用）
        applyInputFilter();
    });
    
    // すべてめくるボタンのイベント
    if (flipAllBtn) {
        flipAllBtn.addEventListener('click', () => {
            const container = document.getElementById('inputListContainer');
            if (!container) return;
            const btnLabel = flipAllBtn.querySelector('.btn-label');

            // デッキ表示のときはシャッフルと同じアニメーション（縮小＋白み→切替→フェードイン）
            if (container.classList.contains('flip-deck-mode')) {
                container.classList.add('shuffle-animating');
                setTimeout(() => {
                    inputFlipDeckAllFlipped = !inputFlipDeckAllFlipped;
                    if (inputFlipDeckEls) {
                        inputFlipDeckEls.renderDeckCard();
                    }
                    if (btnLabel) {
                        btnLabel.textContent = inputFlipDeckAllFlipped ? 'あ→A' : 'A→あ';
                    }
                    container.classList.remove('shuffle-animating');
                    container.classList.add('shuffle-fade-in');
                    setTimeout(() => {
                        container.classList.remove('shuffle-fade-in');
                    }, 300);
                }, 250);
                return;
            }

            const items = container.querySelectorAll('.input-list-item');
            
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
                    btnLabel.textContent = 'A→あ';
                } else {
                    btnLabel.textContent = 'あ→A';
                }
            }
        });
    }
}

// コンパクト表示トグルボタンのセットアップ
function setupInputListSettings() {
    const compactToggleBtn = document.getElementById('compactModeToggleBtn');
    const inputListContainer = document.getElementById('inputListContainer');
    
    if (!compactToggleBtn) return;
    
    compactToggleBtn.addEventListener('click', () => {
        const isActive = compactToggleBtn.classList.toggle('active');
        if (inputListContainer) {
            if (isActive) {
                inputListContainer.classList.add('compact-mode');
                inputListContainer.classList.add('hide-examples');
            } else {
                inputListContainer.classList.remove('compact-mode');
                inputListContainer.classList.remove('hide-examples');
            }
        }
    });
}

// 設定をコンテナに適用
function applyInputListSettings() {
    const inputListContainer = document.getElementById('inputListContainer');
    if (!inputListContainer) return;
    
    const isAllWords = selectedCategory === '大阪府のすべての英単語';
    
    // でた度で絞るは常に非表示。検索コンテナはすべての単語のときのみ表示
    const freqSection = document.getElementById('filterFrequencySection');
    const wordSearchContainer = document.getElementById('wordSearchContainer');
    if (freqSection) freqSection.classList.add('hidden');
    if (isAllWords) {
        inputListContainer.classList.add('all-words-mode');
        if (wordSearchContainer) wordSearchContainer.classList.remove('hidden');
    } else {
        inputListContainer.classList.remove('all-words-mode');
        if (wordSearchContainer) wordSearchContainer.classList.add('hidden');
    }
}

// 互換性のため残す（空関数）
function updateExamplesToggleAvailability() {
    // 用例設定は削除済み
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
        const freqAllCheckbox = document.getElementById('inputFilterFreqAll');
        const searchInput = document.getElementById('wordSearchInput');
        const hasFreqFilter = freqAllCheckbox && !freqAllCheckbox.checked;
        const hasSearch = searchInput && searchInput.value.trim() !== '';
        
        if (allCheckbox && allCheckbox.checked && !hasFreqFilter && !hasSearch) {
            // すべて選択時かつ頻度フィルター/検索なしはバッジ非表示
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
    
    // 頻度フィルターのセットアップ
    const freqCheckboxes = document.querySelectorAll('[data-filter-freq]');
    freqCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const filterType = checkbox.dataset.filterFreq;
            const freqAllCheckbox = document.getElementById('inputFilterFreqAll');
            const otherFreqCheckboxes = Array.from(freqCheckboxes).filter(cb => cb.dataset.filterFreq !== 'all');
            
            if (filterType === 'all') {
                if (checkbox.checked) {
                    otherFreqCheckboxes.forEach(cb => cb.checked = true);
                } else {
                    otherFreqCheckboxes.forEach(cb => cb.checked = false);
                }
            } else {
                const allChecked = otherFreqCheckboxes.every(cb => cb.checked);
                if (freqAllCheckbox) freqAllCheckbox.checked = allChecked;
            }
            applyInputFilter();
        });
    });
    
    // 単語検索のセットアップ（単語リストの上）
    const wordSearchInput = document.getElementById('wordSearchInput');
    const wordSearchClear = document.getElementById('wordSearchClear');
    if (wordSearchInput) {
        let searchTimeout;
        wordSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            // クリアボタンの表示/非表示
            if (wordSearchClear) {
                if (wordSearchInput.value.trim() !== '') {
                    wordSearchClear.classList.remove('hidden');
                } else {
                    wordSearchClear.classList.add('hidden');
                }
            }
            searchTimeout = setTimeout(() => {
                applyInputFilter();
            }, 300);
        });
    }
    if (wordSearchClear) {
        wordSearchClear.addEventListener('click', () => {
            if (wordSearchInput) {
                wordSearchInput.value = '';
                wordSearchClear.classList.add('hidden');
                applyInputFilter();
            }
        });
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
            // 新レイアウト：.expand-right-col（右カラム全体）を対象にする
            const rightCols = document.querySelectorAll('.expand-right-col');
            let targetCol = null;
            let targetIndex = 0;
            
            // ヘッダーの高さを考慮したオフセット（スティッキーなコントロールバーなど）
            const headerOffset = 150; 

            for (let i = 0; i < rightCols.length; i++) {
                const rect = rightCols[i].getBoundingClientRect();
                // 画面内にあり、かつヘッダーより下にある最初の要素を見つける
                if (rect.bottom > headerOffset) {
                    targetCol = rightCols[i];
                    targetIndex = i;
                    break;
                }
            }

            currentRedSheetIndex = targetIndex;
            let topPosition = 150; // デフォルト値
            let leftPosition = 0; // デフォルト値

            if (targetCol) {
                const rect = targetCol.getBoundingClientRect();
                topPosition = rect.top; // 右カラムの上端から
                // 右カラムの左端から隠す
                leftPosition = rect.left;
            } else if (rightCols.length > 0) {
                // 見つからない場合は一番最初の要素（フォールバック）
                const rect = rightCols[0].getBoundingClientRect();
                topPosition = rect.top;
                leftPosition = rect.left;
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
    // 新レイアウト：右カラムを対象にする
    const rightCols = document.querySelectorAll('.expand-right-col');
    
    if (!redSheetOverlay || !inputListView || rightCols.length === 0) return;
    
    // 画面の表示領域を取得（ヘッダーを考慮）
    const headerOffset = 150; // ヘッダー部分のオフセット
    const viewportHeight = window.innerHeight;
    
    // 赤シートの現在位置を取得
    const currentRedSheetTop = parseFloat(redSheetOverlay.style.top) || 0;
    
    // 現在隠している単語を特定（赤シートの位置に最も近い単語）
    let currentWordIndex = -1;
    for (let i = 0; i < rightCols.length; i++) {
        const rect = rightCols[i].getBoundingClientRect();
        if (rect.top <= currentRedSheetTop + 5) {
            currentWordIndex = i;
        } else {
            break;
        }
    }
    
    // 赤シートの位置より下にある最初の単語を見つける
    let nextIndex = -1;
    for (let i = 0; i < rightCols.length; i++) {
        const rect = rightCols[i].getBoundingClientRect();
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
    
    const nextCol = rightCols[nextIndex];
    if (!nextCol) return;
    
    // 次の単語の位置を取得
    const nextRect = nextCol.getBoundingClientRect();
    
    // 次の単語が画面外ならスクロール（現在の単語を隠したまま上へ）
    if (nextRect.top >= viewportHeight) {
        // 現在隠している単語を取得
        const currentCol = currentWordIndex >= 0 ? rightCols[currentWordIndex] : rightCols[0];
        const currentRect = currentCol.getBoundingClientRect();
        
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
        redSheetOverlay.style.left = currentRect.left + 'px';
        
        setTimeout(() => {
            redSheetOverlay.style.transition = '';
        }, 300);
        
        // インデックスは更新しない（次回のボタン押下で次の単語へ）
    } else {
        // 画面内なので赤シートを次の単語に移動
        currentRedSheetIndex = nextIndex;
        redSheetOverlay.style.transition = 'top 0.3s ease';
        redSheetOverlay.style.top = nextRect.top + 'px';
        redSheetOverlay.style.left = nextRect.left + 'px';
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
    // 「すべての単語」のときは常に単語帳表示（単語カードモードにしない）
    if (selectedCategory === '大阪府のすべての英単語') {
        inputListViewMode = 'expand';
        const expandBtn = document.getElementById('inputListModeExpand');
        const flipBtn = document.getElementById('inputListModeFlip');
        if (expandBtn) expandBtn.classList.add('active');
        if (flipBtn) flipBtn.classList.remove('active');
    }
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
    } else if (selectedCategory === 'LEVEL0 入門600語') {
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
    
    // 頻度フィルターを適用（すべての単語モードのみ）
    if (selectedCategory === '大阪府のすべての英単語') {
        const freqAllCheckbox = document.getElementById('inputFilterFreqAll');
        if (freqAllCheckbox && !freqAllCheckbox.checked) {
            const activeFreqs = [];
            const freqCheckboxes = document.querySelectorAll('[data-filter-freq]:checked');
            freqCheckboxes.forEach(cb => {
                if (cb.dataset.filterFreq !== 'all') {
                    activeFreqs.push(cb.dataset.filterFreq);
                }
            });
            
            if (activeFreqs.length > 0) {
                filteredWords = filteredWords.filter(word => {
                    const count = word.appearanceCount || 0;
                    const stars = getStarRating(count);
                    return activeFreqs.some(f => stars === parseInt(f));
                });
            } else {
                filteredWords = [];
            }
        }
        
        // 単語検索を適用（新しい検索入力）
        const searchInput = document.getElementById('wordSearchInput');
        if (searchInput && searchInput.value.trim() !== '') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filteredWords = filteredWords.filter(word => {
                const wordText = (word.word || '').toLowerCase();
                const meaning = (word.meaning || '').toLowerCase();
                return wordText.includes(searchTerm) || meaning.includes(searchTerm);
            });
        }
    }
    
    // フィルター結果を表示（0件でもrenderInputListViewを呼び出してツールバーを維持）
    if (filteredWords.length > 500) {
        renderInputListViewPaginated(filteredWords);
    } else {
        renderInputListView(filteredWords);
    }
    
    // 設定（コンパクトモード・用例表示）を適用
    applyInputListSettings();
    
    // フィルター結果の件数を更新
    updateFilterCount(filteredWords.length, baseWords.length);
    
    // バッジに絞り込んだ単語数を表示
    if (window.updateFilterBadge) {
        const allCheckbox = document.querySelector('.filter-dropdown-item input[data-filter="all"]');
        const freqAllCheckbox = document.getElementById('inputFilterFreqAll');
        const searchInput = document.getElementById('wordSearchInput');
        const hasFreqFilter = freqAllCheckbox && !freqAllCheckbox.checked;
        const hasSearch = searchInput && searchInput.value.trim() !== '';
        
        if (allCheckbox && allCheckbox.checked && !hasFreqFilter && !hasSearch) {
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
            'wrong': 'できなかった',
            'unlearned': '未学習',
            'bookmark': 'チェックマーク',
            'correct': 'できた'
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
    
    // 頻度フィルターもリセット
    const freqCheckboxes = document.querySelectorAll('[data-filter-freq]');
    freqCheckboxes.forEach(cb => cb.checked = true);
    
    // 検索入力をリセット
    const searchInput = document.getElementById('wordSearchInput');
    if (searchInput) searchInput.value = '';
    const searchClear = document.getElementById('wordSearchClear');
    if (searchClear) searchClear.classList.add('hidden');

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
        // 最後の問題を解いた後、進捗バーを100%にする
        const progressBarFill = document.getElementById('progressBarFill');
        if (progressBarFill) {
            progressBarFill.style.width = '100%';
        }
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
    
    // 品詞表示は meaning 内の【名】【形】等からのみ行う（partOfSpeech由来の表示は廃止）
    const posShort = '';
    const posClass = 'other';
    
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
    
    const wordFormatted = formatWordForDisplay(word.word);
    if (wordFormatted) {
        elements.englishWord.innerHTML = wordFormatted;
    } else {
        elements.englishWord.textContent = word.word;
    }
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
    // 単語カード（フリップ）の裏面では《活用》は表示しない
    setMeaningContent(elements.meaning, word.meaning, { hideConjugation: true });
    
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
                exampleEnglishEl.innerHTML = highlightTargetWord(exampleEn, word.word);
            } else {
                exampleEnglishEl.textContent = exampleEn;
            }

            exampleJapaneseEl.innerHTML = word.example.japanese || '';
            
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
    
    // 4択クイズUIを更新
    updateQuizModeUI(word);
}

// =====================================================
// 4択クイズモード関連
// =====================================================

let quizChoicesRevealed = false;
let quizStreakCount = 0; // 連続正解カウント

// 連続正解表示を更新（英語→日本語モードと日本語→英語モード両方）
function updateQuizStreakDisplay() {
    // 英語→日本語モード用
    const streakDisplay = document.getElementById('quizStreakDisplay');
    const streakNumber = document.getElementById('quizStreakNumber');
    
    // 日本語→英語モード用
    const hwStreakDisplay = document.getElementById('hwQuizStreakDisplay');
    const hwStreakNumber = document.getElementById('hwQuizStreakNumber');
    
    if (quizStreakCount >= 2) {
        // 英語→日本語モード
        if (streakDisplay && streakNumber) {
            streakNumber.textContent = quizStreakCount;
            streakDisplay.classList.remove('hidden');
        }
        // 日本語→英語モード
        if (hwStreakDisplay && hwStreakNumber) {
            hwStreakNumber.textContent = quizStreakCount;
            hwStreakDisplay.classList.remove('hidden');
        }
    } else {
        // 非表示にする
        if (streakDisplay) streakDisplay.classList.add('hidden');
        if (hwStreakDisplay) hwStreakDisplay.classList.add('hidden');
    }
}

// 4択クイズUIを更新
function updateQuizModeUI(word) {
    const quizEnglishWord = document.getElementById('quizEnglishWord');
    const quizTapHint = document.getElementById('quizTapHint');
    const quizChoices = document.getElementById('quizChoices');
    const quizActions = document.getElementById('quizActions');
    const quizCheckBtn = document.getElementById('quizCheckBtn');
    
    if (!quizEnglishWord || !quizChoices) return;
    
    // 状態をリセット
    quizChoicesRevealed = false;
    
    // 英単語を表示
    quizEnglishWord.textContent = word.word;
    
    // 連続正解表示を更新
    updateQuizStreakDisplay();
    
    // タップヒントを表示
    if (quizTapHint) {
        quizTapHint.classList.remove('hidden');
    }
    
    // アクションボタンを非表示
    if (quizActions) {
        quizActions.classList.add('hidden');
    }
    
    // チェック状態を更新
    if (quizCheckBtn) {
        if (reviewWords.has(word.id)) {
            quizCheckBtn.classList.add('active');
        } else {
            quizCheckBtn.classList.remove('active');
        }
    }
    
    // PASSボタンを有効に戻す
    const quizPassBtn = document.getElementById('quizPassBtn');
    if (quizPassBtn) {
        quizPassBtn.disabled = false;
    }
    
    // 4択選択肢を非表示
    if (quizChoices) {
        quizChoices.classList.add('hidden');
        quizChoices.classList.remove('fade-in');
    }
    
    // 4択の選択肢を準備
    prepareQuizChoices(word);
}

// 4択の選択肢を準備
function prepareQuizChoices(correctWord) {
    const quizChoices = document.getElementById('quizChoices');
    if (!quizChoices) return;
    
    const choices = [];
    const correctMeaning = correctWord.meaning;
    
    // 正解を追加
    choices.push({
        meaning: correctMeaning,
        isCorrect: true
    });
    
    // 他の単語からダミー選択肢を3つ選ぶ
    const otherWords = currentWords.filter(w => w.id !== correctWord.id && w.meaning !== correctMeaning);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
        choices.push({
            meaning: shuffled[i].meaning,
            isCorrect: false
        });
    }
    
    // 選択肢をシャッフル
    choices.sort(() => Math.random() - 0.5);
    
    // ボタンに設定
    const choiceButtons = quizChoices.querySelectorAll('.quiz-choice-btn');
    choiceButtons.forEach((btn, index) => {
        const textEl = btn.querySelector('.quiz-choice-text');
        if (textEl && choices[index]) {
            // 4択（テスト含む）では《活用》も品詞も表示しない
            setMeaningContent(textEl, choices[index].meaning, { hideConjugation: true, showPosBadges: false });
            btn.dataset.isCorrect = choices[index].isCorrect ? 'true' : 'false';
        }
        // 状態をリセット
        btn.classList.remove('correct', 'wrong', 'disabled');
        btn.disabled = false;
    });
}

// タップで4択を表示
function revealQuizChoices() {
    if (quizChoicesRevealed) return;
    quizChoicesRevealed = true;
    
    const quizTapHint = document.getElementById('quizTapHint');
    const quizChoices = document.getElementById('quizChoices');
    const quizActions = document.getElementById('quizActions');
    
    // タップヒントを非表示
    if (quizTapHint) {
        quizTapHint.classList.add('hidden');
    }
    
    // アクションボタンを表示
    if (quizActions) {
        quizActions.classList.remove('hidden');
    }
    
    // 4択を表示
    if (quizChoices) {
        quizChoices.classList.remove('hidden');
        quizChoices.classList.add('fade-in');
    }
}

// 4択モードでフィードバック表示済みフラグ
let quizFeedbackShown = false;
// 4択モードで回答済みフラグ
let quizAnswered = false;
let quizLastAnswerCorrect = false;

// 選択肢クリック時の処理
function handleQuizChoiceClick(event) {
    const btn = event.currentTarget;
    const quizChoices = document.getElementById('quizChoices');
    const allButtons = quizChoices.querySelectorAll('.quiz-choice-btn');
    const overlay = elements.cardFeedbackOverlay;
    const quizPassBtn = document.getElementById('quizPassBtn');
    
    if (btn.classList.contains('disabled')) return;
    
    const isCorrect = btn.dataset.isCorrect === 'true';
    
    // すべてのボタンを無効化
    allButtons.forEach(b => b.classList.add('disabled'));
    
    // PASSボタンも無効化
    if (quizPassBtn) {
        quizPassBtn.disabled = true;
    }
    
    // オーバーレイを即座に表示（画面全体）
    if (overlay) {
        overlay.classList.remove('correct', 'wrong');
        overlay.classList.add('active', isCorrect ? 'correct' : 'wrong');
    }
    
    // markAnswerでの重複表示を防ぐフラグ
    quizFeedbackShown = true;
    
    // 回答済みフラグを設定
    quizAnswered = true;
    quizLastAnswerCorrect = isCorrect;
    
    // ○/×マークを表示
    showAnswerMark(isCorrect);

    if (isCorrect) {
        btn.classList.add('correct');
        SoundEffects.playCorrect();
        
        // ★エフェクトを表示
        showSparkleEffect();
        
        // 連続正解カウントを増やす
        quizStreakCount++;
    } else {
        btn.classList.add('wrong');
        SoundEffects.playWrong();
        
        // 連続正解カウントをリセット
        quizStreakCount = 0;
        
        // 正解も表示
        allButtons.forEach(b => {
            if (b.dataset.isCorrect === 'true') {
                b.classList.add('correct');
            }
        });
    }
    
    // オーバーレイを消す（600ms後）
    setTimeout(() => {
        if (overlay) overlay.classList.remove('active', 'correct', 'wrong');
    }, 600);
}

// 次の問題へ進む処理（タップで呼ばれる）
function proceedToNextQuizWord() {
    if (!quizAnswered) return;
    
    const overlay = elements.cardFeedbackOverlay;
    
    // オーバーレイを消す
    if (overlay) overlay.classList.remove('active', 'correct', 'wrong');
    
    // 正解/不正解を記録（4択モードではカードアニメーションはスキップされる）
    markAnswer(quizLastAnswerCorrect);
    
    // フラグをリセット
    quizFeedbackShown = false;
    quizAnswered = false;
    
    // currentIndexをインクリメント（markAnswerでスキップされたため）
    currentIndex++;
    
    // 次の問題へ
    goToNextQuizWord();
}

// 次の問題へ（markAnswerでcurrentIndex++済みなのでここでは増やさない）
function goToNextQuizWord() {
    // 最後の問題だった場合は完了画面へ
    if (currentIndex >= currentRangeEnd) {
        showCompletion();
        return;
    }
    
    // フラグをリセット
    quizAnswered = false;
    quizChoicesRevealed = false;
    quizFeedbackShown = false;
    
    // 4択モードの要素を取得
    const quizMode = document.getElementById('quizMode');
    if (!quizMode) {
        displayCurrentWord();
        return;
    }
    
    // フェードアウト
    quizMode.style.transition = 'opacity 0.25s ease-out';
    quizMode.style.opacity = '0';
    
    // フェードアウト完了後に内容を更新してフェードイン
    setTimeout(() => {
        displayCurrentWord();
        
        // フェードイン
        requestAnimationFrame(() => {
            quizMode.style.transition = 'opacity 0.25s ease-in';
            quizMode.style.opacity = '1';
            
            // トランジション完了後にスタイルをクリア
            setTimeout(() => {
                quizMode.style.transition = '';
            }, 250);
        });
    }, 250);
}

// チェック切り替え
function handleQuizCheck() {
    const word = currentWords[currentIndex];
    if (!word) return;
    
    const quizCheckBtn = document.getElementById('quizCheckBtn');
    
    if (reviewWords.has(word.id)) {
        reviewWords.delete(word.id);
        if (quizCheckBtn) quizCheckBtn.classList.remove('active');
    } else {
        reviewWords.add(word.id);
        if (quizCheckBtn) quizCheckBtn.classList.add('active');
    }
    
    saveReviewWords();
}

// PASSボタン（間違い扱い）
function handleQuizPass() {
    const quizChoices = document.getElementById('quizChoices');
    const allButtons = quizChoices ? quizChoices.querySelectorAll('.quiz-choice-btn') : [];
    const overlay = elements.cardFeedbackOverlay;
    const quizPassBtn = document.getElementById('quizPassBtn');
    
    // すべてのボタンを無効化
    allButtons.forEach(b => b.classList.add('disabled'));
    
    // PASSボタンも無効化
    if (quizPassBtn) {
        quizPassBtn.disabled = true;
    }
    
    // 正解を表示
    allButtons.forEach(b => {
        if (b.dataset.isCorrect === 'true') {
            b.classList.add('correct');
        }
    });
    
    // 間違いとしてオーバーレイを表示
    if (overlay) {
        overlay.classList.remove('correct', 'wrong', 'mastered');
        overlay.classList.add('active', 'wrong');
    }
    
    // ×マークを表示
    showAnswerMark(false);
    
    // 連続正解カウントをリセット
    quizStreakCount = 0;
    updateQuizStreakDisplay();
    
    // markAnswerでの重複表示を防ぐフラグ
    quizFeedbackShown = true;
    
    // 回答済みフラグを設定
    quizAnswered = true;
    quizLastAnswerCorrect = false;
    
    SoundEffects.playWrong();
    
    // オーバーレイを消す（600ms後）
    setTimeout(() => {
        if (overlay) overlay.classList.remove('active', 'correct', 'wrong');
    }, 600);
}

// 4択イベントリスナーの初期化
let quizModeListenersInitialized = false;
function initQuizModeListeners() {
    if (quizModeListenersInitialized) return;
    quizModeListenersInitialized = true;
    
    const quizMode = document.getElementById('quizMode');
    const quizChoices = document.getElementById('quizChoices');
    const quizPassBtn = document.getElementById('quizPassBtn');
    const quizCheckBtn = document.getElementById('quizCheckBtn');
    
    // どこをタップしても4択表示 or 次の問題へ
    if (quizMode) {
        quizMode.addEventListener('click', (e) => {
            // 選択肢ボタンやアクションボタンをクリックした場合は除外
            if (e.target.closest('.quiz-choice-btn') || e.target.closest('.quiz-pass-btn') || e.target.closest('.quiz-check-btn')) return;
            
            // 回答済みの場合は次の問題へ
            if (quizAnswered) {
                proceedToNextQuizWord();
                return;
            }
            
            // 未回答の場合は4択を表示
            revealQuizChoices();
        });
    }
    
    // 選択肢ボタン
    if (quizChoices) {
        const choiceButtons = quizChoices.querySelectorAll('.quiz-choice-btn');
        choiceButtons.forEach(btn => {
            btn.addEventListener('click', handleQuizChoiceClick);
        });
    }
    
    // PASSボタン
    if (quizPassBtn) {
        quizPassBtn.addEventListener('click', handleQuizPass);
    }
    
    // チェックボタン
    if (quizCheckBtn) {
        quizCheckBtn.addEventListener('click', handleQuizCheck);
    }
}

// DOMContentLoadedで初期化（既にロード済みの場合も対応）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initQuizModeListeners();
    });
} else {
    initQuizModeListeners();
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
    const categoryKey = (selectedCategory === 'LEVEL0 入門600語' || selectedCategory === '大阪府のすべての英単語' || selectedCategory === '入試直前これだけ1200語') ? word.category : selectedCategory;
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

// 正解/不正解フィードバック — SVGドローアニメーション
function showAnswerMark(isCorrect) {
    // 既存のマークがあれば即削除
    const existing = document.querySelector('.answer-mark-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'answer-mark-container';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'answer-mark-svg');

    if (isCorrect) {
        // ── ○ (正解) ── 円 + チェックマーク
        container.classList.add('answer-mark-correct');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', '60');
        circle.setAttribute('cy', '60');
        circle.setAttribute('r', '50');
        circle.setAttribute('class', 'mark-circle-bg');

        const circleStroke = document.createElementNS(svgNS, 'circle');
        circleStroke.setAttribute('cx', '60');
        circleStroke.setAttribute('cy', '60');
        circleStroke.setAttribute('r', '50');
        circleStroke.setAttribute('class', 'mark-circle-draw');

        const check = document.createElementNS(svgNS, 'path');
        check.setAttribute('d', 'M36 62 L52 78 L84 42');
        check.setAttribute('class', 'mark-check-draw');

        svg.appendChild(circle);
        svg.appendChild(circleStroke);
        svg.appendChild(check);
    } else {
        // ── × (不正解) ── 円 + Xマーク
        container.classList.add('answer-mark-wrong');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', '60');
        circle.setAttribute('cy', '60');
        circle.setAttribute('r', '50');
        circle.setAttribute('class', 'mark-circle-bg');

        const circleStroke = document.createElementNS(svgNS, 'circle');
        circleStroke.setAttribute('cx', '60');
        circleStroke.setAttribute('cy', '60');
        circleStroke.setAttribute('r', '50');
        circleStroke.setAttribute('class', 'mark-circle-draw');

        const line1 = document.createElementNS(svgNS, 'path');
        line1.setAttribute('d', 'M40 40 L80 80');
        line1.setAttribute('class', 'mark-x-draw mark-x-1');

        const line2 = document.createElementNS(svgNS, 'path');
        line2.setAttribute('d', 'M80 40 L40 80');
        line2.setAttribute('class', 'mark-x-draw mark-x-2');

        svg.appendChild(circle);
        svg.appendChild(circleStroke);
        svg.appendChild(line1);
        svg.appendChild(line2);
    }

    container.appendChild(svg);
    document.body.appendChild(container);

    // ブラウザに初期レイアウトを強制させてからアニメーション開始
    // eslint-disable-next-line no-unused-expressions
    container.offsetWidth;
    container.classList.add('answer-mark-animate');

    // フェードアウト → 削除
    setTimeout(() => {
        container.classList.add('answer-mark-exit');
        setTimeout(() => container.remove(), 400);
    }, 750);
}

// キラキラエフェクトを表示
function showSparkleEffect() {
    // コンテナを作成
    const container = document.createElement('div');
    container.className = 'sparkle-container';
    document.body.appendChild(container);
    
    // カラフルな色のバリエーション
    const starColors = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fb923c', '#f87171', '#22d3ee'];
    
    // SVGの★アイコンを生成する関数（丸みのあるかわいい星）
    function createStarSVG(color, size) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.style.filter = 'drop-shadow(0 0 2px rgba(255,255,255,0.8))';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // 丸みのある星のパス
        path.setAttribute('d', 'M12 1.5c.4 0 .8.3 1 .7l2.5 5.3 5.7.9c.5.1.9.4 1 .9.1.4 0 .9-.3 1.2l-4.2 4.2 1 5.8c.1.5-.1.9-.5 1.2-.4.2-.8.2-1.2 0L12 18.8l-5 2.9c-.4.2-.8.2-1.2 0-.4-.2-.6-.7-.5-1.2l1-5.8-4.2-4.2c-.4-.3-.5-.8-.3-1.2.1-.5.5-.8 1-.9l5.7-.9 2.5-5.3c.2-.4.6-.7 1-.7z');
        path.setAttribute('fill', color);
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '1.2');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(path);
        return svg;
    }
    
    // 星型キラキラを複数生成
    const sparkleCount = 15;
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            // ランダムな位置
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            // カラフルな星
            const star = document.createElement('div');
            star.className = 'sparkle-star';
            
            // ランダムな色とサイズ
            const randomColor = starColors[Math.floor(Math.random() * starColors.length)];
            const size = 18 + Math.random() * 24; // 18〜42px
            
            // SVGを追加
            star.appendChild(createStarSVG(randomColor, size));
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = (Math.random() * 0.2) + 's';
            container.appendChild(star);
        }, i * 30);
    }
    
    // コンテナを削除
    setTimeout(() => {
        container.remove();
    }, 1200);
}

// スワイプまたはボタンで正解/不正解をマーク
// 連続正解メッセージを表示
function showConsecutiveCorrectMessage(count) {
    // メッセージとスタイルを決定
    let message = '';
    let colorClass = '';
    
    if (count >= 5) {
        message = 'Perfect!';
        colorClass = 'streak-perfect';
    } else if (count === 4) {
        message = 'Excellent!';
        colorClass = 'streak-excellent';
    } else if (count === 3) {
        message = 'Fantastic!';
        colorClass = 'streak-fantastic';
    } else if (count === 2) {
        message = 'Great!';
        colorClass = 'streak-great';
    } else if (count === 1) {
        message = 'Good!';
        colorClass = 'streak-good';
    } else {
        return; // 0以下は表示しない
    }
    
    // 既存のメッセージを削除
    const existing = document.querySelector('.streak-message');
    if (existing) {
        existing.remove();
    }
    
    // メッセージ要素を作成
    const msgEl = document.createElement('div');
    msgEl.className = `streak-message ${colorClass}`;
    msgEl.innerHTML = `
        <span class="streak-text">${message}</span>
    `;
    
    // body直下に追加（カード切り替えの影響を受けない）
    document.body.appendChild(msgEl);
    
    // アニメーション後に削除
    setTimeout(() => {
        msgEl.classList.add('streak-message-fade');
        setTimeout(() => {
            msgEl.remove();
        }, 400);
    }, 1500);
}

function markAnswer(isCorrect, isTimeout = false) {
    if (currentIndex >= currentRangeEnd) return;
    
    // 学習カレンダーに記録
    recordStudyActivity(1);
    
    // 効果音を再生（正解/不正解）- 4択モードでは既に鳴らしているのでスキップ
    if (!quizFeedbackShown) {
        if (isCorrect) {
            SoundEffects.playCorrect();
        } else {
            SoundEffects.playWrong();
        }
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
        const categoryKey = (selectedCategory === 'LEVEL0 入門600語') ? word.category : selectedCategory;
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
        const categoryKeyWrong = (selectedCategory === 'LEVEL0 入門600語' || selectedCategory === '大阪府のすべての英単語' || selectedCategory === '入試直前これだけ1200語') ? word.category : selectedCategory;
        if (categoryKeyWrong) {
            const { correctSet, wrongSet } = loadCategoryWords(categoryKeyWrong);
            wrongSet.add(word.id);
            // 間違えた場合は正解リストから削除
            correctSet.delete(word.id);
            saveCategoryWords(categoryKeyWrong, correctSet, wrongSet);
            
            // すべてのモードの正解リストから削除（別モードで正解した記録も消す）
            const allModes = ['card', 'input'];
            allModes.forEach(mode => {
                const correctKey = `correctWords-${categoryKeyWrong}_${mode}`;
                const savedCorrect = localStorage.getItem(correctKey);
                if (savedCorrect) {
                    const correctList = JSON.parse(savedCorrect);
                    const filteredList = correctList.filter(id => {
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        return numId !== word.id;
                    });
                    localStorage.setItem(correctKey, JSON.stringify(filteredList));
                }
            });
        }
        
        saveWrongWords();
    }

    applyMarkers(word);
    updateStats();
    updateProgressSegments(); // 進捗バーのセグメントを更新
    updateVocabProgressBar(); // 英単語進捗バーを更新

    // 4択モードで既に表示済みの場合はスキップ
    if (!quizFeedbackShown) {
        // ○/×マークを表示
        showAnswerMark(isCorrect);
        
        // 正解時にキラキラエフェクトを表示
        if (isCorrect) {
            showSparkleEffect();
        }
    }

    // 入力モードの場合はカードアニメーションをスキップ
    if (isInputModeActive) {
        // 入力モードでは自動で進まない（ユーザーが次へボタンを押すまで待つ）
        return;
    }
    
    // 4択モードの場合はカードアニメーションをスキップ（別途処理される）
    if (quizFeedbackShown) {
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
    // 最後の問題を解いた後、進捗バーを100%にする
    const progressBarFill = document.getElementById('progressBarFill');
    if (progressBarFill) {
        progressBarFill.style.width = '100%';
    }
    
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
    
    // オーバーレイを非表示にしてリセット
    completionOverlay.classList.remove('show');
    completionOverlay.classList.add('hidden');
    completionOverlay.offsetHeight;
    
    // カテゴリー名を設定（#1# などの接頭辞は除き、単語番号のみ表示）
    const completionCourseTitle = document.getElementById('completionCourseTitle');
    if (completionCourseTitle) {
        let title = currentFilterCourseTitle || selectedCategory || '';
        const noPrefix = title.match(/^#\d+#(.+)$/);
        completionCourseTitle.textContent = noPrefix ? noPrefix[1] : title;
    }
    
    // 統計を設定
    const completionCorrectCount = document.getElementById('completionCorrectCount');
    const completionWrongCount = document.getElementById('completionWrongCount');
    if (completionCorrectCount) completionCorrectCount.textContent = correctCount;
    if (completionWrongCount) completionWrongCount.textContent = wrongCount;
    
    // 今回の学習範囲の総数
    const total = currentWords.length;
    
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
            completionReviewBtn.innerHTML = `<svg class="completion-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> 間違えた問題を復習（${wrongCount}問）`;
        } else {
            completionReviewBtn.classList.add('hidden');
        }
    }
    
    // 結果一覧を生成
    const completionResultList = document.getElementById('completionResultList');
    const completionResultListContainer = document.getElementById('completionResultListContainer');
    if (completionResultList && completionResultListContainer) {
        completionResultList.innerHTML = '';
        if (currentWords.length > 0 && questionStatus.length > 0) {
            completionResultListContainer.style.display = '';
            currentWords.forEach((wordObj, idx) => {
                const status = questionStatus[idx];
                if (!status) return; // 未回答はスキップ
                const isCorrect = status === 'correct';
                const item = document.createElement('div');
                item.className = 'completion-result-item';

                // 意味テキスト（品詞・活用情報を除く簡略表示）
                let meaningText = (wordObj.meaning || '').replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '').trim();
                // 長すぎる場合はカット
                if (meaningText.length > 30) meaningText = meaningText.slice(0, 30) + '…';

                item.innerHTML = `
                    <span class="completion-result-num">${idx + 1}</span>
                    <span class="completion-result-icon ${isCorrect ? 'completion-result-icon-correct' : 'completion-result-icon-wrong'}">
                        ${isCorrect
                            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
                        }
                    </span>
                    <div class="completion-result-word-info">
                        <div class="completion-result-word">${wordObj.word || ''}</div>
                        <div class="completion-result-meaning">${meaningText}</div>
                    </div>
                `;
                completionResultList.appendChild(item);
            });
        } else {
            completionResultListContainer.style.display = 'none';
        }
        // スクロール位置をリセット
        completionResultList.scrollTop = 0;
    }
    
    // オーバーレイを表示
    completionOverlay.classList.remove('hidden');
    completionOverlay.scrollTop = 0;
    
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
                const animationTime = 1000;
                setTimeout(() => {
                    completionProgressBar.classList.remove('completion-progress-complete', 'completion-progress-complete-card', 'completion-progress-complete-input');
                    void completionProgressBar.offsetHeight;
                    requestAnimationFrame(() => {
                        if (selectedQuizDirection === 'jpn-to-eng') {
                            completionProgressBar.classList.add('completion-progress-complete-input');
                        } else {
                            completionProgressBar.classList.add('completion-progress-complete-card');
                        }
                    });
                }, animationTime + 100);
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

// 目標達成の演出（無効化）
function showGoalAchievedCelebration(school) {
    // 機能削除済み
}

// 目標達成演出を閉じる（無効化）
function hideGoalAchievedCelebration() {
    // 機能削除済み
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
    if (category === 'LEVEL0 入門600語') {
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
    } else if (category === 'LEVEL1 初級500語' || category === 'LEVEL2 中級500語' || category === 'LEVEL3 上級500語' || 
               category === 'LEVEL4 ハイレベル300語' || category === 'LEVEL5 難関突破100語') {
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
        showAlert('通知', 'できなかった単語はありません');
        return;
    }
    
    // 完了画面を先に閉じる
    hideCompletion();
    
    // 現在表示されている学習画面を非表示にする
    const handwritingQuizView = document.getElementById('handwritingQuizView');
    const inputMode = document.getElementById('inputMode');
    const cardTopSection = document.querySelector('.card-top-section');
    const wordCard = document.getElementById('wordCard');
    const wordCardContainer = document.getElementById('wordCardContainer');
    if (handwritingQuizView) handwritingQuizView.classList.add('hidden');
    if (inputMode) inputMode.classList.add('hidden');
    if (cardTopSection) cardTopSection.classList.add('hidden');
    if (wordCard) wordCard.classList.add('hidden');
    if (wordCardContainer) wordCardContainer.classList.add('hidden');
    
    // テストモードのクラスをリセット
    document.body.classList.remove('quiz-test-mode');
    updateThemeColorForTest(false);
    
    // テストモード用の進捗表示を非表示
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress) testModeProgress.classList.add('hidden');
    const hwTestModeProgress = document.getElementById('hwTestModeProgress');
    if (hwTestModeProgress) hwTestModeProgress.classList.add('hidden');
    
    // 復習画面を表示（通常の展開モードと同じ処理）
    showInputModeDirectly(selectedCategory, wrongWordsInSession, currentFilterCourseTitle || selectedCategory);
}

// 進捗バーを初期化
function createProgressSegments(total) {
    updateProgressBar(total);
}

// 進捗バーを更新
function updateProgressSegments() {
    const total = currentRangeEnd - currentRangeStart;
    updateProgressBar(total);
}

// 進捗バーの幅を更新する共通関数
function updateProgressBar(total) {
    // 現在のインデックスを取得
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
    
    // 進捗を計算（解答済み問題数 / 全体）
    // 最後の問題を解いた時にMAXになるように、currentQuestionIndex（0始まり）をそのまま使用
    const progress = total > 0 ? (currentQuestionIndex / total) * 100 : 0;
    
    // 進捗バーを更新
    const progressBarFill = document.getElementById('progressBarFill');
    if (progressBarFill) {
        progressBarFill.style.width = `${progress}%`;
    }
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

// 進捗バーの表示範囲テキストを更新（単語番号＝IDで表示）
function updateProgressRangeText(total) {
    const rangeText = document.getElementById('progressRangeText');
    if (!rangeText) return;
    
    const pad4 = (n) => String(n).padStart(4, '0');
    if (currentWords && currentWords.length > 0) {
        const endIdx = Math.min(progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT, total);
        const startId = currentWords[progressBarStartIndex].id;
        const endId = currentWords[endIdx - 1].id;
        rangeText.textContent = `単語番号${pad4(startId)}-${pad4(endId)}`;
    } else {
        const displayStart = progressBarStartIndex + 1;
        const displayEnd = Math.min(progressBarStartIndex + PROGRESS_BAR_DISPLAY_COUNT, total);
        rangeText.textContent = `単語番号${pad4(displayStart)}-${pad4(displayEnd)}`;
    }
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
            const categories = ['LEVEL0 入門600語', 'LEVEL1 初級500語', 'LEVEL2 中級500語', 'LEVEL3 上級500語', 'LEVEL4 ハイレベル300語', 'LEVEL5 難関突破100語'];
            categories.forEach(category => {
                localStorage.removeItem(`correctWords-${category}`);
                localStorage.removeItem(`wrongWords-${category}`);
            });
            
            // すべてのlocalStorageキーを確認して、カテゴリー関連のものを削除
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('correctWords-') || key.startsWith('wrongWords-') || key.startsWith('ivCorrect-') || key.startsWith('ivWrong-'))) {
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

// 厳選例文暗記モードで学習を初期化
function initSentenceModeLearning(category) {
    // 学習セッション開始
    startStudySession();
    
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
        setUnitNameContent(elements.unitName, displayTitle);
    }
    
    // テーマカラーを先に更新（クラス追加の前に）
    updateThemeColor(true);
    document.body.classList.add('learning-mode');
    
    // ヘッダーをテストモードに更新（白背景、真ん中に進捗、右上に×ボタン）
    updateHeaderButtons('learning', '', true);
    
    // テストモード用のUIを有効化（白背景ヘッダー、中央に進捗表示）
    document.body.classList.add('quiz-test-mode');
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress) {
        testModeProgress.classList.remove('hidden');
        testModeProgress.textContent = `1/${sentenceData.length}`;
    }
    
    // ×ボタン表示、その他非表示
    const unitTestBtn = document.getElementById('unitTestBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    const inputBackBtn = document.getElementById('inputBackBtn');
    if (unitTestBtn) unitTestBtn.classList.add('hidden');
    if (unitPauseBtn) unitPauseBtn.classList.remove('hidden');
    if (inputBackBtn) inputBackBtn.classList.add('hidden');

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
        rangeEl.textContent = `単語番号${String(firstId).padStart(4, '0')}-${String(lastId).padStart(4, '0')}`;
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
    
    // ナビゲーションボタンを表示
    const blankNav = document.getElementById('blankNavigation');
    if (blankNav) {
        blankNav.classList.remove('hidden');
    }
    
    // 進捗バーを更新
    updateSentenceProgressBar();
    
    // テストモード用の進捗表示を更新
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress && document.body.classList.contains('quiz-test-mode')) {
        testModeProgress.textContent = `${currentSentenceIndex + 1}/${sentenceData.length}`;
    }
    
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
        
        // 使用済みの空欄インデックスを追跡
        const usedBlankIndices = new Set();
        
        words.forEach((word, idx) => {
            // 句読点を除去した単語で比較
            const wordWithoutPunct = word.replace(/[.,!?]/g, '');
            // 空所かどうかを判定（blanks配列に含まれていて、まだ使用されていないもの）
            const blankInfo = sentence.blanks.find(b => 
                b.word.toLowerCase() === wordWithoutPunct.toLowerCase() && 
                !usedBlankIndices.has(b.index)
            );
            
            if (blankInfo) {
                // この空欄を使用済みとしてマーク
                usedBlankIndices.add(blankInfo.index);
                
                // 空所を作成
                const blankSpan = document.createElement('span');
                blankSpan.className = 'sentence-blank';
                blankSpan.dataset.blankIndex = blankInfo.index;
                blankSpan.textContent = ''; // 初期状態は空
                blankSpan.dataset.correctWord = blankInfo.word;
                
                // 初期幅を統一（すべて同じ幅）
                const isMobile = window.innerWidth <= 600;
                const initialWidth = isMobile ? 50 : 60; // 初期幅を固定
                blankSpan.style.width = `${initialWidth}px`;
                
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
        
        // 空所にタップイベントを追加
        sentenceBlanks.forEach(blank => {
            // タップ/クリックイベントを追加
            const handleBlankTap = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (sentenceAnswerSubmitted) return;
                selectSentenceBlank(blank.index);
            };
            
            blank.element.addEventListener('touchstart', handleBlankTap, { passive: false });
            blank.element.addEventListener('click', handleBlankTap);
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
        
        if (letter === ' ') {
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                addPressedState();
                insertSentenceLetter(' ');
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                removePressedState();
                setTimeout(() => { touchHandled = false; }, 100);
            });
            
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                insertSentenceLetter(' ');
            });
        } else {
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                addPressedState();
                insertSentenceLetter(letter);
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                removePressedState();
                setTimeout(() => { touchHandled = false; }, 100);
            });
            
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                insertSentenceLetter(letter);
            });
        }
    });
    
    // Shiftキー
    const shiftKey = document.getElementById('sentenceKeyboardShift');
    if (shiftKey) {
        let shiftTouchHandled = false;
        
        shiftKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            shiftTouchHandled = true;
            toggleSentenceShift();
        }, { passive: false });
        
        shiftKey.addEventListener('touchend', () => {
            setTimeout(() => { shiftTouchHandled = false; }, 100);
        });
        
        shiftKey.addEventListener('click', (e) => {
            if (shiftTouchHandled) return;
            e.preventDefault();
            toggleSentenceShift();
        });
    }
    
    // バックスペースキー（長押し対応）
    const backspaceKey = document.getElementById('sentenceKeyboardBackspace');
    if (backspaceKey) {
        let backspaceInterval = null;
        let backspaceTimeout = null;
        
        const startBackspaceRepeat = () => {
            removeSentenceLetter();
            backspaceTimeout = setTimeout(() => {
                backspaceInterval = setInterval(() => {
                    removeSentenceLetter();
                }, 80);
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
    
    // 空欄ナビゲーションボタン
    setupBlankNavButtons();
}

// 空欄ナビゲーションボタンの設定
function setupBlankNavButtons() {
    const prevBtn = document.getElementById('prevBlankBtn');
    const nextBtn = document.getElementById('nextBlankBtn');
    
    if (prevBtn) {
        // 既存のイベントリスナーをクローンして削除
        const prevBtnClone = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(prevBtnClone, prevBtn);
        const newPrevBtn = document.getElementById('prevBlankBtn');
        
        const handlePrev = (e) => {
            e.preventDefault();
            e.stopPropagation();
            moveToPreviousBlank();
        };
        newPrevBtn.addEventListener('touchstart', handlePrev, { passive: false });
        newPrevBtn.addEventListener('click', handlePrev);
    }
    
    if (nextBtn) {
        // 既存のイベントリスナーをクローンして削除
        const nextBtnClone = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(nextBtnClone, nextBtn);
        const newNextBtn = document.getElementById('nextBlankBtn');
        
        const handleNext = (e) => {
            e.preventDefault();
            e.stopPropagation();
            moveToNextBlank();
        };
        newNextBtn.addEventListener('touchstart', handleNext, { passive: false });
        newNextBtn.addEventListener('click', handleNext);
    }
    
    // 初期状態を更新
    updateBlankNavButtons();
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
    
    // ナビゲーションボタンの状態を更新
    updateBlankNavButtons();
}

// 次の空欄へ移動
function moveToNextBlank() {
    if (sentenceAnswerSubmitted || !isSentenceModeActive || sentenceBlanks.length === 0) return;
    
    // 現在選択中の空欄のインデックスを取得
    const currentIndex = sentenceBlanks.findIndex(b => b.index === currentSelectedBlankIndex);
    
    // 次の空欄へ移動
    if (currentIndex < sentenceBlanks.length - 1) {
        selectSentenceBlank(sentenceBlanks[currentIndex + 1].index);
    }
}

// 前の空欄へ移動
function moveToPreviousBlank() {
    if (sentenceAnswerSubmitted || !isSentenceModeActive || sentenceBlanks.length === 0) return;
    
    // 現在選択中の空欄のインデックスを取得
    const currentIndex = sentenceBlanks.findIndex(b => b.index === currentSelectedBlankIndex);
    
    // 前の空欄へ移動
    if (currentIndex > 0) {
        selectSentenceBlank(sentenceBlanks[currentIndex - 1].index);
    }
}

// ナビゲーションボタンの状態を更新
function updateBlankNavButtons() {
    const prevBtn = document.getElementById('prevBlankBtn');
    const nextBtn = document.getElementById('nextBlankBtn');
    
    if (!prevBtn || !nextBtn || sentenceBlanks.length === 0) return;
    
    const currentIndex = sentenceBlanks.findIndex(b => b.index === currentSelectedBlankIndex);
    
    // 前の空欄ボタン
    if (currentIndex <= 0) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
    
    // 次の空欄ボタン
    if (currentIndex >= sentenceBlanks.length - 1) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
    
    // 回答送信後は両方無効化
    if (sentenceAnswerSubmitted) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
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
        
        // 空所の表示を更新
        currentBlank.element.textContent = currentBlank.userInput;
        
        // 入力文字数に応じて幅を更新
        updateBlankWidth(currentBlank.element, currentBlank.userInput.length);
        
        // 入力が完了しても自動的に次の空所には移動しない（ユーザーが手動で選択する必要がある）
    }
}

// 空欄の幅を入力文字数に応じて更新
function updateBlankWidth(element, charCount) {
    const isMobile = window.innerWidth <= 600;
    const charWidth = isMobile ? 11 : 13; // 1文字あたりの幅
    const padding = 16; // 左右のパディング
    const minWidth = isMobile ? 50 : 60; // 最小幅
    
    const calculatedWidth = Math.max(minWidth, (charCount * charWidth) + padding);
    element.style.width = `${calculatedWidth}px`;
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
        currentBlank.element.textContent = currentBlank.userInput;
        
        // 入力文字数に応じて幅を更新
        updateBlankWidth(currentBlank.element, currentBlank.userInput.length);
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
    // 厳選例文暗記モード用の進捗バーを更新
    updateSentenceProgressBar();
    
    // ナビゲーションボタンを非表示
    const blankNav = document.getElementById('blankNavigation');
    if (blankNav) {
        blankNav.classList.add('hidden');
    }
    
    // ×マークを表示（パスは不正解扱い）
    showAnswerMark(false);
    
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
    // 厳選例文暗記モード用の進捗バーを更新
    updateSentenceProgressBar();
    
    // ナビゲーションボタンを非表示
    const blankNav = document.getElementById('blankNavigation');
    if (blankNav) {
        blankNav.classList.add('hidden');
    }
    
    // ○/×マークを表示
    showAnswerMark(isCorrect);
    
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
    
    // 学習セッション開始
    startStudySession();
    
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
        rangeEl.textContent = `単語番号${String(firstId).padStart(4, '0')}-${String(lastId).padStart(4, '0')}`;
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
    
    // ○/×マークを表示
    showAnswerMark(isCorrect);
    
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
    
    // 学習セッション開始
    startStudySession();
    
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
    
    // テストモード用のUIを有効化（白背景ヘッダー、中央に進捗表示）
    document.body.classList.add('quiz-test-mode');
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress) {
        testModeProgress.classList.remove('hidden');
        testModeProgress.textContent = `1/${choiceQuestionData.length}`;
    }
    
    // 四択問題モードではテストボタンを非表示、×ボタンのみ表示
    const unitTestBtn = document.getElementById('unitTestBtn');
    const unitPauseBtn = document.getElementById('unitPauseBtn');
    const inputBackBtn = document.getElementById('inputBackBtn');
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
        rangeEl.textContent = `単語番号${String(firstId).padStart(4, '0')}-${String(lastId).padStart(4, '0')}`;
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
    
    // テストモード用の進捗表示を更新
    const testModeProgress = document.getElementById('testModeProgress');
    if (testModeProgress && document.body.classList.contains('quiz-test-mode')) {
        testModeProgress.textContent = `${currentChoiceQuestionIndex + 1}/${choiceQuestionData.length}`;
    }
    
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
    
    // ○/×マークを表示
    showAnswerMark(isCorrect);
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
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
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
    
    
    // グローバルヘッダーにタイトルと戻るボタンを表示
    updateHeaderButtons('course', '中学３年間の英文法【総復習】');
    
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
    
    
    // グローバルヘッダーにタイトルと戻るボタンを表示
    const chapterTitle = (chapterData && chapterData.title) ? chapterData.title : `第${chapterNumber}章`;
    updateHeaderButtons('course', chapterTitle);
    
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

        // --- 並び替え問題（ドラッグ&ドロップ＋タッチ対応、整序英作文準拠） ---
        if (exercise.type === 'reorder') {
            const reorderItem = document.createElement('div');
            reorderItem.className = 'grammar-reorder-item';
            reorderItem.dataset.exerciseIndex = globalExerciseIndex;

            // 問題番号
            const exerciseNumber = document.createElement('div');
            exerciseNumber.className = 'grammar-exercise-item-number';
            exerciseNumber.textContent = `問題 ${exerciseIndex + 1}（並び替え）`;
            reorderItem.appendChild(exerciseNumber);

            // 日本語訳
            const japaneseEl = document.createElement('div');
            japaneseEl.className = 'grammar-reorder-japanese';
            japaneseEl.textContent = exercise.japanese;
            reorderItem.appendChild(japaneseEl);

            // 正解の単語列
            const answerStr = exercise.answer;
            const lastChar = answerStr.slice(-1);
            const hasPunct = (lastChar === '.' || lastChar === '?');
            const correctWords = answerStr.replace(/[.?]$/, '').trim().split(/\s+/);
            const blankCount = correctWords.length;

            // 空欄エリア
            const blanksArea = document.createElement('div');
            blanksArea.className = 'grammar-reorder-blanks';
            const blankEls = [];
            for (let i = 0; i < blankCount; i++) {
                const blankBox = document.createElement('div');
                blankBox.className = 'grammar-reorder-blank';
                blankBox.dataset.blankIndex = i;
                blankEls.push(blankBox);
                blanksArea.appendChild(blankBox);
            }
            if (hasPunct) {
                const punctEl = document.createElement('span');
                punctEl.className = 'grammar-reorder-punctuation';
                punctEl.textContent = lastChar;
                blanksArea.appendChild(punctEl);
            }
            reorderItem.appendChild(blanksArea);

            // 選択肢エリア
            const choicesArea = document.createElement('div');
            choicesArea.className = 'grammar-reorder-choices';
            const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
            let answered = false;

            // タッチドラッグ用ローカルデータ
            const touchData = {
                isDragging: false, sourceElement: null, dragClone: null,
                word: null, fromBlankIndex: null,
                cloneWidth: 0, cloneHeight: 0, rafId: null
            };

            // --- 空欄のサイズ調整 ---
            function adjustGrammarBlankSize(blankBox, answerEl) {
                if (answerEl) {
                    const textLen = answerEl.textContent.length;
                    const w = Math.max(54, textLen * 10 + 20);
                    blankBox.style.minWidth = w + 'px';
                } else {
                    blankBox.style.minWidth = '';
                }
            }

            // --- 空欄に単語を配置 ---
            function placeWordInBlank(blankBox, word, fromBlankIdx) {
                if (answered) return;
                const targetIdx = blankBox.dataset.blankIndex;
                // 同じ空欄に同じ語なら何もしない
                if (fromBlankIdx !== null && fromBlankIdx === targetIdx) return;

                // 既存の単語があれば戻す
                const existing = blankBox.querySelector('.grammar-reorder-answer');
                if (existing) {
                    returnWordToChoices(existing.dataset.word);
                    existing.remove();
                    adjustGrammarBlankSize(blankBox);
                }

                // 他の空欄から移動の場合
                if (fromBlankIdx !== null) {
                    const fromBlank = blanksArea.querySelector(`.grammar-reorder-blank[data-blank-index="${fromBlankIdx}"]`);
                    if (fromBlank) {
                        const mov = fromBlank.querySelector('.grammar-reorder-answer');
                        if (mov && mov.dataset.word === word) {
                            mov.remove();
                            adjustGrammarBlankSize(fromBlank);
                        }
                    }
                } else {
                    // 選択肢から → 選択肢を非表示
                    choicesArea.querySelectorAll('.grammar-reorder-word').forEach(w => {
                        if (w.dataset.word === word && !w.classList.contains('used')) {
                            w.classList.add('used');
                        }
                    });
                }

                // 回答ボックス作成
                const answerBox = document.createElement('div');
                answerBox.className = 'grammar-reorder-answer';
                answerBox.textContent = word;
                answerBox.dataset.word = word;
                answerBox.dataset.blankIndex = targetIdx;
                answerBox.draggable = true;

                // ドラッグイベント
                answerBox.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', word);
                    e.dataTransfer.setData('from-blank', targetIdx);
                    answerBox.classList.add('dragging');
                    answerBox.dataset.isDragging = 'true';
                });
                answerBox.addEventListener('dragend', () => {
                    answerBox.classList.remove('dragging');
                    delete answerBox.dataset.isDragging;
                });

                // タッチイベント
                answerBox.addEventListener('touchstart', (e) => handleGrammarTouchStart(e, touchData), { passive: false });
                answerBox.addEventListener('touchmove', (e) => handleGrammarTouchMove(e, touchData, blanksArea, choicesArea), { passive: false });
                answerBox.addEventListener('touchend', (e) => handleGrammarTouchEnd(e, touchData, blanksArea, choicesArea, placeWordInBlank, returnWordToChoices, submitAnswer), { passive: false });

                // クリックで戻す
                answerBox.addEventListener('click', (e) => {
                    if (answerBox.dataset.isDragging === 'true' || touchData.isDragging || answered) return;
                    e.stopPropagation();
                    returnWordToChoices(word);
                    answerBox.remove();
                    adjustGrammarBlankSize(blankBox);
                });

                blankBox.appendChild(answerBox);
                adjustGrammarBlankSize(blankBox, answerBox);
            }

            // --- 単語を選択肢に戻す ---
            function returnWordToChoices(word) {
                choicesArea.querySelectorAll('.grammar-reorder-word').forEach(w => {
                    if (w.dataset.word === word && w.classList.contains('used')) {
                        w.classList.remove('used');
                    }
                });
            }

            // --- 解答判定（解答するボタンで実行） ---
            function submitAnswer() {
                const allFilled = blankEls.every(b => b.querySelector('.grammar-reorder-answer'));
                if (!allFilled) return;
                answered = true;
                reorderItem.classList.add('answered');
                submitBtn.classList.add('hidden');
                let allCorrect = true;
                blankEls.forEach((b, i) => {
                    const ans = b.querySelector('.grammar-reorder-answer');
                    if (ans && ans.dataset.word === correctWords[i]) {
                        b.classList.add('correct-blank');
                    } else {
                        b.classList.add('wrong-blank');
                        allCorrect = false;
                    }
                });
                if (allCorrect) {
                    resultEl.textContent = '正解！';
                    resultEl.className = 'grammar-reorder-result correct';
                } else {
                    resultEl.textContent = '不正解';
                    resultEl.className = 'grammar-reorder-result incorrect';
                    correctAnswerEl.textContent = '正解: ' + exercise.answer;
                }
                redoBtn.classList.remove('hidden');
            }

            // --- 空欄のD&Dイベント ---
            blankEls.forEach(blankBox => {
                blankBox.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; blankBox.classList.add('drag-over'); });
                blankBox.addEventListener('dragleave', () => blankBox.classList.remove('drag-over'));
                blankBox.addEventListener('drop', (e) => {
                    e.preventDefault();
                    blankBox.classList.remove('drag-over');
                    const w = e.dataTransfer.getData('text/plain');
                    const fromIdx = e.dataTransfer.getData('from-blank') || null;
                    if (w) placeWordInBlank(blankBox, w, fromIdx);
                });
            });

            // --- 選択肢エリアへのドロップ（空欄から戻す）---
            choicesArea.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            choicesArea.addEventListener('drop', (e) => {
                e.preventDefault();
                const w = e.dataTransfer.getData('text/plain');
                const fromIdx = e.dataTransfer.getData('from-blank');
                if (!w || !fromIdx) return;
                const fromBlank = blanksArea.querySelector(`.grammar-reorder-blank[data-blank-index="${fromIdx}"]`);
                if (fromBlank) {
                    const ans = fromBlank.querySelector('.grammar-reorder-answer');
                    if (ans && ans.dataset.word === w) { ans.remove(); adjustGrammarBlankSize(fromBlank); }
                }
                returnWordToChoices(w);
            });

            // --- 選択肢ボタン生成 ---
            shuffled.forEach(word => {
                const wordBtn = document.createElement('span');
                wordBtn.className = 'grammar-reorder-word';
                wordBtn.textContent = word;
                wordBtn.dataset.word = word;
                wordBtn.draggable = true;

                // クリックで空欄に入れる
                wordBtn.addEventListener('click', () => {
                    if (answered || wordBtn.classList.contains('used') || touchData.isDragging) return;
                    const emptyBlank = blankEls.find(b => !b.querySelector('.grammar-reorder-answer'));
                    if (emptyBlank) placeWordInBlank(emptyBlank, word, null);
                });

                // ドラッグイベント
                wordBtn.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', word);
                    wordBtn.classList.add('dragging');
                });
                wordBtn.addEventListener('dragend', () => wordBtn.classList.remove('dragging'));

                // タッチイベント
                wordBtn.addEventListener('touchstart', (e) => handleGrammarTouchStart(e, touchData), { passive: false });
                wordBtn.addEventListener('touchmove', (e) => handleGrammarTouchMove(e, touchData, blanksArea, choicesArea), { passive: false });
                wordBtn.addEventListener('touchend', (e) => handleGrammarTouchEnd(e, touchData, blanksArea, choicesArea, placeWordInBlank, returnWordToChoices, submitAnswer), { passive: false });

                choicesArea.appendChild(wordBtn);
            });
            reorderItem.appendChild(choicesArea);

            // 解答するボタン
            const submitBtn = document.createElement('button');
            submitBtn.className = 'grammar-reorder-submit-btn';
            submitBtn.textContent = '解答する';
            submitBtn.addEventListener('click', submitAnswer);
            reorderItem.appendChild(submitBtn);

            // 結果表示
            const resultEl = document.createElement('div');
            resultEl.className = 'grammar-reorder-result';
            reorderItem.appendChild(resultEl);
            const correctAnswerEl = document.createElement('div');
            correctAnswerEl.className = 'grammar-reorder-correct-answer';
            reorderItem.appendChild(correctAnswerEl);

            // 解きなおす
            const redoBtn = document.createElement('button');
            redoBtn.className = 'grammar-exercise-redo-btn grammar-reorder-redo-btn hidden';
            redoBtn.textContent = '解きなおす';
            redoBtn.addEventListener('click', () => {
                answered = false;
                reorderItem.classList.remove('answered');
                resultEl.textContent = ''; resultEl.className = 'grammar-reorder-result';
                correctAnswerEl.textContent = '';
                redoBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                blankEls.forEach(b => {
                    b.innerHTML = '';
                    b.classList.remove('correct-blank', 'wrong-blank');
                    b.style.minWidth = '';
                });
                choicesArea.querySelectorAll('.grammar-reorder-word').forEach(btn => btn.classList.remove('used'));
                const newShuffled = [...exercise.words].sort(() => Math.random() - 0.5);
                const wordBtns = choicesArea.querySelectorAll('.grammar-reorder-word');
                newShuffled.forEach((w, i) => { if (wordBtns[i]) { wordBtns[i].textContent = w; wordBtns[i].dataset.word = w; }});
            });
            reorderItem.appendChild(redoBtn);

            exerciseContentEl.appendChild(reorderItem);
            return;
        }

        // --- 通常の穴埋め問題 ---
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

// --- 文法並び替え問題のタッチハンドラ ---
function handleGrammarTouchStart(e, td) {
    if (td.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el = e.currentTarget;
    td.sourceElement = el;
    td.word = el.dataset.word || el.textContent;
    td.fromBlankIndex = el.dataset.blankIndex || null;
    td.isDragging = true;
    const rect = el.getBoundingClientRect();
    td.cloneWidth = rect.width;
    td.cloneHeight = rect.height;
    const clone = el.cloneNode(true);
    clone.className = el.className + ' touch-dragging';
    clone.style.position = 'fixed';
    clone.style.zIndex = '10000';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.9';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    clone.style.left = '0'; clone.style.top = '0';
    clone.style.transform = 'translate(' + (touch.clientX - rect.width/2) + 'px,' + (touch.clientY - rect.height/2) + 'px)';
    clone.style.willChange = 'transform';
    document.body.appendChild(clone);
    td.dragClone = clone;
    el.style.opacity = '0.3';
}

function handleGrammarTouchMove(e, td, blanksArea, choicesArea) {
    if (!td.isDragging || !td.dragClone) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (td.rafId !== null) cancelAnimationFrame(td.rafId);
    td.rafId = requestAnimationFrame(() => {
        const x = touch.clientX - td.cloneWidth/2;
        const y = touch.clientY - td.cloneHeight/2;
        td.dragClone.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        const origDisplay = td.dragClone.style.display;
        td.dragClone.style.display = 'none';
        const below = document.elementFromPoint(touch.clientX, touch.clientY);
        td.dragClone.style.display = origDisplay;
        blanksArea.querySelectorAll('.grammar-reorder-blank').forEach(b => b.classList.remove('drag-over'));
        if (below) {
            const blankBox = below.closest('.grammar-reorder-blank');
            if (blankBox && blanksArea.contains(blankBox)) blankBox.classList.add('drag-over');
        }
        td.rafId = null;
    });
}

function handleGrammarTouchEnd(e, td, blanksArea, choicesArea, placeWordInBlank, returnWordToChoices, checkAllFilled) {
    if (!td.isDragging) return;
    e.preventDefault();
    if (td.rafId !== null) { cancelAnimationFrame(td.rafId); td.rafId = null; }
    const touch = e.changedTouches[0];
    if (td.dragClone) {
        const origDisplay = td.dragClone.style.display;
        td.dragClone.style.display = 'none';
        const below = document.elementFromPoint(touch.clientX, touch.clientY);
        td.dragClone.style.display = origDisplay;
        blanksArea.querySelectorAll('.grammar-reorder-blank').forEach(b => b.classList.remove('drag-over'));
        if (below) {
            const blankBox = below.closest('.grammar-reorder-blank');
            if (blankBox && blanksArea.contains(blankBox)) {
                placeWordInBlank(blankBox, td.word, td.fromBlankIndex);
            } else if (below.closest('.grammar-reorder-choices') && td.fromBlankIndex !== null) {
                // 選択肢エリアにドロップ → 空欄から戻す
                const fromBlank = blanksArea.querySelector(`.grammar-reorder-blank[data-blank-index="${td.fromBlankIndex}"]`);
                if (fromBlank) {
                    const ans = fromBlank.querySelector('.grammar-reorder-answer');
                    if (ans && ans.dataset.word === td.word) { ans.remove(); fromBlank.style.minWidth = ''; }
                }
                returnWordToChoices(td.word);
            }
        }
    }
    if (td.dragClone) { td.dragClone.remove(); td.dragClone = null; }
    if (td.sourceElement) { td.sourceElement.style.opacity = ''; td.sourceElement = null; }
    td.isDragging = false; td.word = null; td.fromBlankIndex = null;
    td.cloneWidth = 0; td.cloneHeight = 0; td.rafId = null;
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
        let touchHandled = false;
        
        if (letter === ' ') {
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                insertGrammarExerciseLetter(' ');
            }, { passive: false });
            key.addEventListener('touchend', () => {
                setTimeout(() => { touchHandled = false; }, 100);
            });
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                insertGrammarExerciseLetter(' ');
            });
        } else if (key.dataset.shiftKey) {
            // アポストロフィ/アンダーバーキー
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = currentShift ? key.dataset.shiftKey : letter;
                insertGrammarExerciseLetter(charToInsert);
            }, { passive: false });
            key.addEventListener('touchend', () => {
                setTimeout(() => { touchHandled = false; }, 100);
            });
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = currentShift ? key.dataset.shiftKey : letter;
                insertGrammarExerciseLetter(charToInsert);
            });
        } else {
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = (currentShift && letter.match(/[a-z]/)) ? letter.toUpperCase() : letter;
                insertGrammarExerciseLetter(charToInsert);
                if (currentShift && letter.match(/[a-z]/) && charToInsert === letter.toUpperCase()) {
                    window.pendingShiftReset = 'grammarExerciseKeyboard';
                    window.grammarExerciseResetShiftState = resetShiftState;
                }
            }, { passive: false });
            key.addEventListener('touchend', () => {
                setTimeout(() => { touchHandled = false; }, 100);
            });
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                const currentShift = shiftKey && shiftKey.dataset.shift === 'true';
                const charToInsert = (currentShift && letter.match(/[a-z]/)) ? letter.toUpperCase() : letter;
                insertGrammarExerciseLetter(charToInsert);
                if (currentShift && letter.match(/[a-z]/) && charToInsert === letter.toUpperCase()) {
                    window.pendingShiftReset = 'grammarExerciseKeyboard';
                    window.grammarExerciseResetShiftState = resetShiftState;
                }
            });
        }
    });
    
    // バックスペースキー
    const backspaceKey = document.getElementById('grammarExerciseKeyboardBackspace');
    if (backspaceKey) {
        let bsTouchHandled = false;
        backspaceKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            bsTouchHandled = true;
            handleGrammarExerciseBackspace();
        }, { passive: false });
        backspaceKey.addEventListener('touchend', () => {
            setTimeout(() => { bsTouchHandled = false; }, 100);
        });
        backspaceKey.addEventListener('click', (e) => {
            if (bsTouchHandled) return;
            e.preventDefault();
            handleGrammarExerciseBackspace();
        });
    }
    
    // 採点キー（キーボード内）
    const decideKey = document.getElementById('grammarExerciseKeyboardDecide');
    if (decideKey) {
        let decideTouchHandled = false;
        decideKey.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            decideTouchHandled = true;
            if (currentGrammarSelectedExerciseIndex !== -1) {
                submitGrammarExerciseAnswer(currentGrammarSelectedExerciseIndex);
            }
        }, { passive: false });
        decideKey.addEventListener('touchend', () => {
            setTimeout(() => { decideTouchHandled = false; }, 100);
        });
        decideKey.addEventListener('click', (e) => {
            if (decideTouchHandled) return;
            e.preventDefault();
            if (currentGrammarSelectedExerciseIndex !== -1) {
                submitGrammarExerciseAnswer(currentGrammarSelectedExerciseIndex);
            }
        });
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
    
    // 連続正解カウントをリセット（新しい学習セッション）
    quizStreakCount = 0;
    
    // 学習セッション開始
    startStudySession();
    
    // 進捗アニメーション用：学習開始時の覚えた語彙数とカテゴリを保存
    // 既に学習セッション中の場合は上書きしない（複数メニュー学習時の累計カウント用）
    if (!lastLearningCategory) {
        learnedWordsAtStart = calculateTotalLearnedWords();
    }
    lastLearningCategory = category;
    console.log('startHandwritingQuiz: 学習開始', { category, learnedWordsAtStart });
    
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
            <!-- 連続正解表示 -->
            <div class="quiz-streak-display hidden" id="hwQuizStreakDisplay">
                <span class="quiz-streak-number" id="hwQuizStreakNumber">0</span>連続正解中!!
            </div>
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
 * 進捗バーを初期化
 */
function initHWQuizProgressSegments() {
    const rangeEl = document.getElementById('hwQuizProgressRange');
    
    // 範囲テキストを設定
    if (rangeEl && hwQuizWords.length > 0) {
        const firstWord = hwQuizWords[0];
        const lastWord = hwQuizWords[hwQuizWords.length - 1];
        rangeEl.textContent = `単語番号${String(firstWord.id).padStart(4, '0')}-${String(lastWord.id).padStart(4, '0')}`;
    }
    
    // 進捗バーを初期化
    updateHWQuizProgressSegments();
    
    // 統計をリセット
    updateHWQuizStats();
}

/**
 * 進捗バーを更新
 */
function updateHWQuizProgressSegments() {
    const progressBarFill = document.getElementById('hwQuizProgressBarFill');
    if (!progressBarFill) return;
    
    const total = hwQuizWords.length;
    const progress = total > 0 ? ((hwQuizIndex + 1) / total) * 100 : 0;
    progressBarFill.style.width = `${progress}%`;
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
    tempSpan.style.cssText = 'position:absolute;visibility:hidden;font-size:48px;font-weight:700;font-family:"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;letter-spacing:2px;';
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
    tempSpan.style.cssText = 'position:absolute;visibility:hidden;font-size:38px;font-weight:700;font-family:"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;letter-spacing:2px;';
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
 * 文字のケースをそのまま返す（自動大文字化を無効化）
 * ユーザーが入力した大文字/小文字をそのまま使用
 */
function adjustCharCaseForAnswer(char) {
    // 入力された文字をそのまま返す（自動変換しない）
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
        
        let touchHandled = false;
        
        // 視覚的フィードバック
        const addPressedState = () => {
            key.style.transform = 'scale(0.95)';
            key.style.backgroundColor = '#d1d5db';
            // ポップアップエフェクト用のクラスを追加（特殊キー等はCSSで非表示になる）
            key.classList.add('key-pressed');
        };
        const removePressedState = () => {
            key.style.transform = '';
            key.style.backgroundColor = '';
            key.classList.remove('key-pressed');
        };
        
        // バックスペースキーの長押し対応
        if (key.id === 'hwKeyboardBackspace') {
            let backspaceInterval = null;
            let backspaceTimeout = null;
            
            const doBackspace = () => {
                if (hwQuizAnswerSubmitted) return;
                if (hwQuizConfirmedText.length > 0) {
                    hwQuizConfirmedText = hwQuizConfirmedText.slice(0, -1);
                    updateHWQuizAnswerDisplay();
                }
            };
            
            const startBackspaceRepeat = () => {
                addPressedState();
                doBackspace();
                backspaceTimeout = setTimeout(() => {
                    backspaceInterval = setInterval(doBackspace, 80);
                }, 300);
            };
            
            const stopBackspaceRepeat = () => {
                removePressedState();
                if (backspaceTimeout) {
                    clearTimeout(backspaceTimeout);
                    backspaceTimeout = null;
                }
                if (backspaceInterval) {
                    clearInterval(backspaceInterval);
                    backspaceInterval = null;
                }
            };
            
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                startBackspaceRepeat();
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                stopBackspaceRepeat();
                setTimeout(() => { touchHandled = false; }, 100);
            });
            key.addEventListener('touchcancel', stopBackspaceRepeat);
            
            key.addEventListener('mousedown', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                startBackspaceRepeat();
            });
            key.addEventListener('mouseup', stopBackspaceRepeat);
            key.addEventListener('mouseleave', stopBackspaceRepeat);
            
            return; // バックスペースキーは処理完了
        }
        
        // シフトキー
        if (key.id === 'hwKeyboardShift') {
            const doShift = () => {
                if (hwQuizAnswerSubmitted) return;
                hwKeyboardShiftActive = !hwKeyboardShiftActive;
                key.classList.toggle('active', hwKeyboardShiftActive);
                updateHWKeyboardCase();
            };
            
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchHandled = true;
                doShift();
            }, { passive: false });
            
            key.addEventListener('touchend', () => {
                setTimeout(() => { touchHandled = false; }, 100);
            });
            
            key.addEventListener('click', (e) => {
                if (touchHandled) return;
                e.preventDefault();
                doShift();
            });
            
            return; // シフトキーは処理完了
        }
        
        // 通常の文字キー
        const handleKeyPress = () => {
            if (hwQuizAnswerSubmitted) return;
            const keyValue = key.dataset.key;
            
            if (!keyValue) return;
            
            // スペースキーの場合、連続スペースを防ぐ
            if (keyValue === ' ') {
                if (hwQuizConfirmedText.length > 0 && hwQuizConfirmedText.slice(-1) === ' ') {
                    return;
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
                window.pendingShiftReset = 'hwVirtualKeyboard';
            }
            const adjustedChar = adjustCharCaseForAnswer(char);
            hwQuizConfirmedText += adjustedChar;
            updateHWQuizAnswerDisplay();
        };
        
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchHandled = true;
            addPressedState();
            handleKeyPress();
        }, { passive: false });
        
        key.addEventListener('touchend', () => {
            removePressedState();
            setTimeout(() => { touchHandled = false; }, 100);
        });
        
        key.addEventListener('click', (e) => {
            if (touchHandled) return;
            e.preventDefault();
            handleKeyPress();
        });
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
        posEl.textContent = '';
        posEl.style.display = 'none';
    }
    
    // 意味
    const meaningEl = document.getElementById('hwQuizMeaning');
    if (meaningEl) {
        // テストモードでは《活用》は表示しない
        const hideConjugation = document.body.classList.contains('quiz-test-mode');
        setMeaningContent(meaningEl, word.meaning || '', { hideConjugation });
    }
    
    // 連続正解表示を更新
    updateQuizStreakDisplay();
    
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
    
    // 未入力でも処理を続行（大文字小文字を区別）
    const userAnswer = (hwQuizConfirmedText || "").trim();
    const correctAnswer = (word.word || "");
    const isCorrect = userAnswer !== "" && userAnswer === correctAnswer;
    
    console.log('[HWQuiz] User:', userAnswer || "(empty)", '| Correct:', correctAnswer, '| Result:', isCorrect);
    
    // 結果を記録
    if (!hwQuizResults) hwQuizResults = {};
    hwQuizResults[hwQuizIndex] = isCorrect ? 'correct' : 'wrong';
    if (isCorrect) {
        hwQuizCorrectCount++;
        // 連続正解カウントを増やす
        quizStreakCount++;
    } else {
        hwQuizWrongCount++;
        // 連続正解カウントをリセット
        quizStreakCount = 0;
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
    
    // ○/×マークを表示
    showAnswerMark(isCorrect);
    
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
    
    // 不正解の場合、入力欄に差分ハイライトを適用（大文字小文字を区別）
    if (!isCorrect && answerDisplay) {
        const userInput = (hwQuizConfirmedText || "").trim();
        const correctWord = word.word;
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
    
    // 連続正解カウントをリセット
    quizStreakCount = 0;
    
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
 * 次の問題へ（フェードアニメーション付き）
 */
function goToNextHWQuizQuestion() {
    hwQuizIndex++;
    
    if (hwQuizIndex >= hwQuizWords.length) {
        // クイズ完了
        showHWQuizCompletion();
        return;
    }
    
    // 手書きクイズビュー全体を取得
    const hwQuizView = document.getElementById('handwritingQuizView');
    const hwMain = hwQuizView ? hwQuizView.querySelector('.hw-main') : null;
    
    if (hwMain) {
        // フェードアウト
        hwMain.style.transition = 'opacity 0.25s ease-out';
        hwMain.style.opacity = '0';
        
        // フェードアウト完了後に内容を更新してフェードイン
        setTimeout(() => {
            displayHWQuizQuestion();
            
            // フェードイン
            requestAnimationFrame(() => {
                hwMain.style.transition = 'opacity 0.25s ease-in';
                hwMain.style.opacity = '1';
                
                // トランジション終了後にスタイルをクリア
                setTimeout(() => {
                    hwMain.style.transition = '';
                }, 250);
            });
        }, 250);
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
            <!-- 連続正解表示 -->
            <div class="quiz-streak-display hidden" id="hwQuizStreakDisplay">
                <span class="quiz-streak-number" id="hwQuizStreakNumber">0</span>連続正解中!!
            </div>
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
    if (parent === 'レベル１ 初級500語' || parent === 'レベル２ 中級500語' || parent === 'レベル３ 上級500語' ||
        parent === 'レベル４ ハイレベル300語' || parent === 'レベル５ 難関突破100語') {
        showLevelSubcategorySelection(parent, true);
    } else if (parent === '入門600語') {
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

// ========================
// 不規則変化の単語機能
// ========================

// 不規則動詞データ（初級編）
const irregularVerbsBeginner = [
    { meaning: "〜である", base: "be", past: "was, were", pp: "been" },
    { meaning: "する", base: "do", past: "did", pp: "done" },
    { meaning: "持っている", base: "have", past: "had", pp: "had" },
    { meaning: "行く", base: "go", past: "went", pp: "gone" },
    { meaning: "来る", base: "come", past: "came", pp: "come" },
    { meaning: "見る", base: "see", past: "saw", pp: "seen" },
    { meaning: "取る", base: "take", past: "took", pp: "taken" },
    { meaning: "作る", base: "make", past: "made", pp: "made" },
    { meaning: "得る", base: "get", past: "got", pp: "gotten" },
    { meaning: "言う", base: "say", past: "said", pp: "said" },
    { meaning: "知っている", base: "know", past: "knew", pp: "known" },
    { meaning: "思う", base: "think", past: "thought", pp: "thought" },
    { meaning: "与える", base: "give", past: "gave", pp: "given" },
    { meaning: "書く", base: "write", past: "wrote", pp: "written" },
    { meaning: "読む", base: "read", past: "read", pp: "read" },
    { meaning: "話す", base: "speak", past: "spoke", pp: "spoken" },
    { meaning: "聞く", base: "hear", past: "heard", pp: "heard" },
    { meaning: "立つ", base: "stand", past: "stood", pp: "stood" },
    { meaning: "座る", base: "sit", past: "sat", pp: "sat" },
    { meaning: "走る", base: "run", past: "ran", pp: "run" }
];

// 不規則動詞データ（中級編）
const irregularVerbsIntermediate = [
    { meaning: "食べる", base: "eat", past: "ate", pp: "eaten" },
    { meaning: "飲む", base: "drink", past: "drank", pp: "drunk" },
    { meaning: "眠る", base: "sleep", past: "slept", pp: "slept" },
    { meaning: "買う", base: "buy", past: "bought", pp: "bought" },
    { meaning: "売る", base: "sell", past: "sold", pp: "sold" },
    { meaning: "教える", base: "teach", past: "taught", pp: "taught" },
    { meaning: "学ぶ", base: "learn", past: "learned", pp: "learned" },
    { meaning: "感じる", base: "feel", past: "felt", pp: "felt" },
    { meaning: "見つける", base: "find", past: "found", pp: "found" },
    { meaning: "落ちる", base: "fall", past: "fell", pp: "fallen" },
    { meaning: "飛ぶ", base: "fly", past: "flew", pp: "flown" },
    { meaning: "泳ぐ", base: "swim", past: "swam", pp: "swum" },
    { meaning: "歌う", base: "sing", past: "sang", pp: "sung" },
    { meaning: "持ってくる", base: "bring", past: "brought", pp: "brought" },
    { meaning: "建てる", base: "build", past: "built", pp: "built" },
    { meaning: "送る", base: "send", past: "sent", pp: "sent" },
    { meaning: "使う", base: "spend", past: "spent", pp: "spent" },
    { meaning: "去る", base: "leave", past: "left", pp: "left" },
    { meaning: "保つ", base: "keep", past: "kept", pp: "kept" },
    { meaning: "意味する", base: "mean", past: "meant", pp: "meant" }
];

// 不規則動詞データ（上級編）
const irregularVerbsAdvanced = [
    { meaning: "〜になる", base: "become", past: "became", pp: "become" },
    { meaning: "始める", base: "begin", past: "began", pp: "begun" },
    { meaning: "壊す", base: "break", past: "broke", pp: "broken" },
    { meaning: "選ぶ", base: "choose", past: "chose", pp: "chosen" },
    { meaning: "切る", base: "cut", past: "cut", pp: "cut" },
    { meaning: "描く", base: "draw", past: "drew", pp: "drawn" },
    { meaning: "運転する", base: "drive", past: "drove", pp: "driven" },
    { meaning: "忘れる", base: "forget", past: "forgot", pp: "forgotten" },
    { meaning: "育つ", base: "grow", past: "grew", pp: "grown" },
    { meaning: "置く", base: "put", past: "put", pp: "put" },
    { meaning: "乗る", base: "ride", past: "rode", pp: "ridden" },
    { meaning: "昇る", base: "rise", past: "rose", pp: "risen" },
    { meaning: "震える", base: "shake", past: "shook", pp: "shaken" },
    { meaning: "見せる", base: "show", past: "showed", pp: "shown" },
    { meaning: "投げる", base: "throw", past: "threw", pp: "thrown" },
    { meaning: "着る", base: "wear", past: "wore", pp: "worn" },
    { meaning: "勝つ", base: "win", past: "won", pp: "won" },
    { meaning: "盗む", base: "steal", past: "stole", pp: "stolen" },
    { meaning: "起きる", base: "wake", past: "woke", pp: "woken" },
    { meaning: "打つ", base: "hit", past: "hit", pp: "hit" }
];

// 不規則に変化する比較級・最上級
const irregularComparatives = [
    { word: "good", meaning: "良い", comparative: "better", superlative: "best" },
    { word: "bad", meaning: "悪い", comparative: "worse", superlative: "worst" },
    { word: "many", meaning: "多い（数）", comparative: "more", superlative: "most" },
    { word: "much", meaning: "多い（量）", comparative: "more", superlative: "most" },
    { word: "little", meaning: "少ない", comparative: "less", superlative: "least" },
    { word: "far", meaning: "遠い", comparative: "farther", superlative: "farthest" },
    { word: "old", meaning: "年上の", comparative: "older", superlative: "oldest" },
    { word: "late", meaning: "遅い", comparative: "later", superlative: "latest" },
    { word: "well", meaning: "上手に", comparative: "better", superlative: "best" },
    { word: "ill", meaning: "病気の", comparative: "worse", superlative: "worst" }
];

// 不規則に変化する名詞の複数形
const irregularPlurals = [
    { singular: "man", meaning: "男性", plural: "men" },
    { singular: "woman", meaning: "女性", plural: "women" },
    { singular: "child", meaning: "子供", plural: "children" },
    { singular: "foot", meaning: "足", plural: "feet" },
    { singular: "tooth", meaning: "歯", plural: "teeth" },
    { singular: "mouse", meaning: "ネズミ", plural: "mice" },
    { singular: "goose", meaning: "ガチョウ", plural: "geese" },
    { singular: "person", meaning: "人", plural: "people" },
    { singular: "fish", meaning: "魚", plural: "fish" },
    { singular: "sheep", meaning: "羊", plural: "sheep" },
    { singular: "deer", meaning: "鹿", plural: "deer" },
    { singular: "leaf", meaning: "葉", plural: "leaves" },
    { singular: "knife", meaning: "ナイフ", plural: "knives" },
    { singular: "life", meaning: "命・人生", plural: "lives" },
    { singular: "wife", meaning: "妻", plural: "wives" }
];

// 現在選択中のカテゴリー
let currentIvCategory = null;
let ivRedsheetActive = false;
let currentIvData = null;

// サブカテゴリーメニューを表示
function showIvMenuView() {
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    const view = document.getElementById('ivMenuView');
    const categorySelection = document.getElementById('categorySelection');
    
    if (view && categorySelection) {
        // メインヘッダーを更新
        updateHeaderButtons('course', '不規則変化の単語');
        
        // 画面切り替え
        categorySelection.classList.add('hidden');
        view.classList.remove('hidden');
        
        // サブカテゴリーの進捗バーを更新
        updateIrregularVerbsProgressBar();
        
        // 戻るボタン用にフラグを設定
        window.currentSubcategoryParent = '不規則変化の単語';
    }
}

// サブカテゴリーメニューを非表示（ホームに戻る）
function hideIvMenuView() {
    const view = document.getElementById('ivMenuView');
    const categorySelection = document.getElementById('categorySelection');
    
    if (view && categorySelection) {
        window.currentSubcategoryParent = null;
        
        // 縮小アニメーションで戻る
        animateCardShrink('irregularVerbsCardBtn', () => {
            // メインヘッダーをホームに戻す
            updateHeaderButtons('home');
            
            // 画面切り替え
            view.classList.add('hidden');
            categorySelection.classList.remove('hidden');
            
            // 進捗バーを更新
            updateCategoryStars();
            updateVocabProgressBar();
            updateIrregularVerbsProgressBar();
            
            // フローティング要復習ボタンを表示
            showFloatingReviewBtn();
            
            document.body.style.overflow = '';
        });
    }
}

// サブカテゴリーメニューを非表示（学習/テスト画面へ遷移時）
function hideIvMenuViewForStudy() {
    const view = document.getElementById('ivMenuView');
    if (view) {
        view.classList.add('hidden');
    }
}

// モード選択（学習 or テスト）
function showIvModeSelection(category) {
    currentIvCategory = category;
    
    // カテゴリータイトルを取得
    const titles = {
        'verbs-beginner': '不規則動詞（初級編）',
        'verbs-intermediate': '不規則動詞（中級編）',
        'verbs-advanced': '不規則動詞（上級編）',
        'comparatives': '比較級・最上級',
        'plurals': '名詞の複数形'
    };
    const title = titles[category] || category;
    
    // 学習モード選択オーバーレイを表示
    const existingOverlay = document.getElementById('ivModeOverlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'ivModeOverlay';
    overlay.className = 'study-mode-overlay';
    overlay.innerHTML = `
        <div class="study-mode-container" style="width: calc(100% - 16px); max-width: 600px; margin: 0 auto;">
            <div class="study-mode-title">学習方法を選択</div>
            <div class="study-mode-buttons">
                <button type="button" class="study-mode-choice-btn study-mode-input-btn iv-mode-study-btn">
                    <span class="study-mode-choice-main">学習</span>
                    <span class="study-mode-choice-sub">単語一覧を見て<br>学習する</span>
                </button>
                <button type="button" class="study-mode-choice-btn study-mode-output-btn iv-mode-test-btn">
                    <span class="study-mode-choice-main">テスト</span>
                    <span class="study-mode-choice-sub">覚えたかどうか<br>確認する</span>
                </button>
            </div>
            <button type="button" class="study-mode-cancel-btn">キャンセル</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // イベントリスナー
    overlay.querySelector('.iv-mode-study-btn').addEventListener('click', () => {
        overlay.remove();
        showIvStudyView(category);
    });
    
    overlay.querySelector('.iv-mode-test-btn').addEventListener('click', () => {
        overlay.remove();
        showIvTestView(category);
    });
    
    overlay.querySelector('.study-mode-cancel-btn').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// 学習モードを表示
function showIvStudyView(category) {
    // 学習セッション開始
    startStudySession();
    
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    const view = document.getElementById('ivStudyView');
    const titleEl = document.getElementById('ivStudyTitle');
    const thead = document.getElementById('ivStudyTableHead');
    const tbody = document.getElementById('ivStudyTableBody');
    
    if (!view || !tbody) return;
    
    // 現在のカテゴリーを保存（テストボタン用）
    currentIvCategory = category;
    
    // カテゴリータイトル
    const titles = {
        'verbs-beginner': '不規則動詞（初級編）',
        'verbs-intermediate': '不規則動詞（中級編）',
        'verbs-advanced': '不規則動詞（上級編）',
        'comparatives': '比較級・最上級',
        'plurals': '名詞の複数形'
    };
    titleEl.textContent = titles[category] || '学習';
    
    // データ取得
    let data;
    if (category === 'verbs-beginner') {
        data = irregularVerbsBeginner;
        currentIvData = { type: 'verbs', data };
    } else if (category === 'verbs-intermediate') {
        data = irregularVerbsIntermediate;
        currentIvData = { type: 'verbs', data };
    } else if (category === 'verbs-advanced') {
        data = irregularVerbsAdvanced;
        currentIvData = { type: 'verbs', data };
    } else if (category === 'comparatives') {
        data = irregularComparatives;
        currentIvData = { type: 'comparatives', data };
    } else if (category === 'plurals') {
        data = irregularPlurals;
        currentIvData = { type: 'plurals', data };
    }
    
    // テーブル生成
    tbody.innerHTML = '';
    
    // 進捗を取得
    let correctSet = new Set();
    let wrongSet = new Set();
    try {
        const savedCorrect = localStorage.getItem(`ivCorrect-${category}`);
        const savedWrong = localStorage.getItem(`ivWrong-${category}`);
        if (savedCorrect) correctSet = new Set(JSON.parse(savedCorrect));
        if (savedWrong) wrongSet = new Set(JSON.parse(savedWrong));
    } catch (e) {}
    
    // 進捗状態に応じたクラスを取得
    const getNumClass = (index) => {
        if (wrongSet.has(index)) return 'iv-study-num iv-num-wrong';
        if (correctSet.has(index)) return 'iv-study-num iv-num-correct';
        return 'iv-study-num';
    };
    
    if (currentIvData.type === 'verbs') {
        thead.innerHTML = `
            <tr>
                <th class="iv-study-col-num">No.</th>
                <th class="iv-study-col-meaning">意味</th>
                <th class="iv-study-col-base">原形</th>
                <th class="iv-study-col-past">過去形</th>
                <th class="iv-study-col-pp">過去分詞</th>
            </tr>
        `;
        data.forEach((verb, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-study-meaning">${verb.meaning}</td>
                <td class="iv-study-answer">${verb.base}</td>
                <td class="iv-study-answer">${verb.past}</td>
                <td class="iv-study-answer">${verb.pp}</td>
            `;
            tbody.appendChild(tr);
        });
    } else if (currentIvData.type === 'comparatives') {
        thead.innerHTML = `
            <tr>
                <th class="iv-study-col-num">No.</th>
                <th class="iv-study-col-meaning">意味</th>
                <th class="iv-study-col-word">原級</th>
                <th class="iv-study-col-comp">比較級</th>
                <th class="iv-study-col-super">最上級</th>
            </tr>
        `;
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-study-meaning">${item.meaning}</td>
                <td class="iv-study-word">${item.word}</td>
                <td class="iv-study-answer">${item.comparative}</td>
                <td class="iv-study-answer">${item.superlative}</td>
            `;
            tbody.appendChild(tr);
        });
    } else if (currentIvData.type === 'plurals') {
        thead.innerHTML = `
            <tr>
                <th class="iv-study-col-num">No.</th>
                <th class="iv-study-col-meaning">意味</th>
                <th class="iv-study-col-singular">単数形</th>
                <th class="iv-study-col-plural">複数形</th>
            </tr>
        `;
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-study-meaning">${item.meaning}</td>
                <td class="iv-study-word">${item.singular}</td>
                <td class="iv-study-answer">${item.plural}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // 赤シートリセット
    ivRedsheetActive = false;
    const ivRedsheetCheckbox = document.getElementById('ivRedsheetCheckbox');
    if (ivRedsheetCheckbox) ivRedsheetCheckbox.checked = false;
    document.getElementById('ivStudyTableContainer')?.classList.remove('redsheet-active');
    document.getElementById('ivRedsheetOverlay')?.classList.add('hidden');
    
    // フィルター状態をリセット
    ivStudyFilterState = { all: true, unlearned: true, wrong: true, correct: true };
    ivStudyIsRandomOrder = false;
    
    // UIをリセット
    const ivStudyShuffleBtn = document.getElementById('ivStudyShuffleBtn');
    if (ivStudyShuffleBtn) ivStudyShuffleBtn.classList.remove('active');
    const ivStudyFilterAll = document.getElementById('ivStudyFilterAll');
    const ivStudyFilterUnlearned = document.getElementById('ivStudyFilterUnlearned');
    const ivStudyFilterWrong = document.getElementById('ivStudyFilterWrong');
    const ivStudyFilterCorrect = document.getElementById('ivStudyFilterCorrect');
    if (ivStudyFilterAll) ivStudyFilterAll.checked = true;
    if (ivStudyFilterUnlearned) ivStudyFilterUnlearned.checked = true;
    if (ivStudyFilterWrong) ivStudyFilterWrong.checked = true;
    if (ivStudyFilterCorrect) ivStudyFilterCorrect.checked = true;
    const ivStudyFilterBadge = document.getElementById('ivStudyFilterActiveBadge');
    if (ivStudyFilterBadge) ivStudyFilterBadge.classList.add('hidden');
    
    // サブカテゴリーメニューを非表示
    const ivMenuView = document.getElementById('ivMenuView');
    if (ivMenuView) {
        ivMenuView.classList.add('hidden');
    }
    
    // 学習モードを表示
    view.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 学習モードを非表示（サブカテゴリーメニューに戻る）
function hideIvStudyView() {
    const view = document.getElementById('ivStudyView');
    const ivMenuView = document.getElementById('ivMenuView');
    
    if (view) {
        // ヘッダーを更新
        updateHeaderButtons('course', '不規則変化の単語');
        
        view.classList.add('hidden');
        document.body.style.overflow = '';
        
        if (ivMenuView) {
            ivMenuView.classList.remove('hidden');
            updateIrregularVerbsProgressBar();
        }
    }
}

// 赤シートトグル（不規則動詞学習モード）
function toggleIvRedsheet() {
    const checkbox = document.getElementById('ivRedsheetCheckbox');
    const overlay = document.getElementById('ivRedsheetOverlay');
    const nextBtn = document.getElementById('ivRedsheetNextBtn');
    const studyView = document.getElementById('ivStudyView');
    
    ivRedsheetActive = checkbox?.checked || false;
    
    if (ivRedsheetActive) {
        // 現在表示されている範囲内で、一番上の回答部分を探す
        const answers = document.querySelectorAll('.iv-study-answer');
        let targetAnswer = null;
        
        for (const answer of answers) {
            const rect = answer.getBoundingClientRect();
            if (rect.top >= 100) {
                targetAnswer = answer;
                break;
            }
        }
        
        if (!targetAnswer && answers.length > 0) {
            targetAnswer = answers[0];
        }
        
        // オーバーレイの位置を設定
        let topPosition = 150;
        let leftPosition = 0;
        
        if (targetAnswer) {
            const rect = targetAnswer.getBoundingClientRect();
            topPosition = rect.top;
            leftPosition = rect.left - 10; // 単語の左端に合わせる
        }
        
        if (overlay) {
            overlay.style.top = topPosition + 'px';
            overlay.style.left = leftPosition + 'px';
            overlay.style.right = '0';
            overlay.classList.remove('hidden');
        }
        
        studyView?.classList.add('red-sheet-mode');
        setupIvRedsheetDrag(overlay);
        
        // 下矢印ボタンを表示
        if (nextBtn) {
            nextBtn.classList.remove('hidden');
        }
    } else {
        overlay?.classList.add('hidden');
        studyView?.classList.remove('red-sheet-mode');
        
        // 下矢印ボタンを非表示
        if (nextBtn) {
            nextBtn.classList.add('hidden');
        }
    }
}

// 赤シートを次の行に移動（不規則動詞学習モード）
function moveIvRedsheetToNext() {
    const overlay = document.getElementById('ivRedsheetOverlay');
    const studyView = document.getElementById('ivStudyView');
    const tableContainer = document.getElementById('ivStudyTableContainer');
    const rows = document.querySelectorAll('.iv-study-table tbody tr');
    
    if (!overlay || !studyView || rows.length === 0) return;
    
    const viewportHeight = window.innerHeight;
    const currentRedSheetTop = parseFloat(overlay.style.top) || 0;
    
    // 赤シートより下にある最初の行を探す
    let nextRow = null;
    let nextIndex = -1;
    
    for (let i = 0; i < rows.length; i++) {
        const answer = rows[i].querySelector('.iv-study-answer');
        if (answer) {
            const rect = answer.getBoundingClientRect();
            if (rect.top > currentRedSheetTop + 5) {
                nextRow = rows[i];
                nextIndex = i;
                break;
            }
        }
    }
    
    // 次の行が見つからない場合は終了（フェードアウト）
    if (!nextRow) {
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.opacity = '';
            overlay.style.transition = '';
            studyView.classList.remove('red-sheet-mode');
            
            const nextBtn = document.getElementById('ivRedsheetNextBtn');
            if (nextBtn) {
                nextBtn.classList.add('hidden');
            }
            
            const checkbox = document.getElementById('ivRedsheetCheckbox');
            if (checkbox) {
                checkbox.checked = false;
            }
            ivRedsheetActive = false;
        }, 300);
        return;
    }
    
    const nextAnswer = nextRow.querySelector('.iv-study-answer');
    if (!nextAnswer) return;
    
    const nextRect = nextAnswer.getBoundingClientRect();
    
    // 次の行が画面外ならスクロール
    if (nextRect.top >= viewportHeight - 100) {
        const scrollAmount = nextRect.top - viewportHeight + 200;
        tableContainer?.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            const updatedRect = nextAnswer.getBoundingClientRect();
            overlay.style.transition = 'top 0.3s ease';
            overlay.style.top = updatedRect.top + 'px';
            overlay.style.left = (updatedRect.left - 10) + 'px';
            setTimeout(() => {
                overlay.style.transition = '';
            }, 300);
        }, 350);
    } else {
        overlay.style.transition = 'top 0.3s ease';
        overlay.style.top = nextRect.top + 'px';
        overlay.style.left = (nextRect.left - 10) + 'px';
        setTimeout(() => {
            overlay.style.transition = '';
        }, 300);
    }
}

// 赤シートのドラッグ設定（不規則動詞学習モード）
function setupIvRedsheetDrag(overlay) {
    if (!overlay) return;
    
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
        overlay.style.transition = 'none';
        overlay.setPointerCapture(e.pointerId);
    };
    
    const onPointerMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        // 横にも縦にも自由に動かせる
        const newLeft = startLeft + deltaX;
        const newTop = Math.max(0, startTop + deltaY);
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
    };
    
    const onPointerUp = (e) => {
        isDragging = false;
        overlay.style.cursor = 'grab';
        overlay.style.transition = '';
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

// テストモードを表示
function showIvTestView(category) {
    // 学習セッション開始
    startStudySession();
    
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    // 現在のカテゴリーを保存
    currentIvCategory = category;
    
    // サブカテゴリーメニューを非表示
    const ivMenuView = document.getElementById('ivMenuView');
    if (ivMenuView) {
        ivMenuView.classList.add('hidden');
    }
    
    // データ取得
    let data;
    let type;
    if (category === 'verbs-beginner') {
        data = irregularVerbsBeginner;
        type = 'verbs';
    } else if (category === 'verbs-intermediate') {
        data = irregularVerbsIntermediate;
        type = 'verbs';
    } else if (category === 'verbs-advanced') {
        data = irregularVerbsAdvanced;
        type = 'verbs';
    } else if (category === 'comparatives') {
        data = irregularComparatives;
        type = 'comparatives';
    } else if (category === 'plurals') {
        data = irregularPlurals;
        type = 'plurals';
    }
    
    // カテゴリータイトル
    const titles = {
        'verbs-beginner': '不規則動詞（初級編）',
        'verbs-intermediate': '不規則動詞（中級編）',
        'verbs-advanced': '不規則動詞（上級編）',
        'comparatives': '比較級・最上級',
        'plurals': '名詞の複数形'
    };
    
    // テスト画面を表示
    showIrregularVerbsTestView(data, type, titles[category]);
}

// テスト画面を表示（汎用）
function showIrregularVerbsTestView(data, type, title) {
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    const view = document.getElementById('irregularVerbsView');
    const titleEl = view.querySelector('.irregular-verbs-title');
    const tbody = document.getElementById('irregularVerbsTableBody');
    const thead = view.querySelector('.irregular-verbs-table thead');
    const instructions = view.querySelector('.irregular-verbs-instructions');
    
    if (!view || !tbody) return;
    
    // タイトル更新
    if (titleEl) titleEl.textContent = title;
    
    // スコアリセット
    irregularVerbsScore = { correct: 0, total: 0 };
    
    // フィルター状態をリセット
    ivFilterState = { all: true, unlearned: true, wrong: true, correct: true };
    ivIsRandomOrder = false;
    
    // UIをリセット
    const ivShuffleBtn = document.getElementById('ivShuffleBtn');
    if (ivShuffleBtn) ivShuffleBtn.classList.remove('active');
    const ivFilterAll = document.getElementById('ivFilterAll');
    const ivFilterUnlearned = document.getElementById('ivFilterUnlearned');
    const ivFilterWrong = document.getElementById('ivFilterWrong');
    const ivFilterCorrect = document.getElementById('ivFilterCorrect');
    if (ivFilterAll) ivFilterAll.checked = true;
    if (ivFilterUnlearned) ivFilterUnlearned.checked = true;
    if (ivFilterWrong) ivFilterWrong.checked = true;
    if (ivFilterCorrect) ivFilterCorrect.checked = true;
    const ivFilterBadge = document.getElementById('ivFilterActiveBadge');
    if (ivFilterBadge) ivFilterBadge.classList.add('hidden');
    
    // テーブルヘッダーと内容を生成
    tbody.innerHTML = '';
    
    // 進捗を取得
    let correctSet = new Set();
    let wrongSet = new Set();
    try {
        const savedCorrect = localStorage.getItem(`ivCorrect-${currentIvCategory}`);
        const savedWrong = localStorage.getItem(`ivWrong-${currentIvCategory}`);
        if (savedCorrect) correctSet = new Set(JSON.parse(savedCorrect));
        if (savedWrong) wrongSet = new Set(JSON.parse(savedWrong));
    } catch (e) {}
    
    // 進捗状態に応じたクラスを取得
    const getNumClass = (index) => {
        if (wrongSet.has(index)) return 'iv-num iv-num-wrong';
        if (correctSet.has(index)) return 'iv-num iv-num-correct';
        return 'iv-num';
    };
    
    if (type === 'verbs') {
        thead.innerHTML = `
            <tr>
                <th class="iv-col-num">No.</th>
                <th class="iv-col-meaning">意味</th>
                <th class="iv-col-base">原形</th>
                <th class="iv-col-past">過去形</th>
                <th class="iv-col-pp">過去分詞</th>
            </tr>
        `;
        if (instructions) instructions.textContent = '原形・過去形・過去分詞を入力して「採点」ボタンを押してください';
        
        data.forEach((verb, index) => {
            const tr = document.createElement('tr');
            tr.id = `iv-row-${index}`;
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-meaning">${verb.meaning}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-base-${index}" data-index="${index}" data-type="base" data-answer="${verb.base}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-base-${index}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-past-${index}" data-index="${index}" data-type="past" data-answer="${verb.past}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-past-${index}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-pp-${index}" data-index="${index}" data-type="pp" data-answer="${verb.pp}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-pp-${index}"></div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else if (type === 'comparatives') {
        thead.innerHTML = `
            <tr>
                <th class="iv-col-num">No.</th>
                <th class="iv-col-meaning">意味</th>
                <th class="iv-col-word">原級</th>
                <th class="iv-col-comp">比較級</th>
                <th class="iv-col-super">最上級</th>
            </tr>
        `;
        if (instructions) instructions.textContent = '比較級・最上級を入力して「採点」ボタンを押してください';
        
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.id = `iv-row-${index}`;
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-meaning">${item.meaning}</td>
                <td class="iv-word">${item.word}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-comp-${index}" data-index="${index}" data-type="comp" data-answer="${item.comparative}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-comp-${index}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-super-${index}" data-index="${index}" data-type="super" data-answer="${item.superlative}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-super-${index}"></div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else if (type === 'plurals') {
        thead.innerHTML = `
            <tr>
                <th class="iv-col-num">No.</th>
                <th class="iv-col-meaning">意味</th>
                <th class="iv-col-singular">単数形</th>
                <th class="iv-col-plural">複数形</th>
            </tr>
        `;
        if (instructions) instructions.textContent = '複数形を入力して「採点」ボタンを押してください';
        
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.id = `iv-row-${index}`;
            tr.innerHTML = `
                <td class="${getNumClass(index)}">${index + 1}</td>
                <td class="iv-meaning">${item.meaning}</td>
                <td class="iv-word">${item.singular}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-plural-${index}" data-index="${index}" data-type="plural" data-answer="${item.plural}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-plural-${index}"></div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // 現在のテストデータを保存
    currentIvTestData = { data, type };
    
    // 画面表示（ヘッダーと同じタイミングでステータスバーも白に）
    view.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setStatusBarColor('#ffffff');
    
    // キーボードを表示
    showIvKeyboard();
}

// 現在のテストデータ
let currentIvTestData = null;

// 不規則変化のフィルター状態（テストモード）
let ivFilterState = {
    all: true,
    unlearned: true,
    wrong: true,
    correct: true,
    bookmark: true
};

// 不規則変化のランダム状態（テストモード）
let ivIsRandomOrder = false;
let ivOriginalOrder = []; // 元の順番を保持

// 不規則変化のフィルター状態（学習モード）
let ivStudyFilterState = {
    all: true,
    unlearned: true,
    wrong: true,
    correct: true,
    bookmark: true
};

// 不規則変化のランダム状態（学習モード）
let ivStudyIsRandomOrder = false;

// 不規則変化の単語をフィルター・シャッフルして再描画
function refreshIvTable() {
    if (!currentIvTestData) return;
    
    const { data, type } = currentIvTestData;
    const tbody = document.getElementById('irregularVerbsTableBody');
    if (!tbody) return;
    
    // 進捗を取得
    let correctSet = new Set();
    let wrongSet = new Set();
    try {
        const savedCorrect = localStorage.getItem(`ivCorrect-${currentIvCategory}`);
        const savedWrong = localStorage.getItem(`ivWrong-${currentIvCategory}`);
        if (savedCorrect) correctSet = new Set(JSON.parse(savedCorrect));
        if (savedWrong) wrongSet = new Set(JSON.parse(savedWrong));
    } catch (e) {}
    
    // フィルター適用
    let filteredData = data.map((item, idx) => ({ item, originalIndex: idx })).filter(({ originalIndex }) => {
        const isCorrect = correctSet.has(originalIndex);
        const isWrong = wrongSet.has(originalIndex);
        const isUnlearned = !isCorrect && !isWrong;
        
        if (ivFilterState.all) return true;
        if (ivFilterState.unlearned && isUnlearned) return true;
        if (ivFilterState.wrong && isWrong) return true;
        if (ivFilterState.correct && isCorrect) return true;
        return false;
    });
    
    // ランダム並び替え
    if (ivIsRandomOrder) {
        filteredData = filteredData.sort(() => Math.random() - 0.5);
    }
    
    // 進捗状態に応じたクラスを取得
    const getNumClass = (index) => {
        if (wrongSet.has(index)) return 'iv-num iv-num-wrong';
        if (correctSet.has(index)) return 'iv-num iv-num-correct';
        return 'iv-num';
    };
    
    // テーブル再描画
    tbody.innerHTML = '';
    
    filteredData.forEach(({ item, originalIndex }, displayIndex) => {
        const tr = document.createElement('tr');
        tr.id = `iv-row-${originalIndex}`;
        
        if (type === 'verbs') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-meaning">${item.meaning}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-base-${originalIndex}" data-index="${originalIndex}" data-type="base" data-answer="${item.base}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-base-${originalIndex}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-past-${originalIndex}" data-index="${originalIndex}" data-type="past" data-answer="${item.past}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-past-${originalIndex}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-pp-${originalIndex}" data-index="${originalIndex}" data-type="pp" data-answer="${item.pp}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-pp-${originalIndex}"></div>
                </td>
            `;
        } else if (type === 'comparatives') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-meaning">${item.meaning}</td>
                <td class="iv-word">${item.word}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-comp-${originalIndex}" data-index="${originalIndex}" data-type="comp" data-answer="${item.comparative}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-comp-${originalIndex}"></div>
                </td>
                <td>
                    <input type="text" class="iv-input" id="iv-super-${originalIndex}" data-index="${originalIndex}" data-type="super" data-answer="${item.superlative}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-super-${originalIndex}"></div>
                </td>
            `;
        } else if (type === 'plurals') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-meaning">${item.meaning}</td>
                <td class="iv-word">${item.singular}</td>
                <td>
                    <input type="text" class="iv-input" id="iv-plural-${originalIndex}" data-index="${originalIndex}" data-type="plural" data-answer="${item.plural}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                    <div class="iv-answer hidden" id="iv-answer-plural-${originalIndex}"></div>
                </td>
            `;
        }
        
        tbody.appendChild(tr);
    });
    
    // フィルターバッジ更新（フィルター後の行数を渡す）
    updateIvFilterBadge(filteredData.length);
}

// フィルターバッジ更新
function updateIvFilterBadge(filteredCount) {
    const badge = document.getElementById('ivFilterActiveBadge');
    const trigger = document.getElementById('ivFilterTrigger');
    if (!badge) return;
    
    // すべてにチェックが入っているか確認
    const allChecked = ivFilterState.all || (ivFilterState.unlearned && ivFilterState.wrong && ivFilterState.correct && ivFilterState.bookmark);
    
    if (allChecked) {
        badge.classList.add('hidden');
        if (trigger) trigger.classList.remove('active');
    } else {
        // フィルター後の行数を表示（引数がない場合は既存のテキストを維持）
        if (filteredCount !== undefined) {
            badge.textContent = filteredCount;
        }
        badge.classList.remove('hidden');
        if (trigger) trigger.classList.add('active');
    }
}

// 学習モードのテーブルを再描画
function refreshIvStudyTable() {
    if (!currentIvData) return;
    
    const { type, data } = currentIvData;
    const tbody = document.getElementById('ivStudyTableBody');
    if (!tbody) return;
    
    // 進捗を取得
    let correctSet = new Set();
    let wrongSet = new Set();
    try {
        const savedCorrect = localStorage.getItem(`ivCorrect-${currentIvCategory}`);
        const savedWrong = localStorage.getItem(`ivWrong-${currentIvCategory}`);
        if (savedCorrect) correctSet = new Set(JSON.parse(savedCorrect));
        if (savedWrong) wrongSet = new Set(JSON.parse(savedWrong));
    } catch (e) {}
    
    // フィルター適用
    let filteredData = data.map((item, idx) => ({ item, originalIndex: idx })).filter(({ originalIndex }) => {
        const isCorrect = correctSet.has(originalIndex);
        const isWrong = wrongSet.has(originalIndex);
        const isUnlearned = !isCorrect && !isWrong;
        
        if (ivStudyFilterState.all) return true;
        if (ivStudyFilterState.unlearned && isUnlearned) return true;
        if (ivStudyFilterState.wrong && isWrong) return true;
        if (ivStudyFilterState.correct && isCorrect) return true;
        return false;
    });
    
    // ランダム並び替え
    if (ivStudyIsRandomOrder) {
        filteredData = filteredData.sort(() => Math.random() - 0.5);
    }
    
    // 進捗状態に応じたクラスを取得
    const getNumClass = (index) => {
        if (wrongSet.has(index)) return 'iv-study-num iv-num-wrong';
        if (correctSet.has(index)) return 'iv-study-num iv-num-correct';
        return 'iv-study-num';
    };
    
    // テーブル再描画
    tbody.innerHTML = '';
    
    filteredData.forEach(({ item, originalIndex }) => {
        const tr = document.createElement('tr');
        
        if (type === 'verbs') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-study-meaning">${item.meaning}</td>
                <td class="iv-study-answer">${item.base}</td>
                <td class="iv-study-answer">${item.past}</td>
                <td class="iv-study-answer">${item.pp}</td>
            `;
        } else if (type === 'comparatives') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-study-meaning">${item.meaning}</td>
                <td class="iv-study-word">${item.word}</td>
                <td class="iv-study-answer">${item.comparative}</td>
                <td class="iv-study-answer">${item.superlative}</td>
            `;
        } else if (type === 'plurals') {
            tr.innerHTML = `
                <td class="${getNumClass(originalIndex)}">${originalIndex + 1}</td>
                <td class="iv-study-meaning">${item.meaning}</td>
                <td class="iv-study-word">${item.singular}</td>
                <td class="iv-study-answer">${item.plural}</td>
            `;
        }
        
        tbody.appendChild(tr);
    });
    
    // フィルターバッジ更新（フィルター後の行数を渡す）
    updateIvStudyFilterBadge(filteredData.length);
}

// 学習モードのフィルターバッジ更新
function updateIvStudyFilterBadge(filteredCount) {
    const badge = document.getElementById('ivStudyFilterActiveBadge');
    const trigger = document.getElementById('ivStudyFilterTrigger');
    
    // すべてにチェックが入っているか確認
    const allChecked = ivStudyFilterState.all || (ivStudyFilterState.unlearned && ivStudyFilterState.wrong && ivStudyFilterState.correct && ivStudyFilterState.bookmark);
    
    if (allChecked) {
        if (badge) badge.classList.add('hidden');
        if (trigger) trigger.classList.remove('active');
    } else {
        // フィルター後の行数を表示（引数がない場合は既存のテキストを維持）
        if (badge) {
            if (filteredCount !== undefined) {
                badge.textContent = filteredCount;
            }
            badge.classList.remove('hidden');
        }
        if (trigger) trigger.classList.add('active');
    }
}

// 不規則動詞データ（50語）- 旧データ（互換性のため）
const irregularVerbsData = [
    { meaning: "〜である", base: "be", past: "was/were", pp: "been" },
    { meaning: "〜になる", base: "become", past: "became", pp: "become" },
    { meaning: "始める", base: "begin", past: "began", pp: "begun" },
    { meaning: "壊す", base: "break", past: "broke", pp: "broken" },
    { meaning: "持ってくる", base: "bring", past: "brought", pp: "brought" },
    { meaning: "建てる", base: "build", past: "built", pp: "built" },
    { meaning: "買う", base: "buy", past: "bought", pp: "bought" },
    { meaning: "捕まえる", base: "catch", past: "caught", pp: "caught" },
    { meaning: "選ぶ", base: "choose", past: "chose", pp: "chosen" },
    { meaning: "来る", base: "come", past: "came", pp: "come" },
    { meaning: "切る", base: "cut", past: "cut", pp: "cut" },
    { meaning: "する", base: "do", past: "did", pp: "done" },
    { meaning: "描く", base: "draw", past: "drew", pp: "drawn" },
    { meaning: "飲む", base: "drink", past: "drank", pp: "drunk" },
    { meaning: "運転する", base: "drive", past: "drove", pp: "driven" },
    { meaning: "食べる", base: "eat", past: "ate", pp: "eaten" },
    { meaning: "落ちる", base: "fall", past: "fell", pp: "fallen" },
    { meaning: "感じる", base: "feel", past: "felt", pp: "felt" },
    { meaning: "見つける", base: "find", past: "found", pp: "found" },
    { meaning: "飛ぶ", base: "fly", past: "flew", pp: "flown" },
    { meaning: "忘れる", base: "forget", past: "forgot", pp: "forgotten" },
    { meaning: "得る", base: "get", past: "got", pp: "got/gotten" },
    { meaning: "与える", base: "give", past: "gave", pp: "given" },
    { meaning: "行く", base: "go", past: "went", pp: "gone" },
    { meaning: "育てる", base: "grow", past: "grew", pp: "grown" },
    { meaning: "持っている", base: "have", past: "had", pp: "had" },
    { meaning: "聞く", base: "hear", past: "heard", pp: "heard" },
    { meaning: "保つ", base: "keep", past: "kept", pp: "kept" },
    { meaning: "知っている", base: "know", past: "knew", pp: "known" },
    { meaning: "去る", base: "leave", past: "left", pp: "left" },
    { meaning: "貸す", base: "lend", past: "lent", pp: "lent" },
    { meaning: "させる", base: "let", past: "let", pp: "let" },
    { meaning: "横たわる", base: "lie", past: "lay", pp: "lain" },
    { meaning: "失う", base: "lose", past: "lost", pp: "lost" },
    { meaning: "作る", base: "make", past: "made", pp: "made" },
    { meaning: "意味する", base: "mean", past: "meant", pp: "meant" },
    { meaning: "会う", base: "meet", past: "met", pp: "met" },
    { meaning: "払う", base: "pay", past: "paid", pp: "paid" },
    { meaning: "置く", base: "put", past: "put", pp: "put" },
    { meaning: "読む", base: "read", past: "read", pp: "read" },
    { meaning: "乗る", base: "ride", past: "rode", pp: "ridden" },
    { meaning: "走る", base: "run", past: "ran", pp: "run" },
    { meaning: "言う", base: "say", past: "said", pp: "said" },
    { meaning: "見る", base: "see", past: "saw", pp: "seen" },
    { meaning: "売る", base: "sell", past: "sold", pp: "sold" },
    { meaning: "送る", base: "send", past: "sent", pp: "sent" },
    { meaning: "見せる", base: "show", past: "showed", pp: "shown" },
    { meaning: "歌う", base: "sing", past: "sang", pp: "sung" },
    { meaning: "座る", base: "sit", past: "sat", pp: "sat" },
    { meaning: "眠る", base: "sleep", past: "slept", pp: "slept" },
    { meaning: "話す", base: "speak", past: "spoke", pp: "spoken" },
    { meaning: "費やす", base: "spend", past: "spent", pp: "spent" },
    { meaning: "立つ", base: "stand", past: "stood", pp: "stood" },
    { meaning: "泳ぐ", base: "swim", past: "swam", pp: "swum" },
    { meaning: "取る", base: "take", past: "took", pp: "taken" },
    { meaning: "教える", base: "teach", past: "taught", pp: "taught" },
    { meaning: "言う", base: "tell", past: "told", pp: "told" },
    { meaning: "考える", base: "think", past: "thought", pp: "thought" },
    { meaning: "投げる", base: "throw", past: "threw", pp: "thrown" },
    { meaning: "理解する", base: "understand", past: "understood", pp: "understood" },
    { meaning: "着る", base: "wear", past: "wore", pp: "worn" },
    { meaning: "勝つ", base: "win", past: "won", pp: "won" },
    { meaning: "書く", base: "write", past: "wrote", pp: "written" }
];

let irregularVerbsScore = { correct: 0, total: 0 };

// 不規則変化の単語画面を表示
function showIrregularVerbsView() {
    // フローティング要復習ボタンを非表示
    hideFloatingReviewBtn();
    
    const view = document.getElementById('irregularVerbsView');
    const tbody = document.getElementById('irregularVerbsTableBody');
    
    if (!view || !tbody) return;
    
    // スコアリセット
    irregularVerbsScore = { correct: 0, total: 0 };
    updateIrregularVerbsScore();
    
    // テーブル生成
    tbody.innerHTML = '';
    irregularVerbsData.forEach((verb, index) => {
        const tr = document.createElement('tr');
        tr.id = `iv-row-${index}`;
        tr.innerHTML = `
            <td class="iv-num">${index + 1}</td>
            <td class="iv-meaning">${verb.meaning}</td>
            <td>
                <input type="text" class="iv-input" id="iv-base-${index}" data-index="${index}" data-type="base" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                <div class="iv-answer hidden" id="iv-answer-base-${index}"></div>
            </td>
            <td>
                <input type="text" class="iv-input" id="iv-past-${index}" data-index="${index}" data-type="past" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                <div class="iv-answer hidden" id="iv-answer-past-${index}"></div>
            </td>
            <td>
                <input type="text" class="iv-input" id="iv-pp-${index}" data-index="${index}" data-type="pp" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none">
                <div class="iv-answer hidden" id="iv-answer-pp-${index}"></div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // 画面表示（ヘッダーと同じタイミングでステータスバーも白に）
    view.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setStatusBarColor('#ffffff');
    
    // キーボードを表示
    showIvKeyboard();
}

// 不規則変化の単語画面（テストモード）を非表示（サブカテゴリーメニューに戻る）
function hideIrregularVerbsView() {
    const view = document.getElementById('irregularVerbsView');
    const ivMenuView = document.getElementById('ivMenuView');
    
    if (view) {
        // キーボードを隠す
        hideIvKeyboard();
        
        // ヘッダーを更新（同じタイミングでステータスバーも青に）
        updateHeaderButtons('course', '不規則変化の単語');
        view.classList.add('hidden');
        document.body.style.overflow = '';
        setStatusBarColor('#1d4ed8');
        
        if (ivMenuView) {
            ivMenuView.classList.remove('hidden');
            updateIrregularVerbsProgressBar();
        }
    }
}

// 1問採点（汎用）
function checkIrregularVerb(index) {
    const row = document.getElementById(`iv-row-${index}`);
    
    // 既に採点済みの場合はスキップ
    if (!row || row.classList.contains('iv-row-correct') || row.classList.contains('iv-row-wrong')) {
        return;
    }
    
    // 正解判定（複数回答対応）
    const checkAnswer = (input, correctAnswers) => {
        if (!input) return true;
        const userAnswer = input.value.trim().toLowerCase();
        const answers = correctAnswers.toLowerCase().split('/').map(a => a.trim());
        return answers.includes(userAnswer);
    };
    
    const type = currentIvTestData?.type || 'verbs';
    let allCorrect = true;
    
    if (type === 'verbs') {
        const baseInput = document.getElementById(`iv-base-${index}`);
        const pastInput = document.getElementById(`iv-past-${index}`);
        const ppInput = document.getElementById(`iv-pp-${index}`);
        
        const baseAnswer = document.getElementById(`iv-answer-base-${index}`);
        const pastAnswer = document.getElementById(`iv-answer-past-${index}`);
        const ppAnswer = document.getElementById(`iv-answer-pp-${index}`);
        
        const baseCorrect = checkAnswer(baseInput, baseInput?.dataset.answer || '');
        const pastCorrect = checkAnswer(pastInput, pastInput?.dataset.answer || '');
        const ppCorrect = checkAnswer(ppInput, ppInput?.dataset.answer || '');
        
        // 入力欄のスタイル更新
        if (baseInput) {
            baseInput.classList.add(baseCorrect ? 'iv-correct' : 'iv-wrong');
            baseInput.disabled = true;
            if (!baseCorrect && baseAnswer) {
                baseAnswer.textContent = baseInput.dataset.answer;
                baseAnswer.classList.remove('hidden');
            }
        }
        if (pastInput) {
            pastInput.classList.add(pastCorrect ? 'iv-correct' : 'iv-wrong');
            pastInput.disabled = true;
            if (!pastCorrect && pastAnswer) {
                pastAnswer.textContent = pastInput.dataset.answer;
                pastAnswer.classList.remove('hidden');
            }
        }
        if (ppInput) {
            ppInput.classList.add(ppCorrect ? 'iv-correct' : 'iv-wrong');
            ppInput.disabled = true;
            if (!ppCorrect && ppAnswer) {
                ppAnswer.textContent = ppInput.dataset.answer;
                ppAnswer.classList.remove('hidden');
            }
        }
        
        allCorrect = baseCorrect && pastCorrect && ppCorrect;
    } else if (type === 'comparatives') {
        const compInput = document.getElementById(`iv-comp-${index}`);
        const superInput = document.getElementById(`iv-super-${index}`);
        
        const compAnswer = document.getElementById(`iv-answer-comp-${index}`);
        const superAnswer = document.getElementById(`iv-answer-super-${index}`);
        
        const compCorrect = checkAnswer(compInput, compInput?.dataset.answer || '');
        const superCorrect = checkAnswer(superInput, superInput?.dataset.answer || '');
        
        if (compInput) {
            compInput.classList.add(compCorrect ? 'iv-correct' : 'iv-wrong');
            compInput.disabled = true;
            if (!compCorrect && compAnswer) {
                compAnswer.textContent = compInput.dataset.answer;
                compAnswer.classList.remove('hidden');
            }
        }
        if (superInput) {
            superInput.classList.add(superCorrect ? 'iv-correct' : 'iv-wrong');
            superInput.disabled = true;
            if (!superCorrect && superAnswer) {
                superAnswer.textContent = superInput.dataset.answer;
                superAnswer.classList.remove('hidden');
            }
        }
        
        allCorrect = compCorrect && superCorrect;
    } else if (type === 'plurals') {
        const pluralInput = document.getElementById(`iv-plural-${index}`);
        const pluralAnswer = document.getElementById(`iv-answer-plural-${index}`);
        
        const pluralCorrect = checkAnswer(pluralInput, pluralInput?.dataset.answer || '');
        
        if (pluralInput) {
            pluralInput.classList.add(pluralCorrect ? 'iv-correct' : 'iv-wrong');
            pluralInput.disabled = true;
            if (!pluralCorrect && pluralAnswer) {
                pluralAnswer.textContent = pluralInput.dataset.answer;
                pluralAnswer.classList.remove('hidden');
            }
        }
        
        allCorrect = pluralCorrect;
    }
    
    // 行のスタイル更新
    row.classList.add(allCorrect ? 'iv-row-correct' : 'iv-row-wrong');
    
    // 単語番号セルのスタイル更新
    const numCell = row.querySelector('td:first-child');
    if (numCell) {
        numCell.classList.remove('iv-num-correct', 'iv-num-wrong');
        numCell.classList.add(allCorrect ? 'iv-num-correct' : 'iv-num-wrong');
    }
    
    // スコア更新
    irregularVerbsScore.total++;
    if (allCorrect) {
        irregularVerbsScore.correct++;
    }
    updateIrregularVerbsScore();
    
    // 進捗を保存（ホーム画面の進捗バー用）
    if (currentIvCategory) {
        saveIvProgress(currentIvCategory, index, allCorrect);
    }
}

// スコア表示更新
function updateIrregularVerbsScore() {
    const correctEl = document.getElementById('irregularVerbsCorrect');
    const totalEl = document.getElementById('irregularVerbsTotal');
    if (correctEl) correctEl.textContent = irregularVerbsScore.correct;
    if (totalEl) totalEl.textContent = irregularVerbsScore.total;
}

// 不規則動詞用仮想キーボード
let ivCurrentInput = null;
let ivShiftActive = false;

// キーボードを表示
function showIvKeyboard() {
    const keyboard = document.getElementById('ivKeyboard');
    const container = document.querySelector('.irregular-verbs-table-container');
    if (keyboard) {
        keyboard.classList.add('visible');
    }
    if (container) {
        container.classList.add('keyboard-open');
    }
}

// キーボードを非表示
function hideIvKeyboard() {
    const keyboard = document.getElementById('ivKeyboard');
    const container = document.querySelector('.irregular-verbs-table-container');
    if (keyboard) {
        keyboard.classList.remove('visible');
    }
    if (container) {
        container.classList.remove('keyboard-open');
    }
    ivCurrentInput = null;
}

// キーボードのセットアップ
function setupIrregularVerbsKeyboard() {
    const keyboard = document.getElementById('ivKeyboard');
    if (!keyboard) return;
    
    // キー入力処理
    const handleKeyInput = (key) => {
        if (ivCurrentInput && !ivCurrentInput.disabled) {
            let char = key.dataset.key;
            // シフトが有効なら大文字に
            if (ivShiftActive && char.length === 1 && char !== ' ' && char !== "'") {
                char = char.toUpperCase();
                // シフトをリセット
                toggleIvShift();
            }
            // 常に末尾に追加（タッチ操作でセレクション位置がリセットされる問題を回避）
            ivCurrentInput.value = ivCurrentInput.value + char;
        }
    };
    
    // キー入力（touchstart/mousedownでpreventDefaultしてフォーカスを維持）
    keyboard.querySelectorAll('.keyboard-key[data-key]').forEach(key => {
        let touchHandled = false;
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchHandled = true;
            handleKeyInput(key);
        }, { passive: false });
        key.addEventListener('touchend', () => {
            setTimeout(() => { touchHandled = false; }, 100);
        });
        key.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        key.addEventListener('click', (e) => {
            if (touchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            handleKeyInput(key);
        });
    });
    
    // シフトキー
    const shiftBtn = document.getElementById('ivKeyboardShift');
    if (shiftBtn) {
        let shiftTouchHandled = false;
        shiftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shiftTouchHandled = true;
            toggleIvShift();
        }, { passive: false });
        shiftBtn.addEventListener('touchend', () => {
            setTimeout(() => { shiftTouchHandled = false; }, 100);
        });
        shiftBtn.addEventListener('mousedown', (e) => e.preventDefault());
        shiftBtn.addEventListener('click', (e) => {
            if (shiftTouchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            toggleIvShift();
        });
    }
    
    // バックスペース処理
    const handleBackspace = () => {
        if (ivCurrentInput && !ivCurrentInput.disabled) {
            const value = ivCurrentInput.value;
            if (value.length > 0) {
                // 常に末尾から削除
                ivCurrentInput.value = value.slice(0, -1);
            }
        }
    };
    
    // バックスペース
    const backspaceBtn = document.getElementById('ivKeyboardBackspace');
    if (backspaceBtn) {
        let bsTouchHandled = false;
        backspaceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            bsTouchHandled = true;
            handleBackspace();
        }, { passive: false });
        backspaceBtn.addEventListener('touchend', () => {
            setTimeout(() => { bsTouchHandled = false; }, 100);
        });
        backspaceBtn.addEventListener('mousedown', (e) => e.preventDefault());
        backspaceBtn.addEventListener('click', (e) => {
            if (bsTouchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            handleBackspace();
        });
    }
    
    // キーボード自体をクリックしても閉じないようにする
    keyboard.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // 採点ボタン処理
    const handleCheck = () => {
        if (ivCurrentInput) {
            const index = parseInt(ivCurrentInput.dataset.index);
            if (!isNaN(index)) {
                checkIrregularVerb(index);
                // 次の未採点の行に移動
                moveToNextUncheckedRow(index);
            }
        }
    };
    
    // 採点ボタン
    const checkBtn = document.getElementById('ivKeyboardCheckBtn');
    if (checkBtn) {
        let checkTouchHandled = false;
        checkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            checkTouchHandled = true;
            handleCheck();
        }, { passive: false });
        checkBtn.addEventListener('touchend', () => {
            setTimeout(() => { checkTouchHandled = false; }, 100);
        });
        checkBtn.addEventListener('click', (e) => {
            if (checkTouchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            handleCheck();
        });
    }
    
    // 左へボタン
    const prevBtn = document.getElementById('ivKeyboardPrevBtn');
    if (prevBtn) {
        let prevTouchHandled = false;
        prevBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            prevTouchHandled = true;
            moveToAdjacentInput('prev');
        }, { passive: false });
        prevBtn.addEventListener('touchend', () => {
            setTimeout(() => { prevTouchHandled = false; }, 100);
        });
        prevBtn.addEventListener('click', (e) => {
            if (prevTouchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            moveToAdjacentInput('prev');
        });
    }
    
    // 右へボタン
    const nextBtn = document.getElementById('ivKeyboardNextBtn');
    if (nextBtn) {
        let nextTouchHandled = false;
        nextBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            nextTouchHandled = true;
            moveToAdjacentInput('next');
        }, { passive: false });
        nextBtn.addEventListener('touchend', () => {
            setTimeout(() => { nextTouchHandled = false; }, 100);
        });
        nextBtn.addEventListener('click', (e) => {
            if (nextTouchHandled) return;
            e.preventDefault();
            e.stopPropagation();
            moveToAdjacentInput('next');
        });
    }
}

// 隣の入力欄に移動
function moveToAdjacentInput(direction) {
    const inputs = Array.from(document.querySelectorAll('.iv-input:not(:disabled)'));
    if (inputs.length === 0) return;
    
    let currentIndex = -1;
    if (ivCurrentInput) {
        currentIndex = inputs.indexOf(ivCurrentInput);
    }
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % inputs.length;
    } else {
        newIndex = currentIndex <= 0 ? inputs.length - 1 : currentIndex - 1;
    }
    
    const newInput = inputs[newIndex];
    if (newInput) {
        newInput.focus();
        ivCurrentInput = newInput;
        // 入力欄がキーボードに隠れないようにスクロール
        scrollInputIntoView(newInput);
    }
}

// 入力欄がキーボードに隠れないようにスクロール
function scrollInputIntoView(input) {
    const container = document.querySelector('.irregular-verbs-table-container');
    if (container && input) {
        const inputRect = input.getBoundingClientRect();
        const keyboardHeight = 280;
        const visibleBottom = window.innerHeight - keyboardHeight;
        
        if (inputRect.bottom > visibleBottom) {
            const scrollAmount = inputRect.bottom - visibleBottom + 50;
            container.scrollTop += scrollAmount;
        } else if (inputRect.top < container.getBoundingClientRect().top + 50) {
            // 上に隠れている場合
            const scrollAmount = inputRect.top - container.getBoundingClientRect().top - 50;
            container.scrollTop += scrollAmount;
        }
    }
}

// 次の未採点の行に移動
function moveToNextUncheckedRow(currentIndex) {
    const dataLength = currentIvTestData?.data?.length || irregularVerbsData.length;
    for (let i = currentIndex + 1; i < dataLength; i++) {
        const row = document.getElementById(`iv-row-${i}`);
        if (row && !row.classList.contains('iv-row-correct') && !row.classList.contains('iv-row-wrong')) {
            const firstInput = row.querySelector('.iv-input');
            if (firstInput && !firstInput.disabled) {
                firstInput.focus();
                return;
            }
        }
    }
}

// シフトキーをトグル
function toggleIvShift() {
    ivShiftActive = !ivShiftActive;
    const shiftBtn = document.getElementById('ivKeyboardShift');
    const keyboard = document.getElementById('ivKeyboard');
    if (shiftBtn) {
        shiftBtn.classList.toggle('active', ivShiftActive);
    }
    if (keyboard) {
        keyboard.classList.toggle('shift-active', ivShiftActive);
    }
}

// 次の入力欄に移動
function moveToNextIvInput() {
    if (!ivCurrentInput) return;
    
    const allInputs = Array.from(document.querySelectorAll('.iv-input:not(:disabled)'));
    const currentIndex = allInputs.indexOf(ivCurrentInput);
    
    if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
        allInputs[currentIndex + 1].focus();
    }
}

// 入力欄フォーカス時の処理
document.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('iv-input')) {
        ivCurrentInput = e.target;
        showIvKeyboard();
        // 入力欄がキーボードに隠れないようにスクロール
        setTimeout(() => {
            const container = document.querySelector('.irregular-verbs-table-container');
            if (container) {
                const inputRect = e.target.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const keyboardHeight = 280; // キーボードの高さ
                const visibleBottom = window.innerHeight - keyboardHeight;
                
                // 入力欄がキーボードに隠れている場合
                if (inputRect.bottom > visibleBottom) {
                    const scrollAmount = inputRect.bottom - visibleBottom + 50; // 50px余裕
                    container.scrollTop += scrollAmount;
                }
            }
        }, 100);
    }
});

// キーボード外をクリックしてもキーボードは閉じない（常に表示）
// document.addEventListener('click', (e) => {
//     const keyboard = document.getElementById('ivKeyboard');
//     const irregularVerbsView = document.getElementById('irregularVerbsView');
//     
//     if (!irregularVerbsView || irregularVerbsView.classList.contains('hidden')) return;
//     if (!keyboard || !keyboard.classList.contains('visible')) return;
//     
//     // 入力欄かキーボードをクリックした場合は閉じない
//     if (e.target.classList.contains('iv-input') || 
//         e.target.closest('.iv-keyboard') ||
//         e.target.closest('.iv-check-btn')) {
//         return;
//     }
//     
//     hideIvKeyboard();
// });

// ページ読み込み時にキーボードセットアップ
document.addEventListener('DOMContentLoaded', () => {
    setupIrregularVerbsKeyboard();
    setupFloatingReviewButton();
});

// ========================
// フローティング苦手・要復習ボタン
// ========================

function setupFloatingReviewButton() {
    const floatingBtn = document.getElementById('floatingReviewBtn');
    const collapsed = document.getElementById('floatingReviewCollapsed');
    const expanded = document.getElementById('floatingReviewExpanded');
    const closeBtn = document.getElementById('floatingReviewClose');
    const startBtn = document.getElementById('floatingReviewStartBtn');
    
    if (!floatingBtn || !collapsed || !expanded) return;
    
    // 初期状態：ホーム画面なら表示、それ以外は非表示
    const categorySelection = document.getElementById('categorySelection');
    if (categorySelection && !categorySelection.classList.contains('hidden')) {
        showFloatingReviewBtn();
    } else {
        floatingBtn.classList.add('hidden');
    }
    
    // 縮小状態をクリックで拡大
    collapsed.addEventListener('click', () => {
        collapsed.classList.add('hidden');
        expanded.classList.remove('hidden');
    });
    
    // 閉じるボタンで縮小
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            expanded.classList.add('hidden');
            collapsed.classList.remove('hidden');
        });
    }
    
    // 外側クリックで縮小
    document.addEventListener('click', (e) => {
        if (!floatingBtn.contains(e.target) && !expanded.classList.contains('hidden')) {
            expanded.classList.add('hidden');
            collapsed.classList.remove('hidden');
        }
    });
    
    // 復習開始ボタン
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startFloatingReview();
        });
    }
}

// フローティングボタンを表示（ホーム画面のみ）
function showFloatingReviewBtn() {
    const floatingBtn = document.getElementById('floatingReviewBtn');
    if (floatingBtn) {
        floatingBtn.classList.remove('hidden');
        updateFloatingReviewCount();
    }
}

// フローティングボタンを非表示
function hideFloatingReviewBtn() {
    const floatingBtn = document.getElementById('floatingReviewBtn');
    const expanded = document.getElementById('floatingReviewExpanded');
    const collapsed = document.getElementById('floatingReviewCollapsed');
    if (floatingBtn) {
        floatingBtn.classList.add('hidden');
    }
    // パネルが開いていたら閉じる
    if (expanded) expanded.classList.add('hidden');
    if (collapsed) collapsed.classList.remove('hidden');
}

// 要復習単語数を更新
function updateFloatingReviewCount() {
    const countEl = document.getElementById('floatingReviewCount');
    const statValueEl = document.getElementById('floatingReviewStatValue');
    
    // 間違えた単語をカウント
    let wrongCount = 0;
    
    // すべてのカテゴリーから間違えた単語を集計
    const categories = [
        '中学1年生', '中学2年生', '中学3年生', 
        '発展', '入門600語', '小学生で習った単語',
        '大阪府Ｃ問題', 'Level別英単語テスト'
    ];
    
    categories.forEach(category => {
        const wrongKey = `wrong-${category}`;
        const wrongSet = JSON.parse(localStorage.getItem(wrongKey) || '[]');
        wrongCount += wrongSet.length;
    });
    
    // チェックマーク付き単語もカウント
    const reviewWordsData = JSON.parse(localStorage.getItem('reviewWords') || '[]');
    wrongCount += reviewWordsData.length;
    
    // 重複を除く（簡易的に合計を表示）
    if (countEl) {
        countEl.textContent = wrongCount > 0 ? wrongCount : '--';
    }
    if (statValueEl) {
        statValueEl.textContent = wrongCount > 0 ? wrongCount : '--';
    }
}

// 復習を開始
function startFloatingReview() {
    // 間違えた単語を収集
    const wrongWords = [];
    
    // vocabularyDataから間違えた単語を収集
    if (typeof vocabularyData !== 'undefined') {
        const categories = Object.keys(vocabularyData);
        categories.forEach(category => {
            const wrongKey = `wrong-${category}`;
            const wrongIds = JSON.parse(localStorage.getItem(wrongKey) || '[]');
            
            if (wrongIds.length > 0 && vocabularyData[category]) {
                vocabularyData[category].forEach(word => {
                    if (wrongIds.includes(word.id)) {
                        wrongWords.push({...word, sourceCategory: category});
                    }
                });
            }
        });
    }
    
    // チェックマーク付き単語を追加
    const reviewWordsData = JSON.parse(localStorage.getItem('reviewWords') || '[]');
    if (reviewWordsData.length > 0 && typeof vocabularyData !== 'undefined') {
        const allWords = getAllWordsFromVocabulary();
        reviewWordsData.forEach(wordId => {
            const word = allWords.find(w => w.id === wordId);
            if (word && !wrongWords.find(w => w.id === wordId)) {
                wrongWords.push({...word, sourceCategory: word.category || '要復習'});
            }
        });
    }
    
    if (wrongWords.length === 0) {
        alert('復習する単語がありません。\n単語学習を進めると、間違えた単語やチェックした単語がここに表示されます。');
        return;
    }
    
    // パネルを閉じる
    const expanded = document.getElementById('floatingReviewExpanded');
    const collapsed = document.getElementById('floatingReviewCollapsed');
    if (expanded) expanded.classList.add('hidden');
    if (collapsed) collapsed.classList.remove('hidden');
    
    // 復習モードで表示
    showInputModeDirectly('苦手・要復習', wrongWords, '苦手・要復習');
}

// すべての単語を取得するヘルパー関数（LEVEL0〜5 を欠けず含む）
function getAllWordsFromVocabulary() {
    return getAllWordData();
}

// ========================
// 学習カレンダー
// ========================

const STUDY_CALENDAR_KEY = 'studyCalendarData';
const STUDY_TIME_KEY = 'studyTotalTime';
let studySessionStartTime = null; // 学習セッション開始時刻

// 学習カレンダーデータを読み込み
function loadStudyCalendarData() {
    try {
        const data = localStorage.getItem(STUDY_CALENDAR_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('学習カレンダーデータの読み込みエラー:', e);
        return {};
    }
}

// 学習カレンダーデータを保存
function saveStudyCalendarData(data) {
    try {
        localStorage.setItem(STUDY_CALENDAR_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('学習カレンダーデータの保存エラー:', e);
    }
}

// 学習カレンダーデータをリセット
async function clearStudyCalendarData() {
    const confirmed = await showConfirm('学習カレンダー、連続学習日数、総学習時間をリセットしますか？');
    if (!confirmed) return;
    
    try {
        // 学習カレンダーデータを削除
        localStorage.removeItem(STUDY_CALENDAR_KEY);
        // 総学習時間を削除
        localStorage.removeItem(STUDY_TIME_KEY);
        // 連続学習日数のベストを削除
        localStorage.removeItem('studyStreakBest');
        
        // 表示を更新
        renderStudyCalendar();
        updateStudyStreak();
        updateTotalStudyTime();
        
        showAlert('リセット完了', '学習カレンダー、連続学習日数、総学習時間をリセットしました。');
    } catch (e) {
        console.error('学習カレンダーリセットエラー:', e);
        showAlert('エラー', 'リセットに失敗しました。');
    }
}

// ローカル日付をYYYY-MM-DD形式で取得
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 今日の学習を記録
function recordStudyActivity(count = 1) {
    const today = getLocalDateString(); // ローカル時間でYYYY-MM-DD
    const data = loadStudyCalendarData();
    data[today] = (data[today] || 0) + count;
    saveStudyCalendarData(data);
    // カレンダーと統計を更新
    renderStudyCalendar();
    updateStudyStreak();
}

// 学習カレンダーを初期化
function initStudyCalendar() {
    // 年月セレクトボックスのオプションを生成
    const yearMonthSelect = document.getElementById('calendarYearMonthSelect');
    
    if (yearMonthSelect) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        yearMonthSelect.innerHTML = '';
        
        // 2026年から今月までのオプションを生成（新しい順）
        const startYear = 2026;
        for (let year = currentYear; year >= startYear; year--) {
            const endMonth = (year === currentYear) ? currentMonth : 11;
            const startMonth = (year === startYear) ? 0 : 0;
            for (let month = endMonth; month >= startMonth; month--) {
                const option = document.createElement('option');
                option.value = `${year}-${month}`;
                option.textContent = `${year}年${month + 1}月`;
                yearMonthSelect.appendChild(option);
            }
        }
        yearMonthSelect.value = `${calendarViewDate.getFullYear()}-${calendarViewDate.getMonth()}`;
        
        yearMonthSelect.addEventListener('change', (e) => {
            e.stopPropagation();
            const [year, month] = e.target.value.split('-').map(Number);
            calendarViewDate.setFullYear(year);
            calendarViewDate.setMonth(month);
            renderStudyCalendar();
        });
    }
    
    renderStudyCalendar();
    updateStudyStreak();
    updateTotalStudyTime();
}

// 連続学習日数を計算・更新
function updateStudyStreak() {
    const calendarData = loadStudyCalendarData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // 今日から遡って連続学習日数をカウント
    while (true) {
        const dateStr = getLocalDateString(checkDate);
        if (calendarData[dateStr] && calendarData[dateStr] > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // 今日まだ学習していない場合、昨日から数える
            if (streak === 0 && checkDate.getTime() === today.getTime()) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }
    
    const streakEl = document.getElementById('studyStreakNumber');
    if (streakEl) {
        streakEl.textContent = streak;
    }
    
    // 自己ベストを更新
    updateStreakBest(streak);
}

// 自己ベストを保存・取得・更新
function updateStreakBest(currentStreak) {
    const STREAK_BEST_KEY = 'studyStreakBest';
    let best = parseInt(localStorage.getItem(STREAK_BEST_KEY) || '0', 10);
    
    if (currentStreak > best) {
        best = currentStreak;
        localStorage.setItem(STREAK_BEST_KEY, best.toString());
    }
    
    const bestEl = document.getElementById('studyStreakBest');
    if (bestEl) {
        bestEl.textContent = best;
    }
}

// 学習セッション開始
function startStudySession() {
    if (!studySessionStartTime) {
        studySessionStartTime = Date.now();
    }
}

// 学習セッション終了（時間を保存）
function endStudySession() {
    if (studySessionStartTime) {
        const elapsed = Date.now() - studySessionStartTime;
        const elapsedMinutes = elapsed / 1000 / 60; // 分単位
        
        // 総学習時間に加算
        let totalTime = parseFloat(localStorage.getItem(STUDY_TIME_KEY) || '0');
        totalTime += elapsedMinutes;
        localStorage.setItem(STUDY_TIME_KEY, totalTime.toString());
        
        studySessionStartTime = null;
        updateTotalStudyTime();
    }
}

// 総学習時間を更新
function updateTotalStudyTime() {
    const totalTime = parseFloat(localStorage.getItem(STUDY_TIME_KEY) || '0');
    const hoursEl = document.getElementById('studyTimeHours');
    const minsEl = document.getElementById('studyTimeMinutes');
    
    if (hoursEl && minsEl) {
        const hours = Math.floor(totalTime / 60);
        const mins = Math.floor(totalTime % 60);
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minsEl.textContent = mins.toString().padStart(2, '0');
    }
}

// 学習カレンダーを描画（1ヶ月分）
function renderStudyCalendar() {
    const grid = document.getElementById('studyCalendarGrid');
    if (!grid) return;
    
    const calendarData = loadStudyCalendarData();
    const today = new Date();
    const viewYear = calendarViewDate.getFullYear();
    const viewMonth = calendarViewDate.getMonth();
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
    
    // 表示月の1日と最終日を取得
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 月の1日が何曜日か（月曜=0, 日曜=6に変換）
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // 日曜日の場合
    
    // 必要な週数を計算
    const weeksNeeded = Math.ceil((startDayOfWeek + daysInMonth) / 7);
    
    // グリッドをクリア
    grid.innerHTML = '';
    
    // 年月セレクトボックスとラベルの値を更新
    const yearMonthSelect = document.getElementById('calendarYearMonthSelect');
    const yearMonthLabel = document.getElementById('calendarYearMonthLabel');
    if (yearMonthSelect) {
        yearMonthSelect.value = `${viewYear}-${viewMonth}`;
    }
    if (yearMonthLabel) {
        yearMonthLabel.textContent = `${viewYear}年${viewMonth + 1}月`;
    }
    
    // 曜日ラベル（横に並べる）
    dayNames.forEach(name => {
        const label = document.createElement('div');
        label.className = 'calendar-weekday-label';
        label.textContent = name;
        grid.appendChild(label);
    });
    
    // 週ごとに行を作成
    let dayCounter = 1;
    for (let week = 0; week < weeksNeeded; week++) {
        // 各曜日のセルを追加
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            // 月の開始前または終了後の空セル
            if ((week === 0 && dayOfWeek < startDayOfWeek) || dayCounter > daysInMonth) {
                cell.classList.add('empty');
                grid.appendChild(cell);
                continue;
            }
            
            const cellDate = new Date(viewYear, viewMonth, dayCounter);
            const dateStr = getLocalDateString(cellDate);
            const studyCount = calendarData[dateStr] || 0;
            
            // 今日かどうか
            const isToday = cellDate.toDateString() === today.toDateString();
            
            // 学習量に応じたレベルを設定
            const level = getStudyLevel(studyCount);
            cell.classList.add(`level-${level}`);
            
            // 今日のセルに目印
            if (isToday) {
                cell.classList.add('today');
            }
            
            // ツールチップ用のタイトル
            cell.title = `${viewMonth + 1}/${dayCounter}: ${studyCount}語学習`;
            
            grid.appendChild(cell);
            dayCounter++;
        }
    }
}

// 学習量からレベル（0-4）を計算
function getStudyLevel(count) {
    if (count === 0) return 0;
    if (count < 10) return 1;
    if (count < 30) return 2;
    if (count < 50) return 3;
    return 4;
}


