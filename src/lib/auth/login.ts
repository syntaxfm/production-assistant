import { fetch } from '@tauri-apps/plugin-http';
import { get_github_user } from '$lib/utils/github/api';
import { GITHUB_TOKEN_KEY } from '$lib/utils/github/constants';
import { github_data } from '$state/Auth.svelte';

type GithubOauthResponse = {
	access_token: string;
	token_type: 'bearer';
	scope: string;
};

export const set_github_user_if_token = async () => {
	if (localStorage.getItem(GITHUB_TOKEN_KEY)) {
		github_data.user = await get_github_user();
	}
};

let in_progress = false;
export const login_github = async (code: string) => {
	if (in_progress) return;
	in_progress = true;
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			code,
			client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
			client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET
		})
	});

	const json = (await response.json()) as GithubOauthResponse;
	localStorage.setItem(GITHUB_TOKEN_KEY, json.access_token);
	github_data.user = await get_github_user();
	in_progress = false;
};

let in_yt_progress = false;
export const login_youtube = async (code: string) => {
	if (in_progress) return;
	in_yt_progress = true;

	const tokenEndpoint = 'https://oauth2.googleapis.com/token';

	const params = new URLSearchParams({
		code: code,
		client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
		client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
		redirect_uri: 'https://syntax.fm/some/not/found/path/auth/callback',
		grant_type: 'authorization_code'
	});

	const response = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params
	});

	const json = (await response.json()) as GithubOauthResponse;
	localStorage.setItem('youtube_token', json.access_token);
	in_yt_progress = false;
};
