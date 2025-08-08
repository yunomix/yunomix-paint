/* -----------------------------------------------
 * IndexedDB ラッパクラス
 * ---------------------------------------------*/
export class InkDB {
    static async get() {
        if (!InkDB._instance) {
            const inst = new InkDB();
            await inst.open();
            InkDB._instance = inst;
        }
        return InkDB._instance;
    }
    constructor() { }
    /* ---------- DB オープン / アップグレード ---------- */
    open() {
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
    /** 下書き保存（上書き）*/
    async saveDraft(data, key = 'draft') {
        const tx = this.db.transaction(InkDB.STORE, 'readwrite');
        tx.objectStore(InkDB.STORE).put(data, key);
        await tx.oncomplete;
    }
    /** 下書きを読む（なければ null）*/
    loadDraft(key = 'draft') {
        return new Promise(res => {
            const req = this.db
                .transaction(InkDB.STORE)
                .objectStore(InkDB.STORE)
                .get(key);
            req.onsuccess = () => { var _a; return res((_a = req.result) !== null && _a !== void 0 ? _a : null); };
        });
    }
    /** 任意キーで保存（プロジェクト名など） */
    async save(key, data) {
        return this.saveDraft(data, key);
    }
    load(key) {
        return this.loadDraft(key);
    }
    /** プロジェクト一覧を取得 */
    listKeys() {
        return new Promise(res => {
            const keys = [];
            const req = this.db
                .transaction(InkDB.STORE)
                .objectStore(InkDB.STORE)
                .openKeyCursor();
            req.onsuccess = () => {
                const c = req.result;
                if (c) {
                    keys.push(String(c.key));
                    c.continue();
                }
                else {
                    res(keys);
                }
            };
        });
    }
}
InkDB.DB_NAME = 'yunomi-paint'; // DB 名
InkDB.STORE = 'projects';
InkDB.DB_VER = 1;
/* ─── Singleton パターン（optional） ─── */
InkDB._instance = null;
