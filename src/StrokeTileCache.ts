import { compileShader, linkProgram } from './Util.js';

export type DrawSamplePoint = {
    x: number;
    y: number;
    p: number;
};

type TileSnapshot = {
    cssX: number;
    cssY: number;
    cssWidth: number;
    cssHeight: number;
    pixels: Uint8Array;
    pixelWidth: number;
    pixelHeight: number;
};

type StrokeTileCache = {
    canvasWidth: number;
    canvasHeight: number;
    tiles: Map<string, TileSnapshot>;
};

type StrokeTileCacheOptions = {
    tileSizeCss?: number;
    maxCachedStrokes?: number;
};

export class StrokeTileCacheManager {
    private readonly gl: WebGL2RenderingContext;
    private readonly canvas: HTMLCanvasElement;
    private readonly tileSizeCss: number;
    private readonly maxCachedStrokes: number;
    private readonly restoreProgram: WebGLProgram;
    private readonly restoreVbo: WebGLBuffer;
    private currentCache: StrokeTileCache | null = null;
    private caches: Array<StrokeTileCache | null> = [];

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, opts?: StrokeTileCacheOptions) {
        this.gl = gl;
        this.canvas = canvas;
        this.tileSizeCss = opts?.tileSizeCss ?? 96;
        this.maxCachedStrokes = opts?.maxCachedStrokes ?? 24;
        this.restoreProgram = this.createRestoreProgram();
        const vbo = this.gl.createBuffer();
        if (vbo == null) {
            throw new Error('Failed to create tile restore buffer.');
        }
        this.restoreVbo = vbo;
    }

    beginStroke() {
        this.currentCache = {
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            tiles: new Map()
        };
    }

    commitStroke() {
        this.caches.push(this.currentCache);
        const staleIndex = this.caches.length - this.maxCachedStrokes - 1;
        if (staleIndex >= 0) {
            this.caches[staleIndex] = null;
        }
        this.currentCache = null;
    }

    discardCurrentStroke() {
        this.currentCache = null;
    }

    captureSegment(prevPoint: DrawSamplePoint, currPoint: DrawSamplePoint, prevWidth: number, currWidth: number) {
        const cache = this.currentCache;
        if (cache == null || cache.canvasWidth !== this.canvas.width || cache.canvasHeight !== this.canvas.height) {
            return;
        }
        if (this.canvas.clientWidth <= 0 || this.canvas.clientHeight <= 0) {
            return;
        }

        const halfWidth = Math.max(prevWidth, currWidth) * 0.5 + 2;
        const minX = Math.max(0, Math.min(prevPoint.x, currPoint.x) - halfWidth);
        const minY = Math.max(0, Math.min(prevPoint.y, currPoint.y) - halfWidth);
        const maxX = Math.min(this.canvas.clientWidth, Math.max(prevPoint.x, currPoint.x) + halfWidth);
        const maxY = Math.min(this.canvas.clientHeight, Math.max(prevPoint.y, currPoint.y) + halfWidth);

        const startTx = Math.floor(minX / this.tileSizeCss);
        const endTx = Math.floor(Math.max(0, maxX - 1) / this.tileSizeCss);
        const startTy = Math.floor(minY / this.tileSizeCss);
        const endTy = Math.floor(Math.max(0, maxY - 1) / this.tileSizeCss);

        for (let ty = startTy; ty <= endTy; ty++) {
            for (let tx = startTx; tx <= endTx; tx++) {
                const key = `${tx}:${ty}`;
                if (cache.tiles.has(key)) {
                    continue;
                }
                const snapshot = this.readTileSnapshot(tx, ty);
                if (snapshot != null) {
                    cache.tiles.set(key, snapshot);
                }
            }
        }
    }

    popLatestCache(): StrokeTileCache | null {
        return this.caches.pop() ?? null;
    }

    restoreFromCache(cache: StrokeTileCache): boolean {
        if (cache.canvasWidth !== this.canvas.width || cache.canvasHeight !== this.canvas.height) {
            return false;
        }
        if (cache.tiles.size === 0) {
            return false;
        }

        const gl = this.gl;
        const wasBlendEnabled = gl.isEnabled(gl.BLEND);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.restoreProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.restoreVbo);
        const posLoc = gl.getAttribLocation(this.restoreProgram, 'a_pos');
        const uvLoc = gl.getAttribLocation(this.restoreProgram, 'a_uv');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

        const tex = gl.createTexture();
        if (tex == null) {
            if (wasBlendEnabled) {
                gl.enable(gl.BLEND);
            }
            return false;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const uTex = gl.getUniformLocation(this.restoreProgram, 'u_tex');
        gl.uniform1i(uTex, 0);

        for (const tile of cache.tiles.values()) {
            const x0 = (tile.cssX / this.canvas.clientWidth) * 2 - 1;
            const x1 = ((tile.cssX + tile.cssWidth) / this.canvas.clientWidth) * 2 - 1;
            const y0 = -((tile.cssY + tile.cssHeight) / this.canvas.clientHeight) * 2 + 1;
            const y1 = -(tile.cssY / this.canvas.clientHeight) * 2 + 1;

            const vertices = new Float32Array([
                x0, y0, 0, 0,
                x1, y0, 1, 0,
                x0, y1, 0, 1,
                x0, y1, 0, 1,
                x1, y0, 1, 0,
                x1, y1, 1, 1
            ]);

            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                tile.pixelWidth,
                tile.pixelHeight,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                tile.pixels
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        gl.deleteTexture(tex);
        if (wasBlendEnabled) {
            gl.enable(gl.BLEND);
        }
        return true;
    }

    clearAll() {
        this.currentCache = null;
        this.caches = [];
    }

    resetHistory(length: number) {
        this.currentCache = null;
        this.caches = new Array(length).fill(null);
    }

    private createRestoreProgram(): WebGLProgram {
        const vs = `#version 300 es
        in vec2 a_pos;
        in vec2 a_uv;
        out vec2 v_uv;
        void main() {
            v_uv = a_uv;
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }`;
        const fs = `#version 300 es
        precision mediump float;
        in vec2 v_uv;
        uniform sampler2D u_tex;
        out vec4 o;
        void main() {
            o = texture(u_tex, v_uv);
        }`;

        const vsh = compileShader(this.gl, this.gl.VERTEX_SHADER, vs, 'VS_TileRestore');
        const fsh = compileShader(this.gl, this.gl.FRAGMENT_SHADER, fs, 'FS_TileRestore');
        return linkProgram(this.gl, vsh, fsh);
    }

    private readTileSnapshot(tx: number, ty: number): TileSnapshot | null {
        const cssX = tx * this.tileSizeCss;
        const cssY = ty * this.tileSizeCss;
        const cssWidth = Math.max(0, Math.min(this.tileSizeCss, this.canvas.clientWidth - cssX));
        const cssHeight = Math.max(0, Math.min(this.tileSizeCss, this.canvas.clientHeight - cssY));
        if (cssWidth === 0 || cssHeight === 0) {
            return null;
        }

        const pxScaleX = this.canvas.width / this.canvas.clientWidth;
        const pxScaleY = this.canvas.height / this.canvas.clientHeight;
        const pixelX = Math.floor(cssX * pxScaleX);
        const pixelTop = Math.floor(cssY * pxScaleY);
        const pixelWidth = Math.max(1, Math.floor(cssWidth * pxScaleX));
        const pixelHeight = Math.max(1, Math.floor(cssHeight * pxScaleY));
        const pixelY = Math.max(0, this.canvas.height - (pixelTop + pixelHeight));

        const pixels = new Uint8Array(pixelWidth * pixelHeight * 4);
        this.gl.readPixels(pixelX, pixelY, pixelWidth, pixelHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        return {
            cssX,
            cssY,
            cssWidth,
            cssHeight,
            pixels,
            pixelWidth,
            pixelHeight
        };
    }
}
