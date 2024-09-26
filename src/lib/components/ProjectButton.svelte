<script lang="ts">
	import { iso_to_plain_date } from '$lib/utils/date';
	import { app_data, type Project } from '$state/Project.svelte';

	let { project }: { project: Project } = $props();

	let dialog: HTMLDialogElement | undefined;
</script>

<a class="project-button" href="/project/{project.id}">
	<h2>
		{project.name}
	</h2>
	<p>
		Created: {iso_to_plain_date(project.createdAt)}
	</p>
	<button
		onclick={(event) => {
			event.preventDefault();
			dialog?.showModal();
		}}
		class="delete-button">×</button
	>
</a>

<dialog bind:this={dialog}>
	<h2 class="h5">Are you sure you want to delete:</h2>
	<p>"{project.name}"</p>
	<small>This cannot be undone.</small>
	<div class="buttons">
		<button onclick={() => dialog?.close()} class="warning">Cancel</button><button
			onclick={() => {
				app_data.delete_project(project.id);
				dialog?.close();
			}}>Yes</button
		>
	</div>
</dialog>

<style>
	.project-button {
		position: relative;
	}

	.delete-button {
		opacity: 0;
		position: absolute;
		transition-duration: 0.5s;
		pointer-events: none;
		top: -4%;
		right: -2%;
	}

	.project-button:hover .delete-button {
		opacity: 1;
		pointer-events: all;
	}

	.buttons {
		display: flex;
		gap: 20px;
		justify-content: flex-end;
		margin-top: var(--vs-l);
		align-items: flex-end;
	}
</style>
