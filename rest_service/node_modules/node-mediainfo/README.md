# node-mediainfo
[![install size](https://packagephobia.now.sh/badge?p=node-mediainfo)](https://packagephobia.now.sh/result?p=node-mediainfo)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)

Node implementation of [MediaArea's MediaInfo](https://mediaarea.net/en/MediaInfo) WebAssembly binary.

## Install

```sh
$ npm install --save node-mediainfo
```

## Usage

```ts
// Using ES6 imports
import mediainfo from 'node-mediainfo';

// Using Node.js `require()`
const mediainfo = require('node-mediainfo');

async function main() {
  const result = await mediainfo('path to media file');
  console.log(result);
}

main();
```

## Links
- Source: [github.com/m-rots/mediainfo](https://github.com/m-rots/mediainfo)
- Package: [npmjs.com/package/node-mediainfo](https://www.npmjs.com/package/node-mediainfo)

## License


This package uses [MediaInfo](http://mediaarea.net/MediaInfo) library, Copyright (c) 2002-2019 [MediaArea.net SARL](mailto:Info@MediaArea.net)
