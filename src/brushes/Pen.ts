import { loadTexture, compileShader, linkProgram } from '../Util.js';
import { Brush } from '../Brush.js';

export default class Pen implements Brush {
    readonly name = "Pen";

    private gl: WebGL2RenderingContext;
    private vbo: WebGLBuffer;
    private program: WebGLProgram;
    private cvs: HTMLCanvasElement;

    static readonly vs = `#version 300 es
    in vec2 a_pos; // 頂点の座標
    in vec4 a_col; // 頂点の色
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`;

    static readonly fs = `#version 300 es
    precision mediump float;

    in vec4 v_col; 
    out vec4 o;

    void main() {
        // 入力をそのまま出力
        o = v_col;
    }`;

    // 呼び出し不可(create() で生成)
    private constructor(gl: WebGL2RenderingContext, cvs: HTMLCanvasElement) {
        this.gl = gl;
        const vsh = compileShader(gl, gl.VERTEX_SHADER, Pen.vs, 'VS_Pen');
        const fsh = compileShader(gl, gl.FRAGMENT_SHADER, Pen.fs, 'FS_Pen');
        this.program = linkProgram(gl, vsh, fsh);
        this.vbo = gl.createBuffer();
        this.cvs = cvs;
    }

    static async create(gl: WebGL2RenderingContext, cvs: HTMLCanvasElement) {
        return new Pen(gl, cvs);
    }

    use(): void {
        this.gl.useProgram(this.program);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

        let posLoc = this.gl.getAttribLocation(this.program, "a_pos");
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 24, 0);
        this.gl.enableVertexAttribArray(posLoc);

        let colLoc  = this.gl.getAttribLocation(this.program, "a_col");
        this.gl.vertexAttribPointer(colLoc, 4, this.gl.FLOAT, false, 24, 8);
        this.gl.enableVertexAttribArray(colLoc);

        // ブレンドOFF設定
        this.gl.disable(this.gl.BLEND);
    }

    uploadData(vertices: Float32Array): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        //this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STREAM_DRAW);
    }

    draw(): void {
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }

}
