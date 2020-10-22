const typeOf = require('./typeOf');
const getConfig = require('./config');
const getPrefix = require('./getPrefix');

/**
 * value types that not require indent after property name that include the value
 */
const NO_INDENT_TYPES = ['object', 'array'];

module.exports = function yamlifyObject (target, config) {
  const {
    colors,
    prefix,
    postfix,
    dateToString,
    errorToString,
    indent: indentChars,
  } = getConfig(config);

  const seen = new Map();

  /**
   * Object to yaml string formatter
   *
   * @param {Object} obj
   * @param {number} [indentLength=1]
   * @returns {string}
   */
  function objectProperty (obj, indentLength = 1, inArray = 0) {
    if (Object.keys(obj).length === 0) {
      return ' {}';
    }

    let str = '\n';
    const objectPrefix = getPrefix(indentLength, indentChars);

    Object
      .keys(obj)
      .forEach((name) => {
        const value = obj[name];
        const type = typeOf(value);
        const inArrayPrefix = getPrefix(inArray, '  ');
        const afterPropsIndent = NO_INDENT_TYPES.includes(type) ? '' : ' ';
        const valueString = checkCircular(value) ? ' [Circular]' : typifiedString(type, value, indentLength + 1, inArray);

        str += `${
          inArrayPrefix
        }${
          objectPrefix
        }${
          name
        }:${
          afterPropsIndent
        }${
          valueString
        }\n`;
      });

    return str.substring(0, str.length - 1);
  }

  /**
   * Array to yaml string formatter
   *
   * @param {Array} values
   * @param {number} [indentLength=1]
   * @return {string}
   */
  function arrayProperty (values, indentLength = 1, inArray = 0) {
    if (values.length === 0) {
      return ' []';
    }

    let str = '\n';
    const arrayPrefix = getPrefix(indentLength, indentChars);

    values
      .forEach((value) => {
        const type = typeOf(value);
        const inArrayPrefix = getPrefix(inArray, '  ');
        const valueString = checkCircular(value) ? '[Circular]' : typifiedString(type, value, indentLength, inArray + 1)
          .toString()
          .trimLeft();

        str += `${
          inArrayPrefix
        }${
          arrayPrefix
        }- ${
          valueString
        }\n`;
      });

    return str.substring(0, str.length - 1);
  }

  function typifiedString (type, value, indentLength, inArray) {
    switch (type) {
      case 'array':
        return arrayProperty(value, indentLength, inArray);
      case 'object':
        return objectProperty(value, indentLength, inArray);
      case 'string':
        return colors.string(value);
      case 'symbol':
        return colors.symbol(value.toString());
      case 'number':
        return colors.number(value);
      case 'boolean':
        return colors.boolean(value);
      case 'null':
        return colors.null('null');
      case 'undefined':
        return colors.undefined('undefined');
      case 'date':
        return colors.date(dateToString(value));
      case 'error':
        return colors.error(errorToString(value));
      default:
        if (value && value.toString) {
          return value.toString();
        }
        return Object.prototype.toString.call(value);
    }
  }

  function checkCircular (value) {
    if (!['object', 'array'].includes(typeOf(value))) {
      return false;
    }

    if (seen.has(value)) {
      return true;
    }

    seen.set(value);

    return false;
  }

  let string = '';

  seen.set(target);

  if (
    typeOf(target) === 'object'
    && Object.keys(target).length > 0
  ) {
    string = objectProperty(target);
  } else if (
    typeOf(target) === 'array'
    && target.length > 0
  ) {
    string = arrayProperty(target);
  }

  if (string.length === 0) {
    return '';
  }

  return `${
    prefix
  }${
    string.slice(1)
  }${
    postfix
  }`;
};
