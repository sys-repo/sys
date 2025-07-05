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
      const bg = hex(Color.DARK);
      monaco.editor.defineTheme(Theme.Dark.name, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          // Base:
          'editor.background': Color.DARK,

          // Sticky-scroll tweaks:
          'editor.lineHighlightBorder': bg.lighten(4),
          'editorStickyScroll.border': bg.lighten(10),
          'editorStickyScroll.shadow': TRANSPARENT,

          // Minimap divider (overview-ruler) tweaks:
          'scrollbar.shadow': TRANSPARENT,
          'minimap.background': bg.darken(1),
        },
      });
    },
  },
} as const;

/**
 * Helpers:
 */
const hex = (base: string) => {
  const darken = (by: number) => Color.toHex(Color.darken(base, by));
  const lighten = (by: number) => Color.toHex(Color.lighten(base, by));
  return { base, darken, lighten } as const;
};
