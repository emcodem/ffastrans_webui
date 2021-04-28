var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username = 'gheeres';

activeDirectory.findUser(username, function(err, user) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('findUser() failed with error: ' + err);
    return;
  }

  console.log(user);
  assert(user, 'User ' + username + 'was not found');
});
