import type { Project } from "$state/Project.svelte";
import Dexie from "dexie";

class LocalDB extends Dexie {
  projects: Dexie.Table<Project, string>;

  constructor() {
    super("SyntaxDB");
    this.version(1).stores({
      projects: "id",
    });
    this.projects = this.table("projects");
  }
}
export const localDB = new LocalDB();
