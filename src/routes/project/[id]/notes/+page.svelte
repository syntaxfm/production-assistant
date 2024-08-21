<script lang="ts">
	import marked from '$lib/utils/markdown';
	import { app_data } from '$state/Project.svelte';
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { convert_seconds, format_number, get_filename_from_path } from '$/lib/utils/text';
	import { validate_urls, type UrlValidation } from '$/lib/utils/markdown/validate';

	let { data } = $props();
	let editor: HTMLDivElement | null = $state(null);
	let notes = $state(app_data?.project?.notes || '');
	let ink_instance: AwaitableInstance | null = $state(null);
	let editor_visible = $derived(!!app_data.project?.notes);
	let validation_status = $state('');
	let invalid_urls: UrlValidation[] = $state<UrlValidation[]>([]);

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

<style>
	.editor {
		flex-grow: 1;
		overflow: hidden;
		font-size: 16px;
		margin-top: 2rem;
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
</style>
