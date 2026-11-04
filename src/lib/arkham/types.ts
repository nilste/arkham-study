/** Raw card as returned by https://arkhamdb.com/api/public/cards/ (only the fields we read). */
export interface ApiCard {
	code: string;
	name: string;
	subname?: string;
	pack_code: string;
	position: number;
	type_code: string;
	type_name: string;
	subtype_code?: string;
	faction_code: string;
	faction2_code?: string;
	faction3_code?: string;
	xp?: number;
	cost?: number | null;
	traits?: string;
	text?: string;
	flavor?: string;
	illustrator?: string;
	quantity: number;
	deck_limit?: number;
	slot?: string;
	skill_willpower?: number;
	skill_intellect?: number;
	skill_combat?: number;
	skill_agility?: number;
	skill_wild?: number;
	health?: number;
	sanity?: number;
	is_unique: boolean;
	exceptional: boolean;
	myriad: boolean;
	permanent: boolean;
	double_sided: boolean;
	back_name?: string;
	back_text?: string;
	back_flavor?: string;
	imagesrc?: string;
	backimagesrc?: string;
	hidden?: boolean;
	duplicate_of_code?: string;
	alternate_of_code?: string;
	restrictions?: { investigator?: Record<string, string> };
	linked_card?: ApiCard;
	customization_text?: string;
}

/** Raw pack as returned by https://arkhamdb.com/api/public/packs/ */
export interface ApiPack {
	code: string;
	name: string;
	position: number;
	cycle_position: number;
	available: string | null;
	reprint_packs?: string[];
	reprint_type?: 'player' | 'campaign' | null;
	chapter?: number | null;
	total: number;
}

/** Trimmed card kept in the cache and used by the UI. */
export interface Card {
	code: string;
	name: string;
	subname?: string;
	pack: string;
	position: number;
	type: string;
	typeName: string;
	subtype?: string;
	factions: string[];
	xp?: number;
	cost?: number | null;
	traits?: string;
	text?: string;
	flavor?: string;
	illustrator?: string;
	quantity: number;
	slot?: string;
	/** willpower, intellect, combat, agility, wild */
	icons: [number, number, number, number, number];
	health?: number;
	sanity?: number;
	unique: boolean;
	exceptional: boolean;
	myriad: boolean;
	permanent: boolean;
	backName?: string;
	backText?: string;
	backFlavor?: string;
	img?: string;
	backImg?: string;
	/** True when the card has a back worth showing, even if no image of it exists. */
	hasBack: boolean;
	/** Code of the original printing, when this card is a reprint. */
	dupOf?: string;
	/** For a parallel investigator, the code of the investigator it is a version of. */
	alternateOf?: string;
	/** Investigator codes this card is a signature card for. */
	signatureOf?: string[];
	/** Upgrade sheet text of a customizable card. */
	customization?: string;
}

export interface Pack {
	code: string;
	name: string;
	position: number;
	cycle: number;
	available: string | null;
	reprints: string[];
	reprintType?: 'player' | 'campaign';
	chapter: number;
}

export interface CardData {
	cards: Card[];
	packs: Pack[];
	/** Epoch milliseconds when this data was fetched from ArkhamDB. */
	fetchedAt: number;
}
