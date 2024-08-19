// Using settings for markdown-it from dillinger
// Source: https://github.com/joemccann/dillinger/blob/master/plugins/core/markdown-it.js
import markdownit from 'markdown-it';
import plugins from './plugins';

const md = markdownit({
	linkify: true,
	typographer: true,
	breaks: true
});

plugins.forEach((plugin) => {
	md.use(plugin);
});

md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
	const token = tokens[idx];
	token.attrPush(['class', 'table table-striped table-bordered']);

	return self.renderToken(tokens, idx, options);
};

const lineNumberRendererRuleNames = [
	'paragraph_open',
	'image',
	'code_block',
	'fence',
	'list_item_open'
];

lineNumberRendererRuleNames.forEach(function (ruleName) {
	const original = md.renderer.rules[ruleName];
	md.renderer.rules[ruleName] = function (tokens, idx, options, env, self) {
		const token = tokens[idx];
		if (token.map && token.map.length) {
			token.attrPush(['class', 'has-line-data']);
			if (ruleName === 'fence') {
				token.attrPush(['data-line-start', `${token.map[0]}1`]);
			} else {
				token.attrPush(['data-line-start', token.map[0].toString()]);
			}
			token.attrPush(['data-line-end', token.map[1].toString()]);
		}

		if (original) {
			return original(tokens, idx, options, env, self);
		} else {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			return self.renderToken(tokens, idx, options, env, self);
		}
	};
});

/**
 * Override markdown-it-toc heading_open rule, add line count attributes
 * See: https://unpkg.com/markdown-it-toc@1.1.0/index.js#L69-78
 */
md.renderer.rules.heading_open = function (tokens, idx) {
	const token = tokens[idx];
	const level = token.tag;
	const label = tokens[idx + 1];
	const makeSafe = (label: string) => {
		return label
			.replace(/[^\w\s]/gi, '')
			.split(' ')
			.join('_');
	};
	if (label.type === 'inline' && token.map) {
		const anchor = `${makeSafe(label.content)}_${label.map ? label.map[0] : ''}`;
		return (
			`<${level} ` +
			`class="code-line"` +
			` ` +
			`data-line-start="${token.map[0]}" ` +
			`data-line-end="${token.map[1]}" ` +
			`>` +
			`<a id="${anchor}"></a>`
		);
	} else {
		return '</h1>';
	}
};
export default md;
