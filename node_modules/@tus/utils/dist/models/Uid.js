"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uid = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
exports.Uid = {
    rand() {
        return node_crypto_1.default.randomBytes(16).toString('hex');
    },
};
//# sourceMappingURL=Uid.js.map