# smartdb-rediscacheprovider

A Redis cache for [smartdb](https://github.com/arnesten/smartdb). Suitable if you have many Node.js processes that
potentially makes updates to the same CouchDB documents.

## Example

```javascript
var smartdb = require('smartdb');
var redisCacheProvider = require('smartdb-rediscacheprovider');

var db = smartdb({
    /* ... smartdb configuration ... */
    cacheProvider: redisCacheProvider({ /* options */  })
});
```

## Options

The following options can be given when creating the cache provider:

* `prefix` - The key prefix to use when saving in Redis. Default is *smartdb:*
* `port` - The Redis port. Default is 6379.
 * `hostname` - The Redis hostname. Default is 127.0.0.1.
* `ageThreshold` - The threshold in milliseconds for cacheMaxAge in smartdb entity settings to when Redis should be used.
    If cacheMaxAge is below threshold it uses inMemoryCacheProvider instead. Default is 1000.
* `inMemoryCacheMaxAge` - The max age in milliseconds when using the inMemoryCacheProvider. Default is the value of ageThreshold.
* `inMemoryCacheMaxSize` - The max items per entity when using the inMemoryCacheProvider. Default is 1000.

## License

(The MIT License)

Copyright (c) 2013-2015 Calle Arnesten

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


