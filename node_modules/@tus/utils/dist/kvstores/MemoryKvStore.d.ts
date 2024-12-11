import type { Upload } from '../models';
import type { KvStore } from './Types';
/**
 * Memory based configstore.
 * Used mostly for unit tests.
 */
export declare class MemoryKvStore<T = Upload> implements KvStore<T> {
    data: Map<string, T>;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
}
//# sourceMappingURL=MemoryKvStore.d.ts.map