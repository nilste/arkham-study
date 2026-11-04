import { describe, expect, it } from 'vitest';
import { NO_FILTERS, kindOf, matches } from './filters';
import type { Card } from './types';

function card(c: Partial<Card>): Card {
	return {
		code: '00000',
		name: 'Test',
		pack: 'core',
		position: 1,
		type: 'asset',
		typeName: 'Asset',
		factions: ['seeker'],
		quantity: 2,
		icons: [0, 0, 0, 0, 0],
		unique: false,
		exceptional: false,
		myriad: false,
		permanent: false,
		hasBack: false,
		...c
	};
}

describe('matches', () => {
	it('counts cards without an xp value as level 0', () => {
		// Signature and bonded cards have no xp field at all.
		const signature = card({ xp: undefined, signatureOf: ['01001'] });
		expect(matches(signature, { ...NO_FILTERS, level: 'zero' })).toBe(true);
		expect(matches(signature, { ...NO_FILTERS, level: 'upgrades' })).toBe(false);
	});

	it('matches a multi-class card on any of its classes', () => {
		const dual = card({ factions: ['rogue', 'survivor'] });
		expect(matches(dual, { ...NO_FILTERS, factions: ['survivor'] })).toBe(true);
		expect(matches(dual, { ...NO_FILTERS, factions: ['mystic'] })).toBe(false);
	});

	it('treats weaknesses as their own kind whatever their card type', () => {
		expect(kindOf(card({ type: 'treachery', subtype: 'basicweakness' }))).toBe('weakness');
		expect(kindOf(card({ type: 'asset', subtype: 'weakness' }))).toBe('weakness');
		expect(
			matches(card({ type: 'asset', subtype: 'weakness' }), { ...NO_FILTERS, kinds: ['asset'] })
		).toBe(false);
	});
});
