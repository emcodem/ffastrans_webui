var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var expectedUserCount = 3;
var groupName = 'CPS-CST List';
var opts = {
  attributes: [ 'cn', 'telephoneNumber', 'mobile' ]
};

ad.getUsersForGroup(opts, groupName, function(err, users) {
  if (err) {
    console.log('ERROR:' + err);
    assert.fail('getUsersForGroup() failed with error ' + err);
    return;
  }

  console.log('getUsersForGroup('+groupName+')=['+(users||[]).length+']'+JSON.stringify(users));
  assert.equal(expectedUserCount, (users || []).length, 
               'The number of users returned for group name ' + groupName + ' returned ' + (users||[]).length + ' users. ' +
               'Expected ' + expectedUserCount + ' users.');
});

