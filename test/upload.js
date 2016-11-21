var Client = require('ssh2').Client;

function Upload(options) {
    this.conn = new Client();
    console.log('start ssh2 connect');
    return new Promise(function (resolve, reject) {
        conn.on('ready', function () {
            conn.sftp(function (err, sftp) {
                if (err) {
                    console.log(err)
                    throw err;
                }
                relove(sftp);
                sftp.readdir('/data01/wuwei/repos', function (err, list) {
                    if (err) throw err;
                    var fileList = list.map(function (item) {
                        return item.filename;
                    });
                    conn.end();
                });

            });
        }).connect({
            host: options.host,
            port: options.port,
            username: options.username,
            password: options.password
        });
    });
}