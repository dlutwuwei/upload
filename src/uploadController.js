var ssh2 = require('ssh2');
var Client = ssh2.Client;
var path = require('path');
var fs = require('fs');
var through2 = require('through2');
var { workspace, window } = require('vscode');
let { loadStatus, updateStatus } = require('./statusBar');

var utils = ssh2.utils;
let config = {
    remotePath: '',
    localPath: '',
    host: '',
    port: 22,
    username: '',
    password: ''
};

module.exports = class Upload {
    constructor(options) {
        this.options = Object.assign(config, options);
        this.core = null;
        this.options = null;
        this.sftp = null;
    }
    init(options) {
        let finalOptions = options || this.options;
        let self = this;
        let connect_options = {
            host: finalOptions.host,
            port: finalOptions.port,
            username: finalOptions.username
        };
        if(finalOptions.password) {
            connect_options.password = finalOptions.password;
        }
        console.log(require('fs').readFileSync(''+finalOptions.private_key))
        if(finalOptions.private_key) {
            try {
                connect_options.private_key = require('fs').readFileSync(finalOptions.private_key);
            } catch(e) {
                connect_options.private_key = '';                
            }
        }
        return this.core = new Promise(function (resolve, reject) {
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
                }).connect(connect_options);
                conn.on("error", function (err) {
                    reject(err);
                    console.log(err)
                    // ssh2 client or sftp error, we connect again;
                    self.sftp = null;
                    // make sure close conn;
                    conn.end();
                    resolve(null);
                });
            }
        });
    }
    readDir(filePath) {
        var self = this;
        return this.core.then(function (sftp) {
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
        return this.core.then(function (sftp) {
            return getAllFiles(path.join(workspace.rootPath || self.options.localPath, filePath)).reduce((_promise, _path) => {
                return _promise.then(function (value) {
                    let relPath = path.relative(workspace.rootPath, _path);
                    let dirPath = path.dirname(relPath);
                    console.log("upload file to remote done: ", value);
                    updateStatus(self.options.host, 'cloud-upload', 'uploaded', path.basename(value));
                    return new Promise(function (resolve, reject) {
                        mkdirp(path.join(self.options.remotePath, dirPath), sftp, function (err, made) {
                            let count = 0;
                            sftp && fs.createReadStream(_path, {
                                flags: 'r',
                                encoding: null,
                                mode: '0666',
                                autoClose: true
                            }).on('error', function (err) {
                                reject(err);
                            }).on('end', function () {
                                console.log('read file from local done,', _path);
                            }).on('data', function (chunk) {
                                count += chunk.length;
                                updateStatus(self.options.host, 'cloud-upload', 'uploading', count + 'B', path.basename(_path));
                            }).pipe(sftp.createWriteStream(path.join(self.options.remotePath, relPath), {
                                flags: 'w',
                                encoding: null,
                                mode: '0666',
                                autoClose: true
                            })).on('error', function (err) {
                                reject(err);
                            }).on('finish', function () {
                                resolve(_path);
                            }).on('close', function () {
                                resolve('connection closed');
                            });
                        });

                    });
                });
            }, Promise.resolve('start'));
        });
    }
    downloadFile(filePath) {
        var self = this;
        return this.core.then(function (sftp) {
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
                    reject(err.message);
                }).on('data', function (chunk) {
                    count += chunk.length;
                    updateStatus(self.options.host, 'cloud-download', 'downloading', count + 'B');
                }).pipe(fs.createWriteStream(path.join(workspace.rootPath || self.options.localPath, filePath))).on('error', function (err) {
                    reject(err.message);
                }).on('finish', function () {
                    resolve('download file to local done: ' + filePath);
                }).on('close', function () {
                    resolve('connection closed');
                });
            });
        });
    }
    reset() {
        this.core = null;
        this.sftp = null;
        this.options = null;
    }
}

function getAllFiles(root) {
    let stat = fs.statSync(root);
    let res = [];
    if (stat.isFile()) {
        res.push(root);
    } else if (stat.isDirectory()) {
        let files = fs.readdirSync(root);
        files.forEach(function (file) {
            var pathname = root + '/' + file
                , stat = fs.lstatSync(pathname);

            if (!stat.isDirectory()) {
                res.push(pathname);
            } else {
                res = res.concat(getAllFiles(pathname));
            }
        });
    }
    return res;
}

function mkdirp(_path, sftp, callback, made) {
    // sftp.stat(path.join(self.options.remotePath, dirPath), function (error, stat) {
    //     if (error) {
    //         reject(error);
    //     }
    //     if (stat.isDirectory()) {
    //         console.log('directory exist')
    //     } else {
    //         sftp && sftp.mkdir(path.join(self.options.remotePath, dirPath), function (err) {
    //             if (err) reject(err);
    //         });
    //     }
    // });
    _path = path.resolve(_path);
    let mode = undefined;
    if (mode === undefined) {
        mode = '0666';
    }
    (sftp || fs).mkdir(_path, mode, function (err) {
        if (!err) {
            made = made || _path;
            //no err or no non-exist parent dir
            return callback(null, made);
        }
        switch (err.code) {
            case 'ENOENT':
            case 2:
                mkdirp(path.dirname(_path), sftp, function (err, made) {
                    if (err) callback(err, made);
                    else mkdirp(_path, sftp, callback, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                (sftp || fs).stat(_path, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) callback(err, made)
                    else callback(null, made);
                });
                break;
        }
    });
}