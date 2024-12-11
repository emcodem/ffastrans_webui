"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IoRedisKvStore = void 0;
class IoRedisKvStore {
    constructor(redis, prefix = '') {
        this.redis = redis;
        this.prefix = prefix;
        this.redis = redis;
        this.prefix = prefix;
    }
    prefixed(key) {
        return `${this.prefix}${key}`;
    }
    async get(key) {
        return this.deserializeValue(await this.redis.get(this.prefixed(key)));
    }
    async set(key, value) {
        await this.redis.set(this.prefixed(key), this.serializeValue(value));
    }
    async delete(key) {
        await this.redis.del(this.prefixed(key));
    }
    async list() {
        const keys = new Set();
        let cursor = '0';
        do {
            const [next, batch] = await this.redis.scan(cursor, 'MATCH', this.prefixed('*'), 'COUNT', '20');
            cursor = next;
            for (const key of batch)
                keys.add(key);
        } while (cursor !== '0');
        return Array.from(keys);
    }
    serializeValue(value) {
        return JSON.stringify(value);
    }
    deserializeValue(buffer) {
        return buffer ? JSON.parse(buffer) : undefined;
    }
}
exports.IoRedisKvStore = IoRedisKvStore;
//# sourceMappingURL=IoRedisKvStore.js.map