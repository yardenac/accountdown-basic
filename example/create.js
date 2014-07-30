var accountdown = require('accountdown');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('../') }
});

var user = process.argv[2];
var pass = process.argv[3];
var bio = process.argv[4];

var opts = {
    login: { basic: { username: user, password: pass } },
    value: { bio: bio }
};
users.create(user, opts, function (err) {
    if (err) console.error(err);
});
