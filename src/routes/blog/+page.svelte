<script lang="ts">
  import BlogSummary from '$lib/components/BlogSummary.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="prose">
  <BlogSummary posts={data.posts} title={"Toby Jordan's Blog"} />
</div>
