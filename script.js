document.addEventListener('DOMContentLoaded', function() {
    // キャンバスの設定
    const canvas = document.getElementById('vectorCanvas');
    const ctx = canvas.getContext('2d');
    
    // 入力フィールドの取得
    const vectorAxInput = document.getElementById('vectorAx');
    const vectorAyInput = document.getElementById('vectorAy');
    const vectorBxInput = document.getElementById('vectorBx');
    const vectorByInput = document.getElementById('vectorBy');
    const dotProductOutput = document.getElementById('dotProduct');
    
    // キャンバスのサイズ
    let width = canvas.width;
    let height = canvas.height;
    
    // 原点を中心に移動
    let centerX = width / 2;
    let centerY = height / 2;
    
    // グリッドのセルサイズ
    const gridSize = 40;
    
    // スケール（1単位あたりの画素数）
    const scale = gridSize;
    
    // ベクトルの初期値
    let vectorA = { x: parseFloat(vectorAxInput.value), y: parseFloat(vectorAyInput.value) };
    let vectorB = { x: parseFloat(vectorBxInput.value), y: parseFloat(vectorByInput.value) };
    
    // ドラッグ関連の変数
    let isDragging = false;
    let selectedVector = null;
    let dragRadius = 10; // ドラッグ開始のための検出半径（タッチデバイスでは自動的に大きくなる）
    
    // キャンバスサイズ調整（横長表示対応）
    function resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        const containerWidth = container.clientWidth;
        
        // キャンバスの表示サイズをCSSで調整
        // 内部解像度は維持（ピクセル比を考慮）
        const pixelRatio = window.devicePixelRatio || 1;
        
        // タッチデバイスの場合、ドラッグ検出半径を大きくする
        if ('ontouchstart' in window) {
            dragRadius = 15; // タッチ向けに大きめに設定
        }
        
        // 中心点を再計算
        width = canvas.width;
        height = canvas.height;
        centerX = width / 2;
        centerY = height / 2;
        
        // 再描画
        drawAll();
    }
    
    // 初期化時とウィンドウリサイズ時にキャンバスサイズを調整
    window.addEventListener('resize', resizeCanvas);
    
    // 入力フィールドの変更イベントリスナー
    vectorAxInput.addEventListener('input', updateVectorsFromInputs);
    vectorAyInput.addEventListener('input', updateVectorsFromInputs);
    vectorBxInput.addEventListener('input', updateVectorsFromInputs);
    vectorByInput.addEventListener('input', updateVectorsFromInputs);
    
    // 入力フィールドから値を取得してベクトルを更新する関数
    function updateVectorsFromInputs() {
        vectorA = { 
            x: parseFloat(vectorAxInput.value) || 0, 
            y: parseFloat(vectorAyInput.value) || 0 
        };
        vectorB = { 
            x: parseFloat(vectorBxInput.value) || 0, 
            y: parseFloat(vectorByInput.value) || 0 
        };
        drawAll();
    }
    
    // マウスイベントリスナーの追加
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // キャンバス外に出た場合もドラッグ終了
    
    // タッチイベントリスナーの追加
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    // マウスダウンイベントの処理
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        checkVectorSelection(mouseX, mouseY);
    }
    
    // タッチスタートイベントの処理
    function handleTouchStart(e) {
        e.preventDefault(); // デフォルトのスクロール動作を防止
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            checkVectorSelection(touchX, touchY);
        }
    }
    
    // ベクトル選択のチェック（マウスとタッチで共通の処理）
    function checkVectorSelection(x, y) {
        // ベクトルの先端の座標を計算
        const endPointA = {
            x: centerX + vectorA.x * scale,
            y: centerY - vectorA.y * scale
        };
        
        const endPointB = {
            x: centerX + vectorB.x * scale,
            y: centerY - vectorB.y * scale
        };
        
        // ポインタがベクトルの先端に近いかチェック
        const distToA = Math.sqrt(Math.pow(x - endPointA.x, 2) + Math.pow(y - endPointA.y, 2));
        const distToB = Math.sqrt(Math.pow(x - endPointB.x, 2) + Math.pow(y - endPointB.y, 2));
        
        if (distToA < dragRadius) {
            isDragging = true;
            selectedVector = 'A';
        } else if (distToB < dragRadius) {
            isDragging = true;
            selectedVector = 'B';
        }
    }
    
    // マウス移動イベントの処理
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        updateVectorPosition(mouseX, mouseY);
    }
    
    // タッチ移動イベントの処理
    function handleTouchMove(e) {
        e.preventDefault(); // デフォルトのスクロール動作を防止
        
        if (!isDragging) return;
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            updateVectorPosition(touchX, touchY);
        }
    }
    
    // ベクトル位置の更新（マウスとタッチで共通の処理）
    function updateVectorPosition(x, y) {
        // キャンバス座標からベクトル座標に変換
        const vectorX = (x - centerX) / scale;
        const vectorY = (centerY - y) / scale; // y軸は反転
        
        if (selectedVector === 'A') {
            vectorA = { x: vectorX, y: vectorY };
            // 入力フィールドも更新（2桁に丸める）
            vectorAxInput.value = Math.round(vectorX * 100) / 100;
            vectorAyInput.value = Math.round(vectorY * 100) / 100;
        } else if (selectedVector === 'B') {
            vectorB = { x: vectorX, y: vectorY };
            // 入力フィールドも更新（2桁に丸める）
            vectorBxInput.value = Math.round(vectorX * 100) / 100;
            vectorByInput.value = Math.round(vectorY * 100) / 100;
        }
        
        // 再描画
        drawAll();
    }
    
    // マウスアップイベントの処理
    function handleMouseUp() {
        isDragging = false;
        selectedVector = null;
    }
    
    // タッチエンドイベントの処理
    function handleTouchEnd() {
        isDragging = false;
        selectedVector = null;
    }
    
    // キャンバスをクリアする関数
    function clearCanvas() {
        ctx.clearRect(0, 0, width, height);
    }
    
    // グリッドを描画する関数
    function drawGrid() {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // 水平線
        for (let y = centerY; y >= 0; y -= gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        for (let y = centerY + gridSize; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 垂直線
        for (let x = centerX; x >= 0; x -= gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let x = centerX + gridSize; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // x軸とy軸を強調表示
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 2;
        
        // x軸
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // y軸
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();
        
        // 目盛りの表示
        ctx.fillStyle = '#606060';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // x軸の目盛り
        for (let i = -Math.floor(centerX / gridSize); i <= Math.floor(centerX / gridSize); i++) {
            if (i === 0) continue; // 原点は表示しない
            const x = centerX + i * gridSize;
            ctx.fillText(i.toString(), x, centerY + 15);
        }
        
        // y軸の目盛り（y座標は上が負、下が正になるため反転させる）
        for (let i = -Math.floor(centerY / gridSize); i <= Math.floor(centerY / gridSize); i++) {
            if (i === 0) continue; // 原点は表示しない
            const y = centerY - i * gridSize;
            ctx.fillText(i.toString(), centerX - 15, y);
        }
        
        // 原点の表示
        ctx.fillText('O', centerX - 10, centerY + 15);
    }      // ベクトルを描画する関数
    function drawVector(start, vector, color, label) {
        const endX = start.x + vector.x * scale;
        const endY = start.y - vector.y * scale; // y軸は下が正なので反転
        
        // ベクトルの線
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 矢印の先端
        const headLength = 12;
        // ベクトルの角度を正確に計算
        const dx = endX - start.x;
        const dy = endY - start.y;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        // ラベル
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            label,
            endX + 15 * Math.cos(angle),
            endY + 15 * Math.sin(angle)
        );
    }
    
    // 内積を計算する関数
    function calculateDotProduct(vecA, vecB) {
        return vecA.x * vecB.x + vecA.y * vecB.y;
    }
    
    // すべての要素を描画する関数
    function drawAll() {
        clearCanvas();
        drawGrid();
        
        // 原点からベクトルを描画
        const origin = { x: centerX, y: centerY };
        drawVector(origin, vectorA, '#FF5733', 'A');
        drawVector(origin, vectorB, '#3498DB', 'B');
        
        // 内積を計算して表示
        const dotProduct = calculateDotProduct(vectorA, vectorB);
        dotProductOutput.textContent = dotProduct.toFixed(2);
    }
    
    // 初期描画とキャンバスサイズ調整
    drawAll();
    resizeCanvas();
    
    // カーソルスタイルの変更
    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        updateCursorStyle(mouseX, mouseY);
    });
    
    // タッチ移動時のカーソルスタイル（視覚的フィードバック用）
    canvas.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            updateCursorStyle(touchX, touchY);
        }
    }, { passive: true });
    
    // カーソルスタイルの更新（マウスとタッチで共通の処理）
    function updateCursorStyle(x, y) {
        const endPointA = {
            x: centerX + vectorA.x * scale,
            y: centerY - vectorA.y * scale
        };
        
        const endPointB = {
            x: centerX + vectorB.x * scale,
            y: centerY - vectorB.y * scale
        };
        
        const distToA = Math.sqrt(Math.pow(x - endPointA.x, 2) + Math.pow(y - endPointA.y, 2));
        const distToB = Math.sqrt(Math.pow(x - endPointB.x, 2) + Math.pow(y - endPointB.y, 2));
        
        if (distToA < dragRadius || distToB < dragRadius) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    }
});
