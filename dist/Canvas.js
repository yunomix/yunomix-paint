export default class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.vbo = gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.lastNx = 0;
        this.lastNy = 0;
    }
    enable() {
        const pos = new Float32Array([
            0.1, 0.3, 1, 0, 0, 1, // 位置 + RGBA
            0.3, 0.4, 0, 1, 0, 1, // 位置 + RGBA
            0.2, 0.5, 0, 0, 1, 1, // 位置 + RGBA
            0.6, 0.6, 1, 1, 0, 1 // 位置 + RGBA
        ]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, pos, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 24, 0); // a_pos
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 24, 8); // a_col
        this.gl.enableVertexAttribArray(1);
        //const vettexCount = pos.length / 6; // 6 = 2 (pos) + 4 (col)
        //gl.drawArrays(gl.TRIANGLE_FAN, 0, vettexCount);
    }
    disable() {
        this.gl.disableVertexAttribArray(0);
        this.gl.disableVertexAttribArray(1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
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
    updateQuadTrapezoid(cvs, mTop, mBottom, topLen, botLen, alphaTop, alphaBottom, r, g, b, a) {
        const [mx1, my1] = mTop; // 上底中点
        const [mx2, my2] = mBottom; // 下底中点
        /* 1. ①②を結ぶベクトル v = mBottom - mTop */
        const vx = mx2 - mx1;
        const vy = my2 - my1;
        /* 2. v に直角な単位ベクトル n = (-vy, vx) / |v| */
        const mag = Math.hypot(vx, vy) || 1; // 0 で割らない保険
        const nx = -vy / mag;
        const ny = vx / mag;
        if (this.lastNx == 0) {
            this.lastNx = nx;
            this.lastNy = ny;
        }
        /* 3. n を各半分の長さだけ伸ばして 4 頂点を計算 */
        const hx = this.lastNx * (topLen * 0.5); // halfTop
        const hy = this.lastNy * (topLen * 0.5);
        const kx = nx * (botLen * 0.5); // halfBottom
        const ky = ny * (botLen * 0.5);
        // 頂点順：T1→T2→B2→B1（TRIANGLE_FAN 用）
        const T1 = [mx1 + hx, my1 + hy];
        const T2 = [mx1 - hx, my1 - hy];
        const B2 = [mx2 - kx, my2 - ky];
        const B1 = [mx2 + kx, my2 + ky];
        /* 4. Canvas → NDC 変換 */
        const toNDC = (x, y) => [
            (x / cvs.clientWidth) * 2 - 1,
            -(y / cvs.clientHeight) * 2 + 1
        ];
        const [t1x, t1y] = toNDC(...T1);
        const [t2x, t2y] = toNDC(...T2);
        const [b2x, b2y] = toNDC(...B2);
        const [b1x, b1y] = toNDC(...B1);
        /* 5. 既存 VBO に詰め替え（位置だけ：2float × 4 頂点） */
        const pos = new Float32Array([
            t1x, t1y, r, g, b, a * alphaTop, // 位置 + RGBA
            t2x, t2y, r, g, b, a * alphaTop, // 位置 + RGBA
            b2x, b2y, r, g, b, a * alphaBottom, // 位置 + RGBA
            b1x, b1y, r, g, b, a * alphaBottom // 位置 + RGBA
        ]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, pos);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 24, 0); // a_pos
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 24, 8); // a_col
        this.lastNx = nx;
        this.lastNy = ny;
    }
}
