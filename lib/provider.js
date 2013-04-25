var redis = require('redis');
var cacheProviders = require('smartDb-standardCacheProviders');
var nullCacheProvider = cacheProviders.nullCacheProvider;
var inMemoryCacheProvider = cacheProviders.inMemoryCacheProvider;

module.exports = function (options) {

    var ageThreshold = ('ageThreshold' in options) ? options.ageThreshold : 1000;
    var inMemoryCacheMaxAge = ('inMemoryCacheMaxAge' in options) ? options.inMemoryCacheMaxAge : ageThreshold;
    var inMemoryCacheMaxSize = ('inMemoryCacheMaxSize' in options) ? options.inMemoryCacheMaxSize : 1000;

    var nullCache = nullCacheProvider.create();
    var prefix = options.prefix || 'smartDb:';
    var redisClient = redis.createClient(options.port);

    return {
        create: function (entityType, entitySettings) {
            var maxAge = entitySettings.cacheMaxAge;
            if (!maxAge) return nullCache;
            if (maxAge <= ageThreshold) return inMemoryCacheProvider.create(entityType, entitySettings);

            var memoryCache = inMemoryCacheProvider.create(entityType, {
                cacheMaxAge: inMemoryCacheMaxAge,
                cacheMaxSize: inMemoryCacheMaxSize
            });

            var secondsExpire = Math.max(1, Math.round(maxAge / 1000));

            function idToKey(id) {
                return prefix + entityType + ':' + id;
            }

            return {
                get: function (id, cb) {
                    memoryCache.get(id, function (err, doc) {
                        if (err) console.error(err);
                        if (doc) return cb(null, doc);

                        var key = idToKey(id);
                        redisClient.get(key, function (err, docString) {
                            if (err) console.error(err);

                            if (docString) {
                                memoryCache.setStringified(id, docString, function (err) {
                                    if (err) console.log(err);
                                });

                                var doc = JSON.parse(docString);
                                cb(null, doc);
                            }
                            else {
                                cb();
                            }
                        });
                    });
                },

                set: function (id, doc, cb) {
                    var key = idToKey(id);
                    var docString = JSON.stringify(doc);

                    memoryCache.setStringified(id, docString, function (err) {
                        if (err) console.error(err);
                    });

                    redisClient.setex(key, secondsExpire, docString, function (err) {
                        if (err) console.error(err);
                    });

                    cb();
                },

                del: function (id, cb) {
                    memoryCache.del(id, function (err) {
                        if (err) console.error(err);
                    });

                    var key = idToKey(id);
                    redisClient.del(key, function (err) {
                        if (err) console.error(err);
                    });
                    cb();
                },

                reset: function () {
                    throw new Error('Not implemented');
                }
            }
        }
    };
};