import { goto } from "$app/navigation";
import { localDB } from "../db/local_db";
import { generate_id } from "../utils/date";

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
      id: String(generate_id()),
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

  async function export_to_json() {
    try {
      // Fetch all invoices from the database
      const all_projects = await localDB.projects.toArray();

      // Convert the data to a JSON string
      const jsonString = JSON.stringify(all_projects, null, 2);

      // Create a Blob with the JSON data
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a temporary URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a link element and trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = "syntax_assistant_database_export.json";
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting database:", error);
      alert("An error occurred while exporting the database. Please try again.");
    }
  }

  async function import_from_json(event) {
    try {
      const file = event.target.files[0];
      if (!file) {
        throw new Error("No file selected");
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);

          // Start a transaction
          await localDB.transaction("rw", localDB.projects, async () => {
            // Clear existing data (optional, remove if you want to keep existing data)
            await localDB.projects.clear();

            // Add all projects from the JSON file
            await localDB.projects.bulkAdd(jsonData);
            await sync();
          });

          alert("Data imported successfully!");
        } catch (error) {
          console.error("Error parsing or importing JSON:", error);
          alert("Error importing data. Please check the file format and try again.");
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing database:", error);
      alert("An error occurred while importing the database. Please try again.");
    }
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
    export_to_json,
    import_from_json,
  };
}

export const app_data = createData();
