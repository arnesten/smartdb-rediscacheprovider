var _ = require('underscore');
var buster = require('buster');
var sinon = require('sinon');
var testCase = buster.testCase;
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var redis = require('redis');

module.exports = testCase('provider', {
    tearDown: function () {
        if (redis.createClient.restore) redis.createClient.restore();
    },
    'can get a value that was set': function (done) {
        var provider = createProvider({});
        var cache = provider.create('', { cacheMaxAge: 3000 });

        cache.set('F1', { name: 'Shark' }, function (err) {
            refute(err);
            cache.get('F1', function (err, doc) {
                refute(err);
                assert.equals(doc, { name: 'Shark' });
                done();
            })
        });
    },
    'cache should be invalidated after maxAge has passed': function (done) {
        // NOTE: This test is a bit instable when running with autotest...
        this.timeout = 3000;
        var provider = createProvider({
            ageThreshold: 100
        });
        var cache = provider.create('', { cacheMaxAge: 1000 });

        cache.set('F1', { name: 'Shark' }, function (err) {
            refute(err);

            setTimeout(function () {
                cache.get('F1', function (err, doc) {
                    refute(err);
                    refute(doc);
                    done();
                });
            }, 2000);
        });
    },
    'can delete entry': function (done) {
        var provider = createProvider({});
        var cache = provider.create('', { cacheMaxAge: 3000 });

        cache.set('F1', { name: 'Shark' }, function (err) {
            refute(err);
            cache.del('F1', function (err) {
                refute(err);
                cache.get('F1', function (err, doc) {
                    refute(err);
                    refute(doc);
                    done();
                })
            })
        });
    },
    'should use in-memory cache for recently set value': function (done) {
        var fakeClient = {
            get: sinon.stub().callsArg(1),
            setex: sinon.stub().callsArg(3)
        };
        sinon.stub(redis, 'createClient', function () {
            return fakeClient;
        });

        var provider = createProvider({});
        var cache = provider.create('', { cacheMaxAge: 2000 });

        cache.set('F1', { name: 'Shark' }, function (err) {
            refute(err);

            cache.get('F1', function (err, doc) {
                refute(err);
                assert.equals(doc, { name: 'Shark'});
                refute.called(fakeClient.get);
                done();
            });
        });
    }
});

function createProvider(options) {
    return require('../lib/provider.js')(options);
}