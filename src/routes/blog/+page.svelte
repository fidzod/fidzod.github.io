<script lang="ts">
import BlogSummary from '$lib/components/BlogSummary.svelte';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Toby Jordan's Blog</title>
  <meta name="description" content="Writings on technology, philosophy, and their intersection" />
  <meta property="og:title" content="Blog — Toby Jordan" />
  <meta property="og:description" content="Writings on technology, philosophy, and their intersection" />
  <meta property="og:url" content="https://tobyjordan.com/blog" />
</svelte:head>

<div class="prose">
  <BlogSummary posts={data.posts} title={"Toby Jordan's Blog"} seeAll={false} />
</div>
