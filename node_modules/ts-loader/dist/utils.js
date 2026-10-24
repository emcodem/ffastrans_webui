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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrors = formatErrors;
exports.fsReadFile = fsReadFile;
exports.makeError = makeError;
exports.tsLoaderSource = tsLoaderSource;
exports.appendSuffixIfMatch = appendSuffixIfMatch;
exports.appendSuffixesIfMatch = appendSuffixesIfMatch;
exports.unorderedRemoveItem = unorderedRemoveItem;
exports.populateDependencyGraph = populateDependencyGraph;
exports.populateReverseDependencyGraph = populateReverseDependencyGraph;
exports.collectAllDependants = collectAllDependants;
exports.arrify = arrify;
exports.ensureProgram = ensureProgram;
exports.supportsSolutionBuild = supportsSolutionBuild;
exports.isReferencedFile = isReferencedFile;
exports.useCaseSensitiveFileNames = useCaseSensitiveFileNames;
const fs = __importStar(require("fs"));
const picomatch_1 = __importDefault(require("picomatch"));
const path = __importStar(require("path"));
const webpack = __importStar(require("webpack"));
const constants = require("./constants");
const instances_1 = require("./instances");
const loaderUtils_1 = require("./loaderUtils");
/**
 * The default error formatter.
 */
function defaultErrorFormatter(error, colors) {
    const messageColor = error.severity === 'warning' ? colors.bold.yellow : colors.bold.red;
    return (colors.grey('[tsl] ') +
        messageColor(error.severity.toUpperCase()) +
        (error.file === ''
            ? ''
            : messageColor(' in ') +
                colors.bold.cyan(`${error.file}(${error.line},${error.character})`)) +
        constants.EOL +
        messageColor(`      TS${error.code}: ${error.content}`));
}
/**
 * Build a file-matcher from a reportFiles pattern array that replicates
 * micromatch semantics: a file must match a positive pattern AND not match
 * any negative pattern. Returns null when reportFiles is empty (no filtering).
 */
function makeReportFilesMatcher(reportFiles) {
    if (reportFiles.length === 0) {
        return null;
    }
    const { positivePatterns, negativePatterns } = reportFiles.reduce((acc, p) => {
        if (p.startsWith('!')) {
            acc.negativePatterns.push(p.slice(1));
        }
        else {
            acc.positivePatterns.push(p);
        }
        return acc;
    }, { positivePatterns: [], negativePatterns: [] });
    const matchPos = (0, picomatch_1.default)(positivePatterns.length > 0 ? positivePatterns : ['**']);
    const matchNeg = negativePatterns.length > 0 ? (0, picomatch_1.default)(negativePatterns) : null;
    return (fileName) => matchPos(fileName) && !(matchNeg && matchNeg(fileName));
}
/**
 * Take TypeScript errors, parse them and format to webpack errors
 * Optionally adds a file name
 */
