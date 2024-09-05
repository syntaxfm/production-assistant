<script lang="ts">
	import { github_data } from '$state/Auth.svelte';
	import { app_data } from '$state/Project.svelte';
	import { invoke } from '@tauri-apps/api/core';
	import Avatar from '$lib/auth/Avatar.svelte';
	import ProjectButton from '$/lib/components/ProjectButton.svelte';
	app_data.sync();
</script>

<div class="content">
	<div class="settings flex">
		<h1>My Projects</h1>
		<div class="flex settings-buttons">
			<!-- <button class="small ghost" onclick={() => invoke('login_youtube')}>Login Youtube</button> -->
			{#if !github_data?.user?.login}
				<button class="small ghost" onclick={() => invoke('login_github')}>Login Github</button>
			{:else}
				<Avatar />
			{/if}
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
			<ProjectButton {project} />
		{/each}
	</div>
</div>

<style>
	h1 {
		margin-top: 6rem;
		margin-bottom: 2rem;
	}

	.settings {
		justify-content: space-between;
		align-items: start;
		.settings-buttons {
			position: fixed;
			top: 1rem;
			right: 1rem;
			z-index: 101;
		}
	}
</style>
