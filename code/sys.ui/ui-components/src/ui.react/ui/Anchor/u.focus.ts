import { FocusStyle, type t } from './common.ts';

const outline = FocusStyle.outline('--sys-anchor-focus');
const paint: t.FocusStyle.Paint = {
  ...outline.paint,
  settled: { ...outline.paint.settled, textDecoration: 'underline solid currentColor' },
};

/** Anchor adds only link decoration to the shared outline recipe. */
export function focusStyle(base: t.CssInput, style?: t.CssInput) {
  return FocusStyle.compose({ base: [outline.base, base], style, paint });
}
