import { Color, FocusStyle, Is, type t } from './common.ts';

/** Switch owns its themed halo; FocusStyle owns arrival, composition and preference policy. */
export function focusStyle(base: t.CssInput, theme: t.Switch.Theme.Root, style?: t.CssValue) {
  const color = theme.trackColor.on;
  const rest = Is.str(color) ? Color.alpha(color, 0.28) : Color.toGrayAlpha(color);

  // Avoid reparsing fractional alpha (which may use exponent notation); zero keeps black RGB.
  const opaque = Is.str(color) ? color : Color.toGrayAlpha(color > 0 ? 1 : -1);
  const accent = Color.alpha(opaque, 1);
  const paint: t.FocusStyle.Paint = {
    arrival: { boxShadow: `0 0 0 3px ${accent}` },
    settled: { outline: 'none', boxShadow: `0 0 0 3px ${rest}` },
    forcedColors: { outline: '3px solid Highlight', outlineOffset: '0px', boxShadow: 'none' },
  };
  return FocusStyle.compose({ base, style, paint });
}
