"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryKvStore = void 0;
/**
 * Memory based configstore.
 * Used mostly for unit tests.
 */
class MemoryKvStore {
    constructor() {
        this.data = new Map();
    }
    async get(key) {
        return this.data.get(key);
    }
    async set(key, value) {
        this.data.set(key, value);
    }
    async delete(key) {
        this.data.delete(key);
    }
    async list() {
        return [...this.data.keys()];
    }
}
exports.MemoryKvStore = MemoryKvStore;
//# sourceMappingURL=MemoryKvStore.js.map