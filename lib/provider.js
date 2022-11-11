import redis from 'redis';
import { inMemoryCacheProvider, nullCacheProvider } from 'smartdb-stdcacheproviders';

export default function (options = {}) {

    let ageThreshold = options.ageThreshold ?? 1000;
    let inMemoryCacheMaxAge = options.inMemoryCacheMaxAge ?? ageThreshold;
    let inMemoryCacheMaxSize = options.inMemoryCacheMaxSize ?? 1000;

    let nullCache = nullCacheProvider.create();
    let prefix = options.prefix || 'smartdb:';
    let redisClient = redis.createClient(options.port, options.hostname || '127.0.0.1');

    return {
        create
    };

    function create(entityType, entitySettings) {
        let maxAge = entitySettings.cacheMaxAge;
        if (!maxAge) return nullCache;
        if (maxAge <= ageThreshold) return inMemoryCacheProvider.create(entityType, entitySettings);

        let memoryCache = inMemoryCacheProvider.create(entityType, {
            cacheMaxAge: inMemoryCacheMaxAge,
            cacheMaxSize: inMemoryCacheMaxSize
        });
        let secondsExpire = Math.max(1, Math.round(maxAge / 1000));

        return {
            get,
            set,
            del,
            reset
        };

        async function get(id) {
            let doc = await memoryCache.get(id);
            if (doc) return doc;

            let key = idToKey(id);
            let docString = await redisGetPromise(key);
            if (docString) {
                let doc = JSON.parse(docString);
                await memoryCache.set(id, doc);
                return doc;
            }
        }

        async function set(id, doc) {
            let key = idToKey(id);
            await memoryCache.set(id, doc);
            let docString = JSON.stringify(doc);

            redisClient.setex(key, secondsExpire, docString, err => {
                if (err) console.error(err);
            });
        }

        async function del(id) {
            await memoryCache.del(id);

            let key = idToKey(id);
            redisClient.del(key, err => {
                if (err) console.error(err);
            });
        }

        function reset() {
            throw new Error('Not implemented');
        }

        function idToKey(id) {
            return prefix + entityType + ':' + id;
        }

        function redisGetPromise(key) {
            return new Promise((resolve, reject) => {
                redisClient.get(key, (err, value) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(value);
                    }
                });
            });
        }
    }
};