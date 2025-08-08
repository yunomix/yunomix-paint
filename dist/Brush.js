/**
 * BrushManager は、複数の Brush を管理し、現在使用中の Brush を操作するクラスです。
 * ブラシの登録、使用、データのアップロード、描画を行います。
 */
export class BrushManager {
    /**
     * BrushManager のコンストラクタ
     *
     * @param gl WebGL2RenderingContext - WebGL コンテキスト
     */
    constructor(gl) {
        this.brushes = new Map();
        this.currentBrush = null;
        this.gl = gl;
    }
    /**
     * ブラシを登録します。
     * @param brush Brush - 登録するブラシ
     */
    registerBrush(brush) {
        this.brushes.set(brush.name, brush);
    }
    /**
     * 現在のブラシを指定された名前のブラシに切り替えます。
     * ブラシが存在しない場合はエラーをスローします。
     *
     * @param name string - 使用するブラシの名前
     * @throws Error - 指定された名前のブラシが登録されていない場合にエラーを投げます。
     */
    useBrush(name) {
        const brush = this.brushes.get(name);
        if (!brush)
            throw new Error(`Brush '${name}' not registered.`);
        this.currentBrush = brush;
        brush.use();
    }
    /**
     * 現在のブラシに頂点データをアップロードします。
     *
     * @param data Float32Array - ブラシにアップロードする頂点データ
     */
    uploadData(data) {
        var _a;
        (_a = this.currentBrush) === null || _a === void 0 ? void 0 : _a.uploadData(data);
    }
    /**
     * 現在のブラシを使用して描画を行います。
     * 現在のブラシが設定されていない場合は何もしません。
     */
    draw() {
        var _a;
        (_a = this.currentBrush) === null || _a === void 0 ? void 0 : _a.draw();
    }
    /**
     * 現在のブラシを取得します。ブラシが設定されていない場合は null を返します。
     * これにより、現在の描画ツールを確認できます。
     * @returns Brush | null - 現在使用中のブラシを返します。設定されていない場合は null を返します。
     */
    getCurrentBrush() {
        return this.currentBrush;
    }
}
