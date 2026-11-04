import type { Card } from './types';

export type Kind = 'investigator' | 'asset' | 'event' | 'skill' | 'weakness' | 'other';
export type Level = 'all' | 'zero' | 'upgrades';

export interface Filters {
	/** Empty means every class. */
	factions: string[];
	/** Empty means every kind. */
	kinds: Kind[];
	level: Level;
}

export const KINDS: { code: Kind; name: string }[] = [
	{ code: 'investigator', name: 'Investigators' },
	{ code: 'asset', name: 'Assets' },
	{ code: 'event', name: 'Events' },
	{ code: 'skill', name: 'Skills' },
	{ code: 'weakness', name: 'Weaknesses' }
];

export const LEVELS: { code: Level; name: string }[] = [
	{ code: 'all', name: 'All levels' },
	{ code: 'zero', name: 'Level 0' },
	{ code: 'upgrades', name: 'Upgrades' }
];

export const NO_FILTERS: Filters = { factions: [], kinds: [], level: 'all' };

export function kindOf(card: Card): Kind {
	if (card.subtype === 'weakness' || card.subtype === 'basicweakness') return 'weakness';
	if (['investigator', 'asset', 'event', 'skill'].includes(card.type)) return card.type as Kind;
	return 'other';
}

export function matches(card: Card, f: Filters): boolean {
	if (f.factions.length && !card.factions.some((x) => f.factions.includes(x))) return false;
	if (f.kinds.length && !f.kinds.includes(kindOf(card))) return false;
	const xp = card.xp ?? 0;
	if (f.level === 'zero' && xp > 0) return false;
	if (f.level === 'upgrades' && xp === 0) return false;
	return true;
}

export function isFiltered(f: Filters): boolean {
	return f.factions.length > 0 || f.kinds.length > 0 || f.level !== 'all';
}
