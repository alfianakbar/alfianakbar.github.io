'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "52dd19f7a1ac5dd8d3e9e828ea57ea72",
"/": "52dd19f7a1ac5dd8d3e9e828ea57ea72",
"main.dart.js": "34ed8c60b9e352da9fe33f8733321d01",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "4ab6969680052a19a344fdad7b43d812",
"assets/AssetManifest.json": "6feebc280cb23d1ae8963e28041106b3",
"assets/NOTICES": "3f743c9505d3c20da4e1db757dbc11bb",
"assets/FontManifest.json": "1de5acd3e496dd6baac8f82895be35bf",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/fonts/JosefinSans-Italic.ttf": "ef34c9828c8d6c5d97dbb60e067b3d21",
"assets/fonts/JosefinSans-Bold.ttf": "6d9e5dd5fa9def9c4bb23e0269688f9d",
"assets/fonts/JosefinSans-Regular.ttf": "53931de48478e5acd136fa69f4bc55ad",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/assets/images/movie6.jpeg": "d135b88a6a560435eafc6f4bdcc3542b",
"assets/assets/images/game2.png": "43d5512ece28fa9fb3d5b67799c9000e",
"assets/assets/images/game1.png": "6444f516855ef7e810c0ec1cad232a39",
"assets/assets/images/movie1.jpeg": "913c2ceee2b434df5b87c251f56a0435",
"assets/assets/images/game6.png": "8ef4f069666d165e98bfe96155322ca7",
"assets/assets/images/logo-app.png": "55268f9fc8c29fd4edb9ee269d8562b0",
"assets/assets/images/movie2.jpeg": "a6f942b3695372e9a77a776b5ac8407e",
"assets/assets/images/splash.png": "e0ac6099da79ab9a12308ca91c227de2",
"assets/assets/images/logo.png": "a61d7279b4e663fe21f3e968d9992131",
"assets/assets/images/movie3.jpeg": "208f2fee71caa12d20e1be15f3b7b65b",
"assets/assets/images/game3.jpeg": "0acd048e377d638f11715d9253363810",
"assets/assets/images/game4.jpeg": "923ce6c7ee0d41f53917b7e33fb555cd",
"assets/assets/images/movie4.jpeg": "ed7644785c74ff29b9c16efbc48423c8",
"assets/assets/images/consult.jpg": "e8c62cda49cf2b7a6b02627cfee86cbf",
"assets/assets/images/movie5.jpeg": "79ec6f2b02c59d821fc31a358a90426b",
"assets/assets/images/game5.jpeg": "42e8d8fc4766609321386118130ea76f"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data == 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message = 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
