import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';
import { chicagoDayTheme, burzumTheme, apathyTheme } from './src/lib/shiki-themes.js';

const highlighter = await createHighlighter({
  themes: [chicagoDayTheme, burzumTheme, apathyTheme, 'catppuccin-macchiato', 'catppuccin-latte'],
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
          return highlighter
            .codeToHtml(code, {
              lang: lang ?? 'text',
              themes: {
                'chicago-day': 'chicago-day',
                'black-metal-burzum': 'black-metal-burzum',
                'apathy': 'apathy',
                'catppuccin-macchiato': 'catppuccin-macchiato',
                'catppuccin-latte': 'catppuccin-latte',
              },
              defaultColor: false,
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
