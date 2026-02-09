(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();function _t(r){return new Promise((t,e)=>{const s=new Image;s.crossOrigin="anonymous",s.src=r,s.onload=()=>t(s),s.onerror=e})}function zt(r){return r.split(`
`).map((t,e)=>`${String(e+1).padStart(3," ")}: ${t}`).join(`
`)}function R(r,t,e,s=""){const i=r.createShader(t);if(i==null)throw new Error(`Failed to create shader: ${s}`);if(r.shaderSource(i,e),r.compileShader(i),!r.getShaderParameter(i,r.COMPILE_STATUS)){const n=r.getShaderInfoLog(i)||"(no log)",l=r.getExtension("WEBGL_debug_shaders"),c=l?`
--- Translated ---
${l.getTranslatedShaderSource(i)}`:"";throw console.error(`Shader compile error ${s?`(${s})`:""}:
${n}
--- Source ---
${zt(e)}${c}`),r.deleteShader(i),new Error(`Shader compile failed: ${s}`)}return i}function O(r,t,e){const s=r.createProgram();if(r.attachShader(s,t),r.attachShader(s,e),r.linkProgram(s),!r.getProgramParameter(s,r.LINK_STATUS)){const i=r.getProgramInfoLog(s)||"(no log)";throw console.error(`Program link error:
${i}`),r.deleteProgram(s),new Error("Program link failed")}return s}function At(r,t=1500){let e=null;return(...s)=>{e&&clearTimeout(e),e=setTimeout(()=>{e=null,r(...s)},t)}}function qt(){const r=globalThis.crypto;return r&&typeof r.randomUUID=="function"?r.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{const e=Math.random()*16|0;return(t==="x"?e:e&3|8).toString(16)})}class jt{constructor(t){this.gl=t,this.lastNx=0,this.lastNy=0}enable(){}disable(){}reset(){this.lastNx=0,this.lastNy=0}updateQuadTrapezoid(t,e,s,i,n,l,c,u,f,d,g){const[v,x]=e,[_,B]=s,C=_-v,I=B-x,dt=Math.hypot(C,I)||1,J=-I/dt,tt=C/dt;this.lastNx==0&&(this.lastNx=J,this.lastNy=tt);const gt=this.lastNx*(i*.5),pt=this.lastNy*(i*.5),mt=J*(n*.5),Et=tt*(n*.5),Ut=[v+gt,x+pt],Pt=[v-gt,x-pt],Nt=[_-mt,B-Et],Mt=[_+mt,B+Et],Y=(Vt,$t)=>[Vt/t.clientWidth*2-1,-($t/t.clientHeight)*2+1],[Ot,Ct]=Y(...Ut),[It,kt]=Y(...Pt),[Xt,Wt]=Y(...Nt),[Gt,Ht]=Y(...Mt),Yt=new Float32Array([Ot,Ct,u,f,d,g*l,It,kt,u,f,d,g*l,Xt,Wt,u,f,d,g*c,Gt,Ht,u,f,d,g*c]);return this.lastNx=J,this.lastNy=tt,Yt}createFBO(t,e,s){const i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,s,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);const n=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,n),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0);const l=t.checkFramebufferStatus(t.FRAMEBUFFER);if(l!==t.FRAMEBUFFER_COMPLETE)throw console.error("FBO incomplete:",l.toString(16)),new Error("Framebuffer is incomplete");return t.bindTexture(t.TEXTURE_2D,null),t.bindFramebuffer(t.FRAMEBUFFER,null),{fbo:n,tex:i,width:e,height:s}}beginFBO(t,e){t.bindFramebuffer(t.FRAMEBUFFER,e?e.fbo:null),t.viewport(0,0,e?e.width:t.canvas.width,e?e.height:t.canvas.height)}clearRGBA(t,e,s,i,n){t.clearColor(e,s,i,n),t.clear(t.COLOR_BUFFER_BIT)}initdrawFullscreenQuad(){const t=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),this.gl.STATIC_DRAW),this.gl.vertexAttribPointer(0,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(0)}drawFullscreenQuad(t){const e=`#version 300 es
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
        `,i=R(this.gl,this.gl.VERTEX_SHADER,e,"VS_ERASER"),n=R(this.gl,this.gl.FRAGMENT_SHADER,s,"FS_ERASER"),l=O(this.gl,i,n);this.gl.useProgram(l);const c=this.gl.getUniformLocation(l,"u_tex");this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,t),this.gl.uniform1i(c,0),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.gl.disable(this.gl.BLEND)}createPingPong(t,e,s){const i=this.createFBO(t,e,s),n=this.createFBO(t,e,s);let l=i,c=n;return{get read(){return l},get write(){return c},swap(){const u=l;l=c,c=u}}}}class Kt{constructor(t){this.brushes=new Map,this.currentBrush=null,this.gl=t}registerBrush(t){this.brushes.set(t.name,t)}useBrush(t){const e=this.brushes.get(t);if(!e)throw new Error(`Brush '${t}' not registered.`);this.currentBrush=e,e.use()}uploadData(t){this.currentBrush?.uploadData(t)}draw(){this.currentBrush?.draw()}getCurrentBrush(){return this.currentBrush}}const D=class D{constructor(t,e,s){this.name="AlcoholMarkerBrush",this.gl=t;const i=R(t,t.VERTEX_SHADER,D.vs,"VS_AlcoholMarkerBrush"),n=R(t,t.FRAGMENT_SHADER,D.fs,"FS_AlcoholMarkerBrush");this.program=O(t,i,n),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture()}static async create(t,e){const s=await _t("./resources/img/paper.jpg");return new D(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT);const s=this.gl.getUniformLocation(this.program,"u_resolution"),i=this.gl.getUniformLocation(this.program,"u_texScale"),n=this.gl.getUniformLocation(this.program,"u_paper"),l=this.gl.getUniformLocation(this.program,"u_grain");this.gl.uniform2f(s,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(i,1),this.gl.uniform1i(n,0),this.gl.uniform1f(l,.5),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.ONE_MINUS_SRC_COLOR,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};D.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position=vec4(a_pos,0,1);
    }`,D.fs=`#version 300 es
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
    }`;let it=D;const L=class L{constructor(t,e,s){this.name="WatercolorBrush",this.gl=t;const i=R(t,t.VERTEX_SHADER,L.vs,"VS_Watercolor"),n=R(t,t.FRAGMENT_SHADER,L.fs,"FS_Watercolor");this.program=O(t,i,n),this.vbo=t.createBuffer(),this.cvs=e,this.img=s,this.texture=t.createTexture();const l=t.getUniformLocation(this.program,"u_resolution"),c=t.getUniformLocation(this.program,"u_texScale"),u=t.getUniformLocation(this.program,"u_paper"),f=t.getUniformLocation(this.program,"u_grain"),d=t.getUniformLocation(this.program,"u_bleed"),g=t.getUniformLocation(this.program,"u_flow");if(!l||!c||!u||!f||!d||!g)throw new Error("WatercolorBrush: failed to locate uniforms");this.uResolution=l,this.uTexScale=c,this.uPaper=u,this.uGrain=f,this.uBleed=d,this.uFlow=g}static async create(t,e){const s=await _t("./resources/img/paper.jpg");return new L(t,e,s)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);const t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);const e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.R8,this.img.width,this.img.height,0,this.gl.RED,this.gl.UNSIGNED_BYTE,this.img),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT),this.gl.uniform2f(this.uResolution,this.cvs.clientWidth,this.cvs.clientHeight),this.gl.uniform1f(this.uTexScale,1.8),this.gl.uniform1i(this.uPaper,0),this.gl.uniform1f(this.uGrain,.6),this.gl.uniform1f(this.uBleed,2.4),this.gl.uniform1f(this.uFlow,.55),this.gl.enable(this.gl.BLEND),this.gl.blendEquation(this.gl.FUNC_ADD),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};L.vs=`#version 300 es
    in vec2 a_pos;
    in vec4 a_col;
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,L.fs=`#version 300 es
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
    }`;let ot=L;const U=class U{constructor(t,e){this.name="Pen",this.gl=t;const s=R(t,t.VERTEX_SHADER,U.vs,"VS_Pen"),i=R(t,t.FRAGMENT_SHADER,U.fs,"FS_Pen");this.program=O(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new U(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.disable(this.gl.BLEND)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};U.vs=`#version 300 es
    in vec2 a_pos; // 頂点の座標
    in vec4 a_col; // 頂点の色
    out vec4 v_col;
    void main() {
        v_col = a_col;
        gl_Position = vec4(a_pos, 0, 1);
    }`,U.fs=`#version 300 es
    precision mediump float;

    in vec4 v_col; 
    out vec4 o;

    void main() {
        // 入力をそのまま出力
        o = v_col;
    }`;let nt=U;const P=class P{constructor(t,e){this.name="Eraser",this.gl=t;const s=R(t,t.VERTEX_SHADER,P.vs,"VS_PEN"),i=R(t,t.FRAGMENT_SHADER,P.fs,"FS_PEN");this.program=O(t,s,i),this.vbo=t.createBuffer(),this.cvs=e}static async create(t,e){return new P(t,e)}use(){this.gl.useProgram(this.program),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo);let t=this.gl.getAttribLocation(this.program,"a_pos");this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,24,0),this.gl.enableVertexAttribArray(t);let e=this.gl.getAttribLocation(this.program,"a_col");this.gl.vertexAttribPointer(e,4,this.gl.FLOAT,!1,24,8),this.gl.enableVertexAttribArray(e),this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE,this.gl.ONE,this.gl.ONE)}uploadData(t){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STREAM_DRAW)}draw(){this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)}};P.vs=`#version 300 es
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
    }`;let at=P;const p=class p{static async get(){if(!p._instance){const t=new p;await t.open(),p._instance=t}return p._instance}constructor(){}open(){return new Promise((t,e)=>{const s=indexedDB.open(p.DB_NAME,p.DB_VER);s.onupgradeneeded=()=>{const i=s.result;i.objectStoreNames.contains(p.STORE)||i.createObjectStore(p.STORE)},s.onsuccess=()=>{this.db=s.result,t()},s.onerror=()=>e(s.error)})}async saveDraft(t,e="draft"){await new Promise((s,i)=>{const n=this.db.transaction(p.STORE,"readwrite");n.objectStore(p.STORE).put(t,e),n.oncomplete=()=>s(),n.onerror=()=>i(n.error??new Error("Failed to save draft")),n.onabort=()=>i(n.error??new Error("Draft save transaction aborted"))})}loadDraft(t="draft"){return new Promise(e=>{const s=this.db.transaction(p.STORE).objectStore(p.STORE).get(t);s.onsuccess=()=>e(s.result??null)})}async save(t,e){return this.saveDraft(e,t)}load(t){return this.loadDraft(t)}listKeys(){return new Promise(t=>{const e=[],s=this.db.transaction(p.STORE).objectStore(p.STORE).openKeyCursor();s.onsuccess=()=>{const i=s.result;i?(e.push(String(i.key)),i.continue()):t(e)}})}};p.DB_NAME="yunomi-paint",p.STORE="projects",p.DB_VER=1,p._instance=null;let k=p;const a=document.getElementById("c"),o=a.getContext("webgl2",{preserveDrawingBuffer:!0});let E=null,m=[],S=null,et=!1,rt=!1,st=!1;const y=96,Qt=24;let b=null,F=[],Tt="",bt=1;const h=new Kt(o);h.registerBrush(await it.create(o,a));h.registerBrush(await ot.create(o,a));h.registerBrush(await nt.create(o,a));h.registerBrush(await at.create(o,a));let $=!1;function lt(){const r=window.devicePixelRatio||1;a.width=a.clientWidth*r,a.height=a.clientHeight*r,o.viewport(0,0,a.width,a.height)}lt();o.clearColor(1,1,1,1);o.clear(o.COLOR_BUFFER_BIT);let z=null,A={x:0,y:0,p:0},G=!1;const M=[],T=[],ct=document.getElementById("size"),Zt=document.getElementById("preview");let X=+ct.value;const w=new jt(o),V=ue(),vt=o.createBuffer();"ink"in navigator&&navigator.ink?.requestPresenter&&navigator.ink.requestPresenter({presentationArea:a}).then(r=>z=r).catch(console.error);ct.addEventListener("input",()=>{X=+ct.value,Zt.style.transform=`scale(${X/10})`});a.addEventListener("pointerdown",r=>{const t=h.getCurrentBrush();t!==null&&(G=!0,T.length=0,M.length=0,A=null,N=null,E={id:qt(),color:Tt,alpha:bt,tool:t.name,width:X,layer:0,startedAt:performance.now(),points:[]},b={canvasWidth:a.width,canvasHeight:a.height,tiles:new Map},Bt(r,E),a.setPointerCapture(r.pointerId))});"onpointerrawupdate"in window?a.addEventListener("pointerrawupdate",Rt):a.addEventListener("pointermove",Rt);["pointerup","pointercancel","lostpointercapture","pointerout"].forEach(r=>a.addEventListener(r,()=>{wt()&&Ee()}));let N=null;function wt(){if(G=!1,w.reset(),M.length=0,T.length=0,A=null,N=null,E!=null){m.push(E),F.push(b);const r=F.length-Qt-1;return r>=0&&(F[r]=null),E=null,b=null,!0}return b=null,!1}function Jt(){G=!1,w.reset(),M.length=0,T.length=0,A=null,N=null,E=null,b=null}function Rt(r){if(!G)return;if(E===null){console.warn("No current stroke log. Drawing ignored.");return}const t=r.getCoalescedEvents?r.getCoalescedEvents():[r];for(const e of t)Bt(e,E);$=!0}function Bt(r,t){const e=r.pointerType==="pen"?r.pressure:.5;M.push({x:r.offsetX,y:r.offsetY,p:e});const s=performance.now()-t.startedAt;t.points.push({x:r.offsetX,y:r.offsetY,p:e,t:s}),z&&r.pointerType==="pen"&&r.isTrusted&&(N=r)}const te=document.getElementById("saveBtn");te.addEventListener("click",ee);function ee(){if(a.toBlob){a.toBlob(t=>{t&&xt(t)},"image/png");return}const r=a.toDataURL("image/png");fetch(r).then(t=>t.blob()).then(xt)}function xt(r){const t=URL.createObjectURL(r),e=document.createElement("a");e.href=t,e.download=`drawing-${new Date().toISOString().slice(0,10)}.png`,e.click(),URL.revokeObjectURL(t)}const Q=[{name:"白",hex:"#FFFFFF"},{name:"黒",hex:"#000000"},{name:"赤",hex:"#EA3323"},{name:"橙",hex:"#FF8A00"},{name:"黄",hex:"#FFD400"},{name:"黄緑",hex:"#9CCC65"},{name:"緑",hex:"#2E7D32"},{name:"水色",hex:"#4FC3F7"},{name:"青",hex:"#1E88E5"},{name:"紫",hex:"#8E24AA"},{name:"茶",hex:"#8D6E63"},{name:"桃",hex:"#F48FB1"}],W=document.getElementById("palette");let H=2;Q.forEach((r,t)=>{const e=document.createElement("button");e.className="swatch",e.style.background=r.hex,e.role="radio",e.setAttribute("role","radio"),e.setAttribute("aria-label",r.name),e.setAttribute("aria-checked",t===H?"true":"false"),e.dataset.index=t.toString(),W.appendChild(e)});W.addEventListener("click",r=>{const e=r.target.closest(".swatch");e&&e.dataset.index!==void 0&&yt(+e.dataset.index)});W.addEventListener("keydown",r=>{const e=Q.length;let s=H;if(r.key==="ArrowRight")s=(s+1)%e;else if(r.key==="ArrowLeft")s=(s-1+e)%e;else if(r.key==="ArrowDown")s=Math.min(s+6,e-1);else if(r.key==="ArrowUp")s=Math.max(s-6,0);else if(!(r.key===" "||r.key==="Enter"))return;r.preventDefault(),yt(s),W.children[s].focus()});const q=document.getElementById("alpha"),re=document.getElementById("alphaVal");q.addEventListener("input",()=>{re.textContent=(+q.value).toFixed(2),ut()});function yt(r){W.querySelectorAll(".swatch").forEach((t,e)=>{t.setAttribute("aria-checked",e===r?"true":"false")}),H=r,ut()}function Ft(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function se(){const[r,t,e]=Ft(Q[H].hex),s=+q.value;return[r,t,e,s]}function ut(){Tt=Q[H].hex,bt=+q.value}ut();const ie=document.getElementById("penBtn");ie.addEventListener("click",r=>{h.useBrush("Pen")});const oe=document.getElementById("alcholMarkerBtn");oe.addEventListener("click",r=>{h.useBrush("AlcoholMarkerBrush")});const ne=document.getElementById("watercolorBtn");ne.addEventListener("click",r=>{h.useBrush("WatercolorBrush")});const ae=document.getElementById("eraserBtn");ae.addEventListener("click",r=>{h.useBrush("Eraser")});document.addEventListener("keydown",r=>{if(r.ctrlKey&&!r.shiftKey&&r.key.toLowerCase()==="z"){r.preventDefault(),ce();return}r.key==="e"&&h.useBrush("Eraser"),r.key==="w"&&h.useBrush("WatercolorBrush"),r.key==="p"&&h.useBrush("Pen")});async function le(r){try{const e=await(await k.get()).loadDraft();return!e||!Array.isArray(e.strokes)||e.strokes.length<r?!1:(m=e.strokes.slice(0,r).map(K),F=new Array(m.length).fill(null),b=null,j(m),!0)}catch(t){return console.error("Failed to restore undo state from IndexedDB.",t),!1}}async function ce(){if(st)return;st=!0;const r=h.getCurrentBrush()?.name??"Pen";try{if(E!=null)Jt(),j(m);else{if(m.length===0)return;m.pop();const t=F.pop()??null;t!=null&&ge(t)||await le(m.length)||(F=new Array(m.length).fill(null),j(m))}try{h.useBrush(r)}catch(t){console.warn(`Brush restore failed for '${r}', fallback to Pen.`,t),h.useBrush("Pen")}await Z(m.map(K))}finally{st=!1}}h.useBrush("Pen");await St();h.useBrush("Pen");w.createPingPong(o,a.width,a.height);function ht(){if(!$){requestAnimationFrame(ht);return}he(),$=!1,requestAnimationFrame(ht)}ht();function he(){const[r,t,e,s]=se();for(w.enable(),h.getCurrentBrush()?.use();M.length;){const c=M.shift();c!==void 0&&T.push(c),T.length>4&&T.shift()}A==null&&(A=T[0]);let i=1,n=1,l=1;if(T.length>=2){const[c,u]=T.slice(-2);i=X*A.p,n=X*c.p;let f=1;i<1&&(f=i),l=1,n<1&&(l=n);const d=new Float32Array([A.x,A.y]),g=new Float32Array([c.x,c.y]);fe(A,c,i,n);const v=w.updateQuadTrapezoid(a,d,g,i,n,f,l,r,t,e,s);h.getCurrentBrush()?.uploadData(v),h.getCurrentBrush()?.draw(),A=c}if(z&&N&&G&&n>0){const c=`rgba(${Math.round(r*255)}, ${Math.round(t*255)}, ${Math.round(e*255)}, ${s*l})`;z.updateInkTrailStartPoint(N,{diameter:n,color:c}),N=null}w.disable()}function ue(){const r=`#version 300 es
    in vec2 a_pos;
    in vec2 a_uv;
    out vec2 v_uv;
    void main() {
        v_uv = a_uv;
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }`,t=`#version 300 es
    precision mediump float;
    in vec2 v_uv;
    uniform sampler2D u_tex;
    out vec4 o;
    void main() {
        o = texture(u_tex, v_uv);
    }`,e=R(o,o.VERTEX_SHADER,r,"VS_TileRestore"),s=R(o,o.FRAGMENT_SHADER,t,"FS_TileRestore");return O(o,e,s)}function fe(r,t,e,s){const i=b;if(i==null||i.canvasWidth!==a.width||i.canvasHeight!==a.height||a.clientWidth<=0||a.clientHeight<=0)return;const n=Math.max(e,s)*.5+2,l=Math.max(0,Math.min(r.x,t.x)-n),c=Math.max(0,Math.min(r.y,t.y)-n),u=Math.min(a.clientWidth,Math.max(r.x,t.x)+n),f=Math.min(a.clientHeight,Math.max(r.y,t.y)+n),d=Math.floor(l/y),g=Math.floor(Math.max(0,u-1)/y),v=Math.floor(c/y),x=Math.floor(Math.max(0,f-1)/y);for(let _=v;_<=x;_++)for(let B=d;B<=g;B++){const C=`${B}:${_}`;if(i.tiles.has(C))continue;const I=de(B,_);I!=null&&i.tiles.set(C,I)}}function de(r,t){const e=r*y,s=t*y,i=Math.max(0,Math.min(y,a.clientWidth-e)),n=Math.max(0,Math.min(y,a.clientHeight-s));if(i===0||n===0)return null;const l=a.width/a.clientWidth,c=a.height/a.clientHeight,u=Math.floor(e*l),f=Math.floor(s*c),d=Math.max(1,Math.floor(i*l)),g=Math.max(1,Math.floor(n*c)),v=Math.max(0,a.height-(f+g)),x=new Uint8Array(d*g*4);return o.readPixels(u,v,d,g,o.RGBA,o.UNSIGNED_BYTE,x),{cssX:e,cssY:s,cssWidth:i,cssHeight:n,pixels:x,pixelWidth:d,pixelHeight:g,pixelX:u,pixelY:v}}function ge(r){if(r.canvasWidth!==a.width||r.canvasHeight!==a.height||r.tiles.size===0||vt==null)return!1;const t=o.isEnabled(o.BLEND);o.disable(o.BLEND),o.viewport(0,0,a.width,a.height),o.useProgram(V),o.bindBuffer(o.ARRAY_BUFFER,vt);const e=o.getAttribLocation(V,"a_pos"),s=o.getAttribLocation(V,"a_uv");o.enableVertexAttribArray(e),o.vertexAttribPointer(e,2,o.FLOAT,!1,16,0),o.enableVertexAttribArray(s),o.vertexAttribPointer(s,2,o.FLOAT,!1,16,8);const i=o.createTexture();if(i==null)return t&&o.enable(o.BLEND),!1;o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,i),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.NEAREST),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE);const n=o.getUniformLocation(V,"u_tex");o.uniform1i(n,0);for(const l of r.tiles.values()){const c=l.cssX/a.clientWidth*2-1,u=(l.cssX+l.cssWidth)/a.clientWidth*2-1,f=-((l.cssY+l.cssHeight)/a.clientHeight)*2+1,d=-(l.cssY/a.clientHeight)*2+1,g=new Float32Array([c,f,0,0,u,f,1,0,c,d,0,1,c,d,0,1,u,f,1,0,u,d,1,1]);o.bufferData(o.ARRAY_BUFFER,g,o.STREAM_DRAW),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,l.pixelWidth,l.pixelHeight,0,o.RGBA,o.UNSIGNED_BYTE,l.pixels),o.drawArrays(o.TRIANGLES,0,6)}return o.deleteTexture(i),t&&o.enable(o.BLEND),!0}function pe(r,t,e,s,i){const[n,l,c]=Ft(s),u=e*r.p,f=e*t.p,d=u<1?u:1,g=f<1?f:1,v=new Float32Array([r.x,r.y]),x=new Float32Array([t.x,t.y]),_=w.updateQuadTrapezoid(a,v,x,u,f,d,g,n,l,c,i);h.getCurrentBrush()?.uploadData(_),h.getCurrentBrush()?.draw()}function j(r){o.clearColor(1,1,1,1),o.clear(o.COLOR_BUFFER_BIT);for(const t of r)if(!(!t.points||t.points.length<2)){try{h.useBrush(t.tool)}catch(e){console.warn(`Unknown brush '${t.tool}', fallback to Pen.`,e),h.useBrush("Pen")}h.getCurrentBrush()?.use(),w.reset();for(let e=1;e<t.points.length;e++)pe(t.points[e-1],t.points[e],t.width,t.color,t.alpha)}w.disable(),$=!1}async function St(){try{const t=await(await k.get()).loadDraft();if(!t||!Array.isArray(t.strokes)||t.strokes.length===0)return;m=t.strokes,F=new Array(m.length).fill(null),b=null,j(m),console.log(`Restored ${m.length} stroke(s) from draft.`)}catch(r){console.error("Failed to restore draft.",r)}}function me(){return new Promise(r=>{if(!a.toBlob){r(new Blob);return}a.toBlob(t=>r(t??new Blob),"image/png")})}function K(r){return{...r,points:r.points.map(t=>({...t}))}}function Dt(r=!1){const t=m.map(K);return r&&E!=null&&E.points.length>0&&t.push(K(E)),t}async function Z(r){return S||(S=(async()=>{try{const t=await k.get(),e=await me(),s=r??Dt(!0);await t.saveDraft({strokes:s,pngBlob:e,updated:Date.now()})}finally{S=null}})(),S)}const Ee=At(()=>Z(),1500);function ft(){m.length===0&&E==null||Z()}async function Lt(){if(et){rt=!0;return}et=!0;try{const r=h.getCurrentBrush()?.name??"Pen";E!=null&&wt();const t=Dt(!1);if(t.length===0){lt(),F=[],b=null;return}S&&await S,await Z(t),lt(),await St();try{h.useBrush(r)}catch(e){console.warn(`Brush restore failed for '${r}', fallback to Pen.`,e),h.useBrush("Pen")}}catch(r){console.error("Failed to persist/restore on resize.",r)}finally{et=!1,rt&&(rt=!1,Lt())}}const ve=At(()=>{Lt()},180);window.addEventListener("resize",ve);window.addEventListener("pagehide",ft);window.addEventListener("beforeunload",ft);document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&ft()});
