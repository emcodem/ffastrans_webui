var _ = require('../node_modules/underscore');
var config = require('./config').config;

var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var groupName = 'CPS-CST-Admin';
var groupName = 'Students';

ad.getGroupMembershipForGroup(groupName, function(err, groups) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log('getGroupMembershipForGroup('+groupName+')='+JSON.stringify(groups));
  var result = '';
  _.each(groups, function(group) {
    result += '\'' + group.cn + '\', ';
  });
  console.log(result);
});
