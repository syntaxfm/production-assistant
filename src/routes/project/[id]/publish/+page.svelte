<script lang="ts">
	import { create_show_pr } from '$/lib/utils/github/api';
	import { get_number_and_title_from_name, modify_yaml } from '$/lib/utils/text';
	import { uploadVideoToYouTube } from '$/lib/utils/youtube.js';
	import { github_data } from '$state/Auth.svelte';
	import { app_data } from '$state/Project.svelte';
	import { listen } from '@tauri-apps/api/event';

	let { data } = $props();

	let pr_loading = $state(false);
	let project = $derived(app_data.project);
	let yt_progress = $state(0);

	$effect(() => {
		listen('youtube_progress', (event) => {
			yt_progress = event.payload as number;
		});
	});

	const create_github_pr = async () => {
		if (project && project.notes) {
			pr_loading = true;
			const { title, number } = get_number_and_title_from_name(project.name);
			// TODO: have a field for episode number
			// TODO: have a field for episode publish date
			// TODO: update mp3 url
			// TODO update youtueb url
			const episode_number = Date.now();
			const pr = await create_show_pr(
				number,
				title,
				`---
${project.frontmatter}
---

${project.notes}

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)`
			);

			await app_data.save({ id: data.id, pr_url: pr.html_url }, true);
			pr_loading = false;
		}
	};

	async function upload_to_youtube() {
		const access_token = localStorage.getItem('youtube_token');
		if (access_token) {
			const { videoUrl } = await uploadVideoToYouTube(
				access_token,
				project?.path,
				project?.name,
				project?.notes,
				'private'
			);
			const new_frontmatter = modify_yaml(app_data.project.frontmatter, 'youtube_url', videoUrl);
			app_data.save({ id: data.id, youtube_url: videoUrl, frontmatter: new_frontmatter }, true);
		} else {
			console.error('Not authorized');
		}
	}
</script>

<!-- <h2>Youtube</h2>
{#if app_data.project?.youtube_url}
	<a
		style="width: auto; display: inline-block"
		href={app_data.project?.youtube_url}
		target="_blank"
		class="button">Visit On Youtube</a
	>
{:else}
	{#if yt_progress}
		<progress max="100" value={yt_progress}></progress>
	{/if}
	<button onclick={upload_to_youtube}>Upload To Youtube</button>
{/if} -->

<h2>Github</h2>
<!-- <small>TODO: after create, url only shows on refresh...</small> -->

{#if github_data?.user}
	{#if pr_loading}
		<progress></progress>
	{:else if !project?.pr_url}
		<button onclick={create_github_pr}>Create PR</button>
	{:else if project?.pr_url}
		<a
			class="button"
			style="width: auto; display: inline-block"
			href={project?.pr_url}
			target="_blank">Open on Github</a
		>
	{/if}
{:else}
	<a href="/" class="button">Login with Github to create PR</a>
{/if}
