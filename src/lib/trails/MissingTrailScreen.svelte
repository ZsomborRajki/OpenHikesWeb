<!-- What a link to a trail shows when the library has no such trail. -->
<script lang="ts">
	import Mountain from '@lucide/svelte/icons/mountain';
	import EmptyState from '#lib/design/EmptyState.svelte';
	import Screen from '#lib/design/Screen.svelte';
	import ScreenHeader from '#lib/design/ScreenHeader.svelte';

	let { backHref }: { backHref: string } = $props();
</script>

<Screen>
	<ScreenHeader title="Trail Not Found" back={{ href: backHref, label: 'Trails' }} />
	<EmptyState icon={Mountain} title="Not in This Library">
		The trail may have been deleted, or added in another browser.
	</EmptyState>
</Screen>
