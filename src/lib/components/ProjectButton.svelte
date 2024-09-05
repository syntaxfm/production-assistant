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
	<p>Are you sure you want to delete:</p>
	<p>"{project.name}"</p>
	<small>This cannot be undone.</small>
	<div class="buttons">
		<button onclick={() => dialog?.close()} class="ghost">Cancel</button><button
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
		top: -10%;
		right: -5%;
		transition-duration: 0.5s;
		pointer-events: none;
	}
	.project-button:hover .delete-button {
		opacity: 1;
		pointer-events: all;
	}
	.buttons {
		display: flex;
		gap: 2rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	dialog {
		border-radius: 10px;
		small {
			font-style: italic;
		}
		&::backdrop {
			-webkit-backdrop-filter: blur(3px);
		}
	}
</style>
