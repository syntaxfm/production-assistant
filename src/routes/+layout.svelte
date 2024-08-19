<script lang="ts">
	import { data } from "$state/Project.svelte";
	import './style.css';
	let {children} = $props();
	data.sync();
</script>

{@render children()}