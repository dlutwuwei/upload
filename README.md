# upload

upload or download files from remote server via ssh2 and sftp

## usage

![usage](./upload.gif)

### setting
First, set config in `.vscode-upload.json` in your workspace

### how to use

right click to select upload to server;

`cmd+shift+p` input upload command to upload file to remote server;

`cmd+shift+p` input download command to download file to local;

`cmd+shift+p` input readdir command to see dirtory;

## Features

just simple config some setting, upload code to server, get rid of vim or emacs;

> do not support uploading dirtory yet.
> we should use it in a workspace ( after opening dirtory).

## Requirements

node: v6.6.0

npm: 3.10.3

only support sftp via ssh2

## Settings

* host: the address of remote server;
* port: the port of ssh2 server, default 22;
* username: your user name
* password: your password
* remotePath: the absolute path of your project in remote server;
* localPath: the absolute path or relative path of your project in local;

For example:

```
{
    "host": "10.100.6.175",
    "port": 22,
    "username": "wuwei",
    "password": "WuWei.****",
    "remotePath": "/data04/wuwei/repos/i18n_web",
    "localPath": "/User/wuwei/code/i18n_web"
}
```

## Known Issues

## Release Notes

* 0.0.2 change vscode verion.
* 0.0.6 reuse connection, much more fast.
* 0.0.7 add filesize uploaded show, connect again when config file changed.
* 0.0.8 change readme and some code fix.
* 0.0.9 create config file auto in workspace.
* 0.1.0 fix some status show.
* 0.1.1 add upload dir to remote, add right click menu in explorer

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

