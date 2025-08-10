<script>
  import NavBar from "./NavBar.svelte";
  import ImportPage from "./Pages/ImportPage.svelte";
</script>

<main class="bg-background min-h-screen pt-8">
  <NavBar />
  <ImportPage />
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
