import { localDB } from "../db/local_db";

export interface Project {
  id: string;
  name?: string;
}

function createData() {
  let projects: Project[] = $state([]);

  async function sync() {
    projects = await localDB.projects.toArray();
  }

  async function save(project: Project) {
    await localDB.projects.put(project);
  }

  async function add() {
    let db_project = {
      id: Date.now().toString(36),
    };
    await localDB.projects.put(db_project);
  }

  return { projects, sync, save };
}

export const data = createData();
