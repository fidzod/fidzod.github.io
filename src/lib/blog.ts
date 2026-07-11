import type { SvelteComponent } from 'svelte';

export interface PostMeta {
  title: string;
  date: string;
  description: string;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  component: typeof SvelteComponent;
}

const modules = import.meta.glob<{
  default: typeof SvelteComponent;
  metadata: PostMeta;
}>('/src/lib/content/blog/*.md', { eager: true });

export const getPosts = (): Post[] =>
  Object.entries(modules)
    .map(([path, module]) => {
      const slug = path.split('/').at(-1)!.replace('.md', '');
      return {
        slug,
        meta: module.metadata,
        component: module.default
      };
    })
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
    );
