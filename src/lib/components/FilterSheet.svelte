<script lang="ts">
	import { FACTIONS } from '#lib/arkham/factions.ts';
	import { KINDS, LEVELS, NO_FILTERS, matches, type Filters } from '#lib/arkham/filters.ts';
	import type { Card } from '#lib/arkham/types.ts';
	import GameIcon from './GameIcon.svelte';

	let {
		open = $bindable(false),
		filters,
		cards,
		onchange
	}: {
		open?: boolean;
		filters: Filters;
		cards: Card[];
		onchange: (f: Filters) => void;
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const count = $derived(cards.filter((c) => matches(c, filters)).length);

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && dialog.close()}
>
	<div class="sheet">
		<h2>Show me</h2>

		<fieldset>
			<legend>Class</legend>
			<div class="chips">
				{#each FACTIONS as f (f.code)}
					<button
						type="button"
						class="chip"
						style:--c={f.ink}
						aria-pressed={filters.factions.includes(f.code)}
						onclick={() => onchange({ ...filters, factions: toggle(filters.factions, f.code) })}
					>
						{@render check()}
						<span class="glyph"><GameIcon name={f.code} /></span>{f.name}
					</button>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend>Card type</legend>
			<div class="chips">
				{#each KINDS as k (k.code)}
					<button
						type="button"
						class="chip"
						aria-pressed={filters.kinds.includes(k.code)}
						onclick={() => onchange({ ...filters, kinds: toggle(filters.kinds, k.code) })}
					>
						{@render check()}{k.name}
					</button>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend>Experience</legend>
			<div class="segmented">
				{#each LEVELS as l (l.code)}
					<button
						type="button"
						aria-pressed={filters.level === l.code}
						onclick={() => onchange({ ...filters, level: l.code })}
					>
						{l.name}
					</button>
				{/each}
			</div>
			<p class="hint">
				Level 0 cards are what every new deck starts with. Upgrades cost experience earned in a
				campaign.
			</p>
		</fieldset>

		<div class="actions">
			<button type="button" class="btn" onclick={() => onchange(NO_FILTERS)}>Reset</button>
			<button type="button" class="btn primary" onclick={() => dialog.close()}>
				Show {count} cards
			</button>
		</div>
	</div>
</dialog>

<!-- Selection must not rest on colour alone. -->
{#snippet check()}
	<svg class="check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
		<path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" fill="none" />
	</svg>
{/snippet}

<style>
	dialog {
		width: 100%;
		max-width: 560px;
		margin: auto auto 0;
		padding: 0;
		border: none;
		border-radius: 20px 20px 0 0;
		background: var(--bg-raised);
		color: var(--text);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.6);
	}

	@media (min-width: 600px) {
		dialog {
			margin: auto;
			border-radius: 20px;
		}
	}

	.sheet {
		padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
	}

	h2 {
		margin: 0 0 12px;
		font-size: 1.2rem;
	}

	fieldset {
		margin: 0 0 16px;
		padding: 0;
		border: none;
	}

	legend {
		margin-bottom: 8px;
		font-size: 0.9rem;
		color: var(--text-dim);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		--c: var(--text);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 6px 14px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--bg-sunken);
	}

	.glyph {
		color: var(--c);
	}

	.glyph:empty {
		display: none;
	}

	.check {
		display: none;
		margin-left: -2px;
	}

	.chip[aria-pressed='true'] {
		border-color: var(--c);
		background: color-mix(in srgb, var(--c) 18%, var(--bg-sunken));
	}

	.chip[aria-pressed='true'] .check {
		display: block;
	}

	.segmented {
		display: flex;
		border: 1px solid var(--line);
		border-radius: 999px;
		overflow: hidden;
	}

	.segmented button {
		flex: 1;
		min-height: 40px;
		border: none;
		background: var(--bg-sunken);
	}

	.segmented button + button {
		border-left: 1px solid var(--line);
	}

	/* Outlined rather than filled, so it does not read as a second button
	   next to the solid "Show N cards". */
	.segmented button[aria-pressed='true'] {
		background: var(--bg-raised);
		box-shadow: inset 0 0 0 1.5px var(--text);
		border-radius: 999px;
		font-weight: 600;
	}

	.hint {
		margin: 8px 0 0;
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	.actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 8px;
	}

	.btn {
		min-height: var(--tap);
		padding: 10px 20px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--bg-sunken);
		font-weight: 600;
	}

	.btn.primary {
		background: var(--text);
		border-color: var(--text);
		color: var(--bg);
	}
</style>
