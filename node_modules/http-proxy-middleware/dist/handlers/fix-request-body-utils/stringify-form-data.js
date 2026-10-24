"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyFormData = stringifyFormData;
const errors_1 = require("../../errors");
const CR_OR_LF = /[\r\n]/;
const ERROR_CODE_PREFIX = 'HPM_ERR_INVALID_MULTIPART';
/**
 * stringify FormData data
 * @param contentType
 * @param data
 * @returns
 */
function stringifyFormData(contentType, data) {
    const boundary = getMultipartBoundary(contentType);
    let str = '';
    for (const [key, value] of Object.entries(data)) {
        const normalizedKey = String(key);
        const normalizedValue = String(value);
        // Reject potentially dangerous sequences to prevent multipart header/body injection.
        validateMultipartField(normalizedKey, normalizedValue, boundary);
        str += `--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipartFieldName(normalizedKey)}"\r\n\r\n${normalizedValue}\r\n`;
    }
    return str;
}
function getMultipartBoundary(contentType) {
    const boundaryMatch = /(?:^|;)\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    // Keep backward-compatible behavior when boundary is omitted: fall back to legacy extraction.
    const boundary = (boundaryMatch?.[1] ?? boundaryMatch?.[2] ?? contentType).trim();
    if (!boundary || CR_OR_LF.test(boundary)) {
        throw new errors_1.HttpProxyMiddlewareError('[HPM] invalid multipart boundary detected.', `${ERROR_CODE_PREFIX}_BOUNDARY`);
    }
    return boundary;
}
function validateMultipartField(fieldName, fieldValue, boundary) {
    const boundaryDelimiter = `--${boundary}`;
    if (CR_OR_LF.test(fieldName)) {
        throw new errors_1.HttpProxyMiddlewareError(`[HPM] invalid multipart field name "${fieldName}" detected.`, `${ERROR_CODE_PREFIX}_FIELD_NAME`);
    }
    if (CR_OR_LF.test(fieldValue) || fieldValue.includes(boundaryDelimiter)) {
        throw new errors_1.HttpProxyMiddlewareError(`[HPM] invalid multipart field value for "${fieldName}" detected.`, `${ERROR_CODE_PREFIX}_FIELD_VALUE`);
    }
}
function escapeMultipartFieldName(fieldName) {
    return fieldName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
