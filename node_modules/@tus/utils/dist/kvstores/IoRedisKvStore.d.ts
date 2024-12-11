import type { Redis as IoRedis } from 'ioredis';
import type { KvStore } from './Types';
import type { Upload } from '../models';
export declare class IoRedisKvStore<T = Upload> implements KvStore<T> {
    private redis;
    private prefix;
    constructor(redis: IoRedis, prefix?: string);
    private prefixed;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private serializeValue;
    private deserializeValue;
}
//# sourceMappingURL=IoRedisKvStore.d.ts.map