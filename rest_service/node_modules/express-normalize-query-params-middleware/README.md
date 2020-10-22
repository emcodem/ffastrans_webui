# express-normalize-query-params-middleware [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url]
> express middleware that normalizes incoming query param names

## Example

```javascript
import normalizeQueryParams from 'express-normalize-query-params-middleware';
import express from 'express';

const app = express();

app.use(normalizeQueryParams(['someParam', 'someOtherParam']));
app.get('/something', (req, res, next) => {
  // req.query.someParams and req.query.someOtherParams are now case insensitive.
});
```

## LICENSE
``````
The MIT License (MIT)

Copyright (c) 2016 Kogo Software LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
``````

[downloads-image]: http://img.shields.io/npm/dm/express-normalize-query-params-middleware.svg
[npm-url]: https://npmjs.org/package/express-normalize-query-params-middleware
[npm-image]: http://img.shields.io/npm/v/express-normalize-query-params-middleware.svg

[travis-url]: https://travis-ci.org/kogosoftwarellc/express-normalize-query-params-middleware
[travis-image]: http://img.shields.io/travis/kogosoftwarellc/express-normalize-query-params-middleware.svg

[coveralls-url]: https://coveralls.io/r/kogosoftwarellc/express-normalize-query-params-middleware
[coveralls-image]: http://img.shields.io/coveralls/kogosoftwarellc/express-normalize-query-params-middleware/master.svg

[gitter-url]: https://gitter.im/kogosoftwarellc/express-normalize-query-params-middleware
[gitter-image]: https://badges.gitter.im/kogosoftwarellc/express-normalize-query-params-middleware.png
