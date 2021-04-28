var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var objectGUID = '4e1a5921-46d3-4180-9804-49e413f7dc83';
var objectGUIDBuffer = new Buffer([ 0x21, 0x59, 0x1a, 0x4e, 0xd3, 0x46, 0x80, 0x41, 0x98, 0x04, 0x49, 0xe4, 0x13, 0xf7, 0xdc, 0x83 ])

var filters = activeDirectory.filters;

var opts = {
  filter : new filters.EqualityFilter({
    attribute: 'objectGUID',
    value: objectGUIDBuffer 
  })
};
activeDirectory.find(opts, function(err, results) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('find() failed with error: ' + err);
    return;
  }

  if (results != null) {
    console.log(results);
  }
});
