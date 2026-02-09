import Graphics from './Graphics.js';
import { BrushManager } from './Brush.js';
import AlcoholMarkerBrush from './brushes/AlcoholMarker.js';
import WatercolorBrush from './brushes/watercolor.js';
import Pen from './brushes/Pen.js';
import Eraser from './brushes/Eraser.js';
import { StrokeLog, InkDB } from './DB.js';
import { debounce, makeUUID } from './Util.js';

/** @type {HTMLCanvasElement} */
const cvs = document.getElementById('c') as HTMLCanvasElement;
/** @type {WebGL2RenderingContext} */
const gl = cvs.getContext('webgl2', { preserveDrawingBuffer: true }) as WebGL2RenderingContext;

/** 描画ログを後で IndexedDB に保存するためのバッファ */
let currentStrokeLog: StrokeLog | null = null;
let strokes: StrokeLog[] = []; // 全体のストローク履歴
let saveInFlight: Promise<void> | null = null;


let selectedColor = "";
let selectedAlpha = 1.0; // 初期透過度

const brushManager = new BrushManager(gl);
brushManager.registerBrush(await AlcoholMarkerBrush.create(gl, cvs));
brushManager.registerBrush(await WatercolorBrush.create(gl, cvs));
brushManager.registerBrush(await Pen.create(gl, cvs));
brushManager.registerBrush(await Eraser.create(gl, cvs));

let screenDirty = false;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    cvs.width = cvs.clientWidth * dpr;
    cvs.height = cvs.clientHeight * dpr;

    gl.viewport(0, 0, cvs.width, cvs.height);
}

resizeCanvas();
addEventListener('resize', resizeCanvas);   // ウィンドウのリサイズにも対応

// 逕ｻ髱｢繧ｯ繝ｪ繧｢
gl.clearColor(1, 1, 1, 1); // 閭梧勹縺ｯ逋ｽ
gl.clear(gl.COLOR_BUFFER_BIT);


/* =========  Ink presenter の初期化 ========= */
let inkPresenter: any = null;

/* === グローバル変数 ================== */
let prev: DrawSample | null = { x: 0, y: 0, p: 0 };
// 描画中かどうかのフラグ
let drawing = false;
// ベジェ曲線の滑らかさ係数 (0〜1)
const smoothness = 0.5;
// 高頻度リスナーが利用できるブラウザか判定
const useRAW = 'onpointerrawupdate' in window;
// サンプルバッファ
type DrawSample = {
    x: number;  // Canvas ピクセル座標
    y: number;  // Canvas ピクセル座標
    p: number;  // 筆圧 (0〜1)
};
const queue: DrawSample[] = [];
// ベジェ計算用の履歴バッファ（最新 3〜4 点を保持）
const pts: DrawSample[] = [];

/* ==== 線幅 UI ==== */
const sizeInput = document.getElementById('size') as HTMLInputElement;
const preview = document.getElementById('preview') as HTMLSpanElement;
let maxStroke = +sizeInput.value;            // 筆圧 1.0 時の線幅

const graphics = new Graphics(gl);


if ('ink' in navigator && navigator.ink?.requestPresenter) {
    // canvas を描画領域として OS に渡す
    navigator.ink.requestPresenter({ presentationArea: cvs })
        .then(p => inkPresenter = p)   // DelegatedInkTrailPresenter
        .catch(console.error);
}

sizeInput.addEventListener('input', () => {
    maxStroke = +sizeInput.value;
    // プレビュー丸のスケールを更新
    preview.style.transform = `scale(${maxStroke / 10})`;
});

cvs.addEventListener('pointerdown', e => {

    const currentBrush = brushManager.getCurrentBrush();
    if (currentBrush === null) {
        // ブラシが未選択なら何もしない
        return;
    }

    drawing = true;
    pts.length = 0;         // 履歴バッファをクリア
    queue.length = 0;       // サンプルキューもクリア
    prev = null;
    lastEvt = null;

    // ストローク開始
    currentStrokeLog = {
        id: makeUUID(),
        color: selectedColor,
        alpha: selectedAlpha,
        tool : currentBrush.name,
        width: maxStroke,
        layer: 0,   // レイヤ番号（現状未使用）
        startedAt: performance.now(),
        points: []
    };

    // 押下イベントを最初のサンプルとして記録
    addSample(e, currentStrokeLog);
    cvs.setPointerCapture(e.pointerId);
});

if ('onpointerrawupdate' in window) {
    // 高頻度リスナー（対応ブラウザのみ）
    cvs.addEventListener('pointerrawupdate' as any, draw);
} else {
    cvs.addEventListener('pointermove', draw);
}

