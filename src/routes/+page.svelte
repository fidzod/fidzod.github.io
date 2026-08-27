<script lang="ts">
import Bio from '$lib/content/bio.md';
import Projects from '$lib/components/Projects.svelte';
import PostList from '$lib/components/PostList.svelte';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Toby Jordan</title>
  <meta
    name="description"
    content="Writings on technology, philosophy, and their intersection"
  />
  <meta property="og:title" content="Toby Jordan" />
  <meta
    property="og:description"
    content="Writings on technology, philosophy, and their intersection"
  />
  <meta property="og:url" content="https://tobyjordan.com" />
</svelte:head>

<section class="prose">
  <Bio />
</section>

<section class="prose">
  <Projects />
</section>

<section class="prose">
  <PostList posts={data.posts} />
</section>

<style>
  section {
    margin-block-end: var(--space-lg);
  }
</style>
