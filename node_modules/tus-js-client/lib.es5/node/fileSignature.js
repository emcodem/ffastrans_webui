"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fingerprint;
var _crypto = require("crypto");
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 */
function fingerprint(file, options) {
  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    var blockSize = 64 * 1024; // 64kb
    var content = file.slice(0, Math.min(blockSize, file.length));
    var hash = (0, _crypto.createHash)('md5').update(content).digest('hex');
    var ret = ['node-buffer', hash, file.length, options.endpoint].join('-');
    return Promise.resolve(ret);
  }
  if (file instanceof fs.ReadStream && file.path != null) {
    return new Promise(function (resolve, reject) {
      var name = path.resolve(file.path);
      fs.stat(file.path, function (err, info) {
        if (err) {
          reject(err);
          return;
        }
        var ret = ['node-file', name, info.size, info.mtime.getTime(), options.endpoint].join('-');
        resolve(ret);
      });
    });
  }

  // fingerprint cannot be computed for file input type
  return Promise.resolve(null);
}