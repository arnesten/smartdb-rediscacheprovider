var redis = require('redis');
var cacheProviders = require('smartDb-standardCacheProviders');
var nullCacheProvider = cacheProviders.nullCacheProvider;
var inMemoryCacheProvider = cacheProviders.inMemoryCacheProvider;

module.exports = function (options) {

    var ageThreshold = options.ageThreshold || 2000;
    var nullCache = nullCacheProvider.create();
    var prefix = options.prefix || 'smartDb:';
    var redisClient = redis.createClient(options.port);

    return {
        create: function (entityType, entitySettings) {
            var maxAge = entitySettings.cacheMaxAge;
            if (!maxAge) return nullCache;
            if (maxAge <= ageThreshold) return inMemoryCacheProvider.create(entityType, entitySettings);

            var secondsExpire = Math.max(1, Math.round(maxAge / 1000));

            function createKey(id) {
                return prefix + entityType + ':' + id;
            }

            return {
                get: function (id, cb) {
                    var key = createKey(id);
                    redisClient.get(key, function (err, data) {
                        if (err) console.log(err);

                        if (data) {
                            var doc = JSON.parse(data);
                            cb(null, doc);
                        }
                        else {
                            cb();
                        }
                    });
                },
                set: function (id, doc, cb) {
                    var key = createKey(id);
                    var value = JSON.stringify(doc);

                    redisClient.setex(key, secondsExpire, value, function (err) {
                        if (err) console.error(err);
                    });

                    cb();
                },
                del: function (id, cb) {
                    var key = createKey(id);
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