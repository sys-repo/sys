import { type t, Color } from './common.ts';

export function edgeBorder(theme: t.ColorTheme, enabled: boolean = true) {
  if (!enabled) return;
  return `solid 1px ${Color.alpha(theme.fg, 0.2)}`;
}
