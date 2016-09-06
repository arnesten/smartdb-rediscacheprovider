'use strict';
let redis = require('redis');
let cacheProviders = require('smartdb-stdcacheproviders');
let nullCacheProvider = cacheProviders.nullCacheProvider;
let inMemoryCacheProvider = cacheProviders.inMemoryCacheProvider;

module.exports = function (options) {
    options = options || {};

    let ageThreshold = ('ageThreshold' in options) ? options.ageThreshold : 1000;
    let inMemoryCacheMaxAge = ('inMemoryCacheMaxAge' in options) ? options.inMemoryCacheMaxAge : ageThreshold;
    let inMemoryCacheMaxSize = ('inMemoryCacheMaxSize' in options) ? options.inMemoryCacheMaxSize : 1000;

    let nullCache = nullCacheProvider.create();
    let prefix = options.prefix || 'smartdb:';
    let redisClient = redis.createClient(options.port, options.hostname || '127.0.0.1');

    return {
        create: create
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
            get: get,
            set: set,
            del: del,
            reset: reset
        };

        function get(id, cb) {
            memoryCache.get(id, (err, doc) => {
                if (err) console.error(err);
                if (doc) return cb(null, doc);

                let key = idToKey(id);
                redisClient.get(key, (err, docString) => {
                    if (err) console.error(err);

                    if (docString) {
                        memoryCache.setStringified(id, docString, err => {
                            if (err) console.error(err);
                        });

                        let doc = JSON.parse(docString);
                        cb(null, doc);
                    }
                    else {
                        cb();
                    }
                });
            });
        }

        function set(id, doc, cb) {
            let key = idToKey(id);
            let docString = JSON.stringify(doc);

            memoryCache.setStringified(id, docString, err => {
                if (err) console.error(err);
            });

            redisClient.setex(key, secondsExpire, docString, err => {
                if (err) console.error(err);
            });

            cb();
        }

        function del(id, cb) {
            memoryCache.del(id, err => {
                if (err) console.error(err);
            });

            let key = idToKey(id);
            redisClient.del(key, err => {
                if (err) console.error(err);
            });
            cb();
        }

        function reset() {
            throw new Error('Not implemented');
        }

        function idToKey(id) {
            return prefix + entityType + ':' + id;
        }
    }
};