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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebpack5 = void 0;
exports.getOptions = getOptions;
exports.addErrorToModule = addErrorToModule;
const webpack = __importStar(require("webpack"));
exports.isWebpack5 = webpack.version.startsWith('5.');
;
let loaderUtils;
function getOptions(loaderContext) {
    if (exports.isWebpack5) {
        return loaderContext.getOptions();
    }
    if (!loaderUtils) {
        try {
            loaderUtils = module.require('loader-utils');
        }
        catch (_a) {
            throw new Error('ts-loader requires loader-utils to be installed when used with webpack 4.');
        }
    }
    return loaderUtils.getOptions(loaderContext) || {};
}
/**
 * webpack 4 and webpack 5 have different APIs for adding errors to modules. This function abstracts that away.
 */
function addErrorToModule(module, error) {
    if (exports.isWebpack5) {
        module.addError(error);
    }
    else {
        module.errors.push(error);
    }
}
//# sourceMappingURL=loaderUtils.js.map