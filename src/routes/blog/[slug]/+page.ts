import { getPosts } from '$lib/blog';
import { error } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
  return getPosts().map((p) => ({ slug: p.slug }));
};

export const load: PageLoad = ({ params }) => {
  const posts = getPosts();
  const index = posts.findIndex((p) => p.slug === params.slug);

  if (index === -1) error(404, 'Post not found');

  return {
    post: posts[index],
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null
  };
};
