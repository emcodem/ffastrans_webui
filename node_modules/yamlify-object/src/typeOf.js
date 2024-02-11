module.exports = function typeOf (value) {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value instanceof Date) {
    return 'date';
  }

  if (value instanceof Error) {
    return 'error';
  }

  if (value === null) {
    return 'null';
  }

  if (
    typeof value === 'object'
    && Object.prototype.toString.call(value) === '[object Object]'
  ) {
    return 'object';
  }

  return typeof value;
};
