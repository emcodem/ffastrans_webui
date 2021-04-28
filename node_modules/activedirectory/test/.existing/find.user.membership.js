var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var expectedGroupCount = 29;
var username = 'gheer565';

activeDirectory.findUser('gheer565', true, function(err, user) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('findUser() failed with error: ' + err);
    return;
  }

  //console.log(user);
  console.log(user.cn);
  assert(user, 'User ' + username + ' was not found.');
  assert.equal(expectedGroupCount, (user.groups || []).length, 
               'Expected group count (' + expectedGroupCount + ') for ' + username + ' was incorrect. ' +
               'Found ' + (user.groups || []).length + ' results.');
});
