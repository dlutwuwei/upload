let { window } = require('vscode');
let { StatusBarAlignment, StatusBarItem} = require('vscode')
var statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

module.exports.loadStatus = function() {
    statusBarItem.text = `$(sync)  Sync`;
    statusBarItem.show();
}

module.exports.updateStatus = function(icon="sync", text, loaded = 0, name="") {
    statusBarItem.text = `$(${icon})  ${text}  ${loaded} ${name}`;
}

