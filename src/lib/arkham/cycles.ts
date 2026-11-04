import type { Pack } from './types';

/**
 * ArkhamDB exposes `cycle_position` on packs but no cycle names, so names for
 * the known cycles live here. A cycle missing from this table falls back to
 * the name of its first pack, so new releases still show up sensibly.
 */
const CYCLE_NAMES: Record<number, string> = {
	1: 'Night of the Zealot (Core Set)',
	2: 'The Dunwich Legacy',
	3: 'The Path to Carcosa',
	4: 'The Forgotten Age',
	5: 'The Circle Undone',
	6: 'The Dream-Eaters',
	7: 'The Innsmouth Conspiracy',
	8: 'Edge of the Earth',
	9: 'The Scarlet Keys',
	10: 'The Feast of Hemlock Vale',
	11: 'The Drowned City',
	50: 'Return to...',
	60: 'Investigator Starter Decks',
	61: 'Investigator Starter Decks',
	70: 'Standalone Scenarios',
	80: 'Novellas and Promos',
	90: 'Parallel Investigators'
};

export function cycleName(cycle: number, packsInCycle: Pack[]): string {
	return CYCLE_NAMES[cycle] ?? packsInCycle[0]?.name ?? `Cycle ${cycle}`;
}

/** Cycles that are side products rather than the main release sequence. */
export function isSideCycle(cycle: number): boolean {
	return cycle >= 50;
}
