let { window } = require('vscode');
let { StatusBarAlignment, StatusBarItem} = require('vscode')
var statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

module.exports.loadStatus = function() {
    statusBarItem.text = `$(sync)  Sync`;
    statusBarItem.show();
}

module.exports.updateStatus = function(host="", icon="sync", text, loaded = 0, name="") {
    statusBarItem.text = `server: ${host}  $(${icon})  ${text}  ${loaded} ${name}`;
}

