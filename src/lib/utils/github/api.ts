import { GITHUB_TOKEN_KEY } from './constants';
import type { GithubBranch, GithubPullRequest, GithubUser } from './types';

const GITHUB_REPO = 'syntaxfm/website';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

export const get_github_token = () => {
	const token = localStorage.getItem(GITHUB_TOKEN_KEY);
	if (!token) {
		throw new Error('Missing github token.');
	}
	return token;
};

const get_github_headers = () => ({
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28',
	authorization: `Bearer ${get_github_token()}`
});

const get_github_json = async (response: Response): Promise<unknown> => {
	try {
		return await response.json();
	} catch (error) {
		console.error('Failed to parse GitHub JSON response', error);
		return null;
	}
};

const get_github_header_details = (response: Response) => {
	const details = [
		['request id', response.headers.get('x-github-request-id')],
		['token scopes', response.headers.get('x-oauth-scopes')],
		['accepted scopes', response.headers.get('x-accepted-oauth-scopes')]
	]
		.filter((detail): detail is [string, string] => Boolean(detail[1]))
		.map(([label, value]) => `${label}: ${value}`);

	return details.length ? ` Details: ${details.join('; ')}` : '';
};

const get_github_error_message = async (response: Response, action: string) => {
	let message = response.statusText;
	let documentation_url = '';

	const body = await get_github_json(response);
	if (body && typeof body === 'object') {
		if ('message' in body && typeof body.message === 'string') {
			message = body.message;
		}
		if ('documentation_url' in body && typeof body.documentation_url === 'string') {
			documentation_url = ` (${body.documentation_url})`;
		}
	}

	return `GitHub failed while ${action}. Status ${response.status}: ${message}${documentation_url}${get_github_header_details(response)}`;
};

const get_authenticated_github_user = async () => {
	const response = await fetch('https://api.github.com/user', {
		headers: get_github_headers()
	});
	if (!response.ok) {
		await throw_github_error(response, 'checking which GitHub account this token belongs to');
	}
	return (await response.json()) as GithubUser;
};

const verify_github_repo_access = async () => {
	const user = await get_authenticated_github_user();
	const repo_response = await fetch(GITHUB_API_BASE, {
		headers: get_github_headers()
	});

	if (!repo_response.ok) {
		const body = await get_github_json(repo_response);
		let message = repo_response.statusText;
		if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
			message = body.message;
		}

		throw new Error(
			`GitHub token for @${user.login} cannot access ${GITHUB_REPO} through the GitHub API. Status ${repo_response.status}: ${message}.${get_github_header_details(repo_response)} If @${user.login} can open the repo in the browser, replace the GitHub token in this app because it is not authorized for this repo/API access.`
		);
	}

	return user;
};

const throw_github_error = async (response: Response, action: string): Promise<never> => {
	throw new Error(await get_github_error_message(response, action));
};

const get_main_branch = async () => {
	const response = await fetch(`${GITHUB_API_BASE}/git/refs/heads`, {
		headers: get_github_headers()
	});
	if (!response.ok) {
		await throw_github_error(response, `getting branches from ${GITHUB_REPO}`);
	}
	const branches = (await response.json()) as GithubBranch[];
	return branches.find((b) => b.ref === 'refs/heads/main');
};

const create_branch = async (name: string) => {
	const main_branch = await get_main_branch();
	const sha = main_branch?.object.sha;
	if (!sha) {
		throw new Error('GitHub failed while finding the main branch for syntaxfm/website.');
	}

	const response = await fetch(`${GITHUB_API_BASE}/git/refs`, {
		method: 'POST',
		headers: {
			...get_github_headers(),
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			sha,
			ref: `refs/heads/${name}`
		})
	});
	if (!response.ok) {
		await throw_github_error(response, `creating branch "${name}" in ${GITHUB_REPO}`);
	}
	const branch = (await response.json()) as GithubBranch;
	return branch;
};

// See the The "Unicode Problem": https://developer.mozilla.org/en-US/docs/Glossary/Base64
function bytesToBase64(bytes: Uint8Array) {
	const binString = Array.from(bytes, (byte: number) => String.fromCodePoint(byte)).join('');
	return btoa(binString);
}

const commit_show_notes = async (branch_name: string, file_name: string, notes: string) => {
	const response = await fetch(
		`${GITHUB_API_BASE}/contents/shows/${file_name}`,
		{
			method: 'PUT',
			headers: {
				...get_github_headers(),
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				message: `Create ${file_name}`,
				content: bytesToBase64(new TextEncoder().encode(notes)),
				branch: branch_name
			})
		}
	);
	if (!response.ok) {
		await throw_github_error(response, `committing show notes file "${file_name}"`);
	}
	const json = await response.json();
	return json;
};

const create_pr = async (branch_name: string, file_name: string) => {
	const response = await fetch(`${GITHUB_API_BASE}/pulls`, {
		method: 'POST',
		headers: {
			...get_github_headers(),
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			title: `Create - (${file_name})`,
			body: 'Auto created with Syntax Production Assistant™️',
			head: branch_name,
			base: 'main'
		})
	});
	if (!response.ok) {
		await throw_github_error(response, `creating pull request for branch "${branch_name}"`);
	}
	return response.json() as Promise<GithubPullRequest>;
};

export const create_show_pr = async (
	episode_number: number,
	title: string,
	notes: string
): Promise<GithubPullRequest> => {
	await verify_github_repo_access();
	const branch_name = `${episode_number}-show-notes`;
	await create_branch(branch_name);
	const clean_title = title.replace(/[^a-zA-Z0-9 ]/g, '');
	const file_name = `${episode_number} - ${clean_title}.md`;
	await commit_show_notes(branch_name, file_name, notes);
	return create_pr(branch_name, file_name);
};

export const get_github_user = async () => {
	return get_authenticated_github_user();
};
