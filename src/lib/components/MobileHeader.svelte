<script lang="ts">
import Avatar from '$lib/assets/avatar.png';
</script>

<img src={Avatar} alt="Avatar">

<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/blog">Blog</a></li>
    <li><a href="https://github.com/fidzod">Github</a></li>
    <li><a href="mailto:mail@tobyjordan.com">Contact</a></li>
  </ul>
</nav>

<style>
  img {
    width: 100px;
    border-radius: 50%;
    display: block;
    margin-inline: auto;
    border: 1px solid black;
  }
  ul {
    width: fit-content;
    display: flex;
    align-items: flex-end;
    gap: var(--space-md);
    margin-inline: auto;
  }
</style>
