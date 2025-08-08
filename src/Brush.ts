/**
 * Brush インターフェースは、描画に使用するブラシの基本的な機能を定義します。
 * 各ブラシは、名前、使用方法、データのアップロード、描画処理を持ちます。
 * このインターフェースを実装することで、異なる種類のブラシを作成できます。
 */ 
export interface Brush {
    /** ブラシの名前 */
    readonly name: string;

    use(): void;
    uploadData(vertices: Float32Array): void;
    draw(): void;
}

/**
 * BrushManager は、複数の Brush を管理し、現在使用中の Brush を操作するクラスです。
 * ブラシの登録、使用、データのアップロード、描画を行います。
 */
export class BrushManager {
    private gl: WebGL2RenderingContext;
    private brushes: Map<string, Brush> = new Map();
    private currentBrush: Brush | null = null;

    /**
     * BrushManager のコンストラクタ
     * 
     * @param gl WebGL2RenderingContext - WebGL コンテキスト
     */
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    /**
     * ブラシを登録します。
     * @param brush Brush - 登録するブラシ
     */
    registerBrush(brush: Brush): void {
        this.brushes.set(brush.name, brush);
    }

    /**
     * 現在のブラシを指定された名前のブラシに切り替えます。
     * ブラシが存在しない場合はエラーをスローします。
     * 
     * @param name string - 使用するブラシの名前
     * @throws Error - 指定された名前のブラシが登録されていない場合にエラーを投げます。
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
     * @param data Float32Array - ブラシにアップロードする頂点データ
     */
    uploadData(data: Float32Array): void {
        this.currentBrush?.uploadData(data);
    }

    /** 
     * 現在のブラシを使用して描画を行います。
     * 現在のブラシが設定されていない場合は何もしません。
     */
    draw(): void {
        this.currentBrush?.draw();
    }

    /**
     * 現在のブラシを取得します。ブラシが設定されていない場合は null を返します。
     * これにより、現在の描画ツールを確認できます。
     * @returns Brush | null - 現在使用中のブラシを返します。設定されていない場合は null を返します。
     */
    getCurrentBrush(): Brush | null {
        return this.currentBrush;
    }
}
