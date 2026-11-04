import { describe, expect, it } from 'vitest';
import { formatCardText } from './text';

describe('formatCardText', () => {
	it('draws game icons as glyphs with their names and keeps line breaks', () => {
		expect(formatCardText('[reaction] After you defeat an enemy.\nFast.')).toBe(
			'<span class="term"><span class="icon icon-reaction" aria-hidden="true" data-glyph="!"></span>Reaction</span> After you defeat an enemy.<br>Fast.'
		);
	});

	it('writes out icons the font has no glyph for', () => {
		expect(formatCardText('a [neutral] card')).toBe('a Neutral card');
	});

	it('keeps the formatting tags ArkhamDB uses and escapes everything else', () => {
		expect(formatCardText('<b>Forced</b> - <script>x</script>')).toBe(
			'<b>Forced</b> - &lt;script&gt;x&lt;/script&gt;'
		);
	});

	it('renders trait references in bold italics', () => {
		expect(formatCardText('a [[Tome]] asset')).toBe('a <b><i>Tome</i></b> asset');
	});

	it('reads icons and paragraphs written as HTML', () => {
		expect(
			formatCardText(
				'<p>You are killed.</p><p><span class="icon-skull" title="Skull"></span>: -1.</p>'
			)
		).toBe(
			'You are killed.<br><span class="term"><span class="icon icon-skull" aria-hidden="true" data-glyph="k"></span>Skull</span>: -1.'
		);
	});

	it('leaves unknown bracket words alone', () => {
		expect(formatCardText('[mystery]')).toBe('[mystery]');
	});
});
