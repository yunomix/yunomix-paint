export function loadTexture(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}
export function withLineNumbers(src) {
    return src.split('\n').map((l, i) => `${String(i + 1).padStart(3, ' ')}: ${l}`).join('\n');
}
export function compileShader(gl, type, source, name = '') {
    const sh = gl.createShader(type);
    if (sh == null) {
        throw new Error(`Failed to create shader: ${name}`);
    }
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh) || '(no log)';
        const dbg = gl.getExtension('WEBGL_debug_shaders');
        const translated = dbg ? `\n--- Translated ---\n${dbg.getTranslatedShaderSource(sh)}` : '';
        console.error(`Shader compile error ${name ? `(${name})` : ''}:\n${log}\n--- Source ---\n${withLineNumbers(source)}${translated}`);
        gl.deleteShader(sh);
        throw new Error(`Shader compile failed: ${name}`);
    }
    return sh;
}
export function linkProgram(gl, vs, fs) {
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(prog) || '(no log)';
        console.error(`Program link error:\n${log}`);
        gl.deleteProgram(prog);
        throw new Error('Program link failed');
    }
    return prog;
}
/**
 * 任意の関数 fn をデバウンスして返す。
 * 例: const save = debounce(() => saveDraft(data), 1500);
 *
 * @param fn      実際に実行したい処理
 * @param delayMs デバウンス遅延 (ms) ─ 既定 1 500 (≒1.5 秒)
 * @returns       デバウンス済みラッパ関数
 */
export function debounce(fn, delayMs = 1500 // 1〜2 秒ゾーンのデフォルト
) {
    let timer = null;
    return (...args) => {
        if (timer)
            clearTimeout(timer); // 直前の予約をキャンセル
        timer = setTimeout(() => {
            timer = null; // 完了フラグ
            fn(...args); // 遅延実行
        }, delayMs);
    };
}
