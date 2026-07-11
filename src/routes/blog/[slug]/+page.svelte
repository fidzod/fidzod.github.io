<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.post.meta.title} — Toby Jordan</title>
  <meta name="description" content={data.post.meta.description} />
  <meta property="og:title" content={data.post.meta.title} />
  <meta property="og:description" content={data.post.meta.description} />
  <meta property="og:type" content="article" />
  <meta
    property="og:url"
    content="https://tobyjordan.com/blog/{data.post.slug}"
  />
</svelte:head>

<article>
  <div class="prose">
    <h1>{data.post.meta.title}</h1>
    <div class="meta">
      <time datetime={data.post.meta.date}>
        {new Date(data.post.meta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </time>
      {#if data.post.meta.tags?.length}
        <span>{data.post.meta.tags.join(' · ')}</span>
      {/if}
    </div>
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
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    opacity: 0.6;
  }
  time {
    white-space: nowrap;
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
  :global(article ol) {
    padding-inline-start: var(--space-lg);
    :global(li) {
      list-style: decimal;
    }
  }
</style>
