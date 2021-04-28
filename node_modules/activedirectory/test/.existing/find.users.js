var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var expectedUsers = 2;
var filter = '(cn=*Heeres*)';

activeDirectory.findUsers(filter, function(err, users) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('findUsers() failed with error: ' + err);
    return;
  }

  console.log('Users matching filter[' + (users || []).length + ']: ' + filter);
  _.each(users || [], function(user) {
    console.log('  ' + user.cn);
  });
  assert.equal(expectedUsers, (users || []).length,
               'findUsers() filter of ' + filter + ' returned ' + (users || []).length + ' results.' +
               'Expected ' + expectedUsers);
});
