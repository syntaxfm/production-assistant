export interface GithubBranch {
	ref: string;
	node_id: string;
	url: string;
	object: BranchObject;
}

export interface BranchObject {
	sha: string;
	type: 'commit';
	url: string;
}
