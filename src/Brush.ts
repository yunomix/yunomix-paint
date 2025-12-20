/**
 * Brush インターフェースは、描画ブラシの基本機能を定義します。
 * 各ブラシは名前・使用手順・データ転送・描画処理を実装します。
 * これにより、用途の異なるブラシを簡単に追加できます。
 */ 
export interface Brush {
    /** 繝悶Λ繧ｷ縺ｮ蜷榊燕 */
    readonly name: string;

    use(): void;
    uploadData(vertices: Float32Array): void;
    draw(): void;
}

/**
 * BrushManager は複数の Brush を管理し、現在のブラシを操作します。
 * ブラシの登録、選択、頂点データの転送、描画呼び出しを担います。
 */
export class BrushManager {
    private gl: WebGL2RenderingContext;
    private brushes: Map<string, Brush> = new Map();
    private currentBrush: Brush | null = null;

    /**
     * BrushManager のコンストラクタ。
     * 
     * @param gl WebGL2RenderingContext - WebGL コンテキスト。
     */
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    /**
     * ブラシを登録します。
     * @param brush Brush - 登録するブラシ。
     */
    registerBrush(brush: Brush): void {
        this.brushes.set(brush.name, brush);
    }

    /**
     * 指定した名前のブラシを現在のブラシとして選択します。
     * 指定のブラシが存在しない場合はエラーを投げます。
     * 
     * @param name string - 使用するブラシ名。
     * @throws Error - 登録されていない名前が指定された場合。
     */
    useBrush(name: string): void {
        const brush = this.brushes.get(name);
        if (!brush) throw new Error(`Brush '${name}' not registered.`);
        this.currentBrush = brush;
        brush.use();
    }

    /**
     * 現在のブラシに頂点データをアップロードします。
     * 
     * @param data Float32Array - アップロードする頂点データ。
     */
    uploadData(data: Float32Array): void {
        this.currentBrush?.uploadData(data);
    }

    /** 
     * 現在のブラシで描画します。
     * 現在のブラシが設定されていない場合は何もしません。
     */
    draw(): void {
        this.currentBrush?.draw();
    }

    /**
    /**
     * 現在のブラシを取得します。
     * @returns Brush | null - 選択中のブラシ。未設定なら null。
     */
    getCurrentBrush(): Brush | null {
        return this.currentBrush;
    }
}
