import { GITHUB_TOKEN_KEY } from './constants';
import type { GithubBranch, GithubUser } from './types';

export const get_github_token = () => {
	const token = localStorage.getItem(GITHUB_TOKEN_KEY);
	if (!token) {
		throw new Error('Missing github token.');
	}
	return token;
};

const get_main_branch = async () => {
	const response = await fetch('https://api.github.com/repos/syntaxfm/website/git/refs/heads');
	const branches = (await response.json()) as GithubBranch[];
	return branches.find((b) => b.ref === 'refs/heads/main');
};

const create_branch = async (name: string) => {
	const token = get_github_token();
	const main_branch = await get_main_branch();
	const sha = main_branch?.object.sha;
	if (sha) {
		const response = await fetch('https://api.github.com/repos/syntaxfm/website/git/refs', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				sha,
				ref: `refs/heads/${name}`
			})
		});
		if (response.ok) {
			const branch = (await response.json()) as GithubBranch;
			return branch;
		}
		throw new Error(
			'Failed to create branch. A branch with that name already exists! Make sure this episode number is unique.'
		);
	}
	return null;
};

// See the The "Unicode Problem": https://developer.mozilla.org/en-US/docs/Glossary/Base64
function bytesToBase64(bytes: Uint8Array) {
	const binString = Array.from(bytes, (byte: number) => String.fromCodePoint(byte)).join('');
	return btoa(binString);
}

const commit_show_notes = async (branch_name: string, file_name: string, notes: string) => {
	const token = get_github_token();

	const response = await fetch(
		`https://api.github.com/repos/syntaxfm/website/contents/shows/${file_name}`,
		{
			method: 'PUT',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				message: `Create ${file_name}`,
				content: bytesToBase64(new TextEncoder().encode(notes)),
				branch: branch_name
			})
		}
	);
	const json = await response.json();
	return json;
};

const create_pr = async (branch_name: string, file_name: string) => {
	const token = get_github_token();
	const response = await fetch(`https://api.github.com/repos/syntaxfm/website/pulls`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			title: `Create - (${file_name})`,
			body: 'Auto created with Syntax Production Assistant™️',
			head: branch_name,
			base: 'main'
		})
	});
	return response.json();
};

export const create_show_pr = async (episode_number: number, title: string, notes: string) => {
	const branch_name = `${episode_number}-show-notes`;
	await create_branch(branch_name);
	const clean_title = title.replace(/[^a-zA-Z0-9 ]/g, '');
	const file_name = `${episode_number} - ${clean_title}.md`;
	await commit_show_notes(branch_name, file_name, notes);
	return create_pr(branch_name, file_name);
};

export const get_github_user = async () => {
	const token = get_github_token();
	const response = await fetch('https://api.github.com/user', {
		headers: {
			authorization: `Bearer ${token}`
		}
	});
	return response.json() as Promise<GithubUser>;
};
