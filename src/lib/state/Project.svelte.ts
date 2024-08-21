import { goto } from '$app/navigation';
import { localDB } from '$lib/db/local_db';
import { generate_id } from '$lib/utils/date';
import type { Chapter } from '$lib/types/ffprobe';

export type ProjectStatus = 'INITIAL' | 'HOVERING' | 'DROPPED' | 'PROCESSING' | 'COMPLETED';
export interface Project {
	id: string;
	notes?: string;
	name: string;
	createdAt: string;
	chapters?: Chapter[];
	updatedAt: string;
	path?: string;
	mp3_path?: string;
	youtube_url?: string;
	status: ProjectStatus;
}

export const deserializeProject = (project: Project) => {
	if (typeof project.chapters === 'string') {
		project.chapters = JSON.parse(project.chapters);
	}
	return project;
};

export const serializeProject = (project: Project) => {
	if (typeof project.chapters !== 'string') {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		project.chapters = JSON.stringify(project.chapters);
	}
	return project;
};

export function createData() {
	let projects: Project[] = $state([]);
	let project: Project | undefined = $state();

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
			name: 'New Project',
			status: 'INITIAL' as ProjectStatus
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
