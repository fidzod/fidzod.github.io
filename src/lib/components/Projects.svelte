<script lang="ts">
  import projectData from "$lib/content/projects.yaml";

  interface Project {
    name: string;
    url: string;
    description: string;
    tech: string[];
  }

  const projects = projectData as Project[];
</script>

<h2>Projects</h2>
<p><em>What I've been working on recently</em></p>

<ul class="projects">
  {#each projects as project}
    <li class="card">
      <a href={project.url}>{project.name}</a>
      <p>{project.description}</p>
      <p class="tech">{project.tech.join(" · ")}</p>
    </li>
  {/each}
</ul>

<style>
  .projects {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .projects > li {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .projects > li * {
    margin: 0;
  }
  a {
    font-weight: bold;
  }
  p {
    font-size: var(--text-sm);
  }
  .tech {
    opacity: 0.55;
  }
</style>
