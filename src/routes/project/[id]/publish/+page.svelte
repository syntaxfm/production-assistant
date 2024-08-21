<script lang="ts">
	import { create_show_pr } from '$/lib/utils/github/api';
	import { app_data } from '$state/Project.svelte';

	let { data } = $props();

	let pr_loading = $state(false);
	let project = $derived(app_data.project);

	const create_github_pr = async () => {
		if (project && project.notes) {
			pr_loading = true;
			// TODO: have a field for episode number
			// TODO: have a field for episode publish date
			// TODO: update mp3 url
			// TODO update youtueb url
			const episode_number = Date.now();
			const pr = await create_show_pr(
				episode_number,
				project.name,
				`---
number: ${episode_number}
title: "${project.name}"
date: TODO
url: TODO
youtube_url: TODO
---

${project.notes}

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)`
			);

			await app_data.save({ id: data.id, pr_url: pr.url });
			pr_loading = false;
		}
	};
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
<small>TODO: after create, url only shows on refresh...</small>
<br />
{#if pr_loading}
	<progress></progress>
{:else if !project?.pr_url}
	<button onclick={create_github_pr}>Create PR</button>
{:else if project?.pr_url}
	<a href="#">{project?.pr_url}</a>
{/if}
