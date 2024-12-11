import { Transform, type TransformCallback } from 'node:stream';
export declare class MaxFileExceededError extends Error {
    status_code: number;
    body: string;
    constructor();
}
export declare class StreamLimiter extends Transform {
    private maxSize;
    private currentSize;
    constructor(maxSize: number);
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void;
}
//# sourceMappingURL=StreamLimiter.d.ts.map