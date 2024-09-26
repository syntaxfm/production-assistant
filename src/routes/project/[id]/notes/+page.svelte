<script lang="ts">
	import marked from '$lib/utils/markdown';
	import {
		add_multiple_guests,
		add_single_guest,
		app_data,
		update_frontmatter_date
	} from '$state/Project.svelte';
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { get_date_string_from_frontmatter, get_yaml_value } from '$/lib/utils/text';
	import { validate_urls, type UrlValidation } from '$/lib/utils/markdown/validate';
	import ProjectMarkdownEditor from '$/lib/components/ProjectMarkdownEditor.svelte';
	import { get_combined_notes } from '$/lib/utils/project';

	let { data } = $props();
	let frontmatter_editor: HTMLDivElement | null = $state(null);
	let frontmatter = $state(app_data?.project?.frontmatter || '');
	let notes = $derived(app_data?.project?.notes || '');
	let sick_picks = $derived(app_data?.project?.sick_picks || '');
	let socials = $derived(app_data?.project?.socials || '');
	let ink_frontmatter_instance: AwaitableInstance | null = $state(null);
	let notes_visible = $derived(!!app_data.project?.notes);
	let frontmatter_editor_visible = $derived(!!app_data.project?.frontmatter);
	let validation_status = $state('');
	let invalid_urls: UrlValidation[] = $state<UrlValidation[]>([]);
	let include_sick_picks = $state(!!sick_picks);
	let include_socials = $state(!!socials);

	// Syntax highlighting can be customized with CSS variables
	// https://github.com/davidmyersdev/ink-mde/tree/main?tab=readme-ov-file#syntax-highlighting

	const frontmatter_options = defineOptions({
		doc: frontmatter,
		interface: {
			toolbar: false,
			appearance: 'auto',
			attribution: false
		},
		hooks: {
			afterUpdate(doc) {
				frontmatter = doc;
				const new_title = frontmatter ? get_yaml_value(frontmatter, 'title') : '';
				const new_number = frontmatter ? get_yaml_value(frontmatter, 'number') : '';
				const new_name = `${new_number} - ${new_title}`;
				app_data.save({ id: data.id, frontmatter, name: new_name }, true);
			}
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
		if (app_data.project) {
			const html = marked.render(get_combined_notes(app_data.project));
			copyToClipboard(html);
		}
	};

	const copyText = () => {
		const html = marked.render(notes);
		const element = document.createElement('div');
		element.innerHTML = html;
		copyToClipboard(element.textContent || '');
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

<div class:hidden={!notes_visible} class:visible={notes_visible}>
	<div class="flex notes-actions">
		<button class="ghost" onclick={copyText}>Copy Notes as Text</button>
		<button class="ghost" onclick={copyHtml}>Copy All as HTML</button>
		<button
			class="ghost"
			onclick={() =>
				copyToClipboard(`---\n${frontmatter}\n---\n\n${get_combined_notes(app_data.project!)}`)}
		>
			Copy All as Markdown</button
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

<ProjectMarkdownEditor id={data.id} field="notes" />

<div class="optional-editor">
	<label>
		Include Sick Picks / Shameless Plugs
		<input type="checkbox" bind:checked={include_sick_picks} />
	</label>
	<ProjectMarkdownEditor
		id={data.id}
		field="sick_picks"
		visible={include_sick_picks}
		should_clear_if_not_visible
	/>
</div>

<div class="optional-editor">
	<label>
		Include Socials
		<input type="checkbox" bind:checked={include_socials} />
	</label>
	<ProjectMarkdownEditor
		id={data.id}
		field="socials"
		visible={include_socials}
		should_clear_if_not_visible
	/>
</div>

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

	.optional-editor {
		margin: 2rem 0;
	}
</style>
