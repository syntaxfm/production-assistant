import type { GithubUser } from '../utils/github/types';

const createData = () => {
	let user = $state<GithubUser | null>(null);

	return {
		set user(value) {
			user = value;
		},
		get user() {
			return user;
		}
	};
};

export const github_data = createData();
