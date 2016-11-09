// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const Client = require('ssh2').Client;
const through2 = require('through2');
const fs = require('fs');
const path = require('path');
const Stream = require('stream').Readable
const vscode = require('vscode');
let { commands, workspace, window, extensions, TextDocument, Uri} = vscode;
let { loadStatus, updateStatus } = require('./src/statusBar');
const Upload = require('./src/uploadController');

let extRoot = extensions.getExtension('wuwei.upload').extensionPath;
let controller = new Upload();
let config = null;
let configPath = path.join(workspace.rootPath || extRoot, '\.vscode-upload.json');
let current = 0;
let currentConfig = null;

function initUpload(config) {
    controller.init(config);
}

function initConfig() {
    try {
        config = JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
        console.log(e)
        fs.createReadStream(path.join(extRoot, '.vscode-upload.json'), {
            autoClose: true
        }).pipe(fs.createWriteStream(configPath, {
            flags: 'w',
            encoding: null,
            mode: '0666',
            autoClose: true
        }));
    }
    if (Array.isArray(config)) {
        if (current >= config.length) {
            current = 0;
        }
        currentConfig = config[current];
    } else {
        currentConfig = config;
    }
}
function check() {
    initConfig();
    initUpload(currentConfig);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "upload" is now active!');
    loadStatus();
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var upload = commands.registerCommand('upload.upload', function () {
        sftpUpload();
    });

    var download = commands.registerCommand('upload.download', function () {
        sftpDownload();
    });

    var readdir = commands.registerCommand('upload.readdir', function () {
        sftpReadDir();
    });

    var nextServer = commands.registerCommand('upload.nextServer', function () {
        nextSftpServer();
    });

    workspace.onDidSaveTextDocument(function (event) {
        initConfig();
        if(!currentConfig.host || !currentConfig.username || currentConfig.disable) {
            updateStatus(currentConfig.host, 'sync', 'sync', 'disabled');
        } else {
            sftpUpload();
        }
    });

    var uploadEditor = commands.registerTextEditorCommand('editor.upload', function (acitveEditor, edit, uri) {
        sftpUpload(uri);
    });
    //let configuration = workspace.getConfiguration('wuwei.upload');

    context.subscriptions.push(upload, download, readdir, uploadEditor, nextServer);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;


function nextSftpServer() {
    controller.reset();
    current ++;
    initConfig();
    updateStatus(currentConfig.host, 'sync', 'sync');
}

function getFilePath(uri) {
    uri = uri || window.activeTextEditor.document.uri;
    if (workspace.rootPath == null || uri.path.indexOf(workspace.rootPath) != 0) {
        window.showInformationMessage('file is not in localPath');
        return null;
    }
    var filePath = '';
    if (!workspace.rootPath) {
        filePath = path.resolve(config.localPath, focusDoc.fileName);
    } else {
        // var sliceStart = uri.path.indexOf(workspace.rootPath) + workspace.rootPath.length + 1;
        // var sliceEnd = uri.path.length;
        //console.log('file path:', uri.path.slice(sliceStart, sliceEnd));
        filePath = path.relative(workspace.rootPath, uri.path);
    }
    return filePath;
}

function sftpUpload(uri) {
    check();
    var filePath = getFilePath(uri);
    filePath && updateStatus(currentConfig.host, 'cloud-upload', 'uploading');
    filePath && controller.uploadFile(filePath).then(function (data) {
        console.log(data);
        updateStatus(currentConfig.host, 'cloud-upload', 'uploaded', 'all files');
    }).catch(function (err) {
        window.showInformationMessage(err.message + ', upload file failed');
        updateStatus(currentConfig.host, 'cloud-upload', 'failed');
    });
}

function sftpDownload(uri) {
    check();
    var filePath = getFilePath(uri);
    filePath && updateStatus('cloud-download', 'downloading');
    filePath && controller.downloadFile(filePath).then(function (data) {
        console.log(data);
        updateStatus('cloud-download', 'downloaded');
    }).catch(function (err) {
        console.log(err);
        window.showInformationMessage(err.messagae + ', download file failed');
    });
}

function sftpReadDir() {
    check();
    controller.readDir('/').then(function (data) {
        var text = data.map(function (item) {
            return item.longname
        }).join('\n');
        //console.log("list remote directory done:\n", text);
        let output = path.join(extRoot, 'output.txt');
        let uri = Uri.file(output);
        fs.writeFile(output, text, function (err) {
            if (err) {
                console.log(err);
            } else {
                commands.executeCommand('vscode.open', uri).catch(err => {
                    console.log(err);
                });
            }
        });

    }).catch(function (err) {
        console.log(err);
    });
}
