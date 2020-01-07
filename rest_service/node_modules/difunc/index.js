"use strict";
const esprima = require('esprima');

module.exports = function difunc(dependencies, func, thisArg) {
  if (typeof func !== 'function') {
    throw new Error(`${func} was not typeof function`);
  }

  if (!dependencies || typeof dependencies !== 'object') {
    throw new Error(`${dependencies} was not typeof 'object' or was falsey`);
  }

  const tokens = esprima.tokenize(func.toString());
  const params = [];

  if (tokens[0].type === 'Keyword') {
    tokens.shift();
    if (tokens[0].type === 'Identifier') {
      tokens.shift();
    }
  }

  for (let token, i = 0, len = tokens.length; i < len; i++) {
    token = tokens[i];
    if (token.type === 'Identifier') {
      if (!(token.value in dependencies)) {
        throw new Error(`${token.value} was not defined in dependencies`);
      }
      params.push(dependencies[token.value]);
    } else if (token.type === 'Punctuator') {
      if (token.value === '(' || token.value === ',') {
        continue;
      } else if(token.value === '{' || token.value === '[') {
        throw new Error('destructuring is not supported');
      } else if(token.value === '=') {
        throw new Error('default parameters are not supported');
      }
      break;
    } else {
      break;
    }
  }

  return func.apply(thisArg, params);
};
