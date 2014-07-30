var crypto = require('crypto');
var shasum = require('shasum');

module.exports = Basic;

function Basic (db, prefix) { 
    if (!(this instanceof Basic)) return new Basic(db, prefix);
    this.db = db;
    this.prefix = prefix;
}

Basic.prototype.verify = function (creds, cb) {
    var err = checkCreds(creds);
    if (err) return cb && process.nextTick(function () { cb(err) });
    
    var key = this.prefix.concat(creds.username);
    this.db.get(key, function (err, row) {
        if (err && err.type === 'NotFoundError') {
            return cb(null, false);
        }
        if (err) return cb(err)
        if (!row.salt) return cb('NOSALT', 'integrity error: no salt found');
        if (!row.hash) return cb('NOHASH', 'integrity error: no hash found');
        
        var pw = Buffer(creds.password);
        var salt = Buffer(row.salt, 'hex');
        
        var h = shasum(Buffer.concat([ salt, pw ]));
        cb(null, h === row.hash, row.id);
    });
};

Basic.prototype.create = function (id, creds) {
    var err = checkCreds(creds);
    if (err) return err;
    
    var salt = crypto.randomBytes(16);
    var pw = Buffer(creds.password);
    
    return [
        {
            key: this.prefix.concat(creds.username),
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

function error (code, msg) {
    var err = new Error(msg);
    err.code = err.type = code;
    return err;
}
