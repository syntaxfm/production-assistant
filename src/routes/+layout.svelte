<script lang="ts">
	import 'temporal-polyfill/global';
	import { listen } from '@tauri-apps/api/event';
	import { onNavigate } from '$app/navigation';
	import { app_data } from '$state/Project.svelte';
	import './style.css';
	import { invoke } from '@tauri-apps/api/core';
	import { login_github } from '$/lib/auth/login';
	let { children } = $props();
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

	listen('login', (event) => {
		if (event.payload) {
			const url = new URL(event.payload as string);
			const code = url.searchParams.get('code');
			if (code) {
				invoke('hide_login_window');
				login_github(code);
			}
		}
	});
</script>

<main class="layout">
	{@render children()}
</main>
