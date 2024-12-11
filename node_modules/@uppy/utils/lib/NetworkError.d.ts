declare class NetworkError extends Error {
    cause: unknown;
    isNetworkError: true;
    request: null | XMLHttpRequest;
    constructor(error: unknown, xhr?: null | XMLHttpRequest);
}
export default NetworkError;
//# sourceMappingURL=NetworkError.d.ts.map