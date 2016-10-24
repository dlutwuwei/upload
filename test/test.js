'use strict'
var fs = require('fs');

function getAllFiles(root) {
    let stat = fs.lstatSync(root);
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

console.log(getAllFiles('/Users/wuwei/coding/mysite/mysite/urls.py'))