import { FocusStyle, type t } from './common.ts';

const outline = FocusStyle.outline('--sys-anchor-focus');
const paint: t.FocusStyle.Paint = {
  ...outline.paint,
  defaults: { ...outline.paint.defaults, '--sys-anchor-focus-offset': '0px' },
  settled: { ...outline.paint.settled, textDecoration: 'underline solid currentColor' },
};

/** Keep the shared focus policy with a tight outline for inline text. */
export function focusStyle(base: t.CssInput, style?: t.CssInput) {
  return FocusStyle.compose({ base: [outline.base, base], style, paint });
}
