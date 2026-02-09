(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();function Et(r){return new Promise((t,e)=>{const s=new Image;s.crossOrigin="anonymous",s.src=r,s.onload=()=>t(s),s.onerror=e})}function Gt(r){return r.split(`
`).map((t,e)=>`${String(e+1).padStart(3," ")}: ${t}`).join(`
`)}function x(r,t,e,s=""){const i=r.createShader(t);if(i==null)throw new Error(`Failed to create shader: ${s}`);if(r.shaderSource(i,e),r.compileShader(i),!r.getShaderParameter(i,r.COMPILE_STATUS)){const o=r.getShaderInfoLog(i)||"(no log)",n=r.getExtension("WEBGL_debug_shaders"),a=n?`
--- Translated ---
${n.getTranslatedShaderSource(i)}`:"";throw console.error(`Shader compile error ${s?`(${s})`:""}:
${o}
--- Source ---
${Gt(e)}${a}`),r.deleteShader(i),new Error(`Shader compile failed: ${s}`)}return i}function N(r,t,e){const s=r.createProgram();if(r.attachShader(s,t),r.attachShader(s,e),r.linkProgram(s),!r.getProgramParameter(s,r.LINK_STATUS)){const i=r.getProgramInfoLog(s)||"(no log)";throw console.error(`Program link error:
${i}`),r.deleteProgram(s),new Error("Program link failed")}return s}function vt(r,t=1500){let e=null;return(...s)=>{e&&clearTimeout(e),e=setTimeout(()=>{e=null,r(...s)},t)}}function Yt(){const r=globalThis.crypto;return r&&typeof r.randomUUID=="function"?r.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{const e=Math.random()*16|0;return(t==="x"?e:e&3|8).toString(16)})}class Vt{constructor(t){this.gl=t,this.lastNx=0,this.lastNy=0}enable(){}disable(){}reset(){this.lastNx=0,this.lastNy=0}updateQuadTrapezoid(t,e,s,i,o,n,a,l,u,g,f){const[m,R]=e,[A,S]=s,y=A-m,M=S-R,O=Math.hypot(y,M)||1,Q=-M/O,Z=y/O;this.lastNx==0&&(this.lastNx=Q,this.lastNy=Z);const ut=this.lastNx*(i*.5),ft=this.lastNy*(i*.5),dt=Q*(o*.5),gt=Z*(o*.5),Bt=[m+ut,R+ft],Ft=[m-ut,R-ft],Dt=[A-dt,S-gt],Lt=[A+dt,S+gt],G=(Wt,Ht)=>[Wt/t.clientWidth*2-1,-(Ht/t.clientHeight)*2+1],[Pt,Ut]=G(...Bt),[Ct,Nt]=G(...Ft),[Mt,Ot]=G(...Dt),[kt,It]=G(...Lt),Xt=new Float32Array([Pt,Ut,l,u,g,f*n,Ct,Nt,l,u,g,f*n,Mt,Ot,l,u,g,f*a,kt,It,l,u,g,f*a]);return this.lastNx=Q,this.lastNy=Z,Xt}createFBO(t,e,s){const i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,s,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);const o=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,o),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0);const n=t.checkFramebufferStatus(t.FRAMEBUFFER);if(n!==t.FRAMEBUFFER_COMPLETE)throw console.error("FBO incomplete:",n.toString(16)),new Error("Framebuffer is incomplete");return t.bindTexture(t.TEXTURE_2D,null),t.bindFramebuffer(t.FRAMEBUFFER,null),{fbo:o,tex:i,width:e,height:s}}beginFBO(t,e){t.bindFramebuffer(t.FRAMEBUFFER,e?e.fbo:null),t.viewport(0,0,e?e.width:t.canvas.width,e?e.height:t.canvas.height)}clearRGBA(t,e,s,i,o){t.clearColor(e,s,i,o),t.clear(t.COLOR_BUFFER_BIT)}initdrawFullscreenQuad(){const t=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),this.gl.STATIC_DRAW),this.gl.vertexAttribPointer(0,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(0)}drawFullscreenQuad(t){const e=`#version 300 es
        precision mediump float;
        layout(location=0) in vec2 a_pos;
        out vec2 v_uv;
        void main() {
            v_uv = a_pos*0.5+0.5;
            gl_Position = vec4(a_pos,0,1);
        }
        `,s=`#version 300 es
        precision mediump float;
        in vec2 v_uv;
        uniform sampler2D u_tex;
        out vec4 o;
        void main() {
            o = texture(u_tex, v_uv);
        }
        `,i=x(this.gl,this.gl.VERTEX_SHADER,e,"VS_ERASER"),o=x(this.gl,this.gl.FRAGMENT_SHADER,s,"FS_ERASER"),n=N(this.gl,i,o);this.gl.useProgram(n);const a=this.gl.getUniformLocation(n,"u_tex");this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,t),this.gl.uniform1i(a,0),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.gl.disable(this.gl.BLEND)}createPingPong(t,e,s){const i=this.createFBO(t,e,s),o=this.createFBO(t,e,s);let n=i,a=o;return{get read(){return n},get write(){return a},swap(){const l=n;n=a,a=l}}}}class zt{constructor(t){this.brushes=new Map,this.currentBrush=null,this.gl=t}registerBrush(t){this.brushes.set(t.name,t)}useBrush(t){const e=this.brushes.get(t);if(!e)throw new Error(`Brush '${t}' not registered.`);this.currentBrush=e,e.use()}uploadData(t){this.currentBrush?.uploadData(t)}draw(){this.currentBrush?.draw()}getCurrentBrush(){return this.currentBrush}}const F=class F{constructor(t,e,s){this.name="AlcoholMarkerBrush",this.gl=t;const i=x(t,t.VERTEX_SHADER,F.vs,"VS_AlcoholMarkerBrush"),o=x(t,t.FRAGMENT_SHADER,F.fs,"FS_AlcoholMarkerBrush");this.program=N(t,i,o),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture()}static async create(t,e){const s=await Et("./resources/img/paper.jpg");return new F(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT);const s=this.gl.getUniformLocation(this.program,"u_resolution"),i=this.gl.getUniformLocation(this.program,"u_texScale"),o=this.gl.getUniformLocation(this.program,"u_paper"),n=this.gl.getUniformLocation(this.program,"u_grain");this.gl.uniform2f(s,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(i,1),this.gl.uniform1i(o,0),this.gl.uniform1f(n,.5),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.ONE_MINUS_SRC_COLOR,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};F.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`,F.fs=`#version 300 es
    precision mediump float;

    in vec4 v_col; 
    uniform sampler2D u_paper;    // 紙ノイズテクスチャ
    uniform vec2  u_resolution;   // 画面解像度（CSS px 基準）
    uniform float u_texScale;     // 紙目の縮尺
    uniform float u_grain;        // 粒状感 (0..1)

    out vec4 o;

    void main() {
    // 画面座標ベースで紙テクスチャをサンプリング
    vec2 uv = (gl_FragCoord.xy / u_resolution) * u_texScale;
    float paper = texture(u_paper, uv).r;        // 0..1

    // 減法 RGB→CMY でインク量を表現
    vec3 cmy = 1.0 - v_col.rgb;                 // 紙を減らす量

    // 紙のざらつきでインク量を減衰
    // paper=1 で無加工、paper が暗いところは少し薄まる
    float grain = mix(1.0 - u_grain, 1.0, paper);
    cmy *= grain;

    // premultiply して出力（ブレンドは ZERO / ONE_MINUS_SRC_COLOR 前提）
    float a = v_col.a;
    o = vec4(cmy * a, a);
    }`;let rt=F;const D=class D{constructor(t,e,s){this.name="WatercolorBrush",this.gl=t;const i=x(t,t.VERTEX_SHADER,D.vs,"VS_Watercolor"),o=x(t,t.FRAGMENT_SHADER,D.fs,"FS_Watercolor");this.program=N(t,i,o),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture();const n=t.getUniformLocation(this.program,"u_resolution"),a=t.getUniformLocation(this.program,"u_texScale"),l=t.getUniformLocation(this.program,"u_paper"),u=t.getUniformLocation(this.program,"u_grain"),g=t.getUniformLocation(this.program,"u_bleed"),f=t.getUniformLocation(this.program,"u_flow");if(!n||!a||!l||!u||!g||!f)throw new Error("WatercolorBrush: failed to locate uniforms");this.uResolution=n,this.uTexScale=a,this.uPaper=l,this.uGrain=u,this.uBleed=g,this.uFlow=f}static async create(t,e){const s=await Et("./resources/img/paper.jpg");return new D(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);const t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);const e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT),this.gl.uniform2f(this.uResolution,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(this.uTexScale,1.8),this.gl.uniform1i(this.uPaper,0),this.gl.uniform1f(this.uGrain,.6),this.gl.uniform1f(this.uBleed,2.4),this.gl.uniform1f(this.uFlow,.55),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};D.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,D.fs=`#version 300 es
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
    }`;let st=D;const L=class L{constructor(t,e){this.name="Pen",this.gl=t;const s=x(t,t.VERTEX_SHADER,L.vs,"VS_Pen"),i=x(t,t.FRAGMENT_SHADER,L.fs,"FS_Pen");this.program=N(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new L(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.disable(this.gl.BLEND)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};L.vs=`#version 300 es
    in vec2 a_pos; // 頂点の座標
    in vec4 a_col; // 頂点の色
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,L.fs=`#version 300 es
    precision mediump float;

    in vec4 v_col; 
    out vec4 o;

    void main() {
        // 入力をそのまま出力
        o = v_col;
    }`;let it=L;const P=class P{constructor(t,e){this.name="Eraser",this.gl=t;const s=x(t,t.VERTEX_SHADER,P.vs,"VS_PEN"),i=x(t,t.FRAGMENT_SHADER,P.fs,"FS_PEN");this.program=N(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new P(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE,this.gl.ONE,this.gl.ONE)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};P.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`,P.fs=`#version 300 es
    precision mediump float; 
    in vec4 v_col; 
    out vec4 o;
    void main(){
        float a = v_col.a;
        o = vec4(v_col.rgb * a, a);
    }`;let ot=P;const d=class d{static async get(){if(!d._instance){const t=new d;await t.open(),d._instance=t}return d._instance}constructor(){}open(){return new Promise((t,e)=>{const s=indexedDB.open(d.DB_NAME,d.DB_VER);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains(d.STORE)||i.createObjectStore(d.STORE)},s.onsuccess=()=>{this.db=s.result,t()},s.onerror=()=>e(s.error)})}async saveDraft(t,e="draft"){await new Promise((s,i)=>{const o=this.db.transaction(d.STORE,"readwrite");o.objectStore(d.STORE).put(t,e),o.oncomplete=()=>s(),o.onerror=()=>i(o.error??new Error("Failed to save draft")),o.onabort=()=>i(o.error??new Error("Draft save transaction aborted"))})}loadDraft(t="draft"){return new Promise(e=>{const s=this.db.transaction(d.STORE).objectStore(d.STORE).get(t);s.onsuccess=()=>e(s.result??null)})}async save(t,e){return this.saveDraft(e,t)}load(t){return this.loadDraft(t)}listKeys(){return new Promise(t=>{const e=[],s=this.db.transaction(d.STORE).objectStore(d.STORE).openKeyCursor();s.onsuccess=()=>{const i=s.result;i?(e.push(String(i.key)),i.continue()):t(e)}})}};d.DB_NAME="yunomi-paint",d.STORE="projects",d.DB_VER=1,d._instance=null;let k=d;class $t{constructor(t,e,s){this.currentCache=null,this.caches=[],this.gl=t,this.canvas=e,this.tileSizeCss=s?.tileSizeCss??96,this.maxCachedStrokes=s?.maxCachedStrokes??24,this.restoreProgram=this.createRestoreProgram();const i=this.gl.createBuffer();if(i==null)throw new Error("Failed to create tile restore buffer.");this.restoreVbo=i}beginStroke(){this.currentCache={canvasWidth:this.canvas.width,canvasHeight:this.canvas.height,tiles:new Map}}commitStroke(){this.caches.push(this.currentCache);const t=this.caches.length-this.maxCachedStrokes-1;t>=0&&(this.caches[t]=null),this.currentCache=null}discardCurrentStroke(){this.currentCache=null}captureSegment(t,e,s,i){const o=this.currentCache;if(o==null||o.canvasWidth!==this.canvas.width||o.canvasHeight!==this.canvas.height||this.canvas.clientWidth<=0||this.canvas.clientHeight<=0)return;const n=Math.max(s,i)*.5+2,a=Math.max(0,Math.min(t.x,e.x)-n),l=Math.max(0,Math.min(t.y,e.y)-n),u=Math.min(this.canvas.clientWidth,Math.max(t.x,e.x)+n),g=Math.min(this.canvas.clientHeight,Math.max(t.y,e.y)+n),f=Math.floor(a/this.tileSizeCss),m=Math.floor(Math.max(0,u-1)/this.tileSizeCss),R=Math.floor(l/this.tileSizeCss),A=Math.floor(Math.max(0,g-1)/this.tileSizeCss);for(let S=R;S<=A;S++)for(let y=f;y<=m;y++){const M=`${y}:${S}`;if(o.tiles.has(M))continue;const O=this.readTileSnapshot(y,S);O!=null&&o.tiles.set(M,O)}}popLatestCache(){return this.caches.pop()??null}restoreFromCache(t){if(t.canvasWidth!==this.canvas.width||t.canvasHeight!==this.canvas.height||t.tiles.size===0)return!1;const e=this.gl,s=e.isEnabled(e.BLEND);e.disable(e.BLEND),e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.restoreProgram),e.bindBuffer(e.ARRAY_BUFFER,this.restoreVbo);const i=e.getAttribLocation(this.restoreProgram,"a_pos"),o=e.getAttribLocation(this.restoreProgram,"a_uv");e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,16,8);const n=e.createTexture();if(n==null)return s&&e.enable(e.BLEND),!1;e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const a=e.getUniformLocation(this.restoreProgram,"u_tex");e.uniform1i(a,0);for(const l of t.tiles.values()){const u=l.cssX/this.canvas.clientWidth*2-1,g=(l.cssX+l.cssWidth)/this.canvas.clientWidth*2-1,f=-((l.cssY+l.cssHeight)/this.canvas.clientHeight)*2+1,m=-(l.cssY/this.canvas.clientHeight)*2+1,R=new Float32Array([u,f,0,0,g,f,1,0,u,m,0,1,u,m,0,1,g,f,1,0,g,m,1,1]);e.bufferData(e.ARRAY_BUFFER,R,e.STREAM_DRAW),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,l.pixelWidth,l.pixelHeight,0,e.RGBA,e.UNSIGNED_BYTE,l.pixels),e.drawArrays(e.TRIANGLES,0,6)}return e.deleteTexture(n),s&&e.enable(e.BLEND),!0}clearAll(){this.currentCache=null,this.caches=[]}resetHistory(t){this.currentCache=null,this.caches=new Array(t).fill(null)}createRestoreProgram(){const t=`#version 300 es
        in vec2 a_pos;
        in vec2 a_uv;
        out vec2 v_uv;
        void main() {
            v_uv = a_uv;
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }`,e=`#version 300 es
        precision mediump float;
        in vec2 v_uv;
        uniform sampler2D u_tex;
        out vec4 o;
        void main() {
            o = texture(u_tex, v_uv);
        }`,s=x(this.gl,this.gl.VERTEX_SHADER,t,"VS_TileRestore"),i=x(this.gl,this.gl.FRAGMENT_SHADER,e,"FS_TileRestore");return N(this.gl,s,i)}readTileSnapshot(t,e){const s=t*this.tileSizeCss,i=e*this.tileSizeCss,o=Math.max(0,Math.min(this.tileSizeCss,this.canvas.clientWidth-s)),n=Math.max(0,Math.min(this.tileSizeCss,this.canvas.clientHeight-i));if(o===0||n===0)return null;const a=this.canvas.width/this.canvas.clientWidth,l=this.canvas.height/this.canvas.clientHeight,u=Math.floor(s*a),g=Math.floor(i*l),f=Math.max(1,Math.floor(o*a)),m=Math.max(1,Math.floor(n*l)),R=Math.max(0,this.canvas.height-(g+m)),A=new Uint8Array(f*m*4);return this.gl.readPixels(u,R,f,m,this.gl.RGBA,this.gl.UNSIGNED_BYTE,A),{cssX:s,cssY:i,cssWidth:o,cssHeight:n,pixels:A,pixelWidth:f,pixelHeight:m}}}const h=document.getElementById("c"),E=h.getContext("webgl2",{preserveDrawingBuffer:!0});let v=null,p=[],B=null,J=!1,tt=!1,et=!1,xt="",Rt=1;const c=new zt(E);c.registerBrush(await rt.create(E,h));c.registerBrush(await st.create(E,h));c.registerBrush(await it.create(E,h));c.registerBrush(await ot.create(E,h));let Y=!1;function nt(){const r=window.devicePixelRatio||1;h.width=h.clientWidth*r,h.height=h.clientHeight*r,E.viewport(0,0,h.width,h.height)}nt();E.clearColor(1,1,1,1);E.clear(E.COLOR_BUFFER_BIT);let V=null,T={x:0,y:0,p:0},W=!1;const C=[],b=[],at=document.getElementById("size"),qt=document.getElementById("preview");let I=+at.value;const w=new Vt(E),_=new $t(E,h,{tileSizeCss:96,maxCachedStrokes:24});"ink"in navigator&&navigator.ink?.requestPresenter&&navigator.ink.requestPresenter({presentationArea:h}).then(r=>V=r).catch(console.error);at.addEventListener("input",()=>{I=+at.value,qt.style.transform=`scale(${I/10})`});h.addEventListener("pointerdown",r=>{const t=c.getCurrentBrush();t!==null&&(W=!0,b.length=0,C.length=0,T=null,U=null,v={id:Yt(),color:xt,alpha:Rt,tool:t.name,width:I,layer:0,startedAt:performance.now(),points:[]},_.beginStroke(),At(r,v),h.setPointerCapture(r.pointerId))});"onpointerrawupdate"in window?h.addEventListener("pointerrawupdate",mt):h.addEventListener("pointermove",mt);["pointerup","pointercancel","lostpointercapture","pointerout"].forEach(r=>h.addEventListener(r,()=>{_t()&&ce()}));let U=null;function _t(){return W=!1,w.reset(),C.length=0,b.length=0,T=null,U=null,v!=null?(p.push(v),_.commitStroke(),v=null,!0):(_.discardCurrentStroke(),!1)}function jt(){W=!1,w.reset(),C.length=0,b.length=0,T=null,U=null,v=null,_.discardCurrentStroke()}function mt(r){if(!W)return;if(v===null){console.warn("No current stroke log. Drawing ignored.");return}const t=r.getCoalescedEvents?r.getCoalescedEvents():[r];for(const e of t)At(e,v);Y=!0}function At(r,t){const e=r.pointerType==="pen"?r.pressure:.5;C.push({x:r.offsetX,y:r.offsetY,p:e});const s=performance.now()-t.startedAt;t.points.push({x:r.offsetX,y:r.offsetY,p:e,t:s}),V&&r.pointerType==="pen"&&r.isTrusted&&(U=r)}const Kt=document.getElementById("saveBtn");Kt.addEventListener("click",Qt);function Qt(){if(h.toBlob){h.toBlob(t=>{t&&pt(t)},"image/png");return}const r=h.toDataURL("image/png");fetch(r).then(t=>t.blob()).then(pt)}function pt(r){const t=URL.createObjectURL(r),e=document.createElement("a");e.href=t,e.download=`drawing-${new Date().toISOString().slice(0,10)}.png`,e.click(),URL.revokeObjectURL(t)}const j=[{name:"白",hex:"#FFFFFF"},{name:"黒",hex:"#000000"},{name:"赤",hex:"#EA3323"},{name:"橙",hex:"#FF8A00"},{name:"黄",hex:"#FFD400"},{name:"黄緑",hex:"#9CCC65"},{name:"緑",hex:"#2E7D32"},{name:"水色",hex:"#4FC3F7"},{name:"青",hex:"#1E88E5"},{name:"紫",hex:"#8E24AA"},{name:"茶",hex:"#8D6E63"},{name:"桃",hex:"#F48FB1"}],X=document.getElementById("palette");let H=2;j.forEach((r,t)=>{const e=document.createElement("button");e.className="swatch",e.style.background=r.hex,e.role="radio",e.setAttribute("role","radio"),e.setAttribute("aria-label",r.name),e.setAttribute("aria-checked",t===H?"true":"false"),e.dataset.index=t.toString(),X.appendChild(e)});X.addEventListener("click",r=>{const e=r.target.closest(".swatch");e&&e.dataset.index!==void 0&&Tt(+e.dataset.index)});X.addEventListener("keydown",r=>{const e=j.length;let s=H;if(r.key==="ArrowRight")s=(s+1)%e;else if(r.key==="ArrowLeft")s=(s-1+e)%e;else if(r.key==="ArrowDown")s=Math.min(s+6,e-1);else if(r.key==="ArrowUp")s=Math.max(s-6,0);else if(!(r.key===" "||r.key==="Enter"))return;r.preventDefault(),Tt(s),X.children[s].focus()});const z=document.getElementById("alpha"),Zt=document.getElementById("alphaVal");z.addEventListener("input",()=>{Zt.textContent=(+z.value).toFixed(2),ct()});function Tt(r){X.querySelectorAll(".swatch").forEach((t,e)=>{t.setAttribute("aria-checked",e===r?"true":"false")}),H=r,ct()}function bt(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function Jt(){const[r,t,e]=bt(j[H].hex),s=+z.value;return[r,t,e,s]}function ct(){xt=j[H].hex,Rt=+z.value}ct();const te=document.getElementById("penBtn");te.addEventListener("click",r=>{c.useBrush("Pen")});const ee=document.getElementById("alcholMarkerBtn");ee.addEventListener("click",r=>{c.useBrush("AlcoholMarkerBrush")});const re=document.getElementById("watercolorBtn");re.addEventListener("click",r=>{c.useBrush("WatercolorBrush")});const se=document.getElementById("eraserBtn");se.addEventListener("click",r=>{c.useBrush("Eraser")});document.addEventListener("keydown",r=>{if(r.ctrlKey&&!r.shiftKey&&r.key.toLowerCase()==="z"){r.preventDefault(),oe();return}r.key==="e"&&c.useBrush("Eraser"),r.key==="w"&&c.useBrush("WatercolorBrush"),r.key==="p"&&c.useBrush("Pen")});async function ie(r){try{const e=await(await k.get()).loadDraft();return!e||!Array.isArray(e.strokes)||e.strokes.length<r?!1:(p=e.strokes.slice(0,r).map(q),_.resetHistory(p.length),$(p),!0)}catch(t){return console.error("Failed to restore undo state from IndexedDB.",t),!1}}async function oe(){if(et)return;et=!0;const r=c.getCurrentBrush()?.name??"Pen";try{if(v!=null)jt(),$(p);else{if(p.length===0)return;p.pop();const t=_.popLatestCache();t!=null&&_.restoreFromCache(t)||await ie(p.length)||(_.resetHistory(p.length),$(p))}try{c.useBrush(r)}catch(t){console.warn(`Brush restore failed for '${r}', fallback to Pen.`,t),c.useBrush("Pen")}await K(p.map(q))}finally{et=!1}}c.useBrush("Pen");await wt();c.useBrush("Pen");w.createPingPong(E,h.width,h.height);function lt(){if(!Y){requestAnimationFrame(lt);return}ne(),Y=!1,requestAnimationFrame(lt)}lt();function ne(){const[r,t,e,s]=Jt();for(w.enable(),c.getCurrentBrush()?.use();C.length;){const a=C.shift();a!==void 0&&b.push(a),b.length>4&&b.shift()}T==null&&(T=b[0]);let i=1,o=1,n=1;if(b.length>=2){const[a,l]=b.slice(-2);i=I*T.p,o=I*a.p;let u=1;i<1&&(u=i),n=1,o<1&&(n=o);const g=new Float32Array([T.x,T.y]),f=new Float32Array([a.x,a.y]);_.captureSegment(T,a,i,o);const m=w.updateQuadTrapezoid(h,g,f,i,o,u,n,r,t,e,s);c.getCurrentBrush()?.uploadData(m),c.getCurrentBrush()?.draw(),T=a}if(V&&U&&W&&o>0){const a=`rgba(${Math.round(r*255)}, ${Math.round(t*255)}, ${Math.round(e*255)}, ${s*n})`;V.updateInkTrailStartPoint(U,{diameter:o,color:a}),U=null}w.disable()}function ae(r,t,e,s,i){const[o,n,a]=bt(s),l=e*r.p,u=e*t.p,g=l<1?l:1,f=u<1?u:1,m=new Float32Array([r.x,r.y]),R=new Float32Array([t.x,t.y]),A=w.updateQuadTrapezoid(h,m,R,l,u,g,f,o,n,a,i);c.getCurrentBrush()?.uploadData(A),c.getCurrentBrush()?.draw()}function $(r){E.clearColor(1,1,1,1),E.clear(E.COLOR_BUFFER_BIT);for(const t of r)if(!(!t.points||t.points.length<2)){try{c.useBrush(t.tool)}catch(e){console.warn(`Unknown brush '${t.tool}', fallback to Pen.`,e),c.useBrush("Pen")}c.getCurrentBrush()?.use(),w.reset();for(let e=1;e<t.points.length;e++)ae(t.points[e-1],t.points[e],t.width,t.color,t.alpha)}w.disable(),Y=!1}async function wt(){try{const t=await(await k.get()).loadDraft();if(!t||!Array.isArray(t.strokes)||t.strokes.length===0)return;p=t.strokes,_.resetHistory(p.length),$(p),console.log(`Restored ${p.length} stroke(s) from draft.`)}catch(r){console.error("Failed to restore draft.",r)}}function le(){return new Promise(r=>{if(!h.toBlob){r(new Blob);return}h.toBlob(t=>r(t??new Blob),"image/png")})}function q(r){return{...r,points:r.points.map(t=>({...t}))}}function St(r=!1){const t=p.map(q);return r&&v!=null&&v.points.length>0&&t.push(q(v)),t}async function K(r){return B||(B=(async()=>{try{const t=await k.get(),e=await le(),s=r??St(!0);await t.saveDraft({strokes:s,pngBlob:e,updated:Date.now()})}finally{B=null}})(),B)}const ce=vt(()=>K(),1500);function ht(){p.length===0&&v==null||K()}async function yt(){if(J){tt=!0;return}J=!0;try{const r=c.getCurrentBrush()?.name??"Pen";v!=null&&_t();const t=St(!1);if(t.length===0){nt(),_.clearAll();return}B&&await B,await K(t),nt(),await wt();try{c.useBrush(r)}catch(e){console.warn(`Brush restore failed for '${r}', fallback to Pen.`,e),c.useBrush("Pen")}}catch(r){console.error("Failed to persist/restore on resize.",r)}finally{J=!1,tt&&(tt=!1,yt())}}const he=vt(()=>{yt()},180);window.addEventListener("resize",he);window.addEventListener("pagehide",ht);window.addEventListener("beforeunload",ht);document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&ht()});