['pointerup', 'pointercancel', 'lostpointercapture', 'pointerout']
    .forEach(ev => cvs.addEventListener(ev, () => {
        drawing = false;
        graphics.reset();  // 台形ノーマルをリセット

        if (currentStrokeLog != null) {
            strokes.push(currentStrokeLog);        // 全体ログに追加
            currentStrokeLog = null;
            autoSaveDraft(); // 自動保存
        }
    }));

let lastEvt: PointerEvent | null = null;

function draw(e: PointerEvent) {
    if (!drawing) return;                        // buttons では判定できない

    if (currentStrokeLog === null) {
        console.warn('No current stroke log. Drawing ignored.');
        return;
    }

    // ① このフレームで溜まったサンプルを取得
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    for (const ev of list) {
        addSample(ev, currentStrokeLog);
    }

    screenDirty = true;
}

/* ▼ addSample: PointerEvent を queue へ追加 */
function addSample(e: PointerEvent, stroke: StrokeLog): void {

    // 筆圧を決定
    const pressure = (e.pointerType === 'pen') ? e.pressure : 0.5;
    //console.log(`pressure: ${pressure}`);

    // 後段で使いやすい形にして queue へ積む
    queue.push({
        x: e.offsetX,
        y: e.offsetY,
        p: pressure               // 遲・悸 (0窶・)
    });

    // t = ストローク開始からの経過 ms
    const time = performance.now() - stroke.startedAt;

    stroke.points.push({
        x: e.offsetX,
        y: e.offsetY,
        p: pressure,
        t: time
    });


    // Ink API で使う最新の生イベントを保持
    if (inkPresenter && e.pointerType === 'pen' && e.isTrusted) {
        // rAF 中に 1 回だけ trail 更新に使う
        lastEvt = e;
    }
}


const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
saveBtn.addEventListener('click', savePng);

function savePng() {
    /* blob 化（モダンブラウザはこれで十分）*/
    if (cvs.toBlob) {
        cvs.toBlob(blob => {
            if (blob) triggerDownload(blob);
        }, 'image/png');
        return;
    }

    /* 古い Safari 用フォールバック（toBlob 未実装）*/
    const dataURL = cvs.toDataURL('image/png');
    // dataURL から blob を作ってダウンロードするとメモリ効率が良い
    fetch(dataURL)
        .then(res => res.blob())
        .then(triggerDownload);
}

function triggerDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();                 // 保存ダイアログを開く or 即ダウンロード
    URL.revokeObjectURL(url);  // Object URL を破棄
}

function toNDC(x: number, y: number): [number, number] {
    return [
        (x / cvs.clientWidth) * 2 - 1,   // clientWidth は CSS px
        -(y / cvs.clientHeight) * 2 + 1
    ];
}


// ====== 1) パレット定義（全12色） ======
const COLORS = [
    { name: '白', hex: '#FFFFFF' }, { name: '黒', hex: '#000000' },
    { name: '赤', hex: '#EA3323' }, { name: '橙', hex: '#FF8A00' },
    { name: '黄', hex: '#FFD400' }, { name: '黄緑', hex: '#9CCC65' },
    { name: '緑', hex: '#2E7D32' }, { name: '水色', hex: '#4FC3F7' },
    { name: '青', hex: '#1E88E5' }, { name: '紫', hex: '#8E24AA' },
    { name: '茶', hex: '#8D6E63' }, { name: '桃', hex: '#F48FB1' },
];

// ====== 2) DOM 逕滓・ ======
const palette = document.getElementById('palette') as HTMLDivElement;
let selectedIdx = 2; // 初期色は赤
COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = c.hex;
    b.role = 'radio'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', c.name);
    b.setAttribute('aria-checked', i === selectedIdx ? 'true' : 'false');
    b.dataset.index = i.toString();
    palette.appendChild(b);
});
palette.addEventListener('click', e => {
    const elm = e.target as Element;
    const b = elm.closest('.swatch') as HTMLElement;
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
    if (e.key === 'ArrowRight') i = (i + 1) % n;
    else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n;
    else if (e.key === 'ArrowDown') i = Math.min(i + cols, n - 1);
    else if (e.key === 'ArrowUp') i = Math.max(i - cols, 0);
    else if (e.key === ' ' || e.key === 'Enter') { /* 驕ｸ謚槭ヨ繧ｰ繝ｫ */ }
    else return;
    e.preventDefault();
    selectColor(i);
    (palette.children[i] as HTMLElement).focus();
});

