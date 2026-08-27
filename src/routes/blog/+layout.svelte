<script lang="ts">
import Navbar from '$lib/components/Navbar.svelte';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();
</script>

<main>
  {@render children()}
</main>

<style>
  main {
    width: 100%;
  }
  :global(article img) {
    width: 100%;
  }
</style>
