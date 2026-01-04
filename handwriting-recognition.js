/**
 * EMNIST手書き文字認識モジュール（高精度版）
 * 
 * 設計思想：
 * - EMNIST学習済みモデル（28×28, 白背景・黒文字）を想定
 * - スマホ手書き入力の精度最大化を目的
 * - 前処理を厳密に実装し、モデル入力と学習データの分布を一致させる
 */

class HandwritingRecognition {
    constructor() {
        this.model = null;
        this.isModelLoading = false;
        this.isModelLoaded = false;
        
        // EMNIST a-z (26クラス) ラベルマップ
        this.labelMap = this.createLabelMap();
        
        // 前処理設定（精度向上ポイント）
        this.preprocessSettings = {
            // 【重要】EMNISTは白背景・黒文字なので反転が必要
            invert: true,
            
            // 【重要】文字領域のトリミング
            trim: true,
            
            // 【重要】重心による中央寄せ（バウンディングボックス中央より精度向上）
            centerByMass: true,
            
            // 【重要】正方形パディング（EMNISTは文字周囲に余白がある）
            padding: 4, // 28x28のうち4ピクセル分の余白
            
            // 二値化しきい値（0=無効、1-255=有効）
            // EMNISTは綺麗な二値画像なので、適度な二値化で精度向上
            binarizeThreshold: 128,
            
            // 線の太さ正規化（EMNISTの線は太め）
            normalizeStrokeWidth: true
        };
        
        // 入力検証設定
        this.validationSettings = {
            // 最小文字面積率（キャンバス面積に対して）
            minAreaRatio: 0.005,
            // 最大文字面積率
            maxAreaRatio: 0.8,
            // 複数文字検出用のアスペクト比しきい値
            maxAspectRatio: 3.0
        };
        
        // 混同しやすい文字ペアと形状特徴
        this.confusionPairs = {
            'l': ['i'], // lとi
            'o': ['a', 'e'], // oとa、e
            'q': ['g'], // qとg
            'u': ['v'], // uとv
            'n': ['m', 'h'], // nとm、h
            'c': ['e'], // cとe
            'b': ['d'], // bとd
            'p': ['q'] // pとq
        };
    }
    
    // ========================================
    // ラベルマップ作成
    // ========================================
    createLabelMap() {
        const map = {};
        for (let i = 0; i < 26; i++) {
            map[i] = String.fromCharCode(97 + i); // 'a' = 97
        }
        return map;
    }
    
    // ========================================
    // モデル読み込み
    // ========================================
    async loadModel() {
        if (this.isModelLoaded) {
            console.log('[EMNIST] Model already loaded');
            return true;
        }
        
        if (this.isModelLoading) {
            let waitTime = 0;
            while (this.isModelLoading && waitTime < 15000) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitTime += 100;
            }
            return this.isModelLoaded;
        }
        
