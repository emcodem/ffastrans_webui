import type { KvStore } from './Types';
import type { Upload } from '../models';
/**
 * FileConfigstore writes the `Upload` JSON metadata to disk next the uploaded file itself.
 * It uses a queue which only processes one operation at a time to prevent unsafe concurrent access.
 */
export declare class FileKvStore<T = Upload> implements KvStore<T> {
    directory: string;
    constructor(path: string);
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private resolve;
}
//# sourceMappingURL=FileKvStore.d.ts.map