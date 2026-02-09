(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();function dt(r){return new Promise((t,e)=>{const s=new Image;s.crossOrigin="anonymous",s.src=r,s.onload=()=>t(s),s.onerror=e})}function Xt(r){return r.split(`
`).map((t,e)=>`${String(e+1).padStart(3," ")}: ${t}`).join(`
`)}function E(r,t,e,s=""){const i=r.createShader(t);if(i==null)throw new Error(`Failed to create shader: ${s}`);if(r.shaderSource(i,e),r.compileShader(i),!r.getShaderParameter(i,r.COMPILE_STATUS)){const o=r.getShaderInfoLog(i)||"(no log)",n=r.getExtension("WEBGL_debug_shaders"),l=n?`
--- Translated ---
${n.getTranslatedShaderSource(i)}`:"";throw console.error(`Shader compile error ${s?`(${s})`:""}:
${o}
--- Source ---
${Xt(e)}${l}`),r.deleteShader(i),new Error(`Shader compile failed: ${s}`)}return i}function N(r,t,e){const s=r.createProgram();if(r.attachShader(s,t),r.attachShader(s,e),r.linkProgram(s),!r.getProgramParameter(s,r.LINK_STATUS)){const i=r.getProgramInfoLog(s)||"(no log)";throw console.error(`Program link error:
${i}`),r.deleteProgram(s),new Error("Program link failed")}return s}function pt(r,t=1500){let e=null;return(...s)=>{e&&clearTimeout(e),e=setTimeout(()=>{e=null,r(...s)},t)}}function Gt(){const r=globalThis.crypto;return r&&typeof r.randomUUID=="function"?r.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{const e=Math.random()*16|0;return(t==="x"?e:e&3|8).toString(16)})}class Vt{constructor(t){this.gl=t,this.lastNx=0,this.lastNy=0}enable(){}disable(){}reset(){this.lastNx=0,this.lastNy=0}updateQuadTrapezoid(t,e,s,i,o,n,l,h,f,p,m){const[_,S]=e,[L,W]=s,it=L-_,ot=W-S,nt=Math.hypot(it,ot)||1,$=-ot/nt,Y=it/nt;this.lastNx==0&&(this.lastNx=$,this.lastNy=Y);const at=this.lastNx*(i*.5),lt=this.lastNy*(i*.5),ct=$*(o*.5),ut=Y*(o*.5),wt=[_+at,S+lt],Bt=[_-at,S-lt],Ft=[L-ct,W-ut],yt=[L+ct,W+ut],C=(kt,Mt)=>[kt/t.clientWidth*2-1,-(Mt/t.clientHeight)*2+1],[St,Lt]=C(...wt),[Dt,Pt]=C(...Bt),[Ut,Nt]=C(...Ft),[Ot,Ct]=C(...yt),It=new Float32Array([St,Lt,h,f,p,m*n,Dt,Pt,h,f,p,m*n,Ut,Nt,h,f,p,m*l,Ot,Ct,h,f,p,m*l]);return this.lastNx=$,this.lastNy=Y,It}createFBO(t,e,s){const i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,s,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);const o=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,o),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0);const n=t.checkFramebufferStatus(t.FRAMEBUFFER);if(n!==t.FRAMEBUFFER_COMPLETE)throw console.error("FBO incomplete:",n.toString(16)),new Error("Framebuffer is incomplete");return t.bindTexture(t.TEXTURE_2D,null),t.bindFramebuffer(t.FRAMEBUFFER,null),{fbo:o,tex:i,width:e,height:s}}beginFBO(t,e){t.bindFramebuffer(t.FRAMEBUFFER,e?e.fbo:null),t.viewport(0,0,e?e.width:t.canvas.width,e?e.height:t.canvas.height)}clearRGBA(t,e,s,i,o){t.clearColor(e,s,i,o),t.clear(t.COLOR_BUFFER_BIT)}initdrawFullscreenQuad(){const t=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),this.gl.STATIC_DRAW),this.gl.vertexAttribPointer(0,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(0)}drawFullscreenQuad(t){const e=`#version 300 es
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
        `,i=E(this.gl,this.gl.VERTEX_SHADER,e,"VS_ERASER"),o=E(this.gl,this.gl.FRAGMENT_SHADER,s,"FS_ERASER"),n=N(this.gl,i,o);this.gl.useProgram(n);const l=this.gl.getUniformLocation(n,"u_tex");this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,t),this.gl.uniform1i(l,0),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.gl.disable(this.gl.BLEND)}createPingPong(t,e,s){const i=this.createFBO(t,e,s),o=this.createFBO(t,e,s);let n=i,l=o;return{get read(){return n},get write(){return l},swap(){const h=n;n=l,l=h}}}}class Wt{constructor(t){this.brushes=new Map,this.currentBrush=null,this.gl=t}registerBrush(t){this.brushes.set(t.name,t)}useBrush(t){const e=this.brushes.get(t);if(!e)throw new Error(`Brush '${t}' not registered.`);this.currentBrush=e,e.use()}uploadData(t){this.currentBrush?.uploadData(t)}draw(){this.currentBrush?.draw()}getCurrentBrush(){return this.currentBrush}}const T=class T{constructor(t,e,s){this.name="AlcoholMarkerBrush",this.gl=t;const i=E(t,t.VERTEX_SHADER,T.vs,"VS_AlcoholMarkerBrush"),o=E(t,t.FRAGMENT_SHADER,T.fs,"FS_AlcoholMarkerBrush");this.program=N(t,i,o),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture()}static async create(t,e){const s=await dt("./resources/img/paper.jpg");return new T(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT);const s=this.gl.getUniformLocation(this.program,"u_resolution"),i=this.gl.getUniformLocation(this.program,"u_texScale"),o=this.gl.getUniformLocation(this.program,"u_paper"),n=this.gl.getUniformLocation(this.program,"u_grain");this.gl.uniform2f(s,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(i,1),this.gl.uniform1i(o,0),this.gl.uniform1f(n,.5),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.ONE_MINUS_SRC_COLOR,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};T.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`,T.fs=`#version 300 es
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
    }`;let z=T;const b=class b{constructor(t,e,s){this.name="WatercolorBrush",this.gl=t;const i=E(t,t.VERTEX_SHADER,b.vs,"VS_Watercolor"),o=E(t,t.FRAGMENT_SHADER,b.fs,"FS_Watercolor");this.program=N(t,i,o),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture();const n=t.getUniformLocation(this.program,"u_resolution"),l=t.getUniformLocation(this.program,"u_texScale"),h=t.getUniformLocation(this.program,"u_paper"),f=t.getUniformLocation(this.program,"u_grain"),p=t.getUniformLocation(this.program,"u_bleed"),m=t.getUniformLocation(this.program,"u_flow");if(!n||!l||!h||!f||!p||!m)throw new Error("WatercolorBrush: failed to locate uniforms");this.uResolution=n,this.uTexScale=l,this.uPaper=h,this.uGrain=f,this.uBleed=p,this.uFlow=m}static async create(t,e){const s=await dt("./resources/img/paper.jpg");return new b(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);const t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);const e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT),this.gl.uniform2f(this.uResolution,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(this.uTexScale,1.8),this.gl.uniform1i(this.uPaper,0),this.gl.uniform1f(this.uGrain,.6),this.gl.uniform1f(this.uBleed,2.4),this.gl.uniform1f(this.uFlow,.55),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};b.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,b.fs=`#version 300 es
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
    }`;let j=b;const w=class w{constructor(t,e){this.name="Pen",this.gl=t;const s=E(t,t.VERTEX_SHADER,w.vs,"VS_Pen"),i=E(t,t.FRAGMENT_SHADER,w.fs,"FS_Pen");this.program=N(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new w(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.disable(this.gl.BLEND)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};w.vs=`#version 300 es
    in vec2 a_pos; // 頂点の座標
    in vec4 a_col; // 頂点の色
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,w.fs=`#version 300 es
    precision mediump float;

    in vec4 v_col; 
    out vec4 o;

    void main() {
        // 入力をそのまま出力
        o = v_col;
    }`;let Q=w;const B=class B{constructor(t,e){this.name="Eraser",this.gl=t;const s=E(t,t.VERTEX_SHADER,B.vs,"VS_PEN"),i=E(t,t.FRAGMENT_SHADER,B.fs,"FS_PEN");this.program=N(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new B(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE,this.gl.ONE,this.gl.ONE)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};B.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`,B.fs=`#version 300 es
    precision mediump float; 
    in vec4 v_col; 
    out vec4 o;
    void main(){
        float a = v_col.a;
        o = vec4(v_col.rgb * a, a);
    }`;let K=B;const u=class u{static async get(){if(!u._instance){const t=new u;await t.open(),u._instance=t}return u._instance}constructor(){}open(){return new Promise((t,e)=>{const s=indexedDB.open(u.DB_NAME,u.DB_VER);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains(u.STORE)||i.createObjectStore(u.STORE)},s.onsuccess=()=>{this.db=s.result,t()},s.onerror=()=>e(s.error)})}async saveDraft(t,e="draft"){await new Promise((s,i)=>{const o=this.db.transaction(u.STORE,"readwrite");o.objectStore(u.STORE).put(t,e),o.oncomplete=()=>s(),o.onerror=()=>i(o.error??new Error("Failed to save draft")),o.onabort=()=>i(o.error??new Error("Draft save transaction aborted"))})}loadDraft(t="draft"){return new Promise(e=>{const s=this.db.transaction(u.STORE).objectStore(u.STORE).get(t);s.onsuccess=()=>e(s.result??null)})}async save(t,e){return this.saveDraft(e,t)}load(t){return this.loadDraft(t)}listKeys(){return new Promise(t=>{const e=[],s=this.db.transaction(u.STORE).objectStore(u.STORE).openKeyCursor();s.onsuccess=()=>{const i=s.result;i?(e.push(String(i.key)),i.continue()):t(e)}})}};u.DB_NAME="yunomi-paint",u.STORE="projects",u.DB_VER=1,u._instance=null;let I=u;const a=document.getElementById("c"),g=a.getContext("webgl2",{preserveDrawingBuffer:!0});let d=null,F=[],x=null,H=!1,q=!1,mt="",Et=1;const c=new Wt(g);c.registerBrush(await z.create(g,a));c.registerBrush(await j.create(g,a));c.registerBrush(await Q.create(g,a));c.registerBrush(await K.create(g,a));let k=!1;function Z(){const r=window.devicePixelRatio||1;a.width=a.clientWidth*r,a.height=a.clientHeight*r,g.viewport(0,0,a.width,a.height)}Z();g.clearColor(1,1,1,1);g.clear(g.COLOR_BUFFER_BIT);let M=null,v={x:0,y:0,p:0},G=!1;const D=[],R=[],J=document.getElementById("size"),$t=document.getElementById("preview");let P=+J.value;const A=new Vt(g);"ink"in navigator&&navigator.ink?.requestPresenter&&navigator.ink.requestPresenter({presentationArea:a}).then(r=>M=r).catch(console.error);J.addEventListener("input",()=>{P=+J.value,$t.style.transform=`scale(${P/10})`});a.addEventListener("pointerdown",r=>{const t=c.getCurrentBrush();t!==null&&(G=!0,R.length=0,D.length=0,v=null,y=null,d={id:Gt(),color:mt,alpha:Et,tool:t.name,width:P,layer:0,startedAt:performance.now(),points:[]},Rt(r,d),a.setPointerCapture(r.pointerId))});"onpointerrawupdate"in window?a.addEventListener("pointerrawupdate",ht):a.addEventListener("pointermove",ht);["pointerup","pointercancel","lostpointercapture","pointerout"].forEach(r=>a.addEventListener(r,()=>{vt()&&se()}));let y=null;function vt(){return G=!1,A.reset(),D.length=0,R.length=0,v=null,y=null,d!=null?(F.push(d),d=null,!0):!1}function ht(r){if(!G)return;if(d===null){console.warn("No current stroke log. Drawing ignored.");return}const t=r.getCoalescedEvents?r.getCoalescedEvents():[r];for(const e of t)Rt(e,d);k=!0}function Rt(r,t){const e=r.pointerType==="pen"?r.pressure:.5;D.push({x:r.offsetX,y:r.offsetY,p:e});const s=performance.now()-t.startedAt;t.points.push({x:r.offsetX,y:r.offsetY,p:e,t:s}),M&&r.pointerType==="pen"&&r.isTrusted&&(y=r)}const Yt=document.getElementById("saveBtn");Yt.addEventListener("click",Ht);function Ht(){if(a.toBlob){a.toBlob(t=>{t&&ft(t)},"image/png");return}const r=a.toDataURL("image/png");fetch(r).then(t=>t.blob()).then(ft)}function ft(r){const t=URL.createObjectURL(r),e=document.createElement("a");e.href=t,e.download=`drawing-${new Date().toISOString().slice(0,10)}.png`,e.click(),URL.revokeObjectURL(t)}const V=[{name:"白",hex:"#FFFFFF"},{name:"黒",hex:"#000000"},{name:"赤",hex:"#EA3323"},{name:"橙",hex:"#FF8A00"},{name:"黄",hex:"#FFD400"},{name:"黄緑",hex:"#9CCC65"},{name:"緑",hex:"#2E7D32"},{name:"水色",hex:"#4FC3F7"},{name:"青",hex:"#1E88E5"},{name:"紫",hex:"#8E24AA"},{name:"茶",hex:"#8D6E63"},{name:"桃",hex:"#F48FB1"}],U=document.getElementById("palette");let O=2;V.forEach((r,t)=>{const e=document.createElement("button");e.className="swatch",e.style.background=r.hex,e.role="radio",e.setAttribute("role","radio"),e.setAttribute("aria-label",r.name),e.setAttribute("aria-checked",t===O?"true":"false"),e.dataset.index=t.toString(),U.appendChild(e)});U.addEventListener("click",r=>{const e=r.target.closest(".swatch");e&&e.dataset.index!==void 0&&At(+e.dataset.index)});U.addEventListener("keydown",r=>{const e=V.length;let s=O;if(r.key==="ArrowRight")s=(s+1)%e;else if(r.key==="ArrowLeft")s=(s-1+e)%e;else if(r.key==="ArrowDown")s=Math.min(s+6,e-1);else if(r.key==="ArrowUp")s=Math.max(s-6,0);else if(!(r.key===" "||r.key==="Enter"))return;r.preventDefault(),At(s),U.children[s].focus()});const X=document.getElementById("alpha"),qt=document.getElementById("alphaVal");X.addEventListener("input",()=>{qt.textContent=(+X.value).toFixed(2),et()});function At(r){U.querySelectorAll(".swatch").forEach((t,e)=>{t.setAttribute("aria-checked",e===r?"true":"false")}),O=r,et()}function _t(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function zt(){const[r,t,e]=_t(V[O].hex),s=+X.value;return[r,t,e,s]}function et(){mt=V[O].hex,Et=+X.value}et();const jt=document.getElementById("penBtn");jt.addEventListener("click",r=>{c.useBrush("Pen")});const Qt=document.getElementById("alcholMarkerBtn");Qt.addEventListener("click",r=>{c.useBrush("AlcoholMarkerBrush")});const Kt=document.getElementById("watercolorBtn");Kt.addEventListener("click",r=>{c.useBrush("WatercolorBrush")});const Zt=document.getElementById("eraserBtn");Zt.addEventListener("click",r=>{c.useBrush("Eraser")});document.addEventListener("keydown",r=>{r.key==="e"&&c.useBrush("Eraser"),r.key==="w"&&c.useBrush("WatercolorBrush"),r.key==="p"&&c.useBrush("Pen")});c.useBrush("Pen");await xt();c.useBrush("Pen");A.createPingPong(g,a.width,a.height);function tt(){if(!k){requestAnimationFrame(tt);return}Jt(),k=!1,requestAnimationFrame(tt)}tt();function Jt(){const[r,t,e,s]=zt();for(A.enable(),c.getCurrentBrush()?.use();D.length;){const l=D.shift();l!==void 0&&R.push(l),R.length>4&&R.shift()}v==null&&(v=R[0]);let i=1,o=1,n=1;if(R.length>=2){const[l,h]=R.slice(-2);i=P*v.p,o=P*l.p;let f=1;i<1&&(f=i),n=1,o<1&&(n=o);const p=new Float32Array([v.x,v.y]),m=new Float32Array([l.x,l.y]),_=A.updateQuadTrapezoid(a,p,m,i,o,f,n,r,t,e,s);c.getCurrentBrush()?.uploadData(_),c.getCurrentBrush()?.draw(),v=l}if(M&&y&&G&&o>0){const l=`rgba(${Math.round(r*255)}, ${Math.round(t*255)}, ${Math.round(e*255)}, ${s*n})`;M.updateInkTrailStartPoint(y,{diameter:o,color:l}),y=null}A.disable()}function te(r,t,e,s,i){const[o,n,l]=_t(s),h=e*r.p,f=e*t.p,p=h<1?h:1,m=f<1?f:1,_=new Float32Array([r.x,r.y]),S=new Float32Array([t.x,t.y]),L=A.updateQuadTrapezoid(a,_,S,h,f,p,m,o,n,l,i);c.getCurrentBrush()?.uploadData(L),c.getCurrentBrush()?.draw()}function ee(r){g.clearColor(1,1,1,1),g.clear(g.COLOR_BUFFER_BIT);for(const t of r)if(!(!t.points||t.points.length<2)){try{c.useBrush(t.tool)}catch(e){console.warn(`Unknown brush '${t.tool}', fallback to Pen.`,e),c.useBrush("Pen")}c.getCurrentBrush()?.use(),A.reset();for(let e=1;e<t.points.length;e++)te(t.points[e-1],t.points[e],t.width,t.color,t.alpha)}A.disable(),k=!1}async function xt(){try{const t=await(await I.get()).loadDraft();if(!t||!Array.isArray(t.strokes)||t.strokes.length===0)return;F=t.strokes,ee(F),console.log(`Restored ${F.length} stroke(s) from draft.`)}catch(r){console.error("Failed to restore draft.",r)}}function re(){return new Promise(r=>{if(!a.toBlob){r(new Blob);return}a.toBlob(t=>r(t??new Blob),"image/png")})}function gt(r){return{...r,points:r.points.map(t=>({...t}))}}function Tt(r=!1){const t=F.map(gt);return r&&d!=null&&d.points.length>0&&t.push(gt(d)),t}async function rt(r){return x||(x=(async()=>{try{const t=await I.get(),e=await re(),s=r??Tt(!0);await t.saveDraft({strokes:s,pngBlob:e,updated:Date.now()})}finally{x=null}})(),x)}const se=pt(()=>rt(),1500);function st(){F.length===0&&d==null||rt()}async function bt(){if(H){q=!0;return}H=!0;try{const r=c.getCurrentBrush()?.name??"Pen";d!=null&&vt();const t=Tt(!1);if(t.length===0){Z();return}x&&await x,await rt(t),Z(),await xt();try{c.useBrush(r)}catch(e){console.warn(`Brush restore failed for '${r}', fallback to Pen.`,e),c.useBrush("Pen")}}catch(r){console.error("Failed to persist/restore on resize.",r)}finally{H=!1,q&&(q=!1,bt())}}const ie=pt(()=>{bt()},180);window.addEventListener("resize",ie);window.addEventListener("pagehide",st);window.addEventListener("beforeunload",st);document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&st()});
