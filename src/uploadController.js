var Client = require('ssh2').Client;
var path = require('path');
var fs = require('fs');
var through2 = require('through2');
var { workspace, window } = require('vscode');
let { loadStatus, updateStatus } = require('./statusBar');
let config = {
    remotePath: '',
    localPath: '',
    host: '',
    port: 22,
    password: ''
};

let core = null;

module.exports = class Upload {
    constructor(options) {
        this.options = Object.assign(config, options);
    }
    init(options) {
        let finalOptions = options || this.options;
        let self = this;
        return core = new Promise(function (resolve, reject) {
            if (self.sftp && JSON.stringify(self.options) === JSON.stringify(finalOptions)) {
                // reuse sftp not conn when options is not change
                console.log('connection is alive');
                resolve(self.sftp);
            } else {
                self.options = finalOptions;
                console.log('connection start');
                var conn = new Client();
                var options = self.options;
                conn.on('ready', function (err) {
                    if (err) reject(err);
                    console.log('connection is ready!');
                    conn.sftp(function (err, sftp) {
                        self.sftp = sftp;
                        resolve(sftp);
                    });
                }).connect({
                    host: finalOptions.host,
                    port: finalOptions.port,
                    username: finalOptions.username,
                    password: finalOptions.password
                });
                conn.on("error", function (err) {
                    reject(err.message);
                    // ssh2 client or sftp error, we connect again;
                    self.sftp = null;
                    // make sure close conn;
                    conn.end();
                    resolve(null);
                });
            }
        }).catch(function (err) {
            self.clear();
            console.log(err);
            window.showErrorMessage(err);
        });
    }
    readDir(filePath) {
        var self = this;
        return core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                sftp && sftp.readdir(path.join(self.options.remotePath, filePath), function (err, list) {
                    if (err) throw err;
                    resolve(list);
                });
            });
        }).catch(function (err) {
            self.sftp = null;
            console.log(err);
        });
    }
    uploadFile(filePath) {
        var self = this;
        return core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                let count = 0;
                sftp && fs.createReadStream(path.join(workspace.rootPath || self.options.localPath, filePath), {
                    flags: 'r',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                }).on('error', function (err) {
                    reject(err);
                }).on('end', function () {
                    console.log('read file from local done,', filePath);
                }).on('data', function(chunk) {
                    updateStatus('cloud-upload', 'uploading', count += chunk.length);
                }).pipe(sftp.createWriteStream(path.join(self.options.remotePath, filePath), {
                    flags: 'w',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                })).on('error', function (err) {
                    reject(err);
                }).on('finish', function () {
                    resolve("upload file to remote done: " + filePath);
                }).on('close', function () {
                    resolve('connection closed');
                });
            });
        }).catch(function (err) {
            self.sftp = null;
            console.log(err);
        });;
    }
    downloadFile(filePath) {
        var self = this;
        return core.then(function (sftp) {
            return new Promise(function (resolve, reject) {
                let count = 0;
                sftp && sftp.createReadStream(path.join(self.options.remotePath, filePath), {
                    flags: 'r',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                }).on('end', function () {
                    console.log('read file from remote done,', filePath);
                }).on('error', function (err) {
                    reject(err);
                }).on('data', function(chunk) {
                    updateStatus('cloud-download', 'downloading', count += chunk.length);
                }).pipe(fs.createWriteStream(path.join(workspace.rootPath || self.options.localPath, filePath))).on('error', function (err) {
                    reject(err);
                }).on('finish', function () {
                    resolve('download file to local done: ' + filePath);
                }).on('close', function () {
                    resolve('connection closed');
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
    clear() {
        core = null;
    }
}
