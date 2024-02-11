const clc = require('cli-color');

module.exports = {
  error: clc.red,
  symbol: clc.magenta,
  string: clc.green,
  date: clc.cyan,
  number: clc.magenta,
  boolean: clc.yellow,
  null: clc.yellow.bold,
  undefined: clc.yellow.bold,
};
