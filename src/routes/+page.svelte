<script lang="ts">
  import { app_data } from "$state/Project.svelte";
  import { invoke } from "@tauri-apps/api/core";

  app_data.sync();
</script>

<div class="content">
  <h1>My Projects</h1>
  <div class="grid">
    <button onclick={app_data.add}>+ New Project</button>
    {#each app_data.projects as project}
      <a class="button" href="project/{project.id}">{project.name}</a>
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
    &:hover {
      background: var(--tint-or-shade);
    }
  }
</style>
