var crypto = require('crypto');
var shasum = require('shasum');
var defined = require('defined');

module.exports = Basic;

function Basic (db, prefix, opts) {
    if (!(this instanceof Basic)) return new Basic(db, prefix, opts);
    this.db = db;
    this.prefix = prefix;
    if (!opts) opts = {};
    this._key = defined(opts.key, 'username');
}

Basic.prototype.verify = function (creds, cb) {
    var err = this._checkCreds(creds);

    if (err) return cb && process.nextTick(function () { cb(err) });
    
    var key = this.prefix.concat(creds[this._key]);
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
    var err = this._checkCreds(creds);
    if (err) return err;
    
    var salt = crypto.randomBytes(16);
    var pw = Buffer(creds.password);
    
    return [
        {
            key: this.prefix.concat(creds[this._key]),
            value: {
                id: id,
                hash: shasum(Buffer.concat([ salt, pw ])),
                salt: salt.toString('hex')
            }
        }
    ];
};

Basic.prototype._checkCreds = function (creds) {
    if (!creds || typeof creds !== 'object') {
        return new Error('supplied credentials are not an object');
    }
    if (!creds[this._key]) {
        return new Error(this._key.concat(' required'));
    }
    var pw = creds.password;
    if (pw === undefined) {
        return new Error('password required');
    }
    if (typeof pw === 'string') pw = Buffer(pw);
    if (!Buffer.isBuffer(pw)) {
        return new Error('password must be a string or buffer');
    }
};

function error (code, msg) {
    var err = new Error(msg);
    err.code = err.type = code;
    return err;
}
