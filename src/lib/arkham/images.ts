import { ARKHAMDB } from './api';
import type { Card } from './types';

const HD = 'https://assets.arkham.build/optimized';

/**
 * Candidate image URLs for one face of a card, best first. The viewer tries
 * them in order and falls back to a text rendering when all fail.
 *
 * arkham.build serves 750x1050 AVIF scans; ArkhamDB's own images are 300x419
 * PNG, which looks soft on a phone screen but is the documented source.
 */
export function imageUrls(card: Card, back = false): string[] {
	const own = back ? card.backImg : card.img;
	return [`${HD}/${back ? backCode(card) : card.code}.avif`, ...(own ? [ARKHAMDB + own] : [])];
}

function backCode(card: Card): string {
	// A linked back face has its own code (such as "03009b"); a printed back
	// of a double-sided card uses the front code with a "b" suffix.
	const m = card.backImg?.match(/\/([^/]+)\.(png|jpe?g)$/);
	return m ? m[1] : `${card.code}b`;
}
