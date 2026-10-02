<script lang="ts">
  import bookshelfData from "$lib/content/bookshelf.yaml";

  interface Book {
    name: string;
    author: string;
    year: string;
    cover: string;
  }

  const books = bookshelfData as Book[];
</script>

<h2>Bookshelf</h2>
<p><em>A few books I have enjoyed</em></p>

<ul class="books">
  {#each books as book}
    <li
      class="book"
      style="--cover-url: url({book.cover})"
      title="{book.name}
{book.author}
{book.year}"
    ></li>
  {/each}
</ul>

<style>
  .books {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .book {
    position: relative;
    width: calc(25% - 1em);
    aspect-ratio: 1/1.5;
    margin: 0;
    background-size: cover;
    background-position: center;
    background-image: var(--cover-url);
    border-radius: 5px;
    border: 2px solid var(--border-subtle);
    box-shadow: inset 0 0 10px 5px rgba(255, 255, 255, 0.2);

    &:before {
      content: "";
      display: block;
      position: absolute;
      inset: 0 auto 0 5%;
      width: 6px;
      background: linear-gradient(90deg, transparent, white, transparent);
      opacity: 0.2;
    }
  }
</style>
