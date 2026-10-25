'use strict';

const fs = require('fs').promises;
const common = require('./common/helpers.js');
const jobFiles = require('./common/job_log_files.js');
const active = require('./common/ffastrans_active_jobs.js');
const path = require('path');

module.exports = { get: start };

async function start(req, res) {
    const jobid = req.query.jobid;
    try {
        const jobDir = await jobFiles.restoreArchivedJob(jobid);
        const descriptionPath = path.join(jobDir, '.json');
        let description;
        let fromTicket = false;
        try {
            description = await common.readJsonFile(descriptionPath);
        } catch (error) {
            if (!['ENOENT', 'ENOTDIR'].includes(error.code) && !(error instanceof SyntaxError)) throw error;
            description = await get_job_from_tickets(jobid);
            if (!description) {
                if (error instanceof SyntaxError) throw error;
                return res.status(404).json({});
            }
            fromTicket = true;
        }

        const job = jobFiles.normalizeJob(description);
        if ('status' in job && await jobFiles.isConsolidatedLogReady(path.join(jobDir, 'full_log.json')) && !(await active.getBusyJobIds()).has(jobid)) job.status = 'finished';

        // Older jobs carry a single workflow.json; FFAStrans 1.3+ stores a
        // workflow collection. 1.5 identifies its main workflow with wf_id.
        const legacyWorkflow = path.join(jobDir, 'workflow.json');
        const workflowsDir = path.join(jobDir, 'workflows');
        const legacySnapshot = await readWorkflow(legacyWorkflow);
        if (legacySnapshot) job.wf_object = legacySnapshot;
        const workflowEntries = await readDirectory(workflowsDir);
        if (workflowEntries.length) {
            job.workflows = {};
            for (const entry of workflowEntries) {
                if (!entry.isFile() || !/\.json$/i.test(entry.name)) continue;
                try {
                    const workflow = await readWorkflow(path.join(workflowsDir, entry.name));
                    if (!workflow || typeof workflow.wf_id !== 'string') continue;
                    Object.defineProperty(job.workflows, workflow.wf_id, { value: workflow, enumerable: true, configurable: true, writable: true });
                    if (!legacySnapshot && workflow.wf_id === job.workflow.id) job.wf_object = workflow;
                } catch (error) {
                    console.error('Cannot read job workflow:', entry.name, error);
                }
            }
        }

        // Jobs without copied workflows can still use the configured workflow.
        if (!job.wf_object && typeof job.workflow.id === 'string') {
            const workflowDir = global.api_config.s_SYS_WORKFLOW_DIR;
            // Match upstream's containment policy for custom workflow names too.
            const candidates = workflowDir ? [common.resolveInside(workflowDir, job.workflow.id + '.json'), common.resolveInside(workflowDir, 'workflow.json')] : [];
            if (global.api_config.s_SYS_CONFIGS_DIR) candidates.push(common.resolveInside(path.join(global.api_config.s_SYS_CONFIGS_DIR, 'workflows'), job.workflow.id + '.json'));
            for (const filename of candidates.filter(Boolean)) {
                if (await jobFiles.exists(filename)) {
                    const workflow = await readWorkflow(filename);
                    if (workflow && workflow.wf_id === job.workflow.id) {
                        job.wf_object = workflow;
                        break;
                    }
                }
            }
        }
        if (!job.wf_object) {
            // Older queued/held jobs were returned directly from /tickets.
            // Their metadata is still useful before a workflow is copied, or
            // after its configuration has been removed.
            if (fromTicket) return res.json(job);
            return res.status(500).json({ description: 'Cannot find workflow for job ' + jobid });
        }
        if (!job.workflow.name) job.workflow.name = job.wf_object.wf_name;
        return res.json(job);
    } catch (error) {
        if (error.statusCode !== 400) console.error('Cannot get job details:', error);
        return res.status(error.statusCode || 500).json({ description: error.message });
    }
}

async function get_job_from_tickets(lookfor_jobid) {
    for (const state of ['running', 'queue', 'pending', 'hold']) {
        const dir = path.join(global.api_config.s_SYS_CACHE_DIR, 'tickets', state);
        const entries = await readDirectory(dir);
        for (const entry of entries) {
            if (!entry.isFile() || !/\.json$/i.test(entry.name) || entry.name.split('~')[1] !== lookfor_jobid) continue;
            try {
                const ticket = await common.readJsonFile(path.join(dir, entry.name));
                if (ticket && typeof ticket === 'object' && !Array.isArray(ticket) && (!ticket.job_id || ticket.job_id === lookfor_jobid)) {
                    ticket.job_id = lookfor_jobid;
                    return ticket;
                }
            } catch (error) {
                // A ticket may be in the process of moving between states.
                if (!['ENOENT', 'ENOTDIR'].includes(error.code) && !(error instanceof SyntaxError)) throw error;
            }
        }
    }
    return false;
}

async function readDirectory(directory) {
    try {
        return await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (['ENOENT', 'ENOTDIR'].includes(error.code)) return [];
        throw error;
    }
}

async function readWorkflow(filename) {
    try {
        const workflow = await common.readJsonFile(filename);
        if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) return null;
        return workflow;
    } catch (error) {
        // Copied workflow snapshots can be transiently incomplete. Try another
        // snapshot or the configured workflow before failing the whole request.
        if (!['ENOENT', 'ENOTDIR'].includes(error.code) && !(error instanceof SyntaxError)) throw error;
        return null;
    }
}
