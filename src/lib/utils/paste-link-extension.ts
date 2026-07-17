import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

function looksLikeUrl(text: string): boolean {
	return /^https?:\/\/\S+$/.test(text.trim());
}

export function addPasteLinkHandler(container: HTMLElement) {
	const contentEl = container.querySelector('.cm-content');
	if (!contentEl) return;

	contentEl.addEventListener(
		'paste',
		(event: Event) => {
			const clipboardEvent = event as ClipboardEvent;
			const cmEditor = container.querySelector('.cm-editor');
			if (!cmEditor) return;
			const view = EditorView.findFromDOM(cmEditor as HTMLElement);
			if (!view) return;

			const url = clipboardEvent.clipboardData?.getData('text/plain');
			if (!url || !looksLikeUrl(url)) return;

			const { from, to } = view.state.selection.main;
			if (from === to) return;

			const selectedText = view.state.sliceDoc(from, to);
			const replacement = `[${selectedText}](${url.trim()})`;
			clipboardEvent.preventDefault();
			clipboardEvent.stopImmediatePropagation();
			view.dispatch({
				changes: { from, to, insert: replacement },
				selection: EditorSelection.cursor(from + replacement.length)
			});
		},
		true
	);
}
