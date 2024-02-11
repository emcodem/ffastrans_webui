// Node.js env
expect = require('expect.js');
md2 = require('../src/md2.js');
require('./test.js');

delete require.cache[require.resolve('../src/md2.js')]
delete require.cache[require.resolve('./test.js')]
md2 = null

// Webpack browser env
JS_MD2_NO_NODE_JS = true;
window = global;
md2 = require('../src/md2.js');
require('./test.js');

delete require.cache[require.resolve('../src/md2.js')]
delete require.cache[require.resolve('./test.js')]
md2 = null

// browser env
JS_MD2_NO_NODE_JS = true;
JS_MD2_NO_COMMON_JS = true;
window = global;
require('../src/md2.js');
require('./test.js');

delete require.cache[require.resolve('../src/md2.js')];
delete require.cache[require.resolve('./test.js')];
md2 = null;

// browser AMD
JS_MD2_NO_NODE_JS = true;
JS_MD2_NO_COMMON_JS = true;
window = global;
define = function (func) {
  md2 = func();
  require('./test.js');
};
define.amd = true;

require('../src/md2.js');


// define = function(func) {
//   md2 = func();
// };
// define.amd = true;

// require('../src/md2.js');
// require('./test.js');
