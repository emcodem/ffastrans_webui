"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTarget = getTarget;
const is_plain_object_1 = require("is-plain-object");
const debug_1 = require("./debug");
const debug = debug_1.Debug.extend('router');
async function getTarget(req, config) {
    let newTarget;
    const router = config.router;
    if ((0, is_plain_object_1.isPlainObject)(router)) {
        newTarget = getTargetFromProxyTable(req, router);
    }
    else if (typeof router === 'function') {
        newTarget = await router(req);
    }
    return newTarget;
}
function getTargetFromProxyTable(req, table) {
    let result;
    const host = req.headers.host || '';
    const path = req.url || '';
    for (const [key, value] of Object.entries(table)) {
        if (containsPath(key)) {
            if (isHostAndPathKey(key)) {
                const [keyHost, keyPath] = splitHostAndPathKey(key);
                // SECURITY: host+path keys must match exact host + path prefix.
                if (host === keyHost && path.startsWith(keyPath)) {
                    // match 'localhost:3000/api'
                    result = value;
                    debug('match: "%s" -> "%s"', key, result);
                    break;
                }
            }
            else {
                if (path.startsWith(key)) {
                    // match '/api'
                    result = value;
                    debug('match: "%s" -> "%s"', key, result);
                    break;
                }
            }
        }
        else {
            if (key === host) {
                // match 'localhost:3000'
                result = value;
                debug('match: "%s" -> "%s"', host, result);
                break;
            }
        }
    }
    return result;
}
function containsPath(v) {
    return v.indexOf('/') > -1;
}
function isHostAndPathKey(v) {
    return containsPath(v) && !v.startsWith('/');
}
function splitHostAndPathKey(v) {
    const firstSlash = v.indexOf('/');
    return [v.slice(0, firstSlash), v.slice(firstSlash)];
}
