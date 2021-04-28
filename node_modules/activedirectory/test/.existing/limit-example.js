var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var limit = 20;
var opts = {
  filter: '(&(cn=Smith*)(objectcategory=person))',
  attributes: [ 'dn' ]
};
ad.findUsers(opts, function(err, users) {
  if (err) throw(err);

  var count = (users || []).length;
  console.log('Query "' + opts.filter + '" returned ' + count + ' results. Getting results for first ' + limit + ' items.');

  var filter = '(|' + _.reduce(users.slice(0, limit), function(memo, user, index) {
    // Currently a bug in ldapjs that isn't properly escaping DNs with ',' in the name.
    return(memo + '(distinguishedName=' + user.dn.replace('\\,', '\\\\,') + ')');
  }, '') + ')';
  console.log('Generated dynamic filter for user details: ' + filter);
  ad.findUsers({ filter: filter, includeMembership: true }, function(err, users) {
    if (err) throw(err);

    console.log((users || []).length + '/' + count + ' users. Users: ' + JSON.stringify(users));
  });
});
