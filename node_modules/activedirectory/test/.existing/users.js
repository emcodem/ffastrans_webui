var _ = require('../../node_modules/underscore');
var config = require('./config').config;

var activeDirectory = new (require('../../index'))(config);
var ad = activeDirectory;

var groupName = 'AIS VPN Users';
var groupName = 'Students';

ad.getUsersForGroup(groupName, function(err, users) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  users = _.sortBy(users, function(user) { return((user.userPrincipalName||'').toLowerCase()); });
  console.log('getUsersForGroup('+groupName+')='+(users || []).length);
});
