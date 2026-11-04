<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { cardStore } from '#lib/cards.svelte.ts';
	import { settings } from '#lib/settings.svelte.ts';
	import { cardsFor, nameInCycle, type CycleGroup, type Product } from '#lib/arkham/collection.ts';
	import { isFiltered, matches } from '#lib/arkham/filters.ts';

	// Chapter One has years of side products; tuck those away. Later chapters
	// are small enough to show their starter decks next to the core set.
	const isExtra = (g: CycleGroup) => g.side && g.chapter === 1;
	const main = $derived(cardStore.groups.filter((g) => !isExtra(g)));
	const side = $derived(cardStore.groups.filter(isExtra));
	// Newest chapter first: that is the core set a new player buys today.
	const chapters = $derived([...new Set(main.map((g) => g.chapter))].sort((a, b) => b - a));

	// A year every product shares goes on the heading instead of each row.
	function sharedYear(products: Product[]): string {
		const years = new Set(products.map((p) => p.year));
		return products.length > 1 && years.size === 1 ? products[0].year : '';
	}

	const ownedProducts = $derived(
		settings.owned.map((c) => cardStore.products.get(c)).filter((p) => p !== undefined)
	);
	const ownedCards = $derived(cardStore.data ? cardsFor(cardStore.data, ownedProducts) : []);
	const shownCount = $derived(ownedCards.filter((c) => matches(c, settings.filters)).length);

	// A collection link (?own=core_2026,dwlp) restores the ticks on any device.
	// Safari may wipe site storage after a week without a visit, so the link
	// is the durable copy.
	onMount(() => {
		const own = page.url.searchParams.get('own');
		if (own === null) return;
		const codes = own.split(',').filter(Boolean);
		const same = codes.length === settings.owned.length && codes.every((c) => settings.isOwned(c));
		// Someone else's link must not silently overwrite your own ticks.
		if (
			!same &&
			(settings.owned.length === 0 ||
				confirm('Replace the boxes ticked in this browser with the ones from this link?'))
		) {
			settings.setOwned(codes);
		}
		// A real (not shallow) navigation, so going Back later does not bring
		// the link, and its import, back.
		const url = new URL(page.url.href);
		url.searchParams.delete('own');
		goto(url.href, { replace: true, reset: false });
	});

	let copied = $state(false);
	async function shareCollection() {
		const url = new URL(resolve('/'), location.href);
		url.searchParams.set('own', settings.owned.join(','));
		try {
			if (navigator.share) {
				await navigator.share({ title: 'My Arkham Horror collection', url: url.href });
			} else {
				await navigator.clipboard.writeText(url.href);
				copied = true;
				setTimeout(() => (copied = false), 2000);
			}
		} catch {
			// The share sheet was dismissed.
		}
	}

	const updated = $derived(
		cardStore.data ? new Date(cardStore.data.fetchedAt).toLocaleDateString() : ''
	);
</script>

