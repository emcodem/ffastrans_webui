module.exports = function getPrefix (indentLength = 1, indentChars = '  ') {
  let prefix = '';
  for (let i = 0; i < indentLength; i += 1) {
    prefix += indentChars;
  }

  return prefix;
};
