var assert = require('assert');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var expectedGroupCount = 92;
var username = 'gheeres';
var opts = {
  attributes: [ 'cn', 'createTimeStamp', 'memberOf' ]
};

ad.getGroupMembershipForUser (opts, username, function(err, groups) {
  if (err) {
    console.log('ERROR:' + err);
    assert.fail('ad.getGroupMembershipForUser() failed with error ' + err);
    return;
  }

  assert.equal(expectedGroupCount, (groups||[]).length, 
               'getGroupMembershipForUser was expected to return ' + expectedGroupCount + ' items.' +
               (groups||[]).length + ' items returned.');
  console.log('getGroupMembershipForUser ('+username+')=['+(groups||[]).length+']'+ JSON.stringify(_.map(groups, function(group) {
    return({
      cn: group.cn,
      attributes: _.keys(group)
    });
  })));
});

