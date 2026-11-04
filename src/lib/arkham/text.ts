import { iconHtml } from './icons';

function escape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Turns ArkhamDB card text into safe HTML. Everything is escaped first, then
 * the few inline tags ArkhamDB uses (<b>, <i>, <em>, <strong>, <u>, <cite>)
 * are restored and game icons such as "[reaction]" become their symbols.
 */
export function formatCardText(text: string | undefined): string {
	if (!text) return '';
	const normalized = text
		// Some texts spell icons as HTML spans instead of [tokens].
		.replace(/<span class="icon-([a-z_]+)"[^>]*>\s*<\/span>/g, '[$1]')
		.replace(/<\/?(p|br|hr)\s*\/?>/g, '\n')
		.replace(/<\/?span[^>]*>/g, '')
		.replace(/\n{2,}/g, '\n')
		.trim();
	return escape(normalized)
		.replace(/&lt;(\/?)(b|i|em|strong|u|cite)&gt;/g, '<$1$2>')
		.replace(/\[\[([^\]]+)\]\]/g, '<b><i>$1</i></b>')
		.replace(/\[([a-z_]+)\]/g, (whole, key: string) => iconHtml(key) ?? whole)
		.replace(/\n/g, '<br>');
}
