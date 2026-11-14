<!--
	The root: builds the app once and draws its one window. Every route below
	is a screen in the panel.
-->
<script lang="ts">
	import '#lib/design/tokens.css';
	import '#lib/design/base.css';
	import { MAPKIT_TOKEN } from '$app/env/public';
	import { page } from '$app/state';
	import { provideApp } from '#lib/app/app-context.ts';
	import { composeApp } from '#lib/app/composition.ts';
	import favicon from '#lib/assets/favicon.svg';
	import AppShell from '#lib/shell/AppShell.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const app = composeApp({ mapKitToken: MAPKIT_TOKEN });
	provideApp(app);
	void app.library.load();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppShell scene={app.scene} createMapSurface={app.createMapSurface} screenKey={page.url.pathname}>
	{@render children()}
</AppShell>