// ====== 3) 透明度と筆圧の連動 ======
const alphaEl = document.getElementById('alpha') as HTMLInputElement;
const alphaVal = document.getElementById('alphaVal') as HTMLSpanElement;
alphaEl.addEventListener('input', () => {
    alphaVal.textContent = (+alphaEl.value).toFixed(2);
    applyColorToCache(); // α のみ更新
});

// ====== 4) 濶ｲ驕ｸ謚槭→ WebGL 縺ｸ縺ｮ蜿肴丐 ======
function selectColor(i: number) {
    palette.querySelectorAll('.swatch').forEach((el, idx) => {
        el.setAttribute('aria-checked', idx === i ? 'true' : 'false');
    });
    selectedIdx = i;
    applyColorToCache();
}

// hex 竊・[0..1] RGB
function hexToRgb01(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [0, 0, 0];
}

function getSelectedColor() {
    const [r, g, b] = hexToRgb01(COLORS[selectedIdx].hex);
    const a = +alphaEl.value;

    //gl.useProgram(program);
    // アルコールマーカー風の減法合成を想定したシェーダ
    // FS 側で RGB→CMY に変換するので、ここでは通常の RGBA を渡す
    //gl.uniform4f(u_rgbA, r, g, b, a);
    return [r, g, b, a];
}

function applyColorToCache() {
    selectedColor = COLORS[selectedIdx].hex;
    selectedAlpha = +alphaEl.value;
}
applyColorToCache(); // 初期色を反映

const penBtn = document.getElementById('penBtn') as HTMLButtonElement;
penBtn.addEventListener('click', (e) => {
    brushManager.useBrush('Pen');
});

const alcholMarkerBtn = document.getElementById('alcholMarkerBtn') as HTMLButtonElement;
alcholMarkerBtn.addEventListener('click', (e) => {
    brushManager.useBrush('AlcoholMarkerBrush');
});

const watercolorBtn = document.getElementById('watercolorBtn') as HTMLButtonElement;
watercolorBtn.addEventListener('click', (e) => {
    brushManager.useBrush('WatercolorBrush');
});

const eraserBtn = document.getElementById('eraserBtn') as HTMLButtonElement;
eraserBtn.addEventListener('click', (e) => {
    brushManager.useBrush('Eraser');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'e') {
        brushManager.useBrush('Eraser');
    }
    if (e.key === 'w') {
        brushManager.useBrush('WatercolorBrush');
    }
    if (e.key === 'p') {
        brushManager.useBrush('Pen');
    }
});

// 初期ブラシを選択
brushManager.useBrush('Pen');
await restoreDraft();
brushManager.useBrush('Pen');

const pp = graphics.createPingPong(gl, cvs.width, cvs.height); // 笘・蝗槭□縺・



/* ------------- 60fps でまとめ描き ------------- */
function tick() {

    if (!screenDirty) {
        requestAnimationFrame(tick);
        return;
    }

    // 1) 今フレームの入力（加筆や消し）を write 側へ描画
    // beginFBO(gl, pp.write);
    // gl.viewport(0, 0, pp.write.width, pp.write.height);
    //gl.clearColor(0, 0, 0, 0);                // 透過でクリアしたい場合に使用
    //gl.clear(gl.COLOR_BUFFER_BIT);
    drawBrushToTexture();                   // 今回のストロークを描画

    // // 2) 合成パス（read と write を使って新しい結果を作る）
    // beginFBO(gl, pp.read);
    // runCompositePass(pp.read.tex, pp.write.tex);

    // // 3) 次フレームに備えて役割を入れ替え
    // pp.swap();

    // // 4) 画面表示（デフォルト FBO）
    // beginFBO(gl, null);
    // drawFullscreenQuad(pp.read.tex);

    screenDirty = false;
    requestAnimationFrame(tick);
}
// ループ開始
tick();

