var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var groupName = 'CPS-CST List';

activeDirectory.findGroup(groupName, function(err, group) {
  if (err) {
    console.log('ERROR: ' + err);
    assert.fail('findGroup() failed with error: ' + err);
    return;
  }

  console.log(group);
  assert(group, 'The requested group ' + groupName + ' was not found.');
});
