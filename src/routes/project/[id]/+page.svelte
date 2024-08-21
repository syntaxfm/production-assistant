<script lang="ts">
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { app_data } from '$state/Project.svelte.js';
	import marked from '$lib/utils/markdown';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { fade, slide } from 'svelte/transition';
	import { invoke } from '@tauri-apps/api/core';
	import type { FfprobeResult } from '$/lib/types/ffprobe';
	import { convert_seconds, format_number, get_filename_from_path } from '$/lib/utils/text';
	import { iso_to_plain_date } from '$/lib/utils/date';
	import { listen } from '@tauri-apps/api/event';
	import { validate_urls, type UrlValidation } from '$/lib/utils/markdown/validate';

	let { data } = $props();
	let error_message = $state('');
	let editor: HTMLDivElement | null = $state(null);
	let invalid_urls: UrlValidation[] = $state<UrlValidation[]>([]);
	let validation_status = $state('');
	let ink_instance: AwaitableInstance | null = null;
	let mp3_progress = $state(0);
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

	$effect(() => {
		listen('mp3_progress', (event) => {
			console.log(typeof event, event.payload);
			mp3_progress = event.payload as number;
			// event = { payload: number }
			// Update your UI with the progress
			// For example, update a progress bar or text
		});
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

	const validateLinks = async () => {
		validation_status = 'Validating urls...';
		invalid_urls = [];
		invalid_urls = await validate_urls(notes, (progress) => {
			console.log(progress);
			validation_status = `Validated ${progress.completed} of ${progress.total} links...`;
		});
		validation_status = '';
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

	<button onclick={() => invoke('create_mp3', { path: app_data.project?.path })}>Make MP3</button>

	<label for="mp3_upload"></label>
	<progress id="mp3_upload" value={mp3_progress} max="100"></progress>

	<div class:hidden={!editor_visible} class:visible={editor_visible}>
		<button class="ghost" onclick={copyHtml}>Copy as HTML</button>
		<button class="ghost" onclick={copyText}>Copy as Text</button>
		<button class="ghost" onclick={() => copyToClipboard(notes)}>Copy as Markdown</button>
		<button class="ghost" onclick={validateLinks} disabled={!!validation_status}
			>Validate Links</button
		>
	</div>
	{#if validation_status}
		<p>{validation_status}</p>
	{/if}
	{#if invalid_urls.length}
		<div class="error">
			<p>The following invalid urls were found:</p>
			<ul>
				{#each invalid_urls as validation_result}
					<li>{validation_result.statusText} | {validation_result.url}</li>
				{/each}
			</ul>
		</div>
	{/if}
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
		font-size: 16px;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
		background: var(--shade-or-tint);
		--ink-syntax-heading1-font-size: var(--fs-l);
		--ink-syntax-heading2-font-size: var(--fs-m);
		--ink-syntax-heading3-font-size: var(--fs-s);
		--ink-syntax-heading4-font-size: var(--fs-base);
		:global(.ink),
		:global(.cm-editor) {
			height: 100%;
			padding: 1rem 0.5rem 0.5rem;
		}
		:global(.ink-mde-editor) {
			padding: 0;
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
