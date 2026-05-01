module.exports = function (req, res) {
    const batch = req.body.events || [];

    if (batch.length === 0) {
        return res.json({ success: true });
    }

    console.debug(`Received ${batch.length} ticket events in batch`);

    // Only trigger immediate job fetch if at least one event is in the 'running' folder
    const hasRunningFolderChange = batch.some(e => e.filename && e.filename.toLowerCase().includes("running"));

    if (hasRunningFolderChange && !global.dbfetcheractive) {
        global.dbfetcheractive = true;
        console.debug("Triggering job fetch from event batch (running folder change detected)");
        global.jobfetcher.fetchjobs()
            .catch(ex => console.trace("Error, jobfetcher exception in event handler. ", ex))
            .finally(() => global.dbfetcheractive = false);
    } else if (!hasRunningFolderChange) {
        console.debug("No changes detected in 'running' folder, skipping immediate job fetch");
    }

    res.json({ success: true });
};