<main>
	<header>
		<h1>Arkham Study</h1>
		<p class="tagline">
			Flip through the Arkham Horror LCG player cards like they are in your hands. Tick what you
			own, or open any box to see what is inside.
		</p>
	</header>

	{#if cardStore.error && !cardStore.data}
		<div class="notice">
			<p>Could not load cards from ArkhamDB: {cardStore.error}</p>
			<button class="btn" onclick={() => cardStore.refresh()}>Try again</button>
		</div>
	{:else if !cardStore.data}
		<p class="notice">Loading cards from ArkhamDB...</p>
	{:else}
		{#each chapters as chapter (chapter)}
			{#if chapters.length > 1}
				<h2 class="chapter">Chapter {chapter === 1 ? 'One' : chapter === 2 ? 'Two' : chapter}</h2>
			{/if}
			{#each main.filter((g) => g.chapter === chapter) as group (group.cycle)}
				{@render cycle(group)}
			{/each}
		{/each}

		<details class="side">
			<summary>
				More products
				<small>Starter decks, Return to boxes, parallel investigators and promos</small>
			</summary>
			{#each side as group (group.cycle)}
				{@render cycle(group)}
			{/each}
		</details>

		<footer>
			{#if settings.owned.length}
				<p>
					Your ticks are saved in this browser. To keep them safe or use them on another device,
					<button class="link" onclick={shareCollection}>
						{copied ? 'link copied' : 'save a link to your collection'}
					</button>.
				</p>
			{/if}
			<p>
				Card data and images from <a href="https://arkhamdb.com">ArkhamDB</a> and
				<a href="https://arkham.build">arkham.build</a>, updated {updated}.
				<button class="link" onclick={() => cardStore.refresh()} disabled={cardStore.refreshing}>
					{cardStore.refreshing ? 'Refreshing...' : 'Refresh now'}
				</button>
			</p>
			<p>
				Arkham Horror: The Card Game and all card images are © Fantasy Flight Games. This is an
				unofficial fan project.
			</p>
		</footer>
	{/if}
</main>

<nav class="cta">
	{#if settings.owned.length}
		<a class="btn primary" href={resolve('/view')}>
			View my cards
			<span class="count">
				{isFiltered(settings.filters) ? `${shownCount} of ${ownedCards.length}` : ownedCards.length}
			</span>
		</a>
	{:else}
		<span class="hint">Tick the boxes you own to build your collection.</span>
	{/if}
</nav>

{#snippet cycle(group: CycleGroup)}
	{@const current = group.products.filter((p) => !p.legacy)}
	{@const legacy = group.products.filter((p) => p.legacy)}
	<!-- Every cycle gets a heading, so a row never looks like it belongs to the
	     cycle above it. A lone product named exactly like its cycle needs none. -->
	{@const titled = group.products.length > 1 || group.products[0].name !== group.name}
	{@const year = titled ? sharedYear(current) : ''}
	<section class="cycle">
		{#if titled}
			<h3>
				{group.name}{#if year}<span class="year">{year}</span>{/if}
			</h3>
		{/if}
		<ul>
			{#each current as product (product.code)}
				{@render row(product, nameInCycle(product, group), year ? '' : product.year)}
			{/each}
		</ul>
		{#if legacy.length}
			{@const legacyYear = sharedYear(legacy)}
			<details>
				<summary>Original {legacy.length} packs{legacyYear ? `, ${legacyYear}` : ''}</summary>
				<ul>
					{#each legacy as product (product.code)}
						{@render row(product, nameInCycle(product, group), legacyYear ? '' : product.year)}
					{/each}
				</ul>
			</details>
		{/if}
	</section>
{/snippet}

{#snippet row(product: Product, label: string, year: string)}
	{@const owned = settings.isOwned(product.code)}
	<li class:owned>
		<label class="own">
			<input type="checkbox" checked={owned} onchange={() => settings.toggleOwned(product.code)} />
			<span class="visually-hidden">I own {product.name}</span>
		</label>
		<a class="open" href={resolve(`/view?p=${product.code}`)}>
			<span class="name">{label}</span>
			<span class="meta">
				{product.cardCount} cards{year && !label.includes(year) ? ` · ${year}` : ''}
			</span>
		</a>
	</li>
{/snippet}

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: calc(24px + env(safe-area-inset-top)) 16px 120px;
	}

	header h1 {
		margin: 0 0 8px;
		font-size: 2.1rem;
	}

	.tagline {
		margin: 0;
		color: var(--text-dim);
	}

	.notice {
		margin-top: 24px;
		padding: 16px;
		background: var(--bg-raised);
		border-radius: var(--radius);
	}

	.chapter {
		margin: 36px 0 0;
		font-size: 1.5rem;
	}

	.cycle {
		margin-bottom: 8px;
	}

	/* The cycle name stays pinned while its products scroll past. */
	.cycle h3 {
		position: sticky;
		top: env(safe-area-inset-top);
		z-index: 1;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin: 0;
		padding: 16px 0 6px;
		font-size: 1.15rem;
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}

	.year {
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		position: relative;
		display: flex;
		align-items: stretch;
	}

	/* Hairlines start where the names do, so the checkboxes read as a column. */
	li + li::before,
	details li:first-child::before,
	.cycle details > summary::before {
		content: '';
		position: absolute;
		top: 0;
		left: 48px;
		right: 0;
		border-top: 1px solid var(--line);
	}

	/* The whole left strip, out into the page margin, toggles the tick. */
	.own {
		display: flex;
		align-items: center;
		width: 64px;
		margin-left: -16px;
		padding-left: 16px;
		flex: none;
		cursor: pointer;
	}

	.own input {
		width: 22px;
		height: 22px;
		margin: 0;
		accent-color: var(--owned);
		cursor: pointer;
	}

	.open {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 56px;
		padding: 8px 28px 8px 0;
		color: var(--text);
		text-decoration: none;
		background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16"><path d="M2 2l6 6-6 6" stroke="%23a89c8c" stroke-width="2" fill="none"/></svg>')
			no-repeat right 4px center;
	}

	.meta {
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	li.owned .name {
		color: var(--owned);
	}

	details > summary {
		position: relative;
		list-style: none;
		cursor: pointer;
	}

	details > summary::-webkit-details-marker {
		display: none;
	}

	details > summary::after {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		margin-left: 10px;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: translateY(-3px) rotate(45deg);
	}

	details[open] > summary::after {
		transform: translateY(1px) rotate(-135deg);
	}

	.cycle details > summary {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding-left: 48px;
		font-size: 0.9rem;
		color: var(--text-dim);
	}

	.side {
		margin-top: 36px;
		border-top: 1px solid var(--line);
	}

	.side > summary {
		padding: 14px 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.5rem;
	}

	.side > summary small {
		display: block;
		font-family: system-ui, sans-serif;
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	.side > summary::after {
		position: absolute;
		right: 6px;
		top: 26px;
		margin: 0;
	}

	.hint {
		color: var(--text-dim);
		font-size: 0.9rem;
	}

	footer {
		margin-top: 40px;
		font-size: 0.8rem;
		color: var(--text-dim);
	}

	.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--text);
		text-decoration: underline;
		text-decoration-color: var(--text-dim);
		text-underline-offset: 0.15em;
	}

	.cta {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
		background: linear-gradient(transparent, var(--bg) 35%);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: var(--tap);
		padding: 10px 20px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--bg-raised);
		color: var(--text);
		text-decoration: none;
		font-weight: 600;
	}

	.btn.primary {
		background: var(--owned);
		border-color: var(--owned);
		color: var(--owned-ink);
		box-shadow: 0 6px 20px rgb(0 0 0 / 0.5);
	}

	.count {
		padding: 1px 8px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.2);
		font-size: 0.85rem;
	}
</style>
