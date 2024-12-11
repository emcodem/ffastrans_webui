import { createAbortError } from "./AbortController.js";

/**
 * Return a Promise that resolves after `ms` milliseconds.
 */
export default function delay(ms, opts) {
  return new Promise((resolve, reject) => {
    var _opts$signal, _opts$signal2;
    if (opts != null && (_opts$signal = opts.signal) != null && _opts$signal.aborted) {
      return reject(createAbortError());
    }
    const timeout = setTimeout(() => {
      cleanup(); // eslint-disable-line no-use-before-define
      resolve();
    }, ms);
    function onabort() {
      clearTimeout(timeout);
      cleanup(); // eslint-disable-line no-use-before-define
      reject(createAbortError());
    }
    opts == null || (_opts$signal2 = opts.signal) == null || _opts$signal2.addEventListener('abort', onabort);
    function cleanup() {
      var _opts$signal3;
      opts == null || (_opts$signal3 = opts.signal) == null || _opts$signal3.removeEventListener('abort', onabort);
    }
    return undefined;
  });
}