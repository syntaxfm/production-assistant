import { error } from '@sveltejs/kit';
export const prerender = false;

export const load = async function ({ params }) {
	if (!params.id)
		error(404, {
			message: 'Not found'
		});
	return {
		id: params.id
	};
};
