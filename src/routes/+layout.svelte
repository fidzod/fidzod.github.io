<script lang="ts">
import '../app.css';
import '@fontsource-variable/crimson-pro/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import Footer from '$lib/components/Footer.svelte';
import Sidenav from '$lib/components/Sidenav.svelte';
import MobileHeader from '$lib/components/MobileHeader.svelte';
import type { Snippet } from 'svelte';
import type { LayoutData } from './$types';

let { children, data }: { children: Snippet, data: LayoutData } = $props();
</script>

<svelte:head>
  <title>Toby Jordan</title>
</svelte:head>

<div class="body">
  <div class="mobile">
    <MobileHeader />
  </div>
  <aside>
    <Sidenav posts={data.posts}/>
  </aside>
  <main>
    <div class="content">
      {@render children()}
    </div>
    <Footer />
  </main>
</div>

<style>
  .body {
    max-width: 700px;
    margin: var(--space-xl) auto 0;
    display: flex;
    gap: var(--space-lg);
  }
  main {
    max-width: 508px;
    overflow: hidden;
  }
  .content {
    min-height: 100vh;
    margin-block-end: var(--space-xl);
  }
  .mobile {
    display: none;
  }

  @media (max-width: 725px) {
    aside {
      display: none;
    }
    .body {
      margin-block-start: var(--space-lg);
      flex-direction: column;
    }
    main {
      width: calc(100% - var(--space-lg) * 2);
      margin-inline: auto;
    }
    .mobile {
      display: block;
    }
  }
</style>
