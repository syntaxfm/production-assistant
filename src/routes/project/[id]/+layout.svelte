<script lang="ts">
	import { page } from '$app/stores';
	import { app_data } from '$state/Project.svelte';

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
	<aside>
		<ul class="no-list">
			{#each links as link}
				<li>
					<a aria-current={$page.url.pathname.includes(link.href)} href={link.href}>{link.text}</a>
				</li>
			{/each}
		</ul>
	</aside>
	<section class="container">
		<h1
			oninput={(e) => {
				const target = e.target as HTMLElement;
				app_data.save({ id: data.id, name: target?.textContent ?? '' });
			}}
			contenteditable
		>
			{app_data.project?.name || 'Loading...'}
		</h1>

		{@render children()}
	</section>
</div>

<style>
	.two-col {
		display: grid;
		grid-template-columns: 200px 1fr;
	}

	[aria-current='true'] {
		font-weight: bold;
	}

	h1 {
		margin-bottom: 4rem;
		&:focus {
			outline: none;
			border-bottom: solid 1px var(--yellow);
		}
	}

	.container {
		height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
