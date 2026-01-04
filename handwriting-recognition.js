/**
 * EMNIST手書き文字認識モジュール
 * TensorFlow.jsを使用してブラウザ上で手書き英字を認識
 */

class HandwritingRecognition {
    constructor() {
        this.model = null;
        this.isModelLoading = false;
        this.isModelLoaded = false;
        
        // EMNIST Balanced ラベルマップ (a-z, A-Z のみを使用)
        // EMNIST Balanced は 47クラスありますが、ここでは英字26文字 (小文字) のみ想定
        this.labelMap = this.createLabelMap();
        
        // デバッグ設定
        this.debugSettings = {
            invert: true,
            trim: true,
            center: true
        };
    }
    
    /**
     * ラベルマップ作成（小文字 a-z）
     */
    createLabelMap() {
        const map = {};
        // a-z を 0-25 にマッピング
        for (let i = 0; i < 26; i++) {
            map[i] = String.fromCharCode(97 + i); // 'a' = 97
        }
        return map;
    }
    
    /**
     * モデルの読み込み
     */
    async loadModel() {
        if (this.isModelLoaded) {
            console.log('[EMNIST] Model already loaded');
            return true;
        }
        
        if (this.isModelLoading) {
            console.log('[EMNIST] Model is currently loading...');
            // 読み込み完了を待つ
            while (this.isModelLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isModelLoaded;
        }
        
        try {
            this.isModelLoading = true;
            console.log('[EMNIST] Loading model from emnist_final/model.json');
            
            // モデルを読み込み
            this.model = await tf.loadLayersModel('emnist_final/model.json');
            
            console.log('[EMNIST] Model loaded successfully');
            console.log('[EMNIST] Input shape:', this.model.inputs[0].shape);
            console.log('[EMNIST] Output shape:', this.model.outputs[0].shape);
            
            // ウォームアップ推論
            const dummyInput = tf.zeros([1, 28, 28, 1]);
            const warmupResult = this.model.predict(dummyInput);
            warmupResult.dispose();
            dummyInput.dispose();
            
            this.isModelLoaded = true;
            this.isModelLoading = false;
            return true;
            
        } catch (error) {
            console.error('[EMNIST] Failed to load model:', error);
            this.isModelLoading = false;
            this.isModelLoaded = false;
            return false;
        }
    }
    
    /**
     * キャンバスから画像データを取得し前処理
     */
    preprocessCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // グレースケール化
        let grayData = this.toGrayscale(imageData);
        
        // 白黒反転（オプション）
        if (this.debugSettings.invert) {
            grayData = this.invertColors(grayData, canvas.width, canvas.height);
        }
        
        // トリミング（オプション）
        let trimmed = grayData;
        let bbox = { x: 0, y: 0, width: canvas.width, height: canvas.height };
        
        if (this.debugSettings.trim) {
            const trimResult = this.trimWhitespace(grayData, canvas.width, canvas.height);
            trimmed = trimResult.data;
            bbox = trimResult.bbox;
        }
        
        // 28x28にリサイズ＋中心化
        const resized = this.resizeAndCenter(
            trimmed, 
            bbox.width, 
            bbox.height, 
            28, 
            28,
            this.debugSettings.center
        );
        
        // 正規化 (0-1)
        const normalized = this.normalize(resized);
        
        return {
            data: normalized,
            bbox: bbox
        };
    }
    
    /**
     * グレースケール化
     */
    toGrayscale(imageData) {
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(imageData.width * imageData.height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // グレースケール値 (輝度)
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // アルファチャンネルを考慮（透明部分は白）
            const opacity = a / 255;
            const finalGray = Math.round(gray * opacity + 255 * (1 - opacity));
            
            grayData[i / 4] = finalGray;
        }
        
        return grayData;
    }
    
    /**
     * 白黒反転
     */
    invertColors(grayData, width, height) {
        const inverted = new Uint8ClampedArray(grayData.length);
        for (let i = 0; i < grayData.length; i++) {
            inverted[i] = 255 - grayData[i];
        }
        return inverted;
    }
    
