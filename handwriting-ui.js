/**
 * 手書き入力UIコントローラー
 */

class HandwritingInputUI {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.hasDrawn = false;
        this.initialized = false;
        this.lastX = 0;
        this.lastY = 0;
        this.drawTimeout = null;
        this.confirmedText = '';
        
        // ペン設定
        this.penColor = '#000000';
        this.penWidth = 16; // 280x280なら15-20px程度が28x28で適切に反映される
        
        // DOM要素
        this.elements = {};
    }
    
    /**
     * 初期化
     */
    async init() {
        // 二重初期化を避ける
        if (this.initialized) return;
        this.initialized = true;

        this.canvas = document.getElementById('handwritingCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.elements = {
            container: document.getElementById('handwritingInputContainer'),
            confirmedText: document.getElementById('handwritingConfirmedText'),
            predictions: document.getElementById('handwritingPredictions'),
            mainPredictionContainer: document.getElementById('mainPredictionContainer'),
            subPredictionsContainer: document.getElementById('subPredictionsContainer'),
            clearBtn: document.getElementById('handwritingClearBtn'),
            backspaceBtn: document.getElementById('handwritingBackspaceBtn'),
            spaceBtn: document.getElementById('handwritingSpaceBtn'),
            debug: document.getElementById('handwritingDebug'),
            debugToggle: document.getElementById('debugToggle'),
            debugContent: document.getElementById('debugContent'),
            debugCanvas: document.getElementById('debugCanvas'),
            debugProbabilities: document.getElementById('debugProbabilities'),
            debugInvert: document.getElementById('debugInvert'),
            debugTrim: document.getElementById('debugTrim'),
            debugCenter: document.getElementById('debugCenter')
        };
        
        this.setupCanvas();
        this.bindEvents();
        
        // モデルを確実にロード
        if (window.handwritingRecognition) {
            await window.handwritingRecognition.loadModel();
        }
        
        console.log('[HandwritingUI] Initialized');
    }
    
    /**
     * キャンバス設定
     */
    setupCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.penColor;
        this.ctx.lineWidth = this.penWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // アンチエイリアスを少し制御（ぼやけすぎ防止）
        this.ctx.imageSmoothingEnabled = false;
    }
    
    /**
     * イベントバインド
     */
    bindEvents() {
        // キャンバスの描画イベント（マウス）
        this.canvas.addEventListener('mousedown', this.handleDrawStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleDrawMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleDrawEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleDrawEnd.bind(this));
        
        // キャンバスの描画イベント（タッチ）
        this.canvas.addEventListener('touchstart', this.handleDrawStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleDrawMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleDrawEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleDrawEnd.bind(this));
        
        // ツールボタン
        this.elements.clearBtn.addEventListener('click', this.clearCanvas.bind(this));
        this.elements.backspaceBtn.addEventListener('click', this.deleteLastChar.bind(this));
        this.elements.spaceBtn.addEventListener('click', this.addSpace.bind(this));
        
        // デバッグトグル
        this.elements.debugToggle.addEventListener('change', (e) => {
            this.elements.debugContent.classList.toggle('hidden', !e.target.checked);
        });
        
        // デバッグ設定変更
        this.elements.debugInvert.addEventListener('change', (e) => {
            window.handwritingRecognition.debugSettings.invert = e.target.checked;
        });
        this.elements.debugTrim.addEventListener('change', (e) => {
            window.handwritingRecognition.debugSettings.trim = e.target.checked;
        });
        this.elements.debugCenter.addEventListener('change', (e) => {
            window.handwritingRecognition.debugSettings.center = e.target.checked;
        });
    }
    
    /**
     * 描画開始
     */
    handleDrawStart(e) {
        e.preventDefault();
        this.isDrawing = true;
        this.hasDrawn = true;
        
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // タイマークリア
        if (this.drawTimeout) {
            clearTimeout(this.drawTimeout);
            this.drawTimeout = null;
        }
    }
    
    /**
     * 描画中
     */
    handleDrawMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    /**
     * 描画終了
     */
    handleDrawEnd(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // 描画停止後、自動認識（500msディレイ）
        if (this.drawTimeout) {
            clearTimeout(this.drawTimeout);
        }
        
        this.drawTimeout = setTimeout(() => {
            if (this.hasDrawn) {
                this.recognizeAndShowPredictions();
            }
        }, 500);
    }
    
    /**
     * マウス/タッチ座標取得
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
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
    
    /**
     * キャンバスをクリア
     */
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
        
        // 予測結果をクリア
        if (this.elements.mainPredictionContainer) {
            this.elements.mainPredictionContainer.innerHTML = '';
        }
        if (this.elements.subPredictionsContainer) {
            this.elements.subPredictionsContainer.innerHTML = '';
        }
        
        // デバッグキャンバスクリア
        const debugCtx = this.elements.debugCanvas.getContext('2d');
        debugCtx.fillStyle = '#ffffff';
        debugCtx.fillRect(0, 0, 28, 28);
        this.elements.debugProbabilities.innerHTML = '';
    }
    
    /**
     * 認識実行＆候補表示
     */
    async recognizeAndShowPredictions() {
        if (!window.handwritingRecognition.isModelLoaded) {
            console.warn('[HandwritingUI] Model not loaded');
            return;
        }
        
        try {
            const result = await window.handwritingRecognition.predict(this.canvas);
            
            if (!result) {
                console.warn('[HandwritingUI] No prediction result');
                return;
            }
            
            // 候補ボタンを表示
            this.displayPredictions(result.topK);
            
            // デバッグ表示
            if (!this.elements.debugContent.classList.contains('hidden')) {
                this.displayDebugInfo(result);
            }
            
        } catch (error) {
            console.error('[HandwritingUI] Recognition error:', error);
        }
    }
    
    /**
     * 予測候補を表示
     */
    displayPredictions(topK) {
        if (!this.elements.mainPredictionContainer || !this.elements.subPredictionsContainer) return;
        
        this.elements.mainPredictionContainer.innerHTML = '';
        this.elements.subPredictionsContainer.innerHTML = '';
        
        if (topK.length === 0) return;

        // メイン候補（1位）
        const top = topK[0];
        const mainBtn = document.createElement('button');
        mainBtn.className = 'prediction-main-btn';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'prediction-main-label';
        labelSpan.textContent = top.label;
        const probSpan = document.createElement('span');
        probSpan.className = 'prediction-main-prob';
        probSpan.textContent = `${(top.probability * 100).toFixed(0)}%`;
        mainBtn.appendChild(labelSpan);
        mainBtn.appendChild(probSpan);
        mainBtn.addEventListener('click', () => this.confirmChar(top.label));
        this.elements.mainPredictionContainer.appendChild(mainBtn);

        // サブ候補（2位・3位）
        const subs = topK.slice(1, 3);
        subs.forEach(item => {
            const subBtn = document.createElement('button');
            subBtn.className = 'prediction-sub-btn';
            subBtn.textContent = item.label;
            subBtn.addEventListener('click', () => this.confirmChar(item.label));
            this.elements.subPredictionsContainer.appendChild(subBtn);
        });
    }
    
    /**
     * 文字を確定
     */
    confirmChar(char) {
        this.confirmedText += char;
        this.elements.confirmedText.textContent = this.confirmedText || '（まだ入力されていません）';
        
        // キャンバスをクリア
        this.clearCanvas();
        
        // フォーカスをキャンバスに戻す（任意）
        this.canvas.focus();
    }
    
    /**
     * スペース追加
     */
    addSpace() {
        this.confirmedText += ' ';
        this.elements.confirmedText.textContent = this.confirmedText || '（まだ入力されていません）';
    }
    
    /**
     * 最後の1文字を削除
     */
    deleteLastChar() {
        if (this.confirmedText.length > 0) {
            this.confirmedText = this.confirmedText.slice(0, -1);
            this.elements.confirmedText.textContent = this.confirmedText || '（まだ入力されていません）';
        }
    }
    
    /**
     * 確定テキストを取得
     */
    getConfirmedText() {
        return this.confirmedText.trim();
    }
    
    /**
     * 確定テキストをリセット
     */
    resetConfirmedText() {
        this.confirmedText = '';
        this.elements.confirmedText.textContent = '（まだ入力されていません）';
        this.clearCanvas();
    }
    
    /**
     * デバッグ情報を表示
     */
    displayDebugInfo(result) {
        // 前処理後の画像を表示
        window.handwritingRecognition.drawPreprocessedImage(
            result.preprocessed.data,
            this.elements.debugCanvas
        );
        
        // 確率トップ10を表示
        let html = '<div class="debug-prob-title">Top 10 Predictions:</div>';
        result.topK.slice(0, 10).forEach((item, index) => {
            html += `<div class="debug-prob-item">
                <span class="debug-prob-rank">${index + 1}.</span>
                <span class="debug-prob-label">${item.label}</span>
                <span class="debug-prob-value">${(item.probability * 100).toFixed(2)}%</span>
            </div>`;
        });
        this.elements.debugProbabilities.innerHTML = html;
    }
    
    /**
     * 表示切替
     */
    show() {
        this.elements.container.classList.remove('hidden');
    }
    
    hide() {
        this.elements.container.classList.add('hidden');
    }
}

// グローバルインスタンス
window.handwritingInputUI = new HandwritingInputUI();

// DOMContentLoaded後に自動初期化
document.addEventListener('DOMContentLoaded', () => {
    window.handwritingInputUI.init();
});

