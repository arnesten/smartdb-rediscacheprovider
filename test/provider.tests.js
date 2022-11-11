import { assert, refute, stub, testCase, timeout } from 'bocha/node.mjs';
import redis from 'redis';
import provider from '../lib/provider.js';

export default testCase('provider', {
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
            get: stub().callsArg(1),
            setex: stub().callsArg(3)
        };
        stub(redis, 'createClient', () => fakeClient);

        let provider = createProvider({});
        let cache = provider.create('', { cacheMaxAge: 2000 });

        await cache.set('F1', { name: 'Shark' });

        let doc = await cache.get('F1');

        assert.equals(doc, { name: 'Shark' });
        refute.called(fakeClient.get);
    }
});

function createProvider(options) {
    return provider(options);
}