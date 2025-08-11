"use strict";
// import { BrushManager } from './Brush.js';
// import AlcoholMarkerBrush from './brushes/AlcoholMarker.js';
const canvas = document.getElementById('c');
// 1) コンテキストは alpha:false 推奨（透明合成で消えて見える事故を防止）
//const gl = (canvas.getContext("webgl", { alpha: false, antialias: true }) ||
//            canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
// const brushManager = new BrushManager(gl);
// brushManager.registerBrush(await AlcoholMarkerBrush.create(gl, canvas));
// 2) リサイズ & ビューポート
function fit() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }
}
window.addEventListener("resize", fit);
fit();
// 3) 単色描画シェーダ（precision を必ず宣言！）
const vs = `
attribute vec2 aPos;
void main(){
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;
const fs = `
// ★ Android/WebGL1はフラグメントに precision 宣言が必須
precision mediump float;
void main(){
    gl_FragColor = vec4(0.7,0.5,0.0,1.0);
}`;
function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) || "shader error");
    return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) || "link error");
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
// フルスクリーン三角形
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 3, -1, -1, 3
]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, "aPos");
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(loc);
gl.useProgram(prog);
gl.clearColor(1, 1, 1, 1); // 背景は白
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
