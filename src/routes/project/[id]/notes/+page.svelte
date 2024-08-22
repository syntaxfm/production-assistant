<script lang="ts">
	import InkMde from 'ink-mde/svelte';

	import marked from '$lib/utils/markdown';
	import {
		add_multiple_guests,
		add_single_guest,
		app_data,
		update_frontmatter_date
	} from '$state/Project.svelte';
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import {
		convert_seconds,
		format_number,
		get_date_string_from_frontmatter,
		get_filename_from_path,
		get_yaml_value
	} from '$/lib/utils/text';
	import { validate_urls, type UrlValidation } from '$/lib/utils/markdown/validate';

	let { data } = $props();
	let editor: HTMLDivElement | null = $state(null);
	let frontmatter_editor: HTMLDivElement | null = $state(null);
	let notes = $state(app_data?.project?.notes || '');
	let frontmatter = $state(app_data?.project?.frontmatter || '');
	let ink_instance: AwaitableInstance | null = $state(null);
	let ink_frontmatter_instance: AwaitableInstance | null = $state(null);
	let editor_visible = $derived(!!app_data.project?.notes);
	let frontmatter_editor_visible = $derived(!!app_data.project?.frontmatter);
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

	const frontmatter_options = defineOptions({
		doc: frontmatter,
		interface: {
			toolbar: false,
			appearance: 'dark',
			attribution: false
		},
		hooks: {
			afterUpdate(doc) {
				frontmatter = doc;
				const new_title = get_yaml_value(frontmatter, 'title');
				const new_number = get_yaml_value(frontmatter, 'number');
				const new_name = `${new_number} - ${new_title}`;
				app_data.save({ id: data.id, frontmatter, name: new_name }, true);
			}
		}
	});

	$effect(() => {
		if (editor) {
			ink_instance = ink(editor, options);
		}
	});

	$effect(() => {
		if (frontmatter_editor) {
			ink_frontmatter_instance = ink(frontmatter_editor, frontmatter_options);
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
	<div class="flex notes-actions">
		<button class="ghost" onclick={copyHtml}>Copy as HTML</button>
		<button class="ghost" onclick={copyText}>Copy as Text</button>
		<button class="ghost" onclick={() => copyToClipboard(`---\n${frontmatter}\n---\n\n${notes}`)}
			>Copy as Markdown</button
		>
		<button class="ghost" onclick={validateLinks} disabled={!!validation_status}
			>Validate Links</button
		>
	</div>

	<hr />
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

<div class="frontmatter-actions flex">
	<input
		type="date"
		value={get_date_string_from_frontmatter(app_data?.project?.frontmatter)}
		oninput={(e) => {
			const new_frontmatter = update_frontmatter_date(e);
			if (new_frontmatter) ink_frontmatter_instance.update(new_frontmatter);
		}}
	/>

	<button
		class="ghost small"
		onclick={() => {
			const new_frontmatter = add_single_guest(data.id);
			if (new_frontmatter) ink_frontmatter_instance.update(new_frontmatter);
		}}>Add Single Guest</button
	>

	<button
		class="ghost small"
		onclick={() => {
			const new_frontmatter = add_multiple_guests(data.id);
			if (new_frontmatter) ink_frontmatter_instance.update(new_frontmatter);
		}}>Add Multi Guests</button
	>
</div>

<div
	class:hidden={!frontmatter_editor_visible}
	class:visible={frontmatter_editor_visible}
	class="editor frontmatter-editor"
	bind:this={frontmatter_editor}
></div>

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
		margin-top: 1rem;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
		background: var(--shade-or-tint);
		--ink-syntax-heading1-font-size: var(--fs-l);
		--ink-syntax-heading2-font-size: var(--fs-m);
		--ink-syntax-heading3-font-size: var(--fs-s);
		--ink-syntax-heading4-font-size: var(--fs-base);
		:global(.ink) {
			height: 100%;
			padding: 0;
		}
		:global(.cm-editor) {
			height: 100%;
			padding: 1rem 0.5rem 0.5rem;
		}
		:global(.ink-mde-editor) {
			padding: 0;
		}
	}

	.frontmatter-editor {
		:global(.cm-editor) {
			padding: 0.5rem;
		}
	}

	.notes-actions {
		margin-bottom: 2rem;
	}

	input[type='date'] {
		border: solid 1px var(--tint-or-shade);
		background: var(--bg);
		color: var(--fg);
		border-radius: 4px;
		font-size: var(--fs-xxs);
		padding: 2px 15px;
		box-shadow: 1px 1px 4px rgb(0 0 0 / 0.4);
		@media (prefers-color-scheme: light) {
			box-shadow: 1px 1px 3px rgb(0 0 0 / 0.1);
		}
	}
</style>
