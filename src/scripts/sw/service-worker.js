var currentCacheName = 'mtba-trans-static-v5';

self.addEventListener('install', function(event) {

	var filesToCache = [
		'./',
		'./index.html',
		'./assets/js/jquery.min.js',
    './assets/js/idb.min.js',
		'./assets/js/bootstrap.min.js',
		'./assets/js/main.js',
		'./assets/data/routes.json',
    './assets/css/bootstrap.min.css',
		'./assets/css/main.css',
    './assets/data/CR-Fairmount.json',
    './assets/data/CR-Fitchburg.json',
    './assets/data/CR-Franklin.json',
    './assets/data/CR-Greenbush.json',
    './assets/data/CR-Haverhill.json',
    './assets/data/CR-Kingston.json',
    './assets/data/CR-Lowell.json',
    './assets/data/CR-Middleborough.json',
    './assets/data/CR-Needham.json',
    './assets/data/CR-Newburyport.json',
    './assets/data/CR-Providence.json',
    './assets/data/CR-Worcester.json'
	];

	event.waitUntil(
		caches.open(currentCacheName).then(function(cache) {
			return cache.addAll(filesToCache);
		})
	);

});


self.addEventListener('activate', function(event) {
	event.waitUntil(

    // Activate and make sure we upgrade if needed.
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {

					return cacheName.startsWith('mtba-trans-') &&
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
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
