"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusCode = getStatusCode;
function getStatusCode(errorCode) {
    let statusCode;
    if (/HPE_INVALID/.test(errorCode)) {
        statusCode = 502;
        return statusCode;
    }
    if (/HPM_ERR_INVALID_MULTIPART_/.test(errorCode)) {
        statusCode = 400;
        return statusCode;
    }
    switch (errorCode) {
        case 'ECONNRESET':
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
        case 'ETIMEDOUT':
            statusCode = 504;
            break;
        default:
            statusCode = 500;
            break;
    }
    return statusCode;
}
