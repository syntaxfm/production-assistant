<script lang="ts">
	import { generate_titles } from '$lib/utils/ai/titles';
	import { app_data } from '$state/Project.svelte';
	import { fade } from 'svelte/transition';

	let titles_status: 'GENERATED' | 'INITIAL' | 'GENERATING' | 'ERROR' = $state(
		app_data.project?.ai_titles ? 'GENERATED' : 'INITIAL'
	);

	let { data } = $props();
	async function titles() {
		titles_status = 'GENERATING';
		try {
			if (app_data?.project?.name) {
				const ai_titles = await generate_titles(app_data.project?.name);
				app_data.save({ id: data.id, ai_titles }, true);
				titles_status = 'GENERATED';
			}
		} catch (e) {
			console.error(e);
			titles_status = 'ERROR';
		}
	}
</script>

<h2>Titles</h2>
{#if titles_status === 'GENERATED'}
	<button onclick={titles}
		><svg class="icon stroke-1"><use href="#icon-wand-sparkle" /></svg> Regenerate Titles</button
	>
	<ol class="click-bait">
		{#each app_data?.project?.ai_titles as title}
			<li>
				{title}
			</li>
		{/each}
	</ol>
{:else if titles_status === 'INITIAL'}<button onclick={titles}
		><svg class="icon stroke-1"><use href="#icon-wand-sparkle" /></svg> Generate Titles</button
	>
{:else if titles_status === 'GENERATING'}<progress></progress>
{:else if titles_status === 'ERROR'}
	<div class="error" transition:fade>
		<p>Oopsie, something went wrong</p>
	</div>
{/if}

<!-- <h3>Thumbnails</h3>
<button>Generate Thumbnail People</button> -->

<style>
	.click-bait {
		position: relative;
		margin-left: 35px;
		&:after {
			content: '';
			position: absolute;
			top: 40px;
			bottom: 40px;
			left: -30px;
			width: 8px;
			border-radius: 4px;
			background: linear-gradient(180deg, #7cd8fa, #f93004);
			z-index: 5;
		}
		li:first-child {
			position: relative;
			&:after {
				content: '❄️';
				position: absolute;
				left: -80px;
				background: var(--bg);
				top: 0;
				z-index: 10;
			}
		}
		li:last-child {
			position: relative;
			&:after {
				content: '🔥';
				position: absolute;
				left: -80px;
				background: var(--bg);
				bottom: 0;
				z-index: 10;
			}
		}
	}
</style>
