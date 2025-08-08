import { loadTexture, compileShader, linkProgram } from '../Util.js';
class AlcoholMarkerBrush {
    // 呼び出し不可(create() で生成)
    constructor(gl, cvs, img) {
        this.name = "AlcoholMarkerBrush";
        this.gl = gl;
        const vsh = compileShader(gl, gl.VERTEX_SHADER, AlcoholMarkerBrush.vs, 'VS_PEN');
        const fsh = compileShader(gl, gl.FRAGMENT_SHADER, AlcoholMarkerBrush.fs, 'FS_PEN');
        this.program = linkProgram(gl, vsh, fsh);
        this.cvs = cvs;
        this.img = img;
        this.texture = gl.createTexture();
    }
    static async create(gl, cvs) {
        const img = await loadTexture('./resources/img/paper.jpg');
        return new AlcoholMarkerBrush(gl, cvs, img);
    }
    use() {
        // this.gl.useProgram(this.program);
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        // const loc = this.gl.getAttribLocation(this.program, "a_position");
        // this.gl.enableVertexAttribArray(loc);
        // this.gl.vertexAttribPointer(loc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.useProgram(this.program);
        //const img = await loadTexture('./paper2.jpg');
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8, this.img.width, this.img.height, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, this.img);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        // 解像度/スケール用ユニフォーム
        const uRes = this.gl.getUniformLocation(this.program, "u_resolution");
        const uTexScale = this.gl.getUniformLocation(this.program, "u_texScale");
        const uPaper = this.gl.getUniformLocation(this.program, "u_paper");
        const uGrain = this.gl.getUniformLocation(this.program, "u_grain");
        this.gl.uniform2f(uRes, this.cvs.clientWidth, this.cvs.clientHeight);
        this.gl.uniform1f(uTexScale, 1.0); // 倍率（2〜6で好みに調整）
        this.gl.uniform1i(uPaper, 0); // texture unit 0 をバインド予定
        this.gl.uniform1f(uGrain, 0.5); // 粒状感（0〜1、0.35 くらいが適度）
        // ブレンド設定
        // アルコールマーカーのような描画をする
        this.gl.enable(this.gl.BLEND);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        this.gl.blendFuncSeparate(this.gl.ZERO, // Sf = 0
        this.gl.ONE_MINUS_SRC_COLOR, // Df = 1‑src.rgb   → 減法!
        this.gl.ONE, // α は足し算 (src α)
        this.gl.ONE_MINUS_SRC_ALPHA //   ＋ 紙のαも残す
        );
    }
    uploadData(vertices) {
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STREAM_DRAW);
    }
    draw() {
        // this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
AlcoholMarkerBrush.vs = `#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`;
AlcoholMarkerBrush.fs = `#version 300 es
    precision mediump float;

    in vec4 v_col; 
    uniform sampler2D u_paper;    // 紙/ノイズテクスチャ
    uniform vec2  u_resolution;   // 画面解像度（CSS px基準）
    uniform float u_texScale;     // 紙目の縮尺
    uniform float u_grain;        // 粒状感(0..1) 

    out vec4 o;

    void main() {
    // 画面座標ベースで紙テクスチャをサンプリング
    vec2 uv = (gl_FragCoord.xy / u_resolution) * u_texScale;
    float paper = texture(u_paper, uv).r;        // 0..1

    // 減法: RGB→CMY（インク量）
    vec3 cmy = 1.0 - v_col.rgb;                 // 紙を減らす量

    // 紙のザラつきでインク量を減衰
    // paper=1 で無加工、paperが暗いところは少しだけ薄まる
    float grain = mix(1.0 - u_grain, 1.0, paper);
    cmy *= grain;

    // premultiply して出力（ブレンドは ZERO / ONE_MINUS_SRC_COLOR 前提）
    float a = v_col.a;
    o = vec4(cmy * a, a);
    }`;
export default AlcoholMarkerBrush;
