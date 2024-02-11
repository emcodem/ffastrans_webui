/**
 * Default colors for all supported value types
 */
module.exports = {
  date: noColor,
  error: noColor,
  symbol: noColor,
  string: noColor,
  number: noColor,
  boolean: noColor,
  null: noColor,
  undefined: noColor,
};

/**
 * @params {string}
 * @returns {string}
 */
function noColor (value) {
  return value;
}
