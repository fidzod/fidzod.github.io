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

{@render children()}

<Footer />
