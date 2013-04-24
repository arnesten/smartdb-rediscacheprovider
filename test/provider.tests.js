var _ = require('underscore');
var buster = require('buster');
var sinon = require('sinon');
var testCase = buster.testCase;
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;

module.exports = testCase('provider', {
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
        this.timeout = 3000;
        var provider = createProvider({});
        var cache = provider.create('', { cacheMaxAge: 2000 });

        cache.set('F1', { name: 'Shark'}, function (err) {
            refute(err);

            setTimeout(function () {
                cache.get('F1', function (err, doc) {
                    refute(err);
                    refute(doc);
                    done();
                });
            }, 2500);
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

    }
});

function createProvider(options) {
    return require('../lib/provider.js')(options);
}