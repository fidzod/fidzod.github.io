export const themes = [
  { id: 'chicago-day', name: 'Chicago' },
  { id: 'black-metal-burzum', name: 'Burzum' },
  { id: 'apathy', name: 'Apathy' },
  { id: 'catppuccin-macchiato', name: 'Macchiato' },
  { id: 'catppuccin-latte', name: 'Latte' },
] as const satisfies readonly { id: string; name: string }[];

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME = 'chicago-day' satisfies ThemeId;
