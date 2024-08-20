<script lang="ts">
	import { ink, defineOptions } from 'ink-mde';
	import { onMount } from 'svelte';
	import { app_data } from '$state/Project.svelte.js';
	import marked from '$lib/utils/markdown';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { fade } from 'svelte/transition';
	import { invoke } from '@tauri-apps/api/core';

	let { data } = $props();
	let editor: HTMLDivElement | null = $state(null);
	let notes = app_data?.project?.notes || '';
	let file_drop: 'INITIAL' | 'HOVERING' | 'DROPPED' | 'PROCESSING' | 'COMPLETED' =
		$state('INITIAL');

	const unlisten = getCurrentWebview().onDragDropEvent((event) => {
		if (event.payload.type === 'over') {
			file_drop = 'HOVERING';
		} else if (event.payload.type === 'drop') {
			file_drop = 'DROPPED';
			invoke('process_video', { path: event.payload.paths[0] });
		} else {
			file_drop = 'INITIAL';
		}
	});

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
			ink(editor, options);
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

{#if app_data?.project}
	<div class="container">
		<h1
			oninput={(e) => {
				const target = e.target as HTMLElement;
				app_data.save({ id: data.id, name: target?.textContent ?? '' });
			}}
			contenteditable
		>
			{app_data.project.name}
		</h1>

		{#if app_data.project.time_stamps}
			<div>
				<button onclick={copyHtml}>Copy as HTML</button>
				<button onclick={copyText}>Copy as Text</button>
				<button onclick={() => copyToClipboard(notes)}>Copy as Markdown</button>
			</div>
			<div class="editor" bind:this={editor}></div>
		{/if}
	</div>
{/if}

<style>
	h1:focus {
		outline: none;
		border-bottom: solid 1px var(--yellow);
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

		:global(.ink),
		:global(.cm-editor) {
			height: 100%;
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
