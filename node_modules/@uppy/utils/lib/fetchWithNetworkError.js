import NetworkError from "./NetworkError.js";

/**
 * Wrapper around window.fetch that throws a NetworkError when appropriate
 */
export default function fetchWithNetworkError() {
  return fetch(...arguments).catch(err => {
    if (err.name === 'AbortError') {
      throw err;
    } else {
      throw new NetworkError(err);
    }
  });
}