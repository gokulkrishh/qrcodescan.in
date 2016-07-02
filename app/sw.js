require('serviceworker-cache-polyfill');

var CACHE_NAME = 'static-cache';
var CACHE_VERSION = 2;

var filesToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/main.js',
  '/images/touch/android-chrome-192x192.png',
  '/images/touch/favicon-96x96.png',
  '/images/touch/favicon-194x194.png',
  'https://fonts.googleapis.com/css?family=Material+Icons',
  'https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,medium&amp;lang=en'
];

self.oninstall = function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(function(cache) {
      return cache.addAll(filesToCache)
        .then(function (response) {
          console.log('Files are cached successfully.');
          return response;
        })
    })
  );
};

self.onactivate = function(event) {
  var currentCacheName = CACHE_NAME + '-v' + CACHE_VERSION;
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        if (cacheName.indexOf(CACHE_NAME) == -1) {
          return;
        }

        if (cacheName != currentCacheName) {
          return caches.delete(cacheName);
        }
      })
    );
  });
};

self.onfetch = function(event) {
  var request = event.request;
  event.respondWith(
    caches.match(request).then(function(response) {
      if (response) {
        return response;
      }

      return fetch(request).then(function(response) {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(
          function(cache) {
            cache.put(request, responseToCache).catch(function(err) {
              console.warn(request.url + ': ' + err.message);
            });
          });
        return response;
      });
    })
  );
};
