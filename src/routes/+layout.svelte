<script lang="ts">
	import { app_data } from "$state/Project.svelte";
	import './style.css';
	let {children} = $props();
	app_data.sync();
</script>

<main class="layout">
	{@render children()}
</main>