var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var expectedUserCount = 3;
var groupName = 'CPS-CST List';
//var groupName = 'CPS-CST-Admin';
//var groupName = 'Students';

ad.getUsersForGroup(groupName, function(err, users) {
  if (err) {
    console.log('ERROR:' + err);
    assert.fail('getUsersForGroup() failed with error ' + err);
    return;
  }

  console.log('getUsersForGroup('+groupName+')=['+(users||[]).length+']'+
              _.map(users||[], function(user) { return(user.dn); }).join(';'));
  assert((users||[]).length, 'Expected to return more than one item.');
});

