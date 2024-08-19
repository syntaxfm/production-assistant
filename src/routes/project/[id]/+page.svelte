<script lang="ts">
	import { app_data } from '$state/Project.svelte.js';
	import marked from '$lib/utils/markdown';
	import { ink, defineOptions } from 'ink-mde';
	import { onMount } from 'svelte';
	let { data } = $props();

	let editor: HTMLDivElement | null = null;
	let notes = app_data.project.notes || '';

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

<div class="container">
	<h1
		oninput={(e) => {
			app_data.save({ id: data.id, name: e.target.textContent });
		}}
		contenteditable
	>
		{app_data.project.name}
	</h1>
	<div>
		<button onclick={copyHtml}>Copy as HTML</button>
		<button onclick={copyText}>Copy as Text</button>
		<button onclick={() => copyToClipboard(notes)}>Copy as Markdown</button>
	</div>
	<div class="editor" bind:this={editor}></div>
</div>

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
</style>
