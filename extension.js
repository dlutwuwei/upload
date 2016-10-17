// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var Client = require('ssh2').Client;
var through2 = require('through2');
var fs = require('fs');
var Upload = require('./src/uploadController');
var path = require('path');

var workspace = vscode.workspace;
var window = vscode.window;
var extensions = vscode.extensions;
var TextDocument = vscode.TextDocument;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "upload" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.upload', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        console.log('rootPath', workspace.rootPath)
        sftpUpload();
    });

    vscode.workspace.onDidSaveTextDocument(function (event) {
        console.log('hello')
    });

    vscode.workspace.onDidCloseTextDocument(function (event) {
        console.log('hello')
    });

    vscode.window.onDidChangeActiveTextEditor(function (event) {
        console.log('hello')
    });
    //let configuration = workspace.getConfiguration('wuwei.upload');

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;


function sftpUpload() {
    try {
        var configPath = path.join(workspace.rootPath||extensions.getExtension('wuwei.upload').extensionPath, '\.vscode-upload.json');
        var config = JSON.parse(fs.readFileSync(configPath));
    } catch(e) {
        console.log(e);
    }
    var upload = new Upload(config);
    // upload.readDir('/').then(function (data) {
    //     console.log(data.join(' '));
    // });
    var focusDoc = window.activeTextEditor.document;
    console.log(focusDoc.uri.fsPath)
    var filePath = path.resolve(config.localPath, focusDoc.uri.fsPath);
    console.log(filePath)
    upload.downloadFile(filePath).then(function (data) {
        console.log(data);
    }).catch(function(err) {
        console.log(err);
        vscode.window.showInformationMessage('Hello World!');
    });
    // upload.uploadFile('test.js').then(function(data) {
    //     console.log(data);
    // });
}