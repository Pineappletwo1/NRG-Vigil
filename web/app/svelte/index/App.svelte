<script>
  import NavBar from "./NavBar.svelte";
</script>

<main class="bg-background min-h-screen">
	<NavBar />
	<div class="w-[95%] mx-auto mt-8 mb-8 flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8 min-h-[80vh] flex flex-col items-center justify-center relative">
	<img
		src="static/images/upload.png"
		alt="upload"
		class="w-64 h-64 object-contain mb-8 mt-[-2rem]"
	/>
	<p class="text-text text-3xl font-medium">Drag or click files</p>
	</div>
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
