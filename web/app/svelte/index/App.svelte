<script>
  import NavBar from "./NavBar.svelte";
  import DataPage from "./Pages/DataPage.svelte";
  import ImportPage from "./Pages/ImportPage.svelte";

  let route = "/ImportPage"; // Current route as string

  // Map routes to navbar indices
  const routeToIndex = {
    "/ImportPage": 0,
    "/DataPage": 1,
    "/ViewPage": 2,
    "/ExportPage": 3,
  };

  // Convert route string to active index
  $: activeIndex = routeToIndex[route] ?? 0;

  // Handle navigation from NavBar
  function handleNavChange(event) {
    const newIndex = event.detail.index;
    const routes = ["/ImportPage", "/DataPage", "/ViewPage", "/ExportPage"];
    route = routes[newIndex];
  }
</script>

<main class="bg-background min-h-screen p-8 grid grid-rows-[auto_1fr] gap-8">
  <NavBar active={activeIndex} on:navigate={handleNavChange} />

  {#if route === "/ImportPage"}
    <ImportPage />
  {:else if route === "/DataPage"}
    <DataPage />
  {/if}
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
