/* -----------------------------------------------
 * 型定義など細かい部分は別ファイルへ切り出し
 * ---------------------------------------------*/
export interface Point {
    x: number; y: number; p: number; t: number;
}
export interface StrokeLog {
    id: string;
    color: string;
    alpha: number;
    tool: string;
    width: number;
    layer?: number;
    startedAt: number;
    points: Point[];
    seed?: number;
}
export interface DraftPayload {
    strokes: StrokeLog[];
    pngBlob: Blob;          // レイヤーやサムネイル用の PNG
    updated: number;        // epoch ms
}

/* -----------------------------------------------
 * IndexedDB ラッパークラス
 * ---------------------------------------------*/
export class InkDB {
    private db!: IDBDatabase;               // 実際の IDB
    static readonly DB_NAME = 'yunomi-paint'; // DB 名
    static readonly STORE = 'projects';
    static readonly DB_VER = 1;

    /* ─── Singleton パターン（optional）─── */
    private static _instance: InkDB | null = null;
    static async get(): Promise<InkDB> {
        if (!InkDB._instance) {
            const inst = new InkDB();
            await inst.open();
            InkDB._instance = inst;
        }
        return InkDB._instance;
    }

    private constructor() {/* 外部から new させない */ }

    /* ---------- DB オープン / アップグレード ---------- */
    private open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(InkDB.DB_NAME, InkDB.DB_VER);

            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(InkDB.STORE)) {
                    db.createObjectStore(InkDB.STORE);
                }
            };
            req.onsuccess = () => { this.db = req.result; resolve(); };
            req.onerror = () => reject(req.error);
        });
    }

    /* ---------- 公開 API ---------- */

    /** 下書きを保存（上書き）*/
    async saveDraft(data: DraftPayload, key = 'draft'): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const tx = this.db.transaction(InkDB.STORE, 'readwrite');
            tx.objectStore(InkDB.STORE).put(data, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('Failed to save draft'));
            tx.onabort = () => reject(tx.error ?? new Error('Draft save transaction aborted'));
        });
    }

    /** 下書きを読み込む。存在しなければ null */
    loadDraft(key = 'draft'): Promise<DraftPayload | null> {
        return new Promise(res => {
            const req = this.db
                .transaction(InkDB.STORE)
                .objectStore(InkDB.STORE)
                .get(key);
            req.onsuccess = () => res(req.result ?? null);
        });
    }

    /** 任意キーで保存（プロジェクト名など）*/
    async save(key: string, data: DraftPayload) {
        return this.saveDraft(data, key);
    }

    load(key: string) {
        return this.loadDraft(key);
    }

    /** プロジェクト一覧を取得 */
    listKeys(): Promise<string[]> {
        return new Promise(res => {
            const keys: string[] = [];
            const req = this.db
                .transaction(InkDB.STORE)
                .objectStore(InkDB.STORE)
                .openKeyCursor();
            req.onsuccess = () => {
                const c = req.result;
                if (c) {
                    keys.push(String(c.key)); c.continue();
                } else {
                    res(keys);
                }
            };
        });
    }
}
