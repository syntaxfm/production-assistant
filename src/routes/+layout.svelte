<script lang="ts">
	import 'temporal-polyfill/global';
  import { onNavigate } from "$app/navigation";
	import { app_data } from "$state/Project.svelte";
	import './style.css';
	let {children} = $props();
	app_data.sync();


		onNavigate(async (navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((oldStateCaptureResolve) => {
			document.startViewTransition(async () => {
				oldStateCaptureResolve();
				await navigation.complete;
			});
		});
	});
</script>

<main class="layout">
	{@render children()}
</main>