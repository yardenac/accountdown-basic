var crypto = require('crypto');
var shasum = require('shasum');

module.exports = Basic;

function Basic () { 
    if (!(this instanceof Basic)) return new Basic;
}

Basic.prototype.verify = function (db, prefix, creds, cb) {
    var err = checkCreds(creds);
    if (err) return cb && process.nextTick(function () { cb(err) });
    
    var key = prefix.concat(creds.username);
    db.get(key, function (err, value) {
        if (err && err.type === 'NotFoundError') {
            return cb(null, false);
        }
        if (err) return cb(err)
        
        var pw = Buffer(creds.password);
        var h = shasum(Buffer.concat([ salt, pw ]);
        cb(null, h === value.hash);
    });
};

Basic.prototype.create = function (id, creds) {
    var err = checkCreds(creds);
    if (err) return err;
    
    var salt = crypto.randomBytes(16);
    var pw = Buffer(creds.password);
    
    return [
        {
            key: [ creds.username ],
            value: {
                id: id,
                hash: shasum(Buffer.concat([ salt, pw ])),
                salt: salt.toString('hex')
            }
        }
    ];
};

function checkCreds (creds) {
    if (!creds || typeof creds !== 'object') {
        return new Error('supplied credentials are not an object');
    }
    if (!creds.username) {
        return new Error('username required');
    }
    var pw = creds.password;
    if (pw === undefined) {
        return new Error('password required');
    }
    if (typeof pw === 'string') pw = Buffer(pw);
    if (!Buffer.isBuffer(pw)) {
        return new Error('password must be a string or buffer');
    }
}
