/**
 * Check if a URL string is an object URL from `URL.createObjectURL`.
 */
export default function isObjectURL(url) {
  return url.startsWith('blob:');
}