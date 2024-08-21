import { fetch } from '@tauri-apps/plugin-http';

// TODO: pull from env
const GITHUB_CLIENT_ID = '';
const GITHUB_CLIENT_SECRET = '';

type GithubOauthResponse = {
	access_token: string;
	token_type: 'bearer';
	scope: string;
};

let in_progress = false;
export const login_github = async (code: string) => {
	if (in_progress) return;
	in_progress = true;
	console.log({ code });
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			code,
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET
		})
	});
	const json = (await response.json()) as GithubOauthResponse;
	localStorage.setItem('github_token', json.access_token);
	in_progress = false;
};
