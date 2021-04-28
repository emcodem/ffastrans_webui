var url = 'ldap://uwsp.edu';
//var url = 'ldaps://ldap.uwsp.edu';
var baseDN = 'dc=uwsp,dc=edu';
var username = 'cps-auth@uwsp.edu';
//  username ='CN=CPS Authenticator,OU=Special,OU=UWSP Users,DC=uwsp,DC=edu';
var password = 'M2E4ZTdkZDEzMDM5Njc2YTkxOWMxNTY4';

module.exports = {
  url: url,
  baseDN: baseDN,
  username: username,
  password: password,
  
  config: {
    url: url,
    baseDN: baseDN,
    username: username,
    password: password,
    logging: {
      name: 'ActiveDirectory',
      streams: [
        { level: 'debug',
          stream: process.stdout }
      ]
    }
  }
};
