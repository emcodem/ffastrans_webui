"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixRequestBody = fixRequestBody;
const querystring = require("node:querystring");
const stringify_form_data_1 = require("./fix-request-body-utils/stringify-form-data");
/**
 * Fix proxied body if bodyParser is involved.
 */
function fixRequestBody(proxyReq, req) {
    // skip fixRequestBody() when req.readableLength not 0 (bodyParser failure)
    if (req.readableLength !== 0) {
        return;
    }
    const requestBody = req.body;
    if (!requestBody) {
        return;
    }
    const contentType = proxyReq.getHeader('Content-Type');
    if (!contentType) {
        return;
    }
    const writeBody = (bodyData) => {
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    };
    try {
        // Use if-elseif to prevent multiple writeBody/setHeader calls:
        // Error: "Cannot set headers after they are sent to the client"
        if (contentType.includes('application/json') || contentType.includes('+json')) {
            writeBody(JSON.stringify(requestBody));
        }
        else if (contentType.includes('application/x-www-form-urlencoded')) {
            writeBody(querystring.stringify(requestBody));
        }
        else if (contentType.includes('multipart/form-data')) {
            writeBody((0, stringify_form_data_1.stringifyFormData)(contentType, requestBody));
        }
        else if (contentType.includes('text/plain')) {
            writeBody(requestBody);
        }
    }
    catch (error) {
        // proxyReq listeners run outside the middleware try/catch path; re-throwing here can bubble as
        // an unhandled exception in consumers, so destroy() is used to fail closed through proxy error handling.
        proxyReq.destroy(toError(error));
    }
}
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
