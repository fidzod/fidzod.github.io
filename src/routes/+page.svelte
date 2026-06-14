<script lang="ts">
  import BlogSummary from '$lib/components/BlogSummary.svelte';
  import ImageMenu from '$lib/components/ImageMenu.svelte';
  import Bio from '$lib/content/bio.md';
  import Projects from '$lib/content/projects.md';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div id="container">
  <aside>
    <ImageMenu />
  </aside>
  <main>
    <div class="prose">
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
    margin-block-start: var(--space-lg);
    margin-inline-end: var(--space-lg);
  }
  @media (max-width: 800px) {
    aside {
      display: none;
    }
    main {
      margin: var(--space-md) var(--space-lg);
    }
  }
</style>
