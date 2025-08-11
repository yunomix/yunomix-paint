import { Point, StrokeLog } from './DB';

// ---- 再生用インターフェイス ----
export interface StrokeRenderer {
  /** ストローク開始時（色・ツール切替など） */
  beginStroke: (s: StrokeLog) => void;
  /** サンプル到達時に呼ばれる（i 番目まで進んだ） */
  onPoint?: (s: StrokeLog, pt: Point, i: number) => void;
  /** 区間描画したい人向け（prev→curr のセグメントを描ける） */
  onSegment?: (s: StrokeLog, prev: Point, curr: Point, i: number) => void;
  /** フレーム末尾で呼ばれる（合成/画面描画など） */
  endFrame?: (tPlayMs: number) => void;
  /** ストローク終了時 */
  endStroke?: (s: StrokeLog) => void;
}

export interface ReplayOptions {
  speed?: number;           // 再生速度倍率（例: 10 = 10倍速）デフォルト 10
  startAtMs?: number;       // タイムラインの先頭からの開始オフセット
  raf?: typeof requestAnimationFrame; // テスト差し替え用
}

export interface ReplayController {
  pause(): void;
  resume(): void;
  stop(): void;
  seek(ms: number): void;   // タイムライン上の位置へジャンプ
  isPlaying(): boolean;
  currentTime(): number;    // 再生中のタイムライン時刻（ms）
}

/**
 * ストロークログを時間順に再生する
 * - strokes は startedAt で自動ソート
 * - レンダラーの onSegment / onPoint を使って実描画する
 */
export function replay(
  strokesInput: StrokeLog[],
  renderer: StrokeRenderer,
  opts: ReplayOptions = {}
): ReplayController {
  const speed = opts.speed ?? 10;
  const raf = opts.raf ?? requestAnimationFrame;

  // タイムライン正規化
  const strokes = [...strokesInput].sort((a, b) => a.startedAt - b.startedAt);
  const origin = strokes.length ? strokes[0].startedAt : 0;
  const tracks = strokes.map(s => ({
    s,
    startRel: s.startedAt - origin, // タイムライン先頭からの開始オフセット
    i: 0,                            // 次に再生する points の index
    began: false,
    finished: s.points.length === 0
  }));

  let req = 0;
  let playing = false;
  let t0Real = 0;                  // 再生開始時の performance.now()
  let pausedAt: number | null = null;
  let startOffset = opts.startAtMs ?? 0; // 先頭からの開始位置(ms)
  let tPlay = startOffset;

  const step = (now: number) => {
    if (!playing) return;
    if (pausedAt != null) { req = raf(step); return; }

    // 経過時間（タイムライン）
    tPlay = (now - t0Real) * speed + startOffset;

    // 進むべきストロークを順に消化
    for (const tr of tracks) {
      if (tr.finished) continue;

      const sinceStart = tPlay - tr.startRel;
      if (sinceStart < 0) continue;          // まだ開始前

      if (!tr.began) {                       // 初回
        renderer.beginStroke(tr.s);
        tr.began = true;
      }

      // 到達したポイントまで進める
      const pts = tr.s.points;
      while (tr.i < pts.length && pts[tr.i].t <= sinceStart) {
        const i = tr.i;
        const curr = pts[i];
        if (i > 0 && renderer.onSegment) {
          renderer.onSegment(tr.s, pts[i - 1], curr, i);
        }
        renderer.onPoint?.(tr.s, curr, i);
        tr.i++;
      }
      // ストローク完了？
      if (tr.i >= pts.length) {
        tr.finished = true;
        renderer.endStroke?.(tr.s);
      }
    }

    renderer.endFrame?.(tPlay);

    // 全部終わったら停止
    if (tracks.every(t => t.finished)) {
      playing = false;
      return;
    }
    req = raf(step);
  };

  // 内部ヘルパ
  const startFrom = (offsetMs: number) => {
    startOffset = offsetMs;
    t0Real = performance.now();
    pausedAt = null;
    if (!playing) { playing = true; req = raf(step); }
  };

  // --- コントローラ実装 ---
  const ctrl: ReplayController = {
    pause() {
      if (!playing || pausedAt != null) return;
      pausedAt = performance.now();
    },
    resume() {
      if (!playing || pausedAt == null) return;
      // pause 中の経過分を startOffset に加算して、時刻の連続性を保つ
      const pausedDur = performance.now() - pausedAt;
      startOffset += pausedDur * speed;
      pausedAt = null;
    },
    stop() {
      playing = false;
      if (req) cancelAnimationFrame(req);
    },
    seek(ms: number) {
      // 巻き戻し時は各トラックのカーソルをリセットして再構築
      for (const t of tracks) {
        t.i = 0; t.began = false; t.finished = t.s.points.length === 0;
      }
      startFrom(ms);
    },
    isPlaying: () => playing && pausedAt == null,
    currentTime: () => tPlay
  };

  // 初回開始
  startFrom(startOffset);
  return ctrl;
}