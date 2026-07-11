<script lang="ts">
import Footer from '$lib/components/Footer.svelte';
import '../app.css';
import '@fontsource/crimson-text';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>Toby Jordan</title>
</svelte:head>

<div class="body">
  {@render children()}
</div>

<Footer />

<style>
  .body {
    min-height: 100vh;
  }
</style>
