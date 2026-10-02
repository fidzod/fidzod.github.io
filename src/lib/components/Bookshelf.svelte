<script lang="ts">
import bookshelfData from '$lib/content/bookshelf.yaml';

interface Book {
  name: string;
  author: string;
  year: string;
  cover: string;
}

const books = bookshelfData as Book[];

function positionTooltip(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const isLast = el.parentElement?.nextElementSibling == null;

  el.style.setProperty(
    '--tooltip-x',
    `${e.clientX - rect.left + (isLast ? -10 : 10)}px`
  );
  el.style.setProperty('--tooltip-y', `${e.clientY - rect.top + 10}px`);
  el.style.setProperty(
    '--tooltip-transform',
    isLast ? 'translate(-100%, 0)' : 'translate(0, 0)'
  );
}
</script>

<h2>Bookshelf</h2>
<p><em>Some of my favourites</em></p>

<ul class="books">
  {#each books as book}
    <li class="book-item">
      <button
        type="button"
        class="book"
        style="--cover-url: url({book.cover})"
        aria-label="{book.name} by {book.author}, {book.year}"
        onmousemove={positionTooltip}
        onclick={positionTooltip}
      >
        <span class="tooltip" role="tooltip">
          <strong>{book.name}</strong>
          <span>{book.author}, {book.year}</span>
        </span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .books {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .book-item {
    margin: 0;
    width: calc(25% - 1em);
    aspect-ratio: 1/1.5;
  }

  .book {
    all: unset;
    box-sizing: border-box;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-image: var(--cover-url);
    border-radius: 5px;
    border: 2px solid var(--border-subtle);
    box-shadow: inset 0 0 10px 5px rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transform: translateZ(0);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;

    &:before {
      content: "";
      display: block;
      position: absolute;
      inset: 0 auto 0 5%;
      width: 6px;
      background: linear-gradient(90deg, transparent, white, transparent);
      opacity: 0.2;
    }

    &:hover,
    &:focus-visible {
      z-index: 1;
      transform: translateY(-0.4em) translateZ(0);
      box-shadow:
        inset 0 0 10px 5px rgba(255, 255, 255, 0.2),
        0 0.8em 0.8em -0.4em rgba(0, 0, 0, 0.35);
      outline: none;
    }

    &:hover .tooltip,
    &:focus-visible .tooltip {
      opacity: 0.85;
      visibility: visible;
    }
  }

  .tooltip {
    position: absolute;
    left: var(--tooltip-x, 50%);
    top: var(--tooltip-y, 0%);
    transform: var(--tooltip-transform, translate(-50%, calc(-100% - 0.5em)));
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: max-content;
    max-width: 11em;
    padding: var(--space-xs);
    border: 1px solid var(--border-subtle);
    border-radius: var(--border-radius);
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: var(--text-sm);
    text-align: center;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.15s ease;

    strong {
      font-weight: 600;
    }

    span {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.85em;
    }
  }
</style>
