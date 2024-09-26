<script lang="ts">
	import './style.css';
	import 'temporal-polyfill/global';
	import { listen } from '@tauri-apps/api/event';
	import { onNavigate } from '$app/navigation';
	import { app_data } from '$state/Project.svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { login_github, login_youtube, set_github_user_if_token } from '$/lib/auth/login';
	import '$lib/icons/style.css';
	let { children } = $props();

	// Makes sure local data is synced with app state
	app_data.sync();

	$effect(() => {
		set_github_user_if_token();
	});

	// Causes a basic page fade on nav
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
			// If the url is a fake syntax one, it's youtube. this is a hack but works
			if (url.href.includes('syntax.fm/some/not')) {
				if (code) {
					invoke('hide_login_window');
					login_youtube(code);
				}
			} else {
				if (code) {
					invoke('hide_login_window');
					login_github(code);
				}
			}
		}
	});
</script>

<main class="layout">
	{@render children()}
</main>

<svg xmlns="http://www.w3.org/2000/svg" style="height: 0; width: 0; position: absolute;"
	><symbol id="icon-wand-sparkle" viewBox="0 0 18 18"
		><title>wand sparkle</title><g class="nc-icon-wrapper"
			><rect
				x="1.168"
				y="7.414"
				width="15.653"
				height="3.182"
				rx="1"
				ry="1"
				transform="translate(-3.733 8.998) rotate(-45)"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
			></rect><line
				x1="10.387"
				y1="5.363"
				x2="12.637"
				y2="7.613"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
			></line><path
				d="M7.243,3.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
				fill="inherit"
				stroke="none"
			></path><path
				d="M16.658,11.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
				fill="inherit"
				stroke="none"
			></path><circle cx="9.25" cy="1.75" r=".75" fill="inherit" stroke="none"></circle></g
		></symbol
	><symbol id="icon-zoom" viewBox="0 0 48 48"
		><title>zoom</title><g class="nc-icon-wrapper" stroke-linecap="var(--icon-stroke-linecap-butt)"
			><line x1="44" y1="44" x2="31.314" y2="31.314" fill="none" stroke="inherit"></line>
			<circle cx="20" cy="20" r="16" fill="none" stroke="currentColor"></circle></g
		></symbol
	><symbol id="icon-youtube" viewBox="0 0 32 32"
		><title>youtube</title><g class="nc-icon-wrapper"
			><path
				d="M31.331,8.248c-.368-1.386-1.452-2.477-2.829-2.848-2.496-.673-12.502-.673-12.502-.673,0,0-10.007,0-12.502,.673-1.377,.37-2.461,1.462-2.829,2.848-.669,2.512-.669,7.752-.669,7.752,0,0,0,5.241,.669,7.752,.368,1.386,1.452,2.477,2.829,2.847,2.496,.673,12.502,.673,12.502,.673,0,0,10.007,0,12.502-.673,1.377-.37,2.461-1.462,2.829-2.847,.669-2.512,.669-7.752,.669-7.752,0,0,0-5.24-.669-7.752ZM12.727,20.758V11.242l8.364,4.758-8.364,4.758Z"
				stroke="none"
			></path></g
		></symbol
	><symbol id="icon-upload" viewBox="0 0 48 48"
		><title>upload</title><g
			class="nc-icon-wrapper"
			stroke-linecap="var(--icon-stroke-linecap-butt)"
			><line x1="24" y1="3" x2="24" y2="31" fill="none" stroke="inherit"></line><polyline
				points="15 12 24 3 33 12"
				fill="none"
				stroke="inherit"
			></polyline><path
				d="M32,20h6a4,4,0,0,1,4,4V41a4,4,0,0,1-4,4H10a4,4,0,0,1-4-4V24a4,4,0,0,1,4-4h6"
				fill="none"
				stroke="currentColor"
			></path></g
		></symbol
	><symbol id="icon-left-arrow" viewBox="0 0 24 24"
		><title>left arrow</title><g
			class="nc-icon-wrapper"
			stroke-linecap="var(--icon-stroke-linecap-butt)"
			><polyline
				fill="none"
				stroke="currentColor"
				points="17,2 7,12 17,22 "
				transform="translate(0, 0)"
			></polyline></g
		></symbol
	><symbol id="icon-download" viewBox="0 0 48 48"
		><title>download</title><g
			class="nc-icon-wrapper"
			stroke-linecap="var(--icon-stroke-linecap-butt)"
			><line x1="24" y1="34" x2="24" y2="3" fill="none" stroke="inherit"></line><polyline
				points="33 25 24 34 15 25"
				fill="none"
				stroke="inherit"
			></polyline><path
				d="M32,18h5a4,4,0,0,1,4,4V40a4,4,0,0,1-4,4H11a4,4,0,0,1-4-4V22a4,4,0,0,1,4-4h5"
				fill="none"
				stroke="currentColor"
			></path></g
		></symbol
	></svg
>
