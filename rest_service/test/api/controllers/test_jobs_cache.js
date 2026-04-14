/**
 * Stress test: concurrent access to GET /jobs and GET /tickets.
 *
 * Usage:
 *   node test_jobs_cache.js [BASE_URL] [CONCURRENCY] [TOTAL_REQUESTS]
 *
 * Defaults:
 *   BASE_URL        = http://localhost:3000
 *   CONCURRENCY     = 100      (simultaneous in-flight requests)
 *   TOTAL_REQUESTS  = 500
 *
 * Examples:
 *   node test_jobs_cache.js
 *   node test_jobs_cache.js https://localhost:4443 200 1000
 */

'use strict';

// Allow self-signed certs when targeting https://localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http  = require('http');
const https = require('https');

// ─── Config ────────────────────────────────────────────────────────
const BASE_URL       = process.argv[2] || 'http://localhost:3000';
const CONCURRENCY    = parseInt(process.argv[3], 10) || 100;
const TOTAL_REQUESTS = parseInt(process.argv[4], 10) || 500;
const parsedBase     = new URL(BASE_URL);
const client         = parsedBase.protocol === 'https:' ? https : http;

// Bump socket pool so we can actually maintain high concurrency
if (client.globalAgent) {
    client.globalAgent.maxSockets = Math.max(CONCURRENCY + 50, client.globalAgent.maxSockets);
}

const ENDPOINTS = [
    { path: '/jobs',              label: 'GET /jobs' },
    { path: '/jobs?start=0&count=10', label: 'GET /jobs?start=0&count=10 (bypass cache)' },
    { path: '/tickets',           label: 'GET /tickets' },
    { path: '/tickets?nodetails', label: 'GET /tickets?nodetails (lightweight)' },
];

// ─── Helpers ───────────────────────────────────────────────────────

function doGet(endpoint) {
    const target = new URL(endpoint, BASE_URL);
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        const req = client.get(target, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
                resolve({ status: res.statusCode, elapsed, bodyLength: body.length, endpoint });
            });
        });
        req.on('error', reject);
        req.setTimeout(60000, () => {
            req.destroy(new Error(`Request to ${endpoint} timed out after 60 s`));
        });
    });
}

function runConcurrent(endpoint, concurrency, total) {
    const results = [];
    const errors  = [];
    let inflight  = 0;
    let queued    = 0;

    return new Promise((resolve) => {
        function launch() {
            while (inflight < concurrency && queued < total) {
                queued++;
                inflight++;
                doGet(endpoint)
                    .then(r  => results.push(r))
                    .catch(e => errors.push(e))
                    .finally(() => {
                        inflight--;
                        if (results.length + errors.length === total) {
                            resolve({ results, errors });
                        } else {
                            launch();
                        }
                    });
            }
        }
        launch();
    });
}

