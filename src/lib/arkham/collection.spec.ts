import { describe, expect, it } from 'vitest';
import { buildProducts, cardsFor, nameInCycle } from './collection';
import type { Card, CardData, Pack } from './types';

function pack(p: Partial<Pack> & Pick<Pack, 'code' | 'cycle' | 'position'>): Pack {
	return { name: p.code, available: '2017-01-01', reprints: [], chapter: 1, ...p };
}

function card(c: Partial<Card> & Pick<Card, 'code' | 'pack' | 'position'>): Card {
	return {
		name: c.code,
		type: 'asset',
		typeName: 'Asset',
		factions: ['neutral'],
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

const data: CardData = {
	fetchedAt: 0,
	packs: [
		pack({ code: 'core', cycle: 1, position: 1, available: '2016-11-10' }),
		pack({ code: 'rcore', cycle: 1, position: 2, available: '2020-10-01' }),
		pack({ code: 'dwl', cycle: 2, position: 1, available: '2017-01-12' }),
		pack({ code: 'tmm', cycle: 2, position: 2, available: '2017-02-16' }),
		pack({
			code: 'dwlp',
			cycle: 2,
			position: 1,
			available: '2024-01-12',
			reprints: ['dwl', 'tmm'],
			reprintType: 'player'
		}),
		pack({
			code: 'dwlc',
			cycle: 2,
			position: 2,
			available: '2024-01-12',
			reprints: ['dwl', 'tmm'],
			reprintType: 'campaign'
		}),
		pack({ code: 'nat', cycle: 60, position: 1, available: '2020-08-28' }),
		pack({ code: 'btb', cycle: 90, position: 4, available: '2021-06-18' })
	],
	cards: [
		card({ code: '01030', pack: 'core', position: 30 }),
		card({ code: '01501', pack: 'rcore', position: 1, dupOf: '01001' }),
		card({ code: '01530', pack: 'rcore', position: 30, dupOf: '01030' }),
		card({ code: '02001', pack: 'dwl', position: 1 }),
		card({ code: '02150', pack: 'tmm', position: 150 }),
		card({ code: '60101', pack: 'nat', position: 1 }),
		card({ code: '60130', pack: 'nat', position: 30, dupOf: '01030' }),
		card({ code: '02003', pack: 'dwl', position: 3, type: 'investigator' }),
		card({ code: '02010', pack: 'dwl', position: 10, signatureOf: ['02003'] }),
		card({ code: '01006', pack: 'core', position: 6, signatureOf: ['01001'] }),
		card({ code: '01001', pack: 'core', position: 1, type: 'investigator' }),
		card({ code: '01002', pack: 'core', position: 2, type: 'investigator' }),
		card({ code: '60201', pack: 'nat', position: 2, dupOf: '60130' }),
		card({ code: '98004', pack: 'core', position: 1, type: 'investigator', dupOf: '01001' }),
		card({ code: '90024', pack: 'btb', position: 24, type: 'investigator', alternateOf: '01001' }),
		card({ code: '90025', pack: 'btb', position: 25, signatureOf: ['01001'] })
	]
};

const codes = (cards: Card[]) => cards.map((c) => c.code);

describe('buildProducts', () => {
	const groups = buildProducts(data);
	const product = (code: string) => groups.flatMap((g) => g.products).find((p) => p.code === code)!;

	it('turns a player reprint box into a product covering its packs', () => {
		expect(product('dwlp').sources).toEqual(['dwl', 'tmm']);
		expect(product('dwlp').cardCount).toBe(4);
	});

	it('marks packs covered by a reprint box as legacy and lists the box first', () => {
		const dunwich = groups.find((g) => g.cycle === 2)!;
		expect(dunwich.products.map((p) => [p.code, p.legacy])).toEqual([
			['dwlp', false],
			['dwl', true],
			['tmm', true]
		]);
	});

	it('leaves out products without player cards', () => {
		expect(groups.flatMap((g) => g.products).some((p) => p.code === 'dwlc')).toBe(false);
	});

	it('orders cycles by release, with side products interleaved by date', () => {
		expect(groups.map((g) => g.cycle)).toEqual([1, 2, 60, 90]);
	});

	it('counts each distinct card once', () => {
		// Core holds 01001, its reprint 98004, 01006, 01002 and 01030.
		expect(product('core').cardCount).toBe(4);
	});
});

describe('nameInCycle', () => {
	const group = { cycle: 9, name: 'The Scarlet Keys', chapter: 1, side: false, products: [] };
	const named = (name: string) => ({
		code: 'x',
		name,
		sources: [],
		cardCount: 1,
		year: '2022',
		legacy: false
	});

	it('drops the cycle name the product repeats', () => {
		expect(nameInCycle(named('The Scarlet Keys Investigator Expansion'), group)).toBe(
			'Investigator Expansion'
		);
	});

	it('keeps a name that is the cycle name or only starts like it', () => {
		expect(nameInCycle(named('The Scarlet Keys'), group)).toBe('The Scarlet Keys');
		expect(nameInCycle(named('The Scarlet Keystone'), group)).toBe('The Scarlet Keystone');
	});
});

describe('cardsFor', () => {
	const groups = buildProducts(data);
	const p = (code: string) => groups.flatMap((g) => g.products).find((x) => x.code === code)!;

	it('collapses reprints onto the earliest owned printing', () => {
		expect(codes(cardsFor(data, [p('core'), p('rcore')]))).toEqual([
			'01001',
			'01006',
			'01002',
			'01030'
		]);
	});

	it('shows the reprint when only the reprint is owned', () => {
		expect(codes(cardsFor(data, [p('rcore')]))).toEqual(['01501', '01530']);
	});

	it('sorts a revised core before later cycles even though it was printed later', () => {
		expect(codes(cardsFor(data, [p('dwlp'), p('rcore')]))).toEqual([
			'01501',
			'01530',
			'02001',
			'02003',
			'02010',
			'02150'
		]);
	});

	it('follows chains of reprints', () => {
		expect(codes(cardsFor(data, [p('nat'), p('core')]))).toEqual([
			'01001',
			'01006',
			'01002',
			'01030',
			'60101'
		]);
	});

	it('keeps the original printing when a reprint sits at the same spot', () => {
		expect(codes(cardsFor(data, [p('core')]))[0]).toBe('01001');
	});

	it('gives a parallel investigator the signature cards from its own pack', () => {
		expect(codes(cardsFor(data, [p('core'), p('btb')])).slice(-2)).toEqual(['90024', '90025']);
	});

	it('moves signature cards right behind their investigator', () => {
		expect(codes(cardsFor(data, [p('core')])).slice(0, 3)).toEqual(['01001', '01006', '01002']);
	});
});
