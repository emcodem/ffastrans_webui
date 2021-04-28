var _ = require('../../node_modules/underscore');
var config = {
  url: 'ldaps://uwsp.edu:3269',
  baseDN: 'dc=uwsp,dc=edu',
  username: 'cps-auth@uwsp.edu',
  password: 'M2E4ZTdkZDEzMDM5Njc2YTkxOWMxNTY4'
};
var activeDirectory = new (require('../../index'))(config);
var ad = activeDirectory;

ad.findUser('gheer565', function(err, user) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(user);
});

