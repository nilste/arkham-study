export interface GameIcon {
	label: string;
	/** Character that draws the symbol in ArkhamDB's icon font. */
	glyph?: string;
}

/**
 * Game symbols, keyed by the token ArkhamDB card text uses ("[reaction]").
 * The glyphs index src/lib/assets/arkham-icons.woff. Neutral has no symbol of
 * its own, and the font has no wild icon: cards print that one as a question
 * mark, which the fallback font draws.
 */
export const ICONS: Record<string, GameIcon> = {
	action: { label: 'Action', glyph: 'i' },
	reaction: { label: 'Reaction', glyph: '!' },
	free: { label: 'Fast', glyph: 'j' },
	fast: { label: 'Fast', glyph: 'j' },
	willpower: { label: 'Willpower', glyph: 'p' },
	intellect: { label: 'Intellect', glyph: 'b' },
	combat: { label: 'Combat', glyph: 'c' },
	agility: { label: 'Agility', glyph: 'a' },
	wild: { label: 'Wild', glyph: '?' },
	elder_sign: { label: 'Elder Sign', glyph: 'o' },
	skull: { label: 'Skull', glyph: 'k' },
	cultist: { label: 'Cultist', glyph: 'l' },
	tablet: { label: 'Tablet', glyph: 'q' },
	elder_thing: { label: 'Elder Thing', glyph: 'n' },
	auto_fail: { label: 'Auto-fail', glyph: 'm' },
	bless: { label: 'Bless', glyph: 'v' },
	curse: { label: 'Curse', glyph: 'w' },
	frost: { label: 'Frost', glyph: 'x' },
	per_investigator: { label: 'per investigator', glyph: 'u' },
	guardian: { label: 'Guardian', glyph: 'f' },
	seeker: { label: 'Seeker', glyph: 'h' },
	rogue: { label: 'Rogue', glyph: 'd' },
	mystic: { label: 'Mystic', glyph: 'g' },
	survivor: { label: 'Survivor', glyph: 'e' },
	neutral: { label: 'Neutral' }
};

/** The skill icons in the order of `Card.icons`. */
export const SKILLS = ['willpower', 'intellect', 'combat', 'agility', 'wild'] as const;

/**
 * HTML for one game symbol: the glyph followed by its name, kept on one line.
 * The name stays visible because learning what each symbol means is the
 * point; a tooltip would never show on a phone.
 */
export function iconHtml(key: string): string | undefined {
	const icon = ICONS[key];
	if (!icon) return undefined;
	if (!icon.glyph) return icon.label;
	return `<span class="term"><span class="icon icon-${key}" aria-hidden="true" data-glyph="${icon.glyph}"></span>${icon.label}</span>`;
}
