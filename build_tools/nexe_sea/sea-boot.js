'use strict';
/*
 * Startup script for a nexe base binary built from a STOCK node.exe.
 *
 * nexe normally needs a node.exe compiled from patched sources: the patch adds a
 * boot hook to lib/internal/process/pre_execution.js which reads the app code and
 * resources nexe appended to the end of the exe. Instead of compiling node, we
 * inject this script as a Single Executable Application (SEA) main script into the
 * official node.exe (see build_base.bat). It does the same thing the nexe patch does,
 * so the resulting exe is a drop-in nexe target ("windows-x64-<version>").
 *
 * Differences we have to cover compared to the compiled-in nexe patch:
 *  - SEA repeats argv[0] at argv[1], nexe expects plain [execPath, ...args]
 *  - the nexe patch also runs in worker threads, SEA main only runs in the main
 *    thread, so worker_threads.Worker is wrapped to boot nexe inside the worker
 */

function nexeBoot(workerFile) {
    const fs = require('fs');
    const Module = require('module');

    // what nexe adds to lib/internal/modules/cjs/loader.js
    const patches = (process.nexe = { patches: {} }).patches;
    const fsBinding = process.binding('fs');
    for (const method of ['internalModuleReadFile', 'internalModuleReadJSON', 'internalModuleStat']) {
        const original = fsBinding[method];
        if (!original) continue;
        patches[method] = function (orig, ...args) { return orig.apply(this, args); };
        fsBinding[method] = function (...args) {
            return patches[method].call(this, original, ...args);
        };
    }

    // what nexe adds to lib/internal/process/pre_execution.js
    const fd = fs.openSync(process.execPath, 'r');
    const stat = fs.fstatSync(fd);
    const tailSize = Math.min(stat.size, 16000);
    const tailWindow = Buffer.alloc(tailSize);
    fs.readSync(fd, tailWindow, 0, tailSize, stat.size - tailSize);
    // split the sentinel so this script (embedded in the exe) never matches itself
    const footerPosition = tailWindow.lastIndexOf('<nexe~~' + 'sentinel>');
    if (footerPosition === -1) {
        fs.closeSync(fd);
        throw new Error('Invalid Nexe binary: no resources appended to ' + process.execPath);
    }
    const footer = tailWindow.subarray(footerPosition, footerPosition + 32);
    const contentSize = footer.readDoubleLE(16);
    const resourceSize = footer.readDoubleLE(24);
    const contentStart = stat.size - tailSize + footerPosition - resourceSize - contentSize;
    const resourceStart = contentStart + contentSize;

    let nexeHeader = null;
    Object.defineProperty(process, '__nexe', {
        get() { return nexeHeader; },
        set(value) {
            if (nexeHeader) throw new Error('This property is readonly');
            nexeHeader = Object.freeze(Object.assign({}, value, {
                blobPath: process.execPath,
                layout: { stat, contentSize, contentStart, resourceSize, resourceStart },
            }));
        },
        enumerable: false,
        configurable: false,
    });

    const contentBuffer = Buffer.alloc(contentSize);
    fs.readSync(fd, contentBuffer, 0, contentSize, contentStart);
    fs.closeSync(fd);
    let code = contentBuffer.toString();

    if (workerFile === undefined) {
        // main thread: nexe code inserts the entrypoint at argv[1], the patched node
        // then runs it via internal/main/run_main_module - we do that via runMain()
        process.argv.splice(1, 1);
        new Module(process.execPath, null)._compile(code, process.execPath);
        Module.runMain();
        return;
    }

    // worker: only install the nexe fs shims, then load the worker file itself
    const argv = process.argv.slice();
    argv[1] = workerFile;
    new Module(process.execPath, null)._compile(code, process.execPath);
    process.argv.splice(0, process.argv.length, ...argv);
    Module._load(workerFile, null, true);
}

const workerThreads = require('worker_threads');
const OriginalWorker = workerThreads.Worker;
const path = require('path');
const { fileURLToPath } = require('url');

class NexeWorker extends OriginalWorker {
    constructor(filename, options) {
        if (options && options.eval) {
            super(filename, options);
            return;
        }
        if (filename instanceof URL) filename = fileURLToPath(filename);
        if (typeof filename !== 'string') {
            super(filename, options);
            return;
        }
        const file = path.resolve(filename);
        const boot = `(${nexeBoot.toString()})(${JSON.stringify(file)});`;
        super(boot, Object.assign({}, options, { eval: true }));
    }
}
workerThreads.Worker = NexeWorker;

nexeBoot();
