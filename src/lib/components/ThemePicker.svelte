<script lang="ts">
  import { browser } from '$app/environment';
  import { themes, DEFAULT_THEME } from '$lib/themes';
  import { SwatchBook } from '@lucide/svelte/icons';

  let currentId = $state(DEFAULT_THEME);
  let open = $state(false);

  $effect(() => {
    if (browser) {
      currentId = localStorage.getItem('colorScheme') ?? DEFAULT_THEME;
    }
  });

  const currentName = $derived(themes.find((t) => t.id === currentId)?.name ?? currentId);

  function setTheme(id: string) {
    currentId = id;
    open = false;
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('colorScheme', id);
  }
</script>

<div class="theme-picker">
  <button class="trigger" onclick={() => (open = !open)}>
    <SwatchBook size={13} />
    <span>{currentName}</span>
  </button>
  {#if open}
    <ul>
      {#each themes as theme}
        <li>
          <button
            class:active={currentId === theme.id}
            onclick={() => setTheme(theme.id)}
          >{theme.name}</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .theme-picker {
    position: relative;
    font-size: var(--text-sm);
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    text-align: left;
  }
  ul {
    position: absolute;
    z-index: 1;
    top: 100%;
    left: 0;
    display: flex;
    flex-direction: column;
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--border-radius);
    margin-block-start: var(--space-xs);
  }
  ul button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: var(--text-muted);
    text-align: left;
  }
  ul button.active {
    color: var(--text-link);
  }
  ul button:hover:not(.active) {
    color: var(--text-primary);
  }
</style>
