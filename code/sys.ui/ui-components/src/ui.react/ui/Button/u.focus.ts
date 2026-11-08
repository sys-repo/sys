import { FocusStyle, type t } from './common.ts';

const outline = FocusStyle.outline('--sys-button-focus');

/** Button selects the shared outline recipe, retaining its existing customization tokens. */
export function focusStyle(base: t.CssInput, input?: t.CssInput) {
  return FocusStyle.compose({ base: [outline.base, base], style: input, paint: outline.paint });
}
