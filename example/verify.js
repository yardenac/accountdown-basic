var accountdown = require('accountdown');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('../') }
});

var creds = {
    username: process.argv[2],
    password: process.argv[3]
};
users.verify('basic', creds, function (err, ok) {
    if (err) console.error(err)
    else console.log('verified:', ok)
});