function drawBrushToTexture() {
    const [r, g, b, a] = getSelectedColor();
    graphics.enable(); // VBO 譛牙柑蛹・

    // Android 端末ではテクスチャを毎フレーム有効化しないとエラーになる
    brushManager.getCurrentBrush()?.use();

    /* ---- ① 新しいサンプルを履歴 pts へ追加 ---- */
    while (queue.length) {
        const n = queue.shift();
        if (n !== undefined) {
            pts.push(n);
        }
        if (pts.length > 4) pts.shift();   // 古い点を捨て、最大 4 点に保つ
    }

    if (prev == null) {
        // ペン先の初期位置だけ記録して次フレームへ
        prev = pts[0];
    }

    let lineWidthPrev = 1.0;
    let lineWidth1 = 1.0;
    let alpha1 = 1.0;

    if (pts.length >= 2) {
        const [p1, p2] = pts.slice(-2);

        // 線幅は p2 の筆圧を使う（中央付近が最も太く見えるため）
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

        const positionBuffer = graphics.updateQuadTrapezoid(cvs, prevPoint, point1, lineWidthPrev, lineWidth1, prevAlpha, alpha1, r, g, b, a);
        brushManager.getCurrentBrush()?.uploadData(positionBuffer);
        brushManager.getCurrentBrush()?.draw();

        // ベジェ終点を次フレームの始点にする
        prev = p1;
    }

    // Ink API 併用時は 1 フレーム 1 回で OK
    if (inkPresenter && lastEvt && drawing && lineWidth1 > 0) {
        const colorStr = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a * alpha1})`;
        inkPresenter.updateInkTrailStartPoint(
            lastEvt,
            { diameter: lineWidth1, color: colorStr }
        );

        // 1 フレーム 1 回に抑制
        lastEvt = null;
    }

    graphics.disable(); // VBO 無効化
}

function runCompositePass() {

}

function drawSegment(prevPoint: { x: number; y: number; p: number }, currPoint: { x: number; y: number; p: number }, width: number, color: string, alpha: number) {
    const [r, g, b] = hexToRgb01(color);
    const lineWidthPrev = width * prevPoint.p;
    const lineWidthCurr = width * currPoint.p;
    const alphaPrev = lineWidthPrev < 1.0 ? lineWidthPrev : 1.0;
    const alphaCurr = lineWidthCurr < 1.0 ? lineWidthCurr : 1.0;

    const top = new Float32Array([prevPoint.x, prevPoint.y]);
    const bottom = new Float32Array([currPoint.x, currPoint.y]);
    const positionBuffer = graphics.updateQuadTrapezoid(cvs, top, bottom, lineWidthPrev, lineWidthCurr, alphaPrev, alphaCurr, r, g, b, alpha);

    brushManager.getCurrentBrush()?.uploadData(positionBuffer);
    brushManager.getCurrentBrush()?.draw();
}

function replayStrokes(snapshot: StrokeLog[]) {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const stroke of snapshot) {
        if (!stroke.points || stroke.points.length < 2) {
            continue;
        }

        try {
            brushManager.useBrush(stroke.tool);
        } catch (error) {
            console.warn(`Unknown brush '${stroke.tool}', fallback to Pen.`, error);
            brushManager.useBrush('Pen');
        }

        brushManager.getCurrentBrush()?.use();
        graphics.reset();

        for (let i = 1; i < stroke.points.length; i++) {
            drawSegment(stroke.points[i - 1], stroke.points[i], stroke.width, stroke.color, stroke.alpha);
        }
    }

    graphics.disable();
    screenDirty = false;
}

async function restoreDraft() {
    try {
        const db = await InkDB.get();
        const draft = await db.loadDraft();
        if (!draft || !Array.isArray(draft.strokes) || draft.strokes.length === 0) {
            return;
        }

        strokes = draft.strokes;
        replayStrokes(strokes);
        console.log(`Restored ${strokes.length} stroke(s) from draft.`);
    } catch (error) {
        console.error('Failed to restore draft.', error);
    }
}

function getCanvasPngBlob(): Promise<Blob> {
    return new Promise(resolve => {
        if (!cvs.toBlob) {
            resolve(new Blob());
            return;
        }
        cvs.toBlob(blob => resolve(blob ?? new Blob()), 'image/png');
    });
}

async function saveDraft(): Promise<void> {
    if (saveInFlight) {
        return saveInFlight;
    }

    saveInFlight = (async () => {
        try {
            const db = await InkDB.get();
            const pngBlob = await getCanvasPngBlob();

            await db.saveDraft({
                strokes: [...strokes],
                pngBlob,
                updated: Date.now()
            });
        } finally {
            saveInFlight = null;
        }
    })();

    return saveInFlight;
}

/** 保存関数は 1.5 秒ごとにデバウンスして自動保存 */
const autoSaveDraft = debounce(() => saveDraft(), 1500);

function flushDraftSave() {
    if (strokes.length === 0) {
        return;
    }
    void saveDraft();
}

window.addEventListener('pagehide', flushDraftSave);
window.addEventListener('beforeunload', flushDraftSave);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushDraftSave();
    }
});






