import type { Card, CardData, Pack } from './types';
import { cycleName, isSideCycle } from './cycles';

/** Something a player can own: a pack, or a box that reprints several packs. */
export interface Product {
	code: string;
	name: string;
	/** Pack codes whose player cards this product contains. */
	sources: string[];
	cardCount: number;
	year: string;
	/** Older packs replaced by a reprint box, shown as an alternative to it. */
	legacy: boolean;
}

export interface CycleGroup {
	cycle: number;
	name: string;
	chapter: number;
	side: boolean;
	products: Product[];
}

/** Sortable key placing a pack in release order. */
export type PackOrder = Map<string, string>;

/**
 * Main-line cycles sort by the date their first pack came out, so a later
 * reprint (Revised Core, Investigator Expansions) sits with the cycle it
 * reprints. Side products (starter decks, parallel investigators, ...) sort
 * by their own release date and interleave with the main line.
 */
export function packOrder(packs: Pack[]): PackOrder {
	const cycleStart = new Map<number, string>();
	for (const p of packs) {
		if (!p.available) continue;
		const cur = cycleStart.get(p.cycle);
		if (!cur || p.available < cur) cycleStart.set(p.cycle, p.available);
	}
	const order: PackOrder = new Map();
	for (const p of packs) {
		const date = isSideCycle(p.cycle)
			? (p.available ?? '9999')
			: (cycleStart.get(p.cycle) ?? '9999');
		const key = [
			date,
			String(p.cycle).padStart(3, '0'),
			String(p.position).padStart(3, '0'),
			p.available ?? '9999'
		].join('|');
		order.set(p.code, key);
	}
	return order;
}

function cardKey(card: Card, order: PackOrder): string {
	return [
		order.get(card.pack) ?? '~',
		String(card.position).padStart(4, '0'),
		// Two printings at the same spot (a promo filed under the Core Set next to
		// the card it reprints): the original wins.
		card.dupOf ? '1' : '0',
		card.code
	].join('|');
}

export function buildProducts(data: CardData): CycleGroup[] {
	// Distinct cards per pack, so a product's count matches what the viewer
	// shows after reprints collapse.
	const canon = canonicalizer(data.cards);
	const distinct = new Map<string, Set<string>>();
	for (const c of data.cards) {
		const set = distinct.get(c.pack) ?? new Set<string>();
		set.add(canon(c.code));
		distinct.set(c.pack, set);
	}

	// Packs whose cards also come in a player reprint box.
	const reprinted = new Set<string>();
	for (const p of data.packs) {
		if (p.reprintType === 'player') p.reprints.forEach((code) => reprinted.add(code));
	}

	const order = packOrder(data.packs);
	const sorted = [...data.packs].sort((a, b) =>
		(order.get(a.code) ?? '').localeCompare(order.get(b.code) ?? '')
	);

	const groups = new Map<number, CycleGroup>();
	for (const p of sorted) {
		const sources = p.reprintType === 'player' ? p.reprints : [p.code];
		const cardCount = new Set(sources.flatMap((code) => [...(distinct.get(code) ?? [])])).size;
		if (cardCount === 0) continue;

		let group = groups.get(p.cycle);
		if (!group) {
			group = {
				cycle: p.cycle,
				name: '',
				chapter: p.chapter,
				side: isSideCycle(p.cycle),
				products: []
			};
			groups.set(p.cycle, group);
		}
		group.products.push({
			code: p.code,
			name: p.name,
			sources,
			cardCount,
			year: p.available?.slice(0, 4) ?? '',
			legacy: reprinted.has(p.code)
		});
	}

	for (const g of groups.values()) {
		g.name = cycleName(
			g.cycle,
			data.packs.filter((p) => p.cycle === g.cycle)
		);
		// Reprint boxes first: they are what a new player can actually buy.
		g.products.sort((a, b) => Number(a.legacy) - Number(b.legacy));
	}

	return [...groups.values()];
}

/**
 * A product's name under its cycle heading, without the cycle name it
 * repeats: "The Scarlet Keys Investigator Expansion" under "The Scarlet Keys"
 * reads "Investigator Expansion".
 */
export function nameInCycle(product: Product, group: CycleGroup): string {
	const prefix = group.name + ' ';
	return product.name.startsWith(prefix) && product.name.length > prefix.length
		? product.name.slice(prefix.length)
		: product.name;
}

/**
 * Player cards contained in the given products, one entry per distinct card,
 * in release order. A card reprinted in several owned products shows up once,
 * as the earliest owned printing, so you see each card where you first got it.
 * Signature cards follow their investigator.
 */
export function cardsFor(data: CardData, products: Product[]): Card[] {
	const sources = new Set(products.flatMap((p) => p.sources));
	const order = packOrder(data.packs);
	const canon = canonicalizer(data.cards);

	const best = new Map<string, { card: Card; key: string }>();
	for (const card of data.cards) {
		if (!sources.has(card.pack)) continue;
		const id = canon(card.code);
		const key = cardKey(card, order);
		const cur = best.get(id);
		if (!cur || key < cur.key) best.set(id, { card, key });
	}

	const sorted = [...best.values()].sort((a, b) => a.key.localeCompare(b.key)).map((e) => e.card);
	return signaturesAfterInvestigators(sorted, canon);
}

/**
 * Maps a card code to the code of its original printing. Reprints can chain
 * (a 2026 starter deck card reprinting a Core 2026 card that reprints a 2016
 * Core card), so this follows duplicate links all the way.
 */
export function canonicalizer(cards: Card[]): (code: string) => string {
	const dupOf = new Map(cards.filter((c) => c.dupOf).map((c) => [c.code, c.dupOf!]));
	return (code) => {
		const seen = new Set<string>();
		while (dupOf.has(code) && !seen.has(code)) {
			seen.add(code);
			code = dupOf.get(code)!;
		}
		return code;
	};
}

/**
 * Moves each signature card right behind its investigator. Signature cards
 * name the original investigator, so a parallel version's cards (By the Book's
 * Directives for parallel Roland) would otherwise land behind the original.
 * An investigator from the card's own pack therefore wins.
 */
function signaturesAfterInvestigators(cards: Card[], canon: (code: string) => string): Card[] {
	const investigators = cards.filter((c) => c.type === 'investigator');
	const signatures = new Map<string, Card[]>();
	const rest: Card[] = [];
	for (const card of cards) {
		const wanted = new Set((card.signatureOf ?? []).map(canon));
		const owners =
			card.type === 'investigator' || !wanted.size
				? []
				: investigators.filter(
						(inv) =>
							wanted.has(canon(inv.code)) || (inv.alternateOf && wanted.has(canon(inv.alternateOf)))
					);
		const owner =
			owners.find((inv) => inv.pack === card.pack) ??
			owners.find((inv) => !inv.alternateOf || inv.dupOf) ??
			owners[0];
		if (owner) {
			signatures.set(owner.code, [...(signatures.get(owner.code) ?? []), card]);
		} else {
			rest.push(card);
		}
	}
	return rest.flatMap((c) =>
		c.type === 'investigator' ? [c, ...(signatures.get(c.code) ?? [])] : [c]
	);
}
