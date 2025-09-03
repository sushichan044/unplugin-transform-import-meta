<script>
const title = "Svelte Test Page";
const env = import.meta.env.NODE_ENV;
const baseUrl = import.meta.env.BASE_URL;
const apiUrl = import.meta.env.API_URL || "http://localhost";
</script>

<script module>
  const version = import.meta.env.VERSION;
  const debug = import.meta.env.DEBUG;
</script>

<main>
  <h1>{title}</h1>
  <p>Environment: {env}</p>
  <p>Base URL: {baseUrl}</p>
  <p>API URL: {apiUrl}</p>
  
  {#if import.meta.env.DEBUG}
    <div>Debug mode is enabled</div>
  {/if}
  
  {#each import.meta.glob('./files/*.js') as file}
    <p>File: {file}</p>
  {/each}
  
  {@const config = import.meta.env.CONFIG}
  <p>Config: {config}</p>
  
  <div class="{import.meta.env.THEME}">
    Themed content
  </div>
  
  <img bind:src={import.meta.env.IMAGE_URL} alt="Dynamic image" />
</main>

<style>
  main {
    padding: 1rem;
  }
</style>