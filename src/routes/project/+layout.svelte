<script lang="ts">
	import { app_data } from '$state/Project.svelte';
	let { children, data } = $props();
</script>

{#if data?.id}
	{#await app_data.load(data.id)}
		Loading...
	{:then _}
		{@render children()}
	{/await}
{/if}
