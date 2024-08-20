import { fetch } from '@tauri-apps/plugin-http';
import marked from './index';

const URL_CHECK_TIMEOUT = 2 * 1000;
const url_cache = new Set<string>();

export type UrlValidation = {
	valid: boolean;
	url: string;
	status?: number;
	statusText?: string;
};

export type ProgressUpdate = {
	total: number;
	completed: number;
};

const validate_url = async (url: string, method = 'HEAD'): Promise<UrlValidation> => {
	if (url_cache.has(url)) return { url, valid: true };
	try {
		const abortController = new AbortController();
		let complete = false;
		setTimeout(() => {
			if (!complete) {
				abortController.abort();
			}
		}, URL_CHECK_TIMEOUT);
		const response = await fetch(url, {
			method,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
			},
			signal: abortController.signal
		});
		complete = true;
		if (response.status !== 404) {
			url_cache.add(url);
			return { url, valid: true };
		} else {
			return {
				url,
				valid: false,
				status: response.status,
				statusText: response.statusText
			};
		}
	} catch (e) {
		const errorMessage = e as string;
		if (errorMessage === 'Request canceled' && method === 'HEAD') {
			// HEAD request timed out after URL_CHECK_TIMEOUT ms
			// try again with GET method instead
			return validate_url(url, 'GET');
		}
		return {
			url,
			valid: false,
			status: 500,
			statusText:
				errorMessage === 'Request canceled'
					? `Timed out after ${URL_CHECK_TIMEOUT / 1000} seconds.`
					: errorMessage
		};
	}
};

export async function validate_urls(text: string, onProgress: (progress: ProgressUpdate) => void) {
	const element = document.createElement('div');
	element.innerHTML = marked.render(text);
	const anchors = element.querySelectorAll('a');
	const links: string[] = [];
	anchors.forEach((anchor) => {
		const href = anchor.getAttribute('href');
		if (href?.startsWith('http')) {
			links.push(href);
		}
	});
	const total = links.length;
	let completed = 0;
	const invalid: UrlValidation[] = [];
	await Promise.all(
		links.map(async (url) => {
			const result = await validate_url(url);
			if (!result.valid) {
				invalid.push(result);
			}
			completed++;
			onProgress({
				total,
				completed
			});
		})
	);
	return invalid;
}
