const mergician = require('mergician');

const obj1 = { a: [1, 1], b: { c: 1, d: 1 } };
const clonedObj = mergician({}, obj1);