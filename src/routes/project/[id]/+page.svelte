<script lang="ts">
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { app_data } from '$state/Project.svelte.js';
	import marked from '$lib/utils/markdown';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { fade, slide } from 'svelte/transition';
	import { invoke } from '@tauri-apps/api/core';
	import type { FfprobeResult } from '$/lib/types/ffprobe';
	import { convert_seconds, format_number, get_filename_from_path } from '$/lib/utils/text.js';
	import { iso_to_plain_date } from '$/lib/utils/date';

	let { data } = $props();
	let error_message = $state('');
	let editor: HTMLDivElement | null = $state(null);
	let ink_instance: AwaitableInstance | null = null;
	let notes = app_data?.project?.notes || '';
	let status: 'INITIAL' | 'HOVERING' | 'DROPPED' | 'PROCESSING' | 'COMPLETED' = $state('INITIAL');
	let editor_visible = $derived(!!app_data.project?.notes);

	// Syntax highlighting can be customized with CSS variables
	// https://github.com/davidmyersdev/ink-mde/tree/main?tab=readme-ov-file#syntax-highlighting
	const options = defineOptions({
		doc: notes,
		interface: {
			toolbar: true,
			appearance: 'dark',
			attribution: false
		},
		hooks: {
			afterUpdate(doc) {
				notes = doc;
				app_data.save({ id: data.id, notes }, true);
			}
		}
	});

	$effect(() => {
		if (editor) {
			ink_instance = ink(editor, options);
		}
	});

	$effect(() => {
		if (app_data.project?.path && status !== 'PROCESSING') {
			status = 'COMPLETED';
		}
	});


	const get_metadata = async (path: string) => {
		error_message = '';
		status = 'PROCESSING';
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
			if (ink_instance) {
				ink_instance.update(notes);
			}
		}
		status = 'COMPLETED';
	};

	// ON DROP
	const unlisten = getCurrentWebview().onDragDropEvent((event) => {
		if (event.payload.type === 'over') {
			status = 'HOVERING';
		} else if (event.payload.type === 'drop') {
			status = 'DROPPED';
			get_metadata(event.payload.paths[0]);
			const name = get_filename_from_path(event.payload.paths[0]);
			app_data.save({ id: data.id, name, path: event.payload.paths[0] });
		} else {
			status = 'INITIAL';
		}
	});

	const copyToClipboard = async (text: string) => {
		const type = 'text/plain';
		const blob = new Blob([text], { type });
		const data = [new ClipboardItem({ [type]: blob })];
		await navigator.clipboard.write(data);
	};

	const copyHtml = () => {
		const html = marked.render(notes);
		copyToClipboard(html);
	};

	const copyText = () => {
		const html = marked.render(notes);
		const element = document.createElement('div');
		element.innerHTML = html;
		const textNodes: string[] = [];
		element.childNodes.forEach((node) => {
			textNodes.push(node.textContent || '');
		});

		const text = textNodes.join('\n');
		copyToClipboard(text);
	};
</script>

{#if status === 'PROCESSING'}
	<div class="overlay" transition:fade>Loading...</div>
{:else if status === 'HOVERING'}
	<div class="overlay" transition:fade>Drop File Here</div>
{/if}

<div class="container">
	<h1
		oninput={(e) => {
			const target = e.target as HTMLElement;
			app_data.save({ id: data.id, name: target?.textContent ?? '' });
		}}
		contenteditable
	>
		{app_data.project?.name || 'Loading...'}
	</h1>


	{#if !editor_visible}
		<div class="intro box" transition:slide>
			<p>Drop .mp4 anywhere to get started</p>
		</div>
	{/if}

	{#if error_message}
		<div class="error">{error_message}</div>
	{/if}


	{#if status === 'COMPLETED'}
		<div transition:slide class="meta box">
			<h2>Metadata</h2>
			<ul class="no-list">
				<li>Path: {app_data.project?.path}</li>
				<li>Created At: {iso_to_plain_date(app_data.project?.createdAt)}</li>
				<li>Updated At: {iso_to_plain_date(app_data.project?.updatedAt)}</li>
				<li>Youtube Upload: <button class="small">Upload</button></li>
			</ul>
		</div>
	{/if}


	<div class:hidden={!editor_visible} class:visible={editor_visible}>
		<button class="ghost" onclick={copyHtml}>Copy as HTML</button>
		<button class="ghost" onclick={copyText}>Copy as Text</button>
		<button class="ghost" onclick={() => copyToClipboard(notes)}>Copy as Markdown</button>
	</div>
	<div
		class:hidden={!editor_visible}
		class:visible={editor_visible}
		class="editor"
		bind:this={editor}
	></div>
</div>

<style>
	h1 {
		margin-bottom: 4rem;
		&:focus {
			outline: none;
			border-bottom: solid 1px var(--yellow);
		}
	}

	.intro {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		p {
			text-align: center;
		}
	}

	.container {
		height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error {
		border-radius: 4px;
		border: solid 1px var(--fg);
		background-color: transparent;
		display: flex;
		flex-direction: column;
		padding: 20px;
		color: var(--red);
		font-size: var(--fs-xxs);
	}

	.editor {
		flex-grow: 1;
		overflow: hidden;

		:global(.ink),
		:global(.cm-editor) {
			height: 100%;
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

	.no-list li {
		font-size: var(--fs-xxs);
		margin-bottom: 0.5rem;
	}
</style>
