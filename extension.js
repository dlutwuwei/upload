// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var Client = require('ssh2').Client;
var through2 = require('through2');
var fs = require('fs');
var Upload = require('./src/uploadController');
var path = require('path');

let {workspace, window, extensions, TextDocument} = require('vscode');
let { loadStatus, updateStatus } = require('./src/statusBar');

var extRoot = extensions.getExtension('wuwei.upload').extensionPath;
var Uri = vscode.Uri;

var controller = new Upload();
var config = null;
var configPath = path.join(workspace.rootPath || extRoot, '\.vscode-upload.json');

function check() {
    config = JSON.parse(fs.readFileSync(configPath));
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
    var upload = vscode.commands.registerCommand('upload.upload', function () {
        sftpUpload();
    });

    var download = vscode.commands.registerCommand('upload.download', function () {
        sftpDownload();
    });

    var readdir = vscode.commands.registerCommand('upload.readdir', function () {
        sftpReadDir();
    });

    vscode.workspace.onDidSaveTextDocument(function (event) {
        sftpUpload();
    });

    vscode.workspace.onDidCloseTextDocument(function (event) {
        sftpUpload();
    });

    vscode.window.onDidChangeActiveTextEditor(function (event) {
        //console.log('hello')
    });

    var uploadEditor = vscode.commands.registerTextEditorCommand('editor.upload', function (editor) {
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
