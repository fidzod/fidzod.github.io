<script lang="ts">
import ThemePicker from './ThemePicker.svelte';
import { House, FileText as Blog } from '@lucide/svelte/icons';
</script>

<nav>
  <ul>
    <li>Toby Jordan</li>
    <li><a href="/"><House size={13} />Home</a></li>
    <li><a href="/blog"><Blog size={13} />Blog</a></li>
  </ul>
  <ThemePicker />
</nav>

<style>
  nav {
    margin-block: var(--space-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-lg);
    font-size: var(--text-sm);
  }
  ul {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }
  ul a {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    text-decoration: none;
  }
</style>
