<script>
  import { createEventDispatcher } from 'svelte';
  
  export let active = 0; // Accept active as prop from parent
  const dispatch = createEventDispatcher();
  
  const navItems = ["Import", "Data", "View", "Export"];
  const highlightPositions = [
    "left-[12.5%]",
    "left-[37.5%]",
    "left-[62.5%]",
    "left-[87.5%]",
  ];
  
  function setActiveIndex(idx) {
    // Dispatch event to parent instead of setting local state
    dispatch('navigate', { index: idx });
  }

  function handleKeydown(event, idx) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(idx);
    }
  }
</script>

<nav
  class="relative mx-8 h-16 bg-primary rounded-full flex items-center shadow-lg border-2 border-accent overflow-visible"
>
  <div
    class={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-14 w-1/4 bg-secondary rounded-full z-0 shadow-md transition-all duration-300 ${highlightPositions[active]}`}
  ></div>
  <div class="flex-1 relative h-full z-10">
    {#each navItems as item, idx}
      <span
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-text font-semibold text-lg cursor-pointer select-none"
        style="left: {12.5 + idx * 25}%"
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
