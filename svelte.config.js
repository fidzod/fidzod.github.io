import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';

const highlighter = await createHighlighter({
  themes: ['min-light'],
  langs: ['odin', 'typescript']
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({
      extensions: ['.md'],
      highlight: {
        highlighter: (code, lang) => {
          return highlighter.codeToHtml(code, {
            lang: lang ?? 'text',
            theme: 'min-light'
          })
          .replace(/\{/g, '&#123;')
          .replace(/\}/g, '&#125;');
        }
      }
    })
  ],
  kit: {
    adapter: adapter()
  }
};

export default config;
