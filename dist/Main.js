var _a;
import Graphics from './Graphics.js';
import { BrushManager } from './Brush.js';
import AlcoholMarkerBrush from './brushes/AlcoholMarker.js';
import Eraser from './brushes/Eraser.js';
import { InkDB } from './DB.js';
import { debounce } from './Util.js';
/** @type {HTMLCanvasElement} */
const cvs = document.getElementById('c');
/** @type {WebGL2RenderingContext} */
const gl = cvs.getContext('webgl2', { preserveDrawingBuffer: true });
/** 描画ログ（後で IndexedDB へ保存 */
let currentStrokeLog = null;
let strokes = []; // 全体のストロークログ
let selectedColor = "";
let selectedAlpha = 1.0; // 初期透明度
const brushManager = new BrushManager(gl);
brushManager.registerBrush(await AlcoholMarkerBrush.create(gl, cvs));
brushManager.registerBrush(await Eraser.create(gl, cvs));
let screenDirty = false;
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    cvs.width = cvs.clientWidth * dpr;
    cvs.height = cvs.clientHeight * dpr;
    gl.viewport(0, 0, cvs.width, cvs.height);
}
resizeCanvas();
addEventListener('resize', resizeCanvas); // ウィンドウ拡大縮小にも対応
// 画面クリア
gl.clearColor(1, 1, 1, 1); // 背景は白
gl.clear(gl.COLOR_BUFFER_BIT);
/* =========  Ink presenter の初期化  ========= */
let inkPresenter = null;
/* === グローバル変数 ================== */
let prev = { x: 0, y: 0, p: 0 };
// 描画中フラグ
let drawing = false;
// ベジェ曲線の滑らかさ（0–1 で曲げ具合）
const smoothness = 0.5;
// 高頻度リスナ存在判定フラグ（RAW があればそちらだけ）
const useRAW = 'onpointerrawupdate' in window;
const queue = [];
// ★ ベジェ計算用の履歴バッファ（常に最新 3～4 点保持）
const pts = [];
/* ==== 線幅 UI ==== */
const sizeInput = document.getElementById('size');
const preview = document.getElementById('preview');
let maxStroke = +sizeInput.value; // 「筆圧1.0」のときの線幅
const graphics = new Graphics(gl);
if ('ink' in navigator && ((_a = navigator.ink) === null || _a === void 0 ? void 0 : _a.requestPresenter)) {
    // canvas を描画領域として OS に渡す
    navigator.ink.requestPresenter({ presentationArea: cvs })
        .then(p => inkPresenter = p) // DelegatedInkTrailPresenter
        .catch(console.error);
}
sizeInput.addEventListener('input', () => {
    maxStroke = +sizeInput.value;
    // プレビュー丸を拡大縮小
    preview.style.transform = `scale(${maxStroke / 10})`;
});
cvs.addEventListener('pointerdown', e => {
    const currentBrush = brushManager.getCurrentBrush();
    if (currentBrush === null) {
        // ブラシが選択されていない場合は何もしない
        return;
    }
    drawing = true;
    pts.length = 0; // ★ 履歴リセット
    queue.length = 0; // ★ キューも空に
    prev = null;
    lastEvt = null;
    // ストローク開始
    currentStrokeLog = {
        id: crypto.randomUUID(),
        color: selectedColor,
        alpha: selectedAlpha,
        tool: currentBrush.name,
        width: maxStroke,
        layer: 0, // レイヤ番号（未使用）
        startedAt: performance.now(),
        points: []
    };
    // この押し始めイベント自体を一番目の点として格納
    addSample(e, currentStrokeLog);
    cvs.setPointerCapture(e.pointerId);
});
if ('onpointerrawupdate' in window) {
    // 高頻度リスナ（対応ブラウザだけ）
    cvs.addEventListener('pointerrawupdate', draw);
}
else {
    cvs.addEventListener('pointermove', draw);
}
['pointerup', 'pointercancel', 'lostpointercapture', 'pointerout']
    .forEach(ev => cvs.addEventListener(ev, () => {
    drawing = false;
    graphics.reset(); // 台形の法線ベクトルをリセット
    if (currentStrokeLog != null) {
        strokes.push(currentStrokeLog); // 全体のログ配列へ確定
        currentStrokeLog = null;
        autoSaveDraft(); // 自動保存
    }
}));
let lastEvt = null;
function draw(e) {
    if (!drawing)
        return; // `buttons` で判定しない
    if (currentStrokeLog === null) {
        console.warn('No current stroke log. Drawing ignored.');
        return;
    }
    // ① このフレームに溜まっていた全サンプルを取得
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of list) {
        addSample(e, currentStrokeLog);
    }
    screenDirty = true;
}
/* ▼ addSample: PointerEvent → queue へ push */
function addSample(e, stroke) {
    // 筆圧を決定
    const pressure = (e.pointerType === 'pen') ? e.pressure : 0.5;
    //console.log(`pressure: ${pressure}`);
    // 後段で使いやすいシンプルなオブジェクトにして queue へ
    queue.push({
        x: e.offsetX,
        y: e.offsetY,
        p: pressure // 筆圧 (0–1)
    });
    // t = ストローク開始からの経過 ms
    const time = performance.now() - stroke.startedAt;
    stroke.points.push({
        x: e.offsetX,
        y: e.offsetY,
        p: pressure,
        t: time
    });
    // Ink API で使う“最新の生イベント”を保持
    if (inkPresenter && e.pointerType === 'pen' && e.isTrusted) {
        // rAF 中に 1 回だけ trail 更新に使う
        lastEvt = e;
    }
}
const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', savePng);
function savePng() {
    /* blob 化（モダンブラウザはこれで十分） */
    if (cvs.toBlob) {
        cvs.toBlob(blob => {
            if (blob)
                triggerDownload(blob);
        }, 'image/png');
        return;
    }
    /* 古い Safari 用フォールバック（toBlob 未実装） */
    const dataURL = cvs.toDataURL('image/png');
    // dataURL → blob 化してから download するとメモリ効率◎
    fetch(dataURL)
        .then(res => res.blob())
        .then(triggerDownload);
}
function triggerDownload(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
    a.click(); // 自動で保存ダイアログ or 即ダウンロード
    URL.revokeObjectURL(url); // メモリ解放
}
function toNDC(x, y) {
    return [
        (x / cvs.clientWidth) * 2 - 1, // ← clientWidth は CSS px
        -(y / cvs.clientHeight) * 2 + 1
    ];
}
// ====== 1) パレット定義（12色） ======
const COLORS = [
    { name: '白', hex: '#FFFFFF' }, { name: '黒', hex: '#000000' },
    { name: '赤', hex: '#EA3323' }, { name: 'だいだい', hex: '#FF8A00' },
    { name: '黄', hex: '#FFD400' }, { name: '黄緑', hex: '#9CCC65' },
    { name: '緑', hex: '#2E7D32' }, { name: '水色', hex: '#4FC3F7' },
    { name: '青', hex: '#1E88E5' }, { name: '紫', hex: '#8E24AA' },
    { name: '茶', hex: '#8D6E63' }, { name: '桃', hex: '#F48FB1' },
];
// ====== 2) DOM 生成 ======
const palette = document.getElementById('palette');
let selectedIdx = 2; // 初期色：赤
COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = c.hex;
    b.role = 'radio';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', c.name);
    b.setAttribute('aria-checked', i === selectedIdx ? 'true' : 'false');
    b.dataset.index = i.toString();
    palette.appendChild(b);
});
palette.addEventListener('click', e => {
    const elm = e.target;
    const b = elm.closest('.swatch');
    if (!b) {
        return;
    }
    if (b.dataset.index !== undefined) {
        selectColor(+b.dataset.index);
    }
});
palette.addEventListener('keydown', e => {
    const cols = 6, n = COLORS.length;
    let i = selectedIdx;
    if (e.key === 'ArrowRight')
        i = (i + 1) % n;
    else if (e.key === 'ArrowLeft')
        i = (i - 1 + n) % n;
    else if (e.key === 'ArrowDown')
        i = Math.min(i + cols, n - 1);
    else if (e.key === 'ArrowUp')
        i = Math.max(i - cols, 0);
    else if (e.key === ' ' || e.key === 'Enter') { /* 選択トグル */ }
    else
        return;
    e.preventDefault();
    selectColor(i);
    palette.children[i].focus();
});
// ====== 3) 透明度（筆の濃さ） ======
const alphaEl = document.getElementById('alpha');
const alphaVal = document.getElementById('alphaVal');
alphaEl.addEventListener('input', () => {
    alphaVal.textContent = (+alphaEl.value).toFixed(2);
    applyColorToCache(); // αのみ更新
});
// ====== 4) 色選択と WebGL への反映 ======
function selectColor(i) {
    palette.querySelectorAll('.swatch').forEach((el, idx) => {
        el.setAttribute('aria-checked', idx === i ? 'true' : 'false');
    });
    selectedIdx = i;
    applyColorToCache();
}
// hex → [0..1] RGB
function hexToRgb01(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [0, 0, 0];
}
function getSelectedColor() {
    const [r, g, b] = hexToRgb01(COLORS[selectedIdx].hex);
    const a = +alphaEl.value;
    //gl.useProgram(program);
    // アルコールマーカー風（減法合成）シェーダ前提：
    // FS 側で RGB→CMY を行うので、ここは普通の RGB/α を渡す
    //gl.uniform4f(u_rgbA, r, g, b, a);
    return [r, g, b, a];
}
function applyColorToCache() {
    selectedColor = COLORS[selectedIdx].hex;
    selectedAlpha = +alphaEl.value;
}
applyColorToCache(); // 初期色を反映
const penBtn = document.getElementById('penBtn');
penBtn.addEventListener('click', (e) => {
    brushManager.useBrush('AlcoholMarkerBrush');
});
const eraserBtn = document.getElementById('eraserBtn');
eraserBtn.addEventListener('click', (e) => {
    brushManager.useBrush('Eraser');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'e') {
        brushManager.useBrush('Eraser');
    }
    if (e.key === 'p') {
        brushManager.useBrush('AlcoholMarkerBrush');
    }
});
// 初期ブラシを選択
brushManager.useBrush('AlcoholMarkerBrush');
const pp = graphics.createPingPong(gl, cvs.width, cvs.height); // ★1回だけ
/* ------------- 60fps でまとめ描き ------------- */
function tick() {
    if (!screenDirty) {
        requestAnimationFrame(tick);
        return;
    }
    // 1) 今フレームの入力（筆/消しなど）を write 側に描く
    // beginFBO(gl, pp.write);
    // gl.viewport(0, 0, pp.write.width, pp.write.height);
    //gl.clearColor(0, 0, 0, 0);                // 透明クリア（必要なら）
    //gl.clear(gl.COLOR_BUFFER_BIT);
    drawBrushToTexture(); // あなたの筆ストローク
    // // 2) 合成パス： read(前フレーム) と write を使って新しい結果を作る
    // beginFBO(gl, pp.read);
    // runCompositePass(pp.read.tex, pp.write.tex);
    // // 3) 次フレームに備えて役割を入れ替え
    // pp.swap();
    // // 4) 画面表示（デフォルトFBO）
    // beginFBO(gl, null);
    // drawFullscreenQuad(pp.read.tex);
    screenDirty = false;
    requestAnimationFrame(tick);
}
// ループ開始
tick();
function drawBrushToTexture() {
    const [r, g, b, a] = getSelectedColor();
    graphics.enable(); // VBO 有効化
    /* ---- ① 新サンプルを履歴 pts へ追加 ---- */
    while (queue.length) {
        const n = queue.shift();
        if (n !== undefined) {
            pts.push(n);
        }
        if (pts.length > 4)
            pts.shift(); // 古すぎる点は捨て、常に 4 点以下
    }
    if (prev == null) {
        // ペン先の初期位置だけ記憶して次フレームへ
        prev = pts[0];
    }
    let lineWidthPrev = 1.0;
    let lineWidth1 = 1.0;
    let alpha1 = 1.0;
    if (pts.length >= 2) {
        const [p1, p2] = pts.slice(-2);
        // 線幅は p2 の筆圧を使用（中央付近が最も太く見える）
        lineWidthPrev = maxStroke * prev.p;
        lineWidth1 = maxStroke * p1.p;
        let prevAlpha = 1.0;
        if (lineWidthPrev < 1.0) {
            prevAlpha = lineWidthPrev;
        }
        alpha1 = 1.0;
        if (lineWidth1 < 1.0) {
            alpha1 = lineWidth1;
        }
        const prevPoint = new Float32Array([prev.x, prev.y]);
        const point1 = new Float32Array([p1.x, p1.y]);
        graphics.updateQuadTrapezoid(cvs, prevPoint, point1, lineWidthPrev, lineWidth1, prevAlpha, alpha1, r, g, b, a);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        // ★ ベジェ終点 → 次フレームの始点
        prev = p1;
    }
    // Ink API 併用なら 1 フレーム 1 回で OK
    if (inkPresenter && lastEvt && drawing && lineWidth1 > 0) {
        const colorStr = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a * alpha1})`;
        inkPresenter.updateInkTrailStartPoint(lastEvt, { diameter: lineWidth1, color: colorStr });
        // 1 フレーム 1 回に抑制
        lastEvt = null;
    }
    graphics.disable(); // VBO 無効化
}
function runCompositePass() {
}
async function saveDraft() {
    console.log('Saving draft...');
    const db = await InkDB.get();
    // ストロークログ保存
    await db.saveDraft({
        strokes: [], // → ストロークログ配列
        pngBlob: new Blob(), // → PNG Blob
        updated: Date.now()
    });
}
/** 保存関数を 1.5 秒デバウンスして自動保存 */
const autoSaveDraft = debounce(() => saveDraft(), 1500);
