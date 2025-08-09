<script>
  let active = 0;
  const navItems = ["Import", "Data", "View", "Export"];
  const highlightPositions = ["left-1", "left-1/4", "left-2/4", "left-3/4"];

  function setActiveIndex(idx) {
    active = idx;
  }

  function handleKeydown(event, idx) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveIndex(idx);
    }
  }
</script>

<nav class="relative w-[95%] mx-auto h-16 bg-primary rounded-full flex items-center shadow-lg border-2 border-accent px-8 overflow-visible">
  <div
    class={`absolute top-1/2 -translate-y-1/2 h-14 w-1/4 bg-secondary rounded-full z-0 shadow-md transition-all duration-300 ${highlightPositions[active]}`}
  ></div>
  <div class="flex-1 flex items-center h-full justify-between px-48 relative z-10">
    {#each navItems as item, idx}
      <span
        class="text-text font-semibold text-lg cursor-pointer select-none"
        role="button"
        tabindex="0"
        on:click={() => setActiveIndex(idx)}
        on:keydown={(event) => handleKeydown(event, idx)}
      >
        {item}
      </span>
    {/each}
  </div>
</nav>
