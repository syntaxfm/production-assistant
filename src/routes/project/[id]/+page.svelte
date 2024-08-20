<script lang="ts">
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { onMount } from 'svelte';
	import { app_data } from '$state/Project.svelte.js';
	import marked from '$lib/utils/markdown';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { fade } from 'svelte/transition';
	import { invoke } from '@tauri-apps/api/core';
	import type { FfprobeResult } from '$/lib/types/ffprobe';

	let { data } = $props();
	let editor: HTMLDivElement | null = $state(null);
	let ink_instance: AwaitableInstance | null = null;
	let notes = app_data?.project?.notes || '';
	let file_drop: 'INITIAL' | 'HOVERING' | 'DROPPED' | 'PROCESSING' | 'COMPLETED' =
		$state('INITIAL');
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
				app_data.save({ id: data.id, notes });
			}
		}
	});

	onMount(() => {
		if (editor) {
			ink_instance = ink(editor, options);
		}
	});

	const format_number = (value: number) => value.toString().padStart(2, '0');

	const convert_seconds = (total_seconds: number) => {
		const minutes = format_number(Math.floor(total_seconds / 60));
		const seconds = format_number(Math.floor(total_seconds % 60));
		// TODO: calculate hours
		let result = `${minutes}:${seconds}`;
		return result;
	};

	const process_video = async (path: string) => {
		// TODO: show loading indicator
		const [result, error] = (await invoke('process_video', {
			path
		})) as string[];
		if (error) {
			// TODO: show error in UI
			console.error(error);
		} else {
			const ffprobe_result = JSON.parse(result) as FfprobeResult;
			const timestamps = ffprobe_result.chapters
				.map((chapter) => {
					const timestamp = convert_seconds(chapter.start / 1000);
					return `* **[${timestamp}](#t=${timestamp})** ${chapter.tags.title}`;
				})
				.join('\n');
			// TODO: save timestamps as full chapters in JSON format
			// TODO: if notes already exist, only update timestamp section of notes | use marker like <!-- timestamp start -->
			await app_data.save({ id: data.id, notes: timestamps, time_stamps: timestamps }, true);
			if (ink_instance) {
				ink_instance.update(timestamps);
			}
		}
	};

	const unlisten = getCurrentWebview().onDragDropEvent((event) => {
		if (event.payload.type === 'over') {
			file_drop = 'HOVERING';
		} else if (event.payload.type === 'drop') {
			file_drop = 'DROPPED';
			process_video(event.payload.paths[0]);
		} else {
			file_drop = 'INITIAL';
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

{#if file_drop === 'HOVERING'}
	<div class="dz" transition:fade>Drop File Here</div>
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

	<div class:hidden={!editor_visible} class:visible={editor_visible}>
		<button onclick={copyHtml}>Copy as HTML</button>
		<button onclick={copyText}>Copy as Text</button>
		<button onclick={() => copyToClipboard(notes)}>Copy as Markdown</button>
	</div>
	<div
		class:hidden={!editor_visible}
		class:visible={editor_visible}
		class="editor"
		bind:this={editor}
	></div>
</div>

<style>
	h1:focus {
		outline: none;
		border-bottom: solid 1px var(--yellow);
	}

	.hidden {
		display: none;
	}

	.visible {
		display: block;
	}

	.container {
		height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.dz {
		background: var(--tint-or-shade-hard-overlay);
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: var(--fs-xl);
	}
</style>
