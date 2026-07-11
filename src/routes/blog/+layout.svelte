<script lang="ts">
import Navbar from '$lib/components/Navbar.svelte';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();
</script>

<main>
  <Navbar />

  {@render children()}
</main>

<style>
  main {
    width: calc(100vw - 2rem);
    max-width: 620px;
    min-height: 75vh;
    margin: var(--space-lg) auto;
  }
  :global(article img) {
    width: 100%;
  }
</style>
