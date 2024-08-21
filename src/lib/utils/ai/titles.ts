import { fetch } from '@tauri-apps/plugin-http';

export async function generate_titles(title: string) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'anthropic-version': '2023-06-01',
			'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY
		},
		body: JSON.stringify({
			model: 'claude-3-5-sonnet-20240620',
			max_tokens: 1000,
			temperature: 0,
			system:
				'We are a web development podcast. If I give you a title, could you come up with 10 increasinly clickbaity titles organized in a array of JS strings sorted by least clickbaity to most. Only output the JS array. do not output anything around the array, just the array itself',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: title
						}
					]
				}
			]
		})
	});
	const data = await response.json();
	if (!Array.isArray(JSON.parse(data.content[0].text))) {
		throw new Error('Error generating titles');
	}
	return JSON.parse(data.content[0].text);
}
