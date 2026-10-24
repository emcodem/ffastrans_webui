"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
function sanitize(input) {
    return input?.replace(/[<>]/g, (i) => encodeURIComponent(i)) ?? '';
}
