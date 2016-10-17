var Client = require('ssh2').Client;
var path = require('path');
var fs = require('fs');
var through2 = require('through2');

let config = {
    remotePath: '',
    localPath: '',
    host: '',
    port: 22,
    password: ''
}

module.exports = class Upload {
    constructor(options) {
        this.options = Object.assign(config, options);
    }
    init() {
        console.log('start ssh2 connect');
        var self = this;
        return new Promise(function (resolve, reject) {
            var conn = new Client();
            var options = self.options;
            conn.on('ready', function () {
                console.log('Client :: ready');
                resolve(conn);
            }).connect({
                host: options.host,
                port: options.port,
                username: options.username,
                password: options.password
            });
        });
    }
    readDir(filePath) {
        var self = this;
        return this.init().then(function (conn) {
            return new Promise(function (resolve, reject) {
                conn.sftp(function (err, sftp) {
                    if (err) {
                        throw err;
                    }
                    sftp.readdir(path.join(self.options.remotePath, filePath), function (err, list) {
                        if (err) throw err;
                        var fileList = list.map(function (item) {
                            return item.filename;
                        });
                        resolve(fileList);
                        conn.end();
                    });
                });
            });
        }).catch(function (err) {
            console.log(err);
        });
    }
    uploadFile(filePath) {
        var self = this;
        return this.init().then(function (conn) {
            return new Promise(function (resolve, reject) {
                conn.sftp(function (err, sftp) {
                    fs.createReadStream(path.join(self.options.localPath, filePath), {
                        flags: 'r',
                        encoding: null,
                        mode: '0666',
                        autoClose: true
                    }).pipe(through2(function (chunk, env, next) {
                        resolve('' + chunk);
                        next(null, chunk);
                    })).pipe(sftp.createWriteStream(path.join(self.options.remotePath, filePath)));
                });
            });
        }).catch(function (err) {
            console.log(err)
        });
    }
    downloadFile(filePath) {
        var self = this;
        return this.init().then(function (conn) {
            return new Promise(function (resolve, reject) {
                conn.sftp(function (err, sftp) {
                    if (err) {
                        reject(err);
                    }
                    sftp.createReadStream(path.join(self.options.remotePath, filePath), {
                        flags: 'r',
                        encoding: null,
                        mode: '0666',
                        autoClose: true
                    }).on('error', function (err) {
                        reject(err);
                    }).pipe(through2(function (chunk, env, next) {
                        resolve('' + chunk);
                        next(null, chunk);
                    })).pipe(fs.createWriteStream(path.join(self.options.localPath, filePath))).on('error', function (err) {
                        reject(err);
                    });
                    // sftp.fastGet(path.join(self.options.remotePath, filePath), path.join(self.options.localPath, filePath), function (err) {
                    //     reject(err)
                    // });
                });
            });
        });
    }
}
