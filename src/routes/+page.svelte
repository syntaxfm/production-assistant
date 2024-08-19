<script lang="ts">
  import { data } from "$state/Project.svelte";
  import { invoke } from "@tauri-apps/api/core";
</script>

<div class="content">
  <h1>My Projects</h1>
  <div class="grid">
    <button>+ New Project</button>
    {#each data.projects as project}
      <button>{project.name}</button>
    {/each}
  </div>
</div>

<style>
  button {
  }
</style>
