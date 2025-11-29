import { type t, Color } from './common.ts';

export const Theme = {
  init(monaco: t.Monaco.Monaco) {
    Theme.Light.define(monaco);
    Theme.Dark.define(monaco);
    Theme.Monokai.define(monaco);
  },

  toRegisteredName(theme: t.MonacoEditorTheme = 'Light') {
    if (theme === 'Light') return Theme.Light.name;
    if (theme === 'Dark') return Theme.Dark.name;
    if (theme === 'Monokai') return Theme.Monokai.name;
    throw new Error(`Theme '${theme}' not supported`);
  },

  toCommonTheme(input?: t.MonacoEditorTheme): t.CommonTheme {
    if (input === 'Monokai') return 'Dark';
    return input ?? 'Dark';
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
        rules: [],
        colors,
      });
    },
  },

  Monokai: {
    name: 'sys-monokai',
    define(monaco: t.Monaco.Monaco) {
      const base = Color.DARK;

      const colors: Record<string, string> = {
        ...darkChromeColors(base),

        // Monokai editor foreground + selection + guides:
        'editor.foreground': '#F8F8F2',
        'editorCursor.foreground': '#F8F8F0',
        'editor.selectionBackground': '#49483E',
        'editor.inactiveSelectionBackground': '#3E3D32',
        'editorIndentGuide.background': alpha(base, 0.35),
        'editorIndentGuide.activeBackground': alpha(base, 0.55),
      };

      monaco.editor.defineTheme(Theme.Monokai.name, {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: '', foreground: 'f8f8f2', background: '272822' },
          { token: 'comment', foreground: '75715e' },
          { token: 'string', foreground: 'e6db74' },
          { token: 'number', foreground: 'ae81ff' },
          { token: 'keyword', foreground: 'f92672' },
          { token: 'constant', foreground: '66d9ef' },
          { token: 'type', foreground: 'a6e22e' },

          { token: 'delimiter', foreground: 'f8f8f2' },
          { token: 'operator', foreground: 'f92672' },
          { token: 'variable', foreground: 'f8f8f2' },
          { token: 'variable.predefined', foreground: '66d9ef' },
          { token: 'invalid', background: 'f92672' },
        ],
        colors,
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

/**
 * Apply alpha to a base hex and return #RRGGBBAA.
 */
const alpha = (color: t.StringHex, a: number): t.StringHex => {
  return Color.toHex(Color.alpha(color, a));
};

const darkChromeColors = (base: t.StringHex): Record<string, string> => {
  const bg = hex(base);

  // Tonal ladder derived from the one base color.
  const surface0 = bg.base; // editor background
  const surface1 = bg.darken(1); // widgets / terminal
  const surface2 = bg.darken(2); // sidebars / panels / tabs
  const surface3 = bg.darken(3); // activity / status / minimap strip

  const borderSoft = bg.lighten(6);
  const borderStrong = bg.lighten(12);

  return {
    // Editor + widget surfaces:
    'editor.background': surface0,
    'editorWidget.background': surface1,

    // Focused line: subtle band + soft edge, both near the base tone.
    'editor.lineHighlightBackground': alpha(surface1, 0.95),
    'editor.lineHighlightBorder': alpha(borderSoft, 0.5),

    // Fold regions (slightly deeper wash).
    'editor.foldBackground': alpha(bg.darken(4), 0.5),

    // Input controls:
    'input.background': surface2,
    'input.foreground': '#D3D7E0',
    'input.border': alpha(borderSoft, 0.7),
    focusBorder: alpha(borderStrong, 0.9),
    'input.placeholderForeground': alpha(borderStrong, 0.6),

    // Layout chrome:
    'sideBar.background': surface2,
    'activityBar.background': surface3,
    'titleBar.activeBackground': surface2,

    // Status bar:
    'statusBar.background': surface3,
    'statusBar.foreground': '#D3D7E0',
    'statusBar.noFolderBackground': surface3,
    'statusBar.debuggingBackground': surface2,

    // Panels / aux views:
    'panel.background': surface2,
    'panelTitle.inactiveForeground': '#5F6471',
    'terminal.background': surface1,

    // Minimap: very close to base → low-contrast slab.
    'minimap.background': surface3,

    // Tab-bar:
    'tab.inactiveBackground': surface2,
    'editorGroupHeader.tabsBackground': surface2,

    // Tree-view:
    'list.activeSelectionBackground': '#009FE6',
    'list.activeSelectionForeground': '#FFFFFF',
    'list.inactiveSelectionBackground': '#009FE64D',
    'list.inactiveSelectionForeground': '#FFFFFF',
    'list.hoverBackground': '#00B2FF55',
    'list.hoverForeground': '#FFFFFF',

    // IntelliSense / suggest widget:
    'editorSuggestWidget.background': surface2,
    'editorSuggestWidget.border': alpha(borderSoft, 0.7),
    'editorSuggestWidget.foreground': '#D3D7E0',
    'editorSuggestWidget.selectedBackground': '#009FE6',
    'editorSuggestWidget.selectedForeground': '#FFFFFF',
    'editorSuggestWidget.highlightForeground': '#00B2FF',

    // Scrollbar slider (track + thumb) – shared by Dark + Monokai:
    'scrollbar.shadow': Color.TRANSPARENT,
    'scrollbarSlider.background': alpha(borderSoft, 0.35), // default
    'scrollbarSlider.hoverBackground': alpha(borderSoft, 0.55), // hover
    'scrollbarSlider.activeBackground': alpha(borderSoft, 0.85), // dragging

    // Sticky-scroll:
    'editorStickyScroll.border': borderStrong,
    'editorStickyScroll.shadow': Color.TRANSPARENT,
  };
};
