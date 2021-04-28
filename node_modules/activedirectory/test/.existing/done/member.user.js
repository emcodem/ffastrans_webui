var _ = require('../node_modules/underscore');
var config = require('./config').config;

var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username = 'gheeres';
//var username = 'gheer565';
var opts = {
  includeMembership: [ 'user' ]
};

ad.getGroupMembershipForUser(opts, username, function(err, groups) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log('getGroupMembershipForUser('+username+')='+(groups || []).length);
  var result = '';
  _.each(groups, function(group,index) {
    console.log('  ['+index+']='+group.cn);
    result += '\''+group.cn + '\', ';
  });
  console.log(result);
});
