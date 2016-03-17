(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/JarviS/Practices/barcode-scanner/app/sw.js":[function(require,module,exports){
'use strict';

require('serviceworker-cache-polyfill');

var CACHE_NAME = 'static-cache';
var CACHE_VERSION = 1;

var filesToCache = ['/', '/index.html', '/css/styles.css', '/js/app.js', '/main.js', '/decoder.min.js', '/images/touch/android-chrome-192x192.png', '/images/touch/favicon-96x96.png', '/images/touch/favicon-194x194.png'];

self.oninstall = function (event) {
  event.waitUntil(caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(function (cache) {
    return cache.addAll(filesToCache).then(function (response) {
      console.log('Files are cached successfully.');
      return response;
    });
  }));
};

self.onactivate = function (event) {
  var currentCacheName = CACHE_NAME + '-v' + CACHE_VERSION;
  caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.map(function (cacheName) {
      if (cacheName.indexOf(CACHE_NAME) == -1) {
        return;
      }

      if (cacheName != currentCacheName) {
        return caches.delete(cacheName);
      }
    }));
  });
};

self.onfetch = function (event) {
  var request = event.request;
  event.respondWith(caches.match(request).then(function (response) {
    if (response) {
      return response;
    }

    return fetch(request).then(function (response) {
      var responseToCache = response.clone();
      caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(function (cache) {
        cache.put(request, responseToCache).catch(function (err) {
          console.warn(request.url + ': ' + err.message);
        });
      });
      return response;
    });
  }));
};

},{"serviceworker-cache-polyfill":"/Users/JarviS/Practices/barcode-scanner/node_modules/serviceworker-cache-polyfill/index.js"}],"/Users/JarviS/Practices/barcode-scanner/node_modules/serviceworker-cache-polyfill/index.js":[function(require,module,exports){
if (!Cache.prototype.add) {
  Cache.prototype.add = function add(request) {
    return this.addAll([request]);
  };
}

if (!Cache.prototype.addAll) {
  Cache.prototype.addAll = function addAll(requests) {
    var cache = this;

    // Since DOMExceptions are not constructable:
    function NetworkError(message) {
      this.name = 'NetworkError';
      this.code = 19;
      this.message = message;
    }
    NetworkError.prototype = Object.create(Error.prototype);

    return Promise.resolve().then(function() {
      if (arguments.length < 1) throw new TypeError();
      
      // Simulate sequence<(Request or USVString)> binding:
      var sequence = [];

      requests = requests.map(function(request) {
        if (request instanceof Request) {
          return request;
        }
        else {
          return String(request); // may throw TypeError
        }
      });

      return Promise.all(
        requests.map(function(request) {
          if (typeof request === 'string') {
            request = new Request(request);
          }

          var scheme = new URL(request.url).protocol;

          if (scheme !== 'http:' && scheme !== 'https:') {
            throw new NetworkError("Invalid scheme");
          }

          return fetch(request.clone());
        })
      );
    }).then(function(responses) {
      // TODO: check that requests don't overwrite one another
      // (don't think this is possible to polyfill due to opaque responses)
      return Promise.all(
        responses.map(function(response, i) {
          return cache.put(requests[i], response);
        })
      );
    }).then(function() {
      return undefined;
    });
  };
}

},{}]},{},["/Users/JarviS/Practices/barcode-scanner/app/sw.js"])


//# sourceMappingURL=sw.js.map
