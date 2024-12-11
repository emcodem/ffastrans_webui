declare class ErrorWithCause extends Error {
    isNetworkError: boolean;
    cause: Error['cause'];
    constructor(message?: ConstructorParameters<ErrorConstructor>[0], options?: ConstructorParameters<ErrorConstructor>[1]);
}
export default ErrorWithCause;
//# sourceMappingURL=ErrorWithCause.d.ts.map