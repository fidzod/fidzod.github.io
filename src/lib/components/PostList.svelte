<script lang="ts">
  import type { Post } from "$lib/blog";

  let {
    posts,
    title = "Blog",
    seeAll = true,
  }: {
    posts: Post[];
    title?: string;
    seeAll?: boolean;
  } = $props();

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

{#if seeAll}
<h2>{title}</h2>
{:else}
<h1>{title}</h1>
{/if}
<p><em>Writings on technology, philosophy, and their intersection</em></p>

<ul class="post-list">
  {#each posts as post (post.slug)}
    <li class="card">
      <article>
        <a href="/blog/{post.slug}">{post.meta.title}</a>
        <div class="meta">
          <time datetime={post.meta.date}>{formatDate(post.meta.date)}</time>
          {#if post.meta.tags?.length}
            <span>{post.meta.tags.join(" · ")}</span>
          {/if}
        </div>
        <p>{post.meta.description}</p>
      </article>
    </li>
  {/each}
  {#if seeAll}
    <li><a href="/blog">See all →</a></li>
  {/if}
</ul>

<style>
  ul.post-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  article {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  article * {
    margin: 0;
  }
  a {
    font-weight: bold;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .meta time {
    white-space: nowrap;
  }
</style>
