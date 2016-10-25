var log = "";

function doWork() {
    log += "W";
    return Promise.resolve('test');
}

function doError() {
    log += "E";
    throw new Error("oops!");
}

function errorHandler(error) {
    log += "H";
}

function workHandler(value) {
    console.log(value)
    log+='O';
    return new Promise(function(resolve, reject){
        resolve(value);
    });
}

doWork()
    .then(workHandler)
    //.then(doError)
    .then(workHandler) // this will be skipped
    .then(workHandler)
    //.then(doError)
    .catch(errorHandler)
    .then(workHandler, errorHandler)
    .then(verify);

function verify() {
    console.log(log)
}