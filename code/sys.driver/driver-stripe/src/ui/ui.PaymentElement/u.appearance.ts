import { type t, Color } from './common.ts';

/**
 * Maps the host/common theme to a Stripe Elements appearance theme.
 * Explicit Stripe appearance passed by callers remains authoritative.
 */
export const StripeAppearance = {
  fromTheme(theme?: t.CommonTheme): t.Appearance {
    if (theme !== 'Dark') return { theme: 'stripe' };

    const dark = Color.theme('Dark');
    return {
      theme: 'night',
      variables: {
        // Keep Stripe's "night" theme as the base, then tint the background toward the host shell.
        colorBackground: dark.bg,
        colorText: dark.fg,
        colorTextPlaceholder: Color.alpha(dark.fg, 0.5),
      },
    };
  },
} as const;
