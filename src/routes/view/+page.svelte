<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { afterNavigate, goto } from '$app/navigation';
	import { cardStore } from '#lib/cards.svelte.ts';
	import { settings } from '#lib/settings.svelte.ts';
	import { canonicalizer, cardsFor } from '#lib/arkham/collection.ts';
	import { FACTIONS } from '#lib/arkham/factions.ts';
	import { KINDS, LEVELS, isFiltered, matches } from '#lib/arkham/filters.ts';
	import type { Card } from '#lib/arkham/types.ts';
	import CardFace from '#lib/components/CardFace.svelte';
	import CardDetails from '#lib/components/CardDetails.svelte';
	import FilterSheet from '#lib/components/FilterSheet.svelte';

	/** Slides this far from the current one get their images rendered. */
	const WINDOW = 2;

	const productParam = $derived(page.url.searchParams.get('p'));
	const viewKey = $derived(productParam ?? 'mine');
	const products = $derived(
		(productParam ? productParam.split(',') : settings.owned)
			.map((c) => cardStore.products.get(c))
			.filter((p) => p !== undefined)
	);
	const allCards = $derived(cardStore.data ? cardsFor(cardStore.data, products) : []);
	const cards = $derived(allCards.filter((c) => matches(c, settings.filters)));

	const title = $derived(
		!productParam
			? 'My cards'
			: products.length === 1
				? products[0].name
				: `${products.length} products`
	);

	const filterSummary = $derived.by(() => {
		const f = settings.filters;
		const parts = [
			f.factions.map((c) => FACTIONS.find((x) => x.code === c)?.name).join(', '),
			f.kinds.map((c) => KINDS.find((x) => x.code === c)?.name).join(', '),
			f.level === 'all' ? '' : LEVELS.find((x) => x.code === f.level)?.name
		];
		return parts.filter(Boolean).join(' · ');
	});

	const packNames = $derived(new Map(cardStore.data?.packs.map((p) => [p.code, p.name]) ?? []));
	const canon = $derived(cardStore.data ? canonicalizer(cardStore.data.cards) : (c: string) => c);
	const investigatorNames = $derived(
		new Map(
			cardStore.data?.cards
				.filter((c) => c.type === 'investigator')
				.map((c) => [canon(c.code), c.name]) ?? []
		)
	);

	let track = $state<HTMLElement>();
	let index = $state(0);
	let filtersOpen = $state(false);
	const flipped = new SvelteSet<string>();
	const current = $derived<Card | undefined>(cards[index]);

	// The card the person last moved to themselves. When filters change, the
	// viewer lands on it again, or on the next card still shown, so toggling a
	// filter on and off returns to the same card.
	let anchor: string | null = null;
	// True while the viewer scrolls by itself after the card list changed, so
	// those scroll events are not mistaken for the person moving.
	let jumping = false;

	$effect(() => {
		const list = cards;
		untrack(() => {
			const wanted = anchor ?? page.url.searchParams.get('c') ?? settings.lastSeen[viewKey] ?? null;
			let target = wanted ? list.findIndex((c) => c.code === wanted) : 0;
			if (target < 0 && wanted) {
				// The card was filtered out: land on the next one that is still shown.
				const pos = allCards.findIndex((c) => c.code === wanted);
				target = list.findIndex((c) => allCards.indexOf(c) >= pos);
				if (target < 0) target = list.length - 1;
			}
			target = Math.max(0, target);
			// The first card shown counts as chosen, until the person moves.
			anchor ??= list[target]?.code ?? null;
			index = target;
			jumping = true;
			tick().then(() => {
				scrollToIndex(target, 'auto');
				setTimeout(() => (jumping = false), 100);
			});
		});
	});

	// Remember the visible card, and put it in the URL so a reload or a shared
	// link opens on it.
	$effect(() => {
		const code = current?.code;
		if (!code) return;
		const view = viewKey;
		untrack(() => settings.remember(view, code));
		const timer = setTimeout(() => {
			const url = new URL(location.href);
			if (url.searchParams.get('c') === code) return;
			url.searchParams.set('c', code);
			goto(url.href, { replace: true, reset: false });
		}, 400);
		return () => clearTimeout(timer);
	});

	// Slide widths can be fractional (411.43px on many Android phones), and
	// rounding them drifts by a card or more across a long list.
	function slideWidth(): number {
		return track?.getBoundingClientRect().width ?? 1;
	}

	function scrollToIndex(i: number, behavior: ScrollBehavior = 'smooth') {
		track?.scrollTo({ left: i * slideWidth(), behavior });
	}

	function onScroll() {
		if (!track || jumping) return;
		const i = Math.round(track.scrollLeft / slideWidth());
		if (i !== index && i >= 0 && i < cards.length) {
			index = i;
			anchor = cards[i].code;
		}
	}

	function onKey(e: KeyboardEvent) {
		if (filtersOpen) return;
		if (e.key === 'ArrowRight') scrollToIndex(Math.min(index + 1, cards.length - 1));
		if (e.key === 'ArrowLeft') scrollToIndex(Math.max(index - 1, 0));
	}

	// Rotating the phone changes the slide width; stay on the same card.
	$effect(() => {
		if (!track) return;
		const ro = new ResizeObserver(() =>
			scrollToIndex(
				untrack(() => index),
				'auto'
			)
		);
		ro.observe(track);
		return () => ro.disconnect();
	});

	// The back arrow returns to the page the person came from instead of
	// stacking a new home page on top of the history.
	let cameFromApp = false;
	afterNavigate(({ from, to }) => {
		if (from && from.route.id !== to?.route.id) cameFromApp = true;
	});

	function back(e: MouseEvent) {
		if (!cameFromApp) return;
		e.preventDefault();
		history.back();
	}

	function toggleFlip(card: Card) {
		if (!card.hasBack || card.type === 'investigator') return;
		if (flipped.has(card.code)) flipped.delete(card.code);
		else flipped.add(card.code);
	}

	function signatureOwners(card: Card): string[] {
		return (card.signatureOf ?? [])
			.map((code) => investigatorNames.get(canon(code)))
			.filter((n): n is string => !!n)
			.filter((n, i, all) => all.indexOf(n) === i);
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="viewer">
	<header class="bar">
		<a class="icon-btn" href={resolve('/')} aria-label="Back to collection" onclick={back}>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" fill="none" />
			</svg>
		</a>
		<div class="heading">
			<h1>{title}</h1>
			<p>
				{#if cards.length}{index + 1} / {cards.length}{/if}
				{#if filterSummary}<span class="summary"> · {filterSummary}</span>{/if}
			</p>
		</div>
		<button
			class="icon-btn"
			class:active={isFiltered(settings.filters)}
			aria-label="Filters"
			onclick={() => (filtersOpen = true)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="2.2" fill="none" />
			</svg>
		</button>
	</header>

	{#if !cardStore.data}
		<div class="empty">
			{#if cardStore.error}
				<p>{cardStore.error}</p>
				<button class="btn" onclick={() => cardStore.refresh()} disabled={cardStore.refreshing}>
					{cardStore.refreshing ? 'Trying...' : 'Try again'}
				</button>
			{:else}
				<p>Loading cards from ArkhamDB...</p>
			{/if}
		</div>
	{:else if products.length === 0}
		<div class="empty">
			<p>
				{productParam ? 'That product was not found.' : 'You have not ticked any products yet.'}
			</p>
			<a class="btn" href={resolve('/')}>Choose what you own</a>
		</div>
	{:else if cards.length === 0}
		<div class="empty">
			<p>No cards match these filters.</p>
			<button class="btn" onclick={() => (filtersOpen = true)}>Change filters</button>
		</div>
	{:else}
		<div class="track" bind:this={track} onscroll={onScroll}>
			{#each cards as card, i (card.code)}
				<section class="slide" aria-label={card.name}>
					{#if Math.abs(i - index) <= WINDOW}
						{@const flippable = card.hasBack && card.type !== 'investigator'}
						<div class="stage" class:flippable>
							<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
							<div
								class="faces"
								class:pair={card.type === 'investigator'}
								onclick={() => toggleFlip(card)}
							>
								{#if card.type === 'investigator'}
									<div class="face"><CardFace {card} /></div>
									<div class="face"><CardFace {card} back /></div>
								{:else}
									<div class="face"><CardFace {card} back={flipped.has(card.code)} /></div>
								{/if}
							</div>
							{#if flippable}
								<p class="flip-hint">Tap the card to turn it over</p>
							{/if}
						</div>
						<CardDetails
							{card}
							packName={packNames.get(card.pack) ?? card.pack}
							signatureFor={signatureOwners(card)}
						/>
					{/if}
				</section>
			{/each}
		</div>

		<footer class="scrub">
			<button
				class="icon-btn step"
				aria-label="Previous card"
				disabled={index === 0}
				onclick={() => scrollToIndex(index - 1)}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" fill="none" />
				</svg>
			</button>
			<input
				type="range"
				min="0"
				max={cards.length - 1}
				value={index}
				aria-label="Jump to card"
				oninput={(e) => {
					index = e.currentTarget.valueAsNumber;
					anchor = cards[index].code;
					scrollToIndex(index, 'auto');
				}}
			/>
			<button
				class="icon-btn step"
				aria-label="Next card"
				disabled={index === cards.length - 1}
				onclick={() => scrollToIndex(index + 1)}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" fill="none" />
				</svg>
			</button>
		</footer>
	{/if}
</div>

<FilterSheet
	bind:open={filtersOpen}
	filters={settings.filters}
	cards={allCards}
	onchange={(f) => settings.setFilters(f)}
/>

<style>
	.viewer {
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-rows: auto 1fr auto;
		background: radial-gradient(ellipse at 50% 35%, #2a231d, var(--bg) 70%);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: calc(4px + env(safe-area-inset-top)) 4px 4px;
		min-height: 56px;
	}

	.heading {
		flex: 1;
		min-width: 0;
		text-align: center;
	}

	.heading h1 {
		margin: 0;
		font-size: 1.05rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.heading p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.summary {
		color: var(--text);
	}

	.icon-btn {
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		flex: none;
		border: none;
		border-radius: 50%;
		background: none;
		color: var(--text);
	}

	.icon-btn.active {
		color: var(--bg);
		background: var(--text);
	}

	.icon-btn:disabled {
		opacity: 0.3;
	}

	.track {
		display: flex;
		min-height: 0;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
	}

	.track::-webkit-scrollbar {
		display: none;
	}

	.slide {
		flex: 0 0 100%;
		height: 100%;
		/* Lets the card size itself against the slide height (cqh). */
		container-type: size;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior-y: contain;
		scroll-snap-align: center;
		scroll-snap-stop: always;
		scrollbar-width: none;
	}

	/* The card fills the screen, centred, and the details start below the fold. */
	.stage {
		--hint: 0px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 100cqh;
		padding: 12px 16px;
	}

	/* Room for the flip hint: its top margin plus one line. */
	.stage.flippable {
		--hint: 28px;
	}

	.faces {
		--face-max-h: calc(100cqh - 24px - var(--hint));
		display: flex;
		flex-direction: column;
		gap: 12px;
		/* Quick taps flip cards; without this iOS may read them as double-tap zoom. */
		touch-action: manipulation;
	}

	.pair {
		--face-max-h: calc((100cqh - 36px) / 2);
	}

	.flippable .faces {
		cursor: pointer;
	}

	.face {
		display: flex;
		justify-content: center;
	}

	.flip-hint {
		margin: 8px 0 0;
		line-height: 20px;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	.scrub {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 4px calc(4px + env(safe-area-inset-bottom));
	}

	.scrub input {
		flex: 1;
		accent-color: var(--text);
		height: var(--tap);
	}

	/* Touch screens swipe; the step buttons are for mouse users. */
	@media (hover: none) {
		.step {
			display: none;
		}
		/* Keep the thumb clear of the screen edge, where a swipe means "back". */
		.scrub {
			padding-inline: 32px;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 24px;
		text-align: center;
		color: var(--text-dim);
	}

	.btn {
		display: inline-flex;
		min-height: var(--tap);
		align-items: center;
		padding: 10px 20px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--bg-raised);
		color: var(--text);
		text-decoration: none;
		font-weight: 600;
	}
</style>
