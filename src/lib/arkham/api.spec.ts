import { describe, expect, it } from 'vitest';
import { visibleCards } from './api';
import type { ApiCard } from './types';

function apiCard(c: Partial<ApiCard> & Pick<ApiCard, 'code'>): ApiCard {
	return {
		name: c.code,
		pack_code: 'core',
		position: 1,
		type_code: 'asset',
		type_name: 'Asset',
		faction_code: 'neutral',
		quantity: 1,
		is_unique: false,
		exceptional: false,
		myriad: false,
		permanent: false,
		double_sided: false,
		...c
	};
}

describe('visibleCards', () => {
	it('keeps hidden investigators and drops hidden placeholders and back faces', () => {
		const back = apiCard({ code: '03009b', hidden: true });
		const cards = [
			apiCard({ code: '01000', hidden: true, type_code: 'treachery' }),
			apiCard({ code: '98001', hidden: true, type_code: 'investigator' }),
			apiCard({ code: '03009', linked_card: back }),
			back
		];
		expect(visibleCards(cards).map((c) => c.code)).toEqual(['98001', '03009']);
	});
});
