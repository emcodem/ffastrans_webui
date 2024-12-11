/**
 * Copies text to clipboard by creating an almost invisible textarea,
 * adding text there, then running execCommand('copy').
 * Falls back to prompt() when the easy way fails (hello, Safari!)
 * From http://stackoverflow.com/a/30810322
 *
 * @param {string} textToCopy
 * @param {string} fallbackString
 * @returns {Promise}
 */
type $TSFixMe = any;
export default function copyToClipboard(textToCopy: $TSFixMe, fallbackString?: string): $TSFixMe;
export {};
//# sourceMappingURL=copyToClipboard.d.ts.map