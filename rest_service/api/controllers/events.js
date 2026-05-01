const path = require("path");
const fs = require("fs");
const axios = require("axios");

let registeredCallbacks = new Set();
let watcher = null;

// Ensure we only start watching once
function ensureWatcher() {
    if (watcher) return;
    
    const ticketsPath = path.join(global.api_config["s_SYS_CACHE_DIR"], "tickets");
    
    console.log("Starting filesystem watcher for tickets folder:", ticketsPath);
    try {
        fs.mkdirSync(ticketsPath, { recursive: true });
        
        let debounceTimer = null;
        let pendingEvents = [];

        watcher = fs.watch(ticketsPath, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            pendingEvents.push({ eventType, filename, timestamp: Date.now() });
            
            if (debounceTimer) clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                const batch = [...pendingEvents];
                pendingEvents = [];
                debounceTimer = null;
                
                registeredCallbacks.forEach(url => {
                    axios.post(url, { events: batch }).catch(err => {
                        console.error("Error notifying callback:", url, err.message);
                    });
                });
            }, 500); // Wait 500ms for activity to settle
        });
    } catch (ex) {
        console.error("Failed to start tickets watcher:", ex);
    }
}

module.exports = {
    post: function(req, res) {
        ensureWatcher();
        const callbackUrl = req.body.url;
        if (!callbackUrl) {
            return res.status(400).json({ error: "Missing 'url' in body" });
        }
        registeredCallbacks.add(callbackUrl);
        console.log("Registered event callback:", callbackUrl);
        return res.json({ success: true, message: "Callback registered" });
    }
};
