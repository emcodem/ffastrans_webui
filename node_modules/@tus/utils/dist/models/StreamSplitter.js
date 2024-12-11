"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSplitter = void 0;
/* global BufferEncoding */
const node_crypto_1 = __importDefault(require("node:crypto"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_stream_1 = __importDefault(require("node:stream"));
function randomString(size) {
    return node_crypto_1.default.randomBytes(size).toString('base64url').slice(0, size);
}
class StreamSplitter extends node_stream_1.default.Writable {
    constructor({ chunkSize, directory }, options) {
        super(options);
        this.chunkSize = chunkSize;
        this.currentChunkPath = null;
        this.currentChunkSize = 0;
        this.fileHandle = null;
        this.directory = directory;
        this.filenameTemplate = randomString(10);
        this.part = 0;
        this.on('error', this._handleError.bind(this));
    }
    async _write(chunk, _, callback) {
        try {
            // In order to start writing a chunk, we must first create
            // a file system reference for it
            if (this.fileHandle === null) {
                await this._newChunk();
            }
            let overflow = this.currentChunkSize + chunk.length - this.chunkSize;
            // The current chunk will be more than our defined part size if we would
            // write all of it to disk.
            while (overflow > 0) {
                // Only write to disk the up to our defined part size.
                await this._writeChunk(chunk.subarray(0, chunk.length - overflow));
                await this._finishChunk();
                // We still have some overflow left, so we write it to a new chunk.
                await this._newChunk();
                chunk = chunk.subarray(chunk.length - overflow, chunk.length);
                overflow = this.currentChunkSize + chunk.length - this.chunkSize;
            }
            // The chunk is smaller than our defined part size so we can just write it to disk.
            await this._writeChunk(chunk);
            callback(null);
        }
        catch (error) {
            callback(error);
        }
    }
    async _final(callback) {
        if (this.fileHandle === null) {
            callback(null);
            return;
        }
        try {
            await this._finishChunk();
            callback(null);
        }
        catch (error) {
            callback(error);
        }
    }
    async _writeChunk(chunk) {
        await promises_1.default.appendFile(this.fileHandle, chunk);
        this.currentChunkSize += chunk.length;
    }
    async _handleError() {
        await this.emitEvent('chunkError', this.currentChunkPath);
        // If there was an error, we want to stop allowing to write on disk as we cannot advance further.
        // At this point the chunk might be incomplete advancing further might cause data loss.
        // some scenarios where this might happen is if the disk is full or if we abort the stream midway.
        if (this.fileHandle === null) {
            return;
        }
        await this.fileHandle.close();
        this.currentChunkPath = null;
        this.fileHandle = null;
    }
    async _finishChunk() {
        if (this.fileHandle === null) {
            return;
        }
        await this.fileHandle.close();
        await this.emitEvent('chunkFinished', {
            path: this.currentChunkPath,
            size: this.currentChunkSize,
        });
        this.currentChunkPath = null;
        this.fileHandle = null;
        this.currentChunkSize = 0;
        this.part += 1;
    }
    async emitEvent(name, payload) {
        const listeners = this.listeners(name);
        for (const listener of listeners) {
            await listener(payload);
        }
    }
    async _newChunk() {
        const currentChunkPath = node_path_1.default.join(this.directory, `${this.filenameTemplate}-${this.part}`);
        await this.emitEvent('beforeChunkStarted', currentChunkPath);
        this.currentChunkPath = currentChunkPath;
        const fileHandle = await promises_1.default.open(this.currentChunkPath, 'w');
        await this.emitEvent('chunkStarted', this.currentChunkPath);
        this.currentChunkSize = 0;
        this.fileHandle = fileHandle;
    }
}
exports.StreamSplitter = StreamSplitter;
//# sourceMappingURL=StreamSplitter.js.map