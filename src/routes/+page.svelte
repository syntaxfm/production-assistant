<script lang="ts">
  import { iso_to_plain_date } from "$/lib/utils/date";
  import { app_data } from "$state/Project.svelte";
  import { invoke } from "@tauri-apps/api/core";

  app_data.sync();
</script>

<div class="content">
  <h1>My Projects</h1>
  <div class="grid">
    <button onclick={app_data.add}>+ New Project</button>
    {#each app_data.projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) as project}
      <a class="button" href="project/{project.id}">
        <h2>
          {project.name}
        </h2>
        <p>
          Created: {iso_to_plain_date(project.createdAt)}
        </p>
      </a>
    {/each}
  </div>
</div>

<style>
  button,
  .button {
    aspect-ratio: 16/9;
    border-radius: 4px;
    border: solid 1px var(--fg);
    background-color: transparent;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    justify-content: space-between;
    padding: 20px;
    color: var(--fg);
    h2 {
      margin: 0;
      font-size: var(--fs-base);
    }
    p {
      margin: 0;
      font-size: var(--fs-xxs);
    }
    &:hover {
      background: var(--tint-or-shade);
    }
  }
  button {
    justify-content: center;
    align-items: center;
  }
</style>
