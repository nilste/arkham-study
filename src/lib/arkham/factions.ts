/**
 * `color` is the printed class colour, for borders and fills. `ink` is a
 * lighter shade of it that stays readable as text on the dark background.
 */
export const FACTIONS = [
	{ code: 'guardian', name: 'Guardian', color: '#2b80c5', ink: '#5ea8e8' },
	{ code: 'seeker', name: 'Seeker', color: '#ec8426', ink: '#f19a48' },
	{ code: 'rogue', name: 'Rogue', color: '#107116', ink: '#4fb257' },
	{ code: 'mystic', name: 'Mystic', color: '#7554ab', ink: '#a98ad9' },
	{ code: 'survivor', name: 'Survivor', color: '#cc3038', ink: '#ec6a6f' },
	{ code: 'neutral', name: 'Neutral', color: '#8a8a8a', ink: '#b3aa9e' }
] as const;

const NEUTRAL = FACTIONS[5];

function faction(code: string) {
	return FACTIONS.find((f) => f.code === code) ?? NEUTRAL;
}

export function factionColor(code: string): string {
	return faction(code).color;
}

export function factionInk(code: string): string {
	return faction(code).ink;
}

export function factionName(code: string): string {
	return FACTIONS.find((f) => f.code === code)?.name ?? code;
}
