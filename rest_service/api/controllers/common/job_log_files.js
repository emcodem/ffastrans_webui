'use strict';

const fs = require('fs').promises;
const path = require('path');
const common = require('./helpers.js');
const restorations = new Map();

function getJobDir(jobid) {
    // Follow the shared policy for both job and archive locations. Safe custom
    // names are allowed; extraction arguments never pass through a shell.
    if (!common.isJobIdInside(jobid)) {
        const error = new Error('Invalid jobid');
        error.statusCode = 400;
        throw error;
    }
    return common.resolveInside(global.api_config.s_SYS_JOB_DIR, jobid);
}

async function exists(filename) {
    try {
        await fs.stat(filename);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
        throw error;
    }
}

async function isConsolidatedLogReady(filename) {
    // A bounded readiness envelope check, not full JSON validation. Large logs
    // must not be loaded just to decide whether branch polling can stop.
    let file;
    try {
        file = await fs.open(filename, 'r');
        const before = await file.stat();
        if (!before.isFile() || !before.size) return false;
        const windowSize = 4096;
        const buffer = Buffer.allocUnsafe(Math.min(windowSize, before.size));
        const headRead = await file.read(buffer, 0, buffer.length, 0);
        const head = buffer.toString('utf8', 0, headRead.bytesRead).replace(/^\uFEFF/, '').trimStart();
        if (!head.startsWith('[')) return false;
        let tail = head;
        if (before.size > windowSize) {
            const tailRead = await file.read(buffer, 0, buffer.length, before.size - buffer.length);
            tail = buffer.toString('utf8', 0, tailRead.bytesRead);
        }
        const after = await file.stat();
        return before.size === after.size && before.mtimeMs === after.mtimeMs && tail.trimEnd().endsWith(']');
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    } finally {
        if (file) await file.close();
    }
}

async function restoreArchivedJob(jobid) {
    const jobDir = getJobDir(jobid);
    // All endpoints must wait for an in-flight restore, even if the extractor
    // has already created some files. Do not expose a half-extracted archive.
    const absoluteDir = path.resolve(jobDir);
    const key = process.platform === 'win32' ? absoluteDir.toLowerCase() : absoluteDir;
    if (restorations.has(key)) return restorations.get(key);
    const restoration = restore(jobid, jobDir).finally(() => restorations.delete(key));
    restorations.set(key, restoration);
    return restoration;
}

async function restore(jobid, jobDir) {
    // Ongoing jobs have no full_log.json. Their existing directory must never
    // trigger archive extraction while polling logs or branches.
    if (await exists(jobDir)) return jobDir;
    const archiveRoot = path.join(global.api_config.s_SYS_CACHE_DIR, 'archive', 'jobs');
    const archive = common.resolveInside(archiveRoot, path.join(jobid.substring(0, 8), jobid + '.7z'));
    if (await exists(archive)) {
        const extractor = path.join(global.api_config.s_SYS_DIR, 'processors', 'resources', '7zr.exe');
        await fs.mkdir(path.dirname(jobDir), { recursive: true });
        // Keep partial archives outside jobs/, whose directories are enumerated
        // by history and active-job readers. A sibling supports atomic rename.
        const stagingRoot = path.join(path.dirname(path.resolve(global.api_config.s_SYS_JOB_DIR)), '.job-restores');
        await fs.mkdir(stagingRoot, { recursive: true });
        const stagingDir = await fs.mkdtemp(path.join(stagingRoot, 'restore-'));
        try {
            // Upstream's exeFile spawns a hidden process without a command shell.
            const code = await common.exeFile(extractor, ['x', archive, '-y', '-o' + stagingDir]);
            if (code !== 0) throw new Error('Cannot restore job archive (exit code ' + code + ')');
            // An engine job may have appeared while the archive was extracted.
            // Keep that active directory rather than overwriting its files.
            if (!await exists(jobDir)) {
                try {
                    await fs.rename(stagingDir, jobDir);
                } catch (error) {
                    if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code) || !await exists(jobDir)) throw error;
                }
            }
        } finally {
            if (path.dirname(path.resolve(stagingDir)) !== stagingRoot) throw new Error('Invalid archive staging directory');
            await fs.rm(stagingDir, { recursive: true, force: true });
        }
    }
    return jobDir;
}

function normalizeJob(job) {
    if (!job || typeof job !== 'object' || Array.isArray(job)) throw new Error('Invalid job description');
    const entry = job.entry_context || {};
    const workflow = typeof job.workflow === 'object' && job.workflow ? job.workflow : {};
    job.workflow = {
        ...workflow,
        id: workflow.id || entry.wf_id || job.wf_id || job.internal_wf_id,
        name: workflow.name || job.wf_name || (typeof job.workflow === 'string' ? job.workflow : job.internal_wf_name)
    };
    // FFAStrans 1.5 keeps the original submission context separately from
    // the branch path. Existing WebUI consumers still use nodes.start.
    if (!job.nodes?.start?.id) {
        const startId = entry.start_proc || job.start_proc || job.path?.[0]?.id;
        if (startId) job.nodes = { ...job.nodes, start: { ...job.nodes?.start, id: startId } };
    }
    if (job.variables == null) job.variables = entry.variables || [];
    return job;
}

module.exports = { exists, getJobDir, isConsolidatedLogReady, restoreArchivedJob, normalizeJob };
