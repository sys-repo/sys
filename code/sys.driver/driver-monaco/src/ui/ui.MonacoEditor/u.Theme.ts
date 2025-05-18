import { Color, type t } from './common.ts';

export const Theme = {
  init(monaco: t.Monaco) {
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
    define(monaco: t.Monaco) {
      monaco.editor.defineTheme(Theme.Light.name, {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': Color.WHITE,
        },
      });
    },
  },

  Dark: {
    name: 'sys-dark',
    define(monaco: t.Monaco) {
      monaco.editor.defineTheme(Theme.Dark.name, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': Color.DARK,
          'editor.lineHighlightBorder': Color.toHex(Color.lighten(Color.DARK, 4)),
        },
      });
    },
  },
} as const;
