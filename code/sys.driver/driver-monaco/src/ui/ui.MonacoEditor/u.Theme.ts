import { type t, Color } from './common.ts';
import { darkChromeColors } from './u.Theme.dark.chrome.ts';
import { Token } from './u.Theme.dark.tokens.ts';
import { hex } from './u.Theme.u.ts';

export const Theme = {
  init(monaco: t.Monaco.Monaco) {
    Theme.Light.define(monaco);
    Theme.Dark.define(monaco);
  },

  toRegisteredName(theme: t.CommonTheme = 'Light') {
    if (theme === 'Light') return Theme.Light.name;
    if (theme === 'Dark') return Theme.Dark.name;
    throw new Error(`Theme '${theme}' not supported`);
  },

  Light: {
    name: 'sys-light',
    define(monaco: t.Monaco.Monaco) {
      const bg = hex(Color.WHITE);
      monaco.editor.defineTheme(Theme.Light.name, {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          // Base:
          'editor.background': Color.WHITE,

          // Sticky-scroll tweaks:
          'editorStickyScroll.border': bg.darken(10),
          'editorStickyScroll.shadow': Color.TRANSPARENT,

          // Minimap divider (overview-ruler) tweaks:
          'scrollbar.shadow': Color.TRANSPARENT,
          'minimap.background': bg.darken(1),
        },
      });
    },
  },

  Dark: {
    name: 'sys-dark',
    define(monaco: t.Monaco.Monaco) {
      const colors = darkChromeColors(Color.DARK);
      monaco.editor.defineTheme(Theme.Dark.name, {
        base: 'vs-dark',
        inherit: true,
        rules: [...Token.rules],
        colors,
      });
    },
  },
} as const;

const foo: number = 123;

const bar = {
  msg: '👋',
  async join<T>(msg: string) {
    return `${msg} ${bar.msg}`;
  },
} as const;
