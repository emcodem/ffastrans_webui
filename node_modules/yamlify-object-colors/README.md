# yamlify-object-colors

Colors preset for [yamlify-object](https://github.com/eugeny-dementev/yamlify-object) package

## Install

```
npm install yamlify-object-colors
```

## Usage

``` js
const yamlifyObject = require('yamlify-object');
const yamlifyColors = require('yamlify-object-colors');

const obj = {
  object: {
    number: 1,
    error: new Error('message'),
    date: new Date(0),
    symbol: Symbol('SYMBOL'),
    string: 'string value',
    boolean: true,
    null: null,
    undefined: undefined,
  }
}

const formattedString = yamlifyObject(obj, {
  colors: yamlifyColors,
});

console.log(formattedString);
```

## Example

![Object example](/terminal.png?raw=true "Object formatting example")
