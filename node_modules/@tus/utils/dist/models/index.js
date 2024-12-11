"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upload = exports.Uid = exports.StreamLimiter = exports.StreamSplitter = exports.Metadata = exports.DataStore = void 0;
var DataStore_1 = require("./DataStore");
Object.defineProperty(exports, "DataStore", { enumerable: true, get: function () { return DataStore_1.DataStore; } });
exports.Metadata = __importStar(require("./Metadata"));
var StreamSplitter_1 = require("./StreamSplitter");
Object.defineProperty(exports, "StreamSplitter", { enumerable: true, get: function () { return StreamSplitter_1.StreamSplitter; } });
var StreamLimiter_1 = require("./StreamLimiter");
Object.defineProperty(exports, "StreamLimiter", { enumerable: true, get: function () { return StreamLimiter_1.StreamLimiter; } });
var Uid_1 = require("./Uid");
Object.defineProperty(exports, "Uid", { enumerable: true, get: function () { return Uid_1.Uid; } });
var Upload_1 = require("./Upload");
Object.defineProperty(exports, "Upload", { enumerable: true, get: function () { return Upload_1.Upload; } });
//# sourceMappingURL=index.js.map