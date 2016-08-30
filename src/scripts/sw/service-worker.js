var appPrefix = 'mtba-trans-';
var currentCacheName = appPrefix+'static-v1';

self.addEventListener('install', function(event) {

	var filesToCache = [
		'./',
		'./index.html',
		'./assets/js/jquery.min.js',
    './assets/js/idb.min.js',
		'./assets/js/bootstrap.min.js',
    './assets/js/toastr.min.js',
		'./assets/js/main.js',
		'./assets/data/routes.json',
    './assets/toastr.css',
    './assets/css/bootstrap.min.css',
		'./assets/css/main.css'
	];

	event.waitUntil(
		caches.open(currentCacheName).then(function(cache) {
			return cache.addAll(filesToCache);
		})
	);

});


self.addEventListener('activate', function(event) {
	event.waitUntil(

		// Get all cache keys (cacheNames)
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {

					// Return all the caches that start with the appPrefix
					// AND are not the current static cache name
					return cacheName.startsWith(appPrefix) &&
					cacheName != currentCacheName;
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', function(event) {

	event.respondWith(
		caches.match(event.request).then(function(response) {
			return response || fetch(event.request);
		})
	);

});


self.addEventListener('message', function(event) {
	if (!event.data.action) { return; }

	switch(event.data.action) {
		case 'skipWaiting':
			self.skipWaiting();
		default:
			return;
	}
});
