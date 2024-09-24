# Read Last N Lines

Read the last N lines of a file efficiently using node.js and fs.

## Installation

``` bash or cmd
npm install read-last-line --save
```

## Usage

example reading last 20 lines of a file
``` javascript code
const readLastLine = require('read-last-line');

readLastLine.read('file path', 20).then(function (lines) {
    console.log(lines)
}).catch(function (err) {
    console.log(err.message);
});
```