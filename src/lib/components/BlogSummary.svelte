<script lang="ts">
  import type { Post } from "$lib/blog";

  let { posts, title = "Blog" }: {
    posts: Post[],
    title: string,
  } = $props();
</script>

<h2>{title}</h2>
<p><em>Writings on technology, philosophy, and their intersection</em></p>

<ul>
  {#each posts as post (post.slug)}
    <li>
      <article>
        <a href="/blog/{post.slug}">{post.meta.title}</a>
        <time datetime={post.meta.date}
          >({new Date(post.meta.date).toLocaleDateString()})</time
        >
        <p>{post.meta.description}</p>
      </article>
    </li>
  {/each}
  <li class="see-all">
    <a href="/blog">See all...</a>
  </li>
</ul>

<style>
  ul {
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
</style>