    /**
     * 余白トリミング（バウンディングボックス抽出）
     */
    trimWhitespace(grayData, width, height, threshold = 10) {
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasContent = false;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (grayData[idx] > threshold) {
                    hasContent = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        // コンテンツがない場合
        if (!hasContent) {
            return {
                data: new Uint8ClampedArray(1).fill(0),
                bbox: { x: 0, y: 0, width: 1, height: 1 }
            };
        }
        
        const bboxWidth = maxX - minX + 1;
        const bboxHeight = maxY - minY + 1;
        const trimmedData = new Uint8ClampedArray(bboxWidth * bboxHeight);
        
        for (let y = 0; y < bboxHeight; y++) {
            for (let x = 0; x < bboxWidth; x++) {
                const srcIdx = (minY + y) * width + (minX + x);
                const dstIdx = y * bboxWidth + x;
                trimmedData[dstIdx] = grayData[srcIdx];
            }
        }
        
        return {
            data: trimmedData,
            bbox: { x: minX, y: minY, width: bboxWidth, height: bboxHeight }
        };
    }
    
    /**
     * リサイズ＋中心化
     */
    resizeAndCenter(data, srcWidth, srcHeight, dstWidth, dstHeight, enableCenter = true) {
        const result = new Uint8ClampedArray(dstWidth * dstHeight).fill(0);
        
        // アスペクト比を保持してリサイズ
        const scale = Math.min(dstWidth / srcWidth, dstHeight / srcHeight);
        const scaledWidth = Math.round(srcWidth * scale);
        const scaledHeight = Math.round(srcHeight * scale);
        
        // 中心化オフセット
        const offsetX = enableCenter ? Math.floor((dstWidth - scaledWidth) / 2) : 0;
        const offsetY = enableCenter ? Math.floor((dstHeight - scaledHeight) / 2) : 0;
        
        // バイリニア補間でリサイズ
        for (let y = 0; y < scaledHeight; y++) {
            for (let x = 0; x < scaledWidth; x++) {
                const srcX = x / scale;
                const srcY = y / scale;
                
                const x0 = Math.floor(srcX);
                const x1 = Math.min(x0 + 1, srcWidth - 1);
                const y0 = Math.floor(srcY);
                const y1 = Math.min(y0 + 1, srcHeight - 1);
                
                const dx = srcX - x0;
                const dy = srcY - y0;
                
                const v00 = data[y0 * srcWidth + x0];
                const v10 = data[y0 * srcWidth + x1];
                const v01 = data[y1 * srcWidth + x0];
                const v11 = data[y1 * srcWidth + x1];
                
                const v0 = v00 * (1 - dx) + v10 * dx;
                const v1 = v01 * (1 - dx) + v11 * dx;
                const value = v0 * (1 - dy) + v1 * dy;
                
                const dstX = offsetX + x;
                const dstY = offsetY + y;
                
                if (dstX >= 0 && dstX < dstWidth && dstY >= 0 && dstY < dstHeight) {
                    result[dstY * dstWidth + dstX] = Math.round(value);
                }
            }
        }
        
        return result;
    }
    
    /**
     * 正規化 (0-1)
     */
    normalize(data) {
        const normalized = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            normalized[i] = data[i] / 255.0;
        }
        return normalized;
    }
    
    /**
     * 推論実行
     */
    async predict(canvas) {
        if (!this.isModelLoaded) {
            console.warn('[EMNIST] Model not loaded yet');
            return null;
        }
        
        // 前処理
        const preprocessed = this.preprocessCanvas(canvas);
        const inputData = preprocessed.data;
        
        // テンソルに変換
        const inputTensor = tf.tensor4d(inputData, [1, 28, 28, 1]);
        
        // 推論
        const predictions = this.model.predict(inputTensor);
        const probabilities = await predictions.data();
        
        // top-k を計算
        const topK = this.getTopK(probabilities, 5);
        
        // クリーンアップ
        inputTensor.dispose();
        predictions.dispose();
        
        return {
            topK: topK,
            preprocessed: preprocessed
        };
    }
    
    /**
     * Top-K候補を取得
     */
    getTopK(probabilities, k = 5) {
        const results = [];
        
        for (let i = 0; i < probabilities.length; i++) {
            results.push({ index: i, probability: probabilities[i] });
        }
        
        // 確率降順でソート
        results.sort((a, b) => b.probability - a.probability);
        
        // 上位k件を取得してラベルに変換
        const topK = results.slice(0, k).map(item => ({
            label: this.labelMap[item.index] || `[${item.index}]`,
            probability: item.probability,
            index: item.index
        }));
        
        return topK;
    }
    
    /**
     * デバッグ用: 前処理後の画像を表示
     */
    drawPreprocessedImage(data, canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(28, 28);
        
        for (let i = 0; i < data.length; i++) {
            const value = Math.round(data[i] * 255);
            imageData.data[i * 4] = value;
            imageData.data[i * 4 + 1] = value;
            imageData.data[i * 4 + 2] = value;
            imageData.data[i * 4 + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
}

// グローバルインスタンス
window.handwritingRecognition = new HandwritingRecognition();