function formatErrors(diagnostics, loaderOptions, colors, compiler, merge, context) {
    const matchesReportFiles = makeReportFilesMatcher(loaderOptions.reportFiles);
    return diagnostics === undefined
        ? []
        : diagnostics
            .filter(diagnostic => {
            if (loaderOptions.ignoreDiagnostics.indexOf(diagnostic.code) !== -1) {
                return false;
            }
            if (matchesReportFiles !== null &&
                diagnostic.file !== undefined &&
                !matchesReportFiles(path.relative(context, diagnostic.file.fileName))) {
                return false;
            }
            return true;
        })
            .map(diagnostic => {
            const file = diagnostic.file;
            const { start, end } = file === undefined || diagnostic.start === undefined
                ? { start: undefined, end: undefined }
                : getFileLocations(file, diagnostic.start, diagnostic.length);
            const errorInfo = {
                code: diagnostic.code,
                severity: compiler.DiagnosticCategory[diagnostic.category].toLowerCase(),
                content: compiler.flattenDiagnosticMessageText(diagnostic.messageText, constants.EOL),
                file: file === undefined ? '' : path.normalize(file.fileName),
                line: start === undefined ? 0 : start.line,
                character: start === undefined ? 0 : start.character,
                context,
            };
            const message = loaderOptions.errorFormatter === undefined
                ? defaultErrorFormatter(errorInfo, colors)
                : loaderOptions.errorFormatter(errorInfo, colors);
            const error = makeError(loaderOptions, message, merge.file === undefined ? errorInfo.file : merge.file, start, end);
            return Object.assign(error, merge);
        });
}
function getFileLocations(file, position, length = 0) {
    const startLC = file.getLineAndCharacterOfPosition(position);
    const start = {
        line: startLC.line + 1,
        character: startLC.character + 1,
    };
    const endLC = length > 0
        ? file.getLineAndCharacterOfPosition(position + length)
        : undefined;
    const end = endLC === undefined
        ? undefined
        : { line: endLC.line + 1, character: endLC.character + 1 };
    return { start, end };
}
function fsReadFile(fileName, encoding = 'utf8') {
    fileName = path.normalize(fileName);
    try {
        return fs.readFileSync(fileName, encoding);
    }
    catch (_e) {
        return undefined;
    }
}
function makeError(loaderOptions, message, file, location, endLocation) {
    if (loaderUtils_1.isWebpack5) {
        const error = new webpack.WebpackError(message);
        error.file = file;
        error.loc =
            location === undefined
                ? { name: file }
                : makeWebpackLocation(location, endLocation);
        error.details = tsLoaderSource(loaderOptions);
        return error;
    }
    return {
        message,
        file,
        loc: location === undefined
            ? undefined
            : makeWebpackLocation(location, endLocation),
        location,
        details: tsLoaderSource(loaderOptions),
    };
}
function makeWebpackLocation(location, endLocation) {
    const start = {
        line: location.line,
        column: location.character - 1,
    };
    const end = endLocation === undefined
        ? undefined
        : { line: endLocation.line, column: endLocation.character - 1 };
    return { start, end };
}
function tsLoaderSource(loaderOptions) {
    return `ts-loader-${loaderOptions.instance}`;
}
function appendSuffixIfMatch(patterns, filePath, suffix) {
    if (patterns.length > 0) {
        for (const regexp of patterns) {
            if (filePath.match(regexp) !== null) {
                return filePath + suffix;
            }
        }
    }
    return filePath;
}
function appendSuffixesIfMatch(suffixDict, filePath) {
    let amendedPath = filePath;
    for (const suffix in suffixDict) {
        amendedPath = appendSuffixIfMatch(suffixDict[suffix], amendedPath, suffix);
    }
    return amendedPath;
}
function unorderedRemoveItem(array, item) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === item) {
            // Fill in the "hole" left at `index`.
            array[i] = array[array.length - 1];
            array.pop();
            return true;
        }
    }
    return false;
}
function populateDependencyGraph(resolvedModules, instance, containingFile) {
    resolvedModules = resolvedModules.filter(mod => mod !== null && mod !== undefined);
    if (resolvedModules.length) {
        const containingFileKey = instance.filePathKeyMapper(containingFile);
        instance.dependencyGraph.set(containingFileKey, resolvedModules);
    }
}
function populateReverseDependencyGraph(instance) {
    const reverseDependencyGraph = new Map();
    for (const [fileKey, resolvedModules] of instance.dependencyGraph.entries()) {
        const inputFileName = instance.solutionBuilderHost &&
            (0, instances_1.getInputFileNameFromOutput)(instance, fileKey);
        const containingFileKey = inputFileName
            ? instance.filePathKeyMapper(inputFileName)
            : fileKey;
        resolvedModules.forEach(({ resolvedFileName }) => {
            const key = instance.filePathKeyMapper(instance.solutionBuilderHost
                ? (0, instances_1.getInputFileNameFromOutput)(instance, resolvedFileName) ||
                    resolvedFileName
                : resolvedFileName);
            let map = reverseDependencyGraph.get(key);
            if (!map) {
                map = new Map();
                reverseDependencyGraph.set(key, map);
            }
            map.set(containingFileKey, true);
        });
    }
    return reverseDependencyGraph;
}
/**
 * Recursively collect all possible dependants of passed file
 */
function collectAllDependants(reverseDependencyGraph, fileName, result = new Map()) {
    result.set(fileName, true);
    const dependants = reverseDependencyGraph.get(fileName);
    if (dependants !== undefined) {
        for (const dependantFileName of dependants.keys()) {
            if (!result.has(dependantFileName)) {
                collectAllDependants(reverseDependencyGraph, dependantFileName, result);
            }
        }
    }
    return result;
}
function arrify(val) {
    if (val === null || val === undefined) {
        return [];
    }
    return Array.isArray(val) ? val : [val];
}
function ensureProgram(instance) {
    if (instance && instance.watchHost) {
        if (instance.hasUnaccountedModifiedFiles) {
            if (instance.changedFilesList) {
                instance.watchHost.updateRootFileNames();
            }
            if (instance.watchOfFilesAndCompilerOptions) {
                instance.builderProgram =
                    instance.watchOfFilesAndCompilerOptions.getProgram();
                instance.program = instance.builderProgram.getProgram();
            }
            instance.hasUnaccountedModifiedFiles = false;
        }
        return instance.program;
    }
    if (instance.languageService) {
        return instance.languageService.getProgram();
    }
    return instance.program;
}
function supportsSolutionBuild(instance) {
    return (!!instance.configFilePath &&
        !!instance.loaderOptions.projectReferences &&
        !!instance.configParseResult.projectReferences &&
        !!instance.configParseResult.projectReferences.length);
}
function isReferencedFile(instance, filePath) {
    return (!!instance.solutionBuilderHost &&
        !!instance.solutionBuilderHost.watchedFiles.get(instance.filePathKeyMapper(filePath)));
}
function useCaseSensitiveFileNames(compiler, loaderOptions) {
    return loaderOptions.useCaseSensitiveFileNames !== undefined
        ? loaderOptions.useCaseSensitiveFileNames
        : compiler.sys.useCaseSensitiveFileNames;
}
//# sourceMappingURL=utils.js.map