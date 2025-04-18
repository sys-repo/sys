/**
 * @module
 */
import { type t, Color, Signal } from './common.ts';

type Color = string | number;
const DEFAULT_THEME: t.CommonTheme = 'Light';

/**
 * Helpers for working with common themes within the harness.
 */
export const Theme: t.DevThemeLib = {
  /**
   * Adjust the theme of the DevHarness.
   */
  background(ctx, theme, subjectLight, subjectDark) {
    const { host, subject } = ctx;
    const is = Color.theme(theme ?? DEFAULT_THEME).is;
    if (is.light) host.color(null).backgroundColor(null).tracelineColor(null);
    if (is.dark) host.color(Color.WHITE).backgroundColor(Color.DARK).tracelineColor(0.08);

    if (!!subjectLight || !!subjectDark) {
      if (!!subjectLight) subject.backgroundColor(is.light ? subjectLight : 0);
      if (!!subjectDark) subject.backgroundColor(is.dark ? subjectDark : 0);
    }

    return Color.theme(theme);
  },

  /**
   * Hook into a theme Signal and keep the DevHarness sycned with it.
   */
  signalEffect(ctx, theme, subjectLight, subjectDark) {
    Signal.effect(() => {
      Theme.background(ctx, theme.value, subjectLight, subjectDark);
      ctx.redraw();
    });
  },
};
