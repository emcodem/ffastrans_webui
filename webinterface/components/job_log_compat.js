(function (root, factory) {
    const helpers = factory();
    if (typeof module === "object" && module.exports) module.exports = helpers;
    else root.FFAStransLogCompat = helpers;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    function normalizeTimestamp(value) {
        // Older offsets use decimal hours (+05.50 means +05:30).
        // Keep 1.5 ISO offsets intact.
        if (typeof value !== "string") return value;
        return value.replace(/([+-]\d{2})\.(\d{2})$/, (_, hours, fraction) => {
            const minutes = { "00": "00", "25": "15", "50": "30", "75": "45" }[fraction] ?? fraction;
            return hours + ":" + minutes;
        });
    }

    function getNodeEndState(data) {
        // Legacy successful nodes have null data. 1.5 always supplies outcome data.
        if (data == null || data.status === "ok") return "success";
        return data.status === "abort" ? "cancelled" : "error";
    }

    function getSubWorkflowId(line) {
        if (line?.node?.type !== "sub_wf") return;
        const data = line.data;
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        // 1.5 wraps the destination in an outbound event; older logs put it directly in data.
        const outbound = data.type === "outbound" && data.data;
        const nestedId = outbound && typeof outbound === "object" && !Array.isArray(outbound)
            ? outbound.wf_id : undefined;
        for (const id of [data.wf_id, nestedId]) {
            if (typeof id === "string" && id.trim()) return id;
        }
    }

    function getBranchFilters(branch, isRunning = branch.status === "running" && !branch.end_time) {
        const path = Array.isArray(branch.path) ? branch.path : [];
        const nodeIds = path.map(node => node.id).filter(Boolean);
        const splitIds = path.map(node => node.split_id ?? node.split).filter(Boolean);
        if (branch.split_id) splitIds.push(branch.split_id);
        return {
            // A running ticket's path is only a snapshot. Later polls must also
            // show nodes reached after the user selected this branch.
            nodeIds: !isRunning && nodeIds.length ? [...new Set(nodeIds)] : undefined,
            splitIds: splitIds.length ? [...new Set(splitIds)] : undefined
        };
    }

    function getLogLineKey(line) {
        // Ignore fields added by the grid/parser when comparing a final log with polls.
        return JSON.stringify([
            line.created, line.node, line.split_id, line.event, line.type,
            line.context, line.host, line.pid, line.linenum, line.current_status,
            line.user, line.runame, line.data
        ], (_, value) => value && typeof value === "object" && !Array.isArray(value)
            ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
            : value);
    }

    function getUnseenLogLines(lines, previousLines, isPartial = false) {
        // Match filenames first, even when an older archive has unnamed rows.
        // Two distinct snippet filenames must not collapse merely because their
        // event content is identical.
        const byFile = new Map();
        previousLines.forEach((line, index) => {
            if (!line._log_file) return;
            if (!byFile.has(line._log_file)) byFile.set(line._log_file, []);
            byFile.get(line._log_file).push(index);
        });
        const consumed = new Set();
        const matched = lines.map(line => {
            const indices = line._log_file && byFile.get(line._log_file);
            if (!indices?.length) return false;
            consumed.add(indices.pop());
            return true;
        });

        const namedContent = new Map(), unnamedContent = new Map();
        previousLines.forEach((line, index) => {
            if (consumed.has(index)) return;
            const counts = line._log_file ? namedContent : unnamedContent;
            const key = getLogLineKey(line);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        function consume(counts, key) {
            const count = counts.get(key) || 0;
            if (!count) return false;
            counts.set(key, count - 1);
            return true;
        }

        return lines.filter((line, index) => {
            if (matched[index]) return false;
            // Only final reconciliation can match a named row against an older
            // server's unnamed polls; a new named partial row is a new event.
            if (line._log_file && isPartial) return true;
            const key = getLogLineKey(line);
            if (consume(unnamedContent, key)) return false;
            return !!line._log_file || !consume(namedContent, key);
        });
    }

    return { normalizeTimestamp, getNodeEndState, getSubWorkflowId, getBranchFilters, getLogLineKey, getUnseenLogLines };
}));
