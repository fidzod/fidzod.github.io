<script lang="ts">
import type { Post } from '$lib/blog';

let {
  posts,
  title = 'Blog',
  seeAll = true
}: {
  posts: Post[];
  title?: string;
  seeAll?: boolean;
} = $props();
</script>

<h2>{title}</h2>
<p><em>Writings on technology, philosophy, and their intersection</em></p>

<ul class="blog-posts">
  {#each posts as post (post.slug)}
    <li>
      <article>
        <a href="/blog/{post.slug}">{post.meta.title}</a>
        <time datetime={post.meta.date}
          >({new Date(post.meta.date).toLocaleDateString()})</time
        >
        <p>{post.meta.description}</p>
        <ul class="tags">
          {#each post.meta.tags as tag}
          <li>{tag}</li>
          {/each}
        </ul>
      </article>
    </li>
  {/each}
  {#if seeAll}
  <li class="see-all">
    <a href="/blog">See all...</a>
  </li>
  {/if}
</ul>

<style>
  ul.blog-posts {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  article {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  article * {
    margin: 0;
  }
  time {
    font-size: var(--text-sm);
  }
  ul.tags {
    display: flex;
    gap: var(--space-sm);
  }
  ul.tags li {
    background-color: #eee;
    border: 1px solid #aaa;
    padding-inline: var(--space-xs);
    font-size: var(--text-sm);
  }
</style>
