import { getPosts } from '$lib/blog';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    posts: getPosts().slice(0, 3)
  };
};

export const prerender = true;
