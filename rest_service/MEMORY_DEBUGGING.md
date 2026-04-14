# Memory Debugging Guide — REST Service

## Quick Start

1. **Diagnostic endpoint**: `GET /debug/memory` returns heap stats + cache sizes
2. **Force GC**: `POST /debug/memory/gc` (requires `--expose-gc` flag)
3. **Trim all caches**: `POST /debug/memory/trim` (evicts module-level caches + GC)
4. **Monitor script**: `node rest_service/test/api/controllers/test_memory_monitor.js [url] [interval_sec]`

## Common Memory Patterns

| Symptom | Likely Cause | How to Confirm |
|---|---|---|
| RSS grows steadily, never drops | Unbounded cache / Map / object | Check `/debug/memory` cache sizes over time |
| RSS spikes under load, drops after | Concurrent requests duplicating work | Check throughput — low req/s with high concurrency = no dedup |
| Heap used is low but RSS is high | V8 memory fragmentation or external buffers | Compare `heapUsed` vs `rss` in `/debug/memory` |
| RSS grows, heap stays flat | Native/external memory (Buffers, streams, child processes) | Check `external` and `arrayBuffers` fields |

## Architecture: Where Memory Lives

### Module-level caches (long-lived)
These persist for the lifetime of the process. Check `/debug/memory` for current sizes.

- **Response-level caches** — `jobs_cache`, `tickets_cache` in their respective controllers. TTL-based, bounded by design.
- **`jobCache`** in `ffastrans_history_jobs.js` — keyed by job_id, each entry is an array of split objects. Trimmed at 1000 entries.
- **`workaround_dispel_database`** in `ffastrans_history_jobs.js` — keyed by log file path, stores `{dispel: bool}`. Trimmed at 5000 entries.
- **`FilesystemWatcher.cache`** — `global.workflowFileSystemWatcher`. Stores parsed workflow JSON. Bounded by actual file count on disk (typically small).

### Transient memory (request-scoped)
These are the main cause of load-related spikes:

- **`ticket_files_to_array`** — reads + stats + parses many ticket files. Uses `PromisePool` with concurrency 50 to limit parallelism.
- **`getHistoryJobs`** — reads job directories + split files. Cached results land in `jobCache`.
- **Response serialization** — `res.json()` serializes the entire response to a string. A 7MB ticket response × 20 concurrent = 140MB just in JSON strings.

## Debugging Checklist

### 1. Is it a cache problem?
```
GET /debug/memory
```
Look at `caches` section. If any cache has unexpectedly high entry count or byte size, that's your target.

### 2. Is it a concurrency problem?
Run the stress test and watch the monitor simultaneously:
```
# Terminal 1: monitor
node rest_service/test/api/controllers/test_memory_monitor.js http://localhost:3000 2

# Terminal 2: stress test
node rest_service/test/api/controllers/test_jobs_cache.js http://localhost:3000 20 100
```
If RSS spikes dramatically during load but caches stay small, the issue is concurrent duplicate work (many requests each building their own copy of the response).

**Fix pattern**: promise-based dedup — share one in-flight computation across concurrent requests.

### 3. Is it a leak (grows forever)?
Monitor over a long period (hours). Look for:
- Cache entry counts that only go up
- RSS that trends upward across idle periods
- Objects/Maps without housekeeping (trim/evict logic)

**Fix pattern**: Add `Object.keys(cache).length > LIMIT` housekeeping at the top of the function that populates it.

### 4. Is it V8 fragmentation?
If `heapUsed` is much lower than `heapTotal`, and `rss` is much higher than `heapTotal`:
```
POST /debug/memory/gc
```
If RSS drops significantly after GC, V8 was just being lazy about releasing pages. This is normal — V8 keeps heap pages allocated in case they're needed again soon.

If RSS does NOT drop after GC, memory is held outside V8 (Buffers, native addons, file descriptors).

### 5. Heap snapshot (advanced)
```js
// Add temporarily to debug_memory.js or run in a REPL attached to the process
const v8 = require('v8');
const fs = require('fs');
const snapshotPath = `/tmp/heap-${Date.now()}.heapsnapshot`;
const snapshotStream = v8.writeHeapSnapshot(snapshotPath);
// Open in Chrome DevTools → Memory tab → Load
```

## Key Principles

1. **Never cache at file level, always at response level** — file caching means N files × M concurrent callers, response caching is always 1 copy.
2. **Every module-level cache/Map/object must have a size limit** — either trim to N entries or use a TTL.
3. **Concurrent identical requests must share work** — use the promise-dedup pattern: store the in-flight promise, let latecomers `await` it, clear it in `finally`.
4. **Bound filesystem concurrency** — use `PromisePool` or similar when stat-ing/reading many files. 50 concurrent is a good default for local disk.
5. **`JSON.stringify` is expensive** — a 7MB response means 7MB+ of string allocation per `res.json()` call. Caching the serialized response avoids re-serializing for each concurrent request (only worth it for large responses).
