<script lang="ts">
	import { imageUrls } from '#lib/arkham/images.ts';
	import { factionColor } from '#lib/arkham/factions.ts';
	import { formatCardText } from '#lib/arkham/text.ts';
	import type { Card } from '#lib/arkham/types.ts';

	let { card, back = false }: { card: Card; back?: boolean } = $props();

	const urls = $derived(imageUrls(card, back));
	// A string, so a refreshed but identical card does not count as a change:
	// the browser would not reload an unchanged src and the image would never
	// report loaded again.
	const urlKey = $derived(urls.join(' '));
	let attempt = $state(0);
	let loaded = $state(false);

	// A different card or face starts again from the best image source.
	$effect.pre(() => {
		void urlKey;
		attempt = 0;
		loaded = false;
	});

	const src = $derived(urls[attempt]);
	// Investigators are printed landscape on both sides. The size attributes
	// only reserve the right shape until the real image arrives.
	const landscape = $derived(card.type === 'investigator');
</script>

{#if src}
	<img
		{src}
		alt={back ? `${card.name} (back)` : card.name}
		width={landscape ? 1050 : 750}
		height={landscape ? 750 : 1050}
		class:loaded
		style:--faction={factionColor(card.factions[0])}
		draggable="false"
		decoding="async"
		onload={() => (loaded = true)}
		onerror={() => attempt++}
	/>
{:else}
	<div class="text-card" class:landscape style:--faction={factionColor(card.factions[0])}>
		<div class="title">
			{back ? (card.backName ?? card.name) : card.name}
			{#if card.subname && !back}<small>{card.subname}</small>{/if}
		</div>
		<div class="type">
			{card.typeName}{card.xp ? ` · Level ${card.xp}` : ''}{card.cost != null && !back
				? ` · Cost ${card.cost < 0 ? 'X' : card.cost}`
				: ''}
		</div>
		{#if card.traits && !back}<div class="traits">{card.traits}</div>{/if}
		<div class="body">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- formatCardText escapes its input -->
			{@html formatCardText(back ? card.backText : card.text)}
		</div>
		<div class="note">No card image available yet</div>
	</div>
{/if}

<style>
	img {
		display: block;
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: var(--face-max-h, 100%);
		border-radius: 4.5% / 3.2%;
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.6);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--faction) 30%, var(--bg-raised)),
			var(--bg-sunken)
		);
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	img:not(.loaded) {
		animation: pulse 1.2s ease-in-out infinite alternate;
	}

	@keyframes pulse {
		from {
			opacity: 0.5;
		}
		to {
			opacity: 0.9;
		}
	}

	.text-card {
		aspect-ratio: 5 / 7;
		width: min(100%, var(--face-max-h, 100%) * 5 / 7);
		overflow: auto;
		padding: 18px;
		border-radius: 14px;
		border: 3px solid var(--faction);
		background: var(--bg-raised);
		display: flex;
		flex-direction: column;
		gap: 8px;
		user-select: none;
	}

	.text-card.landscape {
		aspect-ratio: 7 / 5;
		width: min(100%, var(--face-max-h, 100%) * 7 / 5);
	}

	.title {
		font-family: Georgia, serif;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.title small {
		display: block;
		font-size: 0.85rem;
		font-style: italic;
		color: var(--text-dim);
	}

	.type,
	.traits {
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	.traits {
		font-style: italic;
		font-weight: 600;
	}

	.body {
		flex: 1;
		font-size: 0.95rem;
	}

	.body :global(.icon) {
		font-weight: 600;
	}

	.note {
		font-size: 0.75rem;
		color: var(--text-dim);
		text-align: center;
	}
</style>
