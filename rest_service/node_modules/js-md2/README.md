# js-md2
[![Build Status](https://api.travis-ci.org/emn178/js-md2.png)](https://travis-ci.org/emn178/js-md2)
[![Build Status](https://coveralls.io/repos/emn178/js-md2/badge.png?branch=master)](https://coveralls.io/r/emn178/js-md2?branch=master)  
[![NPM](https://nodei.co/npm/js-md2.png?stars&downloads)](https://nodei.co/npm/js-md2/)  
A simple MD2 hash function for JavaScript supports UTF-8 encoding.

## Demo
[MD2 Online](http://emn178.github.io/online-tools/md2.html)  

## Download
[Compress](https://raw.github.com/emn178/js-md2/master/build/md2.min.js)  
[Uncompress](https://raw.github.com/emn178/js-md2/master/src/md2.js)

## Installation
You can also install js-md2 by using Bower.

    bower install js-md2

For node.js, you can use this command to install:

    npm install js-md2

## Usage
You could use like this:
```JavaScript
md2('Message to hash');
```
If you use node.js, you should require the module first:
```JavaScript
var md2 = require('js-md2');
```
If you use require.js, you should require the module first:
```JavaScript
require(['md2.js'], function (md2) {
  // ...
});
```

## Example
```JavaScript
md2(''); // 8350e5a3e24c153df2275c9f80692773
md2('The quick brown fox jumps over the lazy dog'); // 03d85a0d629d2c442e987525319fc471
md2('The quick brown fox jumps over the lazy dog.'); // 71eaa7e440b611e41a6f0d97384b342a

// It also supports UTF-8 encoding
md2('中文'); // 7af93c270b0ec392ca2f0d90a927cf8a
```

## License
The project is released under the [MIT license](http://www.opensource.org/licenses/MIT).

## Contact
The project's website is located at https://github.com/emn178/js-md2  
Author: Chen, Yi-Cyuan (emn178@gmail.com)
