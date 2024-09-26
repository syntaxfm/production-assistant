// Checks to see if the youtube token has the correct scopes and that we have upload access
export async function verifyYT() {
	const access_token = localStorage.getItem('youtube_token');

	try {
		const response = await fetch(
			`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Token info:', data);

		// Check if the required scopes are present
		const requiredScopes = [
			'https://www.googleapis.com/auth/youtube',
			'https://www.googleapis.com/auth/youtube.force-ssl',
			'https://www.googleapis.com/auth/youtubepartner'
		];

		const tokenScopes = data.scope.split(' ');
		const missingScopes = requiredScopes.filter((scope) => !tokenScopes.includes(scope));

		if (missingScopes.length > 0) {
			console.warn('Missing scopes:', missingScopes);
		}

		return data;
	} catch (error) {
		console.error('Error verifying token:', error);
		throw error;
	}
}

// Gets the user data for the youtube account for debugging
export async function getYoutubeUserData() {
	const access_token = localStorage.getItem('youtube_token');
	const apiUrl =
		'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true';

	try {
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		if (data.items && data.items.length > 0) {
			const channelData = data.items[0];
			return channelData;
		} else {
			console.log('No channel data found');
			return null;
		}
	} catch (error) {
		console.error('Error fetching YouTube user data:', error);
		throw error;
	}
}
