export declare const REQUEST_METHODS: readonly ["POST", "HEAD", "PATCH", "OPTIONS", "DELETE"];
export declare const HEADERS: readonly ["Authorization", "Content-Type", "Location", "Tus-Extension", "Tus-Max-Size", "Tus-Resumable", "Tus-Version", "Upload-Concat", "Upload-Defer-Length", "Upload-Length", "Upload-Metadata", "Upload-Offset", "X-HTTP-Method-Override", "X-Requested-With", "X-Forwarded-Host", "X-Forwarded-Proto", "Forwarded"];
export declare const HEADERS_LOWERCASE: Array<Lowercase<(typeof HEADERS)[number]>>;
export declare const ALLOWED_HEADERS: string;
export declare const ALLOWED_METHODS: string;
export declare const EXPOSED_HEADERS: string;
export declare const ERRORS: {
    readonly MISSING_OFFSET: {
        readonly status_code: 403;
        readonly body: "Upload-Offset header required\n";
    };
    readonly ABORTED: {
        readonly status_code: 400;
        readonly body: "Request aborted due to lock acquired";
    };
    readonly INVALID_TERMINATION: {
        readonly status_code: 400;
        readonly body: "Cannot terminate an already completed upload";
    };
    readonly ERR_LOCK_TIMEOUT: {
        readonly status_code: 500;
        readonly body: "failed to acquire lock before timeout";
    };
    readonly INVALID_CONTENT_TYPE: {
        readonly status_code: 403;
        readonly body: "Content-Type header required\n";
    };
    readonly FILE_NOT_FOUND: {
        readonly status_code: 404;
        readonly body: "The file for this url was not found\n";
    };
    readonly INVALID_OFFSET: {
        readonly status_code: 409;
        readonly body: "Upload-Offset conflict\n";
    };
    readonly FILE_NO_LONGER_EXISTS: {
        readonly status_code: 410;
        readonly body: "The file for this url no longer exists\n";
    };
    readonly ERR_SIZE_EXCEEDED: {
        readonly status_code: 413;
        readonly body: "upload's size exceeded\n";
    };
    readonly ERR_MAX_SIZE_EXCEEDED: {
        readonly status_code: 413;
        readonly body: "Maximum size exceeded\n";
    };
    readonly INVALID_LENGTH: {
        readonly status_code: 400;
        readonly body: "Upload-Length or Upload-Defer-Length header required\n";
    };
    readonly INVALID_METADATA: {
        readonly status_code: 400;
        readonly body: "Upload-Metadata is invalid. It MUST consist of one or more comma-separated key-value pairs. The key and value MUST be separated by a space. The key MUST NOT contain spaces and commas and MUST NOT be empty. The key SHOULD be ASCII encoded and the value MUST be Base64 encoded. All keys MUST be unique";
    };
    readonly UNKNOWN_ERROR: {
        readonly status_code: 500;
        readonly body: "Something went wrong with that request\n";
    };
    readonly FILE_WRITE_ERROR: {
        readonly status_code: 500;
        readonly body: "Something went wrong receiving the file\n";
    };
    readonly UNSUPPORTED_CONCATENATION_EXTENSION: {
        readonly status_code: 501;
        readonly body: "Concatenation extension is not (yet) supported. Disable parallel uploads in the tus client.\n";
    };
    readonly UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION: {
        readonly status_code: 501;
        readonly body: "creation-defer-length extension is not (yet) supported.\n";
    };
    readonly UNSUPPORTED_EXPIRATION_EXTENSION: {
        readonly status_code: 501;
        readonly body: "expiration extension is not (yet) supported.\n";
    };
};
export declare const POST_CREATE: "POST_CREATE";
/** @deprecated this is almost the same as POST_FINISH, use POST_RECEIVE_V2 instead */
export declare const POST_RECEIVE: "POST_RECEIVE";
export declare const POST_RECEIVE_V2: "POST_RECEIVE_V2";
export declare const POST_FINISH: "POST_FINISH";
export declare const POST_TERMINATE: "POST_TERMINATE";
export declare const EVENTS: {
    readonly POST_CREATE: "POST_CREATE";
    /** @deprecated this is almost the same as POST_FINISH, use POST_RECEIVE_V2 instead */
    readonly POST_RECEIVE: "POST_RECEIVE";
    readonly POST_RECEIVE_V2: "POST_RECEIVE_V2";
    readonly POST_FINISH: "POST_FINISH";
    readonly POST_TERMINATE: "POST_TERMINATE";
};
export declare const MAX_AGE: 86400;
export declare const TUS_RESUMABLE: "1.0.0";
export declare const TUS_VERSION: readonly ["1.0.0"];
//# sourceMappingURL=constants.d.ts.map