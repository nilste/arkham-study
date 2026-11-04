import { forceRefresh, loadCardData } from './arkham/api';
import { buildProducts, type CycleGroup, type Product } from './arkham/collection';
import type { CardData } from './arkham/types';

class CardStore {
	data = $state.raw<CardData | null>(null);
	error = $state<string | null>(null);
	refreshing = $state(false);

	groups = $derived<CycleGroup[]>(this.data ? buildProducts(this.data) : []);
	products = $derived<Map<string, Product>>(
		new Map(this.groups.flatMap((g) => g.products).map((p) => [p.code, p]))
	);

	#started = false;

	/** Starts loading once; later calls are no-ops. */
	load() {
		if (this.#started) return;
		this.#started = true;
		// A first visit without a connection gets another go once it is back.
		window.addEventListener('online', () => {
			if (!this.data) this.refresh();
		});
		loadCardData((fresh) => (this.data = fresh))
			.then((d) => (this.data = d))
			.catch((e: unknown) => {
				this.error = e instanceof Error ? e.message : String(e);
			});
	}

	async refresh() {
		this.refreshing = true;
		try {
			this.data = await forceRefresh();
			this.error = null;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.refreshing = false;
		}
	}
}

export const cardStore = new CardStore();
