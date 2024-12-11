/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
export default class EventManager {
    constructor(uppy: any);
    on(event: any, fn: any): any;
    remove(): void;
    onFilePause(fileID: any, cb: any): void;
    onFileRemove(fileID: any, cb: any): void;
    onPause(fileID: any, cb: any): void;
    onRetry(fileID: any, cb: any): void;
    onRetryAll(fileID: any, cb: any): void;
    onPauseAll(fileID: any, cb: any): void;
    onCancelAll(fileID: any, eventHandler: any): void;
    onResumeAll(fileID: any, cb: any): void;
    #private;
}
//# sourceMappingURL=EventManager.d.ts.map