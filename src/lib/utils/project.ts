import type { Project } from '$state/Project.svelte';

export const get_combined_notes = (project: Project) =>
	`${project.notes}${project.sick_picks ? `\n\n${project.sick_picks}` : ''}${project.socials ? `\n\n${project.socials}` : ''}`;
