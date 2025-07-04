import { type t, Color } from './common.ts';

export const Theme = {
  init(monaco: t.Monaco.Monaco) {
    Theme.Light.define(monaco);
    Theme.Dark.define(monaco);
  },

  toName(theme: t.CommonTheme = 'Light') {
    if (theme === 'Light') return Theme.Light.name;
    if (theme === 'Dark') return Theme.Dark.name;
    throw new Error(`Theme '${theme}' not supported`);
  },

  Light: {
    name: 'sys-light',
    define(monaco: t.Monaco.Monaco) {
      const darken = (by: number) => Color.toHex(Color.darken(Color.WHITE, by));
      monaco.editor.defineTheme(Theme.Light.name, {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': Color.WHITE,
          'editorStickyScroll.border': darken(10),
          'editorStickyScroll.shadow': '#00000000', // remove.
        },
      });
    },
  },

  Dark: {
    name: 'sys-dark',
    define(monaco: t.Monaco.Monaco) {
      const lighten = (by: number) => Color.toHex(Color.lighten(Color.DARK, by));
      monaco.editor.defineTheme(Theme.Dark.name, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': Color.DARK,
          'editor.lineHighlightBorder': lighten(4),
          'editorStickyScroll.border': lighten(10),
          'editorStickyScroll.shadow': '#00000000', // remove.
        },
      });
    },
  },
} as const;
