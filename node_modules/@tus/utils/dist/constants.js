"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUS_VERSION = exports.TUS_RESUMABLE = exports.MAX_AGE = exports.EVENTS = exports.POST_TERMINATE = exports.POST_FINISH = exports.POST_RECEIVE_V2 = exports.POST_RECEIVE = exports.POST_CREATE = exports.ERRORS = exports.EXPOSED_HEADERS = exports.ALLOWED_METHODS = exports.ALLOWED_HEADERS = exports.HEADERS_LOWERCASE = exports.HEADERS = exports.REQUEST_METHODS = void 0;
exports.REQUEST_METHODS = ['POST', 'HEAD', 'PATCH', 'OPTIONS', 'DELETE'];
exports.HEADERS = [
    'Authorization',
    'Content-Type',
    'Location',
    'Tus-Extension',
    'Tus-Max-Size',
    'Tus-Resumable',
    'Tus-Version',
    'Upload-Concat',
    'Upload-Defer-Length',
    'Upload-Length',
    'Upload-Metadata',
    'Upload-Offset',
    'X-HTTP-Method-Override',
    'X-Requested-With',
    'X-Forwarded-Host',
    'X-Forwarded-Proto',
    'Forwarded',
];
exports.HEADERS_LOWERCASE = exports.HEADERS.map((header) => {
    return header.toLowerCase();
});
exports.ALLOWED_HEADERS = exports.HEADERS.join(', ');
exports.ALLOWED_METHODS = exports.REQUEST_METHODS.join(', ');
exports.EXPOSED_HEADERS = exports.HEADERS.join(', ');
exports.ERRORS = {
    MISSING_OFFSET: {
        status_code: 403,
        body: 'Upload-Offset header required\n',
    },
    ABORTED: {
        status_code: 400,
        body: 'Request aborted due to lock acquired',
    },
    INVALID_TERMINATION: {
        status_code: 400,
        body: 'Cannot terminate an already completed upload',
    },
    ERR_LOCK_TIMEOUT: {
        status_code: 500,
        body: 'failed to acquire lock before timeout',
    },
    INVALID_CONTENT_TYPE: {
        status_code: 403,
        body: 'Content-Type header required\n',
    },
    FILE_NOT_FOUND: {
        status_code: 404,
        body: 'The file for this url was not found\n',
    },
    INVALID_OFFSET: {
        status_code: 409,
        body: 'Upload-Offset conflict\n',
    },
    FILE_NO_LONGER_EXISTS: {
        status_code: 410,
        body: 'The file for this url no longer exists\n',
    },
    ERR_SIZE_EXCEEDED: {
        status_code: 413,
        body: "upload's size exceeded\n",
    },
    ERR_MAX_SIZE_EXCEEDED: {
        status_code: 413,
        body: 'Maximum size exceeded\n',
    },
    INVALID_LENGTH: {
        status_code: 400,
        body: 'Upload-Length or Upload-Defer-Length header required\n',
    },
    INVALID_METADATA: {
        status_code: 400,
        body: 'Upload-Metadata is invalid. It MUST consist of one or more comma-separated key-value pairs. The key and value MUST be separated by a space. The key MUST NOT contain spaces and commas and MUST NOT be empty. The key SHOULD be ASCII encoded and the value MUST be Base64 encoded. All keys MUST be unique',
    },
    UNKNOWN_ERROR: {
        status_code: 500,
        body: 'Something went wrong with that request\n',
    },
    FILE_WRITE_ERROR: {
        status_code: 500,
        body: 'Something went wrong receiving the file\n',
    },
    UNSUPPORTED_CONCATENATION_EXTENSION: {
        status_code: 501,
        body: 'Concatenation extension is not (yet) supported. Disable parallel uploads in the tus client.\n',
    },
    UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION: {
        status_code: 501,
        body: 'creation-defer-length extension is not (yet) supported.\n',
    },
    UNSUPPORTED_EXPIRATION_EXTENSION: {
        status_code: 501,
        body: 'expiration extension is not (yet) supported.\n',
    },
};
exports.POST_CREATE = 'POST_CREATE';
/** @deprecated this is almost the same as POST_FINISH, use POST_RECEIVE_V2 instead */
exports.POST_RECEIVE = 'POST_RECEIVE';
exports.POST_RECEIVE_V2 = 'POST_RECEIVE_V2';
exports.POST_FINISH = 'POST_FINISH';
exports.POST_TERMINATE = 'POST_TERMINATE';
exports.EVENTS = {
    POST_CREATE: exports.POST_CREATE,
    /** @deprecated this is almost the same as POST_FINISH, use POST_RECEIVE_V2 instead */
    POST_RECEIVE: exports.POST_RECEIVE,
    POST_RECEIVE_V2: exports.POST_RECEIVE_V2,
    POST_FINISH: exports.POST_FINISH,
    POST_TERMINATE: exports.POST_TERMINATE,
};
exports.MAX_AGE = 86400;
exports.TUS_RESUMABLE = '1.0.0';
exports.TUS_VERSION = ['1.0.0'];
//# sourceMappingURL=constants.js.map