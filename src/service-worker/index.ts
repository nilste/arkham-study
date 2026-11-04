// Keeps the app shell available offline, so the installed app opens without
// a connection. Card data has its own IndexedDB cache, and card images come
// from other origins, so this worker leaves those requests alone.
import { self } from '$app/service-worker';
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';

const CACHE = `shell-${version}`;
const scope = new URL(self.registration.scope);
const toUrl = (path: string) => new URL(path.replace(/^\/+/, ''), scope).href;
const SHELL = [...immutable, ...assets, ...prerendered].map((f) => toUrl(f.path));

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(SHELL))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	const url = new URL(req.url);
	if (req.method !== 'GET' || url.origin !== scope.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			// Build files have content hashes in their names, so a cached copy is
			// always current.
			const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
			if (cached && req.mode !== 'navigate') return cached;
			try {
				return await fetch(req);
			} catch (e) {
				// Offline: a page request gets its prerendered shell (/view?p=... -> /view).
				if (cached) return cached;
				throw e;
			}
		})()
	);
});
