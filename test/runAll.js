var bocha = require('bocha');
bocha.setDefaultTimeout(3000);

bocha.runOnce(__dirname, {
    fileSuffix: '.tests.js'
});