<script lang="ts">
  import mapImage from '$lib/assets/map.png';
</script>

<div class="map" style="--bg-image: url({mapImage})">
  <ul>
    <li data-link="home"><a href="/">Home</a></li>
    <li data-link="github"><a href="https://github.com/fidzod">Github</a></li>
    <li data-link="contact"><a href="mailto:mail@tobyjordan.com">Contact</a></li>
    <li data-link="blog"><a href="/blog">Blog</a></li>
    <li data-link="dotfiles"><a href="https://github.com/fidzod/kaworu-linux">Dotfiles</a></li>
  </ul> 
</div>

<style>
  .map {
    position: relative;
    width: 300px;
    height: 400px;
    background-image: var(--bg-image);
    background-size: 100%;
  }
  li {
    position: absolute;
    padding: 0.2rem 0.5rem;
    border-radius: 40%;
    background-color: var(--bg);
    box-shadow: 
      0 0 10px 10px var(--bg),
      0 0 0 5px var(--bg) inset;
  }
  a {
    --link-color: var(--text-primary);
  }
  li[data-link="home"]     { top: 70px; left: 50px; }
  li[data-link="github"]   { top: 120px; left: 210px; }
  li[data-link="contact"]  { top: 210px; left: 230px; }
  li[data-link="blog"]     { top: 170px; left: 20px; }
  li[data-link="dotfiles"] { top: 300px; left: 200px; }
</style>