        try {
            this.isModelLoading = true;
            this.showDebugMessage('モデル読み込み開始...');
            
            // TensorFlow.js が読み込まれているか確認
            if (typeof tf === 'undefined') {
                throw new Error('TensorFlow.js が読み込まれていません');
            }
            
            // バックエンドの準備を待つ
            await tf.ready();
            this.showDebugMessage('TF準備完了: ' + tf.getBackend());
            
            this.model = await tf.loadLayersModel('emnist_final/model.json');
            this.showDebugMessage('モデル読み込み完了');
            
            // ウォームアップ（初回推論の遅延を解消）
            const dummyInput = tf.zeros([1, 28, 28, 1]);
            const warmupResult = this.model.predict(dummyInput);
            warmupResult.dispose();
            dummyInput.dispose();
            
            this.isModelLoaded = true;
            this.isModelLoading = false;
            this.showDebugMessage('準備完了');
            return true;
            
        } catch (error) {
            console.error('[EMNIST] Load error:', error);
            this.showDebugMessage('エラー: ' + error.message);
            this.isModelLoading = false;
            return false;
        }
    }
    
    // デバッグメッセージを候補欄に表示
    showDebugMessage(msg) {
        console.log('[EMNIST] ' + msg);
        const predictions = document.getElementById('hwQuizPredictions');
        if (predictions) {
            predictions.innerHTML = `<span class="hw-candidates-placeholder">${msg}</span>`;
        }
    }
    
    // ========================================
    // メイン推論関数
    // ========================================
    async predict(canvas) {
        if (!this.isModelLoaded) {
            console.warn('[EMNIST] Model not loaded');
            return null;
        }
        
        // Step 1: 入力検証
        const validation = this.validateInput(canvas);
        if (!validation.valid) {
            console.warn('[EMNIST] Invalid input:', validation.reason);
            return {
                topK: [],
                preprocessed: null,
                error: validation.reason
            };
        }
        
        // Step 2: 前処理パイプライン
        const preprocessed = this.preprocessCanvas(canvas);
        
        // Step 3: 推論
        const inputTensor = tf.tensor4d(preprocessed.data, [1, 28, 28, 1]);
        const predictions = this.model.predict(inputTensor);
        const probabilities = await predictions.data();
        
        inputTensor.dispose();
        predictions.dispose();
        
        // Step 4: Top-K取得
        let topK = this.getTopK(probabilities, 5);
        
        // Step 5: 形状ヒューリスティックによる補正
        topK = this.applyShapeHeuristics(topK, preprocessed);
        
        return {
            topK: topK,
            preprocessed: preprocessed,
            validation: validation
        };
    }
    
    // ========================================
    // 入力検証（精度向上ポイント②）
    // ========================================
    validateInput(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 非白ピクセル（文字部分）をカウント
        let inkPixels = 0;
        let minX = canvas.width, maxX = 0;
        let minY = canvas.height, maxY = 0;
        
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
                
                // 非白ピクセル検出（背景が白の場合）
                const brightness = (r + g + b) / 3;
                const isInk = a > 128 && brightness < 200;
                
                if (isInk) {
                    inkPixels++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        const totalPixels = canvas.width * canvas.height;
        const areaRatio = inkPixels / totalPixels;
        
        // 検証1: 何も書かれていない
        if (inkPixels < 10) {
            return { valid: false, reason: 'no_content' };
        }
        
        // 検証2: 文字が小さすぎる
        if (areaRatio < this.validationSettings.minAreaRatio) {
            return { valid: false, reason: 'too_small' };
        }
        
        // 検証3: 文字が大きすぎる
        if (areaRatio > this.validationSettings.maxAreaRatio) {
            return { valid: false, reason: 'too_large' };
        }
        
        // 検証4: アスペクト比チェック（複数文字検出）
        const bboxWidth = maxX - minX + 1;
        const bboxHeight = maxY - minY + 1;
        const aspectRatio = Math.max(bboxWidth, bboxHeight) / Math.min(bboxWidth, bboxHeight);
        
        if (aspectRatio > this.validationSettings.maxAspectRatio && bboxWidth > bboxHeight * 2) {
            return { valid: false, reason: 'multiple_chars' };
        }
        
        return {
            valid: true,
            inkPixels: inkPixels,
            areaRatio: areaRatio,
            aspectRatio: aspectRatio,
            bbox: { minX, minY, maxX, maxY, width: bboxWidth, height: bboxHeight }
        };
    }
    
    /**
     * 前処理パイプライン（精度向上ポイント①）
     * 
     * EMNISTモデルの重要ポイント:
     * 1. 28x28ピクセル
     * 2. 黒背景(0.0)・白文字(1.0)
     * 3. 軸が転置(Transpose)されているケースが多い
     */
    preprocessCanvas(canvas) {
        // オフスクリーンキャンバスを作成して精密な画像処理を行う
        const offscreen = document.createElement('canvas');
        offscreen.width = 28;
        offscreen.height = 28;
        const offCtx = offscreen.getContext('2d', { alpha: false });
        
        // 1. 文字領域の抽出（バウンディングボックス）
        const validation = this.validateInput(canvas);
        if (!validation.valid) return null;
        
        const { minX, minY, width, height } = validation.bbox;
        
        // 2. 28x28の中央に配置するための計算
        // EMNISTの標準: 20x20の範囲に文字を収め、4pxのパディングを置く
        const targetSize = 20;
        const scale = Math.min(targetSize / width, targetSize / height);
        const sw = width * scale;
        const sh = height * scale;
        const dx = (28 - sw) / 2;
        const dy = (28 - sh) / 2;
        
        // 3. 黒背景で塗りつぶし
        offCtx.fillStyle = 'black';
        offCtx.fillRect(0, 0, 28, 28);
        
        // 4. 文字を白で描画（リサイズ込）
        // 元のキャンバスから文字領域だけを抜き出して描画
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';
        
        // 文字だけを白くするために一時的なキャンバスを使用
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
        
        // 白文字化（反転）
        const tempImgData = tempCtx.getImageData(0, 0, width, height);
        const d = tempImgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const brightness = (d[i] + d[i+1] + d[i+2]) / 3;
            const alpha = d[i+3];
            // 黒い部分(ペン)を白(255)に、それ以外を透明に
            if (alpha > 50 && brightness < 200) {
                d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = 255;
            } else {
                d[i] = 0; d[i+1] = 0; d[i+2] = 0; d[i+3] = 0;
            }
        }
        tempCtx.putImageData(tempImgData, 0, 0);
        
        // リサイズして描画
        offCtx.drawImage(tempCanvas, dx, dy, sw, sh);
        
        // 5. ピクセルデータの取得と軸の転置
        const finalImgData = offCtx.getImageData(0, 0, 28, 28).data;
        const floatData = new Float32Array(28 * 28);
        
        /**
         * 【最重要】EMNISTの転置(Transpose)処理
         * EMNISTデータセットは(x, y)ではなく(y, x)の順で格納されている
         * これを行わないと文字が90度回転して認識される
         */
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                // 通常のインデックス
                const srcIdx = (y * 28 + x) * 4;
                // 転置したインデックス (x, y) -> y * 28 + x だが、データの並びが横縦逆
                const dstIdx = x * 28 + y;
                
                // グレースケール値(0-1)
                floatData[dstIdx] = finalImgData[srcIdx] / 255.0;
            }
        }
        
        return {
            data: floatData,
            bbox: validation.bbox
        };
    }
    
    // ========================================
    // グレースケール化（透明背景を白に合成）
    // ========================================
    toGrayscaleWithAlpha(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const grayData = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 輝度計算（ITU-R BT.601）
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // 【重要】透明部分は白（255）として合成
            // opacity = a / 255, 白 = 255
            // finalGray = gray * opacity + 255 * (1 - opacity)
            const opacity = a / 255;
            const finalGray = Math.round(gray * opacity + 255 * (1 - opacity));
            
            grayData[i / 4] = finalGray;
        }
        
        return grayData;
    }
    
    // ========================================
    // 白黒反転
    // ========================================
    invertColors(grayData) {
        const inverted = new Uint8ClampedArray(grayData.length);
        for (let i = 0; i < grayData.length; i++) {
            inverted[i] = 255 - grayData[i];
        }
        return inverted;
    }
    
    // ========================================
    // 二値化（固定しきい値）
    // ========================================
    binarize(grayData, threshold) {
        const binary = new Uint8ClampedArray(grayData.length);
        for (let i = 0; i < grayData.length; i++) {
            binary[i] = grayData[i] > threshold ? 255 : 0;
        }
        return binary;
    }
    
    // ========================================
    // 文字領域トリミング（バウンディングボックス抽出）
    // ========================================
    trimToContent(grayData, width, height) {
        const threshold = 10; // 黒とみなすしきい値
        let minX = width, minY = height, maxX = -1, maxY = -1;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grayData[y * width + x] > threshold) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        // コンテンツがない場合
        if (maxX < 0) {
            return {
                data: new Uint8ClampedArray(1).fill(0),
                bbox: { x: 0, y: 0, width: 1, height: 1 }
            };
        }
        
        const bboxW = maxX - minX + 1;
        const bboxH = maxY - minY + 1;
        const trimmed = new Uint8ClampedArray(bboxW * bboxH);
        
        for (let y = 0; y < bboxH; y++) {
            for (let x = 0; x < bboxW; x++) {
                trimmed[y * bboxW + x] = grayData[(minY + y) * width + (minX + x)];
            }
        }
        
        return {
            data: trimmed,
            bbox: { x: minX, y: minY, width: bboxW, height: bboxH }
        };
    }
    
    // ========================================
    // 重心計算（精度向上ポイント：中央寄せに使用）
    // ========================================
    calculateCenterOfMass(data, width, height) {
        let sumX = 0, sumY = 0, totalMass = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const mass = data[y * width + x];
                sumX += x * mass;
                sumY += y * mass;
                totalMass += mass;
            }
        }
        
        if (totalMass === 0) {
            return { x: width / 2, y: height / 2 };
        }
        
        return {
            x: sumX / totalMass,
            y: sumY / totalMass
        };
    }
    
    // ========================================
    // リサイズ + 重心による中央寄せ
    // ========================================
    resizeWithCenterOfMass(data, srcW, srcH, targetSize, innerSize, padding, centerOfMass, useCenterOfMass) {
        const result = new Uint8ClampedArray(targetSize * targetSize).fill(0);
        
        // アスペクト比を保持してinnerSizeに収まるようにスケーリング
        const scale = Math.min(innerSize / srcW, innerSize / srcH);
        
        // スケーリング後のサイズ
        const scaledW = Math.round(srcW * scale);
        const scaledH = Math.round(srcH * scale);
        
        // 中央寄せオフセットを計算
        let offsetX, offsetY;
        
        if (useCenterOfMass) {
            // 【重要】重心を28x28の中心(14,14)に合わせる
            const scaledCenterX = centerOfMass.x * scale;
            const scaledCenterY = centerOfMass.y * scale;
            const targetCenterX = targetSize / 2;
            const targetCenterY = targetSize / 2;
            
            offsetX = Math.round(targetCenterX - scaledCenterX);
            offsetY = Math.round(targetCenterY - scaledCenterY);
        } else {
            // バウンディングボックス中央
            offsetX = Math.round((targetSize - scaledW) / 2);
            offsetY = Math.round((targetSize - scaledH) / 2);
        }
        
        // バイリニア補間でリサイズ
        for (let y = 0; y < scaledH; y++) {
            for (let x = 0; x < scaledW; x++) {
                // ソース座標
                const srcX = x / scale;
                const srcY = y / scale;
                
                const x0 = Math.floor(srcX);
                const x1 = Math.min(x0 + 1, srcW - 1);
                const y0 = Math.floor(srcY);
                const y1 = Math.min(y0 + 1, srcH - 1);
                
                const dx = srcX - x0;
                const dy = srcY - y0;
                
                // バイリニア補間
                const v00 = data[y0 * srcW + x0];
                const v10 = data[y0 * srcW + x1];
                const v01 = data[y1 * srcW + x0];
                const v11 = data[y1 * srcW + x1];
                
                const v0 = v00 * (1 - dx) + v10 * dx;
                const v1 = v01 * (1 - dx) + v11 * dx;
                const value = v0 * (1 - dy) + v1 * dy;
                
                // ターゲット座標
                const dstX = offsetX + x;
                const dstY = offsetY + y;
                
                if (dstX >= 0 && dstX < targetSize && dstY >= 0 && dstY < targetSize) {
                    result[dstY * targetSize + dstX] = Math.round(value);
                }
            }
        }
        
        return result;
    }
    
    // ========================================
    // 正規化 (0-1)
    // ========================================
    normalize(data) {
        const normalized = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            normalized[i] = data[i] / 255.0;
        }
        return normalized;
    }
    
    // ========================================
    // Top-K候補取得
    // ========================================
    getTopK(probabilities, k = 5) {
        const results = [];
        
        for (let i = 0; i < probabilities.length; i++) {
            results.push({ index: i, probability: probabilities[i] });
        }
        
        results.sort((a, b) => b.probability - a.probability);
        
        return results.slice(0, k).map(item => ({
            label: this.labelMap[item.index] || `[${item.index}]`,
            probability: item.probability,
            index: item.index
        }));
    }
    
    // ========================================
    // 形状ヒューリスティック補正（精度向上ポイント③）
    // ========================================
    applyShapeHeuristics(topK, preprocessed) {
        if (topK.length < 2) return topK;
        
        const data = preprocessed.data;
        const width = 28, height = 28;
        
        // 形状特徴を計算
        const features = this.extractShapeFeatures(data, width, height);
        
        // 補正ルールを適用
        const corrected = [...topK];
        
        // l vs i: 上部にドットがあるかどうか
        if (this.hasConfusion(topK, 'l', 'i')) {
            const hasTopDot = features.hasTopSeparateRegion;
            if (hasTopDot) {
                this.boostLabel(corrected, 'i', 0.1);
            } else {
                this.boostLabel(corrected, 'l', 0.1);
            }
        }
        
        // o vs a: 右側に線があるか（aは右にしっぽがある）
        if (this.hasConfusion(topK, 'o', 'a')) {
            if (features.hasRightExtension) {
                this.boostLabel(corrected, 'a', 0.08);
            } else {
                this.boostLabel(corrected, 'o', 0.08);
            }
        }
        
        // q vs g: 下部の形状（qは下に伸びる、gはループ）
        if (this.hasConfusion(topK, 'q', 'g')) {
            if (features.hasBottomLoop) {
                this.boostLabel(corrected, 'g', 0.08);
            } else {
                this.boostLabel(corrected, 'q', 0.08);
            }
        }
        
        // u vs v: 底部の形状（uは丸い、vは尖っている）
        if (this.hasConfusion(topK, 'u', 'v')) {
            if (features.hasRoundedBottom) {
                this.boostLabel(corrected, 'u', 0.08);
            } else {
                this.boostLabel(corrected, 'v', 0.08);
            }
        }
        
        // c vs e: 中央に横線があるか
        if (this.hasConfusion(topK, 'c', 'e')) {
            if (features.hasCenterHorizontalLine) {
                this.boostLabel(corrected, 'e', 0.08);
            } else {
                this.boostLabel(corrected, 'c', 0.08);
            }
        }
        
        // 再ソート
        corrected.sort((a, b) => b.probability - a.probability);
        
        return corrected;
    }
    
    // ========================================
    // 形状特徴抽出
    // ========================================
    extractShapeFeatures(data, width, height) {
        const threshold = 0.3;
        
        // 上部1/4に独立した領域があるか（i のドット検出）
        const topQuarter = height / 4;
        let topRegionPixels = 0;
        let mainRegionPixels = 0;
        
        for (let y = 0; y < topQuarter; y++) {
            for (let x = 0; x < width; x++) {
                if (data[y * width + x] > threshold) topRegionPixels++;
            }
        }
        for (let y = topQuarter; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (data[y * width + x] > threshold) mainRegionPixels++;
            }
        }
        
        // 空白行があるかチェック（ドットと本体の間）
        let hasGap = false;
        for (let y = 3; y < topQuarter + 3; y++) {
            let rowSum = 0;
            for (let x = 0; x < width; x++) {
                rowSum += data[y * width + x];
            }
            if (rowSum < width * threshold * 0.1) {
                hasGap = true;
                break;
            }
        }
        
        // 右側に延長があるか（a のしっぽ）
        const rightQuarter = width * 3 / 4;
        let rightPixels = 0;
        for (let y = height / 3; y < height * 2 / 3; y++) {
            for (let x = rightQuarter; x < width; x++) {
                if (data[y * width + x] > threshold) rightPixels++;
            }
        }
        
        // 底部にループがあるか（g）
        let bottomLoopPixels = 0;
        for (let y = height * 3 / 4; y < height; y++) {
            for (let x = width / 4; x < width * 3 / 4; x++) {
                if (data[y * width + x] > threshold) bottomLoopPixels++;
            }
        }
        
        // 底部が丸いか尖っているか（u vs v）
        const bottomCenter = [];
        for (let y = height - 5; y < height; y++) {
            let centerX = 0, count = 0;
            for (let x = 0; x < width; x++) {
                if (data[y * width + x] > threshold) {
                    centerX += x;
                    count++;
                }
            }
            if (count > 0) bottomCenter.push(centerX / count);
        }
        const bottomVariance = this.variance(bottomCenter);
        
        // 中央に横線があるか（e）
        const centerY = Math.floor(height / 2);
        let centerLinePixels = 0;
        for (let x = width / 4; x < width * 3 / 4; x++) {
            if (data[centerY * width + x] > threshold) centerLinePixels++;
        }
        
        return {
            hasTopSeparateRegion: topRegionPixels > 5 && hasGap,
            hasRightExtension: rightPixels > 10,
            hasBottomLoop: bottomLoopPixels > 20,
            hasRoundedBottom: bottomVariance < 2,
            hasCenterHorizontalLine: centerLinePixels > width / 4
        };
    }
    
    // ========================================
    // ユーティリティ関数
    // ========================================
    variance(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    }
    
    hasConfusion(topK, label1, label2) {
        const labels = topK.slice(0, 3).map(t => t.label);
        return labels.includes(label1) && labels.includes(label2);
    }
    
    boostLabel(topK, label, boost) {
        const item = topK.find(t => t.label === label);
        if (item) {
            item.probability += boost;
        }
    }
    
    // ========================================
    // デバッグ用: 前処理後の画像を表示
    // ========================================
    drawPreprocessedImage(data, canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(28, 28);
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                /**
                 * デバッグ表示でも転置を戻して表示する
                 * (モデル入力データ data はすでに転置済み)
                 */
                const srcIdx = x * 28 + y;
                const dstIdx = (y * 28 + x) * 4;
                
                const value = Math.round(data[srcIdx] * 255);
                
                imageData.data[dstIdx] = value;
                imageData.data[dstIdx + 1] = value;
                imageData.data[dstIdx + 2] = value;
                imageData.data[dstIdx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // ========================================
    // 設定変更用インターフェース
    // ========================================
    setPreprocessSetting(key, value) {
        if (key in this.preprocessSettings) {
            this.preprocessSettings[key] = value;
            console.log(`[EMNIST] ${key} = ${value}`);
        }
    }
    
    getPreprocessSettings() {
        return { ...this.preprocessSettings };
    }
}

// グローバルインスタンス
window.handwritingRecognition = new HandwritingRecognition();
