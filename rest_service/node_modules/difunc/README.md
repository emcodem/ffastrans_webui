# js-difunc [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url]
> Dependency Injection for JavaScript functions.

`difunc(dependencies, func[, thisArg])`

Calls `func` with the dependencies defined in `dependencies`.  The parameter names
of `func` are the keys of `dependencies` used in the resolution.

## Installing

```
npm i difunc
```

## Example Usage

```js
import difunc from 'difunc';

const dependencies = {
  man: {
    age: 36,
    firstName: 'Clint',
    lastName: 'Eastwood'
  },
  year: 1964
};

console.log(difunc(dependencies, year => year)); // 1964

```


## LICENSE
``````
The MIT License (MIT)

Copyright (c) 2018 Kogo Software LLC

Permission is hereby granted, free of charge, to any person obtaining a   copy
of this software and associated documentation files (the "Software"), to  deal
in the Software without restriction, including without limitation the     rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL   THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING   FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
``````

[downloads-image]: http://img.shields.io/npm/dm/difunc.svg
[npm-url]: https://npmjs.org/package/difunc
[npm-image]: http://img.shields.io/npm/v/difunc.svg

[travis-url]: https://travis-ci.org/kogosoftwarellc/js-difunc
[travis-image]: http://img.shields.io/travis/kogosoftwarellc/js-difunc.svg

[coveralls-url]: https://coveralls.io/r/kogosoftwarellc/js-difunc
[coveralls-image]: http://img.shields.io/coveralls/kogosoftwarellc/js-difunc/master.svg
