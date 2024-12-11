"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateKey = validateKey;
exports.validateValue = validateValue;
exports.parse = parse;
exports.stringify = stringify;
const ASCII_SPACE = ' '.codePointAt(0);
const ASCII_COMMA = ','.codePointAt(0);
const BASE64_REGEX = /^[\d+/A-Za-z]*={0,2}$/;
function validateKey(key) {
    if (key.length === 0) {
        return false;
    }
    for (let i = 0; i < key.length; ++i) {
        const charCodePoint = key.codePointAt(i);
        if (charCodePoint > 127 ||
            charCodePoint === ASCII_SPACE ||
            charCodePoint === ASCII_COMMA) {
            return false;
        }
    }
    return true;
}
function validateValue(value) {
    if (value.length % 4 !== 0) {
        return false;
    }
    return BASE64_REGEX.test(value);
}
function parse(str) {
    const meta = {};
    if (!str || str.trim().length === 0) {
        throw new Error('Metadata string is not valid');
    }
    for (const pair of str.split(',')) {
        const tokens = pair.split(' ');
        const [key, value] = tokens;
        if (((tokens.length === 1 && validateKey(key)) ||
            (tokens.length === 2 && validateKey(key) && validateValue(value))) &&
            !(key in meta)) {
            const decodedValue = value ? Buffer.from(value, 'base64').toString('utf8') : null;
            meta[key] = decodedValue;
        }
        else {
            throw new Error('Metadata string is not valid');
        }
    }
    return meta;
}
function stringify(metadata) {
    return Object.entries(metadata)
        .map(([key, value]) => {
        if (value === null) {
            return key;
        }
        const encodedValue = Buffer.from(value, 'utf8').toString('base64');
        return `${key} ${encodedValue}`;
    })
        .join(',');
}
//# sourceMappingURL=Metadata.js.map