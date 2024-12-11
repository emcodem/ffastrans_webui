import type { RedisClientType } from '@redis/client';
import type { KvStore } from './Types';
import type { Upload } from '../models';
/**
 * Redis based configstore.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
export declare class RedisKvStore<T = Upload> implements KvStore<T> {
    private redis;
    private prefix;
    constructor(redis: RedisClientType, prefix?: string);
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private serializeValue;
    private deserializeValue;
}
//# sourceMappingURL=RedisKvStore.d.ts.map