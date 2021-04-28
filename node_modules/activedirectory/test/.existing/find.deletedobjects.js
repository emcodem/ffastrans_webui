var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

ad.findDeletedObjects(function(err, results) {
  if (err) throw(err);

  console.log(results);
  assert((results || []).length > 0, 'No deleted items found');
});
