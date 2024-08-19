import { goto } from "$app/navigation";
import { localDB } from "../db/local_db";

export interface Project {
  id: string;
  name?: string;
}

function createData() {
  let projects: Project[] = $state([]);
  let project: Project | undefined = $state();

  async function sync() {
    projects = await localDB.projects.toArray();
  }

  async function save(project: Project) {
    const curret = await localDB.projects.get(project.id);
    let updated_project = { ...curret, ...project, updatedAt: new Date().toISOString() };
    await localDB.projects.put(updated_project);
    await sync();
  }

  async function add() {
    let db_project = {
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: "New Project",
    };
    await localDB.projects.put(db_project);
    await sync();
    goto("/project/" + db_project.id);
  }

  async function load(id: string) {
    project = await localDB.projects.get(id);
  }

  return {
    get projects() {
      return projects;
    },
    get project() {
      return project;
    },
    sync,
    save,
    add,
    load,
  };
}

export const app_data = createData();
