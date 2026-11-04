<script lang="ts">
	import { ICONS } from '#lib/arkham/icons.ts';

	/** Without `label`, the glyph must sit next to text that names it. */
	let { name, label = false }: { name: string; label?: boolean } = $props();

	const icon = $derived(ICONS[name]);
</script>

{#if icon?.glyph}<span class="icon icon-{name}" aria-hidden="true" data-glyph={icon.glyph}
	></span>{/if}{#if label}{icon?.label}{/if}
