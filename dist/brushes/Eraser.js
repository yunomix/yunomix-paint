import { compileShader, linkProgram } from '../Util.js';
class Eraser {
    // 呼び出し不可(create() で生成)
    constructor(gl, cvs) {
        this.name = "Eraser";
        this.gl = gl;
        const vsh = compileShader(gl, gl.VERTEX_SHADER, Eraser.vs, 'VS_PEN');
        const fsh = compileShader(gl, gl.FRAGMENT_SHADER, Eraser.fs, 'FS_PEN');
        this.program = linkProgram(gl, vsh, fsh);
        this.cvs = cvs;
    }
    static async create(gl, cvs) {
        return new Eraser(gl, cvs);
    }
    use() {
        this.gl.useProgram(this.program);
        // ブレンド設定
        this.gl.blendFuncSeparate(this.gl.ONE, // srcRGB
        this.gl.ONE, // dstRGB 
        this.gl.ONE, // srcAlpha    
        this.gl.ONE // dstAlpha
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
// private positionBuffer: WebGLBuffer;
Eraser.vs = `#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`;
Eraser.fs = `#version 300 es
    precision mediump float; 
    in vec4 v_col; 
    out vec4 o;
    void main(){
        float a = v_col.a;
        o = vec4(v_col.rgb * a, a);
    }`;
export default Eraser;
