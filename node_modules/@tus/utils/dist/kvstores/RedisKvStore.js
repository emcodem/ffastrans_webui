"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisKvStore = void 0;
/**
 * Redis based configstore.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
class RedisKvStore {
    constructor(redis, prefix = '') {
        this.redis = redis;
        this.prefix = prefix;
        this.redis = redis;
        this.prefix = prefix;
    }
    async get(key) {
        return this.deserializeValue(await this.redis.get(this.prefix + key));
    }
    async set(key, value) {
        await this.redis.set(this.prefix + key, this.serializeValue(value));
    }
    async delete(key) {
        await this.redis.del(this.prefix + key);
    }
    async list() {
        const keys = new Set();
        let cursor = 0;
        do {
            const result = await this.redis.scan(cursor, { MATCH: `${this.prefix}*`, COUNT: 20 });
            cursor = result.cursor;
            for (const key of result.keys)
                keys.add(key);
        } while (cursor !== 0);
        return Array.from(keys);
    }
    serializeValue(value) {
        return JSON.stringify(value);
    }
    deserializeValue(buffer) {
        return buffer ? JSON.parse(buffer) : undefined;
    }
}
exports.RedisKvStore = RedisKvStore;
//# sourceMappingURL=RedisKvStore.js.map