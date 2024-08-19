<script lang="ts">
  import { app_data } from "$state/Project.svelte.js";
  let { data } = $props();
</script>

<h1
  oninput={(e) => {
    app_data.save({ id: data.id, name: e.target.innerHTML });
  }}
  contenteditable
>
  {app_data.project.name}
</h1>
