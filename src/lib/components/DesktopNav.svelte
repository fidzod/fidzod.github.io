<script lang="ts">
import Avatar from '$lib/assets/avatar.png';
import LinkedInIcon from '$lib/assets/linkedin.png';
import GithubIcon from '$lib/assets/github.png';
import {
  Send as Mail,
  FileText as Blog,
  MapPin,
  Clock
} from '@lucide/svelte/icons';
import { getLocalTimeString } from '$lib/time';

let time = $state(getLocalTimeString());

$effect(() => {
  const interval = setInterval(() => {
    time = getLocalTimeString();
  }, 1000 * 10);

  return () => clearInterval(interval);
});
</script>

<nav>
  <img src={Avatar} alt="Avatar" class="avatar" />

  <div class="links">
    <a href="https://github.com/fidzod" title="GitHub">
      <img src={GithubIcon} alt="Github Icon" />
    </a>
    <a
      href="https://www.linkedin.com/in/toby-jordan-42b227419"
      title="LinkedIn"
    >
      <img src={LinkedInIcon} alt="LinkedIn Icon" />
    </a>
    <a href="mailto:mail@tobyjordan.com" title="Email">
      <Mail size={15} />
    </a>
    <a href="/blog" title="Blog">
      <Blog size={15} />
    </a>
  </div>

  <section>
    <h1>Toby Jordan</h1>
    <p>Self-Taught Programmer and Philosophy & RS Graduate</p>
  </section>

  <ul>
    <li>
      <MapPin size={15} /> Manchester, UK
    </li>
    <li>
      <Clock size={15} /> {time}
    </li>
  </ul>
</nav>

<style>
  nav {
    width: 160px;
    position: sticky;
    top: calc(24px + var(--space-xl));
    margin-block-start: 24px;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    font-size: var(--text-sm);
  }
  img.avatar {
    display: block;
    width: 100%;
    margin-inline: auto;
    border-radius: 50%;
    border: 1px solid black;
  }
  .links {
    width: fit-content;
    margin-inline: auto;
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }
  .links img {
    width: 1rem;
  }
  :global(.links .lucide) {
    color: var(--text-primary);
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  li {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }
</style>
