"use strict";

var isE6 = checkES6();

function checkES6() {
	try {
		new Function('a', 'class orig { constructor () { } }; class cls extends orig { constructor () { super() } }; var noop = () => { }; var foo = (f = noop, ...args) => [].push(...a); return foo;')([]);
		return true;
	} catch (err) {
		return false;
	}
}

if (isE6) {
	module.exports = require('./lib/safe.modern.js');
} else {
	module.exports = require('./lib/safe.js');
}