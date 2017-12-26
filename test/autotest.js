let path = require('path');
let bocha = require('bocha');
bocha.setDefaultTimeout(3000);

bocha.watch({
    srcPath: path.join(__dirname, '..'),
    testPath: __dirname,
    fileSuffix: '.tests.js'
});