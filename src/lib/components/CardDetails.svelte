<script lang="ts">
	import { factionInk, factionName } from '#lib/arkham/factions.ts';
	import { ICONS, SKILLS } from '#lib/arkham/icons.ts';
	import { formatCardText } from '#lib/arkham/text.ts';
	import { ARKHAMDB } from '#lib/arkham/api.ts';
	import type { Card } from '#lib/arkham/types.ts';
	import GameIcon from './GameIcon.svelte';

	let { card, packName, signatureFor }: { card: Card; packName: string; signatureFor: string[] } =
		$props();

	const investigator = $derived(card.type === 'investigator');
	const weakness = $derived(
		card.subtype === 'basicweakness'
			? 'basic weakness'
			: card.subtype === 'weakness'
				? 'weakness'
				: ''
	);
	// "level 0" matters to a new player: it is what a starting deck may use.
	const level = $derived(investigator || card.xp === undefined ? '' : `, level ${card.xp}`);
	const skills = $derived(
		SKILLS.map((name, i) => ({ name, count: card.icons[i] })).filter((s) => s.count > 0)
	);
	const cost = $derived(
		card.cost === undefined || card.cost === null ? '' : card.cost < 0 ? 'X' : String(card.cost)
	);
	// Text of the printed back only matters here when no back image is shown.
	const showBackText = $derived(!!card.backText && !investigator);
</script>

<article>
	<h2>
		{card.name}
		{#if card.subname}<small>{card.subname}</small>{/if}
	</h2>

	<p class="kind">
		{#if weakness}
			{card.typeName}, {weakness}.
		{:else}
			{#each card.factions as f, i (f)}
				{#if i > 0}and{' '}{/if}<span class="class" style:color={factionInk(f)}
					><GameIcon name={f} />{factionName(f)}</span
				>{' '}
			{/each}{card.typeName.toLowerCase()}{level}.
		{/if}
		{#if card.unique}Unique.{/if}
	</p>

	<dl>
		{#if cost}<div>
				<dt>Cost</dt>
				<dd>{cost}</dd>
			</div>{/if}
		{#if card.slot}<div>
				<dt>Slot</dt>
				<dd>{card.slot}</dd>
			</div>{/if}
		{#if skills.length}
			<div class:wide={investigator}>
				<dt>{investigator ? 'Skills' : 'Skill icons'}</dt>
				<dd class="skills">
					{#each skills as s (s.name)}
						{#if investigator}
							<span><GameIcon name={s.name} label />&nbsp;{s.count}</span>
						{:else}
							<span>
								{#each { length: s.count }, n (n)}<GameIcon name={s.name} />{/each}{ICONS[s.name]
									.label}
							</span>
						{/if}
					{/each}
				</dd>
			</div>
		{/if}
		{#if card.health != null}<div>
				<dt>Health</dt>
				<dd>{card.health}</dd>
			</div>{/if}
		{#if card.sanity != null}<div>
				<dt>Sanity</dt>
				<dd>{card.sanity}</dd>
			</div>{/if}
	</dl>

	{#if card.traits}<p class="traits">{card.traits}</p>{/if}

	{#if card.text}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- formatCardText escapes its input -->
		<p class="text">{@html formatCardText(card.text)}</p>
	{/if}

	{#if showBackText}
		<h3>Other side{card.backName && card.backName !== card.name ? `: ${card.backName}` : ''}</h3>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- formatCardText escapes its input -->
		<p class="text">{@html formatCardText(card.backText)}</p>
	{/if}

	{#if card.customization}
		<h3>Customization</h3>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- formatCardText escapes its input -->
		<p class="text">{@html formatCardText(card.customization)}</p>
	{/if}

	{#if card.flavor}<p class="flavor">{card.flavor}</p>{/if}

	{#if signatureFor.length}
		<p>Signature card of {signatureFor.join(' and ')}.</p>
	{/if}

	<p class="meta">
		{packName} #{card.position}{card.quantity > 1 ? `, ${card.quantity} copies` : ''}
		{#if card.illustrator}<br />Art by {card.illustrator}{/if}
		<br /><a href="{ARKHAMDB}/card/{card.code}" target="_blank" rel="noopener">
			Rulings and reviews on ArkhamDB
		</a>
	</p>
</article>

<style>
	article {
		max-width: 560px;
		margin: 0 auto;
		padding: 16px 20px 40px;
	}

	h2 {
		margin: 0;
		font-size: 1.45rem;
	}

	h2 small {
		display: block;
		font-size: 0.95rem;
		font-style: italic;
		color: var(--text-dim);
	}

	h3 {
		margin: 16px 0 4px;
		font-size: 1.05rem;
	}

	.kind {
		margin: 4px 0 12px;
		color: var(--text-dim);
	}

	.class {
		font-weight: 600;
	}

	.class :global(.icon) {
		margin-right: 0.25em;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
		margin: 0 0 12px;
		font-size: 0.9rem;
	}

	dl div {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	dt {
		color: var(--text-dim);
	}

	dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 14px;
	}

	.skills :global(.icon) {
		margin-right: 3px;
	}

	/* Four named skills need a line of their own. */
	dl .wide {
		flex-basis: 100%;
	}

	.traits {
		margin: 0 0 8px;
		font-style: italic;
		font-weight: 600;
	}

	.text {
		margin: 0 0 12px;
	}

	.flavor {
		font-family: Georgia, serif;
		font-style: italic;
		color: var(--text-dim);
	}

	.meta {
		margin-top: 20px;
		font-size: 0.85rem;
		color: var(--text-dim);
	}
</style>
