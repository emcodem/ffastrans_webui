/* CSRF protection: rejects state changing requests that a browser sends from another origin.
   Uses the Sec-Fetch-Site header (set by the browser, pages cannot fake it), Origin as fallback for older browsers.
   Requests without both headers (curl, scripts, rest_service calling back) are not sent by a browser and pass. */

//GET routes that change state, protected like POST
const STATE_CHANGING_GETS = ["/farmadmin_install_service", "/generatetestjobs", "/logout"];

//admin setting, comma separated list like https://portal.example.com, for web apps that may call us from the browser
function trustedOrigins() {
    return (global.config.STATIC_TRUSTED_ORIGINS || "").split(",").map(o => o.trim().replace(/\/$/, "")).filter(o => o);
}

//returns a reason string if the request comes from a foreign origin, otherwise false
function crossOriginReason(req) {
    const origin = req.headers["origin"];
    if (origin && trustedOrigins().includes(origin)) {
        return false;
    }
    const site = req.headers["sec-fetch-site"];
    if (site) {
        //none: user typed the url or opened a bookmark
        return (site === "same-origin" || site === "none") ? false : "Sec-Fetch-Site " + site;
    }
    if (origin) {
        let host;
        try {
            host = new URL(origin).host;
        } catch (ex) {
            return "Origin " + origin; //e.g. "null" from sandboxed frames
        }
        return host === req.headers["host"] ? false : "Origin " + origin;
    }
    return false;
}

function crossOriginProtection(req, res, next) {
    const safe = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    //express routing ignores case and a trailing slash, so must we
    const route_path = req.path.toLowerCase().replace(/\/+$/, "");
    if (safe && !STATE_CHANGING_GETS.includes(route_path)) {
        return next();
    }
    const reason = crossOriginReason(req);
    if (!reason) {
        return next();
    }
    console.warn("Blocked cross origin request:", req.method, req.originalUrl, reason);
    res.status(403).json({ message: "Forbidden, cross origin request" });
}

module.exports = { crossOriginProtection, crossOriginReason };
