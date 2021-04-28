var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var filter = '(cn=*CPS*)';

activeDirectory.find(filter, function(err, result) {
  if ((err) || (! result)) {
    console.log('ERROR: ' + err);
    assert.fail('find() failed with error: ' + err);
    return;
  }

  console.log('Groups matching filter['+(result.groups || []).length +']:' + filter);
  _.each(result.groups || [], function(group) {
    console.log('  ' + group.cn);
  });
  assert(result.groups, 'No groups found for filter ' + filter);

  console.log('Users matching filter['+(result.users || []).length +']: ' + filter);
  _.each(result.users || [], function(user) {
    console.log('  ' + user.cn);
  });
  assert(result.groups, 'No users found for filter ' + filter);

//  console.log('Other');
//  _.each(result.other, function(other) {
//    console.log('  ' + other.cn);
//  });
});
