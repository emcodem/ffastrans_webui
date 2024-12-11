import fs from 'node:fs/promises';
import stream from 'node:stream';
type Options = {
    chunkSize: number;
    directory: string;
};
type Callback = (error: Error | null) => void;
export declare class StreamSplitter extends stream.Writable {
    directory: Options['directory'];
    currentChunkPath: string | null;
    currentChunkSize: number;
    fileHandle: fs.FileHandle | null;
    filenameTemplate: string;
    chunkSize: Options['chunkSize'];
    part: number;
    constructor({ chunkSize, directory }: Options, options?: stream.WritableOptions);
    _write(chunk: Buffer, _: BufferEncoding, callback: Callback): Promise<void>;
    _final(callback: Callback): Promise<void>;
    _writeChunk(chunk: Buffer): Promise<void>;
    _handleError(): Promise<void>;
    _finishChunk(): Promise<void>;
    emitEvent<T>(name: string, payload: T): Promise<void>;
    _newChunk(): Promise<void>;
}
export {};
//# sourceMappingURL=StreamSplitter.d.ts.map