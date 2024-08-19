<script lang="ts">
	import { app_data } from '$state/Project.svelte.js';
	import Dropzone from 'svelte-file-dropzone';

	let { data } = $props();

	function handleFilesSelect(e) {
		const { acceptedFiles, fileRejections } = e.detail;
		console.log('acceptedFiles', acceptedFiles);
	}
</script>

<h1
	oninput={(e) => {
		app_data.save({ id: data.id, name: e.target.innerHTML });
	}}
	contenteditable
>
	{app_data.project.name}
</h1>

<Dropzone ondrop={handleFilesSelect} />

<style>
	h1:focus {
		outline: none;
		border-bottom: solid 1px var(--yellow);
	}
</style>
