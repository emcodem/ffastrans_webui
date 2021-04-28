var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var filter = 'cn=*Exchange*';

activeDirectory.findGroups(filter, function(err, groups) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('findGroups() failed with error: ' + err);
    return;
  }

  console.log('Groups matching filter[' + (groups || []).length + ']: ' + filter);
  _.each(groups || [], function(group) {
    console.log('  ' + group.cn);
  });
  assert((groups || []).length > 0, 'No groups match the specified filter ' + filter);
});
