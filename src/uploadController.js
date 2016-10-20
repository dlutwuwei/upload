var Client = require('ssh2').Client;
var path = require('path');
var fs = require('fs');
var through2 = require('through2');
var workspace = require('vscode').workspace;

let config = {
    remotePath: '',
    localPath: '',
    host: '',
    port: 22,
    password: ''
};

module.exports = class Upload {
    constructor(options) {
        this.options = Object.assign(config, options);
        this.init();
    }
    init() {
        var self = this;
        this.core = new Promise(function (resolve, reject) {
            if(self.sftp) {
                console.log('connection is alive');
                resolve(self.sftp);
            } else {
                console.log('connection start');
                var conn = new Client();
                var options = self.options;
                conn.on('ready', function (err) {
                    if(err) reject(err);
                    console.log('connection is ready!');
                    conn.sftp(function(err, sftp) {
                        self.sfp = sftp;
                        resolve(sftp);
                    });
                }).connect({
                    host: options.host,
                    port: options.port,
                    username: options.username,
                    password: options.password
                });
            }
        });
    }
    readDir(filePath) {
        var self = this;
        return this.core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                sftp.readdir(path.join(self.options.remotePath, filePath), function (err, list) {
                    if (err) throw err;
                    resolve(list);
                    conn.end();
                });
            });
        }).catch(function (err) {
            self.sftp = null;
            console.log(err);
        });
    }
    uploadFile(filePath) {
        var self = this;
        return this.core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                fs.createReadStream(path.join(workspace.rootPath || self.options.localPath, filePath), {
                    flags: 'r',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                }).on('error', function (err) {
                    reject(err);
                }).pipe(through2(function (chunk, env, next) {
                    next(null, chunk);
                })).pipe(sftp.createWriteStream(path.join(self.options.remotePath, filePath))).on('error', function (err) {
                    reject(err);
                }).on('finish', function () {
                    resolve("upload file success: " + filePath);
                }).on('close', function() {
                    resolve('connection closed');
                    self.sfp = null;
                });
            });
        }).catch(function (err) {
            self.sftp = null;
            console.log(err);
        });;
    }
    downloadFile(filePath) {
        var self = this;
        return this.core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                sftp.createReadStream(path.join(self.options.remotePath, filePath), {
                    flags: 'r',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                }).on('error', function (err) {
                    reject(err);
                }).pipe(through2(function (chunk, env, next) {
                    next(null, chunk);
                })).pipe(fs.createWriteStream(path.join(workspace.rootPath || self.options.localPath, filePath))).on('error', function (err) {
                    reject(err);
                }).on('finish', function () {
                    resolve('download file success: ' + filePath);
                }).on('close', function() {
                    resolve('connection closed');
                    self.sfp = null;
                });
                // sftp.fastGet(path.join(self.options.remotePath, filePath), path.join(self.options.localPath, filePath), function (err) {
                //     reject(err)
                // });
            });
        }).catch(function (err) {
            self.sftp = null;
            console.log(err);
        });;
    }
}
