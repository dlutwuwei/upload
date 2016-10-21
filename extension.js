// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const Client = require('ssh2').Client;
const through2 = require('through2');
const fs = require('fs');
const path = require('path');
const Stream = require('stream').Readable
let { commands, workspace, window, extensions, TextDocument, Uri} = require('vscode');
let { loadStatus, updateStatus } = require('./src/statusBar');
const Upload = require('./src/uploadController');

let extRoot = extensions.getExtension('wuwei.upload').extensionPath;
let controller = new Upload();
let config = null;
let configPath = path.join(workspace.rootPath || extRoot, '\.vscode-upload.json');

function check() {
    let isFile = true
    try {
        isFile = fs.statSync(configPath).isFile();
        config = JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
        fs.createReadStream(path.join(extRoot, '.vscode-upload.json'), {
            autoClose: true
        }).pipe(fs.createWriteStream(configPath, {
            flags: 'w',
            encoding: null,
            mode: '0666',
            autoClose: true
        }));
    }
    // controller must init before use
    controller.init(config);
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

    workspace.onDidSaveTextDocument(function (event) {
        sftpUpload();
    });

    workspace.onDidCloseTextDocument(function (event) {
        sftpUpload();
    });

    window.onDidChangeActiveTextEditor(function (event) {
        //console.log('hello')
    });

    var uploadEditor = commands.registerTextEditorCommand('editor.upload', function (editor) {
        sftpUpload(editor.document);
    });
    //let configuration = workspace.getConfiguration('wuwei.upload');

    context.subscriptions.push(upload, download, readdir, uploadEditor);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;




function getFilePath(doc) {
    var focusDoc = doc || window.activeTextEditor.document;
    if (focusDoc.uri.path.indexOf(path.resolve(workspace.rootPath || '', config.localPath)) !== 0) {
        window.showInformationMessage('file is not in localPath');
        return null;
    }
    var filePath = '';
    if (!workspace.rootPath) {
        filePath = path.resolve(config.localPath, focusDoc.fileName);
    } else {
        var sliceStart = focusDoc.uri.path.indexOf(workspace.rootPath) + workspace.rootPath.length + 1;
        var sliceEnd = focusDoc.uri.path.length;
        console.log('file path:', focusDoc.uri.path.slice(sliceStart, sliceEnd));
        filePath = focusDoc.uri.path.slice(sliceStart, sliceEnd);
    }
    return filePath;
}

function sftpUpload(doc) {
    check();
    var filePath = getFilePath(doc);
    updateStatus('cloud-upload', 'uploading');
    filePath && controller.uploadFile(filePath).then(function (data) {
        console.log(data);
        updateStatus('cloud-upload', 'uploaded')
    }).catch(function (err) {
        console.log(err);
        window.showInformationMessage(err.messagae + ', upload file failed');
    });
}

function sftpDownload(doc) {
    check();
    var filePath = getFilePath(doc);
    updateStatus('cloud-download', 'downloading');
    filePath && controller.downloadFile(filePath).then(function (data) {
        console.log(data);
        updateStatus('cloud-download', 'downloaded');
    }).catch(function (err) {
        console.log(err);
        window.showInformationMessage(err.messagae + ', downloa file failed');
    });
}

function sftpReadDir() {
    check();
    controller.readDir('/').then(function (data) {
        var text = data.map(function (item) {
            return item.longname
        }).join('\n');
        console.log("list remote directory done:\n", text);
        // console.log(path.join(extRoot,'.vscode-upload.json'));
        // workspace.openTextDocument(path.join(extRoot,'.vscode-upload.json'));
    }).catch(function (err) {
        console.log(err);
    });
}
