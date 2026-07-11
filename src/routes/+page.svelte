<script lang="ts">
import BlogSummary from '$lib/components/BlogSummary.svelte';
import DesktopNav from '$lib/components/DesktopNav.svelte';
import MobileHeader from '$lib/components/MobileHeader.svelte';
import Bio from '$lib/content/bio.md';
import Projects from '$lib/content/projects.md';
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

<div id="container">
  <aside>
    <DesktopNav />
  </aside>
  <main>
    <div class="prose">
      <div class="mobile-only">
        <MobileHeader />
      </div>
      <Bio />
      <Projects />
      <BlogSummary posts={data.posts} />
    </div>
  </main>
</div>

<style>
  #container {
    width: fit-content;
    max-width: 800px;
    display: flex;
    gap: var(--space-lg);
    margin: var(--space-xl) auto;
  }
  main {
    margin-inline-end: var(--space-lg);
  }
  .mobile-only {
    margin-block-end: 4rem;
    display: none;
  }
  @media (max-width: 800px) {
    aside {
      display: none;
    }
    main {
      margin: var(--space-sm) var(--space-lg);
    }
    #container {
      margin-block-start: var(--space-lg);
    }
    .mobile-only {
      display: block;
    }
  }
</style>
