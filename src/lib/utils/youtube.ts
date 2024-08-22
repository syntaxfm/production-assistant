import { invoke } from '@tauri-apps/api/core';
import { sanitizeDescription } from './text';

export async function uploadVideoToYouTube(
	accessToken: string,
	filePath: string,
	title: string,
	description: string,
	privacyStatus = 'private'
) {
	try {
		const res = (await invoke('upload_to_youtube', {
			filePath,
			accessToken,
			title,
			description: sanitizeDescription(description),
			privacyStatus
		})) as string;
		const { videoId, videoUrl } = getYouTubeVideoUrl(res);
		return { videoId, videoUrl };
	} catch (e) {
		console.error(e);
	}
}

export function getYouTubeVideoUrl(jsonData: string) {
	// Parse the JSON if it's a string, otherwise use it as is
	const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

	// Extract the video ID
	const videoId = data.id;

	// Construct the YouTube video URL
	const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

	return {
		videoId: videoId,
		videoUrl: videoUrl
	};
}
