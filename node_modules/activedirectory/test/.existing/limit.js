var _ = require('../node_modules/underscore');
var config = require('./config').config;
config.logging.streams[0].level = 'trace';
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var limit = 5;
var filter = '(&(cn=Smith*)(objectcategory=person))';
var opts = {
  sizeLimit: limit,
  filter: filter
};

ad.findUsers(opts, function(err, users) {
  if (err) {
    console.log('ERROR: ' + err + '. Results: ' + (users || []).length);
    return;
  }

  console.log('findUsers('+filter+')['+limit+']='+JSON.stringify(users));
});
