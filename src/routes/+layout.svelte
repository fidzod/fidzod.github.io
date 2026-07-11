<script lang="ts">
import Footer from '$lib/components/Footer.svelte';
import '../app.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
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
