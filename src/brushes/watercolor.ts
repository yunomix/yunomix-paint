import { loadTexture, compileShader, linkProgram } from '../util.js';
import { Brush } from '../brush.js';

export default class WatercolorBrush implements Brush {
    readonly name = "WatercolorBrush";

    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vbo: WebGLBuffer;
    private cvs: HTMLCanvasElement;
    private texture: WebGLTexture;
    private img: HTMLImageElement;
    private uResolution: WebGLUniformLocation;
    private uTexScale: WebGLUniformLocation;
    private uPaper: WebGLUniformLocation;
    private uGrain: WebGLUniformLocation;
    private uBleed: WebGLUniformLocation;
    private uFlow: WebGLUniformLocation;

    static readonly vs = `#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`;

    static readonly fs = `#version 300 es
    precision mediump float;

    in vec4 v_col;
    uniform sampler2D u_paper;
    uniform vec2 u_resolution;
    uniform float u_texScale;
    uniform float u_grain;
    uniform float u_bleed;
    uniform float u_flow;

    out vec4 o;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy / u_resolution) * u_texScale;
        float paper = texture(u_paper, uv).r;

        vec2 texel = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y) * u_bleed * 1.5;
        float bleedSample = (
            texture(u_paper, uv + vec2(texel.x, 0.0)).r +
            texture(u_paper, uv - vec2(texel.x, 0.0)).r +
            texture(u_paper, uv + vec2(0.0, texel.y)).r +
            texture(u_paper, uv - vec2(0.0, texel.y)).r
        ) * 0.25;

        float edge = clamp((paper - bleedSample) * 2.5 + 0.5, 0.0, 1.0);

        float flowNoise = noise(uv * 180.0);
        float pigmentFlow = mix(flowNoise, paper, 0.5);
        float wash = mix(1.0 - u_flow, 1.0, pigmentFlow);

        vec3 pigment = v_col.rgb;
        float alpha = clamp(v_col.a, 0.0, 1.0);

        float grain = mix(1.0 - u_grain, 1.0, paper);
        float edgeDark = mix(1.0, 1.35, clamp(edge * u_bleed, 0.0, 1.0));
        float blot = mix(0.75, 1.1, noise(uv * 32.0 + flowNoise));

        float finalAlpha = alpha * wash * mix(0.7, 1.0, grain);
        vec3 color = clamp(pigment * grain * edgeDark * blot, 0.0, 1.0);

        o = vec4(color * finalAlpha, finalAlpha);
    }`;

    private constructor(gl: WebGL2RenderingContext, cvs: HTMLCanvasElement, img: HTMLImageElement) {
        this.gl = gl;
        const vsh = compileShader(gl, gl.VERTEX_SHADER, WatercolorBrush.vs, 'VS_Watercolor');
        const fsh = compileShader(gl, gl.FRAGMENT_SHADER, WatercolorBrush.fs, 'FS_Watercolor');
        this.program = linkProgram(gl, vsh, fsh);
        this.vbo = gl.createBuffer();
        this.cvs = cvs;
        this.img = img;
        this.texture = gl.createTexture();

        const uRes = gl.getUniformLocation(this.program, 'u_resolution');
        const uTexScale = gl.getUniformLocation(this.program, 'u_texScale');
        const uPaper = gl.getUniformLocation(this.program, 'u_paper');
        const uGrain = gl.getUniformLocation(this.program, 'u_grain');
        const uBleed = gl.getUniformLocation(this.program, 'u_bleed');
        const uFlow = gl.getUniformLocation(this.program, 'u_flow');

        if (!uRes || !uTexScale || !uPaper || !uGrain || !uBleed || !uFlow) {
            throw new Error('WatercolorBrush: failed to locate uniforms');
        }

        this.uResolution = uRes;
        this.uTexScale = uTexScale;
        this.uPaper = uPaper;
        this.uGrain = uGrain;
        this.uBleed = uBleed;
        this.uFlow = uFlow;
    }

    static async create(gl: WebGL2RenderingContext, cvs: HTMLCanvasElement) {
        const img = await loadTexture('./resources/img/paper.jpg');
        return new WatercolorBrush(gl, cvs, img);
    }

    use(): void {
        this.gl.useProgram(this.program);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

        const posLoc = this.gl.getAttribLocation(this.program, 'a_pos');
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 24, 0);
        this.gl.enableVertexAttribArray(posLoc);

        const colLoc = this.gl.getAttribLocation(this.program, 'a_col');
        this.gl.vertexAttribPointer(colLoc, 4, this.gl.FLOAT, false, 24, 8);
        this.gl.enableVertexAttribArray(colLoc);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8, this.img.width, this.img.height, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, this.img);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

        this.gl.uniform2f(this.uResolution, this.cvs.clientWidth, this.cvs.clientHeight);
        this.gl.uniform1f(this.uTexScale, 1.8);
        this.gl.uniform1i(this.uPaper, 0);
        this.gl.uniform1f(this.uGrain, 0.6);
        this.gl.uniform1f(this.uBleed, 2.4);
        this.gl.uniform1f(this.uFlow, 0.55);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        this.gl.blendFuncSeparate(
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA,
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA
        );
    }

    uploadData(vertices: Float32Array): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STREAM_DRAW);
    }

    draw(): void {
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }
}
