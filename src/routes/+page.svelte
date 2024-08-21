<script lang="ts">
	import { iso_to_plain_date } from '$/lib/utils/date';
	import { app_data } from '$state/Project.svelte';
	import { invoke } from '@tauri-apps/api/core';
	app_data.sync();
</script>

<div class="content">
	<div class="settings flex">
		<h1>My Projects</h1>
		<div class="flex settings-buttons">
			<button class="small ghost" onclick={() => invoke('login_github')}>Login Github</button>
			<label class="button small ghost"
				>Import Data
				<input
					class="visually-hidden"
					type="file"
					accept="application/json"
					oninput={app_data.import_from_json}
				/></label
			>
			<button class="small ghost" onclick={app_data.export_to_json}>Export Data</button>
		</div>
	</div>
	<div class="grid">
		<button class="project-button" onclick={app_data.add}>+ New Project</button>
		{#each app_data.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as project}
			<a class="project-button" href="/project/{project.id}">
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
	.project-button {
		aspect-ratio: 16/9;
		border-radius: 4px;
		border: solid 1px var(--tint-or-shade);
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
			opacity: 0.7;
		}
		&:hover {
			background: var(--tint-or-shade);
		}
	}

	button.project-button {
		justify-content: center;
		align-items: center;
	}
	h1 {
		margin-top: 6rem;
		margin-bottom: 2rem;
	}

	.settings {
		justify-content: space-between;
		align-items: start;
		.settings-buttons {
			margin-top: 1rem;
		}
	}
</style>
