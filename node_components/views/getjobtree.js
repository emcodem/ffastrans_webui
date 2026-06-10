const userpermissions = require("../userpermissions");

module.exports = function(app, express) {

    app.get('/getjobtree', async (req, res) => {
        try {
            const jobid = req.query.jobid;
            if (!jobid) {
                res.status(400).json({ error: "jobid parameter required" });
                return;
            }

            // Permission filtering — matches gethistoryjobs_dhx.js pattern
            let allowedWorkflows = [];
            let allWorkflows = await global.db.jobs.distinct("workflow");
            allWorkflows = allWorkflows.map(wf => wf.toString());
            if (req.user) {
                for (let _wf of allWorkflows) {
                    if (await userpermissions.checkworkflowpermission(req.user.local.username, _wf)) {
                        allowedWorkflows.push(_wf);
                    }
                }
            } else {
                allowedWorkflows = allWorkflows;
            }

            // Lightweight child-count check used by the "show button" probe
            if (req.query.countonly === "1") {
                const childCount = await global.db.jobs.countDocuments({
                    workflow: { $in: allowedWorkflows },
                    "children.variables": { $elemMatch: { name: "sys_parent_job_id", data: jobid } }
                });
                res.json({ count: childCount });
                return;
            }

            // Fetch root job
            const rootJob = await global.db.jobs.findOne({ job_id: jobid });
            if (!rootJob) {
                res.status(404).json({ error: "Job not found" });
                return;
            }

            const parent_of_root = getParentJobId(rootJob);
            const allJobs = [enrichJob(rootJob, null, 0)];
            const seenIds = new Set([jobid]);

            // Iterative BFS — one query per depth level
            const MAX_JOBS = 2000;
            const MAX_DEPTH = 15;
            let currentLevel = [jobid];
            let depth = 0;

            while (currentLevel.length > 0 && allJobs.length < MAX_JOBS && depth < MAX_DEPTH) {
                depth++;
                const children = await global.db.jobs.find({
                    workflow: { $in: allowedWorkflows },
                    "children.variables": {
                        $elemMatch: { name: "sys_parent_job_id", data: { $in: currentLevel } }
                    }
                }).toArray();

                if (children.length === 0) break;

                const nextLevel = [];
                for (const child of children) {
                    if (allJobs.length >= MAX_JOBS) break;
                    if (seenIds.has(child.job_id)) continue;
                    seenIds.add(child.job_id);
                    const parentId = getParentJobId(child);
                    allJobs.push(enrichJob(child, parentId, depth));
                    nextLevel.push(child.job_id);
                }
                currentLevel = nextLevel;
            }

            res.json({
                root_job_id: jobid,
                parent_of_root: parent_of_root || null,
                jobs: allJobs
            });

        } catch (ex) {
            console.error("ERROR in getjobtree:", ex);
            res.status(500).end();
        }
    });

};

function getParentJobId(job) {
    for (const child of job.children || []) {
        const v = (child.variables || []).find(v => v.name === "sys_parent_job_id");
        if (v) return v.data;
    }
    return null;
}

function getMainBranch(job) {
    const children = job.children || [];
    return children.find(c => {
        const v = (c.variables || []).find(v => v.name === "s_is_main_branch");
        return v && v.data === "true";
    }) || children[0] || {};
}

function enrichJob(job, parentJobId, depth) {
    const main = getMainBranch(job);
    return {
        job_id: job.job_id,
        parent_job_id: parentJobId || null,
        depth: depth,
        workflow: job.workflow || "",
        state: job.state || "",
        job_start: job.job_start || "",
        job_end: job.job_end || "",
        duration: job.duration || "",
        source: main.source || "",
        outcome: main.outcome || job.outcome || ""
    };
}
