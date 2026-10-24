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
exports.makeWatchRun = makeWatchRun;
const path = __importStar(require("path"));
const constants = __importStar(require("./constants"));
const servicesHost_1 = require("./servicesHost");
const utils_1 = require("./utils");
const loaderUtils_1 = require("./loaderUtils");
/**
 * Make function which will manually update changed files
 */
function makeWatchRun(instance, loader) {
    // Called Before starting compilation after watch
    const lastTimes = new Map();
    const startTime = 0;
    // Save the loader index.
    const loaderIndex = loader.loaderIndex;
    return (compiler, callback) => {
        var _a, _b, _c, _d, _e, _f, _g;
        (_b = (_a = instance.servicesHost) === null || _a === void 0 ? void 0 : _a.clearCache) === null || _b === void 0 ? void 0 : _b.call(_a);
        (_d = (_c = instance.watchHost) === null || _c === void 0 ? void 0 : _c.clearCache) === null || _d === void 0 ? void 0 : _d.call(_c);
        (_e = instance.moduleResolutionCache) === null || _e === void 0 ? void 0 : _e.clear();
        (_f = instance.typeReferenceResolutionCache) === null || _f === void 0 ? void 0 : _f.clear();
        const promises = [];
        if (instance.loaderOptions.transpileOnly) {
            instance.reportTranspileErrors = true;
        }
        else {
            const times = compiler.fileTimestamps;
            if (times) {
                for (const [filePath, date] of times) {
                    const key = instance.filePathKeyMapper(filePath);
                    const lastTime = lastTimes.get(key) || startTime;
                    let fileTime;
                    if (loaderUtils_1.isWebpack5) {
                        if (!date || date === 'ignore') {
                            continue;
                        }
                        // Webpack versions can provide timestamp values as a number or object.
                        fileTime =
                            typeof date === 'object'
                                ? (_g = ('timestamp' in date ? date.timestamp : undefined)) !== null && _g !== void 0 ? _g : ('safeTime' in date ? date.safeTime : undefined)
                                : undefined;
                        if (fileTime === undefined || fileTime <= lastTime) {
                            continue;
                        }
                    }
                    else {
                        // in webpack 4 date is a number https://github.com/webpack/webpack/blob/dfffd6a241bf1d593b3fd31b4b279f96f4a4aab1/lib/Compiler.js#L141-L142
                        if (date <= lastTime) {
                            continue;
                        }
                        fileTime = date;
                    }
                    lastTimes.set(key, fileTime);
                    promises.push(updateFile(instance, key, filePath, loader, loaderIndex));
                }
                // On watch update add all known dts files expect the ones in node_modules
                // (skip @types/* and modules with typings)
                for (const [key, { fileName }] of instance.files.entries()) {
                    if (fileName.match(constants.dtsDtsxOrDtsDtsxMapRegex) !== null &&
                        fileName.match(constants.nodeModules) === null) {
                        promises.push(updateFile(instance, key, fileName, loader, loaderIndex));
                    }
                }
            }
        }
        // Update all the watched files from solution builder
        if (instance.solutionBuilderHost) {
            for (const { fileName, } of instance.solutionBuilderHost.watchedFiles.values()) {
                instance.solutionBuilderHost.updateSolutionBuilderInputFile(fileName);
            }
            instance.solutionBuilderHost.clearCache();
        }
        Promise.all(promises)
            .then(() => callback())
            .catch(err => callback(err));
    };
}
function updateFile(instance, key, filePath, loader, loaderIndex) {
    return new Promise((resolve, reject) => {
        // When other loaders are specified after ts-loader
        // (e.g. `{ test: /\.ts$/, use: ['ts-loader', 'other-loader'] }`),
        // manually apply them to TypeScript files.
        // Otherwise, files not 'preprocessed' by them may cause complication errors (#1111).
        if (loaderIndex + 1 < loader.loaders.length &&
            instance.rootFileNames.has(path.normalize(filePath))) {
            let request = `!!${path.resolve(__dirname, 'stringify-loader.js')}!`;
            for (let i = loaderIndex + 1; i < loader.loaders.length; ++i) {
                request += loader.loaders[i].request + '!';
            }
            request += filePath;
            loader.loadModule(request, (err, source) => {
                if (err) {
                    reject(err);
                }
                else if (typeof source === 'string') {
                    const text = JSON.parse(source);
                    (0, servicesHost_1.updateFileWithText)(instance, key, filePath, () => text);
                    resolve();
                }
                else if (Buffer.isBuffer(source)) {
                    const text = JSON.parse(source.toString('utf8'));
                    (0, servicesHost_1.updateFileWithText)(instance, key, filePath, () => text);
                    resolve();
                }
            });
        }
        else {
            (0, servicesHost_1.updateFileWithText)(instance, key, filePath, nFilePath => (0, utils_1.fsReadFile)(nFilePath) || '');
            resolve();
        }
    });
}
//# sourceMappingURL=watch-run.js.map