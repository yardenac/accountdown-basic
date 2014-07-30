var level = require('level');
var db = level('/tmp/users.db', {
    keyEncoding: require('bytewise'),
    valueEncoding: 'json'
});
var basic = require('../');
var batch = require('../');

var b = basic(opts, [ 'login', 'basic' ]);

var user = process.argv[2];
var pass = process.argv[3];

var creds = { username: user, password: pass };
batch(db, b.create(user, creds));
