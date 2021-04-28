var _ = require('../node_modules/underscore');
var config = require('./config').config;
config = _.defaults({ attributes: {
  group: [ 'objectCategory', 'groupType', 'distinguishedName', 'cn', 'objectSid' ]
}}, config);
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username = 'gheeres';
ad.findUser(username, true, function(err, user) {
  if (err) {
    console.log('Error: ' + err);
  }
  console.log(user);
});

