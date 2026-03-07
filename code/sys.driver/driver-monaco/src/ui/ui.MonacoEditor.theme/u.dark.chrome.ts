import { type t, Color } from './common.ts';
import { hex, alpha } from './u.ts';

export function darkChromeColors(base: t.StringHex): Record<string, string> {
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
    'editor.lineHighlightBorder': bg.lighten(2),
    'editor.lineHighlightBackground': alpha(surface2, 0.3),
    'editor.foldBackground': alpha(surface2, 0.3),

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

    // Scrollbar slider (track + thumb):
    'scrollbar.background': surface3,
    'scrollbar.shadow': Color.TRANSPARENT,
    'scrollbarSlider.background': alpha(borderSoft, 0.35),
    'scrollbarSlider.hoverBackground': alpha(borderSoft, 0.55),
    'scrollbarSlider.activeBackground': alpha(borderSoft, 0.85),

    // Sticky-scroll:
    'editorStickyScroll.border': borderStrong,
    'editorStickyScroll.shadow': Color.TRANSPARENT,
  };
}
