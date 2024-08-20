<script lang="ts">
	import { iso_to_plain_date } from '$/lib/utils/date';
	import { app_data } from '$state/Project.svelte';
	app_data.sync();
</script>

<div class="content">
	<div class="settings flex">
		<h1>My Projects</h1>
		<div class="flex">
			<label
				>Import Data
				<input
					class="visually-hidden"
					type="file"
					accept="application/json"
					oninput={app_data.import_from_json}
				/></label
			>
			<button onclick={app_data.export_to_json}>Export Data</button>
		</div>
	</div>
	<div class="grid">
		<button onclick={app_data.add}>+ New Project</button>
		{#each app_data.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as project}
			<a class="button" href="/project/{project.id}">
				<h2>
					{project.name}
				</h2>
				<p>
					Created: {iso_to_plain_date(project.createdAt)}
				</p>
			</a>
		{/each}
	</div>
</div>

<style>
	button,
	label,
	.button {
		aspect-ratio: 16/9;
		border-radius: 4px;
		border: solid 1px var(--fg);
		background-color: transparent;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		justify-content: space-between;
		padding: 20px;
		color: var(--fg);
		h2 {
			margin: 0;
			font-size: var(--fs-base);
		}
		p {
			margin: 0;
			font-size: var(--fs-xxs);
		}
		&:hover {
			background: var(--tint-or-shade);
		}
	}
	button {
		justify-content: center;
		align-items: center;
	}
	.settings {
		justify-content: space-between;
		align-items: center;
		button,
		label {
			padding: 5px 10px;
			font-size: var(--fs-xs);
			aspect-ratio: 0;
		}
	}
</style>
