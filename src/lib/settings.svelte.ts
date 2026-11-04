import { browser } from '$app/env';
import { NO_FILTERS, type Filters } from './arkham/filters';

const KEY = 'arkhamstudy:settings';
// Filters only last for the browser session: a class picked while exploring
// one box should not silently hide cards on the next visit.
const FILTER_KEY = 'arkhamstudy:filters';

interface Saved {
	owned: string[];
	/** Last card looked at, per viewed set of products. */
	lastSeen: Record<string, string>;
}

function read<T>(storage: () => Storage, key: string): Partial<T> {
	if (!browser) return {};
	try {
		return JSON.parse(storage().getItem(key) ?? '{}') as Partial<T>;
	} catch {
		return {};
	}
}

function write(storage: () => Storage, key: string, value: unknown) {
	if (!browser) return;
	try {
		storage().setItem(key, JSON.stringify(value));
	} catch {
		// Private mode or storage full: settings just won't persist.
	}
}

class Settings {
	owned = $state<string[]>([]);
	filters = $state<Filters>(NO_FILTERS);
	lastSeen: Record<string, string> = {};

	constructor() {
		const saved = read<Saved>(() => localStorage, KEY);
		this.owned = Array.isArray(saved.owned) ? saved.owned : [];
		this.lastSeen = saved.lastSeen ?? {};
		this.filters = { ...NO_FILTERS, ...read<Filters>(() => sessionStorage, FILTER_KEY) };
	}

	isOwned(code: string): boolean {
		return this.owned.includes(code);
	}

	toggleOwned(code: string) {
		this.owned = this.isOwned(code) ? this.owned.filter((c) => c !== code) : [...this.owned, code];
		this.save();
	}

	setOwned(codes: string[]) {
		this.owned = codes;
		this.save();
	}

	setFilters(f: Filters) {
		this.filters = f;
		write(() => sessionStorage, FILTER_KEY, f);
	}

	remember(view: string, code: string) {
		this.lastSeen[view] = code;
		this.save();
	}

	private save() {
		write(() => localStorage, KEY, { owned: this.owned, lastSeen: this.lastSeen } satisfies Saved);
	}
}

export const settings = new Settings();