function percentile(sorted, p) {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

function formatMs(ms) {
    return ms.toFixed(1) + ' ms';
}

function printReport(label, results, errors, wallMs) {
    const times = results.map(r => r.elapsed).sort((a, b) => a - b);
    const statuses = {};
    results.forEach(r => { statuses[r.status] = (statuses[r.status] || 0) + 1; });

    console.log(`\n  ${label}`);
    console.log(`  ${'─'.repeat(52)}`);
    console.log(`  Successful:  ${results.length}   Errors: ${errors.length}`);
    console.log(`  Statuses:    ${JSON.stringify(statuses)}`);
    console.log(`  Wall time:   ${formatMs(wallMs)}`);
    console.log(`  Throughput:  ${(results.length / (wallMs / 1000)).toFixed(1)} req/s`);
    if (times.length > 0) {
        console.log(`  Latency  Min: ${formatMs(times[0])}  p50: ${formatMs(percentile(times, 50))}  p90: ${formatMs(percentile(times, 90))}  p99: ${formatMs(percentile(times, 99))}  Max: ${formatMs(times[times.length - 1])}`);
    }
    if (errors.length > 0) {
        console.log(`  First errors:`);
        errors.slice(0, 3).forEach(e => console.log(`    - ${e.message}`));
    }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    console.log('════════════════════════════════════════════════════════');
    console.log(' API Stress Test – /jobs + /tickets');
    console.log('════════════════════════════════════════════════════════');
    console.log(` Target:      ${BASE_URL}`);
    console.log(` Concurrency: ${CONCURRENCY}`);
    console.log(` Total/test:  ${TOTAL_REQUESTS}`);
    console.log('');

    // ── Phase 1: Warm-up ───────────────────────────────────────────
    console.log('Phase 1 – warm-up (one request per endpoint) ...');
    for (const ep of ENDPOINTS) {
        try {
            const r = await doGet(ep.path);
            console.log(`  ${ep.label}  =>  ${r.status}  ${formatMs(r.elapsed)}  ${r.bodyLength} bytes`);
        } catch (err) {
            console.error(`  ${ep.label}  =>  FAILED: ${err.message}`);
            console.error('  Is the server running?');
            process.exit(1);
        }
    }

    // ── Phase 2: Concurrent burst per endpoint ─────────────────────
    console.log(`\n════════════════════════════════════════════════════════`);
    console.log(` Phase 2 – ${TOTAL_REQUESTS} requests × ${CONCURRENCY} concurrent per endpoint`);
    console.log(`════════════════════════════════════════════════════════`);
    const phase2 = {};
    for (const ep of ENDPOINTS) {
        const wallStart = process.hrtime.bigint();
        const { results, errors } = await runConcurrent(ep.path, CONCURRENCY, TOTAL_REQUESTS);
        const wallMs = Number(process.hrtime.bigint() - wallStart) / 1e6;
        phase2[ep.path] = { results, errors, wallMs };
        printReport(ep.label, results, errors, wallMs);
    }

    // ── Phase 3: Mixed concurrent (all endpoints at once) ──────────
    const MIXED_PER_ENDPOINT = Math.ceil(TOTAL_REQUESTS / ENDPOINTS.length);
    const MIXED_CONCURRENCY  = Math.min(CONCURRENCY * 2, 500);
    console.log(`\n════════════════════════════════════════════════════════`);
    console.log(` Phase 3 – mixed burst: ${MIXED_PER_ENDPOINT * ENDPOINTS.length} total, ${MIXED_CONCURRENCY} concurrent`);
    console.log(`           (all endpoints hammered simultaneously)`);
    console.log(`════════════════════════════════════════════════════════`);

    const mixedResults = [];
    const mixedErrors  = [];
    let   mixedInflight = 0;
    let   mixedQueued   = 0;
    const mixedTotal = MIXED_PER_ENDPOINT * ENDPOINTS.length;
    // Build a shuffled queue of endpoints
    const mixedQueue = [];
    for (let i = 0; i < MIXED_PER_ENDPOINT; i++) {
        for (const ep of ENDPOINTS) {
            mixedQueue.push(ep.path);
        }
    }
    // Fisher-Yates shuffle
    for (let i = mixedQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixedQueue[i], mixedQueue[j]] = [mixedQueue[j], mixedQueue[i]];
    }

    const mixedWallStart = process.hrtime.bigint();
    await new Promise((resolve) => {
        function launch() {
            while (mixedInflight < MIXED_CONCURRENCY && mixedQueued < mixedTotal) {
                const ep = mixedQueue[mixedQueued];
                mixedQueued++;
                mixedInflight++;
                doGet(ep)
                    .then(r  => mixedResults.push(r))
                    .catch(e => mixedErrors.push(e))
                    .finally(() => {
                        mixedInflight--;
                        if (mixedResults.length + mixedErrors.length === mixedTotal) {
                            resolve();
                        } else {
                            launch();
                        }
                    });
            }
        }
        launch();
    });
    const mixedWallMs = Number(process.hrtime.bigint() - mixedWallStart) / 1e6;

    // Break down mixed results by endpoint
    const byEndpoint = {};
    mixedResults.forEach(r => {
        if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = [];
        byEndpoint[r.endpoint].push(r);
    });
    for (const ep of ENDPOINTS) {
        const epResults = byEndpoint[ep.path] || [];
        printReport(`${ep.label} (mixed)`, epResults, [], mixedWallMs);
    }
    console.log(`\n  Overall mixed: ${mixedResults.length} ok, ${mixedErrors.length} errors in ${formatMs(mixedWallMs)}`);
    console.log(`  Throughput:    ${(mixedResults.length / (mixedWallMs / 1000)).toFixed(1)} req/s`);

    // ── Phase 4: Cache behavior for /jobs ──────────────────────────
    console.log(`\n════════════════════════════════════════════════════════`);
    console.log(` Phase 4 – /jobs cache validation`);
    console.log(`════════════════════════════════════════════════════════`);

    // 4a: rapid-fire 50 requests (should all hit cache)
    console.log('  4a: Rapid-fire 50 requests to /jobs (expect cache hits) ...');
    const cachedResults = [];
    const rapidStart = process.hrtime.bigint();
    await Promise.all(Array.from({ length: 50 }, () =>
        doGet('/jobs').then(r => cachedResults.push(r))
    ));
    const rapidMs = Number(process.hrtime.bigint() - rapidStart) / 1e6;
    const cachedTimes = cachedResults.map(r => r.elapsed).sort((a, b) => a - b);
    console.log(`      50 requests in ${formatMs(rapidMs)}`);
    console.log(`      Latency  Min: ${formatMs(cachedTimes[0])}  Max: ${formatMs(cachedTimes[cachedTimes.length - 1])}`);

    // 4b: wait for expiry
    console.log('  4b: Waiting 3.5 s for cache expiry ...');
    await new Promise(r => setTimeout(r, 3500));
    const postExpiry = await doGet('/jobs');
    console.log(`      Post-expiry: ${postExpiry.status}  ${formatMs(postExpiry.elapsed)} (should be slower = fresh fetch)`);

    // 4c: thundering herd after expiry — 200 simultaneous requests
    const herdSize = Math.max(200, CONCURRENCY);
    console.log(`  4c: Thundering herd — ${herdSize} simultaneous requests right after expiry ...`);
    await new Promise(r => setTimeout(r, 3500)); // ensure cache expired again
    const herdResults = [];
    const herdStart = process.hrtime.bigint();
    await Promise.all(Array.from({ length: herdSize }, () =>
        doGet('/jobs').then(r => herdResults.push(r)).catch(() => {})
    ));
    const herdMs = Number(process.hrtime.bigint() - herdStart) / 1e6;
    const herdTimes = herdResults.map(r => r.elapsed).sort((a, b) => a - b);
    const herdStatuses = {};
    herdResults.forEach(r => { herdStatuses[r.status] = (herdStatuses[r.status] || 0) + 1; });
    console.log(`      ${herdResults.length} ok in ${formatMs(herdMs)}  Statuses: ${JSON.stringify(herdStatuses)}`);
    console.log(`      Latency  Min: ${formatMs(herdTimes[0])}  p50: ${formatMs(percentile(herdTimes, 50))}  Max: ${formatMs(herdTimes[herdTimes.length - 1])}`);
    console.log(`      (All should share a single refresh — p50 should be near Max)`);

    // ── Summary ────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════');
    const totalErrors = mixedErrors.length + Object.values(phase2).reduce((s, p) => s + p.errors.length, 0);
    if (totalErrors > 0) {
        console.log(` ⚠  ${totalErrors} total errors across all phases`);
    } else {
        console.log(' ✓  All requests succeeded across all phases.');
    }
    console.log('════════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
