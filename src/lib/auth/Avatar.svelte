<script lang="ts">
	import { github_data } from '$state/Auth.svelte';
</script>

<img src="https://github.com/{github_data.user?.login}.png" alt="Avatar" />

<style>
	img {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}
</style>
