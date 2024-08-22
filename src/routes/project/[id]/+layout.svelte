<script lang="ts">
	import { page } from '$app/stores';
	import { app_data } from '$state/Project.svelte';
	import { fade, fly } from 'svelte/transition';

	let { children, data } = $props();

	let mounted = $state(false);

	$effect(() => {
		mounted = true;
	});

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
			text: 'Creative',
			href: `/project/${data.id}/creative`
		},
		{
			text: 'Publish',
			href: `/project/${data.id}/publish`
		}
	];
</script>

<div class="two-col">
	<aside>
		{#if mounted}
			<div class="sidebar" transition:fly={{ x: -200, duration: 200 }}>
				<ul class="no-list">
					<li>
						<a class="back" href="/"
							><svg class="icon stroke-1"><use href="#icon-left-arrow" /></svg>All Projects</a
						>
					</li>
					{#if app_data.project?.path}
						{#each links as link}
							<li>
								<a aria-current={$page.url.pathname === link.href} href={link.href}>{link.text}</a>
							</li>
						{/each}
					{:else}
						<li>
							<a
								aria-current={$page.url.pathname === `/project/${data.id}`}
								href={`/project/${data.id}`}>Show</a
							>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
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

			<div style="display: grid; height: 100%;">
				{#key data.pathname}
					<div transition:fade={{ duration: 200 }} style="grid-row: 1 / -1; grid-column: 1 / -1;">
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

	.sidebar {
		padding-block-start: 6rem;
		padding-inline-end: 30px;
		border-inline-end: 1px solid var(--tint-or-shade);
		height: 100%;
		li {
			font-size: var(--fs-xxs);
			a {
				opacity: 0.7;
				transition: opacity 200ms;
				text-decoration: none;
				color: var(--fg);
				display: block;
				padding: 2px 8px;
				display: flex;
				align-items: center;
				gap: 8px;
				border-radius: 8px;
				&[aria-current='true'] {
					background: var(--yellow);
					color: var(--bg);
					box-shadow: 1px 1px 4px rgb(0 0 0 / 0.4);
					opacity: 1;
					@media (prefers-color-scheme: light) {
						background: var(--fg);
						color: var(--bg);
					}
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

	.back {
		margin-bottom: 1rem;
	}
</style>
