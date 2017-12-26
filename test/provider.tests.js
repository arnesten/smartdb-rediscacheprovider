let bocha = require('bocha');
let sinon = bocha.sinon;
let testCase = bocha.testCase;
let assert = bocha.assert;
let refute = bocha.refute;
let timeout = bocha.timeoutPromise;
let redis = require('redis');

module.exports = testCase('provider', {
    tearDown() {
        redis.createClient.restore && redis.createClient.restore();
    },
    'can get a value that was set': async function () {
        let provider = createProvider({});
        let cache = provider.create('', { cacheMaxAge: 3000 });
        await cache.set('F1', { name: 'Shark' });

        let doc = await cache.get('F1');

        assert.equals(doc, { name: 'Shark' });
    },
    'cache should be invalidated after maxAge has passed': async function () {
        let provider = createProvider({
            ageThreshold: 100
        });
        let cache = provider.create('', { cacheMaxAge: 1000 });
        await cache.set('F1', { name: 'Shark' });
        await timeout(2000);

        let doc = await cache.get('F1');

        refute(doc);
    },
    'can delete entry': async function () {
        let provider = createProvider({});
        let cache = provider.create('', { cacheMaxAge: 3000 });
        await cache.set('F1', { name: 'Shark' });

        await cache.del('F1');

        let doc = await cache.get('F1');
        refute(doc);
    },
    'should use in-memory cache for recently set value': async function () {
        let fakeClient = {
            get: sinon.stub().callsArg(1),
            setex: sinon.stub().callsArg(3)
        };
        sinon.stub(redis, 'createClient', () => fakeClient);

        let provider = createProvider({});
        let cache = provider.create('', { cacheMaxAge: 2000 });

        await cache.set('F1', { name: 'Shark' });

        let doc = await cache.get('F1');

        assert.equals(doc, { name: 'Shark' });
        refute.called(fakeClient.get);
    }
});

function createProvider(options) {
    return require('../lib/provider.js')(options);
}