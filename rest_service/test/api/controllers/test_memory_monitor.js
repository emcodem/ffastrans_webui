/**
 * Memory Monitor — polls the /debug/memory endpoint and logs a time-series
 * table to the console.  Zero dependencies.
 *
 * Usage:
 *   node test_memory_monitor.js [baseUrl] [intervalSec]
 *
 * Examples:
 *   node test_memory_monitor.js                         # http://localhost:3000, 5s
 *   node test_memory_monitor.js http://localhost:4000 2  # custom host, 2s interval
 *
 * While running, press:
 *   g  — trigger GC  (POST /debug/memory/gc)
 *   t  — trim caches (POST /debug/memory/trim)
 *   q  — quit
 */

const http = require('http');
const https = require('https');

const BASE = process.argv[2] || 'http://localhost:3000';
const INTERVAL = (Number(process.argv[3]) || 5) * 1000;

function fetch(urlStr, method = 'GET') {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const lib = url.protocol === 'https:' ? https : http;
        const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname, rejectUnauthorized: false };
        const req = lib.request(opts, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch { resolve(body); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function mb(bytes) {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

let prevRss = 0;
let sampleCount = 0;

async function poll() {
    try {
        const snap = await fetch(`${BASE}/debug/memory`);
        sampleCount++;
        const m = snap.memory;
        const rssDelta = m.rssRaw - prevRss;
        prevRss = m.rssRaw;

        // Header every 20 lines
        if (sampleCount % 20 === 1) {
            console.log('');
            console.log(
                'Time'.padEnd(12) +
                'RSS'.padStart(10) +
                'Δ RSS'.padStart(10) +
                'Heap Used'.padStart(12) +
                'Heap Total'.padStart(12) +
                'External'.padStart(10) +
                '  | jobCache'.padEnd(12) +
                'dispelDb'.padStart(10) +
                'wfWatcher'.padStart(10) +
                'Uptime'.padStart(10)
            );
            console.log('-'.repeat(110));
        }

        const caches = snap.caches || {};
        const jc = caches['ffastrans_history_jobs.jobCache'] || {};
        const dd = caches['ffastrans_history_jobs.workaround_dispel_database'] || {};
        const wf = caches['workflowFileSystemWatcher'] || {};

        const deltaStr = sampleCount === 1 ? '—' : (rssDelta >= 0 ? '+' : '') + mb(rssDelta);

        console.log(
            new Date().toLocaleTimeString().padEnd(12) +
            m.rss.padStart(10) +
            deltaStr.padStart(10) +
            m.heapUsed.padStart(12) +
            m.heapTotal.padStart(12) +
            m.external.padStart(10) +
            `  | ${(jc.entries ?? '?')}`.padEnd(12) +
            String(dd.entries ?? '?').padStart(10) +
            String(wf.entries ?? '?').padStart(10) +
            `${snap.uptimeSeconds}s`.padStart(10)
        );
    } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error: ${err.message}`);
    }
}

// ── Keyboard commands ─────────────────────────────────────────────────
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (key) => {
        if (key === 'q' || key === '\u0003') { // q or Ctrl+C
            console.log('\nExiting...');
            process.exit(0);
        }
        if (key === 'g') {
            console.log('\n→ Triggering GC...');
            try {
                const r = await fetch(`${BASE}/debug/memory/gc`, 'POST');
                if (r.gcTriggered) {
                    console.log(`  GC done. RSS now: ${r.memory.rss}`);
                } else {
                    console.log('  GC not available (start node with --expose-gc)');
                }
            } catch (e) { console.error('  Error:', e.message); }
        }
        if (key === 't') {
            console.log('\n→ Trimming caches...');
            try {
                const r = await fetch(`${BASE}/debug/memory/trim`, 'POST');
                console.log(`  Cleared: ${r.cleared.join(', ') || 'none'}`);
                console.log(`  GC triggered: ${r.gcTriggered}. RSS now: ${r.memory.rss}`);
            } catch (e) { console.error('  Error:', e.message); }
        }
    });
}

console.log(`Memory Monitor — polling ${BASE}/debug/memory every ${INTERVAL / 1000}s`);
console.log('Keys: [g] force GC  [t] trim caches  [q] quit\n');

poll(); // first sample immediately
setInterval(poll, INTERVAL);
