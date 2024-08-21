<script lang="ts">
	import { app_data } from '$state/Project.svelte';
</script>

<h2>Publish</h2>

<h3>Youtube</h3>
{#if app_data.project?.youtube_url}
	<a href={app_data.project?.youtube_url} class="button">Visit On Youtube</a>
{:else}
	<progress></progress>
	<button>Upload To Youtube</button>
{/if}

<h3>Github</h3>
