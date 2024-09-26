<script lang="ts">
	import { app_data, type ProjectMarkdownFields } from '$state/Project.svelte';
	import { ink, defineOptions, type AwaitableInstance } from 'ink-mde';
	import { sick_picks, socials } from '$lib/constants/project';

	const default_values = {
		notes: '',
		sick_picks,
		socials
	};

	const {
		field,
		id,
		visible = true,
		should_clear_if_not_visible = false
	}: {
		id: string;
		field: keyof ProjectMarkdownFields;
		visible?: boolean;
		should_clear_if_not_visible?: boolean;
	} = $props();
	let editor: HTMLDivElement | null = $state(null);
	const value = app_data?.project?.[field] || default_values[field];

	const options = defineOptions({
		doc: value,
		interface: {
			toolbar: true,
			appearance: 'dark',
			attribution: false
		},
		hooks: {
			afterUpdate(doc) {
				app_data.save({ id, [field]: doc }, true);
			}
		}
	});

	if (should_clear_if_not_visible) {
		$effect(() => {
			if (visible) {
				app_data.save({ id, [field]: value }, true);
			} else {
				app_data.save({ id, [field]: '' }, true);
			}
		});
	}

	$effect(() => {
		if (editor) {
			ink(editor, options);
		}
	});
</script>

<div class:hidden={!visible} class:visible class="editor" bind:this={editor}></div>

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
</style>
