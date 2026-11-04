// Minimal IndexedDB key-value store. localStorage is too small for the card
// pool on some mobile browsers, so the card data lives here instead.

const DB_NAME = 'arkhamstudy';
const STORE = 'kv';

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
	const db = await open();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
		req.onsuccess = () => resolve(req.result as T | undefined);
		req.onerror = () => reject(req.error);
	});
}

export async function idbSet(key: string, value: unknown): Promise<void> {
	const db = await open();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
