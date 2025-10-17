import { type t, Color } from './common.ts';

export function edgeBorder(theme: t.ColorTheme) {
  return `solid 1px ${Color.alpha(theme.fg, 0.2)}`;
}
