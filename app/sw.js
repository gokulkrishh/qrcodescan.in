require('serviceworker-cache-polyfill');

var CACHE_NAME = 'static-cache';
var CACHE_VERSION = 1;

var filesToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/main.js',
  '/manifest.json',
  '/images/touch/android-chrome-144x144.png',
  '/images/touch/android-chrome-192x192.png',
  'https://fonts.googleapis.com/css?family=Material+Icons'
];

self.oninstall = function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(function(cache) {
      return cache.addAll(filesToCache)
        .then(function (response) {
          console.log('Files are cached successfully.');
          return self.skipWaiting();
        })
    })
  );
};

self.onactivate = function(event) {
  return self.clients.claim();
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
