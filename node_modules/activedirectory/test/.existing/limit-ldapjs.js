var ldap = require('../node_modules/ldapjs');
var _ = require('../node_modules/underscore');
var config = require('./config').config;

var opts = {
  filter: 'cn=Smith*', 
  scope: 'sub',
  sizeLimit: 10
};

var client = ldap.createClient(config);
client.bind(config.username, config.password, function(err) {
  if (err) {
    console.log('ERROR BIND: '+ err);
    return;
  }

  var count = 0;
  client.search(config.baseDN, opts, function(err, res) {
    if (err) {
      console.log('ERROR SEARCH: '+ err);
      return;
    }

    res.on('searchEntry', function(entry) {
      console.log('entry: ' + entry.object.dn);
      count++;
    });
    res.on('searchReference', function(referral) {
      console.log('referral: ' + referral.uris.join());
    });
    res.on('error', function(err) {
      console.error('error: ' + err.message);
      client.unbind();
    });
    res.on('end', function(result) {
      console.log('filter: ' + opts.filter + ' => ' + count + ' / ' + (opts.sizeLimit || 'no limit'));
      client.unbind();
    });
  });
});
