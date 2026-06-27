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

            // Lightweight probe used to show the "Job Tree" button. The job is part of
            // a family (and thus has a tree worth showing) if it has children OR a parent.
            if (req.query.countonly === "1") {
                const childCount = await global.db.jobs.countDocuments({
                    workflow: { $in: allowedWorkflows },
                    "children.variables": { $elemMatch: { name: "sys_parent_job_id", data: jobid } }
                });
                let count = childCount;
                if (count === 0) {
                    const self = await global.db.jobs.findOne({ job_id: jobid }, { projection: { children: 1, workflow: 1 } });
                    if (self && allowedWorkflows.includes(String(self.workflow)) && getParentJobId(self)) {
                        count = 1;
                    }
                }
                res.json({ count: count });
                return;
            }

            // Fetch the requested job
            const requestedJob = await global.db.jobs.findOne({ job_id: jobid });
            if (!requestedJob) {
                res.status(404).json({ error: "Job not found" });
                return;
            }

            const MAX_JOBS = 2000;
            const MAX_DEPTH = 15;

            // Walk UP the sys_parent_job_id chain to the top-most ancestor present in the
            // DB, so the tree is rooted at the whole family rather than the opened job.
            // chain is ordered [requested ... trueRoot].
            const chain = [requestedJob];
            const upSeen = new Set([jobid]);
            let parent_of_root = null;
            let cursor = requestedJob;
            for (let i = 0; i < MAX_DEPTH; i++) {
                const pid = getParentJobId(cursor);
                if (!pid) break;                          // reached the true root
                if (upSeen.has(pid)) break;               // cycle guard
                const parentDoc = await global.db.jobs.findOne({ job_id: pid });
                if (!parentDoc) { parent_of_root = pid; break; } // parent not in DB -> keep up-link
                upSeen.add(pid);
                chain.push(parentDoc);
                cursor = parentDoc;
                if (i === MAX_DEPTH - 1) parent_of_root = getParentJobId(parentDoc) || null;
            }

            const trueRoot = chain[chain.length - 1];
            const rootId = trueRoot.job_id;

            const allJobs = [enrichJob(trueRoot, null, 0)];
            const seenIds = new Set([rootId]);

            // Iterative BFS down from the true root — one query per depth level
            let currentLevel = [rootId];
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

            // Truncation safety: guarantee the opened job and its full ancestor chain are
            // always present even if MAX_JOBS cut the BFS short before reaching them.
            for (let k = 0; k < chain.length; k++) {
                const doc = chain[k];
                if (seenIds.has(doc.job_id)) continue;
                seenIds.add(doc.job_id);
                const chainDepth = (chain.length - 1) - k;
                const pid = (doc.job_id === rootId) ? null : getParentJobId(doc);
                allJobs.push(enrichJob(doc, pid, chainDepth));
            }
            // Stable parent-before-child ordering (root at depth 0 stays first)
            allJobs.sort((a, b) => a.depth - b.depth);

            res.json({
                requested_job_id: jobid,
                root_job_id: rootId,
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
