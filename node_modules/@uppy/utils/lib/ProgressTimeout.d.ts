/**
 * Helper to abort upload requests if there has not been any progress for `timeout` ms.
 * Create an instance using `timer = new ProgressTimeout(10000, onTimeout)`
 * Call `timer.progress()` to signal that there has been progress of any kind.
 * Call `timer.done()` when the upload has completed.
 */
declare class ProgressTimeout {
    #private;
    constructor(timeout: number, timeoutHandler: (timeout: number) => void);
    progress(): void;
    done(): void;
}
export default ProgressTimeout;
//# sourceMappingURL=ProgressTimeout.d.ts.map