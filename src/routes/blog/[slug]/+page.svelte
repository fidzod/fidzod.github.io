<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<article>
  <div class="prose">
    <h1>{data.post.meta.title}</h1>
    <p><time datetime={data.post.meta.date}>
      {new Date(data.post.meta.date).toLocaleDateString()}
    </time></p>
    <data.post.component />
  </div>
</article>

<nav>
  {#if data.prev}
    <a href="/blog/{data.prev.slug}">« Previous</a>
  {:else}
    <span aria-disabled="true">« Previous</span>
  {/if}

  {#if data.next}
    <a href="/blog/{data.next.slug}">» Next</a>
  {:else}
    <span aria-disabled="true">» Next</span>
  {/if}
</nav>

<style>
  article {
    margin-block-end: var(--space-lg);
  }
  nav {
    margin-block-end: var(--space-xl);
    display: flex;
    gap: var(--space-lg);
  }
  :global(article ul) {
    padding-inline-start: var(--space-lg);
    :global(li) {
      list-style: disc;
    }
  }
</style>
