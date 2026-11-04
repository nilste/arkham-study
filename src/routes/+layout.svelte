<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { cardStore } from '#lib/cards.svelte.ts';
	import type { LayoutProps } from './$types';
	import '../app.css';

	let { children }: LayoutProps = $props();

	cardStore.load();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Arkham Study</title>
</svelte:head>

{@render children()}
