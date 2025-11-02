const CACHE_NAME = "diy-scouts-v1";

//Base files to cache
const BASE_ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./assets/css/style.css",
  "./manifest.json",
];

//Auto-include badge pages if the folder exists
async function getBadgeFiles() {
  try {
    const res = await fetch("./badges/index.json");
    if (!res.ok) return [];
    const badgeList = await res.json();
    return badgeList.map((name) => `./badges/${name}.html`);
  } catch (e) {
    return [];
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const badgeFiles = await getBadgeFiles();
      await cache.addAll([...BASE_ASSETS, ...badgeFiles]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
