import { assert, refute, stub, testCase, timeout } from 'bocha';
import redis from '@redis/client';
import provider from '../lib/provider.js';

let fakeClient;

export default testCase('provider', {
    setUp() {
        fakeClient = {
            async connect() {},
            get: stub().resolves(),
            setEx: stub().resolves(),
            del: stub().resolves()
        };
        stub(redis, 'createClient', () => fakeClient);
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