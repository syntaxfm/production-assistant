<script lang="ts">
	import { page } from '$app/stores';
	import { app_data } from '$state/Project.svelte';
	import { fade, fly } from 'svelte/transition';

	let { children, data } = $props();

	let links = [
		{
			text: 'Show',
			href: `/project/${data.id}`
		},
		{
			text: 'Notes',
			href: `/project/${data.id}/notes`
		},
		{
			text: 'Thumbnails',
			href: `/project/${data.id}/thumbnails`
		},
		{
			text: 'Publish',
			href: `/project/${data.id}/publish`
		}
	];
</script>

<div class="two-col">
	<aside transition:fly={{ x: -200, duration: 200 }}>
		<ul class="no-list">
			<li><a href="/">All Projects</a></li>
			{#each links as link}
				<li>
					<a aria-current={$page.url.pathname === link.href} href={link.href}>{link.text}</a>
				</li>
			{/each}
		</ul>
	</aside>
	<section class="container layout">
		<div class="content">
			<h1
				oninput={(e) => {
					const target = e.target as HTMLElement;
					app_data.save({ id: data.id, name: target?.textContent ?? '' });
				}}
				contenteditable
			>
				{app_data.project?.name || 'Loading...'}
			</h1>

			<div style="display: grid">
				{#key data.pathname}
					<div transition:fade style="grid-row: 1 / -1; grid-column: 1 / -1;">
						{@render children()}
					</div>
				{/key}
			</div>
		</div>
	</section>
</div>

<style>
	.two-col {
		display: grid;
		grid-template-columns: 160px 1fr;
	}

	aside {
		padding-block-start: 6rem;
		padding-inline-end: 30px;
		border-inline-end: 1px solid var(--tint-or-shade);
		li {
			font-size: var(--fs-xxs);
			a {
				opacity: 0.7;
				transition: opacity 200ms;
				text-decoration: none;
				color: var(--fg);
				display: block;
				padding: 2px 8px;
				border-radius: 8px;
				&[aria-current='true'] {
					background: var(--tint-or-shade);
					box-shadow: 1px 1px 4px rgb(0 0 0 / 0.4);
					opacity: 1;
				}
			}
		}
	}

	h1 {
		margin-top: 6rem;
		margin-bottom: 2rem;
		&:focus {
			outline: none;
			border-bottom: solid 1px var(--yellow);
		}
	}

	.container {
		min-height: 100vh;
	}
</style>
