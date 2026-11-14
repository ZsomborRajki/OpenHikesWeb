<!-- Asks for a GPX file. The browser's own file input does the asking, kept out of sight. -->
<script lang="ts">
	import FileUp from '@lucide/svelte/icons/file-up';
	import ActionButton from '#lib/design/ActionButton.svelte';
	import { GPX_MIME_TYPE } from './gpx-writer.ts';

	interface Props {
		onPick: (file: File) => void;
	}

	let { onPick }: Props = $props();

	let input = $state<HTMLInputElement>();

	function pick(): void {
		const file = input?.files?.item(0);
		if (file) onPick(file);
		// Cleared, so choosing the same file again is still a change.
		if (input) input.value = '';
	}
</script>

<input
	bind:this={input}
	type="file"
	accept=".gpx,{GPX_MIME_TYPE}"
	hidden
	onchange={pick}
	aria-label="GPX file"
/>
<ActionButton icon={FileUp} onclick={() => input?.click()}>Import GPX</ActionButton>
