import { Color, FocusStyle, type t } from './common.ts';

const paint: t.FocusStyle.Paint = {
  defaults: {
    '--sys-button-focus-accent': Color.BLUE,
    '--sys-button-focus-rest': Color.alpha(Color.BLUE, 0.2),
    '--sys-button-focus-width': '2px',
    '--sys-button-focus-offset': '2px',
  },
  arrival: { outlineColor: 'var(--sys-button-focus-accent)' },
  settled: {
    outline: 'var(--sys-button-focus-width) solid var(--sys-button-focus-rest)',
    outlineOffset: 'var(--sys-button-focus-offset)',
  },
  forcedColors: {
    outline: 'var(--sys-button-focus-width) solid Highlight',
    outlineOffset: 'var(--sys-button-focus-offset)',
  },
};

/** Button owns paint; FocusStyle owns final composition, arrival and preference policy. */
export function focusStyle(base: t.CssInput, input?: t.CssInput) {
  return FocusStyle.compose({ base, style: input, paint });
}
