// Generates TextMate token rules from Base16 syntax colors (base03, base05, base08–base0F).
function tokenColors(b) {
  return [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: b.base03 },
    },
    {
      scope: ['variable', 'variable.other', 'entity.name.variable', 'markup.deleted'],
      settings: { foreground: b.base08 },
    },
    {
      scope: [
        'constant', 'constant.numeric', 'constant.character', 'constant.other',
        'constant.language', 'variable.other.constant', 'support.type.property-name',
      ],
      settings: { foreground: b.base09 },
    },
    {
      scope: [
        'entity.name.class', 'entity.name.type', 'entity.other.inherited-class',
        'support.class', 'markup.bold', 'entity.other.attribute-name',
      ],
      settings: { foreground: b.base0A },
    },
    {
      scope: ['string', 'string.template', 'markup.inserted', 'punctuation.definition.string'],
      settings: { foreground: b.base0B },
    },
    {
      scope: ['support', 'support.type', 'string.regexp', 'markup.quote', 'variable.parameter'],
      settings: { foreground: b.base0C },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call', 'markup.heading'],
      settings: { foreground: b.base0D },
    },
    {
      scope: [
        'keyword', 'storage.type', 'storage.modifier',
        'keyword.control', 'keyword.operator',
      ],
      settings: { foreground: b.base0E },
    },
    {
      scope: ['invalid.deprecated', 'meta.embedded'],
      settings: { foreground: b.base0F },
    },
    {
      scope: ['punctuation', 'punctuation.separator', 'punctuation.terminator'],
      settings: { foreground: b.base05 },
    },
  ];
}

// chicago-day: Wendell, Ryan <ryanjwendell@gmail.com> via tinted-theming
export const chicagoDayTheme = {
  name: 'chicago-day',
  type: 'light',
  colors: { 'editor.background': '#e8f0ea', 'editor.foreground': '#364c40' },
  tokenColors: tokenColors({
    base03: '#8a9a91',
    base05: '#364c40',
    base08: '#c60c30',
    base09: '#f9461c',
    base0A: '#968400',
    base0B: '#009b3a',
    base0C: '#00a1de',
    base0D: '#522398',
    base0E: '#e27ea6',
    base0F: '#62361b',
  }),
};

// black-metal-burzum: metalelf0 (https://github.com/metalelf0)
export const burzumTheme = {
  name: 'black-metal-burzum',
  type: 'dark',
  colors: { 'editor.background': '#000000', 'editor.foreground': '#c1c1c1' },
  tokenColors: tokenColors({
    base03: '#333333',
    base05: '#c1c1c1',
    base08: '#5f8787',
    base09: '#aaaaaa',
    base0A: '#99bbaa',
    base0B: '#ddeecc',
    base0C: '#aaaaaa',
    base0D: '#888888',
    base0E: '#999999',
    base0F: '#444444',
  }),
};

// apathy: tinted-theming/base16-schemes
export const apathyTheme = {
  name: 'apathy',
  type: 'dark',
  colors: { 'editor.background': '#031a16', 'editor.foreground': '#81b5ac' },
  tokenColors: tokenColors({
    base03: '#2b685e',
    base05: '#81b5ac',
    base08: '#3e9688',
    base09: '#3e7996',
    base0A: '#3e4c96',
    base0B: '#883e96',
    base0C: '#963e4c',
    base0D: '#96883e',
    base0E: '#4c963e',
    base0F: '#3e965b',
  }),
};
