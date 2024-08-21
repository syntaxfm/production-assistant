<script lang="ts">
	import { app_data } from '$state/Project.svelte.js';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { fade, slide } from 'svelte/transition';
	import { invoke } from '@tauri-apps/api/core';
	import type { FfprobeResult } from '$/lib/types/ffprobe';
	import { convert_seconds, get_filename_from_path } from '$/lib/utils/text';
	import { listen } from '@tauri-apps/api/event';

	let { data } = $props();
	let error_message = $state('');
	let mp3_progress = $state(0);

	$effect(() => {
		listen('mp3_progress', (event) => {
			mp3_progress = event.payload as number;
		});
	});

	const get_metadata = async (path: string) => {
		error_message = '';
		if (app_data.project) {
			app_data.set_project_status(data.id, 'PROCESSING');
			const [result, error] = (await invoke('get_metadata', {
				path
			})) as string[];
			let ffprobe_result: FfprobeResult = {};
			try {
				ffprobe_result = JSON.parse(result) as FfprobeResult;
			} catch {}
			if (error) {
				error_message = error;
			} else if (!ffprobe_result.chapters || ffprobe_result.chapters.length === 0) {
				error_message =
					'No chapters found in video. Make sure the video was exported with chapter metadata.';
			} else {
				const notes = ffprobe_result.chapters
					.map((chapter) => {
						const timestamp = convert_seconds(chapter.start / 1000);
						return `* **[${timestamp}](#t=${timestamp})** ${chapter.tags.title}`;
					})
					.join('\n');

				await app_data.save({ id: data.id, notes, chapters: ffprobe_result.chapters }, true);
			}
			app_data.set_project_status(data.id, 'COMPLETED');
		}
	};

	// ON DROP
	$effect(() => {
		const unsub = getCurrentWebview().onDragDropEvent((event) => {
			if (app_data.project) {
				if (event.payload.type === 'over') {
					app_data.set_project_status(data.id, 'HOVERING');
				} else if (event.payload.type === 'drop') {
					on_drop(event.payload.paths[0]);
				} else {
					app_data.set_project_status(data.id, 'INITIAL');
				}
			}
		});
	});

	async function make_mp3(path) {
		const res = await invoke('create_mp3', { path });
		if (res.success) {
			app_data.save({ id: data.id, mp3_path: res.output_path }, true);
		} else {
			error_message = res.message;
		}
	}

	function on_drop(path: string) {
		app_data.set_project_status(data.id, 'DROPPED');
		get_metadata(path);
		make_mp3(path);
		const name = get_filename_from_path(path);
		app_data.save({ id: data.id, name, path }, true);
	}

	function open_in_finder(path: string) {
		invoke('open_in_finder', { path });
	}
</script>

{#if app_data?.project}
	{#if app_data.project.status === 'PROCESSING'}
		<div class="overlay" transition:fade>Loading...</div>
	{:else if app_data.project.status === 'HOVERING'}
		<div class="overlay" transition:fade>Drop File Here</div>
	{/if}

	{#if !app_data.project.path}
		<div class="intro box">
			<p>Drop .mp4 anywhere to get started</p>
		</div>
	{/if}

	{#if error_message}
		<div class="error">{error_message}</div>
	{/if}

	{#if app_data.project.status === 'COMPLETED'}
		<div class="meta box filled">
			<div>
				<div>Path:</div>
				<div>
					{app_data?.project?.path}
				</div>
				<div>
					<button
						onclick={() => app_data?.project?.path && open_in_finder(app_data.project.path)}
						class="small ghost">Open In Finder</button
					>
				</div>
			</div>
			<div>
				<span>MP3 Path:</span>
				<div>
					{#if app_data.project.mp3_path}
						{app_data.project.mp3_path}
					{:else}
						<progress id="mp3_upload" value={mp3_progress} max="100"></progress>
					{/if}
				</div>
				<div>
					{#if app_data.project.mp3_path}
						<button
							onclick={() =>
								app_data?.project?.mp3_path && open_in_finder(app_data.project.mp3_path)}
							class="small ghost">Open In Finder</button
						>
					{:else}
						<button onclick={() => make_mp3(app_data?.project?.path)} class="small ghost"
							>Re-Generate MP3</button
						>
					{/if}
				</div>
			</div>

			<div>
				<span>Created At:</span>
				<span>{app_data?.project?.createdAt}</span>
			</div>

			<div>
				<span>Updated At:</span>
				<span>{app_data.project?.updatedAt}</span>
			</div>

			<div>
				<span>Youtube:</span>
				<div>
					{#if app_data.project?.youtube_url}
						<a href={app_data.project?.youtube_url} target="_blank">
							{app_data.project?.youtube_url}
						</a>
					{:else}
						Not Uploaded
					{/if}
				</div>
				<div>
					<a href="/project/{data.id}/publish" class="button ghost small">Start Upload</a>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.intro {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		p {
			text-align: center;
		}
	}

	.overlay {
		background: var(--tint-or-shade-hard-overlay);
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: var(--fs-xl);
	}

	.meta {
		display: grid;
		grid-template-columns: auto 1fr 150px;
		gap: 10px;
		& > div {
			display: grid;
			align-items: start;
			grid-column: 1 / -1;
			grid-template-columns: subgrid;
		}
	}
</style>
