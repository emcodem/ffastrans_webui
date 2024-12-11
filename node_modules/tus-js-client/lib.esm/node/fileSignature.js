import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 */
export default function fingerprint(file, options) {
  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    var blockSize = 64 * 1024; // 64kb
    var content = file.slice(0, Math.min(blockSize, file.length));
    var hash = createHash('md5').update(content).digest('hex');
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