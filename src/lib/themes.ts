export const themes = [
  { id: 'chicago-day', name: 'chicago-day' },
  { id: 'black-metal-burzum', name: 'burzum' },
  { id: 'apathy', name: 'apathy' },
  { id: 'catppuccin-macchiato', name: 'macchiato' },
  { id: 'catppuccin-latte', name: 'latte' },
] as const satisfies readonly { id: string; name: string }[];

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME = 'chicago-day' satisfies ThemeId;
