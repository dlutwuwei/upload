let { window } = require('vscode');
let { StatusBarAlignment, StatusBarItem} = require('vscode')
var statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

module.exports.loadStatus = function() {
    statusBarItem.text = `$(sync)  Sync`;
    statusBarItem.show();
}

module.exports.updateStatus = function(icon, text, loaded = 0, size="") {
    statusBarItem.text = `$(${icon})  ${text}  ${loaded}B`;
}

