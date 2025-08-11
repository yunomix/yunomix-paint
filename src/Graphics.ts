import { compileShader, linkProgram } from './Util.js';

export default class Graphics {
    private gl: WebGL2RenderingContext;
    private lastNx: number;    // 法線ベクトルの x 成分
    private lastNy: number;    // 法線ベクトルの y 成分

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.lastNx = 0;
        this.lastNy = 0;
    }

    enable() {
        // const pos = new Float32Array([
        //     0.1, 0.3, 1, 0, 0, 1,   // 位置 + RGBA
        //     0.3, 0.4, 0, 1, 0, 1,   // 位置 + RGBA
        //     0.2, 0.5, 0, 0, 1, 1,   // 位置 + RGBA
        //     0.6, 0.6, 1, 1, 0, 1    // 位置 + RGBA
        // ]);

        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, pos, this.gl.DYNAMIC_DRAW);

        // this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 24, 0);   // a_pos
        // this.gl.enableVertexAttribArray(0);
        // this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 24, 8);   // a_col
        // this.gl.enableVertexAttribArray(1);
        // const vettexCount = pos.length / 6; // 6 = 2 (pos) + 4 (col)
        // this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vettexCount);
    }

    disable() {
        // this.gl.disableVertexAttribArray(0);
        // this.gl.disableVertexAttribArray(1);
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    reset() {
        this.lastNx = 0;
        this.lastNy = 0;
    }

    /**
     * 4 パラメータで台形を VBO にセットする
     * @param {number[]} mTop    [x, y] 上底の中点（Canvas ピクセル座標）
     * @param {number[]} mBottom [x, y] 下底の中点（同上）
     * @param {number}   topLen  上底の長さ（px）
     * @param {number}   botLen  下底の長さ（px）
     */
    updateQuadTrapezoid(cvs: HTMLCanvasElement, mTop: Float32Array<ArrayBuffer>, mBottom: Float32Array<ArrayBuffer>, topLen: number, botLen: number, alphaTop: number, alphaBottom: number,
        r: number, g: number, b: number, a: number): Float32Array {
        const [mx1, my1] = mTop;         // 上底中点
        const [mx2, my2] = mBottom;      // 下底中点

        /* 1. ①②を結ぶベクトル v = mBottom - mTop */
        const vx = mx2 - mx1;
        const vy = my2 - my1;

        /* 2. v に直角な単位ベクトル n = (-vy, vx) / |v| */
        const mag = Math.hypot(vx, vy) || 1;        // 0 で割らない保険
        const nx = -vy / mag;
        const ny = vx / mag;

        if (this.lastNx == 0) {
            this.lastNx = nx;
            this.lastNy = ny;
        }

        /* 3. n を各半分の長さだけ伸ばして 4 頂点を計算 */
        const hx = this.lastNx * (topLen * 0.5);             // halfTop
        const hy = this.lastNy * (topLen * 0.5);
        const kx = nx * (botLen * 0.5);             // halfBottom
        const ky = ny * (botLen * 0.5);

        // 頂点順：T1→T2→B2→B1（TRIANGLE_FAN 用）
        const T1: [number, number] = [mx1 + hx, my1 + hy];
        const T2: [number, number] = [mx1 - hx, my1 - hy];
        const B2: [number, number] = [mx2 - kx, my2 - ky];
        const B1: [number, number] = [mx2 + kx, my2 + ky];

        /* 4. Canvas → NDC 変換 */
        const toNDC = (x: number, y: number) => [
            (x / cvs.clientWidth) * 2 - 1,
            -(y / cvs.clientHeight) * 2 + 1
        ];
        const [t1x, t1y] = toNDC(...T1);
        const [t2x, t2y] = toNDC(...T2);
        const [b2x, b2y] = toNDC(...B2);
        const [b1x, b1y] = toNDC(...B1);

        /* 5. 既存 VBO に詰め替え（位置だけ：2float × 4 頂点） */
        const pos = new Float32Array([
            t1x, t1y, r, g, b, a * alphaTop,   // 位置 + RGBA
            t2x, t2y, r, g, b, a * alphaTop,   // 位置 + RGBA
            b2x, b2y, r, g, b, a * alphaBottom,   // 位置 + RGBA
            b1x, b1y, r, g, b, a * alphaBottom    // 位置 + RGBA
        ]);

        this.lastNx = nx;
        this.lastNy = ny;

        return pos
    }

    // FBO（フレームバッファオブジェクト）を作成
    // 画面の一部をオフスクリーンで描画するために使用
    createFBO(gl: WebGL2RenderingContext, width: number, height: number)
        : { fbo: WebGLFramebuffer, tex: WebGLTexture, width: number, height: number } {
        // 1) カラー用テクスチャ
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // 2) フレームバッファ
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, tex, 0);

        // 3) 完全性チェック
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('FBO incomplete:', status.toString(16));
            throw new Error('Framebuffer is incomplete');
        }

        // 4) 後片付け（バインド解除）
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { fbo, tex, width, height };
    }

    // FBO を開始するためのヘルパー関数
    // `fb` が null の場合は画面を使用
    // `fb` が指定されている場合はその FBO を使用
    beginFBO(gl: WebGL2RenderingContext, fb: { fbo: WebGLFramebuffer, width: number, height: number } | null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb ? fb.fbo : null);
        gl.viewport(0, 0, fb ? fb.width : gl.canvas.width, fb ? fb.height : gl.canvas.height);
    }

    clearRGBA(gl: WebGL2RenderingContext, r: number, g: number, b: number, a: number) {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    initdrawFullscreenQuad() {
        // 位置だけのクアッド（-1..+1）
        const quadVBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadVBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1
        ]), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
    }

    // テクスチャを1枚描くパス
    drawFullscreenQuad(tex: WebGLTexture) {

        const vs = `#version 300 es
        precision mediump float;
        layout(location=0) in vec2 a_pos;
        out vec2 v_uv;
        void main() {
            v_uv = a_pos*0.5+0.5;
            gl_Position = vec4(a_pos,0,1);
        }
        `;

        const fs = `#version 300 es
        precision mediump float;
        in vec2 v_uv;
        uniform sampler2D u_tex;
        out vec4 o;
        void main() {
            o = texture(u_tex, v_uv);
        }
        `;

        const vsh = compileShader(this.gl, this.gl.VERTEX_SHADER, vs, 'VS_ERASER');
        const fsh = compileShader(this.gl, this.gl.FRAGMENT_SHADER, fs, 'FS_ERASER');
        const prog = linkProgram(this.gl, vsh, fsh);

        this.gl.useProgram(prog);

        const u_tex = this.gl.getUniformLocation(prog, "u_tex");

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.uniform1i(u_tex, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // ブレンドoff
        this.gl.disable(this.gl.BLEND);
    }

    createPingPong(gl: WebGL2RenderingContext, w: number, h: number) {
        const A = this.createFBO(gl, w, h);
        const B = this.createFBO(gl, w, h);
        let read = A, write = B;
        return {
            get read() { return read; },   // 読み取り元（過去フレーム）
            get write() { return write; },   // 書き込み先（今フレーム）
            swap() {
                const t = read;
                read = write;
                write = t;
            }
        };
    }
}

