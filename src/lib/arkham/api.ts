import type { ApiCard, ApiPack, Card, CardData, Pack } from './types';
import { idbGet, idbSet } from './cache';

export const ARKHAMDB = 'https://arkhamdb.com';

// Bump the version whenever the trimmed Card shape or the filtering changes,
// so browsers drop data cached by an older build.
const CACHE_KEY = 'cardData/v2';
/** Cached data younger than this is used without asking ArkhamDB for updates. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

function trimCard(c: ApiCard): Card {
	const factions = [c.faction_code, c.faction2_code, c.faction3_code].filter(
		(f): f is string => !!f
	);
	const investigators = c.restrictions?.investigator;
	return {
		code: c.code,
		name: c.name,
		subname: c.subname,
		pack: c.pack_code,
		position: c.position,
		type: c.type_code,
		typeName: c.type_name,
		subtype: c.subtype_code,
		factions,
		xp: c.xp,
		cost: c.cost,
		traits: c.traits,
		text: c.text,
		flavor: c.flavor,
		illustrator: c.illustrator,
		quantity: c.quantity,
		slot: c.slot,
		icons: [
			c.skill_willpower ?? 0,
			c.skill_intellect ?? 0,
			c.skill_combat ?? 0,
			c.skill_agility ?? 0,
			c.skill_wild ?? 0
		],
		health: c.health,
		sanity: c.sanity,
		unique: c.is_unique,
		exceptional: c.exceptional,
		myriad: c.myriad,
		permanent: c.permanent,
		backName: c.back_name ?? c.linked_card?.name,
		backText: c.back_text ?? c.linked_card?.text,
		backFlavor: c.back_flavor ?? c.linked_card?.flavor,
		img: c.imagesrc,
		// Some double-faced cards store their back as a separate linked card.
		backImg: c.backimagesrc ?? c.linked_card?.imagesrc,
		hasBack: c.double_sided || !!c.linked_card,
		dupOf: c.duplicate_of_code,
		alternateOf: c.alternate_of_code,
		signatureOf: investigators ? Object.keys(investigators) : undefined,
		customization: c.customization_text
	};
}

function trimPack(p: ApiPack): Pack {
	return {
		code: p.code,
		name: p.name,
		position: p.position,
		cycle: p.cycle_position,
		available: p.available,
		reprints: p.reprint_packs ?? [],
		reprintType: p.reprint_type ?? undefined,
		chapter: p.chapter ?? 1
	};
}

const TIMEOUT_MS = 30_000;

async function getJson<T>(path: string): Promise<T> {
	let res: Response;
	try {
		res = await fetch(ARKHAMDB + path, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	} catch {
		throw new Error('Could not reach ArkhamDB. Check your connection and try again.');
	}
	if (!res.ok) throw new Error(`ArkhamDB is not answering right now (error ${res.status}).`);
	return res.json();
}

/**
 * ArkhamDB marks some real cards as hidden (novella investigators, the two
 * Hank Samson cards), so "hidden" alone is not a reason to drop a card. Drop
 * back faces that are shown through their front's linked_card, and hidden
 * non-investigators, which are placeholders such as "Random Basic Weakness".
 */
export function visibleCards(cards: ApiCard[]): ApiCard[] {
	const backFaces = new Set(cards.flatMap((c) => (c.linked_card ? [c.linked_card.code] : [])));
	return cards.filter(
		(c) => !backFaces.has(c.code) && (!c.hidden || c.type_code === 'investigator')
	);
}

export async function fetchFromArkhamDb(): Promise<CardData> {
	const [cards, packs] = await Promise.all([
		getJson<ApiCard[]>('/api/public/cards/'),
		getJson<ApiPack[]>('/api/public/packs/')
	]);
	// A broken response must not be cached and shown as an empty collection.
	if (!Array.isArray(cards) || cards.length < 500 || !Array.isArray(packs) || !packs.length) {
		throw new Error('ArkhamDB sent incomplete card data. Try again later.');
	}
	return {
		cards: visibleCards(cards).map(trimCard),
		packs: packs.map(trimPack),
		fetchedAt: Date.now()
	};
}

/**
 * Returns cached card data immediately when there is any, and refreshes it
 * from ArkhamDB in the background when it is stale. `onUpdate` receives the
 * fresh data when a background refresh finishes.
 */
export async function loadCardData(onUpdate: (data: CardData) => void): Promise<CardData> {
	const cached = await idbGet<CardData>(CACHE_KEY).catch(() => undefined);

	const refresh = async () => {
		const fresh = await fetchFromArkhamDb();
		await idbSet(CACHE_KEY, fresh).catch(() => {});
		return fresh;
	};

	if (!cached) return refresh();

	if (Date.now() - cached.fetchedAt > MAX_AGE_MS) {
		refresh()
			.then(onUpdate)
			.catch(() => {
				// Offline or ArkhamDB unavailable: keep using the cached data.
			});
	}
	return cached;
}

export async function forceRefresh(): Promise<CardData> {
	const fresh = await fetchFromArkhamDb();
	await idbSet(CACHE_KEY, fresh).catch(() => {});
	return fresh;
}
