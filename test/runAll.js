import { setDefaultTimeout, runOnce } from 'bocha';
import { URL } from 'url';

let __dirname = new URL('.', import.meta.url).pathname;

setDefaultTimeout(3000);

runOnce(__dirname, {
    fileSuffix: '.tests.js'
});