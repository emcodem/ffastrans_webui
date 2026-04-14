'use strict';
/**
 * Memory diagnostic endpoint — exposes heap statistics, known cache sizes,
 * and optionally triggers garbage collection (when --expose-gc is used).
 *
 * GET /debug/memory          → full snapshot
 * POST /debug/memory/gc      → force GC + return snapshot (requires --expose-gc)
 * POST /debug/memory/trim    → evict all module-level caches + GC + return snapshot
 */

const v8 = require('v8');

// ── Import modules that own in-memory caches ──────────────────────────
// We access their cache objects through getter functions so we don't
// hold extra references.

const ffastransHistory = require('./common/ffastrans_history_jobs.js');

// ── Helpers ───────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function roughSizeOf(obj) {
    // Quick estimate: JSON-serialize and measure byte length.
    // Not perfectly accurate but good enough for diagnostics.
    try {
        return Buffer.byteLength(JSON.stringify(obj), 'utf8');
    } catch {
        return -1; // circular or too large
    }
}

function getSnapshot() {
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    // ── Collect cache sizes ──────────────────────────────────────────
    const caches = {};

    // ffastrans_history_jobs.js caches
    const historyCaches = ffastransHistory._getCacheDiagnostics
        ? ffastransHistory._getCacheDiagnostics()
        : null;

    if (historyCaches) {
        caches['ffastrans_history_jobs.jobCache'] = {
            entries: historyCaches.jobCacheSize,
            estimatedBytes: formatBytes(historyCaches.jobCacheBytes)
        };
        caches['ffastrans_history_jobs.workaround_dispel_database'] = {
            entries: historyCaches.dispelDbSize,
            estimatedBytes: formatBytes(historyCaches.dispelDbBytes)
        };
        caches['ffastrans_history_jobs.fileContentDatabase'] = {
            entries: historyCaches.fileContentDbSize,
            estimatedBytes: formatBytes(historyCaches.fileContentDbBytes)
        };
    }

    // FilesystemWatcher cache (workflows)
    if (global.workflowFileSystemWatcher) {
        const wfCache = global.workflowFileSystemWatcher.cache || {};
        const wfSize = Object.keys(wfCache).length;
        caches['workflowFileSystemWatcher'] = {
            entries: wfSize,
            estimatedBytes: formatBytes(roughSizeOf(wfCache))
        };
    }

    return {
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        memory: {
            rss: formatBytes(mem.rss),
            heapTotal: formatBytes(mem.heapTotal),
            heapUsed: formatBytes(mem.heapUsed),
            external: formatBytes(mem.external),
            arrayBuffers: formatBytes(mem.arrayBuffers),
            rssRaw: mem.rss,
            heapTotalRaw: mem.heapTotal,
            heapUsedRaw: mem.heapUsed,
            externalRaw: mem.external
        },
        heapStatistics: {
            totalHeapSize: formatBytes(heapStats.total_heap_size),
            usedHeapSize: formatBytes(heapStats.used_heap_size),
            heapSizeLimit: formatBytes(heapStats.heap_size_limit),
            totalPhysicalSize: formatBytes(heapStats.total_physical_size),
            mallocedMemory: formatBytes(heapStats.malloced_memory),
            numberOfNativeContexts: heapStats.number_of_native_contexts,
            numberOfDetachedContexts: heapStats.number_of_detached_contexts
        },
        caches
    };
}

// ── Express handlers ──────────────────────────────────────────────────

function getMemory(req, res) {
    res.json(getSnapshot());
}

function forceGC(req, res) {
    if (typeof global.gc === 'function') {
        global.gc();
        res.json({ gcTriggered: true, ...getSnapshot() });
    } else {
        res.status(501).json({
            error: 'GC not exposed. Start node with --expose-gc flag.',
            ...getSnapshot()
        });
    }
}

function trimCaches(req, res) {
    const cleared = [];

    // Trim history caches
    if (ffastransHistory._clearCaches) {
        ffastransHistory._clearCaches();
        cleared.push('ffastrans_history_jobs (jobCache, workaround_dispel_database, fileContentDatabase)');
    }

    // Force GC if available
    let gcTriggered = false;
    if (typeof global.gc === 'function') {
        global.gc();
        gcTriggered = true;
    }

    res.json({ cleared, gcTriggered, ...getSnapshot() });
}

module.exports = { getMemory, forceGC, trimCaches };
