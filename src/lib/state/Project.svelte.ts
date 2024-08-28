import { goto } from '$app/navigation';
import { localDB } from '$lib/db/local_db';
import { generate_id } from '$lib/utils/date';
import type { Chapter } from '$lib/types/ffprobe';
import {
	date_string_to_unix_mili,
	get_number_and_title_from_name,
	get_today_in_unix_mili,
	modify_yaml
} from '../utils/text';

export type ProjectStatus =
	| 'INITIAL'
	| 'HOVERING'
	| 'DROPPED'
	| 'PROCESSING'
	| 'COMPLETED'
	| 'ERROR';
export interface Project {
	id: string;
	notes?: string;
	frontmatter?: string;
	name: string;
	createdAt: string;
	chapters?: Chapter[];
	updatedAt: string;
	path?: string;
	mp3_path?: string;
	youtube_url?: string;
	status: ProjectStatus;
	ai_titles?: string[];
	pr_url?: string;
}

export function update_frontmatter_date(e) {
	if (app_data.project) {
		const mili = date_string_to_unix_mili(e.target.value);
		const new_frontmatter = modify_yaml(app_data.project.frontmatter, 'date', mili);

		app_data.save({ id: app_data.project.id, frontmatter: new_frontmatter }, true);
		return new_frontmatter;
	}
}

export function add_single_guest(id: string) {
	const SINGLE_GUEST_TEMPLATE = `
guest:
  name: TODO
  github: TODO
  twitter: TODO
  of: TODO
  url: TODO
  social: TODO`;
	if (app_data?.project?.frontmatter) {
		const new_frontmatter = app_data.project.frontmatter + SINGLE_GUEST_TEMPLATE;
		app_data.save({ id, frontmatter: new_frontmatter }, true);
		return new_frontmatter;
	}
}
export function add_multiple_guests(id: string) {
	const MULTI_GUEST_TEMPLATE = `
guest:
  - name: Anne Thomas
    github: AlfalfaAnne
    twitter: AlfalfaAnne
    of: Design Packs
    url: https://design-packs.com/
    social: https://www.linkedin.com/in/annethomas8
  - name: Trudy MacNabb
    github: deartrudence
    twitter: dear_trudence
    of: Design Packs
    url: https://design-packs.com/
    social: https://www.linkedin.com/in/trudy-macnabb-7b19104a`;
	if (app_data?.project?.frontmatter) {
		const new_frontmatter = app_data.project.frontmatter + MULTI_GUEST_TEMPLATE;
		app_data.save({ id, frontmatter: new_frontmatter }, true);
		return new_frontmatter;
	}
}

export function create_frontmatter(name: string) {
	const parsed_name = get_number_and_title_from_name(name);
	const number = parsed_name?.number;
	const title = parsed_name?.title;
	const date = get_today_in_unix_mili();
	console.log('date', date);
	const DEFAULT_FRONTMATTER = `number: ${number}
title: ${title}
date: ${date}
url: TODO
youtube_url: TODO`;
	return DEFAULT_FRONTMATTER;
}

export const deserializeProject = (project: Project) => {
	if (typeof project.chapters === 'string') {
		project.chapters = JSON.parse(project.chapters);
	}
	if (typeof project.ai_titles === 'string') {
		project.ai_titles = JSON.parse(project.ai_titles);
	}
	return project;
};

export const serializeProject = (project: Project) => {
	if (typeof project.chapters !== 'string') {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		project.chapters = JSON.stringify(project.chapters);
	}
	if (typeof project.ai_titles !== 'string') {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		project.ai_titles = JSON.stringify(project.ai_titles);
	}
	return project;
};

export function createData() {
	let projects: Project[] = $state([]);
	let project: Project | undefined = $state();

	$inspect(project);

	async function sync() {
		projects = (await localDB.projects.toArray()).map(deserializeProject);
	}

	async function save(project_updates: { id: string } & Partial<Project>, update_state = false) {
		const current = (await localDB.projects.get(project_updates.id)) as Project;
		const updated_project = { ...current, ...project_updates, updatedAt: new Date().toISOString() };
		await localDB.projects.put(serializeProject(updated_project));
		await sync();
		if (update_state) {
			project = projects.find((item) => item.id === project_updates.id);
		}
	}

	async function add() {
		const db_project = {
			id: String(generate_id()),
			notes: '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			name: '900 - New Project',
			status: 'INITIAL' as ProjectStatus,
			frontmatter: ``
		};
		await localDB.projects.put(db_project);
		await sync();
		goto(`/project/${db_project.id}`);
	}

	async function load(id: string) {
		const loaded = await localDB.projects.get(id);
		if (loaded) {
			project = deserializeProject(loaded);
		}
	}

	async function export_to_json() {
		try {
			// Fetch all invoices from the database
			const all_projects = await localDB.projects.toArray();

			// Convert the data to a JSON string
			const jsonString = JSON.stringify(all_projects, null, 2);

			// Create a Blob with the JSON data
			const blob = new Blob([jsonString], { type: 'application/json' });

			// Create a temporary URL for the Blob
			const url = URL.createObjectURL(blob);

			// Create a link element and trigger the download
			const link = document.createElement('a');
			link.href = url;
			link.download = 'syntax_assistant_database_export.json';
			document.body.appendChild(link);
			link.click();

			// Clean up
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error exporting database:', error);
			alert('An error occurred while exporting the database. Please try again.');
		}
	}

	async function import_from_json(event: Event) {
		try {
			if (!(event.target instanceof HTMLInputElement)) {
				throw new Error('Event target is not an input element');
			}
			const file = event?.target?.files?.[0];
			if (!file) {
				throw new Error('No file selected');
			}

			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const text = e.target?.result;
					if (typeof text !== 'string') {
						throw new Error('FileReader did not return a string');
					}

					if (text) {
						const jsonData = JSON.parse(text);

						// Start a transaction
						await localDB.transaction('rw', localDB.projects, async () => {
							// Clear existing data (optional, remove if you want to keep existing data)
							await localDB.projects.clear();

							// Add all projects from the JSON file
							await localDB.projects.bulkAdd(jsonData);
							await sync();
						});

						alert('Data imported successfully!');
					}
				} catch (error) {
					console.error('Error parsing or importing JSON:', error);
					alert('Error importing data. Please check the file format and try again.');
				}
			};

			reader.readAsText(file);
		} catch (error) {
			console.error('Error importing database:', error);
			alert('An error occurred while importing the database. Please try again.');
		}
	}

	async function set_project_status(id: string, status: ProjectStatus) {
		if (project) {
			project.status = status;
			save({ id, status });
		}
	}

	return {
		get projects() {
			return projects;
		},
		get project() {
			return project;
		},
		set_project_status,
		sync,
		save,
		add,
		load,
		export_to_json,
		import_from_json
	};
}

export const app_data = createData();
